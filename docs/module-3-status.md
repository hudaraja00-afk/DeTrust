# Module 3 (Review & Feedback System) Audit

**Updated:** 2026-03-03

This document tracks how the current implementation maps to the SRS requirements in Section 1.7.3 (FE-1 – FE-5), along with gaps, integration status, and improvements applied across the module.

## SRS Feature Status

| SRS ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| **FE-1** | Interface for clients to submit ratings and textual comments | ✅ **Complete** | `ReviewForm` component with 4-category star ratings (Communication, Quality, Timeliness, Professionalism), 10–2000 char comment, Zod validation, 0.5-increment ratings |
| **FE-2** | Interface for freelancers to submit "Job Clarity" rating | ✅ **Complete** | Role-aware labels via `review-utils.ts`: freelancer→client uses Communication, Job Clarity, Payment Promptness, Responsiveness |
| **FE-3** | Smart contract integration to store feedback hashes on blockchain (IPFS content) | ✅ **Complete** | `ipfsService.uploadJSON()` → `blockchainService.recordFeedback()` → DB update. Wired in `reviewService.submitReview()` as async non-blocking pipeline with background retry job |
| **FE-4** | Public display of aggregated ratings and individual reviews | ✅ **Complete** | `ReviewSummaryCard` on profiles (talent/[id], clients/[id]), `ReviewList` with author info, rating distribution chart, category averages |
| **FE-5** | Mechanism to view feedback history for specific jobs | ✅ **Complete** | `GET /api/reviews/contract/:contractId` endpoint, `useContractReviews` hook, reviews displayed on contract detail pages |

## Functional Requirement Compliance

| FR ID | Requirement | Status | Implementation |
|-------|-------------|--------|----------------|
| FR-J7.1 | One review per party per contract | ✅ | `@@unique([contractId, authorId])` constraint in Prisma, duplicate check in service |
| FR-J7.2 | Double-blind reviews (14-day window) | ✅ | `DOUBLE_BLIND_WINDOW_MS = 14 days`, reviews hidden until both submit or window expires. Batch N+1 prevention for counterpart lookups |
| FR-J7.3 | Reviews immutable after submission | ✅ | No update/delete endpoints exist, UI displays immutability notice. One-time immutable rebuttal via `submitResponse()` |
| FR-J7.4 | Review notification to subject | ✅ | `REVIEW_RECEIVED` notification sent via `notificationService` with contract title and rating |
| FR-J7.5 | Trust score recalculation after review | ✅ | `trustScoreService.getTrustScoreBreakdown()` called for both parties after each review submission |
| FR-J7.6 | Aggregated review summary endpoint | ✅ | `GET /api/reviews/user/:userId/summary` with rating distribution + category averages |
| FR-J7.7 | IPFS content storage | ✅ | `ipfs.service.ts` (90 lines) — Pinata IPFS upload with SHA-256 content hash fallback when Pinata not configured. Called async from `submitReview()` |
| FR-J7.8 | On-chain hash via ReputationRegistry | ✅ | `blockchain.service.ts` (126 lines) — Relayer pattern using `RELAYER_PRIVATE_KEY` env var, calls `ReputationRegistry.recordFeedback()` with bytes32-hashed contractId and contentHash. Graceful degradation when not configured |

## Backend Architecture

### API Routes (`apps/api/src/routes/review.routes.ts` — 27 lines)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reviews` | ✅ Required | Submit review (Zod body validation) |
| GET | `/api/reviews/contract/:contractId` | Optional | Get reviews for contract (double-blind) |
| GET | `/api/reviews/contract/:contractId/status` | ✅ Required | Check if user reviewed contract |
| GET | `/api/reviews/user/:userId` | Optional | Get user's reviews with pagination, filtering, search |
| GET | `/api/reviews/user/:userId/summary` | Optional | Get aggregated review stats |
| POST | `/api/reviews/:reviewId/response` | ✅ Required | Submit one-time rebuttal (Zod body validation) |

### Admin Review Routes (`apps/api/src/routes/admin.routes.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/reviews` | ✅ Admin | List all reviews with search, rating filter, date range, blockchain status, pagination |

### Service Layer (`apps/api/src/services/review.service.ts` — 432 lines)

- **`submitReview()`** — Creates review in DB → async IPFS upload + blockchain recording → updates profile stats → recalculates trust scores for both parties → sends notification
- **`getUserReviews()`** — Paginated query with double-blind filter (batch counterpart lookup to avoid N+1), rating range filter, comment search, sort options
- **`getContractReviews()`** — Both parties' reviews with double-blind rules
- **`getReviewSummary()`** — Aggregate ratings + 5-star distribution + category averages
- **`hasReviewed()`** — Boolean check for existing review
- **`submitResponse()`** — One-time immutable rebuttal (only review subject can respond, cannot be edited)
- **`uploadToIpfsAndBlockchain()`** — Private async pipeline: IPFS upload → blockchain recordFeedback → DB update with hashes

