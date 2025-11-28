import { Router } from "express";
import * as qrControllers from "./qrcode.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";

const qrRouter = Router();

qrRouter.get("/generate", qrControllers.generateQr);
qrRouter.post("/validate", qrControllers.validateQr);

qrRouter.get("/login-generate", isAuthenticated, qrControllers.generateLoginQr);
qrRouter.post("/login-validate", qrControllers.validateLoginQr);

export default qrRouter;
