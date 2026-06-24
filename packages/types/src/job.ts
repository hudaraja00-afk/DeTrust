// Job Types for DeTrust Platform

import { Skill } from './user';

export enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum JobType {
  FIXED_PRICE = 'FIXED_PRICE',
  HOURLY = 'HOURLY',
}

export enum JobVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITE_ONLY = 'INVITE_ONLY',
}

export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  type: JobType;
  budget: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedHours: number | null;
  deadline: Date | null;
  status: JobStatus;
  visibility: JobVisibility;
  experienceLevel: ExperienceLevel | null;
  attachments: string[];
  
  // Stats
  proposalCount: number;
  viewCount: number;
  
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  client?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    clientProfile?: {
      companyName: string | null;
      trustScore: number;
      jobsPosted: number;
      paymentVerified: boolean;
    };
  };
  skills?: JobSkill[];
}

export interface JobSkill {
  id: string;
  jobId: string;
  skillId: string;
  isRequired: boolean;
  skill?: Skill;
}

// Job Filters
export interface JobFilters {
  status?: JobStatus;
  category?: string;
  type?: JobType;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  experienceLevel?: ExperienceLevel;
  search?: string;
}

// Create/Update Job
export interface CreateJobInput {
  title: string;
  description: string;
  category: string;
  type: JobType;
  budget?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  estimatedHours?: number;
  deadline?: string;
  visibility?: JobVisibility;
  experienceLevel?: ExperienceLevel;
  skills: string[];
  attachments?: string[];
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  status?: JobStatus;
}

// Job Categories
export const JOB_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Blockchain & Crypto',
  'AI & Machine Learning',
  'Data Science',
  'DevOps & Cloud',
  'UI/UX Design',
  'Graphic Design',
  'Content Writing',
  'Marketing',
  'Video & Animation',
  'Other',
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];
