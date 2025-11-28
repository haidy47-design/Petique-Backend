import { Router } from "express";
import * as reservationControllers from "./reservation.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";

const reservationRouter = Router();

reservationRouter.post(
  "/",
  isAuthenticated,
  reservationControllers.createReservation
);
reservationRouter.get("/", isAuthenticated, reservationControllers.getReservations);
reservationRouter.get(
  "/:id",
  isAuthenticated,
  reservationControllers.getSpecificReservation
);
reservationRouter.put(
  "/:id",
  isAuthenticated,
  reservationControllers.updateReservation
);

reservationRouter.put(
  "/soft/:id",
  isAuthenticated,
  reservationControllers.softDeleteReservation
);

// hard delete
reservationRouter.delete(
  "/:id",
  isAuthenticated,
  reservationControllers.deleteReservation
);

export default reservationRouter;
