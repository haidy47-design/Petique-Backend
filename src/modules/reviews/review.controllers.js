import Product from "../../../database/models/product.model.js";
import Review from "../../../database/models/review.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { roles } from "../../utils/constant/enums.js";
import { messages } from "../../utils/constant/messages.js";
import { sendCustomEmail } from "../../utils/emails/email.js";
import { ApiFeature } from "../../utils/file-feature.js";

//===> adding review
export const addReview = catchAsyncError(async (req, res, next) => {
  const { comment, rate, product } = req.body;

  const productExist = await Product.findById(product);
  if (!productExist) return next(new AppError(messages.product.notFound, 404));
  const reviewExist = await Review.findOneAndUpdate(
    { user: req.authUser._id, product: product },
    { comment, rate },
    { new: true }
  );
  // let avgRating = 0;
  if (!reviewExist) {
    const review = new Review({
      comment,
      rate,
      product,
      user: req.authUser._id,
    });

    const createdReview = await review.save();
    if (!createdReview)
      return next(new AppError(messages.review.failToCreate, 500));
  }
  const rating = await Review.find({ product }).select("rate");
  let avgRating = rating.reduce((accumulator, current) => {
    return accumulator + current.rate;
  }, 0);
  avgRating = avgRating / rating.length;
  await Product.findOneAndUpdate(
    { _id: product },
    {
      rate: avgRating,
    },
    { new: true }
  );

  res.status(201).json({
    message: reviewExist
      ? messages.review.updatedSuccessfully
      : messages.review.createdSuccessfully,
    success: true,
    data: { avgRating, rate },
  });
});

//===> get all user reviews
export const getUserReviews = catchAsyncError(async (req, res, next) => {
  const reviews = await Review.find({ user: req.authUser._id }).populate(
    "product",
    "title price discount"
  );
  res.status(200).json({ success: true, data: reviews });
});

//===> get all product reviews
export const getProductReviews = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;
  const productExist = await Product.findById(productId);
  if (!productExist) return next(new AppError(messages.product.notFound, 404));

  const reviews = await Review.find({ product: productId })
    .populate("user", "userName")
    .populate({
      path: "product",
      select: "title",
      options: { lean: true },
    });

  res.status(200).json({ success: true, data: reviews });
});

//===> get single review
export const getReviewById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const review = await Review.findById(id).populate("user", "userName");
  if (!review) return next(new AppError(messages.review.notFound, 404));
  res.status(200).json({ success: true, data: review });
});

//===> delete review and recalculate avgRate
export const deleteReview = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const reviewExist = await Review.findById(id);
  if (!reviewExist) return next(new AppError(messages.review.notFound, 404));
  if (
    req.authUser._id.toString() != reviewExist.user.toString() &&
    req.authUser.role != roles.ADMIN
  ) {
    return next(new AppError(messages.user.notAllowed, 401));
  }
  const productId = reviewExist.product;
  await Review.deleteOne({ _id: id });
  // delete the rate from avg
  const ratings = await Review.find({ product: productId }).select("rate");
  let avgRating =
    ratings.length > 0
      ? ratings.reduce(
          (accumulator, current) => accumulator + current.rate,
          0
        ) / ratings.length
      : 0;
  await Product.findByIdAndUpdate(
    productId,
    { rate: avgRating },
    { new: true }
  );

  res
    .status(200)
    .json({ message: messages.review.deletedSuccessfully, success: true });
});

//===> update review
export const updateReview = catchAsyncError(async (req, res, next) => {
  const { comment, rate, product } = req.body;
  const productExist = await Product.findById(product);
  if (!productExist) return next(new AppError(messages.product.notFound, 404));
  const reviewExist = await Review.findOneAndUpdate(
    { user: req.authUser._id, product: product },
    { comment, rate },
    { new: true }
  );
  const rating = await Review.find({ product }).select("rate");
  let avgRating = rating.reduce((accumulator, current) => {
    return accumulator + current.rate;
  }, 0);
  avgRating = avgRating / rating.length;
  await Product.findOneAndUpdate(
    { _id: product },
    {
      rate: avgRating,
    },
    { new: true }
  );
  res.status(201).json({
    message: messages.review.updatedSuccessfully,
    success: true,
    data: { avgRating, rate },
  });
});

export const getAllReviews = catchAsyncError(async (req, res, next) => {
  const baseQuery = Review.find({ isDeleted: { $ne: true } })
    .populate({
      path: "user",
      select: ["firstName", "lastName", "email"],
    })
    .populate({
      path: "product",
      select: ["title", "price", "finalPrice"],
    });

  const apiFeature = new ApiFeature(baseQuery, req.query)
    .filter()
    .search()
    .pagination()
    .sort();

  const reviews = await apiFeature.mongooseQuery;

  const totalDocuments = await Review.countDocuments({
    isDeleted: { $ne: true },
  });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.size) || 100;
  const numberOfPages = Math.ceil(totalDocuments / limit);

  return res.status(200).json({
    success: true,
    message: messages.SUCCESS,
    results: reviews.length,
    metadata: {
      currentPage: page,
      numberOfPages,
      limit,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < numberOfPages ? page + 1 : null,
    },
    data: reviews,
  });
});

//===> soft delete review and recalculate avgRate
export const softDeleteReview = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const reviewExist = await Review.findById(id);
  if (!reviewExist) return next(new AppError(messages.review.notFound, 404));

  if (
    req.authUser._id.toString() !== reviewExist.user.toString() &&
    req.authUser.role !== roles.ADMIN
  ) {
    return next(new AppError(messages.user.notAllowed, 401));
  }

  reviewExist.isDeleted = true;
  await reviewExist.save();

  const productId = reviewExist.product;
  const ratings = await Review.find({
    product: productId,
    isDeleted: { $ne: true },
  }).select("rate");

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.rate, 0) / ratings.length
      : 0;

  await Product.findByIdAndUpdate(
    productId,
    { rate: avgRating },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message:
      messages.review.deletedSuccessfully || "Review soft deleted successfully",
  });
});
//====> admin: get product reviews with contact info 
export const getProductReviewsWithContacts = catchAsyncError(
  async (req, res, next) => {
    const { productId } = req.params;

    const productExist = await Product.findById(productId);
    if (!productExist)
      return next(new AppError(messages.product.notFound, 404));

    const reviews = await Review.find({
      product: productId,
      isDeleted: { $ne: true },
    })
      .populate("user", "userName email mobileNumber")
      .populate("product", "title");

    res.status(200).json({
      success: true,
      message: messages.SUCCESS,
      data: reviews,
    });
  }
);

//===> admin: contact review user by email 
export const contactReviewUser = catchAsyncError(async (req, res, next) => {
  const { reviewId } = req.params;
  const { subject, message } = req.body;

  if (req.authUser.role !== roles.ADMIN)
    return next(new AppError(messages.user.notAllowed, 403));

  const review = await Review.findById(reviewId).populate(
    "user",
    "userName email mobileNumber"
  );

  if (!review) return next(new AppError(messages.review.notFound, 404));

  const userEmail = review.user.email;
  if (!userEmail)
    return next(new AppError("This user has no email registered", 400));

  const emailSubject = subject || "Regarding your product review";
  const emailMessage =
    message || "Dear user, we wanted to contact you about your review.";

  await sendCustomEmail({
    to: userEmail,
    subject: emailSubject,
    text: emailMessage,
  });

  res.status(200).json({
    success: true,
    message: `Email sent successfully to ${userEmail}`,
  });
});
