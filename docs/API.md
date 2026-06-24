# DeTrust - API Documentation

Complete REST API reference for the DeTrust backend.

**Base URL**: `http://localhost:4000/api`

---

## Authentication

### Authentication Methods

1. **JWT Token** (Header): `Authorization: Bearer <token>`
2. **Wallet Signature** (SIWE): Sign message with wallet

### Get JWT Token

**Wallet Authentication:**
```bash
# 1. Get nonce
GET /auth/wallet/nonce?address=0x...

# 2. Sign message with wallet (frontend)
# Message format: "Sign in to DeTrust\nNonce: {nonce}"

# 3. Verify signature
POST /auth/wallet/verify
{
  "address": "0x...",
  "signature": "0x...",
  "nonce": "..."
}
# Returns: { "token": "jwt...", "user": {...} }
```

**Email Authentication:**
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
# Returns: { "token": "jwt...", "user": {...} }
```

---

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "blockchain": "connected"
  }
}
```

---

### Authentication Routes

#### Register (Email)
```
POST /auth/register
```

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "FREELANCER"
}
```

#### Login (Email)
```
POST /auth/login
```

#### Wallet Nonce
```
GET /auth/wallet/nonce?address={walletAddress}
```

#### Wallet Verify
```
POST /auth/wallet/verify
```

#### Setup 2FA
```
POST /auth/2fa/setup
Authorization: Bearer <token>
```

#### Verify 2FA
```
POST /auth/2fa/verify
```

---

### User Routes

#### Get Current User
```
GET /users/me
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "clx...",
  "email": "user@example.com",
  "walletAddress": "0x...",
  "role": "FREELANCER",
  "freelancerProfile": {
    "title": "Full Stack Developer",
    "trustScore": 85.5,
    "aiCapabilityLevel": "Advanced",
    "skills": [...]
  }
}
```

#### Update Profile
```
PUT /users/me
Authorization: Bearer <token>
```

Request (Freelancer):
```json
{
  "name": "John Doe",
  "freelancerProfile": {
    "title": "Senior Full Stack Developer",
    "bio": "10 years of experience...",
    "hourlyRate": 75,
    "skills": ["React", "Node.js", "Solidity"]
  }
}
```

#### Get User by ID
```
GET /users/:id
```

#### Get User Reviews
```
GET /users/:id/reviews
```

#### Get User Trust Score
```
GET /users/:id/trust-score
```

Response:
```json
{
  "trustScore": 85.5,
  "breakdown": {
    "averageRating": 4.8,
    "completionRate": 0.95,
    "disputeWinRate": 0.8,
    "experienceFactor": 0.7
  },
  "totalJobs": 45,
  "totalReviews": 42
}
```

---

### Job Routes

#### Create Job
```
POST /jobs
Authorization: Bearer <token>
Role: CLIENT
```

Request:
```json
{
  "title": "Build DeFi Dashboard",
  "description": "Looking for experienced developer...",
  "category": "Web Development",
  "budgetType": "FIXED",
  "fixedBudget": 5000,
  "deadline": "2024-03-01",
  "skills": ["React", "Web3", "TypeScript"],
  "milestones": [
    { "title": "Design & Setup", "amount": 1000 },
    { "title": "Core Features", "amount": 2500 },
    { "title": "Testing & Launch", "amount": 1500 }
  ]
}
```

#### List Jobs
```
GET /jobs
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| status | string | OPEN, IN_PROGRESS, etc. |
| category | string | Filter by category |
| skills | string[] | Filter by skills |
| budgetMin | number | Minimum budget |
| budgetMax | number | Maximum budget |
| search | string | Search in title/description |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| sort | string | createdAt, budget, etc. |
| order | string | asc, desc |

#### Get Job Details
```
GET /jobs/:id
```

#### Update Job
```
PUT /jobs/:id
Authorization: Bearer <token>
Role: CLIENT (owner only)
```

#### Delete Job
```
DELETE /jobs/:id
Authorization: Bearer <token>
Role: CLIENT (owner only)
```

---

### Proposal Routes

#### Submit Proposal
```
POST /jobs/:jobId/proposals
Authorization: Bearer <token>
Role: FREELANCER
```

Request:
```json
{
  "coverLetter": "I'm excited to work on this project...",
  "proposedRate": 4500,
  "estimatedDuration": "4 weeks"
}
```

#### List Job Proposals
```
GET /jobs/:jobId/proposals
Authorization: Bearer <token>
Role: CLIENT (job owner)
```

#### Get My Proposals
```
GET /proposals/me
Authorization: Bearer <token>
Role: FREELANCER
```

#### Update Proposal
```
PUT /proposals/:id
Authorization: Bearer <token>
```

#### Accept Proposal
```
POST /proposals/:id/accept
Authorization: Bearer <token>
Role: CLIENT
```

#### Reject Proposal
```
POST /proposals/:id/reject
Authorization: Bearer <token>
Role: CLIENT
```

---

### Contract Routes

#### Create Contract
```
POST /contracts
Authorization: Bearer <token>
```

