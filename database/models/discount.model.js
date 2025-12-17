import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["FLASH", "PERCENTAGE", "BOGO", "FIRST_ORDER", "BULK"],
      required: true,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    buyQty: Number,
    getQty: Number,

    appliesTo: {
      type: String,
      enum: ["ALL", "PRODUCTS", "CATEGORIES"],
      default: "ALL",
    },

    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    fromDate: Date,
    expire: Date,
    uses: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("AutomaticDiscount", discountSchema);
