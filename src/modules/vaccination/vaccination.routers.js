import { Router } from "express";
import * as vaccinationControllers from "./vaccination.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";

const vaccinationRouter = Router();

vaccinationRouter.post(
  "/",
  isAuthenticated,
  vaccinationControllers.addVaccination
);

vaccinationRouter.get("/", vaccinationControllers.getVaccinations);

vaccinationRouter
  .route("/:id")
  .get(vaccinationControllers.getVaccination)
  .put(isAuthenticated, vaccinationControllers.updateVaccination)
  .delete(isAuthenticated, vaccinationControllers.deleteVaccination);

vaccinationRouter.put(
  "/soft/:id",
  isAuthenticated,
  vaccinationControllers.softDeleteVaccination
);

export default vaccinationRouter;
