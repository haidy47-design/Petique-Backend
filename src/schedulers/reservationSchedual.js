import schedule from "node-schedule";
import Reservation from "../../database/models/reservation.model.js";
import { sendReminderEmail } from "../sendReminderEmail.js";

export const startReminderScheduler = () => {
  schedule.scheduleJob("0 * * * *", async () => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // today range
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
        appointmentDateTime.setHours(Number(hour), Number(minute), 0, 0);

        // check 2 hours window
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
        console.error("❌ Failed to send reservation reminder:", err);
      }
    }

    console.log("⏰ Reservation reminder job executed");
  });
};
