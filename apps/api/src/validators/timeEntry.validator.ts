import { z } from 'zod';

// =============================================================================
// TIME ENTRY VALIDATORS
// =============================================================================

export const createTimeEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  hours: z.number().min(0.25, 'Minimum 15 minutes').max(24, 'Maximum 24 hours per day'),
  description: z.string().min(1, 'Description is required').max(500),
});

export const updateTimeEntrySchema = z.object({
  hours: z.number().min(0.25).max(24).optional(),
  description: z.string().min(1).max(500).optional(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
