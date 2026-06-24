// Blockchain Types for DeTrust Platform

export interface ChainConfig {
  id: number;
  name: string;
  network: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Contract Addresses
export interface ContractAddresses {
  escrow: `0x${string}`;
  reputation: `0x${string}`;
  dispute: `0x${string}`;
}

// Transaction Types
export interface TransactionRequest {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
}

export interface TransactionReceipt {
  transactionHash: `0x${string}`;
  blockNumber: number;
  status: 'success' | 'reverted';
  gasUsed: bigint;
}

// Job Escrow Contract Types
export interface OnChainJob {
  client: `0x${string}`;
  freelancer: `0x${string}`;
  totalAmount: bigint;
  releasedAmount: bigint;
  status: number; // 0-5 JobStatus enum
  createdAt: bigint;
}

export interface OnChainMilestone {
  amount: bigint;
  status: number; // 0-5 MilestoneStatus enum
  deliverableHash: string;
  submittedAt: bigint;
  approvedAt: bigint;
}

// Reputation Registry Contract Types
export interface OnChainFeedback {
  jobId: `0x${string}`;
  reviewer: `0x${string}`;
  reviewed: `0x${string}`;
  contentHash: `0x${string}`;
  rating: number;
  timestamp: bigint;
}

// Dispute Resolution Contract Types
export interface OnChainDispute {
  jobId: `0x${string}`;
  client: `0x${string}`;
  freelancer: `0x${string}`;
  escrowAmount: bigint;
  clientVotes: bigint;
  freelancerVotes: bigint;
  status: number; // 0-2 DisputeStatus enum
  outcome: number; // 0-3 DisputeOutcome enum
  votingDeadline: bigint;
  createdAt: bigint;
}

// SIWE (Sign-In with Ethereum)
export interface SIWEMessage {
  domain: string;
  address: `0x${string}`;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

// Supported Chains
export const SUPPORTED_CHAINS = {
  localhost: {
    id: 31337,
    name: 'Localhost',
    network: 'localhost',
    rpcUrl: 'http://localhost:8545',
    blockExplorer: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  polygonMumbai: {
    id: 80001,
    name: 'Polygon Mumbai',
    network: 'maticmum',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    network: 'matic',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
} as const satisfies Record<string, ChainConfig>;
