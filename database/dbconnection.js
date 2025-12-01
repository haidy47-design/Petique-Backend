import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const dbConnection = () => {
  mongoose
      .connect(process.env.MONGODB_ATLAS)
    .then(() => {
      console.log("Db connected successfully..");
    })
    .catch((err) => {
      console.log("Error connecting", err);
    });
};