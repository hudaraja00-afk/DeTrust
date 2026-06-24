import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { trustScoreService } from '../services/trustScore.service';

/**
 * Trust Score Background Job
 *
 * Periodically recalculates trust scores for all users with profiles.
 * Runs daily to ensure scores stay fresh even without on-demand triggers.
 * Also records trust score history entries for trend tracking (SRS FE-4).
 */

let trustScoreInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Recalculate trust scores for all freelancers and clients.
 */
async function recalculateAllTrustScores(): Promise<void> {
  console.log('[TrustScoreJob] Starting trust score recalculation...');

  try {
    // Recalculate freelancer scores
    const freelancers = await prisma.freelancerProfile.findMany({
      select: { userId: true },
    });

    let freelancerCount = 0;
    for (const f of freelancers) {
      try {
        const breakdown = await trustScoreService.computeFreelancerTrustScore(f.userId);

        // Only record history for eligible users (≥5 completed contracts)
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
        console.error(`[TrustScoreJob] Failed for freelancer ${f.userId}:`, err);
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

        // Only record history for eligible users (≥5 completed contracts)
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
        console.error(`[TrustScoreJob] Failed for client ${c.userId}:`, err);
      }
    }

    console.log(
      `[TrustScoreJob] Recalculated ${freelancerCount} freelancer + ${clientCount} client scores`,
    );
  } catch (error) {
    console.error('[TrustScoreJob] Batch recalculation failed:', error);
  }
}

/**
 * Start the trust score recalculation job.
 * Runs every 24 hours (and immediately on startup).
 */
export function startTrustScoreJob(): void {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Run immediately on startup (delayed 30s to let DB connect)
  setTimeout(() => {
    recalculateAllTrustScores().catch(console.error);
  }, 30_000);

  // Then run every 24 hours
  trustScoreInterval = setInterval(() => {
    recalculateAllTrustScores().catch(console.error);
  }, INTERVAL_MS);

  console.log('[TrustScoreJob] Scheduled trust score recalculation every 24h');
}

/**
 * Stop the trust score recalculation job.
 */
export function stopTrustScoreJob(): void {
  if (trustScoreInterval) {
    clearInterval(trustScoreInterval);
    trustScoreInterval = null;
    console.log('[TrustScoreJob] Stopped');
  }
}