Request:
```json
{
  "jobId": "clx...",
  "proposalId": "clx...",
  "milestones": [
    { "title": "Phase 1", "amount": 1000, "dueDate": "2024-02-01" },
    { "title": "Phase 2", "amount": 2000, "dueDate": "2024-02-15" }
  ]
}
```

Response includes deployed smart contract address.

#### Get Contract
```
GET /contracts/:id
Authorization: Bearer <token>
```

#### Fund Escrow
```
POST /contracts/:id/fund
Authorization: Bearer <token>
Role: CLIENT
```

This endpoint prepares the transaction. Frontend must execute with wallet.

Response:
```json
{
  "transaction": {
    "to": "0x...",
    "data": "0x...",
    "value": "3090000000000000000"
  }
}
```

---

### Milestone Routes

#### Submit Milestone
```
POST /milestones/:id/submit
Authorization: Bearer <token>
Role: FREELANCER
```

Request (multipart/form-data):
```
files: [File, File, ...]
message: "Completed phase 1, please review..."
```

#### Request Revision
```
POST /milestones/:id/revision
Authorization: Bearer <token>
Role: CLIENT
```

Request:
```json
{
  "feedback": "Please update the header design..."
}
```

#### Approve Milestone
```
POST /milestones/:id/approve
Authorization: Bearer <token>
Role: CLIENT
```

Response includes transaction data for payment release.

---

### Review Routes

#### Submit Review
```
POST /reviews
Authorization: Bearer <token>
```

Request:
```json
{
  "jobId": "clx...",
  "subjectId": "clx...",
  "overallRating": 5,
  "communicationRating": 5,
  "qualityRating": 4,
  "timelinessRating": 5,
  "comment": "Excellent work! Highly recommended."
}
```

#### Get Reviews for User
```
GET /users/:id/reviews
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| role | string | as_client, as_freelancer |
| page | number | Page number |
| limit | number | Items per page |

---

### Dispute Routes

#### Open Dispute
```
POST /disputes
Authorization: Bearer <token>
```

Request:
```json
{
  "contractId": "clx...",
  "reason": "Work not delivered as specified",
  "description": "The freelancer delivered...",
  "evidence": ["ipfs://Qm...", "ipfs://Qm..."]
}
```

#### Get Dispute
```
GET /disputes/:id
Authorization: Bearer <token>
```

#### Submit Evidence
```
POST /disputes/:id/evidence
Authorization: Bearer <token>
```

Request (multipart/form-data):
```
files: [File, File, ...]
description: "Screenshot showing..."
```

#### Cast Vote (Juror Only)
```
POST /disputes/:id/vote
Authorization: Bearer <token>
Role: Must have trust score > 50
```

Request:
```json
{
  "vote": "CLIENT_WINS",
  "reasoning": "Based on the evidence provided..."
}
```

#### Get Dispute Votes
```
GET /disputes/:id/votes
Authorization: Bearer <token>
```

---

### Skill Routes

#### List Skills
```
GET /skills
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| category | string | Filter by category |
| search | string | Search skill name |

#### Get Skill Tests
```
GET /skills/:id/tests
Authorization: Bearer <token>
```

#### Submit Skill Test
```
POST /skills/:id/verify
Authorization: Bearer <token>
```

Request:
```json
{
  "answers": {
    "q1": "A",
    "q2": "C",
    "q3": "B"
  },
  "timeTaken": 245
}
```

---

### Message Routes

#### Get Conversations
```
GET /messages/conversations
Authorization: Bearer <token>
```

#### Get Messages
```
GET /messages/:conversationId
Authorization: Bearer <token>
```

#### Send Message
```
POST /messages
Authorization: Bearer <token>
```

Request:
```json
{
  "receiverId": "clx...",
  "jobId": "clx...",
  "content": "Hello, I have a question...",
  "attachments": ["ipfs://Qm..."]
}
```

---

### Notification Routes

#### Get Notifications
```
GET /notifications
Authorization: Bearer <token>
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| unread | boolean | Filter unread only |
| type | string | Filter by type |
| page | number | Page number |
| limit | number | Items per page |

#### Mark as Read
```
PUT /notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```
PUT /notifications/read-all
Authorization: Bearer <token>
```

---

### AI Routes (Proxy to AI Service)

#### Predict Capability
```
POST /ai/predict-capability
Authorization: Bearer <token>
```

Request:
```json
{
  "skills": ["Python", "Machine Learning"],
  "experienceYears": 3,
  "certifications": ["AWS Certified"],
  "portfolioItems": 5,
  "education": "Bachelor's in CS"
}
```

Response:
```json
{
  "capabilityLevel": "Advanced",
  "confidenceScore": 0.85,
  "overallScore": 72,
  "skillScores": {
    "Python": 4.0,
    "Machine Learning": 5.0
  },
  "recommendations": [
    "Consider getting Docker certification",
    "Add more portfolio projects"
  ]
}
```

#### Analyze Profile
```
POST /ai/analyze-profile
Authorization: Bearer <token>
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 requests/minute |
| General API | 100 requests/minute |
| File Upload | 10 requests/minute |

---

## Pagination

All list endpoints support pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```
