import Token from "../../../database/models/token.model.js";
import User from "../../../database/models/user.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { roles, status } from "../../utils/constant/enums.js";
import { messages } from "../../utils/constant/messages.js";
import { ApiFeature } from "../../utils/file-feature.js";
import cloudinary from "../../utils/fileUpload/cloudinary.js";
import { deleteCloud } from "../../utils/fileUpload/file-functions.js";
import { comparePass, hashedPass } from "../../utils/hash-compare.js";

export const getProfile = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    message: "User data retrieved successfully",
    success: true,
    data: req.authUser,
  });
});

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const baseQuery = User.find({ status: { $ne: status.DELETED } });
  const apiFeature = new ApiFeature(baseQuery, req.query)
    .filter()
    .search()
    .sort()
    .select()
    .pagination();

  const totalUsers = await User.countDocuments({
    status: { $ne: status.DELETED },
  });

  const users = await apiFeature.mongooseQuery;
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const totalPages = Math.ceil(totalUsers / size);

  res.status(200).json({
    success: true,
    message: messages.user.fetchedSuccessfully,
    data: users,
    meta: {
      totalUsers,
      page,
      size,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, Cpassword } = req.body;
  const userId = req.authUser._id;

  const match = comparePass({
    password: oldPassword,
    hashPass: req.authUser.password,
  });
  if (!match) return next(new AppError(messages.password.notMatch));
  const user = await User.findById(userId);
  if (user.status == status.VERIFIED || user.otpCode !== null) {
    return next(new AppError(messages.user.notVerified, 401));
  }

  if (newPassword != Cpassword)
    return next(new AppError(messages.user.invalidCredential, 401));
  const hashPass = hashedPass(newPassword, Number(process.env.SALT_ROUNDS));
  let updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    {
      password: hashPass,
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );
  await Token.updateMany({ userId: user._id }, { isValid: false });

  updatedUser.password = undefined;
  res.status(200).json({
    message: messages.user.updatedSuccessfully,
    success: true,
    data: updatedUser,
  });
});

export const updateUserWithoutImages = catchAsyncError(
  async (req, res, next) => {
    const id = req.authUser._id;
    const { userName, mobileNumber, gender } = req.body;

    const user = await User.findById(id);
    if (!user) return next(new AppError(messages.user.notFound, 404));

    if (mobileNumber !== user.mobileNumber) {
      const mobileNumberUsed = await User.findOne({ mobileNumber });
      if (mobileNumberUsed)
        return next(new AppError("Mobile number is already in use", 409));
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      {
        userName,
        mobileNumber,
        gender,
      },
      { new: true }
    );

    if (!updatedUser) {
      return next(new AppError(messages.user.failToUpdate, 500));
    }
    updatedUser.password = undefined;
    res.status(200).json({
      message: messages.user.updatedSuccessfully,
      success: true,
      data: updatedUser,
    });
  }
);

