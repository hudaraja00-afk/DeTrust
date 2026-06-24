# DeTrust - Database Schema

Complete database schema reference for the DeTrust platform.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER DOMAIN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐  │
│  │    User     │────1:1──│FreelancerProfile │────M:M──│      Skill      │  │
│  │             │         │                  │         │                 │  │
│  │ id          │         │ trustScore       │         │ name            │  │
│  │ walletAddr  │         │ aiCapability     │         │ category        │  │
│  │ email       │         │ hourlyRate       │         └─────────────────┘  │
│  │ role        │         │ skills[]         │                              │
│  └──────┬──────┘         └──────────────────┘         ┌─────────────────┐  │
│         │                                              │  Certification  │  │
│         │           ┌──────────────────┐               │                 │  │
│         └────1:1────│  ClientProfile   │               │ name            │  │
│                     │                  │               │ issuer          │  │
│                     │ trustScore       │               │ credentialUrl   │  │
│                     │ companyName      │               └─────────────────┘  │
│                     │ hireRate         │                                    │
│                     └──────────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              JOB DOMAIN                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │    User     │                                                            │
│  │  (Client)   │                                                            │
│  └──────┬──────┘                                                            │
│         │ 1:M                                                               │
│         ▼                                                                   │
│  ┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐  │
│  │     Job     │────1:M──│    Proposal      │         │      Skill      │  │
│  │             │         │                  │         │                 │  │
│  │ title       │         │ coverLetter      │         └────────┬────────┘  │
│  │ description │         │ proposedRate     │                  │           │
│  │ budget      │         │ status           │                  │ M:M       │
│  │ status      │         └────────┬─────────┘                  │           │
│  │ deadline    │──────────────────┼────────────────────────────┘           │
│  └──────┬──────┘                  │                                        │
│         │                         │                                        │
│         │ 1:1                     │ 1:1 (accepted)                         │
│         ▼                         ▼                                        │
│  ┌─────────────┐         ┌──────────────────┐                              │
│  │  Contract   │◀────────│                  │                              │
│  │             │         └──────────────────┘                              │
│  │ address     │                                                            │
│  │ totalAmount │         ┌──────────────────┐                              │
│  │ status      │────1:M──│    Milestone     │                              │
│  └──────┬──────┘         │                  │                              │
│         │                │ title            │                              │
│         │ 1:M            │ amount           │                              │
│         ▼                │ status           │                              │
│  ┌─────────────┐         │ deliverableHash  │                              │
│  │   Dispute   │         └──────────────────┘                              │
│  │             │                                                            │
│  │ reason      │         ┌──────────────────┐                              │
│  │ status      │────1:M──│   DisputeVote    │                              │
│  │ outcome     │         │                  │                              │
│  └─────────────┘         │ vote             │                              │
│                          │ weight           │                              │
│                          └──────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMMUNICATION DOMAIN                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐  │
│  │    User     │────1:M──│     Message      │         │      Job        │  │
│  │             │         │                  │◀───────▶│   (optional)    │  │
│  │             │         │ content          │         └─────────────────┘  │
│  │             │         │ attachments[]    │                              │
│  │             │────1:M──│ readAt           │                              │
│  │             │         └──────────────────┘                              │
│  │             │                                                            │
│  │             │         ┌──────────────────┐                              │
│  │             │────1:M──│   Notification   │                              │
│  │             │         │                  │                              │
│  │             │         │ type             │                              │
│  │             │         │ title            │                              │
│  │             │         │ read             │                              │
│  └─────────────┘         └──────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            REVIEW DOMAIN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                           ┌─────────────┐                  │
│  │    User     │                           │    User     │                  │
│  │  (Author)   │                           │  (Subject)  │                  │
│  └──────┬──────┘                           └──────┬──────┘                  │
│         │ 1:M                                     │ 1:M                     │
│         │              ┌──────────────────┐       │                         │
│         └─────────────▶│     Review       │◀──────┘                         │
│                        │                  │                                 │
│                        │ overallRating    │         ┌─────────────────┐    │
│                        │ comment          │◀───────▶│      Job        │    │
│                        │ ipfsHash         │         └─────────────────┘    │
│                        │ blockchainTxHash │                                 │
│                        └──────────────────┘                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### User

