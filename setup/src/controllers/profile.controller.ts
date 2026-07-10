import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProfileService } from "../services/profile.service.js";

const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const profile = await ProfileService.getProfile(req.user.id);

  return res
    .status(200)
    .json(new ApiResponse(200, { user: profile }, "Profile fetched successfully"));
});

const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const updatedProfile = await ProfileService.updateProfile(req.user.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, { user: updatedProfile }, "Profile updated successfully"));
});

const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const updatedUser = await ProfileService.updateAvatar(req.user.id, avatarLocalPath);

  return res
    .status(200)
    .json(new ApiResponse(200, { user: updatedUser }, "Avatar updated successfully"));
});

export { getProfile, updateProfile, uploadAvatar };
