import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export class AuthService {
  static async generateAccessAndRefreshTokens(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY as string,
      }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY as string,
      }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  static async registerUser(data: any) {
    const { fullName, email, password } = data;

    const existedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existedUser) {
      throw new ApiError(409, "User with email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
      },
    });

    const { accessToken, refreshToken } = await this.generateAccessAndRefreshTokens(user.id);

    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, email: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });

    return { user: createdUser, accessToken, refreshToken };
  }

  static async loginUser(data: any) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await this.generateAccessAndRefreshTokens(user.id);

    const loggedInUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, fullName: true, email: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });

    return { user: loggedInUser, accessToken, refreshToken };
  }

  static async logoutUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  static async refreshAccessToken(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.generateAccessAndRefreshTokens(user.id);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
