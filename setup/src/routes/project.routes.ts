import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  listMembers
} from "../controllers/project.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createProject).get(getProjects);
router.route("/:projectId").get(getProject).patch(updateProject).delete(deleteProject);
router.route("/:projectId/members").get(listMembers).post(addMember);
router.route("/:projectId/members/:userId").delete(removeMember);

export default router;
