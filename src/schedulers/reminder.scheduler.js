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

import schedule from "node-schedule";
import Reservation from "../../database/models/reservation.model.js";
import Vaccination from "../../database/models/vaccination.model.js";
import Pet from "../../database/models/pet.model.js";
import { sendReminderEmail } from "../utils/emails/email.js";

console.log("⏰ Reminder scheduler initialized");

// ===> runs every hour at minute 0
schedule.scheduleJob("0 * * * *", async () => {
  try {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // ==> reservation reminder

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const reservations = await Reservation.find({
      isDeleted: false,
      status: { $in: ["pending", "confirmed"] },
      date: { $gte: startOfToday, $lte: endOfTomorrow },
    })
      .populate("petOwner", "email")
      .populate("pet", "name type");

    for (const resv of reservations) {
      try {
        // timeSlot example: "10:00 - 11:00"
        const startTime = resv.timeSlot.split("-")[0].trim(); // "10:00"
        const [hour, minute] = startTime.split(":");

        const appointmentDateTime = new Date(resv.date);
        appointmentDateTime.setHours(
          Number(hour),
          Number(minute),
          0,
          0
        );

        if (
          appointmentDateTime > now &&
          appointmentDateTime <= twoHoursLater
        ) {
          await sendReminderEmail({
            to: resv.petOwner.email,
            petName: resv.pet.name,
            type: "Reservation",
            title: "Upcoming Appointment",
            remindAt: appointmentDateTime,
          });

          console.log(
            `📩 Reservation reminder sent → ${resv.petOwner.email}`
          );
        }
      } catch (err) {
        console.error("❌ Reservation reminder failed:", err);
      }
    }

    //==> vaccination

    const pets = await Pet.find({ isDeleted: false }).populate(
      "petOwner",
      "email"
    );

    const vaccinations = await Vaccination.find({ isDeleted: false });

    for (const pet of pets) {
      if (!pet.DOB) continue;

      for (const vac of vaccinations) {
        for (const dose of vac.doses) {
          const doseDate = new Date(pet.DOB);
          doseDate.setDate(doseDate.getDate() + dose.ageInWeeks * 7);

          if (doseDate > now && doseDate <= twoHoursLater) {
            try {
              await sendReminderEmail({
                to: pet.petOwner.email,
                petName: pet.name,
                type: "Vaccination",
                title: `${vac.name} - Dose ${dose.doseNumber}`,
                remindAt: doseDate,
              });

              console.log(
                `💉 Vaccination reminder sent → ${pet.petOwner.email}`
              );
            } catch (err) {
              console.error("❌ Vaccination reminder failed:", err);
            }
          }
        }
      }
    }

    console.log("✅ Reminder scheduler cycle completed");
  } catch (err) {
    console.error("❌ Reminder scheduler fatal error:", err);
  }
});
