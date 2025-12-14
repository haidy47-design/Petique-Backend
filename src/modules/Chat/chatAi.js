import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const analyzePetImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Pet image is required",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.0-pro",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are a licensed veterinarian.
Analyze the pet image and respond to the pet owner clearly and professionally.

Include:
1. Possible disease or condition
2. Visible symptoms from the image
3. Urgency level (low / medium / high)
4. Home care advice (if safe)
5. When to visit a vet immediately
6. Clear disclaimer that this is not a final diagnosis
              `,
            },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: req.file.buffer.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: response.text,
    });
  } catch (err) {
    console.error("Vet AI Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze pet image. Please try again later.",
    });
  }
};
