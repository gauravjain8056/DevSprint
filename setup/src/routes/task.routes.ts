import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTask,
  getTasksOfProject,
  getTask,
  updateTask,
  deleteTask
} from "../controllers/task.controller.js";

const router = Router();

router.use(verifyJWT);

// Routes specific to a project's tasks
router.route("/project/:projectId").post(createTask).get(getTasksOfProject);

// Routes for a specific task
router.route("/:taskId").get(getTask).patch(updateTask).delete(deleteTask);

export default router;
