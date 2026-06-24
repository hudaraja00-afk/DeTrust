// Review Types for DeTrust Platform

export interface Review {
  id: string;
  contractId: string;
  authorId: string;
  subjectId: string;
  
  // Ratings (1-5)
  overallRating: number;
  communicationRating: number | null;
  qualityRating: number | null;
  timelinessRating: number | null;
  professionalismRating: number | null;
  
  comment: string | null;
  
  // Blockchain Data
  ipfsHash: string | null;
  blockchainTxHash: string | null;
  
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  author?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  subject?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

// Create Review
export interface CreateReviewInput {
  contractId: string;
  overallRating: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  comment?: string;
}

// Review Summary
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
