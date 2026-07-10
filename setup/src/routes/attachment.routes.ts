import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadAttachment, deleteAttachment } from "../controllers/attachment.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/task/:taskId").post(upload.single("file"), uploadAttachment);
router.route("/:attachmentId").delete(deleteAttachment);

export default router;
