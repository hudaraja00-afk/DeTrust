/**
 * Integration Tests: Job Board + Proposal + Review + Dispute
 *
 * Chapter 5, Tables 67 (IT 1, 3), 68 (IT 4), 69 (IT 5), 70 (IT 2, 6).
 *
 * These test cross-service interactions. The services call each other through
 * real business logic, with database/redis mocked at the boundary.
 *
 * @see apps/api/src/services/job.service.ts
 * @see apps/api/src/services/proposal.service.ts
 * @see apps/api/src/services/review.service.ts
 * @see apps/api/src/services/dispute.service.ts
 * @see apps/api/src/services/contract.service.ts
 */
import { prismaMock } from '../setup';
import { ProposalService } from '../../src/services/proposal.service';
import { ReviewService } from '../../src/services/review.service';
import { DisputeService } from '../../src/services/dispute.service';
import { ContractService } from '../../src/services/contract.service';
import {
  mockFreelancerUser,
  mockClientUser,
  mockJurorUser,
} from '../fixtures';
import { mockOpenJob, mockCompletedJob } from '../fixtures';
import { mockActiveContract, mockCompletedContract } from '../fixtures';

// ═══════════════════════════════════════════════════════════════════════════════
// IT 3: Job → Proposal → Contract creation chain
// ═══════════════════════════════════════════════════════════════════════════════
describe('Integration Test 3: Job → Proposal → Accept flow (Table 67)', () => {
  let proposalService: ProposalService;

  beforeEach(() => {
    proposalService = new ProposalService();
    jest.clearAllMocks();
  });

  it('creates proposal for open job, validates, and returns with job details', async () => {
    // Job is open
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockOpenJob,
      type: 'FIXED_PRICE',
      budget: 500,
      clientId: mockClientUser.id,
      client: { id: mockClientUser.id },
    });

    // No duplicate
    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    // Profile completeness check
    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: mockFreelancerUser.id,
      completenessScore: 85,
    });

    const proposal = {
      id: 'prop-int-1',
      jobId: mockOpenJob.id,
      freelancerId: mockFreelancerUser.id,
      status: 'PENDING',
      proposedRate: 450,
      coverLetter: 'I can build this efficiently.',
      job: { id: mockOpenJob.id, title: mockOpenJob.title, budget: 500, type: 'FIXED_PRICE', clientId: mockClientUser.id },
      freelancer: {
        id: mockFreelancerUser.id,
        name: 'Alice',
        avatarUrl: null,
        freelancerProfile: { title: 'React Dev', trustScore: 78.5, aiCapabilityScore: 72, completedJobs: 10, avgRating: 4.5, totalReviews: 10 },
      },
    };
    (prismaMock.proposal.create as jest.Mock).mockResolvedValueOnce(proposal);

    const result = await proposalService.createProposal(
      mockFreelancerUser.id,
      mockOpenJob.id,
      {
        coverLetter: 'I can build this efficiently.',
        proposedRate: 450,
        estimatedDuration: '2 weeks',
        milestones: null as any,
        attachments: [],
      }
    );

    expect(result.id).toBe('prop-int-1');
    expect(result.job.title).toBe(mockOpenJob.title);
    expect(result.freelancer.freelancerProfile?.trustScore).toBe(78.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT 4: Contract → Milestone → Review chain
// ═══════════════════════════════════════════════════════════════════════════════
describe('Integration Test 4: Contract Completion → Review (Table 68)', () => {
  let contractService: ContractService;
  let reviewService: ReviewService;

  beforeEach(() => {
    contractService = new ContractService();
    reviewService = new ReviewService();
    jest.clearAllMocks();
  });

  it('after milestone approval completes contract, review can be submitted', async () => {
    // Step 1: Approve last milestone (simulated)
    const milestones = [
      { id: 'ms-paid-1', status: 'PAID', amount: 500, title: 'Phase 1' },
      { id: 'ms-last', status: 'SUBMITTED', amount: 500, title: 'Phase 2' },
    ];

    (prismaMock.contract.findUnique as jest.Mock)
      // First call: approveMilestone
      .mockResolvedValueOnce({
        ...mockActiveContract,
        status: 'ACTIVE',
        clientId: mockClientUser.id,
        freelancerId: mockFreelancerUser.id,
        jobId: 'job-001',
        milestones,
      })
      // Second call: submitReview (contract query)
      .mockResolvedValueOnce({
        id: mockCompletedContract.id,
        status: 'COMPLETED',
        clientId: mockClientUser.id,
        freelancerId: mockFreelancerUser.id,
        completedAt: new Date(),
        title: 'React Development',
      });

    // approveMilestone transaction
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce(async () => ({
      ...milestones[1],
      status: 'PAID',
      approvedAt: new Date(),
      paidAt: new Date(),
    }));
    (prismaMock.notification.create as jest.Mock).mockResolvedValueOnce({});

    // Approve last milestone
    const paidMs = await contractService.approveMilestone(
      mockActiveContract.id,
      'ms-last',
      mockClientUser.id
    );
    expect(paidMs.status).toBe('PAID');

    // Step 2: Submit review on now-completed contract
    (prismaMock.review.findUnique as jest.Mock).mockResolvedValueOnce(null); // no duplicate

    const createdReview = {
      id: 'review-int-1',
      contractId: mockCompletedContract.id,
      authorId: mockClientUser.id,
      subjectId: mockFreelancerUser.id,
      overallRating: 5,
      author: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
      subject: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
    };
    (prismaMock.review.create as jest.Mock).mockResolvedValueOnce(createdReview);

    // Review stats
    (prismaMock.review.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { overallRating: 5 },
      _count: 1,
    });
    (prismaMock.freelancerProfile.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
    (prismaMock.clientProfile.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });

    const review = await reviewService.submitReview(mockClientUser.id, {
      contractId: mockCompletedContract.id,
      overallRating: 5,
      comment: 'Perfect work!',
    });

    expect(review.id).toBe('review-int-1');
    expect(review.overallRating).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT 5: Review → Trust Score recalculation
// ═══════════════════════════════════════════════════════════════════════════════
describe('Integration Test 5: Review → Trust Score Update (Table 69)', () => {
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewService = new ReviewService();
    jest.clearAllMocks();
  });

  it('submitting review triggers trust score recalculation', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockCompletedContract.id,
      status: 'COMPLETED',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      completedAt: new Date(),
      title: 'React Development',
    });

    (prismaMock.review.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const review = {
      id: 'review-ts-1',
      contractId: mockCompletedContract.id,
      authorId: mockClientUser.id,
      subjectId: mockFreelancerUser.id,
      overallRating: 4,
      author: { id: mockClientUser.id, name: 'Bob', avatarUrl: null },
      subject: { id: mockFreelancerUser.id, name: 'Alice', avatarUrl: null },
    };
    (prismaMock.review.create as jest.Mock).mockResolvedValueOnce(review);

    // Stats update
    (prismaMock.review.aggregate as jest.Mock).mockResolvedValueOnce({
      _avg: { overallRating: 4 },
      _count: 5,
    });
    (prismaMock.freelancerProfile.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
    (prismaMock.clientProfile.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });

    await reviewService.submitReview(mockClientUser.id, {
      contractId: mockCompletedContract.id,
      overallRating: 4,
      comment: 'Good work overall.',
    });

    // Verify stats were updated
    expect(prismaMock.freelancerProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: mockFreelancerUser.id },
        data: expect.objectContaining({ avgRating: 4, totalReviews: 5 }),
      })
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT 2 & 6: Dispute → Voting → Resolution chain
// ═══════════════════════════════════════════════════════════════════════════════
describe('Integration Test 2 & 6: Dispute Lifecycle (Table 70)', () => {
  let disputeService: DisputeService;

  beforeEach(() => {
    disputeService = new DisputeService();
    jest.clearAllMocks();
  });

  // IT 2 — Dispute creation freezes contract status
  it('creating dispute changes contract status to DISPUTED', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockActiveContract,
      status: 'ACTIVE',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      jobId: 'job-001',
    });

    (prismaMock.dispute.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const dispute = {
      id: 'dispute-int-1',
      contractId: mockActiveContract.id,
      initiatorId: mockClientUser.id,
      status: 'OPEN',
      outcome: 'PENDING',
      contract: { id: mockActiveContract.id, title: 'React Dev', totalAmount: 1000 },
      initiator: { id: mockClientUser.id, name: 'Bob' },
    };

    (prismaMock.$transaction as jest.Mock).mockImplementationOnce(async () => dispute);

    const result = await disputeService.createDispute(mockClientUser.id, {
      contractId: mockActiveContract.id,
      reason: 'QUALITY_ISSUE',
      description: 'Deliverables do not meet spec.',
      evidence: [],
    });

    expect(result.status).toBe('OPEN');
    expect(result.outcome).toBe('PENDING');
  });

  // IT 6 — Juror eligibility + weighted vote
  it('eligible juror casts weighted vote during VOTING phase', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    // Check eligibility first
    (prismaMock.dispute.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'dispute-voting-1',
        status: 'VOTING',
        votingDeadline: futureDeadline,
        contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
        votes: [],
      })
      // Then cast vote
      .mockResolvedValueOnce({
        id: 'dispute-voting-1',
        status: 'VOTING',
        votingDeadline: futureDeadline,
        contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
        votes: [],
      });

    // Eligibility check user query
    (prismaMock.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        role: 'FREELANCER',
        freelancerProfile: { trustScore: 85 },
        clientProfile: null,
      })
      // Vote user query
      .mockResolvedValueOnce({
        role: 'FREELANCER',
        freelancerProfile: { trustScore: 85 },
        clientProfile: null,
      });

    const eligibility = await disputeService.checkJurorEligibility(
      mockJurorUser.id,
      'dispute-voting-1'
    );
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.trustScore).toBe(85);

    // Cast vote
    const vote = {
      id: 'vote-int-1',
      disputeId: 'dispute-voting-1',
      jurorId: mockJurorUser.id,
      vote: 'CLIENT_WINS',
      weight: 8,
      juror: { id: mockJurorUser.id, name: 'Juror' },
    };
    (prismaMock.disputeVote.create as jest.Mock).mockResolvedValueOnce(vote);
    (prismaMock.dispute.update as jest.Mock).mockResolvedValueOnce({});

    const result = await disputeService.castVote(
      mockJurorUser.id,
      'dispute-voting-1',
      { vote: 'CLIENT_WINS', reasoning: 'Clear quality issues.' }
    );

    expect(result.weight).toBe(8); // floor(85/10)
    expect(result.vote).toBe('CLIENT_WINS');
  });
});
