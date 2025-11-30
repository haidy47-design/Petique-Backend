import mongoose from "mongoose";

const doseSchema = new mongoose.Schema(
  {
    doseNumber: { type: Number, required: true },
    ageInWeeks: { type: Number, required: true },
    repeatAfterDays: { type: Number, required: true },
  },
  { _id: false }
);

const vaccinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      minlength: 2,
    },

    description: {
      type: String,
      required: true,
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnimalCategory",
        required: true,
      },
    ],

    doses: {
      type: [doseSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one dose is required",
      },
    },

    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Types.ObjectId, ref: "User" },
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Vaccination", vaccinationSchema);