export const updateUser = catchAsyncError(async (req, res, next) => {
  const id = req.authUser._id;
  const { userName, mobileNumber, gender, newPassword, confirmPassword } =
    req.body;

  let user = await User.findById(id);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  if (mobileNumber && mobileNumber !== user.mobileNumber) {
    const mobileNumberUsed = await User.findOne({
      mobileNumber,
      _id: { $ne: id },
    });
    if (mobileNumberUsed)
      return next(new AppError("Mobile number is already in use", 409));
  }

  if (req.file) {
    if (user.image?.public_id) {
      await deleteCloud(user.image.public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "ITI-REACT/users" }
    );

    user.image = { secure_url, public_id };
  }

  if (newPassword || confirmPassword) {
    if (!newPassword || !confirmPassword) {
      return next(
        new AppError("To change password, both fields are required.", 400)
      );
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    const hashPass = hashedPass(newPassword, Number(process.env.SALT_ROUNDS));
    user.password = hashPass;
    user.passwordChangedAt = Date.now();
  }

  // ===> Update other profile fields
  if (userName !== undefined) user.userName = userName;
  if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
  if (gender !== undefined) user.gender = gender;

  const updatedUser = await user.save();
  if (!updatedUser) return next(new AppError(messages.user.failToUpdate, 500));

  updatedUser.password = undefined;

  res.status(200).json({
    message: messages.user.updatedSuccessfully,
    success: true,
    data: updatedUser,
  });
});

export const deleteUserByUser = catchAsyncError(async (req, res, next) => {
  const id = req.authUser._id;
  const user = await User.findById(id);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  const deletedUser = await User.deleteOne({ _id: id });
  if (!deletedUser) {
    return next(new AppError(messages.user.failToDelete, 500));
  }
  res
    .status(200)
    .json({ message: messages.user.deletedSuccessfully, success: true });
});

export const softDeleteUserByUser = catchAsyncError(async (req, res, next) => {
  const id = req.authUser._id;
  const user = await User.findById(id);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  const softDeletedUser = await User.findByIdAndUpdate(
    id,
    { status: status.DELETED },
    { new: true }
  );
  if (!softDeletedUser) {
    return next(new AppError(messages.user.failToDelete, 500));
  }
  softDeletedUser.password = undefined;
  res.status(200).json({
    message: messages.user.deletedSuccessfully,
    success: true,
    data: softDeletedUser,
  });
});

//===> admins delete
export const updateUserByAdmin = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { userName, mobileNumber, gender, newPassword, confirmPassword } =
    req.body;

  const user = await User.findById(id);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  if (mobileNumber !== user.mobileNumber) {
    const mobileNumberUsed = await User.findOne({ mobileNumber });
    if (mobileNumberUsed)
      return next(new AppError("Mobile number is already in use", 409));
  }

  if (newPassword || confirmPassword) {
    if (!newPassword || !confirmPassword) {
      return next(
        new AppError("To change password, both fields are required.", 400)
      );
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    const hashPass = hashedPass(newPassword, Number(process.env.SALT_ROUNDS));
    user.password = hashPass;
    user.passwordChangedAt = Date.now();
  }

  // ===> Update other profile fields
  if (userName !== undefined) user.userName = userName;
  if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
  if (gender !== undefined) user.gender = gender;

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    {
      userName,
      mobileNumber,
      gender,
      newPassword,
      confirmPassword,
    },
    { new: true }
  );

  if (!updatedUser) {
    return next(new AppError(messages.user.failToUpdate, 500));
  }
  updatedUser.password = undefined;
  res.status(200).json({
    message: messages.user.updatedSuccessfully,
    success: true,
    data: updatedUser,
  });
});
export const deleteUser = catchAsyncError(async (req, res, next) => {
  const { id: userIdFromParams } = req.params;
  const authUser = req.authUser;

  const idToDelete =
    authUser.role === roles.ADMIN && userIdFromParams
      ? userIdFromParams
      : authUser._id;

  const user = await User.findById(idToDelete);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  const deletedUser = await User.deleteOne({ _id: idToDelete });
  if (!deletedUser) {
    return next(new AppError(messages.user.failToDelete, 500));
  }

  res.status(200).json({
    message: messages.user.deletedSuccessfully,
    success: true,
  });
});

export const softDeleteUser = catchAsyncError(async (req, res, next) => {
  const { id: userIdFromParams } = req.params;
  const authUser = req.authUser;

  const idToDelete =
    authUser.role === roles.ADMIN && userIdFromParams
      ? userIdFromParams
      : authUser._id;

  const user = await User.findById(idToDelete);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  const softDeletedUser = await User.findByIdAndUpdate(
    idToDelete,
    { status: status.DELETED },
    { new: true }
  );

  if (!softDeletedUser) {
    return next(new AppError(messages.user.failToDelete, 500));
  }

  softDeletedUser.password = undefined;

  res.status(200).json({
    message: messages.user.deletedSuccessfully,
    success: true,
    data: softDeletedUser,
  });
});

