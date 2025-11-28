import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    petOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    age: String,
    weight: Number,
    allergies: [String],
    vaccinationHistory: [
      {
        vaccine: String,
        date: Date,
        nextDose: Date,
      },
    ],
    image: {
      type: Object,
      default: {
        secure_url: process.env.ANIMAL_SECURE,
        public_id: process.env.ANIMAL_ID,
      },
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
petSchema.virtual("medicalRecords", {
  ref: "MedicalRecord",
  localField: "_id",
  foreignField: "pet",
});

const Pet = mongoose.model("Pet", petSchema);
export default Pet;
