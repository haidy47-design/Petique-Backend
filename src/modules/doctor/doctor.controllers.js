import User from "../../../database/models/user.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { roles, status } from "../../utils/constant/enums.js";
import cloudinary from "../../utils/fileUpload/cloudinary.js";
import { deleteCloud } from "../../utils/fileUpload/file-functions.js";
import {  hashedPass } from "../../utils/hash-compare.js";


// ==> get all doctors
export const getAllDoctors = catchAsyncError(async (req, res, next) => {
  const doctors = await User.find({
    role: roles.DOCTORS,
    status: { $ne: status.DELETED },
  }).select("userName email mobileNumber image doctorSpecialist");

  res.status(200).json({
    success: true,
    data: doctors,
  });
});
// ==> add new doctor
export const addNewDoctor = catchAsyncError(async (req, res, next) => {
  const { userName, email, password, mobileNumber, gender, doctorSpecialist  } = req.body;

  // ===> 1- Check existing doctor by email or phone
  const existing = await User.findOne({
    $or: [{ email }, { mobileNumber }],
  });
  if (existing) return next(new AppError("Doctor already exists", 409));

  // ===> 2- Hash password
  const hashedPassword = hashedPass({
    password,
    saltRounds: Number(process.env.SALT_ROUNDS),
  });

  // ===> 3- upload image if attached
  let imageData = null;

  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "PetsClinic/doctors" }
    );

    imageData = { secure_url, public_id };
  }

  // ===> 4- create doctor
  const doctor = await User.create({
    userName,
    email,
    password: hashedPassword,
    mobileNumber,
    gender,
    doctorSpecialist,
    image: imageData,
    role: roles.DOCTORS,
    status: status.VERIFIED,
    isVerified: true,
    passwordChangedAt: Date.now(),
  });

  doctor.password = undefined;

  res.status(201).json({
    message: "Doctor created successfully",
    success: true,
    data: doctor,
  });
});

// ==> soft delete doctor
export const softDeleteDoctor = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const doctor = await User.findOne({ _id: id, role: roles.DOCTORS });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  const softDeletedDoctor = await User.findByIdAndUpdate(
    id,
    { status: status.DELETED },
    { new: true }
  );

  if (!softDeletedDoctor)
    return next(new AppError("Failed to delete doctor", 500));

  softDeletedDoctor.password = undefined;

  res.status(200).json({
    success: true,
    message: "Doctor soft deleted successfully",
    data: softDeletedDoctor,
  });
});
// ==> hard delete doctor
export const deleteDoctor = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const doctor = await User.findOne({ _id: id, role: roles.DOCTORS });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  if (doctor.image?.public_id) {
    await deleteCloud(doctor.image.public_id);
  }

  const deleted = await User.deleteOne({ _id: id });
  if (!deleted) return next(new AppError("Failed to delete doctor", 500));

  res.status(200).json({
    success: true,
    message: "Doctor hard deleted successfully",
  });
});

// ==> update doctor profile (admin or doctor himself)
export const updateDoctor = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  let doctor = await User.findOne({ _id: id, role: roles.DOCTORS });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  const { userName, mobileNumber, gender, newPassword, confirmPassword } =
    req.body;

  // ===> Check phone number uniqueness
  if (mobileNumber && mobileNumber !== doctor.mobileNumber) {
    const exists = await User.findOne({
      mobileNumber,
      _id: { $ne: id },
    });
    if (exists) return next(new AppError("Mobile number already used", 409));
  }

  // ===> Update image if uploaded
  if (req.file) {
    if (doctor.image?.public_id) {
      await deleteCloud(doctor.image.public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "ITI-REACT/doctors" }
    );

    doctor.image = { secure_url, public_id };
  }

  // ===> Update password
  if (newPassword || confirmPassword) {
    if (!newPassword || !confirmPassword) {
      return next(new AppError("Both password fields required", 400));
    }
    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    doctor.password = hashedPass({
      password: newPassword,
      saltRounds: Number(process.env.SALT_ROUNDS),
    });

    doctor.passwordChangedAt = Date.now();
  }

  // ===> update other profile fields
  if (userName !== undefined) doctor.userName = userName;
  if (mobileNumber !== undefined) doctor.mobileNumber = mobileNumber;
  if (gender !== undefined) doctor.gender = gender;

  const updatedDoctor = await doctor.save();
  if (!updatedDoctor) return next(new AppError("Failed to update doctor", 500));

  updatedDoctor.password = undefined;

  res.status(200).json({
    success: true,
    message: "Doctor updated successfully",
    data: updatedDoctor,
  });
});
