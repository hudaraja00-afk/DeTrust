/**
 * Contract Fixtures — DeTrust API Tests
 */

export const mockActiveContract = {
  id: 'contract-001',
  jobId: 'job-001',
  clientId: 'user-client-001',
  freelancerId: 'user-freelancer-001',
  title: 'Build DeFi Dashboard',
  description: 'Full-stack DeFi dashboard with React and Solidity.',
  totalAmount: 1000,
  paidAmount: 0,
  status: 'ACTIVE' as const,
  escrowAddress: '0xEscrowContract',
  fundingTxHash: '0xFundingTx123',
  startDate: new Date('2026-01-15'),
  completedAt: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-03-01'),
};

export const mockCompletedContract = {
  ...mockActiveContract,
  id: 'contract-002',
  status: 'COMPLETED' as const,
  paidAmount: 1000,
  completedAt: new Date('2026-02-15'),
};

export const mockDisputedContract = {
  ...mockActiveContract,
  id: 'contract-003',
  status: 'DISPUTED' as const,
};

export const mockCancelledContract = {
  ...mockActiveContract,
  id: 'contract-004',
  status: 'CANCELLED' as const,
};

export const mockMilestones = [
  {
    id: 'milestone-001',
    contractId: 'contract-001',
    title: 'Frontend UI',
    description: 'Build the dashboard frontend.',
    amount: 500,
    status: 'PENDING' as const,
    order: 0,
    deliverableHash: null,
    paidAt: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'milestone-002',
    contractId: 'contract-001',
    title: 'Smart Contract Integration',
    description: 'Integrate escrow smart contracts.',
    amount: 300,
    status: 'PENDING' as const,
    order: 1,
    deliverableHash: null,
    paidAt: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'milestone-003',
    contractId: 'contract-001',
    title: 'Testing & Deployment',
    description: 'Final testing and deployment.',
    amount: 200,
    status: 'PENDING' as const,
    order: 2,
    deliverableHash: null,
    paidAt: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
];

export const mockSubmittedMilestone = {
  ...mockMilestones[0],
  status: 'SUBMITTED' as const,
  deliverableHash: 'ipfs://QmDeliverable1',
};
