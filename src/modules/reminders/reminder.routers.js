import { Router } from "express";
import { isAuthenticated } from "../../middelwares/auth.js";
import * as reminderController from "./reminder.controllers.js";

const reminderRouter = Router();

reminderRouter.post("/", isAuthenticated, reminderController.addReminder);
reminderRouter.get("/", isAuthenticated, reminderController.getUserReminders);
reminderRouter.put("/:id", isAuthenticated, reminderController.updateReminder);
reminderRouter.delete("/:id", isAuthenticated, reminderController.deleteReminder);

export default reminderRouter;
