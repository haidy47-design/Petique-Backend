import joi from "joi";
import { generalFields } from "../../middelwares/validate.js";

export const addCategoryVal = joi
  .object({
    name: generalFields.name.required(),
  })
  .required();

export const updateCategoryVal = joi
  .object({
    name: generalFields.name,
    id: generalFields.objectId.required(),
  })
  .required();