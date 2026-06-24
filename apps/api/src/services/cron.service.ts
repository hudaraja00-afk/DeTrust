import { prisma } from '../config/database';
import { getIO } from '../config/socket';
import { notificationService } from './notification.service';

let cronInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Auto-approve milestones that have been in SUBMITTED status for over 7 days
 * without client action (per SRS FR-J6.2).
 */
async function autoApproveStaleMilestones() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const staleMilestones = await prisma.milestone.findMany({
      where: {
        status: 'SUBMITTED',
        updatedAt: { lt: sevenDaysAgo },
      },
      include: {
        contract: {
          select: {
            id: true,
            clientId: true,
            freelancerId: true,
            title: true,
            status: true,
          },
        },
      },
    });

    for (const milestone of staleMilestones) {
      if (milestone.contract.status !== 'ACTIVE') continue;

      await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });

      // Notify both parties
      await notificationService.createNotification({
        userId: milestone.contract.clientId,
        type: 'MILESTONE_AUTO_APPROVED',
        title: 'Milestone Auto-Approved',
        message: `Milestone "${milestone.title}" was automatically approved after the 7-day review period expired.`,
        data: { contractId: milestone.contractId, milestoneId: milestone.id },
      });

      await notificationService.createNotification({
        userId: milestone.contract.freelancerId,
        type: 'MILESTONE_AUTO_APPROVED',
        title: 'Milestone Auto-Approved',
        message: `Milestone "${milestone.title}" was automatically approved after the 7-day review period.`,
        data: { contractId: milestone.contractId, milestoneId: milestone.id },
      });

      // Push WebSocket event
      const io = getIO();
      if (io) {
        io.to(`user:${milestone.contract.clientId}`)
          .to(`user:${milestone.contract.freelancerId}`)
          .emit('contract:status', {
            contractId: milestone.contractId,
            milestoneId: milestone.id,
            status: 'APPROVED',
            updatedAt: new Date().toISOString(),
          });
      }

      console.log(`[cron] Auto-approved milestone "${milestone.title}" (${milestone.id})`);
    }

    if (staleMilestones.length > 0) {
      console.log(`[cron] Auto-approved ${staleMilestones.length} stale milestone(s)`);
    }
  } catch (error) {
    console.error('[cron] Error in autoApproveStaleMilestones:', error);
  }
}

/**
 * Start all cron jobs. Called once from server.ts after DB/Redis are ready.
 */
export function startCronJobs() {
  // Run auto-approve check every hour
  cronInterval = setInterval(autoApproveStaleMilestones, 60 * 60 * 1000);

  // Run once immediately on startup
  autoApproveStaleMilestones();

  console.log('[cron] Milestone auto-approve job started (runs every 1h)');
}

/**
 * Stop all cron jobs. Called during graceful shutdown.
 */
export function stopCronJobs() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[cron] Cron jobs stopped');
  }
}
