// Milestone Types for DeTrust Platform

import { TimeEntry } from './timeEntry';

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
}

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description: string | null;
  amount: number;
  orderIndex: number;
  status: MilestoneStatus;
  dueDate: Date | null;
  
  // Deliverables
  deliverableHash: string | null;
  deliverableNote: string | null;
  
  // Client Feedback
  revisionNote: string | null;
  revisionCount: number;
  
  // Blockchain Data
  paymentTxHash: string | null;
  
  // Timestamps
  submittedAt: Date | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations (when included)
  timeEntries?: TimeEntry[];
}

// Submit Milestone
export interface SubmitMilestoneInput {
  deliverableNote?: string;
  attachments?: File[];
}

// Request Revision
export interface RequestRevisionInput {
  feedback: string;
}

// Approve Milestone Response
export interface ApproveMilestoneResponse {
  milestone: Milestone;
  transaction?: {
    to: string;
    value: string;
    data: string;
  };
}
