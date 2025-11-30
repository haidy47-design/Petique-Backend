import { Router } from "express";
import * as categoryController from "./animalCategory.controllers.js";
import { isAuthenticated } from "../../middelwares/auth.js";

const animalCategoryRouter = Router();

animalCategoryRouter.post("/", isAuthenticated, categoryController.addCategory);

//===> update animal category
animalCategoryRouter.put(
  "/:id",
  isAuthenticated,
  categoryController.updateCategory
);

//===> get all categories
animalCategoryRouter.get(
  "/",
  isAuthenticated,
  categoryController.getAllCategories
);

//===> get specific animal
animalCategoryRouter.get(
  "/:id",
  isAuthenticated,
  categoryController.getCategory
);

//===> soft delete
animalCategoryRouter.patch(
  "/soft-delete/:id",
  isAuthenticated,
  categoryController.softDeleteCategory
);

//===> hard delete
animalCategoryRouter.delete(
  "/:id",
  isAuthenticated,
  categoryController.deleteCategory
);

export default animalCategoryRouter;
