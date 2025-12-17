import { Router } from "express";
import { upload } from "./multer.js";
import { Router } from "express";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const chatRouter = Router();
const upload = multer({ dest: "uploads/" });

chatRouter.post("/", upload.single("image"), analyzePetImage);

chatRouter.post("/disease", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    // Prepare form-data for Flask
    const form = new FormData();
    form.append("image", fs.createReadStream(file.path));

    // Send request to Flask API
    const flaskResponse = await axios.post(
      "http://127.0.0.1:5000/predict",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    // Delete temp file
    fs.unlinkSync(file.path);

    // Return Flask response to frontend
    res.json(flaskResponse.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error forwarding request to Flask",
      error: err.message,
    });
  }
});

export default chatRouter;
