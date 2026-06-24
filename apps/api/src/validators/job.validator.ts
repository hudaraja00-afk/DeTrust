import { z } from 'zod';

// Strip HTML tags to prevent stored XSS (defense-in-depth; React JSX already escapes)
const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();
const safeText = (schema: z.ZodString) => schema.transform(stripHtml);

// =============================================================================
// JOB CREATION & UPDATE
// =============================================================================

export const createJobSchema = z.object({
  title: safeText(z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be at most 100 characters')),
  description: safeText(z.string().min(100, 'Description must be at least 100 characters').max(5000)),
  category: safeText(z.string().min(1, 'Category is required').max(100)),
  type: z.enum(['FIXED_PRICE', 'HOURLY']),
  budget: z.number().positive('Budget must be positive').optional(),
  hourlyRateMin: z.number().positive().optional(),
  hourlyRateMax: z.number().positive().optional(),
  estimatedHours: z.number().positive().int().optional(),
  deadline: z.string().datetime().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  skillIds: z.array(z.string()).min(1, 'At least one skill is required').max(10),
  attachments: z.array(z.string()).max(10).optional(),
}).refine(data => {
  if (data.type === 'FIXED_PRICE') {
    return data.budget !== undefined && data.budget > 0;
  }
  return data.hourlyRateMin !== undefined && data.hourlyRateMax !== undefined;
}, {
  message: 'Fixed price jobs require budget, hourly jobs require rate range',
}).refine(data => {
  // Ensure hourly rate range is valid
  if (data.hourlyRateMin !== undefined && data.hourlyRateMax !== undefined) {
    return data.hourlyRateMin <= data.hourlyRateMax;
  }
  return true;
}, {
  message: 'Minimum hourly rate must be less than or equal to maximum hourly rate',
}).refine(data => {
  // Reject deadlines in the past
  if (data.deadline) {
    return new Date(data.deadline) > new Date();
  }
  return true;
}, {
  message: 'Job deadline cannot be in the past',
});

export const updateJobSchema = z.object({
  title: safeText(z.string().min(10).max(100)).optional(),
  description: safeText(z.string().min(100).max(5000)).optional(),
  category: safeText(z.string().min(1).max(100)).optional(),
  type: z.enum(['FIXED_PRICE', 'HOURLY']).optional(),
  budget: z.number().positive().optional(),
  hourlyRateMin: z.number().positive().optional(),
  hourlyRateMax: z.number().positive().optional(),
  estimatedHours: z.number().positive().int().optional(),
  deadline: z.string().datetime().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).optional(),
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  skillIds: z.array(z.string()).min(1).max(10).optional(),
  attachments: z.array(z.string()).max(10).optional(),
});

// =============================================================================
// JOB STATUS TRANSITIONS
// =============================================================================

export const publishJobSchema = z.object({
  // No body required, just transition to OPEN status
});

export const cancelJobSchema = z.object({
  reason: safeText(z.string().max(500)).optional(),
});

// =============================================================================
// JOB QUERIES
// =============================================================================

export const getJobsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']).optional(),
  category: z.string().optional(),
  type: z.enum(['FIXED_PRICE', 'HOURLY']).optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().optional(),
  skills: z.string().optional(), // Comma-separated skill IDs
  experienceLevel: z.enum(['ENTRY', 'INTERMEDIATE', 'EXPERT']).optional(),
  search: z.string().optional(),
  clientId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'budget', 'deadline', 'proposalCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const getJobByIdParamsSchema = z.object({
  id: z.string().min(1),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type GetJobsQuery = z.infer<typeof getJobsQuerySchema>;
export type GetJobByIdParams = z.infer<typeof getJobByIdParamsSchema>;
