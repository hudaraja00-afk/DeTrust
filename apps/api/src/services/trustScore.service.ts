import { prisma } from '../config/database';
import { emitTrustScoreUpdated } from '../events/trustScore.events';

/**
 * Trust Score Formulas (SRS Module 4):
 *
 * Freelancer: (0.4 × AvgRating) + (0.3 × CompletionRate) + (0.2 × DisputeWinRate) + (0.1 × Experience)
 * Client:     (0.4 × AvgRating) + (0.3 × PaymentPunctuality) + (0.2 × HireRate) + (0.1 × JobClarityRating)
 *
 * All components are normalized to 0–100 scale before weighting.
 *
 * Eligibility: Users must have ≥ 5 completed contracts for a meaningful trust score.
 *
 * Client Penalties (post-formula deductions):
 * - Cancellation rate penalty: up to -10 pts
 * - Dispute behavior penalty: up to -15 pts
 *
 * Inactivity Decay (M4-I6):
 * If user has no contract activity for > 90 days, apply a gradual decay:
 * decayFactor = max(0.5, 1 - (inactiveDays - 90) / 365)
 * Final score = rawScore × decayFactor
 */

const INACTIVITY_THRESHOLD_DAYS = 90;
const MAX_DECAY_DAYS = 365;
const MIN_DECAY_FACTOR = 0.5;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Minimum completed contracts required for a meaningful trust score */
const MIN_CONTRACTS_FOR_TRUST_SCORE = 5;

/** Maximum cancellation rate penalty for clients */
const MAX_CANCELLATION_PENALTY = 10;

/** Maximum dispute behavior penalty for clients */
const MAX_DISPUTE_PENALTY = 15;

export interface TrustScoreComponent {
  label: string;
  weight: number;
  rawValue: number;
  normalizedValue: number;
  weightedValue: number;
}

export interface TrustScoreBreakdown {
  totalScore: number | null;
  eligible: boolean;
  minimumContracts?: number;
  currentContracts?: number;
  components: TrustScoreComponent[];
}

