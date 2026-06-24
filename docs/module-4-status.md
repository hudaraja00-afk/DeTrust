# Module 4 (Trust Scoring Module) Audit

**Updated:** 2026-06-04

This document tracks how the current implementation maps to the SRS requirements in Section 1.7.4 (FE-1 – FE-4), along with gaps, computation logic, and integration status.

## SRS Feature Status

| SRS ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| **FE-1** | Collect performance data for freelancers and clients | ✅ **Complete** | Queries Prisma for avg ratings, completion rates, dispute outcomes, hire rates, payment punctuality, job clarity ratings |
| **FE-2** | Compute rule-based trust score for freelancers | ✅ **Complete** | Formula: `(0.4 × AvgRating) + (0.3 × CompletionRate) + (0.2 × DisputeWinRate) + (0.1 × Experience)`. 5-contract minimum threshold enforced. |
| **FE-3** | Compute rule-based trust score for clients | ✅ **Complete** | Formula: `(0.4 × AvgRating) + (0.3 × PaymentPunctuality) + (0.2 × HireRate) + (0.1 × JobClarityRating)`. 5-contract minimum, cancellation-rate penalty (up to −10), dispute-behaviour penalty (up to −15). |
| **FE-4** | Display real-time trust scores and historical trends on dashboards | ✅ **Complete** | Real-time score + component breakdown displayed; ineligible state shown; historical trends via `TrustScoreHistory` model; WebSocket push via `trust-score:updated` event |

## Trust Score Formulas

### Freelancer Trust Score (0–100)

| Component | Weight | Data Source | Normalization |
|-----------|--------|-------------|---------------|
| Average Rating | 0.4 | `FreelancerProfile.avgRating` (0–5) | `(avgRating / 5) × 100` |
| Completion Rate | 0.3 | Completed contracts / Total contracts | Direct percentage |
| Dispute Win Rate | 0.2 | Won disputes / Total disputes | Default 50 if no disputes |
| Experience | 0.1 | Completed jobs (capped at 50) | `min((completedJobs / 50) × 100, 100)` |

### Client Trust Score (0–100)

| Component | Weight | Data Source | Normalization |
|-----------|--------|-------------|---------------|
| Average Rating | 0.4 | `ClientProfile.avgRating` (0–5) | `(avgRating / 5) × 100` |
| Payment Punctuality | 0.3 | Completed contracts / Total contracts | Direct percentage |
| Hire Rate | 0.2 | Total contracts / Jobs posted | Capped at 100% |
| Job Clarity Rating | 0.1 | Avg `qualityRating` from freelancer reviews | `(clarityRating / 5) × 100` |

## Functional Requirement Compliance

| FR ID | Requirement | Status | Implementation |
|-------|-------------|--------|----------------|
| FR-P1.1 | Trust score always visible on profiles | ✅ | `TrustScoreCard` on talent/[id], clients/[id], dashboard |
| FR-P1.2 | Trust score breakdown available | ✅ | Component-level detail with weights, raw values, normalized values |
| FR-P1.3 | Color-coded trust score display | ✅ | Emerald (>75), Blue (≥50), Amber (>0), Slate (no data) |
| FR-P1.4 | Trust score recalculated on events | ✅ | Recomputed after review submissions (via `reviewService`) |
| FR-P1.5 | Talent search filtering by min trust score | ✅ | `searchFreelancers()` supports `minTrustScore` param |
| FR-P1.6 | Historical trust score trends | ✅ | `TrustScoreHistory` model populated by background job; `getHistory()` service method + API endpoint; frontend WebSocket cache invalidation |
| FR-P1.7 | Background recalculation job | ✅ | `trustScore.job.ts` implements periodic recalc for all freelancers/clients; skips history for ineligible users |

## Backend Architecture

### API Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:id/trust-score` | Public (optional auth) | Returns full `TrustScoreBreakdown` |

### Service Layer (`apps/api/src/services/trustScore.service.ts`)

- **`computeFreelancerTrustScore(userId)`** — Queries contracts, disputes, profile data; enforces 5-contract eligibility gate; computes + persists score; emits WebSocket event
- **`computeClientTrustScore(userId)`** — Queries contracts, jobs, reviews; enforces 5-contract eligibility gate; applies cancellation-rate & dispute-behaviour penalties; computes + persists score; emits WebSocket event
- **`getTrustScoreBreakdown(userId)`** — Auto-detects role (freelancer vs client) and delegates to correct formula
- **`emptyBreakdown()`** — Returns `{ totalScore: null, eligible: false, components: [] }` for users without profiles
- **`getHistory(userId, limit?)`** — Returns paginated trust score history entries from `TrustScoreHistory`

