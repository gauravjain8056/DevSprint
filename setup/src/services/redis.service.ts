import redisClient from "../config/redis.js";

export class RedisService {
  static async get<T>(key: string): Promise<T | null> {
    if (!redisClient.isOpen) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Redis Get Error:", error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error("Redis Set Error:", error);
    }
  }

  static async del(key: string): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error("Redis Del Error:", error);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error("Redis Invalidate Pattern Error:", error);
    }
  }
}
