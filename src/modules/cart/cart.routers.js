import { Router } from "express";
import { isAuthenticated } from "../../middelwares/auth.js";
import * as cartControllers from "./cart.controllers.js";

const cartRouter = Router();

cartRouter.get("/", isAuthenticated, cartControllers.viewCart);
cartRouter.post("/", isAuthenticated, cartControllers.addToCart);
cartRouter.put("/:id", isAuthenticated, cartControllers.updateQuantity);
cartRouter.put(
  "/deleteitem/:id",
  isAuthenticated,
  cartControllers.deleteFromCart
);
cartRouter.delete("/", isAuthenticated, cartControllers.clearCart);

export default cartRouter;
