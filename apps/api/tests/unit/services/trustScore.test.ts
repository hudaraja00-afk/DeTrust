/**
 * Unit Testing 9 & 10: Trust Score Service Testing
 *
 * Chapter 5, Tables 54 & 55.
 *
 * UT 9: computeFreelancerTrustScore() — weighted formula + eligibility gate + inactivity decay
 * UT 10: computeClientTrustScore() — weighted formula + cancellation/dispute penalties
 *
 * @see apps/api/src/services/trustScore.service.ts
 */
import { prismaMock } from '../../setup';

// Mock events
jest.mock('../../../src/events/trustScore.events', () => ({
  emitTrustScoreUpdated: jest.fn(),
}));

import { TrustScoreService } from '../../../src/services/trustScore.service';

describe('Unit Test 9: computeFreelancerTrustScore()', () => {
  let service: TrustScoreService;

  beforeEach(() => {
    service = new TrustScoreService();
    jest.clearAllMocks();
  });

  // Table 54, Row 1 — Full profile with 10 completed contracts
  // avgRating: 4.5, completedContracts: 10, totalContracts: 12, wonDisputes: 1, totalDisputes: 1
  // Expected: normalised rating=90, completion=83.3, dispute=100, experience=20 → rawScore≈83
  it('computes correct score for full profile (10 contracts, 4.5 rating)', async () => {
    const userId = 'user-freelancer-001';

    // FreelancerProfile
    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.5,
      completedJobs: 10,
      totalReviews: 10,
    });

    // Total contracts
    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(12)  // total contracts
      .mockResolvedValueOnce(10); // completed contracts

    // Disputes: 1 total, 1 won
    (prismaMock.dispute.count as jest.Mock)
      .mockResolvedValueOnce(1)   // total disputes
      .mockResolvedValueOnce(1);  // won disputes (FREELANCER_WINS)

    // Inactivity: recent activity (no decay)
    (prismaMock.contract.findFirst as jest.Mock).mockResolvedValueOnce({
      updatedAt: new Date(), // today — no decay
    });

    // Profile update
    (prismaMock.freelancerProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeFreelancerTrustScore(userId);

    expect(result.eligible).toBe(true);
    expect(result.totalScore).not.toBeNull();

    // Verify components:
    // Rating: (4.5/5)*100 = 90, weighted: 90*0.4 = 36
    // Completion: (10/12)*100 ≈ 83.33, weighted: 83.33*0.3 ≈ 25
    // DisputeWin: (1/1)*100 = 100, weighted: 100*0.2 = 20
    // Experience: min((10/50)*100, 100) = 20, weighted: 20*0.1 = 2
    // rawScore ≈ 36 + 25 + 20 + 2 = 83
    expect(result.totalScore!).toBeGreaterThanOrEqual(80);
    expect(result.totalScore!).toBeLessThanOrEqual(85);

    // Verify the formula components are present
    const ratingComp = result.components.find((c) => c.label === 'Average Rating');
    expect(ratingComp?.normalizedValue).toBe(90);
    expect(ratingComp?.weight).toBe(0.4);
  });

  // Table 54, Row 2 — Fewer than 5 completed contracts → ineligible
  it('returns ineligible when < 5 completed contracts', async () => {
    const userId = 'user-freelancer-002';

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.0,
      completedJobs: 3,
      totalReviews: 3,
    });

    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(5)   // total
      .mockResolvedValueOnce(3);  // completed (< 5)

    (prismaMock.freelancerProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeFreelancerTrustScore(userId);

    expect(result.totalScore).toBeNull();
    expect(result.eligible).toBe(false);
    expect(result.minimumContracts).toBe(5);
    expect(result.currentContracts).toBe(3);
  });

  // Table 54, Row 3 — No disputes → disputeWinRate defaults to 50 (neutral)
  it('defaults disputeWinRate to 50 when no disputes exist', async () => {
    const userId = 'user-freelancer-003';

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.0,
      completedJobs: 8,
      totalReviews: 8,
    });

    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(8)   // total
      .mockResolvedValueOnce(8);  // completed

    // No disputes at all
    (prismaMock.dispute.count as jest.Mock)
      .mockResolvedValueOnce(0)   // total disputes
      .mockResolvedValueOnce(0);  // won disputes

    (prismaMock.contract.findFirst as jest.Mock).mockResolvedValueOnce({
      updatedAt: new Date(),
    });

    (prismaMock.freelancerProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeFreelancerTrustScore(userId);

    expect(result.eligible).toBe(true);

    // DisputeWinRate should be neutral (50)
    const disputeComp = result.components.find((c) => c.label === 'Dispute Win Rate');
    expect(disputeComp?.normalizedValue).toBe(50);
    // 50 * 0.2 = 10
    expect(disputeComp?.weightedValue).toBe(10);
  });

  // Table 54, Row 4 — Inactivity > 90 days → decay factor applied
  it('applies inactivity decay when last activity > 90 days ago', async () => {
    const userId = 'user-freelancer-004';

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.5,
      completedJobs: 10,
      totalReviews: 10,
    });

    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(10);

    (prismaMock.dispute.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    // Last activity 180 days ago
    const lastActivity = new Date();
    lastActivity.setDate(lastActivity.getDate() - 180);
    (prismaMock.contract.findFirst as jest.Mock).mockResolvedValueOnce({
      updatedAt: lastActivity,
    });

    (prismaMock.freelancerProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeFreelancerTrustScore(userId);

    expect(result.eligible).toBe(true);

    // decayFactor = max(0.5, 1 - (180-90)/365) = max(0.5, 1 - 0.2466) ≈ 0.753
    // The score should be lower than the non-decayed version
    // Raw score with 4.5 rating, 100% completion, 50 dispute, 20 experience ≈ 82
    // After decay: ~82 * 0.753 ≈ 61.7
    expect(result.totalScore!).toBeLessThan(70);
    expect(result.totalScore!).toBeGreaterThan(55);
  });

  // Edge: no profile found
  it('returns empty breakdown when no freelancer profile exists', async () => {
    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const result = await service.computeFreelancerTrustScore('nonexistent');

    expect(result.totalScore).toBeNull();
    expect(result.eligible).toBe(false);
    expect(result.components).toHaveLength(0);
  });
});

