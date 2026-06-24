import { api } from './client';

// =============================================================================
// JOB TYPES
// =============================================================================

export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type JobType = 'FIXED_PRICE' | 'HOURLY';
export type ExperienceLevel = 'ENTRY' | 'INTERMEDIATE' | 'EXPERT';
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';

export interface JobSkill {
  id: string;
  skillId: string;
  isRequired: boolean;
  skill: {
    id: string;
    name: string;
    category: string;
  };
}

export interface JobClient {
  id: string;
  name?: string;
  avatarUrl?: string;
  clientProfile?: {
    companyName?: string;
    trustScore: number;
    jobsPosted: number;
    hireRate: number;
    avgRating?: number;
    totalReviews?: number;
    paymentVerified: boolean;
  };
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  type: JobType;
  budget?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  estimatedHours?: number;
  deadline?: string;
  status: JobStatus;
  visibility: Visibility;
  experienceLevel?: ExperienceLevel;
  attachments: string[];
  proposalCount: number;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  client: JobClient;
  skills: JobSkill[];
  proposals?: {
    id: string;
    status: string;
    proposedRate: number;
    createdAt: string;
  }[];
  _count?: {
    proposals: number;
  };
}

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
  visibility?: Visibility;
  experienceLevel?: ExperienceLevel;
  skillIds: string[];
  attachments?: string[];
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  category?: string;
  type?: JobType;
  budget?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  estimatedHours?: number;
  deadline?: string;
  visibility?: Visibility;
  experienceLevel?: ExperienceLevel;
  skillIds?: string[];
  attachments?: string[];
}

export interface GetJobsParams {
  status?: JobStatus;
  category?: string;
  type?: JobType;
  minBudget?: number;
  maxBudget?: number;
  skills?: string;
  experienceLevel?: ExperienceLevel;
  search?: string;
  clientId?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'budget' | 'deadline' | 'proposalCount';
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

// =============================================================================
// JOB API
// =============================================================================

export const jobApi = {
  // List jobs (for job board)
  listJobs: (params?: GetJobsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Job>>(`/jobs${query ? `?${query}` : ''}`);
  },

  // Get client's jobs (including drafts)
  getMyJobs: (params?: GetJobsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Job>>(`/jobs/mine${query ? `?${query}` : ''}`);
  },

  // Get a single job
  getJob: (id: string) =>
    api.get<Job>(`/jobs/${id}`),

  // Create a new job
  createJob: (data: CreateJobInput) =>
    api.post<Job>('/jobs', data),

  // Update a job
  updateJob: (id: string, data: UpdateJobInput) =>
    api.patch<Job>(`/jobs/${id}`, data),

  // Publish a job
  publishJob: (id: string) =>
    api.post<Job>(`/jobs/${id}/publish`),

  // Cancel a job
  cancelJob: (id: string) =>
    api.post<Job>(`/jobs/${id}/cancel`),

  // Delete a job (DRAFT only)
  deleteJob: (id: string) =>
    api.delete(`/jobs/${id}`),
};

export default jobApi;
