/**
 * API Response Cache Service
 *
 * Wraps Redis cacheGet/cacheSet helpers with domain-specific cache keys
 * and TTL policies. Provides cache-aside pattern for expensive read operations.
 *
 * The admin dashboard, job listings, and user profiles are the heaviest endpoints;
 * caching them reduces Prisma round-trips and speeds up response delivery.
 */

import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from '../config/redis';

// ---------- Cache key generators ----------

const KEYS = {
  adminStats: () => 'cache:admin:stats',
  adminTrends: () => 'cache:admin:trends',
  adminActivity: (limit: number) => `cache:admin:activity:${limit}`,
  jobsList: (hash: string) => `cache:jobs:list:${hash}`,
  jobDetail: (id: string) => `cache:jobs:detail:${id}`,
  userProfile: (id: string) => `cache:user:profile:${id}`,
  trustScore: (userId: string) => `cache:trust:score:${userId}`,
  trustHistory: (userId: string, days: number) => `cache:trust:history:${userId}:${days}`,
  reviewSummary: (userId: string) => `cache:review:summary:${userId}`,
  skills: () => 'cache:skills:all',
  publicStats: () => 'cache:public:stats',
  publicFeaturedReviews: () => 'cache:public:featured-reviews',
} as const;

// ---------- TTL policies (seconds) ----------

const TTL = {
  /** Admin stats are relatively expensive (many COUNT queries) — cache 2 min */
  ADMIN_STATS: 120,
  /** Monthly trends rarely change — cache 10 min */
  ADMIN_TRENDS: 600,
  /** Recent activity — cache 30 s */
  ADMIN_ACTIVITY: 30,
  /** Job listings — cache 30 s (reflect new postings quickly) */
  JOBS_LIST: 30,
  /** Single job detail — cache 60 s */
  JOB_DETAIL: 60,
  /** User profile — cache 60 s */
  USER_PROFILE: 60,
  /** Trust score — cache 5 min (recalculated by BullMQ worker) */
  TRUST_SCORE: 300,
  /** Trust score history — cache 5 min */
  TRUST_HISTORY: 300,
  /** Review summary — cache 5 min */
  REVIEW_SUMMARY: 300,
  /** Skills list — cache 30 min (rarely changes) */
  SKILLS: 1800,
  /** Public landing page stats — cache 5 min (no auth, heavily hit) */
  PUBLIC_STATS: 300,
  /** Public featured reviews — cache 5 min */
  PUBLIC_FEATURED_REVIEWS: 300,
} as const;

// ---------- Cache-aside helpers ----------

/**
 * Generic cache-aside: return cached data if available, otherwise execute
 * the fetch function, cache the result, and return it.
 */
async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  // Fire-and-forget — don't block the response on cache write
  cacheSet(key, fresh, ttlSeconds).catch(() => {});
  return fresh;
}

// ---------- Domain-specific methods ----------

export const apiCache = {
  keys: KEYS,
  ttl: TTL,
  aside: cacheAside,

  // ---- Admin ----
  getAdminStats: <T>(fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.adminStats(), TTL.ADMIN_STATS, fetchFn),

  getAdminTrends: <T>(fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.adminTrends(), TTL.ADMIN_TRENDS, fetchFn),

  getAdminActivity: <T>(limit: number, fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.adminActivity(limit), TTL.ADMIN_ACTIVITY, fetchFn),

  // ---- Jobs ----
  getJobsList: <T>(queryHash: string, fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.jobsList(queryHash), TTL.JOBS_LIST, fetchFn),

  getJobDetail: <T>(id: string, fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.jobDetail(id), TTL.JOB_DETAIL, fetchFn),

  // ---- Users ----
  getUserProfile: <T>(id: string, fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.userProfile(id), TTL.USER_PROFILE, fetchFn),

  // ---- Trust score ----
  getTrustScore: <T>(userId: string, fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.trustScore(userId), TTL.TRUST_SCORE, fetchFn),

  getTrustHistory: <T>(userId: string, days: number, fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.trustHistory(userId, days), TTL.TRUST_HISTORY, fetchFn),

  // ---- Reviews ----
  getReviewSummary: <T>(userId: string, fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.reviewSummary(userId), TTL.REVIEW_SUMMARY, fetchFn),

  // ---- Skills ----
  getSkills: <T>(fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.skills(), TTL.SKILLS, fetchFn),

  // ---- Public (unauthenticated landing page) ----
  getPublicStats: <T>(fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.publicStats(), TTL.PUBLIC_STATS, fetchFn),

  getPublicFeaturedReviews: <T>(fetchFn: () => Promise<T>) =>
    cacheAside(KEYS.publicFeaturedReviews(), TTL.PUBLIC_FEATURED_REVIEWS, fetchFn),

  // ---------- Invalidation ----------

  /** Invalidate after job create/update/delete */
  invalidateJobs: async (jobId?: string) => {
    await cacheDeletePattern('cache:jobs:*');
    if (jobId) await cacheDelete(KEYS.jobDetail(jobId));
  },

  /** Invalidate after admin action (user status change, etc.) */
  invalidateAdminStats: async () => {
    await cacheDelete(KEYS.adminStats());
    await cacheDelete(KEYS.adminTrends());
    await cacheDeletePattern('cache:admin:activity:*');
  },

  /** Invalidate after user profile update */
  invalidateUser: async (userId: string) => {
    await cacheDelete(KEYS.userProfile(userId));
  },

  /** Invalidate after trust score recalculation */
  invalidateTrustScore: async (userId: string) => {
    await cacheDelete(KEYS.trustScore(userId));
    await cacheDeletePattern(`cache:trust:history:${userId}:*`);
  },

  /** Invalidate after review creation */
  invalidateReviews: async (userId: string) => {
    await cacheDelete(KEYS.reviewSummary(userId));
  },

  /** Invalidate after skill list changes */
  invalidateSkills: async () => {
    await cacheDelete(KEYS.skills());
  },

  /** Invalidate public stats (after contract/review/user changes) */
  invalidatePublicStats: async () => {
    await cacheDelete(KEYS.publicStats());
    await cacheDelete(KEYS.publicFeaturedReviews());
  },
} as const;

export default apiCache;