//====> analysis needed for user for dashboards
//==> 1- total user overview
export const getUsersOverview = catchAsyncError(async (req, res, next) => {
  const overview = await User.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalUsers = await User.countDocuments();
  //==> convert aggregation result into object
  const counts = overview.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      pendingUsers: counts[status.PENDING] || 0,
      verifiedUsers: counts[status.VERIFIED] || 0,
      blockedUsers: counts[status.BLOCKED] || 0,
      deletedUsers: counts[status.DELETED] || 0,
    },
  });
});
//===> 2- active and deActive users analysis
export const getDeletedUsersAnalysis = catchAsyncError(
  async (req, res, next) => {
    const deletedUsersHistory = await User.aggregate([
      { $match: { status: status.DELETED } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 },
          users: {
            $push: { _id: "$_id", email: "$email", userName: "$userName" },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const softDeletedCount = await User.countDocuments({
      status: status.DELETED,
    });
    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      totalUsers,
      totalSoftDeleted: softDeletedCount,
      history: deletedUsersHistory,
    });
  }
);
//===> 3- analysis for gender - age - role
export const getDemographics = catchAsyncError(async (req, res, next) => {
  const now = new Date();
  const demographics = await User.aggregate([
    {
      $facet: {
        gender: [{ $group: { _id: "$gender", count: { $sum: 1 } } }],
        roles: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
        ages: [
          {
            $project: {
              age: {
                $dateDiff: {
                  startDate: "$DOB",
                  endDate: now,
                  unit: "year",
                },
              },
            },
          },
          {
            $bucket: {
              groupBy: "$age",
              boundaries: [0, 18, 25, 35, 45, 60, 150],
              default: "unknown",
              output: { count: { $sum: 1 } },
            },
          },
        ],
      },
    },
  ]);

  const result = demographics[0];

  res.status(200).json({
    success: true,
    data: {
      gender: result.gender.reduce((a, b) => ({ ...a, [b._id]: b.count }), {}),
      roles: result.roles.reduce((a, b) => ({ ...a, [b._id]: b.count }), {}),
      ageGroups: result.ages.map((a) => ({
        range: a._id,
        count: a.count,
      })),
    },
  });
});

//////////////////////////////// Doctors ////////////////////////////////
// ==> get all doctors
export const getAllDoctors = catchAsyncError(async (req, res, next) => {
  const doctors = await User.find({ role: roles.DOCTORS }).select(
    "userName email"
  );

  res.status(200).json({
    success: true,
    data: doctors,
  });
});
// ==> add new doctor
export const addNewDoctor = catchAsyncError(async (req, res, next) => {
  const { userName, email, password, mobileNumber, gender } = req.body;

  // ===> 1- Check existing doctor by email or phone
  const existing = await User.findOne({
    $or: [{ email }, { mobileNumber }],
  });
  if (existing) return next(new AppError("Doctor already exists", 409));

  // ===> 2- Hash password
  const hashedPassword = hashedPass({
    password,
    saltRounds: Number(process.env.SALT_ROUNDS),
  });

  // ===> 3- upload image if attached
  let imageData = null;
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "ITI-REACT/doctors" }
    );
    imageData = { secure_url, public_id };
  }

  // ===> 4- create doctor
  const doctor = await User.create({
    userName,
    email,
    password: hashedPassword,
    mobileNumber,
    gender,
    image: imageData,
    role: roles.DOCTORS,
    status: status.VERIFIED,
    isVerified: true,
    passwordChangedAt: Date.now(),
  });

  doctor.password = undefined;

  res.status(201).json({
    message: "Doctor created successfully",
    success: true,
    data: doctor,
  });
});

// ==> soft delete doctor
export const softDeleteDoctor = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const doctor = await User.findOne({ _id: id, role: roles.DOCTORS });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  const softDeletedDoctor = await User.findByIdAndUpdate(
    id,
    { status: status.DELETED },
    { new: true }
  );

  if (!softDeletedDoctor)
    return next(new AppError("Failed to delete doctor", 500));

  softDeletedDoctor.password = undefined;

  res.status(200).json({
    success: true,
    message: "Doctor soft deleted successfully",
    data: softDeletedDoctor,
  });
});
// ==> hard delete doctor
export const deleteDoctor = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const doctor = await User.findOne({ _id: id, role: roles.DOCTORS });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  if (doctor.image?.public_id) {
    await deleteCloud(doctor.image.public_id);
  }

  const deleted = await User.deleteOne({ _id: id });
  if (!deleted) return next(new AppError("Failed to delete doctor", 500));

  res.status(200).json({
    success: true,
    message: "Doctor hard deleted successfully",
  });
});

// ==> update doctor profile (admin or doctor himself)
export const updateDoctor = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  let doctor = await User.findOne({ _id: id, role: roles.DOCTORS });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  const {
    userName,
    mobileNumber,
    gender,
    newPassword,
    confirmPassword,
    image,
  } = req.body;

  // ===> Check phone number uniqueness
  if (mobileNumber && mobileNumber !== doctor.mobileNumber) {
    const exists = await User.findOne({
      mobileNumber,
      _id: { $ne: id },
    });
    if (exists) return next(new AppError("Mobile number already used", 409));
  }

  // ===> Update image
  if (req.file) {
    if (doctor.image?.public_id) {
      await deleteCloud(doctor.image.public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "ITI-REACT/doctors" }
    );

    doctor.image = { secure_url, public_id };
  }

  // ===> Change password
  if (newPassword || confirmPassword) {
    if (!newPassword || !confirmPassword) {
      return next(new AppError("Both password fields required", 400));
    }
    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    doctor.password = hashedPass({
      password: newPassword,
      saltRounds: Number(process.env.SALT_ROUNDS),
    });

    doctor.passwordChangedAt = Date.now();
  }

  // ===> update basic fields
  if (userName !== undefined) doctor.userName = userName;
  if (mobileNumber !== undefined) doctor.mobileNumber = mobileNumber;
  if (gender !== undefined) doctor.gender = gender;

  const updatedDoctor = await doctor.save();
  updatedDoctor.password = undefined;

  res.status(200).json({
    success: true,
    message: "Doctor updated successfully",
    data: updatedDoctor,
  });
});
