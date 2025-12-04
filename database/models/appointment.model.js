import mongoose from "mongoose";
import { TIME_SLOTS } from "../../src/utils/constant/time-slots.js";

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  branch: String,

  date: { type: Date, required: true },

  time: {
    type: String,
    enum: TIME_SLOTS,
    required: true,
  },

  isBooked: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
