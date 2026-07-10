import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getProfile, updateProfile, uploadAvatar } from "../controllers/profile.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getProfile).patch(updateProfile);
router.route("/avatar").patch(upload.single("avatar"), uploadAvatar);

export default router;
