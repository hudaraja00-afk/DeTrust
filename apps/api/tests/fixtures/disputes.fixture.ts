/**
 * Dispute Fixtures — DeTrust API Tests
 */

export const mockOpenDispute = {
  id: 'dispute-001',
  contractId: 'contract-003',
  initiatorId: 'user-client-001',
  reason: 'No delivery',
  description: 'Freelancer has not delivered the agreed milestone after deadline.',
  evidence: [],
  status: 'OPEN' as const,
  outcome: 'PENDING' as const,
  votingDeadline: null,
  resolvedAt: null,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  contract: {
    id: 'contract-003',
    title: 'Build DeFi Dashboard',
    totalAmount: 1000,
    clientId: 'user-client-001',
    freelancerId: 'user-freelancer-001',
    jobId: 'job-001',
    status: 'DISPUTED',
    fundingTxHash: '0xFundingTx123',
  },
  initiator: { id: 'user-client-001', name: 'Bob Manager' },
};

export const mockVotingDispute = {
  ...mockOpenDispute,
  id: 'dispute-002',
  status: 'VOTING' as const,
  votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

export const mockResolvedDispute = {
  ...mockOpenDispute,
  id: 'dispute-003',
  status: 'RESOLVED' as const,
  outcome: 'CLIENT_WINS' as const,
  resolvedAt: new Date('2026-03-08'),
};

export const mockCreateDisputeInput = {
  contractId: 'contract-001',
  reason: 'No delivery',
  description: 'Freelancer has not delivered the agreed milestone after deadline.',
  evidence: [],
};

export const mockDisputeVotes = [
  {
    id: 'vote-001',
    disputeId: 'dispute-002',
    jurorId: 'user-juror-001',
    vote: 'CLIENT_WINS' as const,
    weight: 85,
    createdAt: new Date('2026-03-03'),
  },
  {
    id: 'vote-002',
    disputeId: 'dispute-002',
    jurorId: 'user-juror-002',
    vote: 'CLIENT_WINS' as const,
    weight: 70,
    createdAt: new Date('2026-03-03'),
  },
  {
    id: 'vote-003',
    disputeId: 'dispute-002',
    jurorId: 'user-juror-003',
    vote: 'FREELANCER_WINS' as const,
    weight: 60,
    createdAt: new Date('2026-03-04'),
  },
];
