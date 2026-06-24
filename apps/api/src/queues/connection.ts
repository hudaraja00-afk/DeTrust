import { ConnectionOptions } from 'bullmq';

import { config } from '../config';

/**
 * Shared BullMQ Redis connection options.
 *
 * BullMQ creates its own ioredis instances internally; we just
 * provide the connection URL.  Using the same URL as the app-level
 * Redis keeps everything on one server while avoiding maxRetriesPerRequest
 * conflicts (BullMQ requires `null` for that setting, so it must NOT
 * share the same ioredis instance as the cache layer).
 */
export const bullmqConnection: ConnectionOptions = {
  url: config.redis.url,
  // BullMQ requires maxRetriesPerRequest = null (or undefined)
  maxRetriesPerRequest: null,
};