### Response Shape

```typescript
interface TrustScoreBreakdown {
  totalScore: number | null;   // null when ineligible
  eligible: boolean;
  minimumContracts?: number;   // present when ineligible
  currentContracts?: number;   // present when ineligible
  components: Array<{
    label: string;
    weight: number;
    rawValue: number;
    normalizedValue: number;
    weightedValue: number;     // negative for penalty components
  }>;
}
```

### Admin Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/trust-scores` | Admin | Paginated list with filters (role, eligibility, score range, search) |
| PATCH | `/api/admin/trust-scores/:userId` | Admin | Manual adjustment (−100 to +100) with audit reason |

### WebSocket Events

| Event | Room | Payload | Trigger |
|-------|------|---------|---------|
| `trust-score:updated` | `user:{userId}` | `{ userId, breakdown }` | After score recomputation or admin adjustment |

## Frontend Components

| File | Purpose | Lines |
|------|---------|-------|
| `components/trust/trust-score-card.tsx` | Full breakdown display with eligibility gate, colored progress bars, penalty section | ~130 |
| `hooks/queries/use-trust-score.ts` | TanStack Query hook for trust score data | ~20 |
| `lib/trust-color.ts` | Trust score color/label utilities (trust palette) | ~30 |
| `hooks/queries/use-admin.ts` | `useAdminTrustScores()` + `useAdjustTrustScore()` hooks | ~40 |
| `components/admin/admin-trust-score-filters.tsx` | Search, role, eligibility, score-range, sort filters | ~80 |
| `components/admin/admin-trust-score-table.tsx` | Paginated table with expandable rows + adjust button | ~140 |
| `components/admin/admin-adjust-score-dialog.tsx` | Modal with slider, preview, reason textarea | ~120 |
| `app/(dashboard)/admin/trust-scores/page.tsx` | Admin trust score management page | ~150 |

### TrustScoreCard Features

- Large score display (0–100) with dynamic color coding
- **Ineligibility state**: dashed border, ShieldOff icon, N/5 progress bar showing contracts needed
- Component breakdown section showing each metric + weight
- Separate **Penalties** section for negative adjustments (red styling)
- Colored progress bars per component
- Status labels: "Excellent" (>75), "Good" (≥50), "Developing" (>0), "Not Yet Eligible" (ineligible)
- Dark mode support via `dt-*` semantic tokens

### Dashboard Integration

| Page | Display |
|------|---------|
| `/dashboard` | Hero stat showing trust score percentage |
| `/talent/[id]` | Full `TrustScoreCard` with breakdown + highlight stat |
| `/clients/[id]` | Trust score percentage + on-chain review count |

## Database Fields

### FreelancerProfile
```prisma
trustScore        Decimal  @default(0) @db.Decimal(5, 2) // 0-100
aiCapabilityScore Decimal  @default(0) @db.Decimal(5, 2) // 0-100
completedJobs     Int      @default(0)
successRate       Decimal  @default(0) @db.Decimal(5, 2)
avgRating         Decimal  @default(0) @db.Decimal(3, 2)
totalReviews      Int      @default(0)
```

### ClientProfile
```prisma
trustScore      Decimal  @default(0) @db.Decimal(5, 2) // 0-100
hireRate        Decimal  @default(0) @db.Decimal(5, 2)
avgRating       Decimal  @default(0) @db.Decimal(3, 2)
totalReviews    Int      @default(0)
```

## Identified Gaps

| # | Gap | Severity | Recommendation |
|---|-----|----------|----------------|
| 1 | ~~No trust score history tracking~~ | ✅ **Done** | `TrustScoreHistory` model populated by background job; `getHistory()` API available |
| 2 | ~~`trustScore.job.ts` is empty~~ | ✅ **Done** | Background job recalculates all freelancer + client scores; skips history for ineligible users |
| 3 | No trend visualization on frontend | **MEDIUM** | Add line chart showing score over time (data model ready, needs chart component) |
| 4 | ~~Scores only computed on-demand~~ | ✅ **Done** | Proactive recalculation via background job + dispute-triggered recomputation |
| 5 | No blockchain anchoring of trust scores | **LOW** | Future: anchor score hashes on ReputationRegistry for decentralized verification |
| 6 | ~~Juror eligibility not enforced~~ | ✅ **Done** | Trust score >= 50 now enforced in `castVote()` + eligibility API |

## Build Status

**Last verified:** 2026-06-04 — Service layer functional with eligibility gate + client penalties, admin trust score panel operational, WebSocket events wired, background job skips ineligible users, shared types exported from `packages/types`.
