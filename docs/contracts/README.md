# DeTrust - Smart Contracts

Documentation for DeTrust Solidity smart contracts.

---

## Overview

DeTrust uses three main smart contracts deployed on Ethereum-compatible networks:

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| **JobEscrow** | Payment escrow | Fund, release, refund |
| **ReputationRegistry** | On-chain reviews | Record feedback hashes |
| **DisputeResolution** | Arbitration | Voting, resolution |

---

## Network Configuration

| Network | Chain ID | Use Case |
|---------|----------|----------|
| Hardhat | 31337 | Local development |
| Polygon Mumbai | 80001 | Testnet |
| Polygon Mainnet | 137 | Production |

---

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DeTrustFactory                           │
│                 (Contract Deployer)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ deploys
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────────┐
│   JobEscrow     │ │ Reputation  │ │    Dispute       │
│                 │ │  Registry   │ │   Resolution     │
│ - createJob()   │ │             │ │                  │
│ - submitWork()  │ │ - record()  │ │ - createDispute()│
│ - approve()     │ │ - getFeed() │ │ - vote()         │
│ - dispute()     │ │             │ │ - resolve()      │
└────────┬────────┘ └─────────────┘ └────────┬─────────┘
         │                                    │
         └────────────── reads ───────────────┘
```

---

## JobEscrow.sol

Manages payment escrow for freelance jobs.

### State Variables

```solidity
uint256 public platformFeePercent = 3;  // 3% platform fee
uint256 public constant MAX_PLATFORM_FEE = 10;  // Max 10%
address public feeRecipient;  // Platform fee recipient

mapping(bytes32 => Job) public jobs;
mapping(bytes32 => Milestone[]) public milestones;
uint256 public totalEscrowBalance;
```

### Structs

```solidity
struct Job {
    address client;
    address freelancer;
    uint256 totalAmount;
    uint256 paidAmount;
    uint256 platformFee;
    JobStatus status;
    uint256 createdAt;
}

struct Milestone {
    uint256 amount;
    MilestoneStatus status;
    string deliverableHash;  // IPFS hash
    uint256 submittedAt;
    uint256 approvedAt;
}

enum JobStatus {
    Created,    // 0
    Funded,     // 1
    InProgress, // 2
    Completed,  // 3
    Disputed,   // 4
    Cancelled   // 5
}

enum MilestoneStatus {
    Pending,    // 0
    InProgress, // 1
    Submitted,  // 2
    Approved,   // 3
    Paid,       // 4
    Disputed    // 5
}
```

### Functions

#### createJob

Creates a new job with milestones and funds escrow.

```solidity
function createJob(
    bytes32 jobId,
    address freelancer,
    uint256[] calldata milestoneAmounts
) external payable whenNotPaused nonReentrant
```

**Parameters**:
- `jobId`: Unique job identifier (keccak256 hash of off-chain ID)
- `freelancer`: Freelancer's wallet address
- `milestoneAmounts`: Array of milestone payment amounts

**Requirements**:
- `msg.value` >= total milestones + platform fee
- Freelancer cannot be client
- At least one milestone required

**Events**: `JobCreated`, `JobFunded`, `MilestoneAdded`

**Example**:
```javascript
const jobId = ethers.id("job-uuid-123");
const freelancer = "0x...";
const milestones = [
  ethers.parseEther("0.5"),
  ethers.parseEther("0.5")
];
const total = ethers.parseEther("1.0");
const fee = total * 3n / 100n;

