import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';
import type { AdminReviewsQuery } from '../validators/admin.validator';
import { apiCache } from './cache.service';

// =============================================================================
// FLAGGED ACCOUNTS THRESHOLDS
// =============================================================================

const LOW_TRUST_THRESHOLD = 30;
const HIGH_DISPUTE_RATE_THRESHOLD = 0.3;
const HIGH_DISPUTE_RATE_MIN_DISPUTES = 2;
const MULTIPLE_DISPUTES_THRESHOLD = 3;

// =============================================================================
// TYPES
// =============================================================================

export interface PlatformStats {
  users: {
    total: number;
    freelancers: number;
    clients: number;
    admins: number;
    active: number;
    suspended: number;
    newThisMonth: number;
    newLastMonth: number;
  };
  jobs: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    disputed: number;
    newThisMonth: number;
  };
  contracts: {
    total: number;
    active: number;
    completed: number;
    disputed: number;
    totalValue: number;
    avgValue: number;
    completedThisMonth: number;
  };
  disputes: {
    total: number;
    open: number;
    voting: number;
    resolved: number;
    appealed: number;
    avgResolutionDays: number;
  };
  reviews: {
    total: number;
    avgRating: number;
    thisMonth: number;
  };
  messages: {
    total: number;
    thisMonth: number;
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
}

export interface JobListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
}

export interface MonthlyTrend {
  month: string;
  users: number;
  jobs: number;
  contracts: number;
  revenue: number;
}

// =============================================================================
// SERVICE
// =============================================================================

export class AdminService {
  /**
   * Get comprehensive platform statistics for the admin dashboard.
   * Cached for 2 min via Redis to avoid repeated heavy COUNT queries.
   */
  async getPlatformStats(): Promise<PlatformStats> {
    return apiCache.getAdminStats(() => this._fetchPlatformStats());
  }

