/**
 * Functional Test 3: Proposal Submission + Business Rule 2: Profile Gate
 *
 * Chapter 5, Tables 58 & 62.
 *
 * FT 3: createProposal() — validates job status, ownership, duplicate, completeness, budget
 * BR 2: Profile completeness ≥ 70% gate for freelancers
 *
 * @see apps/api/src/services/proposal.service.ts
 */
import { prismaMock } from '../../setup';
import { ProposalService } from '../../../src/services/proposal.service';
import { mockFreelancerUser, mockClientUser } from '../../fixtures';
import { mockOpenJob, mockClosedJob } from '../../fixtures';

describe('Functional Test 3: Proposal Submission (createProposal)', () => {
  let service: ProposalService;

  const validInput = {
    coverLetter: 'I am a great fit for this React position.',
    proposedRate: 450,
    estimatedDuration: '2 weeks',
    milestones: null as any,
    attachments: [],
  };

  beforeEach(() => {
    service = new ProposalService();
    jest.clearAllMocks();
  });

  // Table 58, Row 1 — Valid proposal from freelancer with 85% profile
  it('creates proposal when all validations pass', async () => {
    // Job exists, OPEN, not own job
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockOpenJob,
      type: 'FIXED_PRICE',
      budget: 500,
      clientId: mockClientUser.id,
      client: { id: mockClientUser.id },
    });

    // No duplicate proposal
    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    // Freelancer profile completeness = 85
    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: mockFreelancerUser.id,
      completenessScore: 85,
    });

    // Proposal creation
    const createdProposal = {
      id: 'proposal-001',
      jobId: mockOpenJob.id,
      freelancerId: mockFreelancerUser.id,
      coverLetter: validInput.coverLetter,
      proposedRate: validInput.proposedRate,
      status: 'PENDING',
      job: { id: mockOpenJob.id, title: mockOpenJob.title, budget: 500, type: 'FIXED_PRICE', clientId: mockClientUser.id },
      freelancer: { id: mockFreelancerUser.id, name: mockFreelancerUser.name, avatarUrl: null, freelancerProfile: null },
    };
    (prismaMock.proposal.create as jest.Mock).mockResolvedValueOnce(createdProposal);

    const result = await service.createProposal(
      mockFreelancerUser.id,
      mockOpenJob.id,
      validInput
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('proposal-001');
    expect(result.status).toBe('PENDING');
    expect(prismaMock.proposal.create).toHaveBeenCalledTimes(1);
  });

  // Table 58, Row 2 — Job not open → Forbidden
  it('rejects proposal when job is not OPEN', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockClosedJob,
      status: 'CLOSED',
      clientId: mockClientUser.id,
      client: { id: mockClientUser.id },
    });

    await expect(
      service.createProposal(mockFreelancerUser.id, mockClosedJob.id, validInput)
    ).rejects.toThrow('Job is not accepting proposals');
  });

  // Table 58, Row 3 — Freelancer submitting to own job → Forbidden
  it('rejects proposal to own job', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockOpenJob,
      clientId: mockFreelancerUser.id, // same user
      client: { id: mockFreelancerUser.id },
    });

    await expect(
      service.createProposal(mockFreelancerUser.id, mockOpenJob.id, validInput)
    ).rejects.toThrow('You cannot submit a proposal to your own job');
  });

  // Table 58, Row 4 — Duplicate proposal → Conflict
  it('rejects duplicate proposal', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockOpenJob,
      clientId: mockClientUser.id,
      client: { id: mockClientUser.id },
    });

    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'existing-proposal',
    });

    await expect(
      service.createProposal(mockFreelancerUser.id, mockOpenJob.id, validInput)
    ).rejects.toThrow('You have already submitted a proposal');
  });

  // Table 58, Row 5 — Budget exceeded for FIXED_PRICE → Validation
  it('rejects bid exceeding job budget', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockOpenJob,
      type: 'FIXED_PRICE',
      budget: 400,
      clientId: mockClientUser.id,
      client: { id: mockClientUser.id },
    });

    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: mockFreelancerUser.id,
      completenessScore: 85,
    });

    await expect(
      service.createProposal(mockFreelancerUser.id, mockOpenJob.id, {
        ...validInput,
        proposedRate: 500, // exceeds budget of 400
      })
    ).rejects.toThrow('Bid cannot exceed the job budget');
  });

  // Table 58, Row 6 — Hourly rate out of range → Validation
  it('rejects hourly rate outside job range', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockOpenJob,
      type: 'HOURLY',
      hourlyRateMin: 20,
      hourlyRateMax: 50,
      budget: null,
      clientId: mockClientUser.id,
      client: { id: mockClientUser.id },
    });

    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: mockFreelancerUser.id,
      completenessScore: 85,
    });

    await expect(
      service.createProposal(mockFreelancerUser.id, mockOpenJob.id, {
        ...validInput,
        proposedRate: 60, // exceeds max 50
      })
    ).rejects.toThrow('Proposed hourly rate must be between');
  });

  // Table 58, Row 7 — Job not found → NotFoundError
  it('rejects proposal when job not found', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.createProposal(mockFreelancerUser.id, 'nonexistent-job', validInput)
    ).rejects.toThrow('Job not found');
  });
});

