import clinicReviewModel from "../../database/models/clinicReview.model.js";
import Service from "../../database/models/service.model.js";
import User from "../../database/models/user.model.js";

export const recalcAvgRating = async ({ doctor, service }) => {
  if (doctor) {
    const ratings = await clinicReviewModel.find({
      doctor,
      isDeleted: { $ne: true },
    }).select("rate");

    const avg =
      ratings.length === 0
        ? 0
        : ratings.reduce((sum, r) => sum + r.rate, 0) / ratings.length;

    await User.findByIdAndUpdate(doctor, { doctorRating: avg });
  }

  if (service) {
    const ratings = await clinicReviewModel.find({
      service,
      isDeleted: { $ne: true },
    }).select("rate");

    const avg =
      ratings.length === 0
        ? 0
        : ratings.reduce((sum, r) => sum + r.rate, 0) / ratings.length;

    await Service.findByIdAndUpdate(service, { rate: avg });
  }
};
