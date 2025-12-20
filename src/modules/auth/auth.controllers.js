import useragent from "useragent";
import User from "../../../database/models/user.model.js";
import { messages } from "../../utils/constant/messages.js";
import { comparePass, hashedPass } from "../../utils/hash-compare.js";
import { sendEmail, sendResetPasswordMail } from "../../utils/emails/email.js";
import { generateToken, verifyToken } from "../../utils/token.js";
import { status } from "../../utils/constant/enums.js";
import Cart from "../../../database/models/cart.model.js";
import { generateOTP } from "../../utils/otp.js";
import Token from "../../../database/models/token.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { verifyGoogleAccessToken, verifyGoogleToken } from "../../utils/oAuth/googleAuth.js";
import loginActivity from "../../../database/models/loginActivity.js";
import notificationModel from "../../../database/models/notification.model.js";
import { ApiFeature } from "./../../utils/file-feature.js";

export const signup = catchAsyncError(async (req, res, next) => {
  let { userName, email, password, Cpassword, gender, mobileNumber } = req.body;

  const userExisting = await User.findOne({
    $or: [{ email }, { mobileNumber }],
  });
  if (userExisting) return next(new AppError(messages.user.alreadyExist, 409));

  if (password != Cpassword)
    return next(
      new AppError("password and confirmed password doesn't Match", 401)
    );

  const hashedpassword = hashedPass({
    password,
    saltRounds: Number(process.env.SALT_ROUNDS),
  });

  const { otpCode, otpExpire } = generateOTP();

  const user = new User({
    userName,
    email,
    password: hashedpassword,
    gender,
    mobileNumber,
    otpCode,
    otpExpire,
    passwordChangedAt: Date.now(),
  });

  let createdUser = await user.save();
  if (!createdUser) return next(new AppError(messages.user.failToCreate, 500));

  const token = await sendEmail(
    createdUser._id,
    createdUser.email,
    createdUser.role,
    otpCode
  );

  await Token.create({
    token,
    userId: createdUser._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  createdUser.password = undefined;

  return res.status(201).json({
    message: messages.user.createdSuccessfully,
    success: true,
    data: createdUser,
  });
});

//===> verify your account
export const verifyAccount = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const decoded = await verifyToken({
    token: req.params.token,
    secretKey: process.env.EMAIL_KEY,
  });

  if (!decoded || !decoded._id) {
    return next(new AppError("Invalid Token or Signature...", 401));
  }
  const user = await User.findOneAndUpdate(
    { _id: decoded._id, status: status.PENDING },
    {
      status: status.VERIFIED,
      isVerified: true,
      otpCode: null,
      otpExpire: null,
    },
    {
      new: true,
    }
  );
  if (!user) return next(new AppError(messages.user.notFound, 404));
  //create cart when verification
  await Cart.create({ user: user._id, products: [] });
  res.json({
    message: messages.user.verifiedSuccessfully,
    success: true,
    data: decoded.email,
  });
});

export const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { email, otpCode } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError(messages.user.notFound, 404));
  if (user.otpCode !== otpCode)
    return next(new AppError(messages.user.invalidOTP, 401));
  if (user.otpExpire < new Date())
    return next(new AppError(messages.user.expireOTP, 400));
  await User.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      otpCode: null,
      otpExpire: null,
      status: status.VERIFIED,
    },
    { new: true }
  );
  res.json({ message: messages.user.verifiedSuccessfully });
});

