/**
 * @deprecated Legacy job files are replaced by BullMQ queues in `src/queues/`.
 *
 * This module is intentionally empty. The old setInterval-based jobs have been
 * migrated to BullMQ workers:
 *
 * - dispute.job.ts    → queues/workers/dispute-auto-resolve.worker.ts
 * - trustScore.job.ts → queues/workers/trust-score-recalc.worker.ts
 * - blockchain.job.ts → queues/workers/blockchain-retry.worker.ts
 * - cron.service.ts   → queues/workers/milestone-auto-approve.worker.ts
 *
 * On-demand queues (replacing fire-and-forget patterns):
 * - queues/workers/review-ipfs-upload.worker.ts
 * - queues/workers/trust-score-user.worker.ts
 * - queues/workers/juror-notification.worker.ts
 * - queues/workers/email-send.worker.ts
 *
 * All queue configuration and startup is in `src/queues/index.ts`.
 */
export {};
