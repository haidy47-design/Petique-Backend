import { Router } from "express";
import { upload } from "./multer.js";

const chatRouter = Router();

chatRouter.post("/", upload.single("image"), analyzePetImage);

export default chatRouter;