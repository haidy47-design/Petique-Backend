import Reminder from "../../../database/models/reminder.model.js";
import Pet from "../../../database/models/pet.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";

// ===> Add reminder
export const addReminder = catchAsyncError(async (req, res, next) => {
  const { pet, type, title, remindAt } = req.body;

  const petData = await Pet.findById(pet);
  if (!petData) return next(new AppError("Pet not found", 404));

  if (
    petData.petOwner.toString() !== req.authUser._id.toString() &&
    req.authUser.role !== "admin"
  ) {
    return next(new AppError("Unauthorized", 403));
  }

  const reminder = await Reminder.create({
    pet,
    petOwner: req.authUser._id,
    type,
    title,
    remindAt,
  });

  res.status(201).json({
    success: true,
    message: "Reminder created",
    data: reminder,
  });
});

// ===> get all reminders for user
// export const getUserReminders = catchAsyncError(async (req, res, next) => {
//   const reminders = await Reminder.find({ petOwner: req.authUser._id });

//   res.status(200).json({
//     success: true,
//     message: "user reminders",
//     count: reminders.length,
//     data: reminders,
//   });
// });
// ===> get all reminders for the logged-in user WITH API FEATURE
export const getUserReminders = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeature(
    Reminder.find({ petOwner: req.authUser._id }).populate({
      path: "pet",
      select: ["name", "age", "image"],
    }),
    req.query
  )
    .filter()
    .search()
    .pagination()
    .sort()
    .select();

  const reminders = await apiFeature.mongooseQuery;

  const totalDocuments = await Reminder.countDocuments({
    petOwner: req.authUser._id,
  });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.size) || 100;
  const numberOfPages = Math.ceil(totalDocuments / limit);

  res.status(200).json({
    success: true,
    message: "User reminders",
    count: reminders.length,
    metadata: {
      currentPage: page,
      limit,
      numberOfPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < numberOfPages ? page + 1 : null,
    },
    data: reminders,
  });
});

// ===> update reminder
export const updateReminder = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const reminder = await Reminder.findById(id);
  if (!reminder) return next(new AppError("Reminder not found", 404));

  if (
    reminder.petOwner.toString() !== req.authUser._id.toString() &&
    req.authUser.role !== "admin"
  ) {
    return next(new AppError("Unauthorized", 403));
  }

  ["type", "title", "remindAt"].forEach((f) => {
    if (req.body[f] !== undefined) reminder[f] = req.body[f];
  });

  await reminder.save();

  res
    .status(200)
    .json({ success: true, message: "Reminder updated", data: reminder });
});

// ===> delete reminder
export const deleteReminder = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const reminder = await Reminder.findById(id);
  if (!reminder) return next(new AppError("Reminder not found", 404));

  if (
    reminder.petOwner.toString() !== req.authUser._id.toString() &&
    req.authUser.role !== "admin"
  ) {
    return next(new AppError("Unauthorized", 403));
  }

  await Reminder.findByIdAndDelete(id);

  res
    .status(200)
    .json({ success: true, message: "Reminder deleted", data: reminder });
});
