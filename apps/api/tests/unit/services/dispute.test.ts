/**
 * Functional Test 5: Dispute Resolution + Business Rule 3: Juror Eligibility
 *
 * Chapter 5, Tables 60, 64, 65.
 *
 * FT 5: Full dispute lifecycle — createDispute, castVote, juror eligibility
 * BR 3: Juror trust score > 50, not a party, weighted vote
 *
 * @see apps/api/src/services/dispute.service.ts
 */
import { prismaMock } from '../../setup';
import { DisputeService } from '../../../src/services/dispute.service';
import {
  mockFreelancerUser,
  mockClientUser,
  mockJurorUser,
  mockLowTrustUser,
} from '../../fixtures';
import { mockActiveContract, mockDisputedContract } from '../../fixtures';
import { mockOpenDispute, mockVotingDispute, mockDisputeVotes } from '../../fixtures';

describe('Functional Test 5: Dispute Resolution (createDispute)', () => {
  let service: DisputeService;

  const disputeInput = {
    contractId: mockActiveContract.id,
    reason: 'QUALITY_ISSUE' as const,
    description: 'The deliverables do not meet the requirements specified.',
    evidence: [],
  };

  beforeEach(() => {
    service = new DisputeService();
    jest.clearAllMocks();
  });

  // Table 60, Row 1 — Valid dispute by client on active contract
  it('creates dispute when contract is ACTIVE and user is a party', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockActiveContract,
      status: 'ACTIVE',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      jobId: 'job-001',
    });

    // No existing open/voting dispute
    (prismaMock.dispute.findFirst as jest.Mock).mockResolvedValueOnce(null);

    // Transaction mock
    const createdDispute = {
      id: 'dispute-new-001',
      contractId: mockActiveContract.id,
      initiatorId: mockClientUser.id,
      reason: disputeInput.reason,
      status: 'OPEN',
      outcome: 'PENDING',
      contract: { id: mockActiveContract.id, title: 'React Dev', totalAmount: 1000 },
      initiator: { id: mockClientUser.id, name: 'Bob' },
    };
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce(
      async (fn: (tx: any) => Promise<any>) => {
        // Simulate transaction context
        return createdDispute;
      }
    );

    const result = await service.createDispute(mockClientUser.id, disputeInput);

    expect(result).toBeDefined();
    expect(result.id).toBe('dispute-new-001');
    expect(result.status).toBe('OPEN');
  });

  // Table 60, Row 2 — Non-active contract → ValidationError
  it('rejects dispute on non-active contract', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockActiveContract.id,
      status: 'COMPLETED', // not ACTIVE
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      jobId: 'job-001',
    });

    await expect(
      service.createDispute(mockClientUser.id, disputeInput)
    ).rejects.toThrow('Disputes can only be raised on active contracts');
  });

  // Table 60, Row 3 — Non-party → ForbiddenError
  it('rejects dispute from non-contract party', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockActiveContract.id,
      status: 'ACTIVE',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      jobId: 'job-001',
    });

    await expect(
      service.createDispute('stranger-id', disputeInput)
    ).rejects.toThrow('Only contract parties can initiate a dispute');
  });

  // Table 60, Row 4 — Existing open dispute → ValidationError
  it('rejects when active dispute already exists', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockActiveContract.id,
      status: 'ACTIVE',
      clientId: mockClientUser.id,
      freelancerId: mockFreelancerUser.id,
      jobId: 'job-001',
    });

    // Existing dispute
    (prismaMock.dispute.findFirst as jest.Mock).mockResolvedValueOnce({
      id: mockOpenDispute.id,
      status: 'OPEN',
    });

    await expect(
      service.createDispute(mockClientUser.id, disputeInput)
    ).rejects.toThrow('An active dispute already exists');
  });

  // Table 60, Row 5 — Contract not found → NotFoundError
  it('rejects when contract not found', async () => {
    (prismaMock.contract.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.createDispute(mockClientUser.id, disputeInput)
    ).rejects.toThrow('Contract not found');
  });
});