Primary user account table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, cuid() | Unique identifier |
| walletAddress | String | Unique, Optional | Ethereum wallet address |
| email | String | Unique, Optional | Email address |
| passwordHash | String | Optional | Bcrypt hashed password |
| name | String | Optional | Display name |
| avatar | String | Optional | Avatar URL |
| role | Enum | Default: FREELANCER | FREELANCER, CLIENT, ADMIN |
| isVerified | Boolean | Default: false | Email/identity verified |
| twoFactorEnabled | Boolean | Default: false | 2FA status |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-update | Last update timestamp |

**Indexes**: `walletAddress`, `email`

---

### FreelancerProfile

Extended profile for freelancer users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| userId | String | FK, Unique | Reference to User |
| title | String | Optional | Professional title |
| bio | Text | Optional | Biography/description |
| hourlyRate | Decimal(10,2) | Optional | Hourly rate |
| experienceYears | Float | Default: 0 | Years of experience |
| education | String | Optional | Education level |
| location | String | Optional | Location |
| timezone | String | Optional | Timezone |
| languages | String[] | Default: [] | Spoken languages |
| portfolioUrl | String | Optional | Portfolio website |
| githubUrl | String | Optional | GitHub profile |
| linkedinUrl | String | Optional | LinkedIn profile |
| **trustScore** | Float | Default: 0 | Calculated trust score (0-100) |
| **aiCapabilityScore** | Float | Optional | AI-predicted score (0-100) |
| **aiCapabilityLevel** | String | Optional | Beginner/Intermediate/Advanced/Expert |
| completionRate | Float | Default: 0 | Job completion rate |
| totalEarnings | Decimal(18,6) | Default: 0 | Total earnings |
| totalJobs | Int | Default: 0 | Total completed jobs |
| createdAt | DateTime | | |
| updatedAt | DateTime | | |

**Indexes**: `trustScore`, `aiCapabilityLevel`

---

### ClientProfile

Extended profile for client users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| userId | String | FK, Unique | Reference to User |
| companyName | String | Optional | Company name |
| companyLogo | String | Optional | Logo URL |
| description | Text | Optional | Company description |
| website | String | Optional | Company website |
| location | String | Optional | Location |
| **trustScore** | Float | Default: 0 | Calculated trust score |
| totalSpent | Decimal(18,6) | Default: 0 | Total spent |
| totalJobsPosted | Int | Default: 0 | Total jobs posted |
| hireRate | Float | Default: 0 | Percentage of jobs with hires |
| paymentVerified | Boolean | Default: false | Has verified payment method |
| createdAt | DateTime | | |
| updatedAt | DateTime | | |

---

### Skill

Master list of skills.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| name | String | Unique | Skill name |
| category | String | Optional | Skill category |
| description | String | Optional | Skill description |

**Indexes**: `name`, `category`

---

### FreelancerSkill

Junction table for freelancer skills.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| freelancerProfileId | String | FK | Reference to FreelancerProfile |
| skillId | String | FK | Reference to Skill |
| **isVerified** | Boolean | Default: false | Skill verified via test |
| verifiedAt | DateTime | Optional | Verification timestamp |
| verificationScore | Float | Optional | Test score |
| yearsExperience | Float | Optional | Experience with skill |
| createdAt | DateTime | | |

**Unique**: `[freelancerProfileId, skillId]`

---

### Job

Job listings posted by clients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| clientId | String | FK | Reference to User |
| title | String | Required | Job title |
| description | Text | Required | Full description |
| category | String | Required | Job category |
| budgetType | Enum | Required | FIXED, HOURLY |
| budgetMin | Decimal(18,6) | Optional | Minimum budget (hourly) |
| budgetMax | Decimal(18,6) | Optional | Maximum budget (hourly) |
| fixedBudget | Decimal(18,6) | Optional | Fixed price budget |
| deadline | DateTime | Optional | Deadline |
| experienceLevel | String | Optional | Required experience |
| projectLength | String | Optional | Estimated duration |
| **status** | Enum | Default: OPEN | DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED |
| visibility | Enum | Default: PUBLIC | PUBLIC, PRIVATE, INVITE_ONLY |
| createdAt | DateTime | | |
| updatedAt | DateTime | | |

