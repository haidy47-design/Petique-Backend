import { Router } from "express";
import * as serviceControllers from "./services.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { uploadMixFiles } from "../../utils/fileUpload/multer-cloud.js";

const serviceRouter = Router();

serviceRouter.get("/", serviceControllers.getAllServices);
serviceRouter.get("/:id", serviceControllers.getService);

serviceRouter.post(
  "/",
  isAuthenticated,
  uploadMixFiles([
    { name: "image", maxCount: 1 },
    { name: "subImages", maxCount: 5 },
  ]),
  serviceControllers.addService
);

serviceRouter.put(
  "/:id",
  isAuthenticated,
  uploadMixFiles([
    { name: "image", maxCount: 1 },
    { name: "subImages", maxCount: 5 },
  ]),
  serviceControllers.updateService
);

serviceRouter.put(
  "/soft/:id",
  isAuthenticated,
  serviceControllers.softDeleteService
);

serviceRouter.delete(
  "/:id",
  isAuthenticated,
  serviceControllers.deleteService
);

export default serviceRouter;
