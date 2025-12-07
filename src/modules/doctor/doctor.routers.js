import { Router } from "express";
import * as doctorController from "./doctor.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { uploadSingleFile } from "../../utils/fileUpload/multer-cloud.js";
const doctorRouter = Router();

//====> doctor
doctorRouter.get("/", doctorController.getAllDoctors);
doctorRouter.post("/", isAuthenticated, uploadSingleFile("image"), doctorController.addNewDoctor);
doctorRouter.put("/soft/:id", isAuthenticated, doctorController.softDeleteDoctor);
doctorRouter.delete("/deleteDoc/:id", isAuthenticated, doctorController.deleteDoctor);
doctorRouter.put("/updateDoc/:id", isAuthenticated, uploadSingleFile("image"),doctorController.updateDoctor);


export default doctorRouter;
