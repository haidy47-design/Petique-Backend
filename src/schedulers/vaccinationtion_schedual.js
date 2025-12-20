import schedule from "node-schedule";
import Vaccination from "../../database/models/vaccination.model.js";
import Pet from "../../database/models/pet.model.js";
import { sendReminderEmail } from "../sendReminderEmail.js";

export const startVaccinationReminderScheduler = () => {
  schedule.scheduleJob("0 * * * *", async () => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const pets = await Pet.find({ isDeleted: false })
      .populate("petOwner", "email");

    const vaccinations = await Vaccination.find({ isDeleted: false });

    for (const pet of pets) {
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

    console.log("⏰ Vaccination reminder job executed");
  });
};
