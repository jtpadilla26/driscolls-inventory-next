// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key: string, value: any, ttl = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },
  
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(...keys);
    }
  },
};
