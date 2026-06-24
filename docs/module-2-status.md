# Module 2 (Smart Contract Job Board) Audit

**Updated:** 2026-02-26

This document tracks how the current implementation maps to the SRS requirements in Section 1.7.2 (FE-1 -- FE-4), along with bug fixes, workflow enforcement, and UX improvements applied across the module.

## SRS Feature Status

| SRS ID | Requirement | Status | Notes |
|--------|-------------|--------|-------|
| **FE-1** | Client job posting (description, budget, deadlines, skills) | ✅ **Complete** | Full create + edit pages, draft/publish flow, skill autocomplete, budget/hourly modes, experience levels, deadline picker |
| **FE-2** | Browse, search, filter job listings & submit proposals | ✅ **Complete** | Keyword search, category/type/experience filters, budget range (min/max), sort options (newest, budget high/low, most proposals), 50-word cover letter validation, platform fee breakdown |
| **FE-3** | Escrow lock, fund release, milestone workflow | ✅ **Complete** | Escrow funding gate enforced (backend + frontend), milestone submission only after funding, revision request UI, 7-day auto-approve cron, milestone submission notifications |
| **FE-4** | Visual status tracking with smart contract events | ✅ **Complete** | Milestone timeline visualization (horizontal/vertical), status color coding, WebSocket `contract:status` events for real-time updates, dispute resolution form (replaces browser prompt) |

## Bug Fixes

| Bug | Root Cause | Fix Applied | Files Changed |
|-----|-----------|-------------|---------------|
| Client cannot view freelancer resume/credentials from IPFS (403 Forbidden) | `SecureFileVisibility.PRIVATE` blocked all non-owner access | Changed to `SecureFileVisibility.AUTHENTICATED` for resume and certification uploads | `upload.controller.ts` (lines 129, 181) |
| Freelancer cannot view client profile | No dedicated client profile page existed | Created full client profile page at `/clients/[id]` with backend API | `user.service.ts`, `user.controller.ts`, `user.routes.ts`, `client-profile.ts`, `use-client-profile.ts`, `clients/[id]/page.tsx` |
| Proposal cover letter validated by characters not words | `.min(50)` on string checked char count | Replaced with `.refine()` using `split(/\s+/).filter(Boolean).length >= 50` | `proposal.validator.ts`, `proposal-form.tsx` |
| Dispute raised via browser `prompt()` | No proper UI for dispute submission | Created `DisputeForm` component with reason dropdown + description textarea | `dispute-form.tsx`, `contracts/[id]/page.tsx` |

## Functional Requirement Compliance

| FR ID | Requirement | Status | Implementation |
|-------|-------------|--------|----------------|
| FR-J1.1 | Client creates job listing with title, description, budget | ✅ | `jobs/new/page.tsx` with full form fields |
| FR-J1.2 | Client can edit draft jobs before publishing | ✅ | `jobs/[id]/edit/page.tsx` — owner-only, DRAFT-only guard |
| FR-J2.1 | Freelancers search and filter job listings | ✅ | Budget range (min/max), sort (newest, budget hi/lo, most proposals), category, type, experience |
| FR-J2.2 | Freelancers submit proposals with cover letter | ✅ | 50-word minimum validation, platform fee breakdown |
| FR-J3.1 | Client can view freelancer/talent profiles | ✅ | Resume now viewable (AUTHENTICATED visibility), talent page updated |
| FR-J3.2 | Freelancer can view client profiles | ✅ | Dedicated `/clients/[id]` page with trust score, stats, work history |
| FR-J4.1 | Smart contract escrow locks funds | ✅ | `JobEscrow.sol` with `fundJob()`, `releaseMilestone()`, `raiseDispute()` |
| FR-J4.2 | Platform fee displayed to freelancer | ✅ | Inline fee breakdown (3% platform fee) in proposal form |
| FR-J5.1 | Milestone submission only after escrow funding | ✅ | Backend: `ForbiddenError` when `!fundingTxHash`. Frontend: disabled button + info banner |
| FR-J5.2 | Client can request milestone revision | ✅ | Inline revision form with reason textarea, `REVISION_REQUESTED` status |
| FR-J5.3 | 7-day auto-approve for unreviewed milestones | ✅ | Hourly cron job in `cron.service.ts`, notifications for both parties |
| FR-J6.1 | Real-time contract status updates | ✅ | WebSocket `contract:status` events emitted after each status change, React Query cache invalidation |
| FR-J6.2 | Milestone submission triggers client notification | ✅ | `notificationService.createNotification()` with WebSocket push |

## New Files Created