### IPFS Service (`apps/api/src/services/ipfs.service.ts` — 90 lines)

- Pinata IPFS JSON upload via `pinJSONToIPFS` API
- SHA-256 fallback (`sha256:...` prefix) when Pinata not configured or upload fails
- `getGatewayUrl()` for constructing IPFS gateway URLs
- Never throws — always returns a hash

### Blockchain Service (`apps/api/src/services/blockchain.service.ts` — 126 lines)

- Relayer pattern — backend wallet (`RELAYER_PRIVATE_KEY`) signs transactions
- Lazy-initializes ethers.Contract with ReputationRegistry ABI
- `recordFeedback()` — hashes contractId and contentHash to bytes32, calls contract, returns tx hash
- `getFeedbackCount()` — reads on-chain feedback count for a user address
- Graceful degradation: returns `null` when blockchain not configured

### Background Job (`apps/api/src/jobs/blockchain.job.ts` — 171 lines)

- Runs every **6 hours** via `setInterval` (registered in `server.ts` startup lifecycle)
- `retryIpfsUploads()` — finds reviews with `ipfsHash: null`, retries IPFS upload (batch of 50)
- `retryBlockchainWrites()` — finds reviews with IPFS hash but no tx hash, retries blockchain recording (batch of 50)
- Initial run delayed 60 seconds after startup

### Blockchain Config (`apps/api/src/config/blockchain.ts` — 38 lines)

- `provider` — ethers.JsonRpcProvider for configured RPC URL
- `isBlockchainConfigured()` — checks env vars
- `getContractAddresses()` — reads from `deployments/localhost.json`
- `verifyBlockchainConnection()` — tests RPC connectivity

### Validation (`apps/api/src/validators/review.validator.ts` — 60 lines)

- `ratingSchema`: 1–5 in 0.5 increments
- `createReviewSchema`: contractId required, overall rating required, comment 10–2000 chars (HTML stripped)
- `createReviewResponseSchema`: responseText 10–2000 chars (HTML stripped)
- `getReviewsQuerySchema`: page/limit pagination, role filter (as_client/as_freelancer), rating range, search, sort, order

## Frontend Components

| File | Purpose | Lines |
|------|---------|-------|
| `components/reviews/review-form.tsx` | Review submission form with 4-category star ratings, double-blind notice | ~196 |
| `components/reviews/review-list.tsx` | ReviewCard + ReviewList — author avatar, ratings, comment, blockchain badge, response display + form | ~148 |
| `components/reviews/review-summary.tsx` | Aggregated stats card (avg rating, distribution bars, category averages) | ~98 |
| `components/reviews/star-rating.tsx` | Reusable star component (interactive edit or readonly display, keyboard-accessible) | ~100 |
| `components/reviews/review-response-form.tsx` | Expandable rebuttal form, character count, one-time immutable | ~90 |
| `components/reviews/review-filters.tsx` | Search input, min rating filter, sort options (newest/oldest/highest/lowest) | ~138 |
| `components/reviews/review-analytics.tsx` | Recharts bar charts for category averages + rating distribution | ~115 |
| `components/reviews/index.ts` | Barrel export for all 7 review components | 8 |
| `lib/review-utils.ts` | Role-aware rating label mappings, trust score color thresholds | 32 |
| `lib/api/review.ts` | API client: submitReview, submitResponse, getContractReviews, getReviewStatus, getUserReviews, getReviewSummary | ~120 |
| `hooks/queries/use-reviews.ts` | TanStack Query hooks: useUserReviews, useReviewSummary, useContractReviews, useReviewStatus, useSubmitReview, useSubmitReviewResponse | ~90 |

### Dashboard Reviews Page (`/dashboard/reviews` — 136 lines)

- Header with "Reviews & Feedback" title
- `ReviewSummaryCard` with aggregated stats
- `ReviewAnalytics` charts (category averages + rating distribution)
- 3 tabs: All Reviews / As Freelancer / As Client
- `ReviewFilters` — search, rating filter, sort
- `ReviewList` with response capability
- Immutability notice (blockchain-verified badge)

### Admin Reviews Page (`/admin/reviews`)

