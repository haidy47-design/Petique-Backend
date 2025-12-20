import mongoose from "mongoose";

const loginActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ip: String,
    browser: String,
    device: String,
    location: String,
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("LoginActivity", loginActivitySchema);
