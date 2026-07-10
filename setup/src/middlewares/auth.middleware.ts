import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../config/prisma.js";

interface JwtPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyJWT = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken.id,
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
