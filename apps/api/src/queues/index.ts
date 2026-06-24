import { Queue, Worker } from 'bullmq';

import { bullmqConnection } from './connection';
import { QUEUE_NAMES } from './queue-names';

// Worker factories
import { createDisputeAutoResolveWorker } from './workers/dispute-auto-resolve.worker';
import { createEmailDigestWorker } from './workers/email-digest.worker';
import { createMilestoneAutoApproveWorker } from './workers/milestone-auto-approve.worker';
import { createTrustScoreRecalcWorker } from './workers/trust-score-recalc.worker';
import { createBlockchainRetryWorker } from './workers/blockchain-retry.worker';
import { createReviewIpfsUploadWorker } from './workers/review-ipfs-upload.worker';
import { createTrustScoreUserWorker } from './workers/trust-score-user.worker';
import { createJurorNotificationWorker } from './workers/juror-notification.worker';
import { createEmailSendWorker } from './workers/email-send.worker';

// Re-export types for producers
export type { ReviewIpfsUploadData } from './workers/review-ipfs-upload.worker';
export type { TrustScoreUserData } from './workers/trust-score-user.worker';
export type { JurorNotificationData } from './workers/juror-notification.worker';
export type { EmailSendData } from './workers/email-send.worker';

// ── Queues (producers) ────────────────────────────────────────────────
// Repeatable / scheduled queues
export const disputeAutoResolveQueue = new Queue(QUEUE_NAMES.DISPUTE_AUTO_RESOLVE, {
  connection: bullmqConnection,
  defaultJobOptions: { removeOnComplete: 50, removeOnFail: 200 },
});

export const emailDigestQueue = new Queue(QUEUE_NAMES.EMAIL_DIGEST, {
  connection: bullmqConnection,
  defaultJobOptions: { removeOnComplete: 50, removeOnFail: 200 },
});

export const milestoneAutoApproveQueue = new Queue(QUEUE_NAMES.MILESTONE_AUTO_APPROVE, {
  connection: bullmqConnection,
  defaultJobOptions: { removeOnComplete: 50, removeOnFail: 200 },
});

export const trustScoreRecalcQueue = new Queue(QUEUE_NAMES.TRUST_SCORE_RECALC, {
  connection: bullmqConnection,
  defaultJobOptions: { removeOnComplete: 20, removeOnFail: 100 },
});

export const blockchainRetryQueue = new Queue(QUEUE_NAMES.BLOCKCHAIN_RETRY, {
  connection: bullmqConnection,
  defaultJobOptions: { removeOnComplete: 50, removeOnFail: 200 },
});

// On-demand queues
export const reviewIpfsUploadQueue = new Queue(QUEUE_NAMES.REVIEW_IPFS_UPLOAD, {
  connection: bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 }, // 30s → 60s → 120s
  },
});

export const trustScoreUserQueue = new Queue(QUEUE_NAMES.TRUST_SCORE_USER, {
  connection: bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 2,
    backoff: { type: 'fixed', delay: 5_000 },
  },
});

export const jurorNotificationQueue = new Queue(QUEUE_NAMES.JUROR_NOTIFICATION, {
  connection: bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 200,
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
  },
});

export const emailSendQueue = new Queue(QUEUE_NAMES.EMAIL_SEND, {
  connection: bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 500,
    attempts: 5,
    backoff: { type: 'exponential', delay: 15_000 }, // 15s → 30s → 60s → 120s → 240s
  },
});

// ── Workers (consumers) ───────────────────────────────────────────────
const workers: Worker[] = [];

/**
 * Register repeatable cron schedules and start all workers.
 * Call once after Redis is connected (in server.ts).
 */
export async function startQueues(): Promise<void> {
  // ── Repeatable schedules ──────────────────────────────────────────
  // Dispute auto-resolve: every hour
  await disputeAutoResolveQueue.upsertJobScheduler(
    'dispute-auto-resolve-hourly',
    { pattern: '0 * * * *' }, // every hour at :00
    { name: 'dispute-auto-resolve', data: {} },
  );

  // Email digest: every 15 minutes
  await emailDigestQueue.upsertJobScheduler(
    'email-digest-15min',
    { pattern: '*/15 * * * *' },
    { name: 'email-digest', data: {} },
  );

  // Milestone auto-approve: every hour
  await milestoneAutoApproveQueue.upsertJobScheduler(
    'milestone-auto-approve-hourly',
    { pattern: '5 * * * *' }, // :05 to avoid contention with dispute check
    { name: 'milestone-auto-approve', data: {} },
  );

  // Trust score recalculation: daily at 02:00 UTC
  await trustScoreRecalcQueue.upsertJobScheduler(
    'trust-score-daily',
    { pattern: '0 2 * * *' },
    { name: 'trust-score-recalc', data: {} },
  );

  // Blockchain retry: every 6 hours
  await blockchainRetryQueue.upsertJobScheduler(
    'blockchain-retry-6h',
    { pattern: '30 */6 * * *' }, // :30 past every 6th hour
    { name: 'blockchain-retry', data: {} },
  );

  // ── Start workers ─────────────────────────────────────────────────
  workers.push(
    createDisputeAutoResolveWorker(),
    createEmailDigestWorker(),
    createMilestoneAutoApproveWorker(),
    createTrustScoreRecalcWorker(),
    createBlockchainRetryWorker(),
    createReviewIpfsUploadWorker(),
    createTrustScoreUserWorker(),
    createJurorNotificationWorker(),
    createEmailSendWorker(),
  );

  console.log('🐂 BullMQ: All queues and workers started');
  console.log(`   → ${workers.length} workers active`);
  console.log('   → Repeatable schedules:');
  console.log('     • dispute-auto-resolve   : 0 * * * *      (hourly)');
  console.log('     • email-digest           : */15 * * * *   (every 15min)');
  console.log('     • milestone-auto-approve  : 5 * * * *      (hourly)');
  console.log('     • trust-score-recalc     : 0 2 * * *      (daily 02:00 UTC)');
  console.log('     • blockchain-retry       : 30 */6 * * *   (every 6h)');
}

/**
 * Gracefully close all workers and queues.
 * Call during server shutdown.
 */
export async function stopQueues(): Promise<void> {
  console.log('🐂 BullMQ: Shutting down workers and queues...');

  // Close workers first (they stop picking up new jobs and finish current ones)
  await Promise.all(workers.map((w) => w.close()));

  // Then close queues
  await Promise.all([
    disputeAutoResolveQueue.close(),
    emailDigestQueue.close(),
    milestoneAutoApproveQueue.close(),
    trustScoreRecalcQueue.close(),
    blockchainRetryQueue.close(),
    reviewIpfsUploadQueue.close(),
    trustScoreUserQueue.close(),
    jurorNotificationQueue.close(),
    emailSendQueue.close(),
  ]);

  console.log('🐂 BullMQ: All queues and workers stopped');
}
