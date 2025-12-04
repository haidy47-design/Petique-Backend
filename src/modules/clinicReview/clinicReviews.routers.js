import { Router } from "express";
import * as clinicReviewControllers from "./clinicReview.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";

const clinicReviewRouter = Router();

clinicReviewRouter.post(
  "/",
  isAuthenticated,
  clinicReviewControllers.addClinicReview
);

clinicReviewRouter.get(
  "/user",
  isAuthenticated,
  clinicReviewControllers.getUserClinicReviews
);

// admin route
clinicReviewRouter.get(
  "/",
  isAuthenticated,
  clinicReviewControllers.getAllClinicReviews
);
clinicReviewRouter.post(
  "/contact/:reviewId",
  isAuthenticated,
  clinicReviewControllers.contactClinicReviewUser
);
clinicReviewRouter.get(
  "/whatsapp/:reviewId",
  isAuthenticated,
  clinicReviewControllers.contactClinicReviewUserWhatsApp
);
clinicReviewRouter.get(
  "/:id",
  isAuthenticated,
  clinicReviewControllers.getClinicReviewById
);

clinicReviewRouter.get(
  "/target/:targetType/:targetId",
  isAuthenticated,
  clinicReviewControllers.getClinicReviewsForTarget
);

clinicReviewRouter.delete(
  "/:id",
  isAuthenticated,
  clinicReviewControllers.deleteClinicReview
);

clinicReviewRouter.put(
  "/soft/:id",
  isAuthenticated,
  clinicReviewControllers.softDeleteClinicReview
);

export default clinicReviewRouter;
