import mongoose from "mongoose";
import { TIME_SLOTS } from "../../src/utils/constant/timeSlots.js";

const reservationSchema = new mongoose.Schema(
  {
    petOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    date: { type: Date, required: true },

    timeSlot: {
      type: String,
      enum: TIME_SLOTS,
      required: true,
    },

    notes: String,

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },

    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;
