/**
 * Review Fixtures — DeTrust API Tests
 */

export const mockReview = {
  id: 'review-001',
  contractId: 'contract-002',
  authorId: 'user-client-001',
  subjectId: 'user-freelancer-001',
  overallRating: 4.5,
  communicationRating: 5,
  qualityRating: 4,
  timelinessRating: 4.5,
  professionalismRating: 4.5,
  comment: 'Excellent work on the dashboard. Very professional and met all deadlines.',
  isPublic: true,
  ipfsHash: 'QmReviewHash123',
  blockchainTxHash: '0xBlockchainTxHash123',
  responseText: null,
  respondedAt: null,
  createdAt: new Date('2026-02-20'),
  updatedAt: new Date('2026-02-20'),
  author: { id: 'user-client-001', name: 'Bob Manager', avatarUrl: null },
  subject: { id: 'user-freelancer-001', name: 'Alice Developer', avatarUrl: null },
};

export const mockCounterpartReview = {
  ...mockReview,
  id: 'review-002',
  authorId: 'user-freelancer-001',
  subjectId: 'user-client-001',
  overallRating: 4.0,
  comment: 'Great client to work with. Clear requirements.',
  createdAt: new Date('2026-02-21'),
  author: { id: 'user-freelancer-001', name: 'Alice Developer', avatarUrl: null },
  subject: { id: 'user-client-001', name: 'Bob Manager', avatarUrl: null },
};

export const mockReviewInput = {
  contractId: 'contract-002',
  overallRating: 4.5,
  communicationRating: 5,
  qualityRating: 4,
  timelinessRating: 4.5,
  professionalismRating: 4.5,
  comment: 'Excellent work on the dashboard. Very professional and met all deadlines.',
};
