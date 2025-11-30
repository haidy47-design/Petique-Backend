// import schedule from "node-schedule";
// import Reminder from "../../database/models/reminder.model.js";
// import { sendReminderEmail } from "../utils/emails/email.js";

// console.log("⏳ Reminder Scheduler Started...");

// schedule.scheduleJob("*/5 * * * *", async () => {
//   try {
//     //==> find reminders where time has passed & not sent yet
//     const reminders = await Reminder.find({
//       remindAt: { $lte: new Date() },
//       isSent: false,
//     })
//       .populate("petOwner", "email userName")
//       .populate("pet", "name");

//     if (!reminders.length) {
//       return;
//     }

//     for (const reminder of reminders) {
//       const user = reminder.petOwner;
//       const pet = reminder.pet;

//       if (!user || !user.email) {
//         continue;
//       }
//       // ===> Send Email
//       await sendReminderEmail({
//         to: user.email,
//         petName: pet?.name || "Your Pet",
//         type: reminder.type,
//         title: reminder.title,
//         remindAt: reminder.remindAt,
//       });

//       //===> mark reminder as sent
//       reminder.isSent = true;
//       await reminder.save();
//     }
//   } catch (err) {
//     console.error("Error in reminder scheduler:", err);
//   }
// });