export const logIn = catchAsyncError(async (req, res, next) => {
  let { email, mobileNumber, password } = req.body;
  //check existance
  const userExist = await User.findOne({
    $or: [{ email }, { mobileNumber }],
    status: status.VERIFIED, //must verified to login
  });
  if (!userExist) {
    return next(new AppError(messages.user.invalidCredential, 401));
  }
  //check password
  const isMatch = comparePass({
    password: password.trim(),
    hashPass: userExist.password,
  });

  if (!isMatch) {
    return next(new AppError(messages.user.invalidCredential, 401));
  }

  if (userExist.status !== status.VERIFIED || userExist.otpCode != null) {
    return next(new AppError(messages.user.notVerified, 401));
  }

  await User.findByIdAndUpdate(userExist._id, {
    isActive: true,
    status: status.VERIFIED,
  });
  await userExist.save();

  const accessToken = await generateToken({
    payload: {
      _id: userExist._id,
      name: userExist.userName,
      email: userExist.email,
      role: userExist.role,
    },
  });
  await Token.create({
    token: accessToken,
    userId: userExist._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.json({
    message: messages.user.loggedInSuccessfully,
    success: true,
    accessToken,
  });
});

export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const userExist = await User.findOne({ email });
  //check existence
  if (!userExist) return next(new (messages.user.notFound, 404)());
  // if has otp
  if (userExist.otpCode && userExist.otpExpire > Date.now()) {
    return next(new AppError(messages.user.hasOTP), 404);
  }
  const { otpCode, otpExpire } = generateOTP();
  //update user OTP;
  userExist.otpCode = otpCode;
  userExist.otpExpire = otpExpire;
  await userExist.save();
  await sendResetPasswordMail(email, otpCode);
  // return res
  return res.json({ message: "check your email", success: true });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
  //get data from req
  const { otp, newPass, email } = req.body;
  //check email
  const user = await User.findOne({ email });
  if (!user) return next(new AppError(messages.user.notFound, 404));
  if (user.otpCode !== otp) return next(new AppError(messages.user.invalidOTP));
  if (user.otpExpire < Date.now()) {
    const { otpCode, otpExpire } = generateOTP();
    user.otpCode = otpCode;
    user.otpExpire = otpExpire;
    await user.save();
    await sendResetPasswordMail(email, otpCode);
    return res.status(200).json({ message: "check your email", success: true });
  }
  //hash new Password
  const hashPass = hashedPass({ password: newPass });
  await User.updateOne(
    { email },
    {
      password: hashPass,
      otpCode: null,
      otpExpire: null,
      passwordChangedAt: Date.now(),
    }
  );
  await Token.updateMany({ userId: user._id }, { isValid: false });

  const accessToken = await generateToken({
    payload: {
      _id: user._id,
      name: user.userName,
      email: user.email,
      role: user.role,
    },
  });

  await Token.create({
    token: accessToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return res.status(200).json({
    message: messages.password.updatedSuccessfully,
    success: true,
    accessToken,
  });
});

export const logout = catchAsyncError(async (req, res, next) => {
  const { _id } = req.authUser;
  //   const token = req.headers.authentication.split(" ")[1];
  const authHeader = req.headers.authentication;
  if (!authHeader) return next(new AppError("No token provided", 401));

  const token = authHeader.split(" ")[1];

  await User.findByIdAndUpdate(_id, {
    isActive: false,
  });
  await Token.findOneAndUpdate(
    { token },
    {
      isValid: false,
    }
  );
  res.status(200).json({
    message: messages.user.loggedOutSuccessfully,
    success: true,
  });
});

export const googleLogin = catchAsyncError(async (req, res, next) => {
  const { idToken, accessToken: googleAccessToken } = req.body;

  // ===> handle both idToken and accessToken for flexibility
  let googleUser;
  if (idToken) {
    googleUser = await verifyGoogleToken(idToken);
  } else if (googleAccessToken) {
    googleUser = await verifyGoogleAccessToken(googleAccessToken);
  } else {
    return next(new AppError("Google token is required (idToken or accessToken)", 400));
  }

  if (!googleUser || !googleUser.email_verified) {
    return next(new AppError("Invalid Google token", 401));
  }

  let user = await User.findOne({ email: googleUser.email });

  if (!user) {
    user = await User.create({
      userName: googleUser.name,
      email: googleUser.email,
      password: "User1",
      isVerified: true,
      status: status.VERIFIED,
      gender:"female",
      authProvider: "google",
      profileImage: googleUser.picture,
    });

    await Cart.create({ user: user._id, products: [] });
  }

  const accessToken = await generateToken({
    payload: {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
  });

  await Token.create({
    token: accessToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.status(200).json({
    message: "Logged in successfully with Google",
    success: true,
    accessToken,
    user,
  });
});
export const getLoginActivity = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeature(
    loginActivity.find({ user: req.authUser._id }),
    req.query
  )
    .sort() // sort handled inside ApiFeature (you can still default manually)
    .pagination();

  const totalLogs = await loginActivity.countDocuments({
    user: req.authUser._id,
  });
  const logs = await apiFeature.mongooseQuery.sort({ loggedAt: -1 }); // <-- default sort if none provided

  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const totalPages = Math.ceil(totalLogs / size);

  res.status(200).json({
    success: true,
    message: "Login activity fetched successfully",
    data: logs,
    meta: {
      totalLogs,
      page,
      size,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

export const getMyNotifications = catchAsyncError(async (req, res) => {
  const notifications = await notificationModel
    .find({
      user: req.authUser._id,
    })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({
    success: true,
    data: notifications,
  });
});

export const markNotificationAsRead = catchAsyncError(async (req, res) => {
  const { id } = req.params;

  await notificationModel.findByIdAndUpdate(id, { isRead: true });

  res.status(200).json({ success: true });
});
