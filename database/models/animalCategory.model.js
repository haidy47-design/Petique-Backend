import mongoose from "mongoose";

const animalCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
    },
    description: String,
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("AnimalCategory", animalCategorySchema);
