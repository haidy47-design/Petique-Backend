import { Router } from "express";
import * as appointmentCtrl from "./appointment.controllers";
import { isAuthenticated } from "../../middelwares/auth.js";

const appointmentRouter = Router();

appointmentRouter.post(
  "/generate",
  isAuthenticated,
  appointmentCtrl.generateDailyAppointments
);
appointmentRouter.get(
  "/available",
  isAuthenticated,
  appointmentCtrl.getAvailableAppointments
);

export default appointmentRouter;
