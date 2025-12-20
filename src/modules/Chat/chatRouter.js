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

chatRouter.post("/analyze-image", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.IMAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional veterinarian. Analyze pet images and describe possible visible symptoms only. Be cautious and brief.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this pet image" },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(400).json({ message: data.error?.message });
    }

    res.json({
      diagnosis: data.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Image analysis failed" });
  }
});

chatRouter.post("/", upload.single("image"), analyzePetImage);

export default chatRouter;
