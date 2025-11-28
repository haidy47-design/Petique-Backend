import Joi from "joi";

export const contactSchema = Joi.object({
  fullName: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  message: Joi.string().min(10).max(1000).required(),

  category: Joi.string()
    .valid(
      "appointment",
      "emergency",
      "health",
      "vaccination",
      "adoption",
      "general"
    )
    .default("general"),

  urgency: Joi.string()
    .valid("low", "medium", "high", "emergency")
    .default("low"),

  petAge: Joi.string().optional(),
});
