import jwt from "jsonwebtoken";
import Token from "../../database/models/token.model.js";

export const generateToken = async ({
  payload = {},
  secretKey = process.env.SECRET_KEY,
  expiresIn = "30d",
}) => {
  const token = jwt.sign(payload, secretKey, { expiresIn });
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  // await Token.create({
  //   token,
  //   userId: payload._id,
  //   expiresAt,
  // });
  return token;
};

export const verifyToken = async ({
  token,
  secretKey = process.env.EMAIL_KEY,
}) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    const tokenRecord = await Token.findOne({ token });
    if (!tokenRecord || !tokenRecord.isValid) {
      return { success: false, message: "Token is invalid or does not exist" };
    }
    if (new Date() > tokenRecord.expiresAt) {
      return { success: false, message: "Token has expired" };
    }
    return decoded; //payload
  } catch (error) {
    return { errorMessage: error.message };
  }
};
