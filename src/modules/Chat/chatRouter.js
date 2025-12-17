import { Router } from "express";
import { upload } from "./multer.js";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";
import { analyzePetImage } from "./chatAi.js";

const chatRouter = Router();
const uploadImage = multer({
  storage: multer.memoryStorage(),
});
chatRouter.post("/disease", uploadImage.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const flaskResponse = await axios.post(process.env.FLASK_URL, form, {
      headers: form.getHeaders(),
    });

    res.json(flaskResponse.data);
  } catch (err) {
    res.status(500).json({
      message: "Error forwarding request to Flask",
      error: err.message,
    });
  }
});

chatRouter.post("/", upload.single("image"), analyzePetImage);

export default chatRouter;
