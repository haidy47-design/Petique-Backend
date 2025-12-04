import nodemailer from "nodemailer";
import { emailtemplet } from "./email-templet.js";
import { generateToken } from "../token.js";
import { PriceAlert } from "../../../database/models/priceAlert.model.js";
import { sendWhatsAppNotification } from "../notifications/send-whatsapp.js";
import Product from "../../../database/models/product.model.js";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDEMAIL,
    pass: process.env.SENDEMAILPASSWORD,
  },
});

export const sendEmail = async (_id, email, role, otpCode) => {
  const token = await generateToken({
    payload: { _id, email, role },
    secretKey: process.env.EMAIL_KEY,
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `"BETCLINIC 🐶🐱" <${process.env.SENDEMAIL}>`,
    to: email,
    subject: "Confirm Email",
    text: `Your OTP code is ${otpCode}`,
    html: emailtemplet(token, otpCode),
  });

  console.log("Message sent: %s", info.messageId);
  return token;
};

export async function sendResetPasswordMail(email, otpCode) {
  const info = await transporter.sendMail({
    from: `"BETCLINIC 🐾" <${process.env.SENDEMAIL}>`,
    to: email,
    subject: "Reset Your Password — BETCLINIC 🐶🐱",
    html: `
    <div style="font-family: 'Poppins', sans-serif; background-color: #f2f8ff; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

        <div style="background-color: #709775; color: #fff; text-align: center; padding: 20px;">
          <h2 style="margin: 0; font-size: 22px;">🔐 Password Reset Request</h2>
          <p style="margin: 5px 0; font-size: 14px;">BETCLINIC Veterinary Services</p>
        </div>

        <div style="padding: 25px; text-align: center;">
          <p style="font-size: 16px; color: #333;">Hi there 👋</p>
          <p style="font-size: 15px; color: #555;">Your verification code to reset your password:</p>

          <div style="margin-top: 20px; font-size: 32px; font-weight: bold; color: #709775;">
            ${otpCode}
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #888;">
            If you didn’t request a password reset, you can safely ignore this email.
          </p>

          <p style="margin-top: 25px; font-size: 14px; color: #bfd8bd; font-weight: 600;">
            🐾 BETCLINIC — Caring for Your Pets, Always.
          </p>
        </div>
      </div>
    </div>
    `,
  });

  console.log("Message sent:", info.messageId);
}

export async function sendCustomEmail({
  to,
  subject,
  text,
  html,
  reviewerName,
}) {
  const supportEmail = process.env.SUPPORT_EMAIL || "yumnamohamed30@gmail.com";

  const htmlTemplate =
    html ||
    `
  <div style="font-family: 'Poppins', sans-serif; background-color: #f2f8ff; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

      <div style="background-color: #bfd8bd; color: #fff; text-align: center; padding: 20px;">
        <h2 style="margin: 0; font-size: 22px;">💬 Message from BETCLINIC Support</h2>
      </div>

      <div style="padding: 25px;">
        <p style="font-size: 16px; color: #333;">
          Dear ${reviewerName || "Pet Lover"},
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          ${
            text ||
            "Thank you for reaching out to BETCLINIC. We value your feedback and are here to ensure your pets receive the best care possible."
          }
        </p>

        <div style="margin-top: 25px; text-align: center;">
          <a href="mailto:${supportEmail}" 
             style="background-color: #709775; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 15px;">
            Contact Support Team
          </a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #888; text-align: center;">
          — BETCLINIC Veterinary Support Team 🐾
        </p>
      </div>
    </div>
  </div>
`;

  const info = await transporter.sendMail({
    from: `"BETCLINIC 🐶🐱" <${process.env.SENDEMAIL}>`,
    to,
    subject,
    html: htmlTemplate,
  });

  console.log(`Support email sent to ${to}:`, info.messageId);
  return info;
}

