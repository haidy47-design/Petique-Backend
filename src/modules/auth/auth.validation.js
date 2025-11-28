import joi from "joi";
import { generalFields } from "../../middelwares/validate.js";

export const signUpVal = joi
  .object({
    userName: generalFields.name.required(),
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    Cpassword: generalFields.Cpassword.required(),
    mobileNumber: generalFields.mobileNumber.required(),
    gender: joi.string(),
  })
  .required();

export const signInVal = joi
  .object({
    mobileNumber: joi.string().when("email", {
      is: joi.required(),
      then: joi.optional(),
      otherwise: joi.required(),
    }),
    email: generalFields.email,
    password: generalFields.password.required(),
    id: generalFields.objectId.required(),
  })
  .required();
