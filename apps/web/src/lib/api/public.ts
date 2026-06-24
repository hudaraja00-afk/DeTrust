import { api } from './client';

// =============================================================================
// Types — mirror the backend PublicStats / FeaturedReview shapes
// =============================================================================

export interface PublicStats {
  escrowVolume: number;
  medianHireTimeHours: number;
  avgTrustScore: number;
  platformFeePercent: string;
  totalFreelancers: number;
  completedContracts: number;
}

export interface FeaturedReview {
  id: string;
  overallRating: number;
  comment: string;
  createdAt: string;
  author: {
    name: string;
    role: string;
    initials: string;
    avatarUrl: string | null;
    trustScore: number;
  };
}

// =============================================================================
// API calls — unauthenticated, public endpoints
// =============================================================================

export const publicApi = {
  getStats: () => api.get<PublicStats>('/public/stats'),

  getFeaturedReviews: (limit = 3) =>
    api.get<FeaturedReview[]>(`/public/featured-reviews?limit=${limit}`),
};
