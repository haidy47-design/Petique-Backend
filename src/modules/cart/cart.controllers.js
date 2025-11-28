import Cart from "../../../database/models/cart.model.js";
import Product from "../../../database/models/product.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { messages } from "../../utils/constant/messages.js";

const calcTotalPrice = (items) => {
  items.totalPrice = items.products.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
};
const calcNoOfProducts = (items) => {
  return items.products.length;
};
const calcNoOfItems = (items) => {
  return items.products.reduce((acc, item) => acc + item.quantity, 0);
};

export const addToCart = catchAsyncError(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  //==> 1️- Check product existence
  const productExist = await Product.findById(productId);
  if (!productExist) return next(new AppError(messages.product.notFound, 404));

  //==> 2️- get or create user cart
  let cart = await Cart.findOne({ user: req.authUser._id });

  if (!cart) {
    // create new cart with the product
    if (!productExist.instock(quantity)) {
      return next(new AppError(messages.product.outStock, 400));
    }

    cart = await Cart.create({
      user: req.authUser._id,
      products: [{ productId, quantity, price: productExist.price }],
    });

    calcTotalPrice(cart);
    await cart.save();
  } else {
    //==> 3️- If cart exists => check if product already in cart
    const productInCart = cart.products.find(
      (p) => p.productId.toString() === productId
    );

    if (productInCart) {
      const newQuantity = productInCart.quantity + quantity;

      if (!productExist.instock(newQuantity)) {
        return next(new AppError(messages.product.outStock, 400));
      }

      productInCart.quantity = newQuantity;
      productInCart.price = productExist.price;
    } else {
      // new product in cart
      if (!productExist.instock(quantity)) {
        return next(new AppError(messages.product.outStock, 400));
      }

      cart.products.push({
        productId,
        quantity,
        price: productExist.price,
      });
    }

    //==> 4️- recalculate totals and save
    calcTotalPrice(cart);
    await cart.save();
  }

  //==> 5️- Populate products with full product details
  await cart.populate("products.productId");

  const noOfCartItems = calcNoOfItems(cart);
  const noOfProducts = calcNoOfProducts(cart);

  res.status(200).json({
    message: messages.cart.updatedSuccessfully,
    success: true,
    noOfCartItems,
    noOfProducts,
    cart,
  });
});

export const deleteFromCart = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!id) return next(new AppError("Product ID is required", 400));

  const userCart = await Cart.findOne({ user: req.authUser._id });
  if (!userCart) return next(new AppError(messages.cart.notFound, 404));

  const productInCart = userCart.products.find(
    (p) => p.productId.toString() === id
  );
  if (!productInCart) {
    return next(new AppError("Product not found in cart", 404));
  }

  userCart.products = userCart.products.filter(
    (p) => p.productId.toString() !== id
  );

  calcTotalPrice(userCart);
  await userCart.save();

  await userCart.populate({
    path: "products.productId",
    select: "title imageCover price discount finalPrice stock category",
    populate: {
      path: "category",
      select: "name image",
    },
  });

  const noOfCartItems = calcNoOfItems(userCart);
  const noOfProducts = calcNoOfProducts(userCart);

  return res.status(200).json({
    success: true,
    message: "Product removed from cart",
    noOfCartItems,
    noOfProducts,
    data: userCart,
  });
});

export const viewCart = catchAsyncError(async (req, res, next) => {
  const userCart = await Cart.findOne({ user: req.authUser._id }).populate({
    path: "products.productId",
    select: "title imageCover price discount finalPrice stock category",
    populate: {
      path: "category",
      select: "name image",
    },
  });

  if (!userCart) {
    return next(new AppError(messages.cart.notFound, 404));
  }
  const noOfCartItems = calcNoOfItems(userCart);
  const noOfProducts = calcNoOfProducts(userCart);

  return res.status(200).json({
    message: "Cart retrieved successfully",
    success: true,
    noOfCartItems,
    noOfProducts,
    data: userCart,
  });
});

export const clearCart = catchAsyncError(async (req, res, next) => {
  // find the user's cart & clear the products array
  const updatedCart = await Cart.findOneAndUpdate(
    { user: req.authUser._id },
    { $set: { products: [] } }, // set to an empty array
    { new: true }
  );

  if (!updatedCart) {
    return next(new AppError(messages.cart.notFound, 404));
  }

  return res.status(200).json({
    message: "Cart cleared successfully",
    success: true,
    data: updatedCart,
  });
});

export const updateQuantity = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.authUser._id });
  if (!cart) return next(new AppError(messages.cart.notFound, 404));

  const item = cart.products.find((item) => item.productId.toString() === id);
  if (!item) return next(new AppError(messages.product.notFound, 404));

  const product = await Product.findById(id);
  if (!product) return next(new AppError(messages.product.notFound, 404));

  if (quantity > product.stock) {
    return next(
      new AppError(`Requested quantity exceeds available stock.`, 400)
    );
  }
  item.quantity = quantity;
  calcTotalPrice(cart);
  await cart.save();

  await cart.populate({
    path: "products.productId",
    select: "title imageCover price discount finalPrice stock category",
    populate: {
      path: "category",
      select: "name image",
    },
  });

  const noOfCartItems = calcNoOfItems(cart);
  const noOfProducts = calcNoOfProducts(cart);

  return res.status(200).json({
    success: true,
    message: messages.cart.updatedSuccessfully,
    noOfCartItems,
    noOfProducts,
    data: cart,
  });
});