**Indexes**: `status`, `category`, `createdAt`

**Statuses**:
- `DRAFT`: Not yet published
- `OPEN`: Accepting proposals
- `IN_PROGRESS`: Work started
- `COMPLETED`: All milestones paid
- `CANCELLED`: Job cancelled

---

### Proposal

Freelancer proposals for jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| jobId | String | FK | Reference to Job |
| freelancerId | String | FK | Reference to User |
| coverLetter | Text | Required | Proposal text |
| proposedRate | Decimal(18,6) | Required | Proposed fee |
| estimatedDuration | String | Optional | Time estimate |
| **status** | Enum | Default: SUBMITTED | Proposal status |
| viewedAt | DateTime | Optional | When client viewed |
| createdAt | DateTime | | |
| updatedAt | DateTime | | |

**Unique**: `[jobId, freelancerId]`
**Indexes**: `status`

**Statuses**:
- `SUBMITTED`: Waiting for review
- `VIEWED`: Client has viewed
- `SHORTLISTED`: Client shortlisted
- `ACCEPTED`: Proposal accepted
- `REJECTED`: Proposal rejected
- `WITHDRAWN`: Freelancer withdrew

---

### Contract

Smart contract record linking job to blockchain.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| jobId | String | FK, Unique | Reference to Job |
| **contractAddress** | String | Unique, Optional | Deployed contract address |
| transactionHash | String | Optional | Deployment tx hash |
| totalAmount | Decimal(18,6) | Required | Total contract value |
| paidAmount | Decimal(18,6) | Default: 0 | Amount paid so far |
| platformFee | Decimal(18,6) | Default: 0 | Platform fee amount |
| **status** | Enum | Default: PENDING | Contract status |
| startDate | DateTime | Optional | Work start date |
| endDate | DateTime | Optional | Work end date |
| createdAt | DateTime | | |
| updatedAt | DateTime | | |

**Indexes**: `contractAddress`, `status`

**Statuses**:
- `PENDING`: Contract created, not funded
- `FUNDED`: Escrow funded
- `ACTIVE`: Work in progress
- `COMPLETED`: All paid
- `DISPUTED`: Under dispute
- `CANCELLED`: Cancelled

---

### Milestone

Job milestones for staged payments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| jobId | String | FK | Reference to Job |
| title | String | Required | Milestone title |
| description | Text | Optional | Description |
| amount | Decimal(18,6) | Required | Payment amount |
| dueDate | DateTime | Optional | Due date |
| order | Int | Default: 0 | Display order |
| **status** | Enum | Default: PENDING | Milestone status |
| submittedAt | DateTime | Optional | When work submitted |
| approvedAt | DateTime | Optional | When approved |
| **deliverableHash** | String | Optional | IPFS hash of deliverables |
| createdAt | DateTime | | |
| updatedAt | DateTime | | |

**Indexes**: `status`

**Statuses**:
- `PENDING`: Not started
- `IN_PROGRESS`: Work in progress
- `SUBMITTED`: Work submitted for review
- `REVISION_REQUESTED`: Client requested changes
- `APPROVED`: Client approved
- `PAID`: Payment released

---

### Review

Feedback between users after job completion.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| authorId | String | FK | Who wrote the review |
| subjectId | String | FK | Who is being reviewed |
| jobId | String | Required | Related job |
| **overallRating** | Int | Required, 1-5 | Overall rating |
| communicationRating | Int | Optional, 1-5 | Communication rating |
| qualityRating | Int | Optional, 1-5 | Quality rating |
| timelinessRating | Int | Optional, 1-5 | Timeliness rating |
| comment | Text | Optional | Review text |
| **ipfsHash** | String | Optional | IPFS hash of review |
| **blockchainTxHash** | String | Optional | On-chain record tx |
| createdAt | DateTime | | |

**Unique**: `[authorId, jobId]`
**Indexes**: `subjectId`

---

### Dispute

