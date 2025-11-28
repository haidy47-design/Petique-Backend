import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import User from "../../../database/models/user.model.js";
import { messages } from "../../utils/constant/messages.js";

// ==> generate QR Code with expiration
export const generateQr = catchAsyncError(async (req, res, next) => {
  try {
    // ==> create a signed token with expiry
    const token = jwt.sign(
      { type: "qr", user: req.authUser?._id || null },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    // ==> react home page URL with token
    const url = `${process.env.FRONTEND_URL}/?token=${token}`;

    // ==> generate QR code image (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(url);

    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      expiresIn: "1h",
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
});

// validate QR Token
export const validateQr = catchAsyncError(async (req, res, next) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    res.status(200).json({ valid: true, data: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: "QR expired or invalid" });
  }
});

export const generateLoginQr = catchAsyncError(async (req, res, next) => {
  try {
    const token = jwt.sign(
      { type: "qr-login", userId: req.authUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    const url = `${process.env.FRONTEND_URL}/qr-login?token=${token}`;
    const qrCode = await QRCode.toDataURL(url);

    res.status(200).json({ success: true, qrCode, expiresIn: "1h" });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
});

export const validateLoginQr = catchAsyncError(async (req, res, next) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded.type !== "qr-login") {
      return next(new AppError("Invalid QR type", 400));
    }

    const user = await User.findById(decoded.userId);
    if (!user) return next(new AppError(messages.user.notFound, 404));

    // generate normal access token
    const accessToken = await generateToken({
      payload: { _id: user._id, email: user.email, role: user.role },
    });

    await User.findByIdAndUpdate(user._id, { isActive: true });

    return res.json({
      message: "QR login successful",
      success: true,
      accessToken,
    });
  } catch (err) {
    return next(new AppError("QR expired or invalid", 401));
  }
});
