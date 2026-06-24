import { Job, Worker } from 'bullmq';

import { prisma } from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

const JUROR_MIN_TRUST_SCORE = 50;
const BATCH_SIZE = 10;

export interface JurorNotificationData {
  disputeId: string;
  contractId: string;
  contractTitle: string;
  clientId: string;
  freelancerId: string;
}

/**
 * Notify all eligible jurors (trust score >= 50) about a dispute voting phase.
 * Replaces the fire-and-forget `notifyEligibleJurors()` in DisputeService.
 */
async function processJurorNotification(job: Job<JurorNotificationData>): Promise<void> {
  const { disputeId, contractId, contractTitle, clientId, freelancerId } = job.data;

  // Find freelancer profiles with trust score ≥ threshold
  const freelancerJurors = await prisma.freelancerProfile.findMany({
    where: {
      trustScore: { gte: JUROR_MIN_TRUST_SCORE },
      userId: { notIn: [clientId, freelancerId] },
    },
    select: { userId: true },
    take: 50,
  });

  // Find client profiles with trust score ≥ threshold
  const clientJurors = await prisma.clientProfile.findMany({
    where: {
      trustScore: { gte: JUROR_MIN_TRUST_SCORE },
      userId: { notIn: [clientId, freelancerId] },
    },
    select: { userId: true },
    take: 50,
  });

  // Deduplicate
  const jurorIds = [
    ...new Set([
      ...freelancerJurors.map((j) => j.userId),
      ...clientJurors.map((j) => j.userId),
    ]),
  ];

  if (jurorIds.length === 0) {
    console.log(`[JurorNotifWorker] No eligible jurors for dispute ${disputeId}`);
    return;
  }

  console.log(`[JurorNotifWorker] Notifying ${jurorIds.length} jurors for dispute ${disputeId}`);

  for (let i = 0; i < jurorIds.length; i += BATCH_SIZE) {
    const batch = jurorIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((userId) =>
        notificationService.createNotification({
          userId,
          type: 'DISPUTE_VOTING',
          title: 'Juror Needed: New Dispute Voting',
          message: `A dispute on "${contractTitle}" needs community jurors. Your trust score qualifies you to vote.`,
          data: { disputeId, contractId, role: 'juror' },
        }),
      ),
    );
  }
}

export function createJurorNotificationWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.JUROR_NOTIFICATION,
    processJurorNotification,
    {
      connection: bullmqConnection,
      concurrency: 2,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[JurorNotifWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[JurorNotifWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
