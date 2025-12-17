import Discount from "../../../database/models/discount.model.js";
import Product from "../../../database/models/product.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";

//===> create discount
export const createDiscount = catchAsyncError(async (req, res, next) => {
  const discount = await Discount.create({
    ...req.body,
    createdBy: req.authUser._id,
  });

  res.status(201).json({
    success: true,
    message: "Discount created successfully",
    data: discount,
  });
});

//==> get all discounts
export const getDiscounts = catchAsyncError(async (req, res) => {
  const discounts = await Discount.find({ isDeleted: false })
    .populate("products", "title price")
    .populate("categories", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    results: discounts.length,
    data: discounts,
  });
});

//===> get active discounts
export const getActiveDiscounts = catchAsyncError(async (req, res) => {
  const now = new Date();

  const discounts = await Discount.find({
    isDeleted: false,
    isActive: true,
    $or: [
      { fromDate: { $lte: now }, expire: { $gte: now } },
      { fromDate: null, expire: null },
    ],
  });

  res.status(200).json({
    success: true,
    data: discounts,
  });
});

//==> update discount
export const updateDiscount = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const discount = await Discount.findById(id);
  if (!discount || discount.isDeleted)
    return next(new AppError("Discount not found", 404));

  Object.keys(req.body).forEach((key) => {
    discount[key] = req.body[key];
  });

  await discount.save();

  res.status(200).json({
    success: true,
    message: "Discount updated successfully",
    data: discount,
  });
});


//===> toggle discount on/off
export const toggleDiscount = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const discount = await Discount.findById(id);
  if (!discount || discount.isDeleted)
    return next(new AppError("Discount not found", 404));

  discount.isActive = !discount.isActive;
  await discount.save();

  res.status(200).json({
    success: true,
    message: `Discount ${
      discount.isActive ? "activated" : "deactivated"
    } successfully`,
    data: discount,
  });
});

// ===> soft delete
export const softDeleteDiscount = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const discount = await Discount.findById(id);
  if (!discount)
    return next(new AppError("Discount not found", 404));

  if (discount.isDeleted)
    return next(new AppError("Discount already deleted", 400));

  discount.isDeleted = true;
  discount.isActive = false;
  discount.deletedAt = new Date();
  await discount.save();

  res.status(200).json({
    success: true,
    message: "Discount deleted successfully",
    data: discount,
  });
});

export const getProductsForDiscounts = catchAsyncError(async (req, res) => {
  const products = await Product.find({ isDeleted: false });

  const discounts = await AutomaticDiscount.find({ isActive: true });

  const data = products.map((p) => {
    const discountedPrice = applyDiscounts({
      product: p,
      discounts,
      user: req.authUser,
    });

    return {
      ...p.toObject(),
      discountedPrice,
      hasDiscount: discountedPrice < p.finalPrice,
    };
  });

  res.json({ success: true, data });
});

