import { Job, Worker } from 'bullmq';

import { trustScoreService } from '../../services/trustScore.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

export interface TrustScoreUserData {
  userId: string;
}

/**
 * Recalculate trust score for a single user.
 * Replaces fire-and-forget `trustScoreService.getTrustScoreBreakdown()`.
 */
async function processTrustScoreUser(job: Job<TrustScoreUserData>): Promise<void> {
  const { userId } = job.data;
  console.log(`[TrustScoreUserWorker] Recalculating trust score for user ${userId}`);
  await trustScoreService.getTrustScoreBreakdown(userId);
}

export function createTrustScoreUserWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.TRUST_SCORE_USER,
    processTrustScoreUser,
    {
      connection: bullmqConnection,
      concurrency: 5, // Multiple users can be recalculated in parallel
    },
  );

  worker.on('completed', (job) => {
    console.log(`[TrustScoreUserWorker] Job ${job.id} completed for user ${job.data.userId}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[TrustScoreUserWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
