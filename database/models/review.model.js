import mongoose from "mongoose";

let reviewSchema = mongoose.Schema(
  {
    comment: {
      type: String,
      trim: true,
    },
    rate: {
      type: Number,
      require: true,
      min: 0,
      max: 5,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      require: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

let Review = mongoose.model("Review", reviewSchema);

export default Review;
