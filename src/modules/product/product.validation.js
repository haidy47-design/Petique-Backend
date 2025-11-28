import joi from "joi";
import { generalFields } from "../../middelwares/validate.js";

export const addProductVal = joi
  .object({
    title: generalFields.title.required(),
    description: generalFields.description.required(),
    category: generalFields.objectId.required(),
    price: generalFields.price.required(),
    stock: generalFields.stock,
    discount: generalFields.discount.optional(),
  })
  .required();
