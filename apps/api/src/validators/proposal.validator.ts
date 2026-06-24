import { z } from 'zod';

// Strip HTML tags to prevent stored XSS (defense-in-depth; React JSX already escapes)
const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();
const safeText = (schema: z.ZodString) => schema.transform(stripHtml);

// =============================================================================
// PROPOSAL CREATION & UPDATE
// =============================================================================

export const createProposalSchema = z.object({
  coverLetter: safeText(z.string().min(1).max(3000)).refine(
    (val) => val.trim().split(/\s+/).filter(Boolean).length >= 50,
    { message: 'Cover letter must contain at least 50 words' },
  ),
  proposedRate: z.number().positive('Proposed rate must be positive'),
  estimatedDuration: safeText(z.string().max(100)).optional(),
  milestones: z.array(z.object({
    title: safeText(z.string().min(1).max(200)),
    description: safeText(z.string().max(1000)).optional(),
    amount: z.number().positive(),
    dueDate: z.string().datetime().optional(),
  })).optional(),
  attachments: z.array(z.string()).max(5).optional(),
});

export const updateProposalSchema = z.object({
  coverLetter: safeText(z.string().min(1).max(3000)).refine(
    (val) => val.trim().split(/\s+/).filter(Boolean).length >= 50,
    { message: 'Cover letter must contain at least 50 words' },
  ).optional(),
  proposedRate: z.number().positive().optional(),
  estimatedDuration: safeText(z.string().max(100)).optional(),
  milestones: z.array(z.object({
    title: safeText(z.string().min(1).max(200)),
    description: safeText(z.string().max(1000)).optional(),
    amount: z.number().positive(),
    dueDate: z.string().datetime().optional(),
  })).optional(),
  attachments: z.array(z.string()).max(5).optional(),
});

// =============================================================================
// PROPOSAL STATUS TRANSITIONS (CLIENT ACTIONS)
// =============================================================================

export const acceptProposalSchema = z.object({
  // Additional fields for contract creation
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  // For fixed-price jobs: client-defined milestones
  milestones: z.array(z.object({
    title: safeText(z.string().min(1).max(200)),
    description: safeText(z.string().max(1000)).optional(),
    amount: z.number().positive(),
    dueDate: z.string().datetime().optional(),
  })).default([]),
  // For hourly jobs: weekly billing configuration
  weeklyHourLimit: z.number().int().min(1).max(168).optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
});

export const rejectProposalSchema = z.object({
  reason: safeText(z.string().max(500)).optional(),
});

// =============================================================================
// PROPOSAL QUERIES
// =============================================================================

export const getProposalsQuerySchema = z.object({
  jobId: z.string().optional(),
  freelancerId: z.string().optional(),
  status: z.enum(['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'proposedRate']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const getProposalByIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const getJobProposalsParamsSchema = z.object({
  jobId: z.string().min(1),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type AcceptProposalInput = z.infer<typeof acceptProposalSchema>;
export type RejectProposalInput = z.infer<typeof rejectProposalSchema>;
export type GetProposalsQuery = z.infer<typeof getProposalsQuerySchema>;
