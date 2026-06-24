// Proposal Types for DeTrust Platform

import { Job } from './job';
import { PublicFreelancerProfile } from './user';

export enum ProposalStatus {
  PENDING = 'PENDING',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface ProposalMilestone {
  title: string;
  description?: string;
  amount: number;
  duration?: string;
}

export interface Proposal {
  id: string;
  jobId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: string | null;
  milestones: ProposalMilestone[] | null;
  attachments: string[];
  status: ProposalStatus;
  clientNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  job?: Job;
  freelancer?: PublicFreelancerProfile;
}

// Create Proposal
export interface CreateProposalInput {
  coverLetter: string;
  proposedRate: number;
  estimatedDuration?: string;
  milestones?: ProposalMilestone[];
  attachments?: string[];
}

// Update Proposal
export interface UpdateProposalInput {
  coverLetter?: string;
  proposedRate?: number;
  estimatedDuration?: string;
  milestones?: ProposalMilestone[];
  attachments?: string[];
}

// Proposal Filters
export interface ProposalFilters {
  status?: ProposalStatus;
  jobId?: string;
}
