import { transporter } from "./email.js";

export const sendContactMail = async ({
  fullName,
  email,
  message,
  category,
  urgency,
  petAge,
}) => {
  const supportEmail = process.env.SUPPORT_EMAIL || "yumnamohamed30@gmail.com";

  //==> admin templete
  const adminHtml = `
  <div style="font-family: 'Poppins', sans-serif; background-color: #eef7ff; padding: 30px;">
    <div style="max-width: 650px; margin: auto; background-color: #ffffff; border-radius: 18px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); overflow: hidden;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #709775, #bfd8bd); color: #fff; padding: 28px; text-align: center;">
        <h2 style="margin: 0; font-size: 26px; font-weight: 600;">🐾 PETCLINIC SUPPORT — New Inquiry</h2>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        <p style="font-size: 17px; color: #333;">
          You have received a new contact request from <b>${fullName}</b>.
        </p>

        <!-- Details Box -->
        <div style="margin-top: 25px; background-color: #f3faff; padding: 22px; border-radius: 14px; border: 1px solid #d6eaff;">
          <p><b>👤 Name:</b> ${fullName}</p>
          <p><b>📧 Email:</b> <a href="mailto:${email}" style="color:#709775">${email}</a></p>
          <p><b>📂 Category:</b> ${category || "general"}</p>
          <p><b>🚨 Urgency:</b> ${urgency || "low"}</p>
          <p><b>🐶 Pet Age:</b> ${petAge || "Not provided"}</p>

          <p style="margin-top: 12px; line-height: 1.7;">
            <b>💬 Message:</b><br/>
            ${message}
          </p>
        </div>

        <p style="margin-top: 30px; font-size: 14px; color: #7d7d7d; text-align: center;">
          Please respond to the client as soon as possible.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #eef7ff; color: #666; text-align: center; padding: 22px; font-size: 13px;">
        <p style="margin: 0;">Sent by <b>PETCLINIC Veterinary Center</b></p>
      </div>

    </div>
  </div>
  `;

  // ==> send to admin
  await transporter.sendMail({
    from: `"PETCLINIC 🐾" <${process.env.SENDEMAIL}>`,
    to: supportEmail,
    subject: `🐾 New Contact Message from ${fullName}`,
    html: adminHtml,
  });

  //==> send replay to user
  const userReplyHtml = `
  <div style="font-family: 'Poppins', sans-serif; background-color: #eef7ff; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 18px; text-align: center; padding: 32px; box-shadow: 0 8px 20px rgba(0,0,0,0.08);">

      <h2 style="color: #709775; font-size: 26px; margin-bottom: 15px;">
        Thank You, ${fullName}! 🐾
      </h2>

      <p style="font-size: 16px; color: #555; line-height: 1.7;">
        We’ve received your message and our veterinary support team  
        will reach out to you shortly.
      </p>

      <div style="background-color: #f3faff; margin-top: 25px; padding: 20px; border-radius: 14px; border: 1px solid #d6eaff; text-align:left;">
        <p><b>📂 Category:</b> ${category}</p>
        <p><b>🚨 Urgency:</b> ${urgency}</p>
        <p><b>🐶 Pet Age:</b> ${petAge || "Not provided"}</p>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #7d7d7d;">
        We are always here to keep your pets safe, happy & healthy 🩺💚  
        — PETCLINIC Veterinary Center
      </p>

    </div>
  </div>
  `;

  // Send auto-reply to user
  await transporter.sendMail({
    from: `"PETCLINIC 🐾" <${process.env.SENDEMAIL}>`,
    to: email,
    subject: "🐾 Thank You for Contacting PETCLINIC",
    html: userReplyHtml,
  });
};