describe('Business Rule 2: Profile Completeness Gate (Table 62)', () => {
  let service: ProposalService;

  const validInput = {
    coverLetter: 'I want to work on this project.',
    proposedRate: 300,
    estimatedDuration: '1 week',
    milestones: null as any,
    attachments: [],
  };

  beforeEach(() => {
    service = new ProposalService();
    jest.clearAllMocks();
  });

  // Table 62, Rule 1 — ≥ 70 → allow
  it('allows proposal when profile completeness = 70%', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'job-gate-1',
      status: 'OPEN',
      type: 'FIXED_PRICE',
      budget: 500,
      clientId: 'other-client',
      client: { id: 'other-client' },
    });

    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: mockFreelancerUser.id,
      completenessScore: 70, // boundary — exactly 70
    });

    const mockResult = {
      id: 'proposal-gate-1',
      status: 'PENDING',
      job: { id: 'job-gate-1', title: 'Test', budget: 500, type: 'FIXED_PRICE', clientId: 'other-client' },
      freelancer: { id: mockFreelancerUser.id, name: 'Test', avatarUrl: null, freelancerProfile: null },
    };
    (prismaMock.proposal.create as jest.Mock).mockResolvedValueOnce(mockResult);

    const result = await service.createProposal(mockFreelancerUser.id, 'job-gate-1', validInput);
    expect(result.id).toBe('proposal-gate-1');
  });

  // Table 62, Rule 2 — < 70 → reject
  it('rejects proposal when profile completeness = 69%', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'job-gate-2',
      status: 'OPEN',
      type: 'FIXED_PRICE',
      budget: 500,
      clientId: 'other-client',
      client: { id: 'other-client' },
    });

    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: mockFreelancerUser.id,
      completenessScore: 69, // just below threshold
    });

    await expect(
      service.createProposal(mockFreelancerUser.id, 'job-gate-2', validInput)
    ).rejects.toThrow('Profile must be at least 70% complete');
  });

  // Table 62, Rule 3 — No profile → reject (0%)
  it('rejects proposal when no freelancer profile exists', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'job-gate-3',
      status: 'OPEN',
      type: 'FIXED_PRICE',
      budget: 500,
      clientId: 'other-client',
      client: { id: 'other-client' },
    });

    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.createProposal(mockFreelancerUser.id, 'job-gate-3', validInput)
    ).rejects.toThrow('Profile must be at least 70% complete');
  });

  // Table 62, Rule 4 — completeness = 0 → reject
  it('rejects proposal when profile completeness = 0%', async () => {
    (prismaMock.job.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'job-gate-4',
      status: 'OPEN',
      type: 'FIXED_PRICE',
      budget: 500,
      clientId: 'other-client',
      client: { id: 'other-client' },
    });

    (prismaMock.proposal.findUnique as jest.Mock).mockResolvedValueOnce(null);

    (prismaMock.freelancerProfile.findUnique as jest.Mock).mockResolvedValueOnce({
      userId: mockFreelancerUser.id,
      completenessScore: 0,
    });

    await expect(
      service.createProposal(mockFreelancerUser.id, 'job-gate-4', validInput)
    ).rejects.toThrow('Profile must be at least 70% complete');
  });
});
