import Stripe from "stripe";
import { catchAsyncError } from "./catch-error.js";
import { orderStatus, payments } from "./constant/enums.js";
import Product from "../../database/models/product.model.js";
import Cart from "../../database/models/cart.model.js";
import Order from "../../database/models/order.model.js";
const stripe = new Stripe(process.env.APIKEYORDER);

export const webhookStripe = catchAsyncError(async (req, res) => {
  console.log("🔔 Webhook received!");

  const sig = req.headers["stripe-signature"].toString();
  let checkout;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ||
        "whsec_7zNpfW5dILln6MfeGTBhd5SOUnJqSUy2"
    );
    console.log("✅ Webhook signature verified. Event type:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res
      .status(400)
      .json({ error: "Webhook signature verification failed" });
  }

  if (event.type === "checkout.session.completed") {
    checkout = event.data.object;
    const metadata = checkout.metadata;

    // ===> Create order from metadata ==> order is created ONLY after payment success
    if (metadata.orderProducts) {
      // ===> Parse minimal product data from metadata ==> only productId and quantity
      const minimalProducts = JSON.parse(metadata.orderProducts);

      // ===> Fetch full product details from database
      const orderProducts = [];
      for (const item of minimalProducts) {
        const product = await Product.findById(item.p);
        if (product) {
          orderProducts.push({
            productId: product._id,
            title: product.title,
            quantity: item.q,
            imageCover: product.imageCover,
            price: product.price,
            discount: product.discount || 0,
            finalPrice: product.priceAfterDiscount || product.price,
          });
        }
      }

      const order = await Order.create({
        fullName: metadata.fullName,
        user: metadata.userId,
        products: orderProducts,
        address: metadata.address || null,
        phone: metadata.phone,
        orderPrice: parseFloat(metadata.orderPrice),
        finalPrice: parseFloat(metadata.finalPrice),
        notes: metadata.notes || null,
        payment: payments.VISA,
        coupon: metadata.couponId || null,
        status: orderStatus.PLACED,
        isPaid: true,
        paidAt: new Date(),
        stripeSessionId: checkout.id,
      });

      // ===> decrease stock for each product
      for (const item of minimalProducts) {
        await Product.findByIdAndUpdate(item.p, {
          $inc: { stock: -item.q },
        });
      }

      // ===> clear the user's cart
      await Cart.findOneAndUpdate(
        { user: metadata.userId },
        { products: [], totalPrice: 0 }
      );

      console.log(`✅ Order created successfully after payment: ${order._id}`);
      return res.json({ message: "success", order });
    }
  }

  res.json({ message: "success", checkout });
});
