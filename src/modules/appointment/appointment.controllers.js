import Appointment from "../../../database/models/appointment.model.js";
import Reservation from "../../../database/models/reservation.model.js";
import { TIME_SLOTS } from "../../constants/time-slots.js";
import { AppError, catchAsyncError } from "../utils/catch-error.js";

//===> generate appointments for a doctor + service for a given date
export const generateDailyAppointments = catchAsyncError(async (req, res, next) => {
  const { doctor, service, date } = req.body;

  if (!doctor || !service || !date) {
    return next(new AppError("Doctor, service, and date are required", 400));
  }

  const appointmentDate = new Date(date);
  appointmentDate.setHours(0, 0, 0, 0);

  const appointments = TIME_SLOTS.map((time) => ({
    doctor,
    service,
    date: appointmentDate,
    time,
  }));

  try {
    const inserted = await Appointment.insertMany(appointments, { ordered: false });
    res.status(201).json({
      success: true,
      message: "Daily appointments generated successfully",
      data: inserted,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Appointments for this doctor/service/date already exist",
      });
    }
    next(err);
  }
});


//===> get available appointments
export const getAvailableAppointments = catchAsyncError(async (req, res, next) => {
  const { doctor, service, date } = req.query;

  const query = { isBooked: false };
  if (doctor) query.doctor = doctor;
  if (service) query.service = service;
  if (date) query.date = new Date(date);

  const appointments = await Appointment.find(query)
    .populate("doctor", "userName email")
    .populate("service", "name price");

  res.status(200).json({
    success: true,
    results: appointments.length,
    data: appointments,
  });
});
