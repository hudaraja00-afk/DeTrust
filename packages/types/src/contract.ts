// Contract Types for DeTrust Platform

import { Milestone } from './milestone';

export enum ContractStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export interface Contract {
  id: string;
  jobId: string;
  proposalId: string;
  clientId: string;
  freelancerId: string;
  
  title: string;
  description: string | null;
  totalAmount: number;
  status: ContractStatus;

  // Billing
  billingType: 'FIXED' | 'HOURLY';
  hourlyRate: number | null;
  weeklyHourLimit: number | null;
  
  // Blockchain Data
  escrowAddress: string | null;
  blockchainJobId: string | null;
  fundingTxHash: string | null;
  
  // Timestamps
  startDate: Date | null;
  endDate: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  milestones?: Milestone[];
  client?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  freelancer?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

// Create Contract
export interface CreateContractInput {
  jobId: string;
  proposalId: string;
  milestones: CreateMilestoneInput[];
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
}

// Fund Escrow Response
export interface FundEscrowResponse {
  transaction: {
    to: string;
    value: string;
    data: string;
  };
  contractAddress: string;
  jobId: string;
}
