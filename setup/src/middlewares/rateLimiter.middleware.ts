import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import redisClient from "../config/redis.js";

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_REQUESTS = 100; // 100 requests per minute

export const rateLimiter = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!redisClient.isOpen) {
      return next(); // Bypass if redis is down
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const key = `ratelimit:${ip}`;

    const currentRequests = await redisClient.incr(key);

    if (currentRequests === 1) {
      await redisClient.expire(key, WINDOW_SIZE_IN_SECONDS);
    }

    if (currentRequests > MAX_REQUESTS) {
      throw new ApiError(429, "Too many requests, please try again later.");
    }

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      console.error("Rate Limiter Error:", error);
      next(); // Fail open if Redis throws unexpected error
    }
  }
};
