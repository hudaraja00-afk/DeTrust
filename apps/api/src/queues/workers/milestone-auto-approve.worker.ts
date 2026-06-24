import { Job, Worker } from 'bullmq';

import { prisma } from '../../config/database';
import { getIO } from '../../config/socket';
import { notificationService } from '../../services/notification.service';
import { bullmqConnection } from '../connection';
import { QUEUE_NAMES } from '../queue-names';

/**
 * Auto-approve milestones that have been SUBMITTED for > 7 days
 * without client action (SRS FR-J6.2).
 */
async function processMilestoneAutoApprove(_job: Job): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
      data: { status: 'APPROVED', approvedAt: new Date() },
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

    console.log(`[MilestoneWorker] Auto-approved milestone "${milestone.title}" (${milestone.id})`);
  }

  if (staleMilestones.length > 0) {
    console.log(`[MilestoneWorker] Auto-approved ${staleMilestones.length} stale milestone(s)`);
  }
}

export function createMilestoneAutoApproveWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.MILESTONE_AUTO_APPROVE,
    processMilestoneAutoApprove,
    {
      connection: bullmqConnection,
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[MilestoneWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[MilestoneWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
