import Vaccination from "../../../database/models/vaccination.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { ApiFeature } from "../../utils/file-feature.js";

//==> create vaccination
export const addVaccination = catchAsyncError(async (req, res, next) => {
  let { name, description, doses, categories } = req.body;

  name = name.toLowerCase();

  const exists = await Vaccination.findOne({ name });
  if (exists) return next(new AppError("Vaccination already exists", 409));

  const vaccination = await Vaccination.create({
    name,
    description,
    categories,
    doses,
    createdBy: req.authUser._id,
  });

  return res.status(201).json({
    success: true,
    message: "Vaccination added successfully",
    data: vaccination,
  });
});


//==> update vaccination
export const updateVaccination = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let { name, description, doses, categories } = req.body;

  const exists = await Vaccination.findById(id);
  if (!exists) return next(new AppError("Vaccination not found", 404));

  const nameExists = await Vaccination.findOne({ name, _id: { $ne: id } });
  if (nameExists) return next(new AppError("Name already exists", 409));

  if (name) exists.name = name.toLowerCase();
  if (description) exists.description = description;
  if (doses) exists.doses = doses;
  if (categories) exists.categories = categories;

  const updated = await exists.save();

  return res.status(200).json({
    success: true,
    message: "Vaccination updated successfully",
    data: updated,
  });
});

//==> get all
export const getVaccinations = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeature(
    Vaccination.find({ isDeleted: false })
      .populate("createdBy", "userName")
      .populate("categories", "name"),
    req.query
  )
    .filter()
    .search()
    .sort()
    .pagination()
    .select();

  const vaccinations = await apiFeature.mongooseQuery;

  res.status(200).json({
    success: true,
    results: vaccinations.length,
    data: vaccinations,
  });
});


//==> get specific
export const getVaccination = catchAsyncError(async (req, res, next) => {
  const vaccination = await Vaccination.findById(req.params.id).populate(
    "createdBy",
    "userName"
  );

  if (!vaccination) return next(new AppError("Vaccination not found", 404));

  res.status(200).json({ success: true, data: vaccination });
});

//==> hard Delete
export const deleteVaccination = catchAsyncError(async (req, res, next) => {
  const vac = await Vaccination.findByIdAndDelete(req.params.id);

  if (!vac) return next(new AppError("Vaccination not found", 404));

  res.status(200).json({ success: true, message: "Deleted successfully" });
});

//==> soft delete
export const softDeleteVaccination = catchAsyncError(async (req, res, next) => {
  const vac = await Vaccination.findById(req.params.id);

  if (!vac) return next(new AppError("Vaccination not found", 404));
  if (vac.isDeleted) return next(new AppError("Already deleted", 400));

  vac.isDeleted = true;
  vac.deletedBy = req.authUser._id;
  vac.deletedAt = new Date();

  await vac.save();

  res.status(200).json({
    success: true,
    message: "Soft deleted successfully",
    data: vac,
  });
});
