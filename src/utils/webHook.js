import Stripe from "stripe";
import { catchAsyncError } from "./catch-error.js";
import { orderStatus } from "./constant/enums.js";
import Product from "../../database/models/product.model.js";
import Cart from "../../database/models/cart.model.js";
import Order from "../../database/models/order.model.js";
const stripe = new Stripe(process.env.APIKEYORDER);

//webhook function :
export const webhookStripe = catchAsyncError(async (req, res) => {
  const sig = req.headers["stripe-signature"].toString();
  let checkout;
  let event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    "whsec_7zNpfW5dILln6MfeGTBhd5SOUnJqSUy2"
  );
  if (event.type == "checkout.session.completed") {
    checkout = event.data.object;
    //==> update order status placed
    const orderId = checkout.metadata.orderId;
    const orderExist = await Order.findByIdAndUpdate(
      orderId,
      {
        status: orderStatus.PLACED,
      },
      { new: true }
    );
    //==> clear cart
    const cart = await Cart.findOneAndUpdate(
      { user: orderExist.user },
      {
        products: [],
      }
    );
    // update product stock
    for (const product of orderExist.products) {
      await Product.findByIdAndUpdate(product.productId, {
        $inc: { stock: -product.quantity },
      });
    }
  }
  res.json({ message: "success", checkout });
});
