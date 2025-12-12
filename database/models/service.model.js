import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    priceRange: String,
    preparations: String,
    benefits: String,
    tips: String,
    category: {
      type: String,
      enum: ["Consultations", "Preventive Care", "Hygiene", "Dental Care"],
      default: "Consultations",
    },

    duration: {
      type: String,
      default: "30 min",
    },
    image: {
      type: Object,
      required: [true, "image is required"],
    },
    subImages: [Object],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Service = mongoose.model("Service", serviceSchema);
export default Service;
