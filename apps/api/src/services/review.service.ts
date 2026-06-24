import { createHash } from 'crypto';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware';
import { notificationService } from './notification.service';
import { trustScoreService } from './trustScore.service';
import { ipfsService } from './ipfs.service';
import { blockchainService } from './blockchain.service';
import type { CreateReviewInput, GetReviewsQuery } from '../validators/review.validator';

// 14-day double-blind window (SRS FR-J7.2)
const DOUBLE_BLIND_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export class ReviewService {
  /**
   * Submit a review for a completed contract.
   * Enforces: one review per author per contract, contract must be COMPLETED,
   * author must be a party, and double-blind visibility rules.
   */
  async submitReview(authorId: string, input: CreateReviewInput) {
    const contract = await prisma.contract.findUnique({
      where: { id: input.contractId },
      select: {
        id: true,
        status: true,
        clientId: true,
        freelancerId: true,
        completedAt: true,
        title: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    if (contract.status !== 'COMPLETED') {
      throw new ValidationError('Reviews can only be submitted for completed contracts');
    }

    const isClient = contract.clientId === authorId;
    const isFreelancer = contract.freelancerId === authorId;

    if (!isClient && !isFreelancer) {
      throw new ForbiddenError('Only contract parties can submit reviews');
    }

    // Determine who the review is about
    const subjectId = isClient ? contract.freelancerId : contract.clientId;

    // Check for duplicate review
    const existing = await prisma.review.findUnique({
      where: {
        contractId_authorId: {
          contractId: input.contractId,
          authorId,
        },
      },
    });

    if (existing) {
      throw new ValidationError('You have already submitted a review for this contract');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        contractId: input.contractId,
        authorId,
        subjectId,
        overallRating: input.overallRating,
        communicationRating: input.communicationRating ?? null,
        qualityRating: input.qualityRating ?? null,
        timelinessRating: input.timelinessRating ?? null,
        professionalismRating: input.professionalismRating ?? null,
        comment: input.comment ?? null,
        isPublic: true,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        subject: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Upload review content to IPFS (SRS FR-J7.7) — async, non-blocking
    this.uploadToIpfsAndBlockchain(review.id, input, contract, subjectId).catch((err) => {
      console.error(`[ReviewService] IPFS/blockchain integration failed for review ${review.id}:`, err);
    });

    // Update subject's review count and average rating
    await this.updateUserReviewStats(subjectId);

    // Recalculate trust scores for both parties (SRS Module 4)
    await trustScoreService.getTrustScoreBreakdown(subjectId).catch((err) => {
      console.error(`[ReviewService] Failed to recalculate trust score for subject ${subjectId}:`, err);
    });
    await trustScoreService.getTrustScoreBreakdown(authorId).catch((err) => {
      console.error(`[ReviewService] Failed to recalculate trust score for author ${authorId}:`, err);
    });

    // Notify the other party
    await notificationService.createNotification({
      userId: subjectId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review Received',
      message: `You received a ${input.overallRating}-star review for "${contract.title}".`,
      data: { contractId: input.contractId, reviewId: review.id },
    });

    return review;
  }

  /**
   * Get reviews for a specific user with pagination.
   * Respects double-blind: hides reviews where the other party hasn't
   * reviewed yet and the 14-day window hasn't elapsed.
   */
  async getUserReviews(userId: string, query: GetReviewsQuery, viewerId?: string) {
    const { role, page, limit, minRating, maxRating, search, sort = 'createdAt', order = 'desc' } = query;

    const where: Record<string, unknown> = { subjectId: userId, isPublic: true };

    if (role === 'as_freelancer') {
      // Reviews where the user was the freelancer (subject) and author was client
      where.contract = { freelancerId: userId };
    } else if (role === 'as_client') {
      where.contract = { clientId: userId };
    }

    // Rating filters (M3-I9)
    if (minRating !== undefined || maxRating !== undefined) {
      where.overallRating = {
        ...(minRating !== undefined ? { gte: minRating } : {}),
        ...(maxRating !== undefined ? { lte: maxRating } : {}),
      };
    }

    // Search filter — match against comment text (M3-I9)
    if (search) {
      where.comment = { contains: search, mode: 'insensitive' };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          subject: { select: { id: true, name: true, avatarUrl: true } },
          contract: {
            select: {
              id: true,
              title: true,
              completedAt: true,
              clientId: true,
              freelancerId: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Apply double-blind filter: hide review if counterpart hasn't reviewed yet
    // and 14-day window hasn't closed, UNLESS the viewer is the author
    const now = Date.now();

    // Batch-fetch counterpart reviews to avoid N+1 queries
    const contractIds = [...new Set(reviews.map((r: { contractId: string }) => r.contractId))];
    const counterpartReviews = await prisma.review.findMany({
      where: { contractId: { in: contractIds } },
      select: { contractId: true, authorId: true },
    });
    const counterpartSet = new Set(
      counterpartReviews.map((r: { contractId: string; authorId: string }) => `${r.contractId}:${r.authorId}`)
    );

    type ReviewItem = (typeof reviews)[number];
    const filtered = reviews.filter((review: ReviewItem) => {
      const completedAt = review.contract.completedAt
        ? new Date(review.contract.completedAt).getTime()
        : 0;
      const windowClosed = now - completedAt > DOUBLE_BLIND_WINDOW_MS;

      // Always visible if window closed or viewer is the author
      if (windowClosed || review.authorId === viewerId) {
        return true;
      }

      // Both submitted → visible
      if (counterpartSet.has(`${review.contractId}:${review.subjectId}`)) {
        return true;
      }

      // Within window and counterpart hasn't reviewed → hide from the subject
      if (review.subjectId === viewerId) {
        return false;
      }

      return true;
    });

    // Use filtered count for accurate pagination (double-blind may hide items)
    const filteredTotal = total - (reviews.length - filtered.length);

    return {
      items: filtered,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.ceil(filteredTotal / limit),
      hasNext: page * limit < filteredTotal,
      hasPrev: page > 1,
    };
  }

  /**
   * Get reviews for a specific contract (both parties' reviews).
   * Respects double-blind rules.
   */
  async getContractReviews(contractId: string, viewerId?: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, completedAt: true, clientId: true, freelancerId: true },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    const reviews = await prisma.review.findMany({
      where: { contractId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        subject: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = Date.now();
    const completedAt = contract.completedAt
      ? new Date(contract.completedAt).getTime()
      : 0;
    const windowClosed = now - completedAt > DOUBLE_BLIND_WINDOW_MS;
    const bothSubmitted = reviews.length >= 2;

    // If window closed or both submitted, show all
    if (windowClosed || bothSubmitted) {
      return { items: reviews, canReview: this.canReview(reviews, viewerId, contract) };
    }

    // Otherwise only show the viewer's own review
    const visible = reviews.filter((r: { authorId: string }) => r.authorId === viewerId);
    return { items: visible, canReview: this.canReview(reviews, viewerId, contract) };
  }

  /**
   * Get review summary (aggregated ratings) for a user.
   */
  async getReviewSummary(userId: string) {
    const aggregate = await prisma.review.aggregate({
      where: { subjectId: userId, isPublic: true },
      _avg: {
        overallRating: true,
        communicationRating: true,
        qualityRating: true,
        timelinessRating: true,
        professionalismRating: true,
      },
      _count: true,
    });

    // Rating distribution
    const distribution = await prisma.review.groupBy({
      by: ['overallRating'],
      where: { subjectId: userId, isPublic: true },
      _count: true,
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const entry of distribution) {
      const rounded = Math.round(Number(entry.overallRating));
      if (rounded >= 1 && rounded <= 5) {
        ratingDistribution[rounded] += entry._count;
      }
    }

    return {
      averageRating: Number(aggregate._avg.overallRating ?? 0),
      averageCommunication: Number(aggregate._avg.communicationRating ?? 0),
      averageQuality: Number(aggregate._avg.qualityRating ?? 0),
      averageTimeliness: Number(aggregate._avg.timelinessRating ?? 0),
      averageProfessionalism: Number(aggregate._avg.professionalismRating ?? 0),
      totalReviews: aggregate._count,
      ratingDistribution,
    };
  }

  /**
   * Check whether the viewer has already reviewed this contract.
   */
  async hasReviewed(contractId: string, userId: string): Promise<boolean> {
    const review = await prisma.review.findUnique({
      where: { contractId_authorId: { contractId, authorId: userId } },
      select: { id: true },
    });
    return !!review;
  }

  /**
   * Submit a one-time immutable response (rebuttal) to a review.
   * Only the review subject (the person who was reviewed) can respond.
   * Response cannot be edited or deleted once submitted (SRS M3-I6).
   */
  async submitResponse(reviewId: string, userId: string, responseText: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, subjectId: true, responseText: true },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.subjectId !== userId) {
      throw new ForbiddenError('Only the reviewed party can respond to a review');
    }

    if (review.responseText) {
      throw new ValidationError('A response has already been submitted for this review');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        responseText,
        responseAt: new Date(),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        subject: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return updated;
  }

  // ── private helpers ────────────────────────────────────────────────

  /**
   * Upload review content to IPFS and record hash on blockchain.
   * Runs asynchronously after review creation to avoid blocking the response.
   */
  private async uploadToIpfsAndBlockchain(
    reviewId: string,
    input: CreateReviewInput,
    contract: { id: string; clientId: string; freelancerId: string },
    subjectId: string,
  ) {
    // 1. Upload to IPFS
    const ipfsContent = {
      contractId: input.contractId,
      overallRating: input.overallRating,
      communicationRating: input.communicationRating,
      qualityRating: input.qualityRating,
      timelinessRating: input.timelinessRating,
      professionalismRating: input.professionalismRating,
      comment: input.comment,
      timestamp: new Date().toISOString(),
    };

    const ipfsHash = await ipfsService.uploadJSON(ipfsContent, `review-${reviewId}`);

    // 2. Record on blockchain
    // Use the subject's wallet address if available; otherwise derive a
    // deterministic pseudo-address from their userId so reviews for users
    // without wallets (e.g. clients who haven't connected MetaMask) are
    // still recorded on-chain.
    let blockchainTxHash: string | null = null;
    const subjectUser = await prisma.user.findUnique({
      where: { id: subjectId },
      select: { walletAddress: true },
    });

    const reviewedAddress = subjectUser?.walletAddress
      || ('0x' + createHash('sha256').update(subjectId).digest('hex').slice(0, 40));

    blockchainTxHash = await blockchainService.recordFeedback(
      contract.id,
      reviewedAddress,
      ipfsHash,
      Math.round(Number(input.overallRating)),
    );

    // 3. Update review with hashes
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        ipfsHash,
        ...(blockchainTxHash ? { blockchainTxHash } : {}),
      },
    });
  }

  private canReview(
    reviews: Array<{ authorId: string }>,
    viewerId: string | undefined,
    contract: { clientId: string; freelancerId: string }
  ): boolean {
    if (!viewerId) return false;
    const isParty = contract.clientId === viewerId || contract.freelancerId === viewerId;
    if (!isParty) return false;
    return !reviews.some((r) => r.authorId === viewerId);
  }

  private async updateUserReviewStats(userId: string) {
    const agg = await prisma.review.aggregate({
      where: { subjectId: userId, isPublic: true },
      _avg: { overallRating: true },
      _count: true,
    });

    const avgRating = Number(agg._avg.overallRating ?? 0);
    const totalReviews = agg._count;

    // Update whichever profile exists
    await prisma.freelancerProfile.updateMany({
      where: { userId },
      data: { avgRating, totalReviews },
    });

    await prisma.clientProfile.updateMany({
      where: { userId },
      data: { avgRating, totalReviews },
    });
  }
}

export const reviewService = new ReviewService();
export default reviewService;