import joi from "joi";
import { generalFields } from "../../middelwares/validate.js";

export const resetPassVal = joi.object({
  oldPassword: generalFields.password.required(),
  newPassword: generalFields.password.required(),
  Cpassword: generalFields.Cpassword.required(),
});