//==> send mail to user when subscribe to price drop product alert
export const notifyUsersAboutPriceDrop = async (
  productId,
  oldPrice,
  newPrice
) => {
  const alerts = await PriceAlert.find({
    product: productId,
    subscribedPrice: { $gt: newPrice },
  }).populate("user");

  if (!alerts.length) {
    console.log("No users subscribed for price alerts.");
    return;
  }

  const product = await Product.findById(productId);
  const productName = product?.title || "Your Favorite Product";

  const emailList = [];

  // Collect emails and send WhatsApp messages
  for (const alert of alerts) {
    if (alert.user.email) emailList.push(alert.user.email);
    if (alert.user.mobileNumber) {
      await sendWhatsAppNotification(
        alert.user.mobileNumber,
        oldPrice,
        newPrice
      );
    }
  }

  // Build email HTML template
  const htmlTemplate = `
  <div style="font-family: 'Poppins', sans-serif; background-color: #f2f8ff; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

      <div style="background-color: #709775; color: #fff; text-align: center; padding: 20px;">
        <h2 style="margin: 0; font-size: 22px;">🐾 BETCLINIC Price Drop Alert!</h2>
      </div>

      <div style="padding: 25px;">
        <p style="font-size: 16px; color: #333; text-align: center;">Hello Pet Parent 👋</p>

        <p style="font-size: 15px; color: #555; line-height: 1.6; text-align: center;">
          Great news! The price of <strong>${productName}</strong> has dropped!
        </p>

        <div style="background-color: #e7f2ff; border-radius: 10px; padding: 15px; text-align: center; margin: 20px 0;">
          <p style="font-size: 18px; color: #333; margin: 5px 0;">
            <strong>Old Price:</strong>
            <span style="text-decoration: line-through; color: #999;">$${oldPrice.toFixed(
              2
            )}</span>
          </p>

          <p style="font-size: 24px; color: #709775; margin: 5px 0;">
            <strong>New Price:</strong> $${newPrice.toFixed(2)}
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${
            process.env.CLIENT_URL || "https://betclinic.com"
          }/product/${productId}" 
             style="background-color: #bfd8bd; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px;">
            🛒 View Product
          </a>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #888; text-align: center;">
          — BETCLINIC Veterinary Store Team 🐶🐱
        </p>
      </div>
    </div>
  </div>
`;

  // Send the email
  if (emailList.length) {
    const mailOptions = {
      from: `"Kayan Jewelry 💍" <${process.env.SENDEMAIL}>`,
      to: emailList,
      subject: `💎 Price Drop: ${productName} now only $${newPrice}!`,
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `📩 Sent price drop email notifications to ${emailList.length} users for "${productName}".`
    );
  }
};

//===> send reminder
export async function sendReminderEmail({
  to,
  petName,
  type,
  title,
  remindAt,
}) {
  if (!to) {
    console.error("❌ Reminder Email Error: No recipient defined");
    return;
  }

  const htmlTemplate = `
    <div style="font-family: 'Poppins', sans-serif; background-color: #fdf9f3; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 15px; 
                  overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background-color: #709775; color: #fff; text-align: center; padding: 20px;">
          <h2 style="margin: 0; font-size: 22px;">🐾 Pet Care Reminder</h2>
        </div>

        <!-- Body -->
        <div style="padding: 25px;">
          <p style="font-size: 16px; color: #333;">Hi dear Pet Owner,</p>

          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            This is a friendly reminder about your pet:
          </p>

          <div style="background-color: #fdf3e7; border-radius: 10px; padding: 15px; margin: 20px 0;">
            <p><strong>🐶 Pet:</strong> ${petName}</p>
            <p><strong>📌 Type:</strong> ${type}</p>
            <p><strong>📝 Title:</strong> ${title}</p>
            <p><strong>⏰ Remind At:</strong> ${new Date(
              remindAt
            ).toLocaleString()}</p>
          </div>

          <p style="font-size: 14px; color: #888; text-align: center;">
            — Pet Clinic Reminder System 🐾
          </p>
        </div>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"Pets Clinic 🐾" <${process.env.SENDEMAIL}>`,
    to,
    subject: `🐾 Reminder: ${title}`,
    html: htmlTemplate,
  });

  console.log(`📩 Reminder email sent to ${to}:`, info.messageId);
  return info;
}


export async function sendAppointmentReminder(reservation) {
  const html = `
  <div style="font-family:Poppins;background:#f2f8ff;padding:30px;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:15px;overflow:hidden;
    box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <div style="background:#709775;color:#fff;text-align:center;padding:20px;">
        <h2 style="margin:0;font-size:22px;">⏰ Appointment Reminder — BETCLINIC</h2>
      </div>

      <div style="padding:25px; line-height:1.7;">
        <p style="font-size:16px;color:#333;">Hello ${reservation.petOwner.userName} 👋</p>

        <p style="font-size:15px;color:#555;">
          This is a friendly reminder that your pet has an appointment in <strong>2 hours</strong>.
        </p>

        <div style="background:#e7f2ff;border-radius:12px;padding:20px;margin:20px 0;">
          <p><strong>📅 Date:</strong> ${reservation.date.toDateString()}</p>
          <p><strong>⏰ Time:</strong> ${reservation.timeSlot}</p>
          <p><strong>👨‍⚕️ Doctor:</strong> ${reservation?.doctor?.userName || "Any available doctor"}</p>
        </div>

        <p style="color:#777;font-size:14px;">
          Please arrive 10 minutes earlier.  
          <br/>We look forward to caring for your furry friend 🐶🐱
        </p>
      </div>

      <div style="background:#bfd8bd;color:#fff;text-align:center;padding:15px;font-size:14px;">
        BETCLINIC Veterinary Care — Always Here For Your Pets 🐾
      </div>

    </div>
  </div>`;

  await transporter.sendMail({
    from: `"BETCLINIC 🐶🐱" <${process.env.SENDEMAIL}>`,
    to: reservation.petOwner.email,
    subject: "⏰ Your Pet Appointment Reminder — BETCLINIC",
    html
  });

  console.log("Reminder email sent →", reservation.petOwner.email);
}
