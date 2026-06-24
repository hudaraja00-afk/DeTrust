# DeTrust - System Architecture

Comprehensive overview of the DeTrust system architecture.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Web Browser                                   │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │   │
│  │  │   Next.js     │  │  MetaMask/    │  │   Socket.io   │           │   │
│  │  │   Frontend    │  │  RainbowKit   │  │   Client      │           │   │
│  │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘           │   │
│  └──────────┼──────────────────┼──────────────────┼─────────────────────┘   │
└─────────────┼──────────────────┼──────────────────┼─────────────────────────┘
              │ HTTP             │ JSON-RPC         │ WebSocket
              ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SERVICE LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Express.js Backend (apps/api)                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Auth    │ │   Job    │ │ Contract │ │ Dispute  │ │  Real-   │  │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │  time    │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Python FastAPI (apps/ai-service)                  │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │   │
│  │  │  Capability  │ │    Skill     │ │   Profile    │                │   │
│  │  │  Predictor   │ │  Verifier    │ │  Analyzer    │                │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │     IPFS     │  │  Blockchain  │    │
│  │              │  │              │  │   (Pinata)   │  │   (Polygon)  │    │
│  │  - Users     │  │  - Sessions  │  │              │  │              │    │
│  │  - Jobs      │  │  - Cache     │  │  - Files     │  │  - Escrow    │    │
│  │  - Contracts │  │  - Queues    │  │  - Evidence  │  │  - Reviews   │    │
│  │  - Reviews   │  │  - Pub/Sub   │  │  - Portfolio │  │  - Disputes  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Frontend (apps/web)

**Technology**: Next.js 15 with App Router

**Responsibilities**:
- Server-side rendering for SEO
- Client-side interactivity
- Wallet integration
- Real-time updates via Socket.io

**Key Directories**:
```
apps/web/src/
├── app/                 # Pages (App Router)
│   ├── (auth)/         # Auth pages (login, register)
│   ├── (dashboard)/    # Protected dashboard pages
│   └── (public)/       # Public pages (jobs, profiles)
├── components/         # React components
├── lib/               # Utilities, API client, wagmi config
├── hooks/             # Custom React hooks
└── store/             # Zustand state stores
```

**State Management**:
- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand
- **Form State**: React Hook Form

---

### Backend API (apps/api)

**Technology**: Express.js with TypeScript

**Architecture Pattern**: Layered Architecture (MVC-like)

```
Request → Route → Middleware → Controller → Service → Repository (Prisma)
                                              ↓
                                    External Services
                                    (Blockchain, IPFS, AI)
```

**Key Directories**:
```
apps/api/src/
├── config/           # Configuration management
├── controllers/      # Request handlers
├── middleware/       # Auth, validation, error handling
├── routes/          # Route definitions
├── services/        # Business logic
├── validators/      # Zod schemas
├── utils/           # Helper functions
├── jobs/            # Background jobs (BullMQ)
├── socket/          # WebSocket handlers
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

**Middleware Stack**:
```
Request
  ├── CORS
  ├── Rate Limiting
  ├── Body Parser
  ├── Auth (JWT verification)
  ├── Request Validation (Zod)
  ├── Controller
  └── Error Handler
Response
```

---

### AI Service (apps/ai-service)

**Technology**: Python FastAPI

**Responsibilities**:
- Capability prediction for freelancers
- Skill verification through microtasks
- Profile analysis and recommendations

**Key Directories**:
```
apps/ai-service/app/
├── routers/         # API endpoints
├── models/          # ML model classes
├── schemas/         # Pydantic schemas
├── services/        # Business logic
├── ml/              # Training scripts & saved models
│   ├── training/    # Training notebooks/scripts
│   └── trained_models/  # Serialized models (.pkl)
└── main.py          # FastAPI app
```

**ML Pipeline**:
```
Profile Data → Feature Extraction → Model Inference → Capability Score
     │              │                    │                │
     │              ├── Skills           ├── Random       ├── Level
     │              ├── Experience       │   Forest       ├── Confidence
     │              ├── Certifications   │   Classifier   └── Factors
     │              └── Portfolio        │
     │                                   │
     └── Skill Test → Auto-Grading ─────┘
```

---

### Smart Contracts (packages/contracts)

**Technology**: Solidity 0.8.24 + Hardhat

**Contracts**:

| Contract | Purpose |
|----------|---------|
| JobEscrow.sol | Payment escrow management |
| ReputationRegistry.sol | On-chain review storage |
| DisputeResolution.sol | Decentralized arbitration |
| DeTrustFactory.sol | Contract deployment factory |

**Contract Interactions**:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│  JobEscrow  │────▶│   Events    │
│  (wagmi)    │     │             │     │             │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Reputation  │     │   Backend   │
                    │  Registry   │     │  (Indexer)  │
                    └─────────────┘     └─────────────┘
```

---

### Database (packages/database)

**Technology**: PostgreSQL + Prisma ORM

**Schema Design Principles**:
- Normalized for data integrity
- Soft deletes where appropriate
- Audit timestamps on all tables
- Indexes on frequently queried columns

**Key Relationships**:
```
User
 ├── 1:1 FreelancerProfile
 ├── 1:1 ClientProfile
 ├── 1:M Jobs (as client)
 ├── 1:M Proposals (as freelancer)
 ├── 1:M Reviews (as author/subject)
 └── 1:M Messages

Job
 ├── M:M Skills
 ├── 1:M Proposals
 ├── 1:1 Contract
 └── 1:M Milestones

Contract
 └── 1:M Disputes
      └── 1:M DisputeVotes
```

See [Database Schema](database-schema.md) for detailed ERD.

---

## Data Flow Diagrams

