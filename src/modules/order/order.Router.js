import { Router } from "express";
import { isAuthenticated, isAuthorized } from "./../../middelwares/auth.js";
import * as orderControllers from "./order.controllers.js";
import { roles } from "./../../utils/constant/enums.js";

const orderRouter = Router();
orderRouter.get("/", isAuthenticated, orderControllers.getUserOrders);
orderRouter.get("/order-count", orderControllers.getUserOrderCounts);
orderRouter.get(
  "/exportpdf",
  isAuthenticated,
  orderControllers.exportOrdersToPDF
);
orderRouter.get(
  "/exportcsv",
  isAuthenticated,
  orderControllers.exportOrdersToCSV
);
orderRouter.get(
  "/orderDistrbuted",
  isAuthenticated,
  orderControllers.getOrdersDistributionByStatus
);
orderRouter.get(
  "/revenue",
  isAuthenticated,
  orderControllers.getRevenuePerMonth
);
orderRouter.get("/allorders", isAuthenticated, orderControllers.getAllOrders);
orderRouter.post("/", isAuthenticated, orderControllers.createOrder);
orderRouter.post(
  "/checkSession/:id",
  isAuthenticated,
  orderControllers.createCheckoutSession
);
orderRouter.get("/:id", isAuthenticated, orderControllers.getOrderDetails);
orderRouter.put("/:id", isAuthenticated, orderControllers.updateOrder);
orderRouter.put(
  "/status/:id",
  isAuthenticated,
  isAuthorized([roles]),
  orderControllers.updateOrderStatus
);
orderRouter.put(
  "/soft/:id",
  isAuthenticated,
  isAuthorized([roles.ADMIN]),
  orderControllers.softDeleteOrder
);

orderRouter.delete(
  "/hard/:id",
  isAuthenticated,
  isAuthorized([roles.ADMIN]),
  orderControllers.hardDeleteOrder
);

export default orderRouter;
