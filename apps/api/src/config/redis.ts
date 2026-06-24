import Redis from 'ioredis';

import { config } from './index';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 200, 1000);
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
});

export const connectRedis = async (): Promise<void> => {
  if (redis.status === 'ready') {
    return;
  }
  
  return new Promise((resolve, reject) => {
    redis.once('ready', resolve);
    redis.once('error', reject);
  });
};

export const disconnectRedis = async (): Promise<void> => {
  await redis.quit();
  console.log('📤 Redis disconnected');
};

// Helper functions
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> => {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const cacheDeletePattern = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

export default redis;
