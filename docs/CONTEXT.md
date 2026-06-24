# DeTrust - Project Context for AI Agents

> This document provides comprehensive context for AI agents working on the DeTrust project.
> Read this first to understand the project structure, business logic, and development patterns.

---

## 📋 Table of Contents

1. [Project Summary](#project-summary)
2. [Business Domain](#business-domain)
3. [System Architecture](#system-architecture)
4. [Module Breakdown](#module-breakdown)
5. [Data Flow](#data-flow)
6. [Key Business Rules](#key-business-rules)
7. [API Structure](#api-structure)
8. [Database Schema](#database-schema)
9. [Smart Contracts](#smart-contracts)
10. [Development Patterns](#development-patterns)
11. [Environment Variables](#environment-variables)

---

## 🎯 Project Summary

**DeTrust** is a decentralized freelance marketplace that connects clients with freelancers using blockchain technology for secure payments and AI for trust scoring.

### Core Value Propositions

1. **Secure Payments**: Smart contract escrow holds funds until work is approved
2. **Low Fees**: 1-3% vs 15-20% on traditional platforms
3. **Fair Start**: AI capability assessment helps newcomers compete
4. **Transparent Trust**: On-chain reputation that can't be manipulated
5. **Fast Disputes**: Community arbitration resolves issues in days, not weeks

### Target Users

| User Type | Description | Primary Actions |
|-----------|-------------|-----------------|
| **Freelancer** | Service provider seeking work | Create profile, browse jobs, submit proposals, complete work, receive payments |
| **Client** | Individual/company hiring talent | Post jobs, review proposals, fund escrow, approve milestones, leave reviews |
| **Admin** | Platform administrator | Monitor platform, manage disputes, configure settings |
| **Juror** | High-reputation user | Vote on disputes (must have trust score > 50) |

---

## 💼 Business Domain

### Workflow: Job Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. CLIENT   │     │ 2. FREELANCER│     │  3. CLIENT   │
│  Posts Job   │────▶│  Submits     │────▶│  Reviews &   │
│              │     │  Proposal    │     │  Accepts     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  6. BOTH     │     │ 5. CLIENT    │     │ 4. CLIENT    │
│  Leave       │◀────│  Approves &  │◀────│  Funds       │
│  Reviews     │     │  Pays        │     │  Escrow      │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Trust Score Formulas

**Freelancer Trust Score:**
```
TrustScore = (0.4 × AvgRating) + (0.3 × CompletionRate) + (0.2 × DisputeWinRate) + (0.1 × Experience)
```

**Client Trust Score:**
```
TrustScore = (0.4 × AvgRating) + (0.3 × PaymentPunctuality) + (0.2 × HireRate) + (0.1 × JobClarityRating)
```

### AI Capability Levels

| Level | Score Range | Criteria |
|-------|-------------|----------|
| Beginner | 0-34 | New user, limited portfolio |
| Intermediate | 35-59 | Some experience, verified skills |
| Advanced | 60-79 | Strong portfolio, certifications |
| Expert | 80-100 | Extensive experience, high-demand skills |

---

## 🏗 System Architecture

### Service Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           MONOREPO (Turborepo)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  apps/web   │  │  apps/api   │  │apps/ai-svc  │                 │
│  │             │  │             │  │             │                 │
│  │  Next.js 15 │  │  Express.js │  │   FastAPI   │                 │
│  │  Port: 3000 │  │  Port: 4000 │  │  Port: 8000 │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          │                                          │
│  ┌───────────────────────┴───────────────────────┐                 │
│  │              packages/ (shared)               │                 │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │                 │
│  │  │ database │ │contracts │ │  types   │      │                 │
│  │  │ (Prisma) │ │(Solidity)│ │   (TS)   │      │                 │
│  │  └──────────┘ └──────────┘ └──────────┘      │                 │
│  └───────────────────────────────────────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

External Services:
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ PostgreSQL │ │   Redis    │ │   IPFS     │ │ Blockchain │
│   :5432    │ │   :6379    │ │  (Pinata)  │ │  (Hardhat) │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### Communication Patterns

| From | To | Protocol | Purpose |
|------|-----|----------|---------|
| Web → API | HTTP/REST | All data operations |
| Web → API | WebSocket | Real-time notifications, chat |
| Web → Blockchain | JSON-RPC | Wallet transactions |
| API → AI Service | HTTP/REST | Capability prediction |
| API → Blockchain | JSON-RPC | Contract interactions |
| API → IPFS | HTTP | File storage |

---

## 📦 Module Breakdown

### Module 1: Authentication & User Management
**Location**: `apps/api/src/controllers/auth.controller.ts`, `apps/api/src/controllers/user.controller.ts`

**Features**:
- Wallet-based authentication (SIWE - Sign-In with Ethereum)
- Email/password authentication (optional)
- Two-factor authentication (2FA)
- Profile management (Freelancer & Client profiles)

**Key Endpoints**:
```
POST /api/auth/wallet/connect    - Connect wallet
POST /api/auth/wallet/verify     - Verify signature (SIWE)
POST /api/auth/register          - Email registration
POST /api/auth/login             - Email login
POST /api/auth/2fa/setup         - Setup 2FA
GET  /api/users/me               - Get current user
PUT  /api/users/me               - Update profile
```

### Module 2: Job Management
**Location**: `apps/api/src/controllers/job.controller.ts`

**Features**:
- Job posting with skills, budget, deadline
- Job browsing with filters and search
- Proposal submission and management
- Job status tracking

**Job Statuses**: `DRAFT` → `OPEN` → `IN_PROGRESS` → `COMPLETED` | `CANCELLED`

**Key Endpoints**:
```
POST   /api/jobs                 - Create job
GET    /api/jobs                 - List jobs (with filters)
GET    /api/jobs/:id             - Get job details
PUT    /api/jobs/:id             - Update job
DELETE /api/jobs/:id             - Delete/cancel job
POST   /api/jobs/:id/proposals   - Submit proposal
GET    /api/jobs/:id/proposals   - List proposals (client only)
```

### Module 3: Contract & Escrow
**Location**: `apps/api/src/controllers/contract.controller.ts`, `apps/api/src/controllers/milestone.controller.ts`

**Features**:
- Smart contract deployment for each job
- Milestone creation and tracking
- Escrow funding and release
- Payment processing

**Milestone Statuses**: `PENDING` → `IN_PROGRESS` → `SUBMITTED` → `APPROVED` → `PAID`

**Key Endpoints**:
```
POST /api/contracts              - Create contract (deploys smart contract)
GET  /api/contracts/:id          - Get contract details
POST /api/contracts/:id/fund     - Fund escrow
POST /api/milestones/:id/submit  - Submit milestone work
POST /api/milestones/:id/approve - Approve & release payment
```

### Module 4: Review & Trust System
**Location**: `apps/api/src/controllers/review.controller.ts`, `apps/api/src/services/trustScore.service.ts`

**Features**:
- Mutual review system (client ↔ freelancer)
- On-chain review hash storage
- Trust score calculation
- Double-blind reviews (neither sees other's review until both submitted)

**Key Endpoints**:
```
POST /api/reviews                - Submit review
GET  /api/users/:id/reviews      - Get user's reviews
GET  /api/users/:id/trust-score  - Get trust score breakdown
```

### Module 5: Dispute Resolution
**Location**: `apps/api/src/controllers/dispute.controller.ts`

**Features**:
- Dispute initiation with evidence
- Juror selection based on trust score
- Voting mechanism with weighted votes
- Automated resolution enforcement

**Dispute Statuses**: `OPEN` → `EVIDENCE_PERIOD` → `VOTING` → `RESOLVED`

**Key Endpoints**:
```
POST /api/disputes               - Open dispute
POST /api/disputes/:id/evidence  - Submit evidence
GET  /api/disputes/:id           - Get dispute details
POST /api/disputes/:id/vote      - Cast vote (jurors only)
```

### Module 6: AI Capability Assessment
**Location**: `apps/ai-service/app/`

**Features**:
- Profile analysis for capability prediction
- Skill verification through microtasks
- Initial credibility scoring for newcomers

**AI Endpoints** (FastAPI):
```
POST /api/v1/predict-capability  - Predict capability level
POST /api/v1/analyze-profile     - Full profile analysis
GET  /api/v1/skill-test/:id      - Get skill test questions
POST /api/v1/verify-skill        - Submit test answers
```

### Module 7: Real-time Communication
**Location**: `apps/api/src/socket/`, `apps/api/src/controllers/message.controller.ts`

**Features**:
- In-app messaging between client and freelancer
- Real-time notifications
- Typing indicators
- Message read receipts

**Socket Events**:
```
connection           - User connects
join:room            - Join chat room
message:send         - Send message
message:received     - Receive message
notification:new     - New notification
typing:start/stop    - Typing indicators
```

### Module 8: Admin Dashboard
**Location**: `apps/api/src/controllers/admin.controller.ts`

**Features**:
- Platform analytics
- User management
- Dispute oversight
- System configuration

---

## 🔄 Data Flow

### Job Creation to Completion Flow

```
1. CLIENT creates job
   └─▶ API validates & saves to PostgreSQL
   └─▶ Job status: OPEN

2. FREELANCER submits proposal
   └─▶ API validates & saves proposal
   └─▶ Notification sent to client

3. CLIENT accepts proposal
   └─▶ API creates Contract record
   └─▶ Smart contract deployed to blockchain
   └─▶ Job status: IN_PROGRESS

4. CLIENT funds escrow
   └─▶ Frontend prompts wallet signature
   └─▶ ETH/tokens transferred to smart contract
   └─▶ Contract status: FUNDED

5. FREELANCER submits milestone
   └─▶ Files uploaded to IPFS
   └─▶ IPFS hash stored in database
   └─▶ Milestone status: SUBMITTED
   └─▶ Notification sent to client

6. CLIENT approves milestone
   └─▶ Frontend prompts wallet signature
   └─▶ Smart contract releases payment
   └─▶ Milestone status: PAID
   └─▶ Trust scores recalculated

7. BOTH parties leave reviews
   └─▶ Review hash stored on blockchain
   └─▶ Full review stored in PostgreSQL
   └─▶ Trust scores updated
```

### Dispute Resolution Flow

```
1. PARTY raises dispute
   └─▶ Contract status: DISPUTED
   └─▶ Evidence period begins (3 days)

2. BOTH parties submit evidence
   └─▶ Evidence uploaded to IPFS
   └─▶ Evidence hashes stored

3. VOTING period begins
   └─▶ Jurors selected (trust score > 50)
   └─▶ 7-day voting window

4. JURORS cast votes
   └─▶ Votes weighted by trust score
   └─▶ Votes recorded on smart contract

5. DISPUTE resolved
   └─▶ Winner determined by vote count
   └─▶ Smart contract executes outcome
   └─▶ Funds released to winner
```

---

## 📊 Database Schema

### Core Entities

```
User
├── id (cuid)
├── walletAddress (unique, optional)
├── email (unique, optional)
├── role (FREELANCER | CLIENT | ADMIN)
├── FreelancerProfile (1:1)
└── ClientProfile (1:1)

FreelancerProfile
├── userId (FK)
├── title, bio, hourlyRate
├── trustScore (0-100)
├── aiCapabilityScore (0-100)
├── aiCapabilityLevel (Beginner|Intermediate|Advanced|Expert)
├── skills[] (M:M with Skill)
└── certifications[]

ClientProfile
├── userId (FK)
├── companyName, description
├── trustScore (0-100)
├── totalSpent
└── hireRate

Job
├── id, clientId (FK)
├── title, description, category
├── budgetType (FIXED | HOURLY)
├── budget, deadline
├── status (DRAFT|OPEN|IN_PROGRESS|COMPLETED|CANCELLED)
├── skills[] (M:M with Skill)
├── proposals[]
└── milestones[]

Proposal
├── jobId (FK), freelancerId (FK)
├── coverLetter, proposedRate
├── status (SUBMITTED|VIEWED|ACCEPTED|REJECTED)
└── timestamps

Contract
├── jobId (FK, unique)
├── contractAddress (blockchain)
├── totalAmount, paidAmount, platformFee
├── status (PENDING|FUNDED|ACTIVE|COMPLETED|DISPUTED)
└── disputes[]

Milestone
├── jobId (FK)
├── title, description, amount
├── status (PENDING|IN_PROGRESS|SUBMITTED|APPROVED|PAID)
└── deliverableHash (IPFS)

Review
├── authorId (FK), subjectId (FK), jobId
├── ratings (overall, communication, quality, timeliness)
├── comment
└── ipfsHash, blockchainTxHash

Dispute
├── contractId (FK), raisedById (FK)
├── reason, description
├── evidenceHashes[] (IPFS)
├── status, outcome
├── votes[]
└── votingDeadline
```

### Key Relationships

```
User ─────────────── 1:1 ─────────────── FreelancerProfile
User ─────────────── 1:1 ─────────────── ClientProfile
User ─────────────── 1:M ─────────────── Job (as client)
User ─────────────── 1:M ─────────────── Proposal (as freelancer)
Job ──────────────── 1:M ─────────────── Proposal
Job ──────────────── 1:1 ─────────────── Contract
Job ──────────────── 1:M ─────────────── Milestone
Contract ─────────── 1:M ─────────────── Dispute
Dispute ─────────── 1:M ─────────────── DisputeVote
FreelancerProfile ── M:M ─────────────── Skill
Job ──────────────── M:M ─────────────── Skill
```

---

## 📜 Smart Contracts

### JobEscrow.sol
**Purpose**: Manages payment escrow for jobs

**Key Functions**:
```solidity
createJob(jobId, freelancer, milestoneAmounts[]) payable
  // Creates job, locks funds in escrow
  // Emits: JobCreated, JobFunded, MilestoneAdded

submitMilestone(jobId, milestoneIndex, deliverableHash)
  // Freelancer submits work
  // Emits: MilestoneSubmitted

approveMilestone(jobId, milestoneIndex)
  // Client approves, triggers payment
  // Emits: MilestoneApproved, PaymentReleased

raiseDispute(jobId)
  // Either party can raise dispute
  // Emits: DisputeRaised
```

**State Variables**:
```solidity
mapping(bytes32 => Job) public jobs;
mapping(bytes32 => Milestone[]) public milestones;
uint256 public platformFeePercent = 3;
```

### ReputationRegistry.sol
**Purpose**: Stores immutable feedback records

**Key Functions**:
```solidity
recordFeedback(jobId, reviewed, contentHash, rating)
  // Records review hash on-chain
  // Emits: FeedbackRecorded

getUserFeedback(user) returns (FeedbackRecord[])
getAverageRating(user) returns (average, count)
```

### DisputeResolution.sol
**Purpose**: Handles decentralized arbitration

**Key Functions**:
```solidity
createDispute(disputeId, jobId, client, freelancer, amount)
submitEvidence(disputeId, evidenceHash)
startVoting(disputeId)
castVote(disputeId, vote) // Vote weighted by juror's trust score
resolveDispute(disputeId)
```

---

## 🔧 Development Patterns

### Backend API Pattern (Express + TypeScript)

```typescript
// Controller pattern
// apps/api/src/controllers/job.controller.ts
export class JobController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createJobSchema.parse(req.body);
      const job = await jobService.create(data, req.user.id);
      res.status(201).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }
}

// Service pattern
// apps/api/src/services/job.service.ts
export class JobService {
  async create(data: CreateJobInput, clientId: string) {
    return prisma.job.create({
      data: { ...data, clientId },
      include: { skills: true }
    });
  }
}

// Validator pattern (Zod)
// apps/api/src/validators/job.validator.ts
export const createJobSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(100),
  budgetType: z.enum(['FIXED', 'HOURLY']),
  budget: z.number().positive(),
  skills: z.array(z.string()).min(1).max(10),
});
```

### Frontend Pattern (Next.js + React Query)

```typescript
// API client
// apps/web/src/lib/api/jobs.ts
export const jobsApi = {
  list: (params: JobFilters) => 
    apiClient.get<Job[]>('/jobs', { params }),
  
  create: (data: CreateJobInput) =>
    apiClient.post<Job>('/jobs', data),
};

// React Query hook
// apps/web/src/hooks/useJobs.ts
export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsApi.list(filters),
  });
}

// Component usage
// apps/web/src/app/(public)/jobs/page.tsx
export default function JobsPage() {
  const { data: jobs, isLoading } = useJobs(filters);
  // ...
}
```

### Smart Contract Interaction Pattern

```typescript
// apps/api/src/services/blockchain.service.ts
export class BlockchainService {
  private provider: ethers.Provider;
  private escrowContract: ethers.Contract;

  async createJob(jobId: string, freelancer: string, amounts: bigint[]) {
    const tx = await this.escrowContract.createJob(
      ethers.id(jobId),
      freelancer,
      amounts,
      { value: totalAmount + fee }
    );
    return tx.wait();
  }
}

// Frontend wallet interaction
// apps/web/src/hooks/useEscrow.ts
export function useCreateJob() {
  const { writeContractAsync } = useWriteContract();
  
  return useMutation({
    mutationFn: async (params) => {
      return writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: JobEscrowABI,
        functionName: 'createJob',
        args: [jobId, freelancer, amounts],
        value: totalWithFee,
      });
    },
  });
}
```

---

## 🔐 Environment Variables

### apps/web/.env.local
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:4000

# Blockchain
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_DISPUTE_ADDRESS=0x...

# Wallet Connect (for RainbowKit)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=xxx

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

### apps/api/.env
```bash
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://detrust:password@localhost:5432/detrust_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Blockchain
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0x... # For server-side contract calls
ESCROW_ADDRESS=0x...
REPUTATION_ADDRESS=0x...
DISPUTE_ADDRESS=0x...

# AI Service
AI_SERVICE_URL=http://localhost:8000

# IPFS (Pinata)
PINATA_API_KEY=xxx
PINATA_SECRET_KEY=xxx

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_USER=xxx
SMTP_PASS=xxx
```

### apps/ai-service/.env
```bash
# Server
PORT=8000
DEBUG=true

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Model paths
MODEL_PATH=./app/ml/trained_models
```

---

## 📝 Common Tasks for AI Agents

### Adding a New API Endpoint

1. Create validator in `apps/api/src/validators/`
2. Create/update service in `apps/api/src/services/`
3. Create/update controller in `apps/api/src/controllers/`
4. Add route in `apps/api/src/routes/`
5. Update types in `packages/types/src/`

### Adding a New Page (Frontend)

1. Create page in `apps/web/src/app/`
2. Create components in `apps/web/src/components/`
3. Add API client function in `apps/web/src/lib/api/`
4. Create React Query hook in `apps/web/src/hooks/`

### Adding a Smart Contract Function

1. Update contract in `packages/contracts/contracts/`
2. Write tests in `packages/contracts/test/`
3. Update deployment script
4. Regenerate typechain types
5. Update `blockchain.service.ts` in API
6. Update frontend hooks

### Adding a New Database Table

1. Update schema in `packages/database/prisma/schema.prisma`
2. Run `pnpm db:migrate`
3. Update types in `packages/types/src/`
4. Create service in `apps/api/src/services/`

---

## ⚠️ Important Constraints

1. **All payments must go through smart contract escrow** - Never handle funds directly
2. **Reviews are immutable** - Once submitted, cannot be edited (hash stored on-chain)
3. **Trust scores are calculated, not set** - Always derived from on-chain data
4. **Dispute votes are weighted** - Higher trust score = more voting power
5. **File storage uses IPFS** - Only hashes stored in database
6. **Wallet authentication is primary** - Email auth is optional/secondary

---

## 🔗 Related Documentation

- [API Endpoints](docs/api/endpoints.md)
- [Database Schema](docs/architecture/database-schema.md)
- [Smart Contracts](docs/contracts/README.md)
- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
