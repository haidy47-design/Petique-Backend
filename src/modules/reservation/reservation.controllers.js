import Reservation from "../../../database/models/reservation.model.js";
import Pet from "../../../database/models/pet.model.js";
import User from "../../../database/models/user.model.js";
import Service from "../../../database/models/service.model.js";

import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { ApiFeature } from "../../utils/file-feature.js";
import { roles } from "../../utils/constant/enums.js";

export const createReservation = catchAsyncError(async (req, res, next) => {
  const { pet, service, doctor, date, timeSlot, notes } = req.body;

  // ===> 1) validate pet exists & belongs to logged-in user
  const petExist = await Pet.findOne({
    _id: pet,
    petOwner: req.authUser._id,
    isDeleted: false,
  });

  if (!petExist)
    return next(new AppError("Pet not found or does not belong to you", 404));

  // ===> 2) Validate service exists
  const serviceExist = await Service.findOne({
    _id: service,
    isDeleted: false,
  });

  if (!serviceExist) return next(new AppError("Service not found", 404));

  // ===> 3) If doctor is selected → ensure doctor exists AND role is DOCTOR
  let doctorData = null;

  if (doctor) {
    doctorData = await User.findOne({
      _id: doctor,
      role: roles.DOCTORS,
      isActive: true,
    });

    if (!doctorData)
      return next(new AppError("Doctor not found or not verified", 404));
  }

  // ===> 4) Create reservation
  const reservation = await Reservation.create({
    petOwner: req.authUser._id,
    pet,
    service,
    serviceName: serviceExist.title,
    doctor: doctor || null,
    date,
    timeSlot,
    notes,
  });

  // ===> 5) populate everything for final response
  const result = await Reservation.findById(reservation._id)
    .populate("pet")
    .populate("petOwner", "userName email mobileNumber")
    .populate("doctor", "userName email mobileNumber role")
    .populate("service");

  res.status(201).json({
    success: true,
    message: "Reservation created successfully",
    data: result,
  });
});

//===> update reservation
export const updateReservation = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const reservation = await Reservation.findById(id);
  if (!reservation) return next(new AppError("Reservation not found", 404));

  const { pet, service, doctor, date, timeSlot, notes, status } = req.body;

  if (pet) {
    const petExist = await Pet.findById(pet);
    if (!petExist) return next(new AppError("Pet not found", 404));
    reservation.pet = pet;
  }

  if (service) {
    const serviceExist = await Service.findById(service);
    if (!serviceExist) return next(new AppError("Service not found", 404));
    reservation.service = service;
    reservation.serviceName = serviceExist.name;
  }

  if (doctor) {
    const doctorExist = await User.findById(doctor);
    if (!doctorExist) return next(new AppError("Doctor not found", 404));
    reservation.doctor = doctor;
  }

  if (date) reservation.date = date;
  if (timeSlot) reservation.timeSlot = timeSlot;
  if (notes) reservation.notes = notes;
  if (status) reservation.status = status;

  const updated = await reservation.save();
  if (!updated) return next(new AppError("Failed to update reservation", 500));

  res.status(200).json({
    success: true,
    message: "Reservation updated successfully",
    data: updated,
  });
});

//===> get all reservations
export const getReservations = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeature(
    Reservation.find({ isDeleted: { $ne: true } })
      .populate("petOwner", ["userName", "email", "mobileNumber"])
      .populate("pet", ["name", "age", "type"])
      .populate("service", ["name", "price"])
      .populate("doctor", ["userName", "email"]),
    req.query
  )
    .filter()
    .search()
    .pagination()
    .sort()
    .select();

  const reservations = await apiFeature.mongooseQuery;
  const total = await Reservation.countDocuments({ isDeleted: { $ne: true } });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.size) || 10;
  const numberOfPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    results: reservations.length,
    metadata: {
      currentPage: page,
      numberOfPages,
      limit,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < numberOfPages ? page + 1 : null,
    },
    data: reservations,
  });
});

//===> get reservation by id
export const getSpecificReservation = catchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate("petOwner", ["userName", "email"])
      .populate("pet", ["name", "type"])
      .populate("service", ["name", "price"])
      .populate("doctor", ["userName", "email"]);

    if (!reservation) return next(new AppError("Reservation not found", 404));

    res.status(200).json({
      success: true,
      data: reservation,
    });
  }
);

//==> soft delete
export const softDeleteReservation = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const reservation = await Reservation.findById(id);
  if (!reservation) return next(new AppError("Reservation not found", 404));

  if (reservation.isDeleted)
    return next(new AppError("Reservation already deleted", 400));

  reservation.isDeleted = true;
  reservation.deletedBy = req.authUser._id;
  reservation.deletedAt = new Date();

  await reservation.save();

  res.status(200).json({
    success: true,
    message: "Reservation deleted successfully",
    data: reservation,
  });
});

//==> hard delete
export const deleteReservation = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const deleted = await Reservation.findByIdAndDelete(id);
  if (!deleted) return next(new AppError("Reservation not found", 404));

  res.status(200).json({
    success: true,
    message: "Reservation deleted successfully",
    data: deleted,
  });
});
