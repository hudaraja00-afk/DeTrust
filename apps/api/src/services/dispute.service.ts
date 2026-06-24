import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware';
import { notificationService } from './notification.service';
import { escrowService } from './escrow.service';
import { storageService } from './storage.service';
import { config } from '../config';
import { SecureFileCategory, SecureFileResourceType, SecureFileVisibility } from '@detrust/database';
import { jurorNotificationQueue, trustScoreUserQueue } from '../queues';
import { emitDisputeOpened, emitDisputeVotingStarted, emitDisputeResolved } from '../events/dispute.events';
import type {
  CreateDisputeInput,
  SubmitEvidenceInput,
  CastVoteInput,
  AdminResolveInput,
  GetDisputesQuery,
} from '../validators/dispute.validator';

// Voting window: 7 days (SRS)
const VOTING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Minimum trust score required to serve as a juror (SRS M4-I5)
const JUROR_MIN_TRUST_SCORE = 50;

export class DisputeService {
  /**
   * Create a dispute on an active, funded contract.
   * Only client or freelancer of the contract can initiate.
   */
  async createDispute(initiatorId: string, input: CreateDisputeInput) {
    const contract = await prisma.contract.findUnique({
      where: { id: input.contractId },
      select: {
        id: true,
        jobId: true,
        status: true,
        clientId: true,
        freelancerId: true,
        title: true,
        totalAmount: true,
        fundingTxHash: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    const isClient = contract.clientId === initiatorId;
    const isFreelancer = contract.freelancerId === initiatorId;

    if (!isClient && !isFreelancer) {
      throw new ForbiddenError('Only contract parties can initiate a dispute');
    }

    if (contract.status !== 'ACTIVE') {
      throw new ValidationError('Disputes can only be raised on active contracts');
    }

    // Check for existing open dispute on the same contract
    const existing = await prisma.dispute.findFirst({
      where: {
        contractId: input.contractId,
        status: { in: ['OPEN', 'VOTING'] },
      },
    });

    if (existing) {
      throw new ValidationError('An active dispute already exists for this contract');
    }

    // Create dispute and update contract status
    const dispute = await prisma.$transaction(async (tx: any) => {
      const d = await tx.dispute.create({
        data: {
          contractId: input.contractId,
          initiatorId,
          reason: input.reason,
          description: input.description,
          evidence: input.evidence ?? [],
          status: 'OPEN',
          outcome: 'PENDING',
        },
        include: {
          contract: { select: { id: true, title: true, totalAmount: true } },
          initiator: { select: { id: true, name: true } },
        },
      });

      await tx.contract.update({
        where: { id: input.contractId },
        data: { status: 'DISPUTED' },
      });

      // Also update the parent Job status to DISPUTED
      await tx.job.update({
        where: { id: contract.jobId },
        data: { status: 'DISPUTED' },
      }).catch(() => {
        // Job might not exist or id mismatch — non-critical
      });

      return d;
    });

    // Notify both parties
    const otherPartyId = isClient ? contract.freelancerId : contract.clientId;

    await notificationService.createNotification({
      userId: otherPartyId,
      type: 'DISPUTE_OPENED',
      title: 'Dispute Opened',
      message: `A dispute has been raised on "${contract.title}": ${input.reason}`,
      data: { disputeId: dispute.id, contractId: contract.id },
    });

    emitDisputeOpened(
      contract.clientId,
      contract.freelancerId,
      dispute.id,
      contract.title,
    );

    return dispute;
  }

  /**
   * Submit additional evidence to an open dispute.
   * Only contract parties can submit evidence.
   */
  async submitEvidence(
    userId: string,
    disputeId: string,
    input: SubmitEvidenceInput,
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: { select: { clientId: true, freelancerId: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    if (dispute.status !== 'OPEN') {
      throw new ValidationError('Evidence can only be submitted to open disputes');
    }

    const { clientId, freelancerId } = dispute.contract;
    if (userId !== clientId && userId !== freelancerId) {
      throw new ForbiddenError('Only contract parties can submit evidence');
    }

    const updatedEvidence = [...dispute.evidence, ...input.files];

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: { evidence: updatedEvidence },
      include: {
        contract: { select: { id: true, title: true, totalAmount: true } },
        initiator: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Upload evidence files to IPFS then attach the resulting CIDs/URLs to the dispute.
   * Multer files are uploaded via ipfsService.uploadFile().
   */
  async uploadEvidence(
    userId: string,
    disputeId: string,
    files: Express.Multer.File[],
    description: string,
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: { select: { clientId: true, freelancerId: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    if (dispute.status !== 'OPEN') {
      throw new ValidationError('Evidence can only be submitted to open disputes');
    }

    const { clientId, freelancerId } = dispute.contract;
    if (userId !== clientId && userId !== freelancerId) {
      throw new ForbiddenError('Only contract parties can submit evidence');
    }

    if (files.length > 5) {
      throw new ValidationError('Maximum 5 evidence files allowed per submission');
    }

    // Upload each file via storageService (same proven path as resume/certs)
    const baseUrl = config.server.apiUrl.replace(/\/$/, '');
    const uploadResults: { url: string; cid: string; fileName: string; fileSize: number }[] = [];

    for (const f of files) {
      const secureFile = await storageService.uploadSecureFile({
        buffer: f.buffer,
        filename: f.originalname || `evidence-${Date.now()}`,
        mimeType: f.mimetype,
        size: f.size,
        userId,
        category: SecureFileCategory.EVIDENCE,
        visibility: SecureFileVisibility.AUTHENTICATED,
        resourceType: SecureFileResourceType.DISPUTE,
        resourceId: disputeId,
      });
      uploadResults.push({
        url: `${baseUrl}/api/uploads/${secureFile.id}`,
        cid: secureFile.cid,
        fileName: f.originalname || secureFile.filename,
        fileSize: f.size,
      });
    }

    // Store URLs in the legacy evidence array
    const newEvidenceUrls = uploadResults.map((u) => u.url);
    const updatedEvidence = [...dispute.evidence, ...newEvidenceUrls];

    // Write structured DisputeEvidence records (with party attribution)
    await prisma.disputeEvidence.createMany({
      data: uploadResults.map((u) => ({
        disputeId,
        uploadedById: userId,
        url: u.url,
        cid: u.cid,
        fileName: u.fileName,
        fileSize: u.fileSize,
        description,
      })),
    });

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: { evidence: updatedEvidence },
      include: {
        contract: { select: { id: true, title: true, totalAmount: true } },
        initiator: { select: { id: true, name: true } },
        evidenceItems: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return updated;
  }

  /**
   * Admin transitions dispute from OPEN → VOTING.
   * In the hybrid model, admin can either resolve directly or open voting.
   */
  async startVoting(adminId: string, disputeId: string) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can start the voting phase');
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: { select: { clientId: true, freelancerId: true, title: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    if (dispute.status !== 'OPEN') {
      throw new ValidationError('Only open disputes can move to voting');
    }

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'VOTING',
        votingDeadline: new Date(Date.now() + VOTING_WINDOW_MS),
      },
      include: {
        contract: { select: { id: true, title: true, totalAmount: true } },
        initiator: { select: { id: true, name: true } },
        votes: true,
      },
    });

    // Emit real-time Socket.IO event for voting phase start
    const { clientId, freelancerId, title } = dispute.contract;
    emitDisputeVotingStarted(clientId, freelancerId, dispute.id);

    for (const userId of [clientId, freelancerId]) {
      await notificationService.createNotification({
        userId,
        type: 'DISPUTE_VOTING',
        title: 'Dispute Voting Started',
        message: `Voting has started on the dispute for "${title}". Community jurors will now review the case.`,
        data: { disputeId: dispute.id, contractId: dispute.contractId },
      });
    }

    // --- AUTO-NOTIFY ELIGIBLE JURORS via BullMQ ---
    await jurorNotificationQueue.add(`juror-notify-${dispute.id}`, {
      disputeId: dispute.id,
      contractId: dispute.contractId,
      contractTitle: title,
      clientId,
      freelancerId,
    });

    return updated;
  }

  /**
   * Cast a vote on a dispute in VOTING status.
   * Voters: admin or qualified jurors (trust score > 50, no prior work with parties).
   */
  async castVote(
    voterId: string,
    disputeId: string,
    input: CastVoteInput,
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: { select: { clientId: true, freelancerId: true } },
        votes: true,
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    if (dispute.status !== 'VOTING') {
      throw new ValidationError('Votes can only be cast during the voting phase');
    }

    if (dispute.votingDeadline && new Date() > dispute.votingDeadline) {
      throw new ValidationError('The voting deadline has passed');
    }

    // Voter cannot be a party to the dispute
    const { clientId, freelancerId } = dispute.contract;
    if (voterId === clientId || voterId === freelancerId) {
      throw new ForbiddenError('Contract parties cannot vote on their own dispute');
    }

    // Check for duplicate vote
    const existingVote = dispute.votes.find((v: { jurorId: string }) => v.jurorId === voterId);
    if (existingVote) {
      throw new ValidationError('You have already voted on this dispute');
    }

    // Determine vote weight (default 1, could be trust-score-weighted)
    const voter = await prisma.user.findUnique({
      where: { id: voterId },
      select: {
        role: true,
        freelancerProfile: { select: { trustScore: true } },
        clientProfile: { select: { trustScore: true } },
      },
    });

    // Admin always has weight 10; non-admin must have trust score > 50 (SRS M4-I5)
    let weight = 1;
    if (voter?.role === 'ADMIN') {
      weight = 10;
    } else {
      const trustScore = this.getUserTrustScore(voter);
      if (trustScore < JUROR_MIN_TRUST_SCORE) {
        throw new ForbiddenError(
          `Jurors must have a trust score of at least ${JUROR_MIN_TRUST_SCORE} to vote on disputes. Your current score is ${trustScore.toFixed(1)}.`,
        );
      }
      weight = Math.max(1, Math.floor(trustScore / 10));
    }

    const vote = await prisma.disputeVote.create({
      data: {
        disputeId,
        jurorId: voterId,
        vote: input.vote as any,
        weight,
        reasoning: input.reasoning ?? null,
      },
      include: {
        juror: { select: { id: true, name: true } },
      },
    });

    // Update vote tallies
    const allVotes = [...dispute.votes, { vote: input.vote, weight }] as Array<{ vote: string; weight: number }>;
    const clientVotes = allVotes
      .filter((v) => v.vote === 'CLIENT_WINS')
      .reduce((sum: number, v) => sum + v.weight, 0);
    const freelancerVotes = allVotes
      .filter((v) => v.vote === 'FREELANCER_WINS')
      .reduce((sum: number, v) => sum + v.weight, 0);

    await prisma.dispute.update({
      where: { id: disputeId },
      data: { clientVotes, freelancerVotes },
    });

    return vote;
  }

  /**
   * Admin directly resolves a dispute (hybrid model).
   * Bypasses full juror voting when no user-jurors are available.
   */
  async adminResolve(
    adminId: string,
    disputeId: string,
    input: AdminResolveInput,
  ) {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can directly resolve disputes');
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: {
          select: {
            id: true,
            jobId: true,
            clientId: true,
            freelancerId: true,
            title: true,
            totalAmount: true,
            milestones: { select: { id: true, status: true } },
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    if (dispute.status === 'RESOLVED') {
      throw new ValidationError('Dispute is already resolved');
    }

    // Resolve dispute + update contract/milestones in a single transaction
    const updated = await prisma.$transaction(async (tx: any) => {
      // 1. Resolve the dispute
      const resolvedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          outcome: input.outcome as any,
          resolution: input.resolution,
          resolvedAt: new Date(),
        },
        include: {
          contract: { select: { id: true, title: true, totalAmount: true } },
          initiator: { select: { id: true, name: true } },
          votes: { include: { juror: { select: { id: true, name: true } } } },
        },
      });

      // 2. Update contract and milestone statuses based on outcome
      const unpaidMilestoneIds = dispute.contract.milestones
        .filter((m: { status: string }) =>
          m.status !== 'PAID' && m.status !== 'APPROVED'
        )
        .map((m: { id: string }) => m.id);

      if (input.outcome === 'CLIENT_WINS') {
        // Client wins → cancel contract, refund escrow (cancel unpaid milestones)
        await tx.contract.update({
          where: { id: dispute.contractId },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
          },
        });

        // Update Job status to CANCELLED
        await tx.job.update({
          where: { id: dispute.contract.jobId },
          data: { status: 'CANCELLED' },
        });

        if (unpaidMilestoneIds.length > 0) {
          await tx.milestone.updateMany({
            where: { id: { in: unpaidMilestoneIds } },
            data: { status: 'PENDING' },
          });
        }
      } else if (input.outcome === 'FREELANCER_WINS') {
        // Freelancer wins → contract COMPLETED, all unpaid milestones force-approved.
        // Escrow funds are released to freelancer via on-chain resolveDispute().
        await tx.contract.update({
          where: { id: dispute.contractId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        // Update Job status to COMPLETED
        await tx.job.update({
          where: { id: dispute.contract.jobId },
          data: { status: 'COMPLETED' },
        });

        // Auto-approve all non-paid milestones (freelancer won — they get paid)
        const unpaidIds = dispute.contract.milestones
          .filter((m: { status: string }) => m.status !== 'PAID')
          .map((m: { id: string }) => m.id);

        if (unpaidIds.length > 0) {
          await tx.milestone.updateMany({
            where: { id: { in: unpaidIds } },
            data: {
              status: 'PAID',
              approvedAt: new Date(),
              paidAt: new Date(),
            },
          });
        }
      } else {
        // SPLIT → contract is completed (dispute resolved by compromise); funds split on-chain
        await tx.contract.update({
          where: { id: dispute.contractId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        // Update Job status to COMPLETED
        await tx.job.update({
          where: { id: dispute.contract.jobId },
          data: { status: 'COMPLETED' },
        });
      }

      return resolvedDispute;
    });

    const { clientId, freelancerId, title } = dispute.contract;

    // --- Blockchain: resolve dispute on-chain (release/refund escrow funds) ---
    let resolutionTxHash: string | null = null;
    try {
      resolutionTxHash = await escrowService.resolveDisputeOnChain(
        dispute.contractId,
        input.outcome,
      );

      if (resolutionTxHash) {
        // Store the tx hash on the dispute record
        await prisma.dispute.update({
          where: { id: disputeId },
          data: { resolutionTxHash },
        });
        console.log(`[DisputeService] On-chain resolution tx: ${resolutionTxHash}`);
      } else {
        console.warn('[DisputeService] Blockchain not available — dispute resolved off-chain only. Funds must be released manually or via retry job.');
      }
    } catch (err) {
      console.error('[DisputeService] On-chain dispute resolution failed:', err);
      // Continue with off-chain resolution — retry job will pick it up
    }

    // Notify both parties
    const outcomeText =
      input.outcome === 'CLIENT_WINS' ? 'in favor of the client'
      : input.outcome === 'FREELANCER_WINS' ? 'in favor of the freelancer'
      : 'as a split decision';

    for (const userId of [clientId, freelancerId]) {
      await notificationService.createNotification({
        userId,
        type: 'DISPUTE_RESOLVED',
        title: 'Dispute Resolved',
        message: `The dispute on "${title}" has been resolved ${outcomeText}.`,
        data: { disputeId: dispute.id, contractId: dispute.contractId, outcome: input.outcome },
      });
    }

    emitDisputeResolved(clientId, freelancerId, dispute.id, input.outcome);

    // Recalculate trust scores via BullMQ after dispute resolution (M4)
    await trustScoreUserQueue.add(`trust-client-${clientId}`, { userId: clientId });
    await trustScoreUserQueue.add(`trust-freelancer-${freelancerId}`, { userId: freelancerId });

    return updated;
  }

  /**
   * Get a single dispute by ID.
   */
  async getDispute(disputeId: string, userId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            totalAmount: true,
            clientId: true,
            freelancerId: true,
            client: { select: { id: true, name: true, avatarUrl: true } },
            freelancer: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        initiator: { select: { id: true, name: true, avatarUrl: true } },
        votes: {
          include: { juror: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        evidenceItems: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    // Verify user is a party to the dispute or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const contract = dispute.contract;
    const isParty = contract.clientId === userId || contract.freelancerId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isParty && !isAdmin) {
      throw new ForbiddenError('You do not have access to this dispute');
    }

    return dispute;
  }

  /**
   * List disputes for a user (as party) or all disputes for admin.
   * Supports filtering by status, outcome, date range, and text search.
   */
  async listDisputes(userId: string, query: GetDisputesQuery) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role === 'ADMIN';

    const where: Record<string, unknown> = {};

    if (!isAdmin) {
      where.contract = {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.outcome) {
      where.outcome = query.outcome;
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        ...(query.dateFrom ? { gte: query.dateFrom } : {}),
        ...(query.dateTo ? { lte: query.dateTo } : {}),
      };
    }

    // Text search on reason / description
    if (query.search) {
      where.OR = [
        { reason: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              title: true,
              totalAmount: true,
              client: { select: { id: true, name: true, avatarUrl: true } },
              freelancer: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          initiator: { select: { id: true, name: true } },
          _count: { select: { votes: true } },
        },
        orderBy: { [query.sort]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      hasNext: query.page * query.limit < total,
      hasPrev: query.page > 1,
    };
  }

  /**
   * Check whether a user is eligible to serve as a juror on a specific dispute.
   * Requirements (SRS M4-I5):
   * - Trust score >= 50
   * - Not a party to the dispute
   * - Has not already voted
   * - Admin users are always eligible
   */
  async checkJurorEligibility(userId: string, disputeId: string) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: { select: { clientId: true, freelancerId: true } },
        votes: { select: { jurorId: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        freelancerProfile: { select: { trustScore: true } },
        clientProfile: { select: { trustScore: true } },
      },
    });

    const isAdmin = user?.role === 'ADMIN';
    const trustScore = this.getUserTrustScore(user);
    const isParty =
      dispute.contract.clientId === userId || dispute.contract.freelancerId === userId;
    const hasVoted = dispute.votes.some((v: { jurorId: string }) => v.jurorId === userId);
    const meetsScoreRequirement = isAdmin || trustScore >= JUROR_MIN_TRUST_SCORE;
    const isVotingOpen = dispute.status === 'VOTING';
    const withinDeadline = !dispute.votingDeadline || new Date() <= dispute.votingDeadline;

    return {
      eligible: !isParty && !hasVoted && meetsScoreRequirement && isVotingOpen && withinDeadline,
      trustScore,
      minimumRequired: JUROR_MIN_TRUST_SCORE,
      meetsScoreRequirement,
      isParty,
      hasVoted,
      isAdmin,
      isVotingOpen,
      withinDeadline,
    };
  }

  /**
   * Extract trust score from a user's profile (freelancer or client).
   */
  private getUserTrustScore(user: {
    freelancerProfile?: { trustScore: unknown } | null;
    clientProfile?: { trustScore: unknown } | null;
  } | null): number {
    return Number(
      user?.freelancerProfile?.trustScore ?? user?.clientProfile?.trustScore ?? 0,
    );
  }

}

export const disputeService = new DisputeService();
export default disputeService;
