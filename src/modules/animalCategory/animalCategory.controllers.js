import AnimalCategory from "../../../database/models/animalCategory.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { ApiFeature } from "../../utils/file-feature.js";

//===> add new animal category
export const addCategory = catchAsyncError(async (req, res, next) => {
  let { name, description } = req.body;

  name = name.toLowerCase();

  const exists = await AnimalCategory.findOne({ name });
  if (exists) return next(new AppError("Category already exists", 409));

  const category = await AnimalCategory.create({
    name,
    description,
  });

  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

//===> update categories
export const updateCategory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let { name, description } = req.body;

  const category = await AnimalCategory.findById(id);
  if (!category) return next(new AppError("Category not found", 404));

  if (name) {
    name = name.toLowerCase();
    const exists = await AnimalCategory.findOne({
      name,
      _id: { $ne: id },
    });

    if (exists) return next(new AppError("Name already exists", 409));
    category.name = name;
  }

  if (description) category.description = description;

  const updated = await category.save();

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: updated,
  });
});

//===> get all categories
export const getAllCategories = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeature(
    AnimalCategory.find({ isDeleted: false }),
    req.query
  )
    .filter()
    .search()
    .sort()
    .pagination()
    .select();

  const categories = await apiFeature.mongooseQuery;

  res.status(200).json({
    success: true,
    results: categories.length,
    data: categories,
  });
});

//===> get all animal categories
export const getCategory = catchAsyncError(async (req, res, next) => {
  const category = await AnimalCategory.findById(req.params.id);

  if (!category) return next(new AppError("Category not found", 404));

  res.status(200).json({ success: true, data: category });
});

//===> soft delete animal category
export const softDeleteCategory = catchAsyncError(async (req, res, next) => {
  const category = await AnimalCategory.findById(req.params.id);

  if (!category) return next(new AppError("Category not found", 404));
  if (category.isDeleted) return next(new AppError("Already deleted", 400));

  category.isDeleted = true;
  category.deletedBy = req.authUser._id;
  category.deletedAt = new Date();

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category soft deleted successfully",
    data: category,
  });
});

//===> delete animal category
export const deleteCategory = catchAsyncError(async (req, res, next) => {
  const category = await AnimalCategory.findById(req.params.id);

  if (!category) return next(new AppError("Category not found", 404));

  await AnimalCategory.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Category deleted permanently",
  });
});