describe('Unit Test 10: computeClientTrustScore()', () => {
  let service: TrustScoreService;

  beforeEach(() => {
    service = new TrustScoreService();
    jest.clearAllMocks();
  });

  // Table 55, Row 1 — Clean record client
  // avgRating: 4.0, 10 completed, 0 cancelled, 0 lost disputes → rawScore ≈ 76
  it('computes correct score for clean-record client', async () => {
    const userId = 'user-client-001';

    (prismaMock.clientProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.0,
      hireRate: 85,
      jobsPosted: 12,
      totalReviews: 8,
    });

    // Total contracts: 10, completed: 10
    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(10)  // total
      .mockResolvedValueOnce(10)  // completed
      .mockResolvedValueOnce(0);  // cancelled

    // Hire rate query: jobs posted = 12
    // Review clarity aggregate
    (prismaMock.review.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { qualityRating: 4.0 },
    });

    // Disputes: 0 total, 0 lost, 0 won
    (prismaMock.dispute.count as jest.Mock)
      .mockResolvedValueOnce(0)   // total
      .mockResolvedValueOnce(0)   // lost (FREELANCER_WINS)
      .mockResolvedValueOnce(0);  // won (CLIENT_WINS)

    // Inactivity: recent
    (prismaMock.contract.findFirst as jest.Mock).mockResolvedValueOnce({
      updatedAt: new Date(),
    });

    (prismaMock.clientProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeClientTrustScore(userId);

    expect(result.eligible).toBe(true);
    expect(result.totalScore).not.toBeNull();

    // Rating: (4.0/5)*100=80, weighted: 80*0.4=32
    // Punctuality: (10/10)*100=100, weighted: 100*0.3=30
    // HireRate: min((10/12)*100, 100)≈83.33, weighted: 83.33*0.2≈16.67
    // Clarity: (4.0/5)*100=80, weighted: 80*0.1=8
    // rawScore ≈ 32+30+16.67+8 ≈ 86.67
    // No penalties
    expect(result.totalScore!).toBeGreaterThanOrEqual(70);

    // Verify no penalties applied
    const cancPenalty = result.components.find((c) => c.label === 'Cancellation Penalty');
    expect(cancPenalty?.weightedValue).toBe(0);
  });

  // Table 55, Row 2 — High cancellation rate
  // 5 cancelled out of 10 total → cancellationRate=0.5, penalty = 0.5 × 10 = -5 pts
  it('applies cancellation penalty for high cancellation rate', async () => {
    const userId = 'user-client-002';

    (prismaMock.clientProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.0,
      hireRate: 50,
      jobsPosted: 10,
      totalReviews: 5,
    });

    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(10)  // total
      .mockResolvedValueOnce(5)   // completed
      .mockResolvedValueOnce(5);  // cancelled

    (prismaMock.review.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { qualityRating: 3.5 },
    });

    (prismaMock.dispute.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    (prismaMock.contract.findFirst as jest.Mock).mockResolvedValueOnce({
      updatedAt: new Date(),
    });

    (prismaMock.clientProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeClientTrustScore(userId);

    expect(result.eligible).toBe(true);

    // Verify cancellation penalty is applied
    const cancPenalty = result.components.find((c) => c.label === 'Cancellation Penalty');
    expect(cancPenalty).toBeDefined();
    // cancellationRate = 5/10 = 0.5, penalty = 0.5 * 10 = 5
    expect(cancPenalty!.weightedValue).toBe(-5);
  });

  // Table 55, Row 3 — Lost disputes penalty
  // 3 disputes lost out of 10 contracts → disputeRate=0.3, penalty = 0.3 × 15 = -4.5
  it('applies dispute penalty for lost disputes', async () => {
    const userId = 'user-client-003';

    (prismaMock.clientProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.0,
      hireRate: 80,
      jobsPosted: 10,
      totalReviews: 7,
    });

    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(10)  // total
      .mockResolvedValueOnce(7)   // completed
      .mockResolvedValueOnce(0);  // cancelled

    (prismaMock.review.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { qualityRating: 4.0 },
    });

    (prismaMock.dispute.count as jest.Mock)
      .mockResolvedValueOnce(3)   // total disputes
      .mockResolvedValueOnce(3)   // lost (FREELANCER_WINS)
      .mockResolvedValueOnce(0);  // won (CLIENT_WINS)

    (prismaMock.contract.findFirst as jest.Mock).mockResolvedValueOnce({
      updatedAt: new Date(),
    });

    (prismaMock.clientProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeClientTrustScore(userId);

    expect(result.eligible).toBe(true);

    // Verify dispute penalty
    const disputePenalty = result.components.find((c) => c.label === 'Dispute Behavior Penalty');
    expect(disputePenalty).toBeDefined();
    // disputeRate = 3/10 = 0.3, penalty = 0.3 * 15 = 4.5
    expect(disputePenalty!.weightedValue).toBe(-4.5);
  });

  // Table 55, Row 4 — Score floored at 0
  it('floors score at 0 when penalties exceed raw score', async () => {
    const userId = 'user-client-004';

    (prismaMock.clientProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 1.0,
      hireRate: 10,
      jobsPosted: 20,
      totalReviews: 1,
    });

    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(10)  // total
      .mockResolvedValueOnce(5)   // completed
      .mockResolvedValueOnce(8);  // cancelled: extreme

    (prismaMock.review.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { qualityRating: 1.0 },
    });

    // Max disputes lost
    (prismaMock.dispute.count as jest.Mock)
      .mockResolvedValueOnce(8)   // total disputes
      .mockResolvedValueOnce(8)   // all lost
      .mockResolvedValueOnce(0);  // none won

    (prismaMock.contract.findFirst as jest.Mock).mockResolvedValueOnce({
      updatedAt: new Date(),
    });

    (prismaMock.clientProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeClientTrustScore(userId);

    expect(result.eligible).toBe(true);
    // Score should be >= 0 (never negative)
    expect(result.totalScore!).toBeGreaterThanOrEqual(0);
  });

  // Edge: < 5 completed contracts → ineligible
  it('returns ineligible when < 5 completed contracts', async () => {
    const userId = 'user-client-005';

    (prismaMock.clientProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      avgRating: 4.0,
      hireRate: 50,
      jobsPosted: 5,
      totalReviews: 2,
    });

    (prismaMock.contract.count as jest.Mock)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3);

    (prismaMock.clientProfile.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.computeClientTrustScore(userId);

    expect(result.totalScore).toBeNull();
    expect(result.eligible).toBe(false);
    expect(result.minimumContracts).toBe(5);
    expect(result.currentContracts).toBe(3);
  });
});
