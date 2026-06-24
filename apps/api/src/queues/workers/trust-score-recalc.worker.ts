import { Job, Worker } from 'bullmq';
import { Prisma } from '@prisma/client';

import { prisma } from '../../config/database';
import { trustScoreService } from '../../services/trustScore.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

/**
 * Daily full recalculation of all trust scores.
 * Records history entries for trend tracking (SRS FE-4).
 */
async function processTrustScoreRecalc(_job: Job): Promise<void> {
  console.log('[TrustScoreWorker] Starting trust score recalculation...');

  // Recalculate freelancer scores
  const freelancers = await prisma.freelancerProfile.findMany({
    select: { userId: true },
  });

  let freelancerCount = 0;
  for (const f of freelancers) {
    try {
      const breakdown = await trustScoreService.computeFreelancerTrustScore(f.userId);

      if (breakdown.eligible && breakdown.totalScore !== null) {
        await prisma.trustScoreHistory.create({
          data: {
            userId: f.userId,
            score: breakdown.totalScore,
            breakdown: breakdown.components as unknown as Prisma.InputJsonValue,
          },
        });
      }

      freelancerCount++;
    } catch (err) {
      console.error(`[TrustScoreWorker] Failed for freelancer ${f.userId}:`, err);
    }
  }

  // Recalculate client scores
  const clients = await prisma.clientProfile.findMany({
    select: { userId: true },
  });

  let clientCount = 0;
  for (const c of clients) {
    try {
      const breakdown = await trustScoreService.computeClientTrustScore(c.userId);

      if (breakdown.eligible && breakdown.totalScore !== null) {
        await prisma.trustScoreHistory.create({
          data: {
            userId: c.userId,
            score: breakdown.totalScore,
            breakdown: breakdown.components as unknown as Prisma.InputJsonValue,
          },
        });
      }

      clientCount++;
    } catch (err) {
      console.error(`[TrustScoreWorker] Failed for client ${c.userId}:`, err);
    }
  }

  console.log(
    `[TrustScoreWorker] Recalculated ${freelancerCount} freelancer + ${clientCount} client scores`,
  );
}

export function createTrustScoreRecalcWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.TRUST_SCORE_RECALC,
    processTrustScoreRecalc,
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[TrustScoreWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[TrustScoreWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
