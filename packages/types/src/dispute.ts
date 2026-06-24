// Dispute Types for DeTrust Platform

export enum DisputeStatus {
  OPEN = 'OPEN',
  VOTING = 'VOTING',
  RESOLVED = 'RESOLVED',
  APPEALED = 'APPEALED',
}

export enum DisputeOutcome {
  PENDING = 'PENDING',
  CLIENT_WINS = 'CLIENT_WINS',
  FREELANCER_WINS = 'FREELANCER_WINS',
  SPLIT = 'SPLIT',
}

export interface Dispute {
  id: string;
  contractId: string;
  initiatorId: string;
  
  reason: string;
  description: string;
  evidence: string[];
  
  status: DisputeStatus;
  outcome: DisputeOutcome;
  resolution: string | null;
  
  // Voting Data
  clientVotes: number;
  freelancerVotes: number;
  votingDeadline: Date | null;
  
  // Blockchain Data
  blockchainDisputeId: string | null;
  resolutionTxHash: string | null;
  
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (when included)
  contract?: {
    id: string;
    title: string;
    totalAmount: number;
  };
  initiator?: {
    id: string;
    name: string | null;
  };
  votes?: DisputeVote[];
  evidenceItems?: DisputeEvidence[];
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  uploadedById: string;
  url: string;
  cid: string | null;
  fileName: string | null;
  fileSize: number | null;
  description: string | null;
  createdAt: Date;

  uploadedBy?: {
    id: string;
    name: string | null;
  };
}

export interface DisputeVote {
  id: string;
  disputeId: string;
  jurorId: string;
  vote: DisputeOutcome;
  weight: number;
  reasoning: string | null;
  createdAt: Date;
  
  juror?: {
    id: string;
    name: string | null;
  };
}

// Create Dispute
export interface CreateDisputeInput {
  contractId: string;
  reason: string;
  description: string;
  evidence?: string[];
}

// Submit Evidence
export interface SubmitEvidenceInput {
  description: string;
  files?: File[];
}

// Cast Vote
export interface CastVoteInput {
  vote: DisputeOutcome.CLIENT_WINS | DisputeOutcome.FREELANCER_WINS;
  reasoning?: string;
}
