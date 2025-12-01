import { Router } from "express";
import * as petControllers from "./pet.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { uploadSingleFile } from "../../utils/fileUpload/multer-cloud.js";

const petRouter = Router();

petRouter.get("/", isAuthenticated, petControllers.getAllPets);
petRouter.get("/userPet", isAuthenticated, petControllers.getUserPets);
petRouter.get("/:id", petControllers.getPetById);

petRouter.post("/", isAuthenticated, uploadSingleFile("image"), petControllers.addPet);

petRouter.put(
  "/:id",
  isAuthenticated,
  uploadSingleFile("image"),
  petControllers.updatePet
);

petRouter.put("/soft/:id", isAuthenticated, petControllers.softDeletePet);

petRouter.delete("/:id", isAuthenticated, petControllers.deletePet);

export default petRouter;
