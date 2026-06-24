import { z } from 'zod';

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();
const safeText = (schema: z.ZodString) => schema.transform(stripHtml);

/** Accept both HTTP(S) URLs and IPFS CID strings (ipfs:// or plain CID) */
const evidenceUrl = z.string().refine(
  (val) =>
    /^https?:\/\/.+/.test(val) ||
    /^ipfs:\/\/.+/.test(val) ||
    /^Qm[1-9A-HJ-NP-Za-km-z]{44,}$/.test(val) ||
    /^bafy[a-z0-9]{50,}$/i.test(val),
  { message: 'Must be a valid URL (https://) or IPFS CID (ipfs:// or Qm...)' },
);

// =============================================================================
// CREATE DISPUTE
// =============================================================================

export const createDisputeSchema = z.object({
  contractId: z.string().min(1, 'Contract ID is required'),
  reason: z.string().min(1, 'Reason is required').max(100),
  description: safeText(z.string().min(50, 'Description must be at least 50 characters').max(5000)),
  evidence: z.array(evidenceUrl).max(5).optional(),
});

// =============================================================================
// SUBMIT EVIDENCE
// =============================================================================

export const submitEvidenceSchema = z.object({
  description: safeText(z.string().min(10, 'Description must be at least 10 characters').max(2000)),
  files: z.array(evidenceUrl).min(1, 'At least one file required').max(5),
});

// =============================================================================
// CAST VOTE (Juror / Admin)
// =============================================================================

export const castVoteSchema = z.object({
  vote: z.enum(['CLIENT_WINS', 'FREELANCER_WINS']),
  reasoning: safeText(z.string().min(10).max(2000)).optional(),
});

// =============================================================================
// ADMIN RESOLVE
// =============================================================================

export const adminResolveSchema = z.object({
  outcome: z.enum(['CLIENT_WINS', 'FREELANCER_WINS', 'SPLIT']),
  resolution: safeText(z.string().min(10).max(5000)),
});

// =============================================================================
// QUERY DISPUTES
// =============================================================================

export const getDisputesQuerySchema = z.object({
  status: z.enum(['OPEN', 'VOTING', 'RESOLVED', 'APPEALED']).optional(),
  outcome: z.enum(['PENDING', 'CLIENT_WINS', 'FREELANCER_WINS', 'SPLIT']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'resolvedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type SubmitEvidenceInput = z.infer<typeof submitEvidenceSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type AdminResolveInput = z.infer<typeof adminResolveSchema>;
export type GetDisputesQuery = z.infer<typeof getDisputesQuerySchema>;
