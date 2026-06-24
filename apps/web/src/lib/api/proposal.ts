import { api } from './client';
import { JobSkill } from './job';

// =============================================================================
// PROPOSAL TYPES
// =============================================================================

export type ProposalStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ProposalMilestone {
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
}

export interface ProposalFreelancer {
  id: string;
  name?: string;
  avatarUrl?: string;
  freelancerProfile?: {
    title?: string;
    trustScore: number;
    aiCapabilityScore: number;
    completedJobs: number;
    avgRating: number;
    totalReviews: number;
    skills?: {
      skill: {
        id: string;
        name: string;
        category: string;
      };
    }[];
  };
}

export interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration?: string;
  milestones?: ProposalMilestone[];
  attachments: string[];
  status: ProposalStatus;
  clientNote?: string;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    description: string;
    budget?: number;
    type: string;
    status: string;
    category?: string;
    deadline?: string;
    clientId: string;
    client?: {
      id: string;
      name?: string;
      avatarUrl?: string;
      clientProfile?: {
        companyName?: string;
        trustScore: number;
        paymentVerified: boolean;
      };
    };
    skills?: JobSkill[];
  };
  freelancer?: ProposalFreelancer;
}

export interface CreateProposalInput {
  coverLetter: string;
  proposedRate: number;
  estimatedDuration?: string;
  milestones?: ProposalMilestone[];
  attachments?: string[];
}

export interface UpdateProposalInput {
  coverLetter?: string;
  proposedRate?: number;
  estimatedDuration?: string;
  milestones?: ProposalMilestone[];
  attachments?: string[];
}

export interface AcceptProposalInput {
  startDate?: string;
  endDate?: string;
  milestones?: ProposalMilestone[];
  // For hourly jobs
  weeklyHourLimit?: number;
  durationWeeks?: number;
}

export interface GetProposalsParams {
  jobId?: string;
  freelancerId?: string;
  status?: ProposalStatus;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'proposedRate';
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

export interface Contract {
  id: string;
  jobId: string;
  proposalId: string;
  clientId: string;
  freelancerId: string;
  title: string;
  description?: string;
  totalAmount: number;
  status: string;
  escrowAddress?: string;
  blockchainJobId?: string;
  fundingTxHash?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  milestones: ContractMilestone[];
}

export interface ContractMilestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  orderIndex: number;
  status: string;
  dueDate?: string;
}

export interface AcceptProposalResult {
  proposal: Proposal;
  contract: Contract;
}

// =============================================================================
// PROPOSAL API
// =============================================================================

export const proposalApi = {
  // Get freelancer's proposals
  getMyProposals: (params?: GetProposalsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Proposal>>(`/proposals/mine${query ? `?${query}` : ''}`);
  },

  // Get proposals for a job (client only)
  getJobProposals: (jobId: string, params?: GetProposalsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Proposal>>(`/jobs/${jobId}/proposals${query ? `?${query}` : ''}`);
  },

  // Get a single proposal
  getProposal: (id: string) =>
    api.get<Proposal>(`/proposals/${id}`),

  // Create a proposal for a job
  createProposal: (jobId: string, data: CreateProposalInput) =>
    api.post<Proposal>(`/jobs/${jobId}/proposals`, data),

  // Update a proposal
  updateProposal: (id: string, data: UpdateProposalInput) =>
    api.patch<Proposal>(`/proposals/${id}`, data),

  // Withdraw a proposal
  withdrawProposal: (id: string) =>
    api.post<Proposal>(`/proposals/${id}/withdraw`),

  // Accept a proposal (client only)
  acceptProposal: (id: string, data: AcceptProposalInput) =>
    api.post<AcceptProposalResult>(`/proposals/${id}/accept`, data),

  // Reject a proposal (client only)
  rejectProposal: (id: string, reason?: string) =>
    api.post<Proposal>(`/proposals/${id}/reject`, { reason }),

  // Shortlist a proposal (client only)
  shortlistProposal: (id: string) =>
    api.post<Proposal>(`/proposals/${id}/shortlist`),
};

export default proposalApi;
