import { z } from 'zod';

// =============================================================================
// ADMIN REVIEW LIST QUERY
// =============================================================================

export const adminReviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  maxRating: z.coerce.number().min(1).max(5).optional(),
  dateFrom: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  dateTo: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  authorId: z.string().optional(),
  subjectId: z.string().optional(),
  contractId: z.string().optional(),
  hasBlockchain: z.enum(['true', 'false']).optional(),
  hasIpfs: z.enum(['true', 'false']).optional(),
  sort: z.enum(['createdAt', 'overallRating', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;
