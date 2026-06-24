import rateLimit from 'express-rate-limit';

import { config } from '../config';
import { ApiErrorCode } from '@detrust/types';

/**
 * Default rate limiter
 */
export const defaultLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.isDev ? 1000 : config.rateLimit.max, // generous in dev, configurable in prod
  message: {
    success: false,
    error: {
      code: ApiErrorCode.RATE_LIMITED,
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window per endpoint
  keyGenerator: (req) => `${req.ip}:${req.path}`, // separate buckets per route
  message: {
    success: false,
    error: {
      code: ApiErrorCode.RATE_LIMITED,
      message: 'Too many attempts, please try again in 15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Very strict limiter for sensitive operations
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    success: false,
    error: {
      code: ApiErrorCode.RATE_LIMITED,
      message: 'Rate limit exceeded for this operation',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default defaultLimiter;
