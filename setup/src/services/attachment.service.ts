import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

export class AttachmentService {
  static async uploadAttachment(userId: string, taskId: string, localFilePath: string, mimeType: string, size: number) {
    if (!localFilePath) {
      throw new ApiError(400, "File is missing");
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      fs.unlinkSync(localFilePath);
      throw new ApiError(404, "Task not found");
    }

    const projectAccess = await prisma.project.findFirst({
      where: {
        id: task.projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!projectAccess) {
      fs.unlinkSync(localFilePath);
      throw new ApiError(403, "You do not have access to this project");
    }

    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    if (!cloudinaryResponse || !cloudinaryResponse.url) {
      throw new ApiError(500, "Error while uploading file to Cloudinary");
    }

    const attachment = await prisma.attachment.create({
      data: {
        filename: cloudinaryResponse.original_filename || "attachment",
        url: cloudinaryResponse.url,
        publicId: cloudinaryResponse.public_id,
        mimeType,
        size,
        taskId,
        uploadedById: userId,
      },
    });

    const { RedisService } = await import("./redis.service.js");
    await RedisService.del(`project:${task.projectId}:tasks`);

    return attachment;
  }

  static async deleteAttachment(userId: string, attachmentId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          include: { project: true }
        }
      }
    });

    if (!attachment) {
      throw new ApiError(404, "Attachment not found");
    }

    const projectAccess = await prisma.project.findFirst({
      where: {
        id: attachment.task.projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!projectAccess) {
      throw new ApiError(403, "You do not have access to this project");
    }

    if (attachment.publicId) {
      await deleteFromCloudinary(attachment.publicId);
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    const { RedisService } = await import("./redis.service.js");
    await RedisService.del(`project:${attachment.task.projectId}:tasks`);

    return true;
  }
}
