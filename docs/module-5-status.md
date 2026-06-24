# Module 5: Dispute Resolution — Implementation Status

**Updated:** 2026-07-05

---

## Overview

Module 5 implements a **hybrid admin + community dispute resolution** system with **on-chain payment settlement**. Disputes freeze escrowed funds in `JobEscrow.sol`, and resolution triggers automatic fund distribution (refund, release, or 50/50 split) via the new `resolveDispute()` smart-contract function.

### Architecture

```
User → Create Dispute → OPEN → Evidence Phase (IPFS URLs)
                                 │
                                 ├── Admin resolves directly ─────────────────┐
                                 │   (adminResolve → escrow.resolveDispute)  │
                                 │                                            ▼
                                 └── Admin starts voting → VOTING ──7 days──► Auto-resolve cron
                                     ├── ≥ 3 jurors → tally-based outcome     (dispute.job.ts)
                                     └── < 3 jurors → notify admin for manual  │
                                                                               ▼
                                                              On-Chain Settlement
                                                     (JobEscrow.resolveDispute(jobId, outcome))
                                                              │
                                                    ┌─────────┼─────────┐
                                                    ▼         ▼         ▼
                                               CLIENT_WINS  FREELANCER  SPLIT
                                               (refund all) (release +  (50/50 +
                                                + fee)      platform    fee → client)
                                                            fee paid)
```

---

## SRS Requirements

| SRS ID | Requirement | Status | Implementation Details |
|--------|-------------|--------|----------------------|
| **FE-1** | Dispute launch with evidence upload to IPFS | ✅ **Complete** | `DisputeForm` + `submitEvidence` UI; validator accepts IPFS CIDs |
| **FE-2** | Juror selection based on reputation scores | ✅ **Complete** | Eligibility: trust score > 50, non-party, not already voted; UI banner shows reason |
| **FE-3** | Voting smart contract for juror decisions | ✅ **Complete** | `DisputeResolution.sol` on-chain + backend API + `JobEscrow.resolveDispute()` for fund movement |

---

## Backend Implementation

### Files

| File | Status | Lines | Description |
|------|--------|-------|-------------|
| `apps/api/src/services/dispute.service.ts` | ✅ Complete | ~780 | Core service: create, evidence, IPFS upload, voting, admin resolve (+ on-chain), list/get, eligibility, juror notification |
| `apps/api/src/services/escrow.service.ts` | ✅ Complete | ~170 | On-chain calls to `JobEscrow.resolveDispute()` + `raiseDispute()`; requires `RELAYER_PRIVATE_KEY` |
| `apps/api/src/services/ipfs.service.ts` | ✅ **Fixed** | ~250 | IPFS upload: JSON via Pinata, binary files via Pinata/Lighthouse + SHA-256 fallback. **Fixed**: Lighthouse `form-data` upload uses `form.getBuffer()` + `form.getHeaders()` |
| `apps/api/src/controllers/dispute.controller.ts` | ✅ Updated | ~200 | Express request handlers + file upload handler |
| `apps/api/src/routes/dispute.routes.ts` | ✅ Updated | 42 | RESTful endpoints with auth + validation + evidence file upload |
| `apps/api/src/validators/dispute.validator.ts` | ✅ Updated | ~85 | Zod schemas — IPFS CIDs, outcome/date/search filters |
| `apps/api/src/middleware/upload.middleware.ts` | ✅ Updated | ~120 | Multer: avatar, document, + evidence upload (5 files × 25 MB) |
| `apps/api/src/events/dispute.events.ts` | ✅ Complete | 47 | Socket.IO events for real-time updates (now all wired) |
| `apps/api/src/jobs/dispute.job.ts` | ✅ **New** | ~180 | Hourly cron: auto-resolves expired VOTING disputes |

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/disputes` | User/Admin | List disputes (own for users, all for admin) |
| `GET` | `/api/disputes/:id` | User | Get dispute detail |
| `GET` | `/api/disputes/:id/eligibility` | User | Check juror eligibility (trust > 50, non-party) |
| `POST` | `/api/disputes` | User | Create a new dispute |
| `POST` | `/api/disputes/:id/evidence` | User | Submit additional evidence (URL/CID) |
| `POST` | `/api/disputes/:id/evidence/upload` | User | Upload evidence files to IPFS (multipart, max 5×25 MB) |
| `POST` | `/api/disputes/:id/start-voting` | Admin | Move dispute to VOTING phase |
| `POST` | `/api/disputes/:id/vote` | User/Admin | Cast a weighted vote |
| `POST` | `/api/disputes/:id/resolve` | Admin | Directly resolve + on-chain settlement |

### Dispute Lifecycle

```
OPEN → VOTING → RESOLVED
  │       │          ↑
  │       └── auto-resolve (cron, ≥ 3 jurors) ──┘
  │                  ↑
  └── admin resolve ─┘
