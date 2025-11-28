import { Types } from "mongoose";
import joi from "joi";
import { AppError } from "../utils/catch-error.js";

const validateObject = (value, helper) => {
  const match = Types.ObjectId.isValid(value);
  if (match) {
    return true;
  }
  return helper("invalid ObjectId");
};
const parseArr = (value, helper) => {
  let parsedValue = JSON.parse(value);
  let schema = joi.array().items(joi.string());
  const { error } = schema.validate(parsedValue, { abortEarly: false });
  if (error) {
    helper("invalid data");
  } else {
    return true;
  }
};
const passPattern = /^[A-Z][A-Za-z0-9]{5,20}$/;
const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const mobileNumberPattern = /^01[01245]\d{8}$/;

export const generalFields = {
  name: joi.string(),
  title: joi.string(),
  comment: joi.string(),
  description: joi.string().min(20).max(2000),
  rate: joi.number().positive().min(0).max(5),
  price: joi.number().min(0),
  discount: joi.number().min(0).max(100),
  email: joi.string().email(),
  password: joi.string().pattern(new RegExp(passPattern)),
  Cpassword: joi.valid(joi.ref("password")),
  mobileNumber: joi.string().pattern(new RegExp(mobileNumberPattern)),
  stock: joi.number().min(1),
  size: joi.custom(parseArr),
  colors: joi.custom(parseArr),
  // objectId : joi.string().hex().length(24),
  objectId: joi.custom(validateObject),
};
export const validate = (schema) => {
  return (req, res, next) => {
    let data = { ...req.body, ...req.params, ...req.query };
    let { error } = schema.validate(data, { abortEarly: false });
    if (!error) {
      next();
    } else {
      let errMsg = error.details.map((err) => err.message);
      next(new AppError(errMsg, 400));
    }
  };
};