describe('Functional Test 5b: Juror Voting (castVote)', () => {
  let service: DisputeService;

  const voteInput = {
    vote: 'CLIENT_WINS',
    reasoning: 'The deliverables clearly did not meet the requirements.',
  };

  beforeEach(() => {
    service = new DisputeService();
    jest.clearAllMocks();
  });

  // Valid vote from eligible juror
  it('allows eligible juror to cast weighted vote', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockVotingDispute,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [], // no votes yet
    });

    // Juror's trust score
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'FREELANCER',
      freelancerProfile: { trustScore: 85 },
      clientProfile: null,
    });

    const createdVote = {
      id: 'vote-001',
      disputeId: mockVotingDispute.id,
      jurorId: mockJurorUser.id,
      vote: 'CLIENT_WINS',
      weight: 8, // floor(85/10)
      reasoning: voteInput.reasoning,
      juror: { id: mockJurorUser.id, name: 'Juror' },
    };
    (prismaMock.disputeVote.create as jest.Mock).mockResolvedValueOnce(createdVote);
    (prismaMock.dispute.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.castVote(mockJurorUser.id, mockVotingDispute.id, voteInput);

    expect(result).toBeDefined();
    expect(result.weight).toBe(8);
    expect(result.vote).toBe('CLIENT_WINS');
  });

  // Contract party tries to vote → ForbiddenError
  it('rejects vote from contract party', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockVotingDispute,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [],
    });

    await expect(
      service.castVote(mockClientUser.id, mockVotingDispute.id, voteInput)
    ).rejects.toThrow('Contract parties cannot vote on their own dispute');
  });

  // Duplicate vote → ValidationError
  it('rejects duplicate vote from same juror', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockVotingDispute,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [{ jurorId: mockJurorUser.id, vote: 'CLIENT_WINS', weight: 8 }],
    });

    await expect(
      service.castVote(mockJurorUser.id, mockVotingDispute.id, voteInput)
    ).rejects.toThrow('You have already voted');
  });

  // Voting deadline passed → ValidationError
  it('rejects vote after deadline', async () => {
    const pastDeadline = new Date();
    pastDeadline.setDate(pastDeadline.getDate() - 1);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockVotingDispute,
      status: 'VOTING',
      votingDeadline: pastDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [],
    });

    await expect(
      service.castVote(mockJurorUser.id, mockVotingDispute.id, voteInput)
    ).rejects.toThrow('voting deadline has passed');
  });
});

describe('Business Rule 3: Juror Eligibility (Tables 64-65)', () => {
  let service: DisputeService;

  beforeEach(() => {
    service = new DisputeService();
    jest.clearAllMocks();
  });

  // Table 64, Rule 1 — Trust score ≥ 50 + not a party → eligible
  it('eligible: trust score 85, not a party, not voted', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockVotingDispute.id,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [],
    });

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'FREELANCER',
      freelancerProfile: { trustScore: 85 },
      clientProfile: null,
    });

    const result = await service.checkJurorEligibility(mockJurorUser.id, mockVotingDispute.id);

    expect(result.eligible).toBe(true);
    expect(result.trustScore).toBe(85);
    expect(result.isParty).toBe(false);
    expect(result.hasVoted).toBe(false);
    expect(result.meetsScoreRequirement).toBe(true);
  });

  // Table 64, Rule 2 — Trust score < 50 → ineligible
  it('ineligible: trust score 30 (below 50)', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockVotingDispute.id,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [],
    });

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'FREELANCER',
      freelancerProfile: { trustScore: 30 },
      clientProfile: null,
    });

    const result = await service.checkJurorEligibility(mockLowTrustUser.id, mockVotingDispute.id);

    expect(result.eligible).toBe(false);
    expect(result.meetsScoreRequirement).toBe(false);
    expect(result.trustScore).toBe(30);
    expect(result.minimumRequired).toBe(50);
  });

  // Table 64, Rule 3 — Contract party → ineligible
  it('ineligible: user is a contract party', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      id: mockVotingDispute.id,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [],
    });

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'CLIENT',
      freelancerProfile: null,
      clientProfile: { trustScore: 76 },
    });

    const result = await service.checkJurorEligibility(mockClientUser.id, mockVotingDispute.id);

    expect(result.eligible).toBe(false);
    expect(result.isParty).toBe(true);
  });

  // Table 65 — Vote weight = floor(trustScore / 10)
  it('vote weight calculated from trust score: 85 → weight 8', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockVotingDispute,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [],
    });

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'FREELANCER',
      freelancerProfile: { trustScore: 85 },
      clientProfile: null,
    });

    const vote = {
      id: 'v-weight-test',
      disputeId: mockVotingDispute.id,
      jurorId: mockJurorUser.id,
      vote: 'FREELANCER_WINS',
      weight: 8,
      juror: { id: mockJurorUser.id, name: 'Juror' },
    };
    (prismaMock.disputeVote.create as jest.Mock).mockResolvedValueOnce(vote);
    (prismaMock.dispute.update as jest.Mock).mockResolvedValueOnce({});

    const result = await service.castVote(mockJurorUser.id, mockVotingDispute.id, {
      vote: 'FREELANCER_WINS',
      reasoning: 'Freelancer met all requirements.',
    });

    expect(result.weight).toBe(8);
  });

  // Table 65 — Low trust score juror rejected when casting vote
  it('rejects vote from juror with trust score 30', async () => {
    const futureDeadline = new Date();
    futureDeadline.setDate(futureDeadline.getDate() + 5);

    (prismaMock.dispute.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockVotingDispute,
      status: 'VOTING',
      votingDeadline: futureDeadline,
      contract: { clientId: mockClientUser.id, freelancerId: mockFreelancerUser.id },
      votes: [],
    });

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      role: 'FREELANCER',
      freelancerProfile: { trustScore: 30 },
      clientProfile: null,
    });

    await expect(
      service.castVote(mockLowTrustUser.id, mockVotingDispute.id, {
        vote: 'CLIENT_WINS',
        reasoning: 'Low trust juror should be rejected.',
      })
    ).rejects.toThrow('trust score of at least 50');
  });
});