```

- **OPEN**: Created; parties submit evidence (IPFS URLs/CIDs); admin reviews
- **VOTING**: 7-day deadline; jurors cast weighted votes (trust-score-based); auto-resolved by cron if deadline expires with ≥ 3 votes
- **RESOLVED**: Outcome determined → `escrowService.resolveDisputeOnChain()` moves funds → `resolutionTxHash` stored

### On-Chain Fund Settlement

| Outcome | Client Receives | Freelancer Receives | Platform Fee | Contract Status |
|---------|----------------|-------------------|-------------|----------------|
| CLIENT_WINS (0) | remaining + platform fee | 0 | Returned to client | CANCELLED |
| FREELANCER_WINS (1) | 0 | remaining | Paid to feeRecipient | COMPLETED (all milestones → PAID) |
| SPLIT (2) | remaining/2 + platform fee | remaining/2 | Returned to client | ACTIVE (back to normal) |

> "Remaining" = `totalAmount - paidAmount` (accounts for milestones already paid before dispute).

### Business Rules Enforced

- Only contract parties can initiate disputes (client or freelancer)
- Disputes only on ACTIVE contracts
- One active dispute per contract at a time
- Contract parties cannot vote on their own dispute
- **Juror eligibility**: Non-admin voters must have trust score >= 50
- Admin has vote weight of 10; users weighted by trust score / 10
- 7-day voting deadline (SRS)
- Admin cannot overturn jury but can resolve directly (hybrid model)
- Auto-resolve cron: if ≥ 3 jurors voted before deadline, outcome is tallied automatically
- If < 3 jurors voted by deadline, admins are notified for manual resolution
- `contractService.raiseDispute()` deprecated — all dispute creation routes through `disputeService`

---

## Frontend Implementation

### Files

| File | Status | Description |
|------|--------|-------------|
| `apps/web/src/app/(dashboard)/disputes/page.tsx` | ✅ Updated | Dispute list with status tabs + **pagination** + link to history |
| `apps/web/src/app/(dashboard)/disputes/[id]/page.tsx` | ✅ **Fixed** | Detail: evidence, voting, admin actions, **IPFS file upload**, **eligibility banner**, **resolution tx hash**. **Fixed**: sha256 evidence shows "unavailable" warning; secure API uploads use authenticated file opener |
| `apps/web/src/app/(dashboard)/disputes/history/page.tsx` | ✅ Complete | Dispute history/archive: resolved disputes with outcome filter, date range, search |
| `apps/web/src/app/(dashboard)/admin/disputes/page.tsx` | ✅ Complete | Admin dispute monitoring dashboard with stats cards and status tabs |
| `apps/web/src/app/(dashboard)/contracts/[id]/page.tsx` | ✅ **Updated** | **New**: Dispute banner shown when contract status is DISPUTED, links to Disputes page |
| `apps/web/src/components/contracts/milestone-list.tsx` | ✅ **Updated** | **New**: Dispute-aware milestone cards (red border, "submissions disabled" warning for DISPUTED contracts) |
| `apps/web/src/app/(dashboard)/payments/page.tsx` | ✅ **Updated** | **New**: Shows dispute transactions (dispute-release, dispute-refund, dispute-split) with Scale icon |
| `apps/web/src/lib/api/dispute.ts` | ✅ Updated | API client module + `uploadEvidence` + enhanced query params |
| `apps/web/src/hooks/queries/use-disputes.ts` | ✅ Updated | TanStack Query hooks: `useJurorEligibility`, `useSubmitEvidence`, `useUploadEvidence` |
| `apps/web/src/components/contracts/dispute-form.tsx` | ✅ Complete | Dispute creation form |

### Pages

- **`/disputes`** — Lists all disputes with status tabs (All, Open, Voting, Resolved) + pagination + **"View History" link**
- **`/disputes/:id`** — Dispute detail page with:
  - Contract info, parties, evidence display
  - Vote tallies and individual vote listing
  - **Juror eligibility banner** (reason shown: party, already voted, low trust, deadline passed)
  - Voting UI for eligible voters during VOTING phase
  - **IPFS file upload** for evidence (drag & drop, max 5 files × 25 MB, uploaded to Pinata/Lighthouse)
  - Admin actions: start voting, direct resolution
  - **Resolution display** with on-chain tx hash and confirmation badge
- **`/disputes/history`** — **NEW**: Archive of resolved disputes with:
  - Outcome filter tabs (All, Client Wins, Freelancer Wins, Split)
  - Date range picker (from/to)
  - Text search (reason/description)
  - Pagination

### UI/UX

- Dark mode: Full support via `dt-*` semantic tokens
- Status badges: Color-coded (yellow=Open, blue=Voting, green=Resolved, red=Appealed)
- Responsive layout on all screen sizes
- Sidebar navigation: "Disputes" added for FREELANCER, CLIENT, and ADMIN roles
- Real-time updates via Socket.IO events

---

## Smart Contracts

### DisputeResolution.sol (pre-existing, unchanged)

On-chain dispute state tracking with juror voting. No fund transfers — purely a governance record.

- Functions: `createDispute()`, `submitEvidence()`, `startVoting()`, `castVote()`, `resolveDispute()`
- Config: `minJurorTrustScore=50`, `votingPeriod=7 days`, `minJurors=3`
- Tests: **42 passing** (`packages/contracts/test/DisputeResolution.test.ts`)

### JobEscrow.sol (modified)

Added `resolveDispute(bytes32 jobId, uint8 outcome)` — the on-chain fund settlement function.

- **New function**: `resolveDispute(jobId, outcome)` — owner-only, nonReentrant
- **New event**: `DisputeResolved(jobId, outcome, clientAmount, freelancerAmount)`
- Handles all 3 outcomes with correct token transfers and accounting
- Tests: **26 passing** (`packages/contracts/test/JobEscrow.test.ts`)

---

## What's Left

| Item | Priority | Details |
|------|----------|---------|
| Production blockchain deploy | LOW | Deploy updated JobEscrow + DisputeResolution to Polygon testnet |
| Old sha256 evidence re-upload | LOW | Parties should re-upload evidence for disputes created before Lighthouse fix; UI shows warning |

### Completed in Sprint 3 (current)

- ✅ **Evidence accessibility fix** — Dispute detail page now handles 3 URL types: (1) `sha256:` hashes show "unavailable — re-upload" warning, (2) `/api/uploads/` URLs use authenticated `openSecureFileInNewTab`, (3) Lighthouse gateway URLs open directly
- ✅ **Milestone submission blocked during dispute** — Frontend shows red banner "Contract Under Dispute" + milestone cards have red border + "submissions disabled" message for DISPUTED contracts (backend already blocked via `status !== 'ACTIVE'` check)
- ✅ **Payment page dispute transactions** — Shows `dispute-release`, `dispute-refund`, `dispute-split` transaction types with Scale icon, correct labels, and amounts
- ✅ **DisputeEvidence model + migration** — New `DisputeEvidence` Prisma model with `uploadedById` for party attribution; migration `202603060001_add_dispute_evidence`
- ✅ **Lighthouse form-data upload fix** — `ipfs.service.ts` now uses `form.getBuffer()` + `form.getHeaders()` for correct multipart upload to Lighthouse
- ✅ **Notification enum fix** — Added `DISPUTE_VOTING` and `MILESTONE_AUTO_APPROVED` to Prisma `NotificationType` enum; migration `202603060002_add_notification_types`
- ✅ **RELAYER_PRIVATE_KEY** — Required for on-chain `resolveDispute()` calls; added to `.env`
- ✅ **FREELANCER_WINS contract status fix** — Contract set to COMPLETED + all non-PAID milestones marked PAID
- ✅ **CLIENT_WINS contract status fix** — Contract set to CANCELLED
- ✅ **Contracts API includes disputes** — `listContracts` now returns associated disputes for payment page display

### Completed in Sprint 2

- ✅ **Evidence IPFS upload** — `ipfsService.uploadFile()` + `uploadFiles()` with Pinata → Lighthouse → SHA-256 fallback chain
- ✅ **Juror auto-notification** — `startVoting()` queries users with trust score ≥ 50, sends `DISPUTE_VOTING` notification to up to 50 eligible jurors
- ✅ **Dispute history/archive** — `/disputes/history` page with outcome filter, date range, text search, pagination
- ✅ Evidence upload route: `POST /api/disputes/:id/evidence/upload` (multipart, max 5 files × 25 MB)
- ✅ Multer evidence middleware (`evidenceUpload`) for multi-file uploads
- ✅ Frontend file upload UI (drag & drop, file list preview, IPFS upload progress)
- ✅ Enhanced list query: `outcome`, `dateFrom`, `dateTo`, `search`, `resolvedAt` sort

### Completed in Sprint 1

- ✅ On-chain fund settlement (`JobEscrow.resolveDispute()`)
- ✅ Backend escrow service (`escrow.service.ts`)
- ✅ Auto-resolve cron job (`dispute.job.ts`)
- ✅ `emitDisputeVotingStarted` now actually called
- ✅ `contractService.raiseDispute()` deprecated → proxied to `disputeService`
- ✅ Juror eligibility wired on detail page with reason banner
- ✅ Submit evidence UI on detail page
- ✅ Pagination on disputes list
- ✅ IPFS CID support in validators
- ✅ Resolution tx hash displayed on frontend
- ✅ Comprehensive Hardhat tests (68 tests passing)

---

## Database Models

### Dispute

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `contractId` | String | FK to Contract |
| `initiatorId` | String | FK to User |
| `reason` | String | Dispute reason |
| `description` | Text | Detailed description |
| `evidence` | String[] | Legacy array of evidence URLs/IPFS hashes |
| `evidenceItems` | DisputeEvidence[] | Structured evidence records with party attribution |
| `status` | DisputeStatus | OPEN, VOTING, RESOLVED, APPEALED |
| `outcome` | DisputeOutcome | PENDING, CLIENT_WINS, FREELANCER_WINS, SPLIT |
| `resolution` | Text? | Admin resolution text |
| `resolutionTxHash` | String? | On-chain transaction hash of fund settlement |
| `clientVotes` | Int | Weighted vote tally for client |
| `freelancerVotes` | Int | Weighted vote tally for freelancer |
| `votingDeadline` | DateTime? | Voting deadline (7 days from start) |
| `resolvedAt` | DateTime? | When dispute was resolved |

### DisputeVote

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `disputeId` | String | FK to Dispute |
| `jurorId` | String | FK to User |
| `vote` | DisputeOutcome | CLIENT_WINS or FREELANCER_WINS |
| `weight` | Int | Vote weight based on trust score |
| `reasoning` | Text? | Optional reasoning |
| `@@unique` | `[disputeId, jurorId]` | One vote per juror per dispute |

### DisputeEvidence (NEW)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (CUID) | Primary key |
| `disputeId` | String | FK to Dispute |
| `uploadedById` | String | FK to User — party who uploaded |
| `url` | String | Gateway URL or `ipfs://sha256:...` fallback |
| `cid` | String? | Real IPFS CID (null for sha256 fallback) |
| `fileName` | String? | Original file name |
| `fileSize` | Int? | File size in bytes |
| `description` | String? | Evidence description |
| `createdAt` | DateTime | Upload timestamp |
