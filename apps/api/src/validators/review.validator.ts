import { z } from 'zod';

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();
const safeText = (schema: z.ZodString) => schema.transform(stripHtml);

// Rating must be 1-5 in 0.5 increments
const ratingSchema = z.number().min(1).max(5).refine(
  (val) => val * 2 === Math.floor(val * 2),
  { message: 'Rating must be in 0.5 increments' }
);

// =============================================================================
// SUBMIT REVIEW
// =============================================================================

export const createReviewSchema = z.object({
  contractId: z.string().min(1, 'Contract ID is required'),
  overallRating: ratingSchema,
  communicationRating: ratingSchema.optional(),
  qualityRating: ratingSchema.optional(),
  timelinessRating: ratingSchema.optional(),
  professionalismRating: ratingSchema.optional(),
  comment: safeText(z.string().min(10, 'Comment must be at least 10 characters').max(2000)).optional(),
});

// =============================================================================
// REVIEW RESPONSE / REBUTTAL (M3-I6)
// =============================================================================

export const createReviewResponseSchema = z.object({
  responseText: safeText(z.string().min(10, 'Response must be at least 10 characters').max(2000)),
});

// =============================================================================
// QUERY REVIEWS
// =============================================================================

export const getReviewsQuerySchema = z.object({
  role: z.enum(['as_client', 'as_freelancer']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  minRating: z.coerce.number().min(1).max(5).optional(),
  maxRating: z.coerce.number().min(1).max(5).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['createdAt', 'overallRating']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateReviewResponseInput = z.infer<typeof createReviewResponseSchema>;
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;