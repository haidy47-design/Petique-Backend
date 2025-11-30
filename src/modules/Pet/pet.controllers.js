import Pet from "../../../database/models/pet.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import cloudinary from "../../utils/fileUpload/cloudinary.js";
import { deleteCloud } from "../../utils/fileUpload/file-functions.js";

// ===> Add a new Pet
export const addPet = catchAsyncError(async (req, res, next) => {
  const { name, age, weight, allergies = [], vaccinationHistory = [], category } = req.body;

  if (!category) return next(new AppError("Category is required", 400));

  let petImage = {
    secure_url: process.env.ANIMAL_SECURE,
    public_id: process.env.ANIMAL_ID,
  };

  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: "PetsClinic/Pets",
    });
    petImage = { secure_url, public_id };
  }

  const newPet = new Pet({
    petOwner: req.authUser._id,
    category,
    name,
    age,
    weight,
    allergies,
    vaccinationHistory,
    image: petImage,
  });

  const createdPet = await newPet.save();

  res.status(201).json({
    success: true,
    message: "Pet added successfully",
    data: createdPet,
  });
});


// ===> Update Pet
export const updatePet = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const pet = await Pet.findById(id);
  if (!pet) return next(new AppError("Pet not found", 404));

  if (pet.petOwner.toString() !== req.authUser._id.toString() && req.authUser.role !== "admin") {
    return next(new AppError("You are not authorized to update this pet", 403));
  }

  const updatableFields = ["name", "age", "weight", "allergies", "vaccinationHistory"];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) pet[field] = req.body[field];
  });

  if (req.file) {
    if (pet.image?.public_id) await deleteCloud(pet.image.public_id);
    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
      folder: "PetsClinic/Pets",
    });
    pet.image = { secure_url, public_id };
  }

  pet.updatedBy = req.authUser._id;
  const updatedPet = await pet.save();

  res.status(200).json({
    success: true,
    message: "Pet updated successfully",
    data: updatedPet,
  });
});

// ===> Get all Pets
export const getAllPets = catchAsyncError(async (req, res, next) => {
  const pets = await Pet.find({ isDeleted: false }).populate("petOwner", "userName email");
  res.status(200).json({ success: true, data: pets });
});

// ===> Get a specific Pet
export const getPetById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const pet = await Pet.findById(id)
    .populate("petOwner", "userName email")
    .populate("category", "name")
    .populate("vaccinationHistory.vaccine", "name categories");

  if (!pet) return next(new AppError("Pet not found", 404));

  res.status(200).json({ success: true, data: pet });
});


// ===> Soft Delete Pet
export const softDeletePet = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const pet = await Pet.findById(id);
  if (!pet) return next(new AppError("Pet not found", 404));

  if (pet.petOwner.toString() !== req.authUser._id.toString() && req.authUser.role !== "admin") {
    return next(new AppError("You are not authorized to delete this pet", 403));
  }

  if (pet.isDeleted) return next(new AppError("Pet already deleted", 400));

  pet.isDeleted = true;
  pet.deletedBy = req.authUser._id;
  pet.deletedAt = new Date();
  await pet.save();

  res.status(200).json({ success: true, message: "Pet deleted successfully", data: pet });
});

// ===> Hard Delete Pet
export const deletePet = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const pet = await Pet.findById(id);
  if (!pet) return next(new AppError("Pet not found", 404));

  if (pet.petOwner.toString() !== req.authUser._id.toString() && req.authUser.role !== "admin") {
    return next(new AppError("You are not authorized to delete this pet", 403));
  }

  if (pet.image?.public_id) await deleteCloud(pet.image.public_id);
  await Pet.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Pet deleted permanently" });
});