await escrow.createJob(jobId, freelancer, milestones, {
  value: total + fee
});
```

#### submitMilestone

Freelancer submits work for a milestone.

```solidity
function submitMilestone(
    bytes32 jobId,
    uint256 milestoneIndex,
    string calldata deliverableHash
) external
```

**Parameters**:
- `jobId`: Job identifier
- `milestoneIndex`: Index of milestone (0-based)
- `deliverableHash`: IPFS hash of deliverables

**Requirements**:
- Caller must be freelancer
- Job must be Funded or InProgress
- Milestone must be Pending or InProgress

**Events**: `MilestoneSubmitted`

#### approveMilestone

Client approves milestone and releases payment.

```solidity
function approveMilestone(
    bytes32 jobId,
    uint256 milestoneIndex
) external nonReentrant
```

**Parameters**:
- `jobId`: Job identifier
- `milestoneIndex`: Index of milestone

**Requirements**:
- Caller must be client
- Job must be InProgress
- Milestone must be Submitted

**Actions**:
1. Marks milestone as Approved then Paid
2. Transfers funds to freelancer
3. If all milestones paid, marks job Complete
4. Transfers platform fee to recipient

**Events**: `MilestoneApproved`, `PaymentReleased`, `JobCompleted`

#### raiseDispute

Either party raises a dispute.

```solidity
function raiseDispute(bytes32 jobId) external
```

**Requirements**:
- Caller must be client or freelancer
- Job must be Funded or InProgress

**Events**: `DisputeRaised`

### View Functions

```solidity
function getJob(bytes32 jobId) external view returns (Job memory);
function getMilestones(bytes32 jobId) external view returns (Milestone[] memory);
function getMilestoneCount(bytes32 jobId) external view returns (uint256);
```

### Admin Functions

```solidity
function setPlatformFee(uint256 newFeePercent) external onlyOwner;
function setFeeRecipient(address newRecipient) external onlyOwner;
function pause() external onlyOwner;
function unpause() external onlyOwner;
function emergencyWithdraw(bytes32 jobId, address recipient, uint256 amount) external onlyOwner;
```

---

## ReputationRegistry.sol

Stores immutable feedback records on-chain.

### State Variables

```solidity
mapping(address => FeedbackRecord[]) public userFeedback;
mapping(bytes32 => mapping(address => bool)) public feedbackSubmitted;
```

### Structs

```solidity
struct FeedbackRecord {
    bytes32 jobId;
    address reviewer;
    address reviewed;
    bytes32 contentHash;  // IPFS hash of full review
    uint8 rating;         // 1-5
    uint256 timestamp;
}
```

### Functions

#### recordFeedback

Records a review hash on-chain.

```solidity
function recordFeedback(
    bytes32 jobId,
    address reviewed,
    bytes32 contentHash,
    uint8 rating
) external
```

**Parameters**:
- `jobId`: Job identifier
- `reviewed`: Address of user being reviewed
- `contentHash`: keccak256 hash of review content (stored on IPFS)
- `rating`: Rating 1-5

**Requirements**:
- Rating between 1-5
- Cannot review yourself
- One review per job per reviewer

**Events**: `FeedbackRecorded`

#### View Functions

```solidity
function getUserFeedback(address user) external view returns (FeedbackRecord[] memory);
function getFeedbackCount(address user) external view returns (uint256);
function getAverageRating(address user) external view returns (uint256 average, uint256 count);
```

**Note**: `getAverageRating` returns `average * 100` for precision (e.g., 450 = 4.50 rating)

---

## DisputeResolution.sol

Handles decentralized arbitration.

### State Variables

```solidity
uint256 public minJurorTrustScore = 50;  // Minimum trust score to be juror
uint256 public votingPeriod = 7 days;
uint256 public minJurors = 3;

mapping(bytes32 => Dispute) public disputes;
mapping(bytes32 => Vote[]) public disputeVotes;
mapping(bytes32 => mapping(address => bool)) public hasVoted;
mapping(address => uint256) public jurorTrustScores;  // Set by admin
```

### Structs

```solidity
struct Dispute {
    bytes32 jobId;
    address client;
    address freelancer;
    uint256 escrowAmount;
    string evidenceHashClient;
    string evidenceHashFreelancer;
    DisputeStatus status;
    DisputeOutcome outcome;
    uint256 votingDeadline;
    uint256 clientVotes;      // Weighted vote count
    uint256 freelancerVotes;  // Weighted vote count
    uint256 createdAt;
}

struct Vote {
    address juror;
    DisputeOutcome vote;
    uint256 weight;
    uint256 timestamp;
}

enum DisputeStatus {
    Open,       // 0
    Voting,     // 1
    Resolved    // 2
}

