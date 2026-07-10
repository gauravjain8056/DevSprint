import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AttachmentService } from "../services/attachment.service.js";

const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const file = req.file;

  if (!file) {
    throw new ApiError(400, "File is required");
  }

  const attachment = await AttachmentService.uploadAttachment(
    req.user.id,
    taskId,
    file.path,
    file.mimetype,
    file.size
  );

  return res.status(201).json(new ApiResponse(201, { attachment }, "Attachment uploaded successfully"));
});

const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { attachmentId } = req.params;

  await AttachmentService.deleteAttachment(req.user.id, attachmentId);

  return res.status(200).json(new ApiResponse(200, {}, "Attachment deleted successfully"));
});

export { uploadAttachment, deleteAttachment };