### Frontend
- `apps/web/src/app/(dashboard)/jobs/[id]/edit/page.tsx` — Job edit page for drafts
- `apps/web/src/app/(dashboard)/jobs/[id]/edit/loading.tsx` — Edit page skeleton
- `apps/web/src/app/(dashboard)/clients/[id]/page.tsx` — Client public profile page
- `apps/web/src/app/(dashboard)/clients/[id]/loading.tsx` — Client profile skeleton
- `apps/web/src/lib/api/client-profile.ts` — Client profile API client
- `apps/web/src/hooks/queries/use-client-profile.ts` — TanStack Query hook for client profile
- `apps/web/src/components/contracts/milestone-timeline.tsx` — Horizontal/vertical milestone pipeline visualization
- `apps/web/src/components/contracts/dispute-form.tsx` — Dispute submission form (replaces browser prompt)

### Backend
- `apps/api/src/services/cron.service.ts` — 7-day auto-approve cron job (hourly interval)

## Files Modified

### Backend
| File | Changes |
|------|---------|
| `apps/api/src/controllers/upload.controller.ts` | Resume + certification visibility: `PRIVATE` → `AUTHENTICATED` |
| `apps/api/src/validators/proposal.validator.ts` | Cover letter: 50-character → 50-word validation via `.refine()` |
| `apps/api/src/services/user.service.ts` | Added `getClientPublicProfile()` method |
| `apps/api/src/controllers/user.controller.ts` | Added `getClientProfile` handler |
| `apps/api/src/routes/user.routes.ts` | Added `GET /users/clients/:id/profile` route |
| `apps/api/src/services/contract.service.ts` | Escrow funding gate, notification service integration, WebSocket events |
| `apps/api/src/server.ts` | Cron job init in `startServer()`, cleanup in `gracefulShutdown()` |

### Frontend
| File | Changes |
|------|---------|
| `apps/web/src/app/(dashboard)/talent/[id]/page.tsx` | "View Resume" button for authenticated users (replaces "Request resume" link) |
| `apps/web/src/components/jobs/proposal-form.tsx` | 50-word validation, word counter, inline platform fee breakdown |
| `apps/web/src/lib/api/contract.ts` | Added `REVISION_REQUESTED` to `MilestoneStatus` union |
| `apps/web/src/components/contracts/constants.ts` | Added `REVISION_REQUESTED` color mapping |
| `apps/web/src/app/(dashboard)/jobs/page.tsx` | Budget range filters (min/max), sort dropdown (newest, budget, proposals) |
| `apps/web/src/lib/api/index.ts` | Added `clientProfileApi` export |
| `apps/web/src/hooks/use-live-notifications.ts` | Added `contract:status` WebSocket event listener with query cache invalidation |
| `apps/web/src/app/(dashboard)/contracts/[id]/page.tsx` | Integrated `MilestoneTimeline`, `DisputeForm`, replaced `prompt()` with form |
| `apps/web/src/components/contracts/milestone-list.tsx` | Escrow funding gate UI, revision request inline form |
| `apps/web/src/components/jobs/job-sidebar.tsx` | Client name links to `/clients/[id]`, "View full profile" link |

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| `AUTHENTICATED` visibility for resumes | Allows any logged-in user (clients browsing talent) to view resumes while keeping files inaccessible to anonymous visitors |
| Word-count validation via `.refine()` | SRS specifies "50 words" not "50 characters"; Zod `.refine()` enables custom validation while keeping the schema composable |
| Inline fee breakdown (not separate component) | Only used in proposal form; avoids premature abstraction per project conventions |
| Hourly cron via `setInterval` | Lightweight; no external scheduler dependency. Suitable for single-instance deployment |
| WebSocket events after DB writes | Ensures consistency — events only fire after successful persistence |
| Dispute form as dedicated component | Replaces browser `prompt()` with proper UX (reason dropdown, description validation, loading state) |

## Milestone Status Flow

```
PENDING → IN_PROGRESS → SUBMITTED → APPROVED → PAID
                            ↓            ↑
                     REVISION_REQUESTED ─┘
                            ↓
                        DISPUTED
```

## Trust Palette (Status Colors)

| Status | Color | Token |
|--------|-------|-------|
| PAID | Green `#22c55e` | `bg-green-500` |
| APPROVED | Emerald `#10b981` | `bg-emerald-500` |
| IN_PROGRESS / SUBMITTED | Blue `#3b82f6` | `bg-blue-500` |
| PENDING | Slate `#94a3b8` | `bg-slate-200` |
| REVISION_REQUESTED | Amber `#f59e0b` | `bg-amber-500` |
| DISPUTED | Red `#ef4444` | `bg-red-500` |

## Build Status

**Last verified:** 2026-02-26 — Pending full build verification