Dispute records for contract conflicts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| contractId | String | FK | Reference to Contract |
| raisedById | String | FK | Who raised dispute |
| reason | String | Required | Dispute reason |
| description | Text | Required | Full description |
| **evidenceHashes** | String[] | Default: [] | IPFS hashes of evidence |
| **status** | Enum | Default: OPEN | Dispute status |
| **outcome** | Enum | Optional | Resolution outcome |
| votingDeadline | DateTime | Optional | When voting ends |
| resolvedAt | DateTime | Optional | When resolved |
| createdAt | DateTime | | |
| updatedAt | DateTime | | |

**Indexes**: `status`

**Statuses**:
- `OPEN`: Just opened
- `EVIDENCE_PERIOD`: Collecting evidence
- `VOTING`: Jurors voting
- `RESOLVED`: Decision made
- `APPEALED`: Under appeal

**Outcomes**:
- `CLIENT_WINS`: Full refund to client
- `FREELANCER_WINS`: Full payment to freelancer
- `SPLIT`: 50/50 split

---

### DisputeVote

Juror votes on disputes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| disputeId | String | FK | Reference to Dispute |
| jurorId | String | FK | Reference to User |
| **vote** | Enum | Required | CLIENT_WINS, FREELANCER_WINS, SPLIT |
| reasoning | Text | Optional | Vote reasoning |
| **weight** | Float | Default: 1 | Vote weight (based on trust score) |
| createdAt | DateTime | | |

**Unique**: `[disputeId, jurorId]`

---

### Message

Direct messages between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| senderId | String | FK | Message sender |
| receiverId | String | FK | Message receiver |
| jobId | String | Optional | Related job |
| content | Text | Required | Message content |
| attachments | String[] | Default: [] | IPFS hashes |
| readAt | DateTime | Optional | When read |
| createdAt | DateTime | | |

**Indexes**: `[senderId, receiverId]`, `jobId`

---

### Notification

User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| userId | String | FK | Reference to User |
| **type** | Enum | Required | Notification type |
| title | String | Required | Notification title |
| message | String | Required | Notification text |
| data | Json | Optional | Additional data |
| read | Boolean | Default: false | Read status |
| readAt | DateTime | Optional | When read |
| createdAt | DateTime | | |

**Indexes**: `[userId, read]`, `createdAt`

**Types**:
- `JOB_POSTED`, `PROPOSAL_RECEIVED`, `PROPOSAL_ACCEPTED`, `PROPOSAL_REJECTED`
- `MILESTONE_SUBMITTED`, `MILESTONE_APPROVED`
- `PAYMENT_RECEIVED`, `PAYMENT_RELEASED`
- `DISPUTE_OPENED`, `DISPUTE_RESOLVED`
- `REVIEW_RECEIVED`, `MESSAGE_RECEIVED`
- `SYSTEM`

---

## Trust Score Calculation

### Freelancer Trust Score

```sql
trustScore = (
  (0.4 * averageRating / 5 * 100) +      -- 40% weight
  (0.3 * completionRate * 100) +          -- 30% weight
  (0.2 * disputeWinRate * 100) +          -- 20% weight
  (0.1 * experienceFactor * 100)          -- 10% weight
)

WHERE:
  averageRating = AVG(reviews.overallRating)
  completionRate = completedJobs / totalJobs
  disputeWinRate = disputesWon / totalDisputes
  experienceFactor = MIN(yearsActive / 5, 1)
```

### Client Trust Score

```sql
trustScore = (
  (0.4 * averageRating / 5 * 100) +       -- 40% weight
  (0.3 * paymentPunctuality * 100) +      -- 30% weight
  (0.2 * hireRate * 100) +                -- 20% weight
  (0.1 * jobClarityRating / 5 * 100)      -- 10% weight
)

WHERE:
  averageRating = AVG(reviews from freelancers)
  paymentPunctuality = onTimePayments / totalPayments
  hireRate = jobsWithHires / totalJobsPosted
  jobClarityRating = AVG(clarity ratings from freelancers)
```

---

## Prisma Schema Location

Full Prisma schema: `packages/database/prisma/schema.prisma`

Generate client: `pnpm db:generate`

Push schema: `pnpm db:push`

Create migration: `pnpm db:migrate`
