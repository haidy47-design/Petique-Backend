import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    petOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["appointment", "vaccination", "medication"],
      required: true,
    },

    title: String,
    remindAt: { type: Date, required: true },

    isSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
