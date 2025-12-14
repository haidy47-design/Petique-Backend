import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    petOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AnimalCategory",
      required: true,
    },

    name: String,
    age: String,
    weight: String,
    allergies: [String],

    vaccinationHistory: [
      {
        vaccine: { type: mongoose.Schema.Types.ObjectId, ref: "Vaccination" },
        doseNumber: { type: Number, required: true },
        date: { type: Date, required: true },
        nextDose: { type: Date },
        status: {
          type: String,
          enum: ["scheduled", "completed", "overdue"],
          default: "scheduled",
        },
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
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
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

petSchema.virtual("vaccinationHistoryWithStatus").get(function () {
    if (!this.vaccinationHistory) return [];

  const now = new Date();

  return this.vaccinationHistory.map((v) => {
    let computedStatus = v.status;

    if (
      v.status === "scheduled" &&
      v.nextDose &&
      new Date(v.nextDose) < now
    ) {
      computedStatus = "overdue";
    }

    return {
      ...v.toObject(),
      status: computedStatus,
    };
  });
});



export default mongoose.model("Pet", petSchema);
