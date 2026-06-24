import { Prisma, ProposalStatus, PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../middleware';
import { CreateProposalInput, UpdateProposalInput, AcceptProposalInput, GetProposalsQuery } from '../validators';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class ProposalService {
  /**
   * Create a proposal for a job (freelancer only)
   */
  async createProposal(freelancerId: string, jobId: string, data: CreateProposalInput) {
    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: { select: { id: true } },
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== 'OPEN') {
      throw new ForbiddenError('Job is not accepting proposals');
    }

    if (job.clientId === freelancerId) {
      throw new ForbiddenError('You cannot submit a proposal to your own job');
    }

    // Check if freelancer already submitted a proposal
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        jobId_freelancerId: {
          jobId,
          freelancerId,
        },
      },
    });

    if (existingProposal) {
      throw new ConflictError('You have already submitted a proposal for this job');
    }

    // Check if freelancer profile is complete enough
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: freelancerId },
    });

    if (!freelancerProfile || freelancerProfile.completenessScore < 70) {
      throw new ForbiddenError(
        `Profile must be at least 70% complete to submit proposals (currently ${freelancerProfile?.completenessScore ?? 0}%)`
      );
    }

    // Enforce budget ceiling for FIXED_PRICE jobs
    if (job.type === 'FIXED_PRICE' && job.budget) {
      const budget = Number(job.budget);
      if (data.proposedRate > budget) {
        throw new ValidationError(
          `Bid cannot exceed the job budget of $${budget}`
        );
      }
    }

    // Enforce hourly rate range for HOURLY jobs
    if (job.type === 'HOURLY') {
      const min = job.hourlyRateMin ? Number(job.hourlyRateMin) : null;
      const max = job.hourlyRateMax ? Number(job.hourlyRateMax) : null;
      if (min !== null && max !== null) {
        if (data.proposedRate < min || data.proposedRate > max) {
          throw new ValidationError(
            `Proposed hourly rate must be between $${min} and $${max}/hr`
          );
        }
      }
    }

    const proposal = await prisma.proposal.create({
      data: {
        jobId,
        freelancerId,
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        estimatedDuration: data.estimatedDuration,
        milestones: data.milestones || undefined,
        attachments: data.attachments || [],
        status: 'PENDING',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            type: true,
            clientId: true,
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
                aiCapabilityScore: true,
                completedJobs: true,
                avgRating: true,
                totalReviews: true,
              },
            },
          },
        },
      },
    });

    // Update job proposal count
    await prisma.job.update({
      where: { id: jobId },
      data: { proposalCount: { increment: 1 } },
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: job.clientId,
        type: 'PROPOSAL_RECEIVED',
        title: 'New Proposal Received',
        message: `You received a new proposal for "${job.title}"`,
        data: { jobId, proposalId: proposal.id },
      },
    });

    return proposal;
  }

  /**
   * Update a proposal (freelancer only, PENDING status only)
   */
  async updateProposal(proposalId: string, freelancerId: string, data: UpdateProposalInput) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenError('You can only update your own proposals');
    }

    if (proposal.status !== 'PENDING') {
      throw new ForbiddenError('Can only update proposals in PENDING status');
    }

    // Validate proposed rate against job budget / rate range
    if (data.proposedRate !== undefined) {
      const job = proposal.job;
      if (job.type === 'FIXED_PRICE' && job.budget) {
        const budget = Number(job.budget);
        if (data.proposedRate > budget) {
          throw new ValidationError(
            `Bid cannot exceed the job budget of $${budget}`
          );
        }
      }
      if (job.type === 'HOURLY') {
        const min = job.hourlyRateMin ? Number(job.hourlyRateMin) : null;
        const max = job.hourlyRateMax ? Number(job.hourlyRateMax) : null;
        if (min !== null && max !== null) {
          if (data.proposedRate < min || data.proposedRate > max) {
            throw new ValidationError(
              `Proposed hourly rate must be between $${min} and $${max}/hr`
            );
          }
        }
      }
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        ...(data.coverLetter && { coverLetter: data.coverLetter }),
        ...(data.proposedRate !== undefined && { proposedRate: data.proposedRate }),
        ...(data.estimatedDuration && { estimatedDuration: data.estimatedDuration }),
        ...(data.milestones && { milestones: data.milestones }),
        ...(data.attachments && { attachments: data.attachments }),
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            type: true,
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
                aiCapabilityScore: true,
                completedJobs: true,
                avgRating: true,
              },
            },
          },
        },
      },
    });

    return updatedProposal;
  }

  /**
   * Withdraw a proposal (freelancer only)
   */
  async withdrawProposal(proposalId: string, freelancerId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: { select: { id: true } } },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenError('You can only withdraw your own proposals');
    }

    if (proposal.status === 'ACCEPTED' || proposal.status === 'WITHDRAWN') {
      throw new ForbiddenError('Cannot withdraw this proposal');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'WITHDRAWN' },
    });

    // Decrement proposal count on job
    await prisma.job.update({
      where: { id: proposal.jobId },
      data: { proposalCount: { decrement: 1 } },
    });

    return updatedProposal;
  }

  /**
   * Accept a proposal (client only)
   */
  async acceptProposal(proposalId: string, clientId: string, data: AcceptProposalInput) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: true,
        freelancer: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    if (proposal.job.clientId !== clientId) {
      throw new ForbiddenError('You can only accept proposals for your own jobs');
    }

    if (proposal.status !== 'PENDING' && proposal.status !== 'SHORTLISTED') {
      throw new ForbiddenError('Can only accept PENDING or SHORTLISTED proposals');
    }

    if (proposal.job.status !== 'OPEN') {
      throw new ForbiddenError('Job is not accepting proposals');
    }

    // Create contract and update statuses in a transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Update proposal to ACCEPTED
      const acceptedProposal = await tx.proposal.update({
        where: { id: proposalId },
        data: { status: 'ACCEPTED' },
      });

      // Reject all other proposals
      await tx.proposal.updateMany({
        where: {
          jobId: proposal.jobId,
          id: { not: proposalId },
          status: { notIn: ['WITHDRAWN', 'REJECTED'] },
        },
        data: {
          status: 'REJECTED',
          clientNote: 'Another proposal was accepted',
        },
      });

      // Update job status to IN_PROGRESS
      await tx.job.update({
        where: { id: proposal.jobId },
        data: { status: 'IN_PROGRESS' },
      });

      // Determine billing type and milestones
      const isHourly = proposal.job.type === 'HOURLY';
      let milestoneData: Array<{
        title: string;
        description: string;
        amount: number;
        orderIndex: number;
        dueDate: Date | null;
        status: 'PENDING';
      }>;
      let totalAmount: number;
      let contractBillingType: string;
      let contractHourlyRate: number | undefined;
      let contractWeeklyHourLimit: number | undefined;

      if (isHourly) {
        // Auto-generate weekly billing period milestones
        const hourlyRate = Number(proposal.proposedRate);
        const typedData = data as AcceptProposalInput & { weeklyHourLimit?: number; durationWeeks?: number };
        const weeklyHourLimit = typedData.weeklyHourLimit ?? 40;
        const durationWeeks = typedData.durationWeeks ?? 4;
        const weeklyAmount = hourlyRate * weeklyHourLimit;
        const startDate = data.startDate ? new Date(data.startDate) : new Date();

        milestoneData = Array.from({ length: durationWeeks }, (_, i) => {
          const weekStart = new Date(startDate);
          weekStart.setDate(weekStart.getDate() + i * 7);
          const dueDate = new Date(weekStart);
          dueDate.setDate(dueDate.getDate() + 6);

          return {
            title: `Week ${i + 1}`,
            description: `Billing period: ${weekStart.toISOString().slice(0, 10)} to ${dueDate.toISOString().slice(0, 10)}`,
            amount: weeklyAmount,
            orderIndex: i,
            dueDate,
            status: 'PENDING' as const,
          };
        });

        totalAmount = weeklyAmount * durationWeeks;
        contractBillingType = 'HOURLY';
        contractHourlyRate = hourlyRate;
        contractWeeklyHourLimit = weeklyHourLimit;
      } else {
        // Fixed-price: use client-provided milestones
        if (!data.milestones || data.milestones.length === 0) {
          throw new ValidationError('At least one milestone is required for fixed-price contracts');
        }

        milestoneData = data.milestones.map((milestone, index) => ({
          title: milestone.title,
          description: milestone.description || '',
          amount: Number(milestone.amount),
          orderIndex: index,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
          status: 'PENDING' as const,
        }));

        // Validate milestone due dates are not in the past
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        for (const ms of milestoneData) {
          if (ms.dueDate && ms.dueDate < now) {
            throw new ValidationError(
              `Milestone "${ms.title}" has a due date in the past`
            );
          }
        }

        totalAmount = milestoneData.reduce((sum, m) => sum + m.amount, 0);

        // Validate total milestone amount matches the agreed proposal rate
        const agreedAmount = Number(proposal.proposedRate);
        if (Math.abs(totalAmount - agreedAmount) > 0.01) {
          throw new ValidationError(
            `Total milestone amount ($${totalAmount.toFixed(2)}) must equal the agreed proposal rate ($${agreedAmount.toFixed(2)})`
          );
        }

        contractBillingType = 'FIXED';
        contractHourlyRate = undefined;
        contractWeeklyHourLimit = undefined;
      }

      // Validate contract dates
      const contractStartDate = data.startDate ? new Date(data.startDate) : new Date();
      const contractEndDate = data.endDate ? new Date(data.endDate) : null;

      if (contractEndDate) {
        if (contractEndDate <= contractStartDate) {
          throw new ValidationError('Contract end date must be after the start date');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (contractEndDate < today) {
          throw new ValidationError('Contract end date cannot be in the past');
        }
      }

      // Create contract
      const contract = await tx.contract.create({
        data: {
          jobId: proposal.jobId,
          proposalId,
          clientId,
          freelancerId: proposal.freelancerId,
          title: proposal.job.title,
          description: proposal.job.description,
          totalAmount,
          billingType: contractBillingType,
          hourlyRate: contractHourlyRate,
          weeklyHourLimit: contractWeeklyHourLimit,
          status: 'PENDING',
          startDate: contractStartDate,
          endDate: contractEndDate,
          milestones: {
            create: milestoneData,
          },
        },
        include: {
          milestones: true,
        },
      });

      return { proposal: acceptedProposal, contract };
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: proposal.freelancerId,
        type: 'PROPOSAL_ACCEPTED',
        title: 'Proposal Accepted!',
        message: `Your proposal for "${proposal.job.title}" has been accepted`,
        data: { jobId: proposal.jobId, proposalId, contractId: result.contract.id },
      },
    });

    // Update client hire rate
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: clientId },
    });

    if (clientProfile && clientProfile.jobsPosted > 0) {
      // Calculate new hire rate: (previousRate * (jobsPosted - 1) + 100) / jobsPosted
      // This accounts for one more successful hire out of total jobs posted
      const previousHires = clientProfile.hireRate.toNumber() * (clientProfile.jobsPosted - 1) / 100;
      const newHireRate = ((previousHires + 1) / clientProfile.jobsPosted) * 100;
      
      await prisma.clientProfile.update({
        where: { userId: clientId },
        data: { hireRate: Math.min(newHireRate, 100) },
      });
    }

    return result;
  }

  /**
   * Reject a proposal (client only)
   */
  async rejectProposal(proposalId: string, clientId: string, reason?: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    if (proposal.job.clientId !== clientId) {
      throw new ForbiddenError('You can only reject proposals for your own jobs');
    }

    if (proposal.status !== 'PENDING' && proposal.status !== 'SHORTLISTED') {
      throw new ForbiddenError('Can only reject PENDING or SHORTLISTED proposals');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'REJECTED',
        clientNote: reason,
      },
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: proposal.freelancerId,
        type: 'PROPOSAL_REJECTED',
        title: 'Proposal Update',
        message: `Your proposal for "${proposal.job.title}" was not selected`,
        data: { jobId: proposal.jobId, proposalId },
      },
    });

    return updatedProposal;
  }

  /**
   * Shortlist a proposal (client only)
   */
  async shortlistProposal(proposalId: string, clientId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    if (proposal.job.clientId !== clientId) {
      throw new ForbiddenError('You can only shortlist proposals for your own jobs');
    }

    if (proposal.status !== 'PENDING') {
      throw new ForbiddenError('Can only shortlist PENDING proposals');
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'SHORTLISTED' },
    });

    return updatedProposal;
  }

  /**
   * Get proposal by ID
   */
  async getProposalById(proposalId: string, userId: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true,
            type: true,
            status: true,
            clientId: true,
            client: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
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
                aiCapabilityScore: true,
                completedJobs: true,
                avgRating: true,
                totalReviews: true,
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    // Only the freelancer or the job client can view the proposal
    if (proposal.freelancerId !== userId && proposal.job.clientId !== userId) {
      throw new ForbiddenError('You do not have permission to view this proposal');
    }

    return proposal;
  }

  /**
   * List proposals for a job (client only)
   */
  async getJobProposals(jobId: string, clientId: string, query: GetProposalsQuery) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenError('You can only view proposals for your own jobs');
    }

    const { status, page, limit, sort, order } = query;

    const where: Prisma.ProposalWhereInput = {
      jobId,
      ...(status && { status: status as ProposalStatus }),
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              freelancerProfile: {
                select: {
                  title: true,
                  trustScore: true,
                  aiCapabilityScore: true,
                  completedJobs: true,
                  avgRating: true,
                  totalReviews: true,
                  skills: {
                    include: { skill: true },
                    take: 5,
                  },
                },
              },
            },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proposal.count({ where }),
    ]);

    return {
      items: proposals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * List freelancer's proposals
   */
  async getFreelancerProposals(freelancerId: string, query: GetProposalsQuery) {
    const { status, page, limit, sort, order } = query;

    const where: Prisma.ProposalWhereInput = {
      freelancerId,
      ...(status && { status: status as ProposalStatus }),
    };

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              description: true,
              budget: true,
              type: true,
              status: true,
              category: true,
              deadline: true,
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
              skills: {
                include: { skill: true },
              },
            },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proposal.count({ where }),
    ]);

    return {
      items: proposals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }
}

export const proposalService = new ProposalService();
export default proposalService;
