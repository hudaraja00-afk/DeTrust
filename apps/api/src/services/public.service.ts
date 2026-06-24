import { prisma } from '../config/database';
import { apiCache } from './cache.service';

// =============================================================================
// TYPES
// =============================================================================

export interface PublicStats {
  escrowVolume: number;
  medianHireTimeHours: number;
  avgTrustScore: number;
  platformFeePercent: string;
  totalFreelancers: number;
  completedContracts: number;
}

export interface FeaturedReview {
  id: string;
  overallRating: number;
  comment: string;
  createdAt: string;
  author: {
    name: string;
    role: string;
    initials: string;
    avatarUrl: string | null;
    trustScore: number;
  };
}

// =============================================================================
// SERVICE
// =============================================================================

export class PublicService {
  /**
   * Aggregate platform stats for the landing page.
   * Cached 5 min — no auth required, only aggregate data exposed.
   */
  async getStats(): Promise<PublicStats> {
    return apiCache.getPublicStats(() => this._fetchStats());
  }

  /**
   * Top-rated public reviews for the landing page.
   * Cached 5 min — only isPublic reviews with comment shown.
   */
  async getFeaturedReviews(limit = 3): Promise<FeaturedReview[]> {
    return apiCache.getPublicFeaturedReviews(() => this._fetchFeaturedReviews(limit));
  }

  // ---------------------------------------------------------------------------
  // Private fetch implementations
  // ---------------------------------------------------------------------------

  private async _fetchStats(): Promise<PublicStats> {
    const [
      contractAgg,
      avgTrustResult,
      totalFreelancers,
      completedContracts,
      hireTimeSample,
    ] = await Promise.all([
      // Total escrow volume
      prisma.contract.aggregate({
        _sum: { totalAmount: true },
      }),

      // Average trust score across non-admin freelancers & clients
      prisma.$queryRaw<{ avg_score: number | null }[]>`
        SELECT AVG(score) AS avg_score FROM (
          SELECT fp."trustScore" AS score
          FROM "FreelancerProfile" fp
          JOIN "User" u ON fp."userId" = u."id"
          WHERE u."role" != 'ADMIN' AND fp."trustScore" IS NOT NULL AND fp."trustScore" > 0
          UNION ALL
          SELECT cp."trustScore" AS score
          FROM "ClientProfile" cp
          JOIN "User" u ON cp."userId" = u."id"
          WHERE u."role" != 'ADMIN' AND cp."trustScore" IS NOT NULL AND cp."trustScore" > 0
        ) AS scores
      `,

      // Total freelancers (users with FREELANCER role)
      prisma.user.count({ where: { role: 'FREELANCER' } }),

      // Completed contracts count
      prisma.contract.count({ where: { status: 'COMPLETED' } }),

      // Median hire time: grab recent completed contracts to compute
      prisma.$queryRaw<{ median_hours: number }[]>`
        SELECT COALESCE(
          PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (c."createdAt" - j."createdAt")) / 3600
          ),
          36
        ) AS median_hours
        FROM "Contract" c
        JOIN "Job" j ON c."jobId" = j."id"
        WHERE c."status" = 'COMPLETED'
      `,
    ]);

    const medianHours = hireTimeSample[0]?.median_hours ?? 36;

    return {
      escrowVolume: Number(contractAgg._sum.totalAmount ?? 0),
      medianHireTimeHours: Math.round(medianHours),
      avgTrustScore: Math.round(Number(avgTrustResult[0]?.avg_score ?? 0)),
      platformFeePercent: '1–3%',
      totalFreelancers,
      completedContracts,
    };
  }

  private async _fetchFeaturedReviews(limit: number): Promise<FeaturedReview[]> {
    const reviews = await prisma.review.findMany({
      where: {
        isPublic: true,
        comment: { not: null },
        overallRating: { gte: 4 },
      },
      orderBy: [
        { overallRating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: Math.min(limit, 6),
      select: {
        id: true,
        overallRating: true,
        comment: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            role: true,
            avatarUrl: true,
            freelancerProfile: {
              select: { trustScore: true },
            },
            clientProfile: {
              select: { trustScore: true },
            },
          },
        },
      },
    });

    return reviews.map((r) => {
      const authorName = r.author.name ?? 'Anonymous';
      const initials = authorName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const authorTrustScore = Number(
        r.author.freelancerProfile?.trustScore ?? r.author.clientProfile?.trustScore ?? 0,
      );

      return {
        id: r.id,
        overallRating: Number(r.overallRating),
        comment: r.comment ?? '',
        createdAt: r.createdAt.toISOString(),
        author: {
          name: authorName,
          role: r.author.role,
          initials,
          avatarUrl: r.author.avatarUrl,
          trustScore: authorTrustScore,
        },
      };
    });
  }
}

export const publicService = new PublicService();
