import { Router } from "express";
import {  isAuthenticated, isAuthorized } from "../../middelwares/auth.js";
import * as reviewController from "./review.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { addReviewVal, updateReviewVal } from "./review.validation.js";
import { roles } from "../../utils/constant/enums.js";

const reviewRouter = Router();
reviewRouter.get("/userReviews", isAuthenticated, reviewController.getUserReviews);
reviewRouter.get("/", isAuthenticated, reviewController.getAllReviews);
reviewRouter.get(
  "/productReviews/:productId",
  isAuthenticated,
  reviewController.getProductReviews
);
reviewRouter.get("/:id", isAuthenticated, reviewController.getReviewById);

reviewRouter.post(
  "/",
  isAuthenticated,
  validate(addReviewVal),
  reviewController.addReview
);
reviewRouter.put(
  "/updateReview",
  isAuthenticated,
  validate(updateReviewVal),
  reviewController.updateReview
);
reviewRouter.post(
  "/contact-user/:reviewId",
  isAuthenticated,
  reviewController.contactReviewUser
);
reviewRouter.get(
  "/with-contacts/:productId",
  isAuthenticated,
  reviewController.getProductReviewsWithContacts
);
reviewRouter.delete(
  "/:id",
  isAuthenticated,
  reviewController.deleteReview
);

reviewRouter.put(
  "/:id",
  isAuthenticated,
  reviewController.softDeleteReview
);
export default reviewRouter;
