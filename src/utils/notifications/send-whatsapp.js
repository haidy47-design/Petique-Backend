import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendWhatsAppNotification = async (
  phoneNumber,
  oldPrice,
  newPrice
) => {
  try {
    // ensure the phone number is formatted correctly (Egypt country code: +20)
    if (!phoneNumber.startsWith("+")) {
      phoneNumber = "+20" + phoneNumber.replace(/\D/g, "");
    }

    const message = `🔔 Price Drop Alert! The product you subscribed to has dropped from $${oldPrice} to $${newPrice}. Check it out now!`;

    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, // Twilio WhatsApp Number
      to: `whatsapp:${phoneNumber}`,
    });

    console.log(`📲 WhatsApp notification sent to ${phoneNumber}`);
  } catch (error) {
    console.error("❌ Failed to send WhatsApp notification:", error.message);
  }
};
