import { z } from 'zod';

// Strip HTML tags to prevent stored XSS (defense-in-depth; React JSX already escapes)
const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();
const safeText = (schema: z.ZodString) => schema.transform(stripHtml);

// =============================================================================
// USER PROFILE
// =============================================================================

export const updateUserSchema = z.object({
  name: safeText(z.string().min(2).max(100)).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional().nullable(),
});

export const setRoleSchema = z.object({
  role: z.enum(['CLIENT', 'FREELANCER'], {
    errorMap: () => ({ message: 'Role must be CLIENT or FREELANCER' }),
  }),
});

// =============================================================================
// FREELANCER PROFILE
// =============================================================================

export const updateFreelancerProfileSchema = z.object({
  title: safeText(z.string().min(5).max(100)).optional(),
  bio: safeText(z.string().min(120, 'Bio must be at least 120 characters').max(2000)).optional(),
  hourlyRate: z.number().min(1).max(1000).optional(),
  availability: z.enum(['Full-time', 'Part-time', 'Not Available']).optional(),
  location: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  languages: z.array(z.string().min(2).max(50)).min(1).max(10).optional(),
  portfolioLinks: z.array(z.string().url()).max(10).optional(),
  resumeUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  githubUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
});

export const addSkillSchema = z.object({
  skillId: z.string().min(1),
  yearsExperience: z.number().min(0).max(50).optional(),
  proficiencyLevel: z.number().min(1).max(5).optional(),
});

export const updateSkillSchema = z.object({
  yearsExperience: z.number().min(0).max(50).optional(),
  proficiencyLevel: z.number().min(1).max(5).optional(),
});

export const addCertificationSchema = z.object({
  name: safeText(z.string().min(2).max(200)),
  issuer: safeText(z.string().min(2).max(200)),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  credentialId: z.string().max(100).optional(),
  credentialUrl: z.string().url().optional(),
});

export const addEducationSchema = z.object({
  institution: safeText(z.string().min(2).max(200)),
  degree: safeText(z.string().min(2).max(200)),
  fieldOfStudy: safeText(z.string().max(200)).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  description: safeText(z.string().max(1000)).optional(),
});

export const addExperienceSchema = z.object({
  title: safeText(z.string().min(2).max(200)),
  company: safeText(z.string().min(2).max(200)),
  location: safeText(z.string().max(100)).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().optional(),
  description: safeText(z.string().max(2000)).optional(),
});

export const addPortfolioItemSchema = z.object({
  title: safeText(z.string().min(2).max(200)),
  description: safeText(z.string().max(2000)).optional(),
  projectUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  techStack: z.array(safeText(z.string().min(1).max(50))).max(20).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isFeatured: z.boolean().optional(),
});

// =============================================================================
// CLIENT PROFILE
// =============================================================================

export const updateClientProfileSchema = z.object({
  companyName: safeText(z.string().min(2).max(200)).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  industry: safeText(z.string().max(100)).optional(),
  companyWebsite: z.string().url().optional().nullable(),
  description: safeText(z.string().max(2000)).optional(),
  location: safeText(z.string().max(100)).optional(),
});

// =============================================================================
// KYC
// =============================================================================

export const updateKycSchema = z.object({
  documentType: safeText(z.string().min(2).max(50)),
  idNumber: safeText(z.string().min(3).max(100)),
  country: safeText(z.string().min(2).max(100)),
});

// =============================================================================
// QUERY PARAMS
// =============================================================================

export const getUsersQuerySchema = z.object({
  role: z.enum(['CLIENT', 'FREELANCER']).optional(),
  search: z.string().optional(),
  skills: z.string().optional(), // Comma-separated skill IDs
  minTrustScore: z.coerce.number().min(0).max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['trustScore', 'avgRating', 'completedJobs', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateFreelancerProfileInput = z.infer<typeof updateFreelancerProfileSchema>;
export type UpdateClientProfileInput = z.infer<typeof updateClientProfileSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type AddEducationInput = z.infer<typeof addEducationSchema>;
export type AddExperienceInput = z.infer<typeof addExperienceSchema>;
export type AddPortfolioItemInput = z.infer<typeof addPortfolioItemSchema>;