- 3 stat cards: Total Reviews, Average Rating, This Month
- Full review table with search, filters (rating, date, blockchain status), pagination
- Expandable row detail with all category ratings, response text, IPFS/blockchain hashes
- Admin bypasses double-blind — sees all reviews for oversight
- Admin cannot edit/delete reviews (immutability preserved per SRS FR-J7.3)

### Profile Integration

- **Freelancer profiles** (`/talent/[id]`): `ReviewSummaryCard` + `ReviewList` with `subjectRole="FREELANCER"`
- **Client profiles** (`/clients/[id]`): `ReviewSummaryCard` + `ReviewList` with `subjectRole="CLIENT"`, review count in trust signals
- **Contract detail** (`/contracts/[id]`): `ReviewForm` (when COMPLETED + not reviewed), `ReviewList` (existing reviews)
- **Dashboard**: ReviewSummaryCard widget when data exists

## Database Schema

```prisma
model Review {
  id                    String    @id @default(cuid())
  contractId            String
  authorId              String
  subjectId             String
  overallRating         Decimal   @db.Decimal(3,2)
  communicationRating   Decimal?  @db.Decimal(3,2)
  qualityRating         Decimal?  @db.Decimal(3,2)
  timelinessRating      Decimal?  @db.Decimal(3,2)
  professionalismRating Decimal?  @db.Decimal(3,2)
  comment               String?   @db.Text
  responseText          String?   @db.Text
  responseAt            DateTime?
  ipfsHash              String?
  blockchainTxHash      String?
  isPublic              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  contract  Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  author    User     @relation("ReviewAuthor", fields: [authorId], references: [id])
  subject   User     @relation("ReviewSubject", fields: [subjectId], references: [id])

  @@unique([contractId, authorId])
  @@index([subjectId])
  @@index([overallRating])
}
```

## Smart Contract Integration

### ReputationRegistry.sol (deployed — 86 lines)

```solidity
function recordFeedback(
    bytes32 jobId,
    address reviewed,
    bytes32 contentHash,
    uint8 rating   // 1-5
) external whenNotPaused
```

- **Deployed at:** `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` (Hardhat local, chain 31337)
- **Events:** `FeedbackRecorded(bytes32 indexed jobId, address indexed reviewer, address indexed reviewed, bytes32 contentHash, uint8 rating)`
- **Validations:** jobId != 0, reviewed != address(0), no self-review, rating 1-5, duplicate prevention via `feedbackSubmitted[jobId][sender]`
- **Backend integration:** ✅ Wired — `blockchainService.recordFeedback()` calls contract via relayer pattern, hashing contractId and contentHash to bytes32 via `ethers.keccak256`
- **Test coverage:** ✅ 13 tests covering happy path, duplicate prevention, input validation, pause/unpause, access control

## Identified Gaps (Remaining)

| # | Gap | Severity | Status |
|---|-----|----------|--------|
| 1 | `review.service.ts` is 432 lines (limit: 200) | **LOW** | Split into sub-services in future refactor PR |
| 2 | `reviews/page.tsx` is 136 lines (limit: 80) | **LOW** | Extract sub-components in future refactor PR |
| 3 | `review.controller.ts` is 124 lines (limit: 80) | **LOW** | Acceptable — thin controller, all logic in service |
| 4 | Background job uses `setInterval` instead of BullMQ | **LOW** | Migrate to BullMQ for retry backoff + distributed safety in future PR |
| 5 | StarRating UI only supports integer clicks (backend allows 0.5) | **LOW** | Minor UX gap — users can't select 4.5 via UI |
| 6 | No `loading.tsx` / `error.tsx` for `/dashboard/reviews/` route | **LOW** | Add Next.js boundary files |

## Build Status

**Last verified:** 2026-03-03 — Full end-to-end implementation verified. All 26 files audited: 25 COMPLETE, 1 PARTIAL (admin reviews page — now rebuilt with full table).

## Implementation Plan (Remaining Items)

All items below were implemented in the 2026-03-03 audit cycle:

- [x] **A.** Corrected module-3-status.md — fixed 6 inaccurate entries (IPFS, blockchain, job were marked as empty/missing but are fully implemented)
- [x] **B.** Added admin review list/filter backend — `GET /api/admin/reviews` with search, rating, date, blockchain status filters
- [x] **C.** Rebuilt admin reviews frontend — stat cards + filter bar + paginated review table with expandable detail
- [x] **D.** Fixed query validation bug — `getUserReviews` route now uses `validateQuery(getReviewsQuerySchema)` middleware
- [x] **E.** Fixed double-blind pagination bug — `total` count now reflects post-filter results
- [x] **F.** Added ReputationRegistry smart contract tests — 13 tests covering all functions and edge cases
