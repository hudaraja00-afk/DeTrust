import { prisma } from '../config/database';
import { notificationService } from '../services/notification.service';
import { trustScoreService } from '../services/trustScore.service';
import { escrowService } from '../services/escrow.service';
import { emitDisputeResolved } from '../events/dispute.events';

/**
 * Dispute Auto-Resolution Job
 *
 * Runs hourly to check for disputes where the 7-day voting deadline has passed.
 * If enough votes have been cast (>= MIN_JURORS), auto-resolves based on tallies.
 * If not enough voters, notifies admin to direct-resolve as fallback.
 *
 * SRS: 7-day voting deadline (FR-P2), auto-approve pattern (FR-J6.2).
 */

let disputeJobInterval: ReturnType<typeof setInterval> | null = null;

const MIN_JURORS = 3;

/**
 * Check and auto-resolve expired voting disputes.
 */
async function checkExpiredDisputeVoting(): Promise<void> {
  console.log('[DisputeJob] Checking for expired voting disputes...');

  try {
    // Find disputes in VOTING status where deadline has passed
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
      console.log('[DisputeJob] No expired voting disputes found.');
      return;
    }

    for (const dispute of expiredDisputes) {
      try {
        const voteCount = dispute.votes.length;

        if (voteCount < MIN_JURORS) {
          // Not enough voters — notify admin to direct-resolve
          console.log(
            `[DisputeJob] Dispute ${dispute.id}: Only ${voteCount}/${MIN_JURORS} votes — notifying admin for manual resolution.`,
          );

          // Find admin users to notify
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

        // Enough votes — auto-resolve based on tallies
        const outcome =
          dispute.clientVotes > dispute.freelancerVotes
            ? 'CLIENT_WINS'
            : dispute.freelancerVotes > dispute.clientVotes
              ? 'FREELANCER_WINS'
              : 'SPLIT';

        console.log(
          `[DisputeJob] Auto-resolving dispute ${dispute.id}: ${outcome} (client=${dispute.clientVotes}, freelancer=${dispute.freelancerVotes})`,
        );

        // Update dispute + contract/milestones in a single transaction
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
            // SPLIT → return to active for renegotiation
            await tx.contract.update({
              where: { id: dispute.contractId },
              data: { status: 'ACTIVE' },
            });
          }
        });

        // On-chain resolution (non-blocking)
        escrowService.resolveDisputeOnChain(dispute.contractId, outcome).then((txHash) => {
          if (txHash) {
            prisma.dispute.update({
              where: { id: dispute.id },
              data: { resolutionTxHash: txHash },
            }).catch((err) => console.error('[DisputeJob] Failed to store tx hash:', err));
          }
        }).catch((err) => {
          console.error(`[DisputeJob] On-chain resolution failed for ${dispute.id}:`, err);
        });

        // Notify both parties
        const { clientId, freelancerId, title } = dispute.contract;
        const outcomeText =
          outcome === 'CLIENT_WINS' ? 'in favor of the client'
          : outcome === 'FREELANCER_WINS' ? 'in favor of the freelancer'
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
        console.error(`[DisputeJob] Failed to process dispute ${dispute.id}:`, error);
      }
    }

    console.log(`[DisputeJob] Processed ${expiredDisputes.length} expired dispute(s).`);
  } catch (error) {
    console.error('[DisputeJob] Job failed:', error);
  }
}

/**
 * Start the dispute auto-resolution job.
 * Runs every hour (and 60s after startup).
 */
export function startDisputeJob(): void {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Run shortly after startup (60s delay to let DB connect)
  setTimeout(() => {
    checkExpiredDisputeVoting().catch(console.error);
  }, 60_000);

  // Then run every hour
  disputeJobInterval = setInterval(() => {
    checkExpiredDisputeVoting().catch(console.error);
  }, INTERVAL_MS);

  console.log('[DisputeJob] Scheduled dispute auto-resolution check every 1h');
}

/**
 * Stop the dispute auto-resolution job.
 */
export function stopDisputeJob(): void {
  if (disputeJobInterval) {
    clearInterval(disputeJobInterval);
    disputeJobInterval = null;
    console.log('[DisputeJob] Stopped');
  }
}
