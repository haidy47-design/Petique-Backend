import mongoose from "mongoose";

const clinicReviewSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
      minlength: 2,
    },

    rate: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    clinic: {
      type: String,
      default: "Petique Clinic", 
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("ClinicReview", clinicReviewSchema);
