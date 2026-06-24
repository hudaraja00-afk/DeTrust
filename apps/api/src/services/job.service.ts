import { Prisma, JobStatus, JobType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../middleware';
import { CreateJobInput, UpdateJobInput, GetJobsQuery } from '../validators';
import { createHash } from 'crypto';
import { apiCache } from './cache.service';

export class JobService {
  /**
   * Create a new job (client only)
   */
  async createJob(clientId: string, data: CreateJobInput) {
    // Verify skills exist
    const skills = await prisma.skill.findMany({
      where: { id: { in: data.skillIds } },
    });

    if (skills.length !== data.skillIds.length) {
      throw new NotFoundError('One or more skills not found');
    }

    const job = await prisma.job.create({
      data: {
        clientId,
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type as JobType,
        budget: data.budget,
        hourlyRateMin: data.hourlyRateMin,
        hourlyRateMax: data.hourlyRateMax,
        estimatedHours: data.estimatedHours,
        deadline: data.deadline ? new Date(data.deadline) : null,
        visibility: data.visibility,
        experienceLevel: data.experienceLevel,
        attachments: data.attachments || [],
        status: 'DRAFT',
        skills: {
          create: data.skillIds.map((skillId) => ({
            skillId,
            isRequired: true,
          })),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            clientProfile: {
              select: {
                companyName: true,
                trustScore: true,
                jobsPosted: true,
                hireRate: true,
                paymentVerified: true,
              },
            },
          },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    // Invalidate job list cache
    apiCache.invalidateJobs().catch(() => {});

    return job;
  }

  /**
   * Update a job (client only, DRAFT status only)
   */
  async updateJob(jobId: string, clientId: string, data: UpdateJobInput) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenError('You can only update your own jobs');
    }

    if (job.status !== 'DRAFT') {
      throw new ForbiddenError('Can only update jobs in DRAFT status');
    }

    // Handle skills update
    if (data.skillIds) {
      const skills = await prisma.skill.findMany({
        where: { id: { in: data.skillIds } },
      });

      if (skills.length !== data.skillIds.length) {
        throw new NotFoundError('One or more skills not found');
      }

      // Delete existing skills and create new ones
      await prisma.jobSkill.deleteMany({ where: { jobId } });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.type && { type: data.type as JobType }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.hourlyRateMin !== undefined && { hourlyRateMin: data.hourlyRateMin }),
        ...(data.hourlyRateMax !== undefined && { hourlyRateMax: data.hourlyRateMax }),
        ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.experienceLevel && { experienceLevel: data.experienceLevel }),
        ...(data.attachments && { attachments: data.attachments }),
        ...(data.skillIds && {
          skills: {
            create: data.skillIds.map((skillId) => ({
              skillId,
              isRequired: true,
            })),
          },
        }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            clientProfile: {
              select: {
                companyName: true,
                trustScore: true,
                jobsPosted: true,
                hireRate: true,
                paymentVerified: true,
              },
            },
          },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    apiCache.invalidateJobs(jobId).catch(() => {});
    return updatedJob;
  }

  /**
   * Publish a job (change status from DRAFT to OPEN)
   */
  async publishJob(jobId: string, clientId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenError('You can only publish your own jobs');
    }

    if (job.status !== 'DRAFT') {
      throw new ForbiddenError('Can only publish jobs in DRAFT status');
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'OPEN',
        publishedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            clientProfile: {
              select: {
                companyName: true,
                trustScore: true,
                jobsPosted: true,
                hireRate: true,
                paymentVerified: true,
              },
            },
          },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    // Update client's jobs posted count
    await prisma.clientProfile.update({
      where: { userId: clientId },
      data: {
        jobsPosted: { increment: 1 },
      },
    });

    apiCache.invalidateJobs(jobId).catch(() => {});
    return updatedJob;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string, clientId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenError('You can only cancel your own jobs');
    }

    if (job.status === 'CANCELLED' || job.status === 'COMPLETED') {
      throw new ForbiddenError('Cannot cancel a completed or already cancelled job');
    }

    if (job.status === 'IN_PROGRESS') {
      throw new ForbiddenError('Cannot cancel a job in progress. Please initiate a dispute instead.');
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        skills: {
          include: { skill: true },
        },
      },
    });

    apiCache.invalidateJobs(jobId).catch(() => {});
    return updatedJob;
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string, userId?: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            clientProfile: {
              select: {
                companyName: true,
                trustScore: true,
                jobsPosted: true,
                hireRate: true,
                avgRating: true,
                totalReviews: true,
                paymentVerified: true,
              },
            },
          },
        },
        skills: {
          include: { skill: true },
        },
        proposals: userId
          ? {
              where: { freelancerId: userId },
              select: {
                id: true,
                status: true,
                proposedRate: true,
                createdAt: true,
              },
            }
          : false,
        _count: {
          select: { proposals: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Check visibility
    if (job.status === 'DRAFT' && job.clientId !== userId) {
      throw new NotFoundError('Job not found');
    }

    // Increment view count
    await prisma.job.update({
      where: { id: jobId },
      data: { viewCount: { increment: 1 } },
    });

    return job;
  }

  /**
   * List jobs with filters
   */
  async listJobs(query: GetJobsQuery, userId?: string) {
    const queryHash = createHash('md5')
      .update(JSON.stringify({ ...query, userId }))
      .digest('hex')
      .slice(0, 12);

    return apiCache.getJobsList(queryHash, () => this._fetchJobs(query, userId));
  }

  private async _fetchJobs(query: GetJobsQuery, userId?: string) {
    const {
      status,
      category,
      type,
      minBudget,
      maxBudget,
      skills,
      experienceLevel,
      search,
      clientId,
      page,
      limit,
      sort,
      order,
    } = query;

    const where: Prisma.JobWhereInput = {
      // Default to OPEN jobs for public viewing
      status: status || 'OPEN',
      ...(category && { category }),
      ...(type && { type: type as JobType }),
      ...(experienceLevel && { experienceLevel }),
      ...(clientId && { clientId }),
      ...(minBudget !== undefined && { budget: { gte: minBudget } }),
      ...(maxBudget !== undefined && { budget: { lte: maxBudget } }),
      ...(skills && {
        skills: {
          some: {
            skillId: { in: skills.split(',') },
          },
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Allow clients to see their own DRAFT jobs
    if (clientId && clientId === userId) {
      delete where.status;
      if (status) {
        where.status = status as JobStatus;
      }
    }

    const orderByField = sort === 'budget' ? 'budget' : sort;
    const orderBy: Prisma.JobOrderByWithRelationInput = {
      [orderByField]: order,
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              clientProfile: {
                select: {
                  companyName: true,
                  trustScore: true,
                  jobsPosted: true,
                  hireRate: true,
                  paymentVerified: true,
                },
              },
            },
          },
          skills: {
            include: { skill: true },
          },
          _count: {
            select: { proposals: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      items: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Get client's jobs (including DRAFT)
   */
  async getClientJobs(clientId: string, query: GetJobsQuery) {
    return this.listJobs({ ...query, clientId }, clientId);
  }

  /**
   * Delete a job (DRAFT only)
   */
  async deleteJob(jobId: string, clientId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new ForbiddenError('You can only delete your own jobs');
    }

    if (job.status !== 'DRAFT') {
      throw new ForbiddenError('Can only delete jobs in DRAFT status');
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    apiCache.invalidateJobs(jobId).catch(() => {});
    return { success: true };
  }
}

export const jobService = new JobService();
export default jobService;
