import mongoose, { Mongoose } from "mongoose";
import { notifyUsersAboutPriceDrop } from "../../src/utils/emails/email.js";
import "./review.model.js"
let productSchema = mongoose.Schema(
  {
    //====== titles ======//
    title: {
      type: String,
      trim: true,
      unique: [true, "Product title already exist"],
      minlength: [2, "too short Product name"],
    },

    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 2000,
    },
    //====== images ======//
    imageCover: {
      type: Object,
      required: true,
    },
    subImages: [Object],
    //====== price =======//
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
    //====== specific actions =====//
    stock: {
      type: Number,
      min: 0,
      default: 1,
    },
    //====== id's =======//
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rate: {
      type: Number,
      min: 0,
      max: 5,
      default: 5,
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
    toJSON: { virtuals: true }, //json res
    toObject: { virtuals: true }, //log
  }
);

productSchema.virtual("finalPrice").get(function () {
  return this.price - this.price * ((this.discount || 0) / 100);
});

productSchema.methods.instock = function (quantity) {
  return this.stock >= quantity ? true : false;
};

productSchema.pre("save", async function () {
  if (!this.isModified("price") && !this.isModified("discount")) return;

  const previousProduct = await this.constructor.findById(this._id);
  if (!previousProduct) return;

  const oldFinalPrice =
    previousProduct.price -
    previousProduct.price * ((previousProduct.discount || 0) / 100);

  const newFinalPrice = this.price - this.price * ((this.discount || 0) / 100);

  if (newFinalPrice < oldFinalPrice) {
    await notifyUsersAboutPriceDrop(this._id, oldFinalPrice, newFinalPrice);
  }
});

//==> get Reviews for specific product with virtual populate
productSchema.virtual("Reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});
productSchema.pre("findOne", function () {
  this.populate("Reviews");
});

let Product = mongoose.model("Product", productSchema);
export default Product;