  private async _fetchPlatformStats(): Promise<PlatformStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      freelancerCount,
      clientCount,
      adminCount,
      activeUsers,
      suspendedUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalJobs,
      openJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      disputedJobs,
      newJobsThisMonth,
      totalContracts,
      activeContracts,
      completedContracts,
      disputedContracts,
      contractStats,
      completedContractsThisMonth,
      totalDisputes,
      openDisputes,
      votingDisputes,
      resolvedDisputes,
      appealedDisputes,
      totalReviews,
      avgRatingResult,
      reviewsThisMonth,
      totalMessages,
      messagesThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'FREELANCER' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'OPEN' } }),
      prisma.job.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'CANCELLED' } }),
      prisma.job.count({ where: { status: 'DISPUTED' } }),
      prisma.job.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.contract.count({ where: { status: 'COMPLETED' } }),
      prisma.contract.count({ where: { status: 'DISPUTED' } }),
      prisma.contract.aggregate({ _sum: { totalAmount: true }, _avg: { totalAmount: true } }),
      prisma.contract.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfMonth } } }),
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.dispute.count({ where: { status: 'VOTING' } }),
      prisma.dispute.count({ where: { status: 'RESOLVED' } }),
      prisma.dispute.count({ where: { status: 'APPEALED' } }),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { overallRating: true } }),
      prisma.review.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    return {
      users: {
        total: totalUsers,
        freelancers: freelancerCount,
        clients: clientCount,
        admins: adminCount,
        active: activeUsers,
        suspended: suspendedUsers,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
        inProgress: inProgressJobs,
        completed: completedJobs,
        cancelled: cancelledJobs,
        disputed: disputedJobs,
        newThisMonth: newJobsThisMonth,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
        completed: completedContracts,
        disputed: disputedContracts,
        totalValue: Number(contractStats._sum.totalAmount ?? 0),
        avgValue: Number(contractStats._avg.totalAmount ?? 0),
        completedThisMonth: completedContractsThisMonth,
      },
      disputes: {
        total: totalDisputes,
        open: openDisputes,
        voting: votingDisputes,
        resolved: resolvedDisputes,
        appealed: appealedDisputes,
        avgResolutionDays: 0,
      },
      reviews: {
        total: totalReviews,
        avgRating: Number(avgRatingResult._avg.overallRating ?? 0),
        thisMonth: reviewsThisMonth,
      },
      messages: {
        total: totalMessages,
        thisMonth: messagesThisMonth,
      },
    };
  }

  /**
   * Get monthly trends for the last 6 months.
   * Cached for 10 min — trends change infrequently.
   */
  async getMonthlyTrends(): Promise<MonthlyTrend[]> {
    return apiCache.getAdminTrends(() => this._fetchMonthlyTrends());
  }

  private async _fetchMonthlyTrends(): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = start.toLocaleString('en-US', { month: 'short', year: '2-digit' });

      const [users, jobs, contracts, revenue] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.job.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.contract.count({ where: { createdAt: { gte: start, lt: end } } }),
        prisma.contract.aggregate({
          where: { status: 'COMPLETED', completedAt: { gte: start, lt: end } },
          _sum: { totalAmount: true },
        }),
      ]);

      trends.push({
        month: monthLabel,
        users,
        jobs,
        contracts,
        revenue: Number(revenue._sum.totalAmount ?? 0),
      });
    }

    return trends;
  }

  /**
   * List users with filters for admin management.
   */
  async listUsers(params: UserListParams) {
    const { page = 1, limit = 20, role, status, search, sort = 'createdAt', order = 'desc' } = params;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as Prisma.EnumUserRoleFilter;
    if (status) where.status = status as Prisma.EnumUserStatusFilter;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          walletAddress: true,
          role: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          freelancerProfile: { select: { trustScore: true, completedJobs: true } },
          clientProfile: { select: { trustScore: true, totalSpent: true } },
          _count: { select: { reviewsReceived: true, disputesInitiated: true, contracts: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Suspend or activate a user (admin action).
   */
  async updateUserStatus(userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });

    if (!user) throw new Error('User not found');
    if (user.role === 'ADMIN') throw new Error('Cannot change admin status');

    return prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
  }

  /**
   * List jobs for admin overview.
   */
  async listJobs(params: JobListParams) {
    const { page = 1, limit = 20, status, search, sort = 'createdAt', order = 'desc' } = params;

    const where: Prisma.JobWhereInput = {};
    if (status) where.status = status as Prisma.EnumJobStatusFilter;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          budget: true,
          createdAt: true,
          client: { select: { id: true, name: true } },
          contract: { select: { id: true } },
          _count: { select: { proposals: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Get recent platform activity (latest events across the platform).
   */
  async getRecentActivity(limit: number = 15) {
    return apiCache.getAdminActivity(limit, () => this._fetchRecentActivity(limit));
  }

  private async _fetchRecentActivity(limit: number) {
    const [recentUsers, recentJobs, recentDisputes, recentContracts] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
      }),
      prisma.job.findMany({
        select: { id: true, title: true, status: true, createdAt: true, client: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
      }),
      prisma.dispute.findMany({
        select: { id: true, reason: true, status: true, createdAt: true, initiator: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
      }),
      prisma.contract.findMany({
        select: { id: true, title: true, status: true, totalAmount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit / 4),
      }),
    ]);

    const activities = [
      ...recentUsers.map((u) => ({
        type: 'user' as const,
        id: u.id,
        title: `${u.name ?? 'Unknown'} joined as ${u.role.toLowerCase()}`,
        status: u.role,
        createdAt: u.createdAt,
      })),
      ...recentJobs.map((j) => ({
        type: 'job' as const,
        id: j.id,
        title: j.title,
        status: j.status,
        createdAt: j.createdAt,
      })),
      ...recentDisputes.map((d) => ({
        type: 'dispute' as const,
        id: d.id,
        title: `Dispute: ${d.reason}`,
        status: d.status,
        createdAt: d.createdAt,
      })),
      ...recentContracts.map((c) => ({
        type: 'contract' as const,
        id: c.id,
        title: c.title,
        status: c.status,
        createdAt: c.createdAt,
      })),
    ];

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return activities.slice(0, limit);
  }

  /**
   * Get flagged accounts — users with high dispute rates, low trust, or suspended status.
   * Auto-detection based on configurable thresholds.
   */
  async getFlaggedAccounts(params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 20 } = params;

    // Find users with concerning activity patterns
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        freelancerProfile: { select: { trustScore: true, completedJobs: true } },
        clientProfile: { select: { trustScore: true, totalSpent: true } },
        _count: {
          select: {
            reviewsReceived: true,
            disputesInitiated: true,
            contracts: true,
            clientContracts: true,
          },
        },
      },
      where: {
        role: { not: 'ADMIN' },
        OR: [
          // Suspended users
          { status: 'SUSPENDED' },
          // Low trust score freelancers
          { freelancerProfile: { trustScore: { lt: LOW_TRUST_THRESHOLD } } },
          // Low trust score clients
          { clientProfile: { trustScore: { lt: LOW_TRUST_THRESHOLD } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Also find users with high dispute involvement (separate query)
    const highDisputeUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        walletAddress: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        freelancerProfile: { select: { trustScore: true, completedJobs: true } },
        clientProfile: { select: { trustScore: true, totalSpent: true } },
        _count: {
          select: {
            reviewsReceived: true,
            disputesInitiated: true,
            contracts: true,
            clientContracts: true,
          },
        },
      },
      where: {
        role: { not: 'ADMIN' },
        disputesInitiated: { some: {} },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Merge and deduplicate, computing risk flags
    const seenIds = new Set<string>();
    const flaggedUsers: Array<{
      id: string;
      name: string | null;
      email: string | null;
      walletAddress: string | null;
      role: string;
      status: string;
      createdAt: Date;
      trustScore: number;
      contracts: number;
      disputes: number;
      reviews: number;
      riskFlags: string[];
      riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [];

    const processUser = (u: typeof users[0]) => {
      if (seenIds.has(u.id)) return;
      seenIds.add(u.id);

      const trustScore = Number(u.freelancerProfile?.trustScore ?? u.clientProfile?.trustScore ?? 0);
      const totalDisputes = u._count.disputesInitiated;
      const contractCount = u._count.contracts + u._count.clientContracts;
      const disputeRate = contractCount > 0 ? totalDisputes / contractCount : 0;

      const riskFlags: string[] = [];
      if (u.status === 'SUSPENDED') riskFlags.push('SUSPENDED');
      if (trustScore < LOW_TRUST_THRESHOLD && trustScore > 0) riskFlags.push('LOW_TRUST');
      if (disputeRate > HIGH_DISPUTE_RATE_THRESHOLD && totalDisputes >= HIGH_DISPUTE_RATE_MIN_DISPUTES) riskFlags.push('HIGH_DISPUTE_RATE');
      if (totalDisputes >= MULTIPLE_DISPUTES_THRESHOLD) riskFlags.push('MULTIPLE_DISPUTES');

      // Only include if flagged
      if (riskFlags.length === 0) return;

      const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
        riskFlags.length >= 3 || riskFlags.includes('SUSPENDED') ? 'HIGH' :
        riskFlags.length >= 2 ? 'MEDIUM' : 'LOW';

      flaggedUsers.push({
        id: u.id,
        name: u.name,
        email: u.email,
        walletAddress: u.walletAddress,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        trustScore,
        contracts: contractCount,
        disputes: totalDisputes,
        reviews: u._count.reviewsReceived,
        riskFlags,
        riskLevel,
      });
    };

    for (const u of users) processUser(u);
    for (const u of highDisputeUsers) processUser(u);

    // Sort by risk level (HIGH first)
    const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    flaggedUsers.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    const total = flaggedUsers.length;
    return {
      items: flaggedUsers.slice(0, limit),
      total,
      page,
      limit,
      riskSummary: {
        high: flaggedUsers.filter((u) => u.riskLevel === 'HIGH').length,
        medium: flaggedUsers.filter((u) => u.riskLevel === 'MEDIUM').length,
        low: flaggedUsers.filter((u) => u.riskLevel === 'LOW').length,
      },
    };
  }

  /**
   * List all user trust scores with filtering/sorting/pagination.
   * Used by the admin trust score management page.
   */
  async listTrustScores(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    eligible?: string;
    minScore?: number;
    maxScore?: number;
    sort?: string;
    order?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      role = 'all',
      eligible,
      minScore,
      maxScore,
      sort = 'trustScore',
      order = 'desc',
    } = params;

    // Build where clause — only users with a profile (freelancer or client)
    const where: Prisma.UserWhereInput = {
      status: 'ACTIVE',
      OR: [
        { freelancerProfile: { isNot: null } },
        { clientProfile: { isNot: null } },
      ],
    };

    if (role && role !== 'all') {
      where.role = role as 'FREELANCER' | 'CLIENT';
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          freelancerProfile: {
            select: {
              trustScore: true,
              completedJobs: true,
              avgRating: true,
              updatedAt: true,
            },
          },
          clientProfile: {
            select: {
              trustScore: true,
              avgRating: true,
              totalReviews: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              contracts: { where: { status: 'COMPLETED' } },
              clientContracts: { where: { status: 'COMPLETED' } },
              disputesInitiated: true,
              reviewsReceived: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Map to flat response entries
    let entries = users.map((u) => {
      const ts = Number(u.freelancerProfile?.trustScore ?? u.clientProfile?.trustScore ?? 0);
      const completedJobs = u.freelancerProfile?.completedJobs ?? 0;
      const completedContracts = u._count.contracts + u._count.clientContracts;
      const disputes = u._count.disputesInitiated;
      const avgRating = Number(u.freelancerProfile?.avgRating ?? u.clientProfile?.avgRating ?? 0);
      const lastUpdated = (u.freelancerProfile?.updatedAt ?? u.clientProfile?.updatedAt ?? new Date()).toISOString();

      return {
        id: u.id,
        userId: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
        trustScore: ts,
        eligible: ts > 50,
        completedJobs,
        completedContracts,
        disputes,
        avgRating,
        lastUpdated,
      };
    });

    // Post-filter by eligible/score range (easier in JS than Prisma cross-profile)
    if (eligible === 'true') entries = entries.filter((e) => e.eligible);
    if (eligible === 'false') entries = entries.filter((e) => !e.eligible);
    if (minScore !== undefined) entries = entries.filter((e) => e.trustScore >= minScore);
    if (maxScore !== undefined) entries = entries.filter((e) => e.trustScore <= maxScore);

    // Sort
    const sortKey = sort as keyof (typeof entries)[0];
    entries.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: entries,
      total,
      page,
      limit,
      totalPages,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * List all reviews with filtering, search, and pagination.
   * Admin bypasses double-blind — all reviews are visible.
   */
  async listReviews(query: AdminReviewsQuery) {
    const { page, limit, search, minRating, maxRating, dateFrom, dateTo, authorId, subjectId, contractId, hasBlockchain, hasIpfs, sort, order } = query;

    const where: Prisma.ReviewWhereInput = {};

    if (search) {
      where.comment = { contains: search, mode: 'insensitive' };
    }
    if (minRating !== undefined || maxRating !== undefined) {
      where.overallRating = {
        ...(minRating !== undefined ? { gte: minRating } : {}),
        ...(maxRating !== undefined ? { lte: maxRating } : {}),
      };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }
    if (authorId) where.authorId = authorId;
    if (subjectId) where.subjectId = subjectId;
    if (contractId) where.contractId = contractId;
    if (hasBlockchain === 'true') where.blockchainTxHash = { not: null };
    if (hasBlockchain === 'false') where.blockchainTxHash = null;
    if (hasIpfs === 'true') where.ipfsHash = { not: null };
    if (hasIpfs === 'false') where.ipfsHash = null;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true, role: true } },
          subject: { select: { id: true, name: true, avatarUrl: true, role: true } },
          contract: { select: { id: true, title: true, status: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }
}

export const adminService = new AdminService();
export default adminService;
