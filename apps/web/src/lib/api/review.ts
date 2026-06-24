import { api } from './client';

// =============================================================================
// REVIEW TYPES
// =============================================================================

export interface Review {
  id: string;
  contractId: string;
  authorId: string;
  subjectId: string;
  overallRating: number;
  communicationRating: number | null;
  qualityRating: number | null;
  timelinessRating: number | null;
  professionalismRating: number | null;
  comment: string | null;
  responseText: string | null;
  responseAt: string | null;
  ipfsHash: string | null;
  blockchainTxHash: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string | null; avatarUrl: string | null };
  subject?: { id: string; name: string | null; avatarUrl: string | null };
  contract?: {
    id: string;
    title: string;
    completedAt: string | null;
    clientId: string;
    freelancerId: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  averageCommunication: number;
  averageQuality: number;
  averageTimeliness: number;
  averageProfessionalism: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface CreateReviewInput {
  contractId: string;
  overallRating: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  comment?: string;
}

export interface GetUserReviewsParams {
  role?: 'as_client' | 'as_freelancer';
  page?: number;
  limit?: number;
  minRating?: number;
  maxRating?: number;
  search?: string;
  sort?: 'createdAt' | 'overallRating';
  order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ContractReviewsResponse {
  items: Review[];
  canReview: boolean;
}

// =============================================================================
// REVIEW API
// =============================================================================

export const reviewApi = {
  submitReview: (data: CreateReviewInput) =>
    api.post<Review>('/reviews', data),

  submitResponse: (reviewId: string, responseText: string) =>
    api.post<Review>(`/reviews/${reviewId}/response`, { responseText }),

  getContractReviews: (contractId: string) =>
    api.get<ContractReviewsResponse>(`/reviews/contract/${contractId}`),

  getReviewStatus: (contractId: string) =>
    api.get<{ hasReviewed: boolean }>(`/reviews/contract/${contractId}/status`),

  getUserReviews: (userId: string, params?: GetUserReviewsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Review>>(`/reviews/user/${userId}${query ? `?${query}` : ''}`);
  },

  getReviewSummary: (userId: string) =>
    api.get<ReviewSummary>(`/reviews/user/${userId}/summary`),
};

export default reviewApi;
