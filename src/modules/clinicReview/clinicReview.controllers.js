import User from "../../../database/models/user.model.js";
import Service from "../../../database/models/service.model.js";
import Reservation from "../../../database/models/reservation.model.js";

import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { roles } from "../../utils/constant/enums.js";
import { recalcAvgRating } from "../../utils/review.helper.js";
import clinicReviewModel from "../../../database/models/clinicReview.model.js";
import { sendCustomEmail } from "../../utils/emails/email.js";

// ===> add review
export const addClinicReview = catchAsyncError(async (req, res, next) => {
  const { comment, rate, doctor, service, reservation, clinic } = req.body;

  if (!doctor && !service && !reservation && !clinic)
    return next(
      new AppError("You must review doctor or service or reservation or clinic", 400)
    );

  if (doctor) {
    const docExists = await User.findById(doctor);
    if (!docExists) return next(new AppError("Doctor not found", 404));
  }

  if (service) {
    const serviceExists = await Service.findById(service);
    if (!serviceExists) return next(new AppError("Service not found", 404));
  }

  if (reservation) {
    const reservationExist = await Reservation.findById(reservation);
    if (!reservationExist)
      return next(new AppError("Reservation not found", 404));
  }

  const reviewExist = await clinicReviewModel.findOne({
    user: req.authUser._id,
    doctor,
    service,
    reservation,
  });

  if (reviewExist) {
    reviewExist.comment = comment;
    reviewExist.rate = rate;
    await reviewExist.save();
  } else {
     await clinicReviewModel.create({
      comment,
      rate,
      doctor,
      service,
      reservation,
      user: req.authUser._id,
    });
  }

  await recalcAvgRating({ doctor, service });

  res.status(201).json({
    success: true,
    message: reviewExist ? "Review updated" : "Review added",
    data: reviewExist,
  });
});

// ===> get user review
export const getUserClinicReviews = catchAsyncError(async (req, res, next) => {
  const reviews = await clinicReviewModel
    .find({
      user: req.authUser._id,
      isDeleted: { $ne: true },
    })
    .populate("doctor", "userName")
    .populate("service", "title price")
    .populate("reservation", "date timeSlot");

  res.status(200).json({ success: true, data: reviews });
});

// ===> get reviews for service and doctor
export const getClinicReviewsForTarget = catchAsyncError(
  async (req, res, next) => {
    const { targetType, targetId } = req.params;

    const filter = { isDeleted: { $ne: true } };

    if (targetType === "doctor") filter.doctor = targetId;
    else if (targetType === "service") filter.service = targetId;
    else if (targetType === "reservation") filter.reservation = targetId;
    else if (targetType === "clinic") filter.clinic = "PetiqueClinic";
    else return next(new AppError("Invalid target type.", 400));

    const reviews = await clinicReviewModel
      .find(filter)
      .populate("user", "userName email");

    res.status(200).json({ success: true, data: reviews });
  }
);

// ===> delete review
export const deleteClinicReview = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const review = await clinicReviewModel.findById(id);

  if (!review) return next(new AppError("Review not found", 404));

  if (
    req.authUser._id.toString() !== review.user.toString() &&
    req.authUser.role !== roles.ADMIN
  )
    return next(new AppError("Not authorized", 403));

  await clinicReviewModel.findByIdAndDelete(id);

  await recalcAvgRating({
    doctor: review.doctor,
    service: review.service,
  });

  res.status(200).json({ success: true, message: "Review deleted" });
});

//====> soft delete review
export const softDeleteClinicReview = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    const review = await clinicReviewModel.findById(id);
    if (!review) return next(new AppError("Review not found", 404));

    review.isDeleted = true;
    review.deletedAt = new Date();
    await review.save();

    await recalcAvgRating({
      doctor: review.doctor,
      service: review.service,
    });

    res.status(200).json({ success: true, message: "Review soft deleted" });
  }
);

// ===> get specific clinic review
export const getClinicReviewById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const review = await clinicReviewModel
    .findById(id)
    .populate("user", "userName email mobileNumber")
    .populate("doctor", "userName email mobileNumber")
    .populate("service", "title price")
    .populate("reservation", "date timeSlot");

  if (!review || review.isDeleted)
    return next(new AppError("Review not found", 404));

  res.status(200).json({
    success: true,
    data: review,
  });
});

//====> all reviews
export const getAllClinicReviews = catchAsyncError(async (req, res, next) => {
  const reviews = await clinicReviewModel
    .find({ isDeleted: { $ne: true } })
    .populate("user", "userName email")
    .populate("doctor", "userName")
    .populate("service", "title");

  res.status(200).json({
    success: true,
    results: reviews.length,
    data: reviews,
  });
});

//====> admin: get Clinic Reviews With Contacts
export const getClinicReviewsWithContacts = catchAsyncError(
  async (req, res, next) => {
    const reviews = await clinicReviewModel
      .find({
        isDeleted: { $ne: true },
      })
      .populate("user", "userName email mobileNumber")
      .populate("doctor", "userName")
      .populate("service", "title");

    res.status(200).json({ success: true, data: reviews });
  }
);

// ===> contact user via Email
export const contactClinicReviewUser = catchAsyncError(
  async (req, res, next) => {
    const { reviewId } = req.params;
    const { subject, message } = req.body;

    if (req.authUser.role !== roles.ADMIN)
      return next(new AppError("Not allowed", 403));

    const review = await clinicReviewModel
      .findById(reviewId)
      .populate("user", "userName email mobileNumber");

    if (!review) return next(new AppError("Review not found", 404));

    const { userName, email, mobileNumber } = review.user;

    // === Send Email ===
    if (email) {
      await sendCustomEmail({
        to: email,
        subject: subject || "Regarding your Clinic Review",
        text:
          message ||
          `Hello ${userName}, we are contacting you regarding your review.`,
        reviewerName: userName,
      });
    }
    res.status(200).json({
      success: true,
      message: "User contacted successfully via email",
    });
  }
);

// ===> generate WhatsApp chat link for clinic review user
export const contactClinicReviewUserWhatsApp = catchAsyncError(
  async (req, res, next) => {
    const { reviewId } = req.params;

    if (req.authUser.role !== roles.ADMIN)
      return next(new AppError("Not allowed", 403));

    const review = await clinicReviewModel
      .findById(reviewId)
      .populate("user", "userName mobileNumber");

    if (!review) return next(new AppError("Review not found", 404));
    if (!review.user.mobileNumber)
      return next(new AppError("User does not have a mobile number", 404));

    const formatEgyptianNumber = (number) => {
      let cleanedNumber = number.replace(/\D/g, "");
      if (cleanedNumber.startsWith("0"))
        cleanedNumber = cleanedNumber.substring(1);
      if (!cleanedNumber.startsWith("20")) cleanedNumber = "20" + cleanedNumber;
      return cleanedNumber;
    };

    const receiverPhone = formatEgyptianNumber(review.user.mobileNumber);

    const message = encodeURIComponent(
      `Hello ${review.user.userName}! We are contacting you regarding your clinic review.`
    );

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${receiverPhone}&text=${message}`;

    res.status(200).json({
      success: true,
      message: "WhatsApp chat link generated successfully",
      chatDetails: {
        receiver: {
          userId: review.user._id,
          mobileNumber: receiverPhone,
        },
        whatsappUrl,
      },
    });
  }
);
