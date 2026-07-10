import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { assist } from "../controllers/ai.controller.js";

const router = Router();

router.use(verifyJWT);
router.use(rateLimiter);

router.route("/assist").post(assist);

export default router;
