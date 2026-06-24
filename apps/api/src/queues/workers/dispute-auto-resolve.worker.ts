import { Job, Worker } from 'bullmq';

import { prisma } from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { trustScoreService } from '../../services/trustScore.service';
import { escrowService } from '../../services/escrow.service';
import { emitDisputeResolved } from '../../events/dispute.events';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

const MIN_JURORS = 3;

/**
 * Process a single expired dispute that has passed its voting deadline.
 * If ≥ MIN_JURORS votes exist → auto-resolve based on tallies.
 * Otherwise → notify admins for manual resolution.
 */
async function processDisputeAutoResolve(_job: Job): Promise<void> {
  console.log('[DisputeWorker] Checking for expired voting disputes...');

  const expiredDisputes = await prisma.dispute.findMany({
    where: {
      status: 'VOTING',
      votingDeadline: { lt: new Date() },
    },
    include: {
      contract: {
        select: {
          id: true,
          title: true,
          totalAmount: true,
          clientId: true,
          freelancerId: true,
          milestones: { select: { id: true, status: true } },
        },
      },
      votes: true,
    },
  });

  if (expiredDisputes.length === 0) {
    console.log('[DisputeWorker] No expired voting disputes found.');
    return;
  }

  for (const dispute of expiredDisputes) {
    try {
      const voteCount = dispute.votes.length;

      if (voteCount < MIN_JURORS) {
        console.log(
          `[DisputeWorker] Dispute ${dispute.id}: Only ${voteCount}/${MIN_JURORS} votes — notifying admin.`,
        );

        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        for (const admin of admins) {
          await notificationService.createNotification({
            userId: admin.id,
            type: 'DISPUTE_VOTING',
            title: 'Dispute Voting Expired — Needs Manual Resolution',
            message: `Voting on dispute for "${dispute.contract.title}" ended with only ${voteCount} of ${MIN_JURORS} required votes. Please resolve manually.`,
            data: {
              disputeId: dispute.id,
              contractId: dispute.contractId,
              voteCount,
              requiredVotes: MIN_JURORS,
            },
          });
        }

        continue;
      }

      // Enough votes → auto-resolve
      const outcome =
        dispute.clientVotes > dispute.freelancerVotes
          ? 'CLIENT_WINS'
          : dispute.freelancerVotes > dispute.clientVotes
            ? 'FREELANCER_WINS'
            : 'SPLIT';

      console.log(
        `[DisputeWorker] Auto-resolving dispute ${dispute.id}: ${outcome} (client=${dispute.clientVotes}, freelancer=${dispute.freelancerVotes})`,
      );

      await prisma.$transaction(async (tx: any) => {
        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: 'RESOLVED',
            outcome: outcome as any,
            resolution: `Auto-resolved by voting: ${dispute.clientVotes} weighted votes for client, ${dispute.freelancerVotes} weighted votes for freelancer. ${voteCount} jurors participated.`,
            resolvedAt: new Date(),
          },
        });

        const unpaidMilestoneIds = dispute.contract.milestones
          .filter((m: { status: string }) => m.status !== 'PAID' && m.status !== 'APPROVED')
          .map((m: { id: string }) => m.id);

        if (outcome === 'CLIENT_WINS') {
          await tx.contract.update({
            where: { id: dispute.contractId },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          });
          if (unpaidMilestoneIds.length > 0) {
            await tx.milestone.updateMany({
              where: { id: { in: unpaidMilestoneIds } },
              data: { status: 'PENDING' },
            });
          }
        } else if (outcome === 'FREELANCER_WINS') {
          const allPaid = dispute.contract.milestones.every(
            (m: { status: string }) => m.status === 'PAID' || m.status === 'APPROVED',
          );
          await tx.contract.update({
            where: { id: dispute.contractId },
            data: { status: allPaid ? 'COMPLETED' : 'ACTIVE' },
          });
          const submittedIds = dispute.contract.milestones
            .filter((m: { status: string }) => m.status === 'SUBMITTED' || m.status === 'DISPUTED')
            .map((m: { id: string }) => m.id);
          if (submittedIds.length > 0) {
            await tx.milestone.updateMany({
              where: { id: { in: submittedIds } },
              data: { status: 'PAID', approvedAt: new Date(), paidAt: new Date() },
            });
          }
        } else {
          await tx.contract.update({
            where: { id: dispute.contractId },
            data: { status: 'ACTIVE' },
          });
        }
      });

      // On-chain resolution (non-blocking — will retry via blockchain-retry queue if it fails)
      escrowService
        .resolveDisputeOnChain(dispute.contractId, outcome)
        .then((txHash) => {
          if (txHash) {
            prisma.dispute
              .update({ where: { id: dispute.id }, data: { resolutionTxHash: txHash } })
              .catch((err) => console.error('[DisputeWorker] Failed to store tx hash:', err));
          }
        })
        .catch((err) => {
          console.error(`[DisputeWorker] On-chain resolution failed for ${dispute.id}:`, err);
        });

      // Notify both parties
      const { clientId, freelancerId, title } = dispute.contract;
      const outcomeText =
        outcome === 'CLIENT_WINS'
          ? 'in favor of the client'
          : outcome === 'FREELANCER_WINS'
            ? 'in favor of the freelancer'
            : 'as a split decision';

      for (const userId of [clientId, freelancerId]) {
        await notificationService.createNotification({
          userId,
          type: 'DISPUTE_RESOLVED',
          title: 'Dispute Auto-Resolved',
          message: `The dispute on "${title}" has been automatically resolved ${outcomeText} after the voting deadline passed.`,
          data: { disputeId: dispute.id, contractId: dispute.contractId, outcome },
        });
      }

      emitDisputeResolved(clientId, freelancerId, dispute.id, outcome);

      // Recalculate trust scores for both parties
      trustScoreService.getTrustScoreBreakdown(clientId).catch(console.error);
      trustScoreService.getTrustScoreBreakdown(freelancerId).catch(console.error);
    } catch (error) {
      console.error(`[DisputeWorker] Failed to process dispute ${dispute.id}:`, error);
    }
  }

  console.log(`[DisputeWorker] Processed ${expiredDisputes.length} expired dispute(s).`);
}

export function createDisputeAutoResolveWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.DISPUTE_AUTO_RESOLVE,
    processDisputeAutoResolve,
    {
      connection: bullmqConnection,
      concurrency: 1, // Only one dispute check at a time
    },
  );

  worker.on('completed', (job) => {
    console.log(`[DisputeWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[DisputeWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
