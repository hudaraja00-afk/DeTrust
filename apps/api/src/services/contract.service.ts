import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware';
import { getIO } from '../config/socket';
import { notificationService } from './notification.service';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

type ContractStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface GetContractsQuery {
  status?: ContractStatus;
  role?: 'client' | 'freelancer';
  page: number;
  limit: number;
  sort: 'createdAt' | 'totalAmount';
  order: 'asc' | 'desc';
}

export interface SubmitMilestoneInput {
  deliverableUrl?: string;
  deliverableHash?: string;
  deliverableNote?: string;
}

export interface FundEscrowInput {
  txHash: string;
  escrowAddress?: string;
  blockchainJobId?: string;
}

export class ContractService {
  private emitContractStatus(clientId: string, freelancerId: string, payload: Record<string, unknown>) {
    const io = getIO();
    if (io) {
      io.to(`user:${clientId}`).to(`user:${freelancerId}`).emit('contract:status', payload);
    }
  }

  /**
   * List contracts for a user
   */
  async listContracts(userId: string, query: GetContractsQuery) {
    const { status, role, page, limit, sort, order } = query;

    // Build where clause based on role
    let where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (role === 'client') {
      where.clientId = userId;
    } else if (role === 'freelancer') {
      where.freelancerId = userId;
    } else {
      where.OR = [{ clientId: userId }, { freelancerId: userId }];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              type: true,
              category: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              clientProfile: {
                select: {
                  companyName: true,
                  trustScore: true,
                  paymentVerified: true,
                },
              },
            },
          },
          freelancer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              freelancerProfile: {
                select: {
                  title: true,
                  trustScore: true,
                },
              },
            },
          },
          milestones: {
            orderBy: { orderIndex: 'asc' },
          },
          disputes: {
            select: {
              id: true,
              status: true,
              outcome: true,
              resolution: true,
              resolutionTxHash: true,
              resolvedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    // Calculate paidAmount for each contract
    const contractsWithPaidAmount = contracts.map((contract: { milestones: Array<{ status: string; amount: unknown }> }) => {
      const paidAmount = contract.milestones
        .filter((m: { status: string }) => m.status === 'PAID' || m.status === 'APPROVED')
        .reduce((sum: number, m: { amount: unknown }) => sum + Number(m.amount), 0);
      return { ...contract, paidAmount };
    });

    return {
      items: contractsWithPaidAmount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * List ALL contracts (admin view — no user-scoping).
   */
  async listAllContracts(query: GetContractsQuery) {
    const { status, page, limit, sort, order } = query;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          job: {
            select: { id: true, title: true, type: true, category: true },
          },
          client: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              clientProfile: {
                select: { companyName: true, trustScore: true, paymentVerified: true },
              },
            },
          },
          freelancer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              freelancerProfile: {
                select: { title: true, trustScore: true },
              },
            },
          },
          milestones: { orderBy: { orderIndex: 'asc' } },
          disputes: {
            select: {
              id: true, status: true, outcome: true, resolution: true,
              resolutionTxHash: true, resolvedAt: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    const contractsWithPaidAmount = contracts.map((contract: { milestones: Array<{ status: string; amount: unknown }> }) => {
      const paidAmount = contract.milestones
        .filter((m: { status: string }) => m.status === 'PAID' || m.status === 'APPROVED')
        .reduce((sum: number, m: { amount: unknown }) => sum + Number(m.amount), 0);
      return { ...contract, paidAmount };
    });

    return {
      items: contractsWithPaidAmount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            description: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            clientProfile: {
              select: {
                companyName: true,
                trustScore: true,
                paymentVerified: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            walletAddress: true,
            freelancerProfile: {
              select: {
                title: true,
                trustScore: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { orderIndex: 'asc' },
          include: {
            timeEntries: {
              orderBy: { date: 'asc' },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    // Only client or freelancer can view the contract
    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenError('You do not have permission to view this contract');
    }

    // Calculate paidAmount
    const paidAmount = contract.milestones
      .filter((m: { status: string }) => m.status === 'PAID' || m.status === 'APPROVED')
      .reduce((sum: number, m: { amount: unknown }) => sum + Number(m.amount), 0);

    return { ...contract, paidAmount };
  }

  /**
   * Submit milestone deliverable (freelancer only)
   */
  async submitMilestone(contractId: string, milestoneId: string, freelancerId: string, data: SubmitMilestoneInput) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    if (contract.freelancerId !== freelancerId) {
      throw new ForbiddenError('Only the freelancer can submit milestones');
    }

    if (contract.status !== 'ACTIVE') {
      throw new ForbiddenError('Escrow must be funded before submitting deliverables');
    }

    const milestone = contract.milestones.find((m: { id: string }) => m.id === milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    if (milestone.status !== 'PENDING' && milestone.status !== 'IN_PROGRESS' && milestone.status !== 'REVISION_REQUESTED') {
      throw new ForbiddenError('Milestone cannot be submitted in current status');
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        deliverableHash: data.deliverableHash || data.deliverableUrl,
        deliverableUrl: data.deliverableUrl,
        deliverableNote: data.deliverableNote,
      },
    });

    // Create notification for client (uses WebSocket push via notificationService)
    await notificationService.createNotification({
      userId: contract.clientId,
      type: 'MILESTONE_SUBMITTED',
      title: 'Milestone Submitted for Review',
      message: `Freelancer has submitted deliverables for milestone "${milestone.title}". You have 7 days to review.`,
      data: { contractId, milestoneId },
    });

    this.emitContractStatus(contract.clientId, contract.freelancerId, {
      contractId,
      milestoneId,
      status: 'SUBMITTED',
    });

    return updatedMilestone;
  }

  /**
   * Approve milestone (client only)
   */
  async approveMilestone(contractId: string, milestoneId: string, clientId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    if (contract.clientId !== clientId) {
      throw new ForbiddenError('Only the client can approve milestones');
    }

    const milestone = contract.milestones.find((m: { id: string }) => m.id === milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    if (milestone.status !== 'SUBMITTED') {
      throw new ForbiddenError('Only submitted milestones can be approved');
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Update milestone to APPROVED and then PAID (since we're simulating blockchain payment)
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'PAID',
          approvedAt: new Date(),
          paidAt: new Date(),
        },
      });

      // Check if all milestones are paid
      const allMilestonesPaid = contract.milestones.every(
        (m: { id: string; status: string }) => m.id === milestoneId || m.status === 'PAID'
      );

      if (allMilestonesPaid) {
        // Complete the contract
        await tx.contract.update({
          where: { id: contractId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Update job status
        await tx.job.update({
          where: { id: contract.jobId },
          data: { status: 'COMPLETED' },
        });

        // Update freelancer's completed jobs count
        await tx.freelancerProfile.update({
          where: { userId: contract.freelancerId },
          data: { completedJobs: { increment: 1 } },
        });
      }

      return updatedMilestone;
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: contract.freelancerId,
        type: 'MILESTONE_APPROVED',
        title: 'Milestone Approved & Paid!',
        message: `Milestone "${milestone.title}" has been approved. Payment released.`,
        data: { contractId, milestoneId, amount: Number(milestone.amount) },
      },
    });

    this.emitContractStatus(contract.clientId, contract.freelancerId, {
      contractId,
      milestoneId,
      status: 'PAID',
    });

    return result;
  }

  /**
   * Request revision (client only)
   */
  async requestRevision(contractId: string, milestoneId: string, clientId: string, reason: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    if (contract.clientId !== clientId) {
      throw new ForbiddenError('Only the client can request revisions');
    }

    const milestone = contract.milestones.find((m: { id: string }) => m.id === milestoneId);
    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    if (milestone.status !== 'SUBMITTED') {
      throw new ForbiddenError('Only submitted milestones can be revised');
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'REVISION_REQUESTED',
        revisionNote: reason,
        revisionCount: { increment: 1 },
      },
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: contract.freelancerId,
        type: 'MILESTONE_SUBMITTED',
        title: 'Revision Requested',
        message: `Client requested revisions for milestone "${milestone.title}"`,
        data: { contractId, milestoneId, reason },
      },
    });

    this.emitContractStatus(contract.clientId, contract.freelancerId, {
      contractId,
      milestoneId,
      status: 'REVISION_REQUESTED',
    });

    return updatedMilestone;
  }

  /**
   * Fund escrow (client only)
   */
  async fundEscrow(contractId: string, clientId: string, data: FundEscrowInput) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    if (contract.clientId !== clientId) {
      throw new ForbiddenError('Only the client can fund escrow');
    }

    if (contract.status !== 'PENDING') {
      throw new ForbiddenError('Contract escrow already funded or not in pending status');
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'ACTIVE',
        fundingTxHash: data.txHash,
        escrowAddress: data.escrowAddress,
        blockchainJobId: data.blockchainJobId,
      },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
      },
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: contract.freelancerId,
        type: 'CONTRACT_CREATED',
        title: 'Contract Funded!',
        message: `The escrow for "${contract.title}" has been funded. You can start working!`,
        data: { contractId },
      },
    });

    this.emitContractStatus(contract.clientId, contract.freelancerId, {
      contractId,
      status: 'ACTIVE',
    });

    return updatedContract;
  }

  /**
   * Complete contract (mark as complete when all milestones are done)
   */
  async completeContract(contractId: string, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenError('You do not have permission to complete this contract');
    }

    // Check all milestones are paid
    const allPaid = contract.milestones.every((m: { status: string }) => m.status === 'PAID');
    if (!allPaid) {
      throw new ValidationError('All milestones must be paid before completing the contract');
    }

    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return updatedContract;
  }

  /**
   * Raise dispute
   * @deprecated Use disputeService.createDispute() instead — this method lacks duplicate
   * checking, proper validation, and Socket.IO event emission. Kept for backward
   * compatibility; proxies to the canonical dispute service.
   */
  async raiseDispute(contractId: string, userId: string, reason: string, evidence?: string[]) {
    // Import lazily to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { disputeService } = require('./dispute.service');
    const dispute = await disputeService.createDispute(userId, {
      contractId,
      reason,
      description: reason,
      evidence,
    });
    return dispute;
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string, query: { page: number; limit: number }) {
    const { page, limit } = query;

    // Get all paid milestones for this user's contracts
    const where = {
      status: 'PAID' as const,
      contract: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
    };

    const [milestones, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              title: true,
              clientId: true,
              freelancerId: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
              freelancer: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.milestone.count({ where }),
    ]);

    // Transform into payment records
    const payments = milestones.map((m: { id: string; title: string; contractId: string; amount: { toString: () => string }; paidAt: Date | null; paymentTxHash: string | null; contract: { title: string; clientId: string; freelancerId: string; client: { id: string; name: string | null; avatarUrl: string | null } | null; freelancer: { id: string; name: string | null; avatarUrl: string | null } | null } }) => ({
      id: m.id,
      milestoneId: m.id,
      milestoneTitle: m.title,
      contractId: m.contractId,
      contractTitle: m.contract.title,
      amount: Number(m.amount),
      type: m.contract.freelancerId === userId ? 'incoming' : 'outgoing',
      status: 'completed' as const,
      paidAt: m.paidAt,
      txHash: m.paymentTxHash,
      from: m.contract.client,
      to: m.contract.freelancer,
    }));

    return {
      items: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Get total earnings/spending stats
   */
  async getPaymentStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'FREELANCER') {
      // Get total earnings
      const result = await prisma.milestone.aggregate({
        where: {
          status: 'PAID',
          contract: { freelancerId: userId },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Get pending earnings
      const pending = await prisma.milestone.aggregate({
        where: {
          status: { in: ['SUBMITTED', 'APPROVED'] },
          contract: { freelancerId: userId },
        },
        _sum: { amount: true },
      });

      return {
        totalEarnings: Number(result._sum.amount || 0),
        pendingEarnings: Number(pending._sum.amount || 0),
        completedPayments: result._count,
      };
    } else {
      // Get total spent
      const result = await prisma.milestone.aggregate({
        where: {
          status: 'PAID',
          contract: { clientId: userId },
        },
        _sum: { amount: true },
        _count: true,
      });

      // Get in escrow
      const escrow = await prisma.milestone.aggregate({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS', 'SUBMITTED'] },
          contract: { clientId: userId, status: 'ACTIVE' },
        },
        _sum: { amount: true },
      });

      return {
        totalSpent: Number(result._sum.amount || 0),
        inEscrow: Number(escrow._sum.amount || 0),
        completedPayments: result._count,
      };
    }
  }
}

export const contractService = new ContractService();
export default contractService;
