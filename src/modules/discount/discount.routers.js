import { Router } from "express";
import * as discountControllers from "./discount.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";

const discountRouter = Router();

// ==> public

discountRouter.get(
  "/active",
  discountControllers.getActiveDiscounts
);
discountRouter.get(
  "/products",
  discountControllers.getActiveDiscounts
);
// ==> admin

discountRouter.get(
  "/",
  isAuthenticated,
  discountControllers.getDiscounts
);

discountRouter.post(
  "/",
  isAuthenticated,
  discountControllers.createDiscount
);

discountRouter.put(
  "/:id",
  isAuthenticated,
  discountControllers.updateDiscount
);

discountRouter.patch(
  "/toggle/:id",
  isAuthenticated,
  discountControllers.toggleDiscount
);

discountRouter.delete(
  "/soft/:id",
  isAuthenticated,
  discountControllers.softDeleteDiscount
);

export default discountRouter;
