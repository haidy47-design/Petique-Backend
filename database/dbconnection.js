// import mongoose from "mongoose";
// import dotenv from "dotenv";
// dotenv.config();

// export const dbConnection = () => {
//   mongoose
//       .connect(process.env.MONGODB_ATLAS)
//     .then(() => {
//       console.log("Db connected successfully..");
//     })
//     .catch((err) => {
//       console.log("Error connecting", err);
//     });
// };

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
if (!process.env.MONGODB_ATLAS) {
  dotenv.config({ path: "./env.env" });
}

export const dbConnection = () => {
  const mongoUri = process.env.MONGODB_ATLAS || process.env.mongoose_URI;
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("Db connected successfully..");
    })
    .catch((err) => {
      console.log("Error connecting", err);
    });
};