enum DisputeOutcome {
    Pending,        // 0
    ClientWins,     // 1
    FreelancerWins, // 2
    Split           // 3
}
```

### Functions

#### createDispute

Creates a new dispute (called by JobEscrow or admin).

```solidity
function createDispute(
    bytes32 disputeId,
    bytes32 jobId,
    address client,
    address freelancer,
    uint256 escrowAmount
) external onlyOwner
```

#### submitEvidence

Party submits evidence for dispute.

```solidity
function submitEvidence(
    bytes32 disputeId,
    string calldata evidenceHash
) external
```

**Requirements**:
- Caller must be client or freelancer
- Dispute must be Open

#### startVoting

Initiates voting period (called by admin after evidence).

```solidity
function startVoting(bytes32 disputeId) external onlyOwner
```

**Actions**:
- Sets status to Voting
- Sets votingDeadline to now + votingPeriod

#### castVote

Juror casts weighted vote.

```solidity
function castVote(
    bytes32 disputeId,
    DisputeOutcome vote
) external
```

**Requirements**:
- Status must be Voting
- Within voting deadline
- Not already voted
- Not a party to dispute
- Trust score >= minJurorTrustScore
- Vote must be ClientWins or FreelancerWins

**Actions**:
- Records vote with weight = juror's trust score
- Adds weight to clientVotes or freelancerVotes

#### resolveDispute

Resolves dispute after voting period.

```solidity
function resolveDispute(bytes32 disputeId) external
```

**Requirements**:
- Status must be Voting
- Past voting deadline
- Minimum jurors voted

**Actions**:
- Determines winner by weighted vote count
- Sets outcome and status

### Admin Functions

```solidity
function setJurorTrustScore(address juror, uint256 score) external onlyOwner;
function setMinJurorTrustScore(uint256 score) external onlyOwner;
function setVotingPeriod(uint256 period) external onlyOwner;
function setMinJurors(uint256 count) external onlyOwner;
```

---

## Events Reference

### JobEscrow Events

```solidity
event JobCreated(bytes32 indexed jobId, address indexed client, address indexed freelancer, uint256 totalAmount);
event JobFunded(bytes32 indexed jobId, uint256 amount);
event MilestoneAdded(bytes32 indexed jobId, uint256 milestoneIndex, uint256 amount);
event MilestoneSubmitted(bytes32 indexed jobId, uint256 milestoneIndex, string deliverableHash);
event MilestoneApproved(bytes32 indexed jobId, uint256 milestoneIndex);
event PaymentReleased(bytes32 indexed jobId, uint256 milestoneIndex, address freelancer, uint256 amount);
event DisputeRaised(bytes32 indexed jobId, address raisedBy);
event JobCompleted(bytes32 indexed jobId);
event JobCancelled(bytes32 indexed jobId, address cancelledBy);
```

### ReputationRegistry Events

```solidity
event FeedbackRecorded(
    bytes32 indexed jobId,
    address indexed reviewer,
    address indexed reviewed,
    bytes32 contentHash,
    uint8 rating
);
```

### DisputeResolution Events

```solidity
event DisputeCreated(bytes32 indexed disputeId, bytes32 indexed jobId, address client, address freelancer);
event EvidenceSubmitted(bytes32 indexed disputeId, address submitter, string evidenceHash);
event VotingStarted(bytes32 indexed disputeId, uint256 deadline);
event VoteCast(bytes32 indexed disputeId, address juror, DisputeOutcome vote, uint256 weight);
event DisputeResolved(bytes32 indexed disputeId, DisputeOutcome outcome);
```

---

## Security Considerations

### Implemented Protections

1. **ReentrancyGuard**: All payment functions use OpenZeppelin's ReentrancyGuard
2. **Pausable**: Admin can pause contracts in emergency
3. **Access Control**: Modifiers ensure only authorized callers
4. **Input Validation**: All inputs validated before state changes

### Best Practices

1. Always use `bytes32` job IDs (hash of off-chain UUID)
2. Store large data on IPFS, only hashes on-chain
3. Fund escrow with exact amount + fee
4. Handle transaction failures gracefully in frontend

---

## Deployment

### Local (Hardhat)

```bash
cd packages/contracts

# Start local node
pnpm node

# Deploy (in another terminal)
pnpm deploy:local
```

### Testnet (Mumbai)

```bash
# Set environment variables
export PRIVATE_KEY="0x..."
export MUMBAI_RPC_URL="https://rpc-mumbai.maticvigil.com"

# Deploy
pnpm deploy:mumbai

# Verify on Polygonscan
pnpm verify:mumbai
```

### Contract Addresses

After deployment, addresses are saved to:
```
packages/contracts/deployments/latest.json
```

---

## Testing

```bash
cd packages/contracts

# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test
pnpm test test/JobEscrow.test.ts
```

---

## Integration Examples

### Frontend (wagmi/viem)

```typescript
import { useWriteContract, useWaitForTransaction } from 'wagmi';
import { parseEther, encodeAbiParameters } from 'viem';

function useCreateJob() {
  const { writeContractAsync } = useWriteContract();
  
  const createJob = async (jobId: string, freelancer: string, amounts: bigint[]) => {
    const hash = await writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: JobEscrowABI,
      functionName: 'createJob',
      args: [
        keccak256(toBytes(jobId)),
        freelancer,
        amounts
      ],
      value: amounts.reduce((a, b) => a + b, 0n) * 103n / 100n, // +3% fee
    });
    
    return hash;
  };
  
  return { createJob };
}
```

### Backend (ethers.js)

```typescript
import { ethers } from 'ethers';

class BlockchainService {
  private escrow: ethers.Contract;
  
  async getJobStatus(jobId: string): Promise<number> {
    const jobIdHash = ethers.id(jobId);
    const job = await this.escrow.getJob(jobIdHash);
    return job.status;
  }
  
  async listenToEvents() {
    this.escrow.on('PaymentReleased', (jobId, milestoneIndex, freelancer, amount) => {
      console.log(`Payment of ${amount} released to ${freelancer}`);
      // Update database
    });
  }
}
```
