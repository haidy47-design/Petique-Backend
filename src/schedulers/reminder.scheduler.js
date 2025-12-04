// import schedule from "node-schedule";
// import Reminder from "../../database/models/reminder.model.js";
// import { sendReminderEmail } from "../utils/emails/email.js";
// import Reservation from "../../database/models/reservation.model.js";


// console.log("⏳ Reminder Scheduler Started...");

// schedule.scheduleJob("0 * * * *", async () => {
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

// //////////////////////////////////////////////////////////////
// export const startReminderScheduler = () => {
//   schedule.scheduleJob("0 * * * *", async () => {
//     const now = new Date();
//     const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

//     const reservations = await Reservation.find({
//       isDeleted: false,
//       status: "pending",
//       date: {
//         $eq: twoHoursLater.toISOString().split("T")[0], 
//       },
//     }).populate("petOwner", "email").populate("pet", "name type");

//     for (const resv of reservations) {
//       try {
//         await sendReminderEmail({
//           to: resv.petOwner.email,
//           petName: resv.pet.name,
//           type: resv.pet.type,
//           title: "Upcoming Appointment",
//           remindAt: resv.date,
//         });
//       } catch (err) {
//         console.error("Failed to send reminder:", err);
//       }
//     }

//     console.log("📩 Reminder scheduler executed at", now.toISOString());
//   });
// };
