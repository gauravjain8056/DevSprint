import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AuthService } from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  if ([fullName, email, password].some((field) => !field || field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const { user, accessToken, refreshToken } = await AuthService.registerUser({
    fullName,
    email,
    password,
  });

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(201, { user, accessToken, refreshToken }, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { user, accessToken, refreshToken } = await AuthService.loginUser({
    email,
    password,
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user, accessToken, refreshToken }, "User logged in successfully")
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await AuthService.logoutUser(req.user.id);
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshAccessToken(incomingRefreshToken);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed"
      )
    );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
