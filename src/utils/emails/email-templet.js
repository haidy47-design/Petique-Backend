export const emailtemplet = (token, otpCode) => {
  return `
  <div style="font-family: 'Poppins', sans-serif; background-color: #eef7ff; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 18px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); overflow: hidden;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #709775, #bfd8bd); color: #fff; padding: 28px; text-align: center;">
        <h2 style="margin: 0; font-size: 26px; font-weight: 600;">🐾 BETCLINIC</h2>
        <p style="margin: 6px 0 0; font-size: 15px; opacity: 0.9;">
          Caring for Your Pets with Love & Expertise
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        <p style="font-size: 17px; color: #333; margin-bottom: 12px;">
          Hello Pet Parent, 🐶🐱
        </p>

        <p style="font-size: 15px; color: #555; line-height: 1.7;">
          Thank you for choosing <b>BETCLINIC Veterinary Services</b>.  
          To verify your email and complete your account setup, please use the code below or click the verification button.
        </p>

        <!-- OTP Box -->
        <div style="margin: 30px auto; background-color: #f3faff; padding: 25px; border-radius: 14px; border: 1px solid #d6eaff; text-align: center;">
          <h3 style="margin: 0; color: #709775; font-size: 30px; letter-spacing: 4px; font-weight: 700;">
            ${otpCode}
          </h3>
          <p style="margin-top: 10px; font-size: 13px; color: #7a8899;">
            🔒 This code expires in <b>10 minutes</b>.
          </p>
        </div>

        <!-- Verification Button -->
        <div style="text-align: center; margin-top: 35px;">
          <a href="http://localhost:3000/auth/verify/${encodeURIComponent(token)}"
            style="
              background: linear-gradient(135deg, #709775, #bfd8bd);
              color: #fff;
              text-decoration: none;
              padding: 14px 35px;
              border-radius: 40px;
              font-size: 17px;
              font-weight: 600;
              display: inline-block;
              box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            ">
            Verify Your Email
          </a>
        </div>

        <p style="margin-top: 35px; font-size: 14px; color: #7d7d7d; text-align: center; line-height: 1.6;">
          If you did not request this, feel free to ignore this message.  
          We are always here to keep your pets safe & healthy 🩺💚
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #eef7ff; color: #666; text-align: center; padding: 22px; font-size: 13px;">
        <p style="margin: 0;">Sent with ❤️ by <b>BETCLINIC Veterinary Center</b></p>
        <p style="margin-top: 7px;">
          <a href="https://betclinic.com" target="_blank" style="color: #709775; text-decoration: none; font-weight: 600;">
            Visit Our Website
          </a>
        </p>
      </div>

    </div>
  </div>
  `;
};
