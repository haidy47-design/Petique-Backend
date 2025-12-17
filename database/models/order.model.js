import mongoose, { Schema } from "mongoose";
import { orderStatus, payments } from "../../src/utils/constant/enums.js";

const orderSchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
    },

    products: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        imageCover: {
          type: Object,
        },
        title: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        discount: {
          type: Number,
          default: 0,
        },
        finalPrice: Number,
      },
    ],

    address: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    payment: {
      type: String,
      enum: Object.values(payments),
      default: payments.CASH,
      immutable: true,
    },

    status: {
      type: String,
      enum: Object.values(orderStatus),
      default: orderStatus.PLACED,
    },

    orderPrice: {
      type: Number,
      required: true,
    },

    coupon: {
      type: mongoose.Types.ObjectId,
      ref: "Coupon",
    },

    finalPrice: {
      type: Number,
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
