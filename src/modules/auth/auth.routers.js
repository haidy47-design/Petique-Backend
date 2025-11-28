import { Router } from "express";
import * as authControllers from "./auth.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { uploadSingleFile } from "../../utils/fileUpload/multer-cloud.js";
import { isAuthenticated } from "../../middelwares/auth.js";
import { signUpVal } from "./auth.validation.js";

const authRouter = Router();

authRouter.post(
  "/signup",
  uploadSingleFile("image"),
  validate(signUpVal),
  authControllers.signup
);
authRouter.get("/verify/:token", authControllers.verifyAccount);
authRouter.post("/login", authControllers.logIn);
authRouter.post("/google-login", authControllers.googleLogin);
authRouter.post("/logout", isAuthenticated, authControllers.logout);
authRouter.post("/verifyOtp", authControllers.verifyOtp);
authRouter.put("/forgetPass", authControllers.forgetPassword);
authRouter.put("/changePass", authControllers.changePassword);

export default authRouter;