### Authentication Flow

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ User   │     │Frontend│     │Backend │     │Database│
└───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘
    │              │              │              │
    │ Click Login  │              │              │
    │─────────────▶│              │              │
    │              │              │              │
    │              │ Get Nonce    │              │
    │              │─────────────▶│              │
    │              │              │              │
    │              │ Return Nonce │              │
    │              │◀─────────────│              │
    │              │              │              │
    │ Sign Message │              │              │
    │◀─────────────│              │              │
    │              │              │              │
    │ Signature    │              │              │
    │─────────────▶│              │              │
    │              │              │              │
    │              │ Verify Sig   │              │
    │              │─────────────▶│              │
    │              │              │ Get/Create   │
    │              │              │    User      │
    │              │              │─────────────▶│
    │              │              │◀─────────────│
    │              │ JWT Token    │              │
    │              │◀─────────────│              │
    │              │              │              │
    │ Authenticated│              │              │
    │◀─────────────│              │              │
```

### Job Creation to Payment Flow

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ Client │ │Frontend│ │Backend │ │Database│ │Blockchain│
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘
    │          │          │          │           │
    │ Create   │          │          │           │
    │   Job    │          │          │           │
    │─────────▶│          │          │           │
    │          │ POST /jobs          │           │
    │          │─────────▶│          │           │
    │          │          │ Save Job │           │
    │          │          │─────────▶│           │
    │          │ Job Created         │           │
    │◀─────────│◀─────────│          │           │
    │          │          │          │           │
    │          │    ... Freelancer Submits Proposal ...
    │          │          │          │           │
    │ Accept   │          │          │           │
    │ Proposal │          │          │           │
    │─────────▶│          │          │           │
    │          │ Create Contract     │           │
    │          │─────────▶│          │           │
    │          │          │          │ Deploy    │
    │          │          │          │ Contract  │
    │          │          │─────────────────────▶│
    │          │          │◀─────────────────────│
    │          │          │ Save     │           │
    │          │          │ Address  │           │
    │          │          │─────────▶│           │
    │          │          │          │           │
    │ Sign Tx  │          │          │           │
    │◀─────────│          │          │           │
    │─────────▶│          │          │           │
    │          │──────────────────────────Fund──▶│
    │          │◀─────────────────────Confirmed──│
    │          │          │          │           │
    │ Funded!  │          │          │           │
    │◀─────────│          │          │           │
```

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────┐
│                    Authentication                        │
├─────────────────────────────────────────────────────────┤
│  Primary: Wallet Signature (SIWE)                       │
│  Secondary: Email + Password + Optional 2FA             │
│  Token: JWT (7-day expiry, refresh on activity)         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Authorization                        │
├─────────────────────────────────────────────────────────┤
│  Role-Based Access Control (RBAC):                      │
│  ├── FREELANCER: Submit proposals, complete work        │
│  ├── CLIENT: Post jobs, fund escrow, approve work       │
│  ├── ADMIN: Platform management, dispute oversight      │
│  └── JUROR: Vote on disputes (trust score > 50)         │
│                                                         │
│  Resource-Based Access:                                 │
│  ├── Job owner can edit/delete job                      │
│  ├── Contract parties can access contract details       │
│  └── Message participants can view conversation         │
└─────────────────────────────────────────────────────────┘
```

### Data Security

| Data Type | Storage | Encryption |
|-----------|---------|------------|
| Passwords | PostgreSQL | bcrypt hash |
| JWT Secrets | Environment | N/A |
| Private Keys | Never stored | User's wallet |
| Files | IPFS | Content-addressed |
| Chat Messages | PostgreSQL | TLS in transit |

---

## Scalability Considerations

### Current Architecture (MVP)

- Single instance of each service
- Local Hardhat for blockchain
- Shared PostgreSQL and Redis

### Production Architecture

```
                    ┌─────────────┐
                    │   Vercel    │
                    │  (Frontend) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   AWS ALB   │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  API Pod 1  │ │  API Pod 2  │ │  API Pod 3  │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           └───────────────┼───────────────┘
                           ▼
    ┌─────────────────────────────────────────────┐
    │              Managed Services               │
    │  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
    │  │   RDS   │  │ ElastiC │  │   Polygon   │ │
    │  │(Postgres)│  │  ache   │  │   Mainnet   │ │
    │  └─────────┘  └─────────┘  └─────────────┘ │
    └─────────────────────────────────────────────┘
```

---

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Error Types                          │
├─────────────────────────────────────────────────────────┤
│  ValidationError    → 400 Bad Request                   │
│  AuthenticationError → 401 Unauthorized                 │
│  AuthorizationError  → 403 Forbidden                    │
│  NotFoundError       → 404 Not Found                    │
│  ConflictError       → 409 Conflict                     │
│  BlockchainError     → 500 + retry logic                │
│  InternalError       → 500 + logging + alert            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Error Response Format                    │
├─────────────────────────────────────────────────────────┤
│  {                                                      │
│    "success": false,                                    │
│    "error": {                                           │
│      "code": "VALIDATION_ERROR",                        │
│      "message": "Human readable message",               │
│      "details": [...],  // Field-level errors           │
│      "requestId": "uuid" // For debugging               │
│    }                                                    │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

| Aspect | Tool | Purpose |
|--------|------|---------|
| Error Tracking | Sentry | Catch & alert on errors |
| Logging | Winston + Logtail | Structured logging |
| Metrics | Prometheus | Performance metrics |
| Tracing | OpenTelemetry | Request tracing |
| Uptime | Better Uptime | Health monitoring |

---

## Related Documentation

- [Database Schema](database-schema.md)
- [API Documentation](../API.md)
- [Smart Contracts](../contracts/README.md)
- [Deployment Guide](../DEPLOYMENT.md)
