import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

export class ProfileService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  static async updateProfile(userId: string, data: any) {
    const { fullName } = data;
    if (!fullName || fullName.trim() === "") {
      throw new ApiError(400, "Full name is required");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { fullName },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  static async updateAvatar(userId: string, localFilePath: string) {
    if (!localFilePath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    const cloudinaryResponse = await uploadOnCloudinary(localFilePath);
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }

    if (!cloudinaryResponse || !cloudinaryResponse.url) {
      throw new ApiError(500, "Error while uploading avatar to Cloudinary");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: cloudinaryResponse.url },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
