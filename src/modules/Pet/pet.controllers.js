import mongoose from "mongoose";
import Pet from "../../../database/models/pet.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import cloudinary from "../../utils/fileUpload/cloudinary.js";
import { deleteCloud } from "../../utils/fileUpload/file-functions.js";

// ===> Add a new Pet
export const addPet = catchAsyncError(async (req, res, next) => {
  const {
    name,
    age,
    weight,
    allergies = [],
    vaccinationHistory = [],
    category,
  } = req.body;

  if (!category) return next(new AppError("Category is required", 400));

  let petImage = {
    secure_url: process.env.ANIMAL_SECURE,
    public_id: process.env.ANIMAL_ID,
  };

  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "PetsClinic/Pets",
      }
    );
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

  if (
    pet.petOwner.toString() !== req.authUser._id.toString() &&
    req.authUser.role !== "admin"
  ) {
    return next(new AppError("You are not authorized to update this pet", 403));
  }

  const updatableFields = [
    "name",
    "age",
    "weight",
    "allergies",
    "vaccinationHistory",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) pet[field] = req.body[field];
  });

  if (req.file) {
    if (pet.image?.public_id) await deleteCloud(pet.image.public_id);
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "PetsClinic/Pets",
      }
    );
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
  const pets = await Pet.find({ isDeleted: false })
    .populate("petOwner", "userName email")
    .populate("category", "name")
    .populate("vaccinationHistory.vaccine", "name categories");
  res.status(200).json({ success: true, data: pets });
});

// ===> Get a specific Pet
export const getPetById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid pet ID format", 400));
  }
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

  if (
    pet.petOwner.toString() !== req.authUser._id.toString() &&
    req.authUser.role !== "admin"
  ) {
    return next(new AppError("You are not authorized to delete this pet", 403));
  }

  if (pet.isDeleted) return next(new AppError("Pet already deleted", 400));

  pet.isDeleted = true;
  pet.deletedBy = req.authUser._id;
  pet.deletedAt = new Date();
  await pet.save();

  res
    .status(200)
    .json({ success: true, message: "Pet deleted successfully", data: pet });
});

// ===> Hard Delete Pet
export const deletePet = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const pet = await Pet.findById(id);
  if (!pet) return next(new AppError("Pet not found", 404));

  if (
    pet.petOwner.toString() !== req.authUser._id.toString() &&
    req.authUser.role !== "admin"
  ) {
    return next(new AppError("You are not authorized to delete this pet", 403));
  }

  if (pet.image?.public_id) await deleteCloud(pet.image.public_id);
  await Pet.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Pet deleted permanently" });
});

// ===> get logged-in user pets
export const getUserPets = catchAsyncError(async (req, res, next) => {
  const userId = req.authUser._id;

  const pets = await Pet.find({
    petOwner: userId,
    isDeleted: false,
  })
    .populate("petOwner", "userName email")
    .populate("category", "name")
    .populate("vaccinationHistory.vaccine", "name categories");

  res.status(200).json({
    success: true,
    message: "User pets retrieved successfully",
    results: pets.length,
    data: pets,
  });
});

// ===> count animals for each category
export const countPetsPerCategory = catchAsyncError(async (req, res, next) => {
  const result = await Pet.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: "$category",
        totalPets: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "animalcategories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        categoryId: "$category._id",
        categoryName: "$category.name",
        totalPets: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "Pets count per category",
    data: result,
  });
});

// ===> Add vaccination to a pet
export const addVaccinationToPet = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { vaccine, doseNumber, date, nextDose, status } = req.body;

  const pet = await Pet.findById(id);
  if (!pet) return next(new AppError("Pet not found", 404));

  // if (
  //   pet.petOwner.toString() !== req.authUser._id.toString() &&
  //   req.authUser.role !== "admin"
  // ) {
  //   return next(new AppError("Not authorized to update this pet", 403));
  // }

  const newVaccination = {
    vaccine,
    doseNumber,
    date,
    nextDose,
    status,
  };

  pet.vaccinationHistory.push(newVaccination);

  const updatedPet = await pet.save();

  res.status(200).json({
    success: true,
    message: "Vaccination added successfully",
    data: updatedPet,
  });
});

// ===> to get vaccination for pets
export const getVaccinationRecords = catchAsyncError(async (req, res, next) => {
  const pets = await Pet.find({ isDeleted: false })
    .populate("vaccinationHistory.vaccine", "name")
    .populate("category", "name")
    .select("name image vaccinationHistory category");

  const records = [];

  pets.forEach((pet) => {
    pet.vaccinationHistory.forEach((history) => {
      records.push({
        petId: pet._id,
        petName: pet.name,
        category: pet.category?.name,
        petImage: pet.image?.secure_url,
        vaccineName: history.vaccine?.name,
        doseNumber: history.doseNumber,
        date: history.date,
        nextDose: history.nextDose,
        status: history.status,
      });
    });
  });

  res.status(200).json({
    success: true,
    count: records.length,
    data: records,
  });
});

// ===> get all vaccination records for a specific pet
export const getPetVaccinations = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  // ===> find the pet + populate vaccine data
  const pet = await Pet.findById(id)
    .select("name image vaccinationHistory")
    .populate({
      path: "vaccinationHistory.vaccine",
      select: "name categories doses",
      populate: {
        path: "categories",
        select: "name",
      },
    });

  if (!pet) return next(new AppError("Pet not found", 404));

  // ===> If pet exists but no vaccination records
  if (!pet.vaccinationHistory || pet.vaccinationHistory.length === 0) {
    return res.status(200).json({
      success: true,
      message: "This pet has no vaccination records",
      data: [],
    });
  }

  // ===> format output
  const records = pet.vaccinationHistory.map((v) => ({
    vaccineId: v.vaccine?._id,
    vaccineName: v.vaccine?.name,
    categories: v.vaccine?.categories?.map((c) => c.name),
    doses: v.vaccine?.doses,
    doseNumber: v.doseNumber,
    date: v.date,
    nextDose: v.nextDose,
    status: v.status,
  }));

  res.status(200).json({
    success: true,
    message: "Pet vaccination records retrieved successfully",
    petName: pet.name,
    petImage: pet.image?.secure_url,
    count: records.length,
    data: records,
  });
});
