/**
 * Job Fixtures — DeTrust API Tests
 */

export const mockOpenJob = {
  id: 'job-001',
  clientId: 'user-client-001',
  title: 'React Dev',
  description: 'Build a React dashboard for DeFi protocol.',
  type: 'FIXED_PRICE' as const,
  budget: 500,
  hourlyRateMin: null,
  hourlyRateMax: null,
  category: 'Frontend Development',
  skills: ['React', 'TypeScript'],
  experience: 'INTERMEDIATE',
  status: 'OPEN' as const,
  visibility: 'PUBLIC' as const,
  proposalCount: 0,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
  client: { id: 'user-client-001' },
};

export const mockClosedJob = {
  ...mockOpenJob,
  id: 'job-002',
  status: 'IN_PROGRESS' as const,
};

export const mockCompletedJob = {
  ...mockOpenJob,
  id: 'job-003',
  status: 'COMPLETED' as const,
};