export class TrustScoreService {
  /**
   * Recalculate and persist the freelancer trust score.
   * Called after each completed contract / review submission.
   */
  async computeFreelancerTrustScore(userId: string): Promise<TrustScoreBreakdown> {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { avgRating: true, completedJobs: true, totalReviews: true },
    });

    if (!profile) {
      return this.emptyBreakdown();
    }

    // 1. Average Rating (0-5 → 0-100)
    const avgRating = Number(profile.avgRating ?? 0);
    const normalizedRating = (avgRating / 5) * 100;

    // 2. Completion Rate: completed / total contracts (as percentage)
    const totalContracts = await prisma.contract.count({
      where: { freelancerId: userId },
    });
    const completedContracts = await prisma.contract.count({
      where: { freelancerId: userId, status: 'COMPLETED' },
    });
    const completionRate = totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0;

    // Eligibility gate: < 5 completed contracts → ineligible
    if (completedContracts < MIN_CONTRACTS_FOR_TRUST_SCORE) {
      await prisma.freelancerProfile.update({
        where: { userId },
        data: { trustScore: 0, completedJobs: completedContracts, successRate: Math.round(completionRate * 100) / 100 },
      });
      return {
        totalScore: null,
        eligible: false,
        minimumContracts: MIN_CONTRACTS_FOR_TRUST_SCORE,
        currentContracts: completedContracts,
        components: [],
      };
    }

    // 3. Dispute Win Rate: disputes resolved in their favor / total disputes
    //    Default to 50 (neutral) when no disputes exist — a new freelancer
    //    without any disputes should not be penalized or rewarded.
    const totalDisputes = await prisma.dispute.count({
      where: {
        contract: { freelancerId: userId },
      },
    });
    const wonDisputes = await prisma.dispute.count({
      where: {
        contract: { freelancerId: userId },
        outcome: 'FREELANCER_WINS',
      },
    });
    const NEUTRAL_DISPUTE_SCORE = 50;
    const disputeWinRate = totalDisputes > 0 ? (wonDisputes / totalDisputes) * 100 : NEUTRAL_DISPUTE_SCORE;

    // 4. Experience: normalize completed jobs (cap at 50 for 100%)
    const experienceScore = Math.min((completedContracts / 50) * 100, 100);

    const components: TrustScoreComponent[] = [
      { label: 'Average Rating', weight: 0.4, rawValue: avgRating, normalizedValue: normalizedRating },
      { label: 'Completion Rate', weight: 0.3, rawValue: completionRate, normalizedValue: completionRate },
      { label: 'Dispute Win Rate', weight: 0.2, rawValue: disputeWinRate, normalizedValue: disputeWinRate },
      { label: 'Experience', weight: 0.1, rawValue: completedContracts, normalizedValue: experienceScore },
    ].map((c) => ({
      ...c,
      weightedValue: Math.round((c.normalizedValue * c.weight) * 100) / 100,
    }));

    // Dispute Record — informational component (always visible, matches client view)
    components.push({
      label: 'Dispute Record',
      weight: 0,
      rawValue: totalDisputes,
      normalizedValue: totalDisputes > 0 ? Math.round((wonDisputes / totalDisputes) * 100) : 0,
      weightedValue: 0, // Informational only
    });

    const rawScore = Math.round(components.reduce((sum, c) => sum + c.weightedValue, 0) * 100) / 100;

    // Apply inactivity decay (M4-I6)
    const decayFactor = await this.getInactivityDecayFactor(userId);
    const totalScore = Math.round(rawScore * decayFactor * 100) / 100;

    // Persist
    await prisma.freelancerProfile.update({
      where: { userId },
      data: {
        trustScore: totalScore,
        completedJobs: completedContracts,
        successRate: Math.round(completionRate * 100) / 100,
      },
    });

    const breakdown: TrustScoreBreakdown = { totalScore, eligible: true, components };
    emitTrustScoreUpdated(userId, breakdown);
    return breakdown;
  }

  /**
   * Recalculate and persist the client trust score.
   * Called after each completed contract / review submission.
   */
  async computeClientTrustScore(userId: string): Promise<TrustScoreBreakdown> {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { avgRating: true, hireRate: true, jobsPosted: true, totalReviews: true },
    });

    if (!profile) {
      return this.emptyBreakdown();
    }

    // 1. Average Rating (0-5 → 0-100)
    const avgRating = Number(profile.avgRating ?? 0);
    const normalizedRating = (avgRating / 5) * 100;

    // 2. Payment Punctuality: percentage of milestones approved without delay
    //    Approximate via completed contracts / total contracts
    const totalContracts = await prisma.contract.count({
      where: { clientId: userId },
    });
    const completedContracts = await prisma.contract.count({
      where: { clientId: userId, status: 'COMPLETED' },
    });
    const paymentPunctuality = totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0;

    // Eligibility gate: < 5 completed contracts → ineligible
    if (completedContracts < MIN_CONTRACTS_FOR_TRUST_SCORE) {
      await prisma.clientProfile.update({
        where: { userId },
        data: { trustScore: 0, hireRate: 0 },
      });
      return {
        totalScore: null,
        eligible: false,
        minimumContracts: MIN_CONTRACTS_FOR_TRUST_SCORE,
        currentContracts: completedContracts,
        components: [],
      };
    }

    // 3. Hire Rate: contracts created / jobs posted
    const jobsPosted = Number(profile.jobsPosted ?? 0);
    const hireRate = jobsPosted > 0 ? (totalContracts / jobsPosted) * 100 : 0;
    const normalizedHireRate = Math.min(hireRate, 100);

    // 4. Job Clarity Rating: average qualityRating from freelancer reviews
    //    (qualityRating is remapped to "Job Clarity" for freelancer→client reviews)
    const clarityAgg = await prisma.review.aggregate({
      where: {
        subjectId: userId,
        isPublic: true,
        qualityRating: { not: null },
      },
      _avg: { qualityRating: true },
    });
    const jobClarityRating = Number(clarityAgg._avg.qualityRating ?? 0);
    const normalizedClarity = (jobClarityRating / 5) * 100;

    const components: TrustScoreComponent[] = [
      { label: 'Average Rating', weight: 0.4, rawValue: avgRating, normalizedValue: normalizedRating },
      { label: 'Payment Punctuality', weight: 0.3, rawValue: paymentPunctuality, normalizedValue: paymentPunctuality },
      { label: 'Hire Rate', weight: 0.2, rawValue: hireRate, normalizedValue: normalizedHireRate },
      { label: 'Job Clarity Rating', weight: 0.1, rawValue: jobClarityRating, normalizedValue: normalizedClarity },
    ].map((c) => ({
      ...c,
      weightedValue: Math.round((c.normalizedValue * c.weight) * 100) / 100,
    }));

    const rawScore = Math.round(components.reduce((sum, c) => sum + c.weightedValue, 0) * 100) / 100;

    // ------- Client Penalty Modifiers (post-formula deductions) -------

    // Cancellation rate penalty: up to -10 pts
    const cancelledContracts = await prisma.contract.count({
      where: { clientId: userId, status: 'CANCELLED' },
    });
    const cancellationRate = totalContracts > 0 ? cancelledContracts / totalContracts : 0;
    const cancellationPenalty = Math.round(cancellationRate * MAX_CANCELLATION_PENALTY * 100) / 100;

    // Always show cancellation component (even when 0) for transparency
    components.push({
      label: 'Cancellation Penalty',
      weight: 0,
      rawValue: cancelledContracts,
      normalizedValue: cancellationRate * 100,
      weightedValue: cancellationPenalty > 0 ? -cancellationPenalty : 0,
    });

    // Dispute behavior penalty: up to -15 pts (only disputes the client LOST)
    const totalDisputes = await prisma.dispute.count({
      where: { contract: { clientId: userId } },
    });
    const clientLostDisputes = await prisma.dispute.count({
      where: {
        contract: { clientId: userId },
        outcome: 'FREELANCER_WINS',
      },
    });
    const clientWonDisputes = await prisma.dispute.count({
      where: {
        contract: { clientId: userId },
        outcome: 'CLIENT_WINS',
      },
    });
    const disputeRate = totalContracts > 0 ? clientLostDisputes / totalContracts : 0;
    const disputePenalty = Math.round(disputeRate * MAX_DISPUTE_PENALTY * 100) / 100;

    // Always show dispute component for transparency
    components.push({
      label: 'Dispute Behavior Penalty',
      weight: 0,
      rawValue: clientLostDisputes,
      normalizedValue: disputeRate * 100,
      weightedValue: disputePenalty > 0 ? -disputePenalty : 0,
    });

    // Add dispute summary — informational bar (matches freelancer visual)
    const disputeWinRate = totalDisputes > 0
      ? Math.round((clientWonDisputes / totalDisputes) * 100)
      : 0;
    components.push({
      label: 'Dispute Win Rate',
      weight: 0,
      rawValue: disputeWinRate,
      normalizedValue: disputeWinRate,
      weightedValue: 0, // Informational bar — not factored into client score
    });

    const penalizedScore = Math.max(0, rawScore - cancellationPenalty - disputePenalty);

    // Apply inactivity decay (M4-I6)
    const decayFactor = await this.getInactivityDecayFactor(userId);
    const totalScore = Math.round(penalizedScore * decayFactor * 100) / 100;

    // Persist
    await prisma.clientProfile.update({
      where: { userId },
      data: {
        trustScore: totalScore,
        hireRate: Math.round(normalizedHireRate * 100) / 100,
      },
    });

    const breakdown: TrustScoreBreakdown = { totalScore, eligible: true, components };
    emitTrustScoreUpdated(userId, breakdown);
    return breakdown;
  }

  /**
   * Get the breakdown by computing fresh values.
   */
  async getTrustScoreBreakdown(userId: string): Promise<TrustScoreBreakdown> {
    // Determine role by checking which profile exists
    const freelancer = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (freelancer) {
      return this.computeFreelancerTrustScore(userId);
    }

    const client = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (client) {
      return this.computeClientTrustScore(userId);
    }

    return this.emptyBreakdown();
  }

  private emptyBreakdown(): TrustScoreBreakdown {
    return { totalScore: null, eligible: false, components: [] };
  }

  /**
   * Get paginated trust score history for a user.
   */
  async getHistory(userId: string, limit = 30): Promise<{ items: Array<{ id: string; score: number; breakdown: unknown; createdAt: Date }>; total: number }> {
    const [items, total] = await Promise.all([
      prisma.trustScoreHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        select: {
          id: true,
          score: true,
          breakdown: true,
          createdAt: true,
        },
      }),
      prisma.trustScoreHistory.count({ where: { userId } }),
    ]);

    return {
      items: items.reverse().map((i) => ({
        ...i,
        score: Number(i.score),
      })), // Return oldest-first for chart rendering
      total,
    };
  }

  /**
   * Calculate inactivity decay factor (M4-I6).
   * Returns 1.0 for active users, gradually decreasing to MIN_DECAY_FACTOR
   * for users inactive > 90 days.
   */
  private async getInactivityDecayFactor(userId: string): Promise<number> {
    // Find most recent contract activity (created, updated, or completed)
    const latestContract = await prisma.contract.findFirst({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    if (!latestContract) return 1.0; // New user, no decay

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(latestContract.updatedAt).getTime()) / MS_PER_DAY,
    );

    if (daysSinceActivity <= INACTIVITY_THRESHOLD_DAYS) return 1.0;

    const excessDays = daysSinceActivity - INACTIVITY_THRESHOLD_DAYS;
    return Math.max(MIN_DECAY_FACTOR, 1 - excessDays / MAX_DECAY_DAYS);
  }
}

export const trustScoreService = new TrustScoreService();
export default trustScoreService;
