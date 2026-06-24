# Module 7 — Admin Dashboard Status

> Last updated: 2026-03-02

## Progress: 90% ✅

---

## Overview

Module 7 implements the **Admin Dashboard** — a comprehensive platform management interface for DeTrust administrators. The admin panel provides real-time analytics, user management, dispute monitoring, flagged account auto-detection, and platform configuration — all accessible only to users with the ADMIN role.

### Key Features
- **Dashboard Home** — 8 KPI cards, area/pie/bar charts, recent activity feed, platform health metrics
- **User Management** — Search, filter by role/status, suspend/activate users
- **Flagged Accounts** — Auto-detection of suspicious activity (SUSPENDED, LOW_TRUST, HIGH_DISPUTE_RATE, MULTIPLE_DISPUTES) with HIGH/MEDIUM/LOW risk levels
- **Job Oversight** — Browse all jobs with status filters, budget info, client details
- **Dispute Monitoring** — Status tabs, quick stats, links to dispute detail/resolution
- **Contract Overview** — Total value tracking, status distribution, individual contract details
- **Analytics & Reports** — Growth trends (line), revenue (area), job pipeline (bar), dispute distribution (pie), platform health gauges
- **Review Oversight** — Aggregate review statistics, rating breakdown
- **Message Overview** — Platform messaging statistics with privacy policy
- **Platform Settings** — View smart contract configuration, business rules, infrastructure

---

## Architecture

### Backend

| Component | File | Purpose |
|---|---|---|
| Service | `apps/api/src/services/admin.service.ts` | Analytics aggregation, user/job management |
| Controller | `apps/api/src/controllers/admin.controller.ts` | Request/response handlers |
| Routes | `apps/api/src/routes/admin.routes.ts` | 7 RESTful admin-only endpoints |
| Middleware | `apps/api/src/middleware/admin.middleware.ts` | `requireAdmin` role guard |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Platform-wide statistics (users, jobs, contracts, disputes, reviews, messages) |
| `GET` | `/api/admin/trends` | Monthly trends for last 6 months (users, jobs, contracts, revenue) |
| `GET` | `/api/admin/activity` | Recent activity feed (latest events across the platform) |
| `GET` | `/api/admin/users` | Paginated user list with search/filter/sort |
| `PATCH` | `/api/admin/users/:userId/status` | Suspend or activate a user |
| `GET` | `/api/admin/jobs` | Paginated job list with search/filter/sort |
| `GET` | `/api/admin/flagged` | Auto-detected flagged accounts with risk levels |

### Frontend

| Page | Route | Description |
|---|---|---|
| Dashboard | `/admin` | Main KPI dashboard with charts and activity |
| Users | `/admin/users` | User management table with actions |
| Flagged | `/admin/flagged` | Flagged accounts with risk levels and actions |
| Jobs | `/admin/jobs` | Job oversight table |
| Disputes | `/admin/disputes` | Dispute monitoring with status tabs |
| Contracts | `/admin/contracts` | Contract overview with value stats |
| Reports | `/admin/reports` | Advanced analytics with multiple chart types |
| Reviews | `/admin/reviews` | Review statistics overview |
| Messages | `/admin/messages` | Message statistics overview |
| Settings | `/admin/settings` | Platform configuration view |

### Key Files

| File | Purpose |
|---|---|
| `apps/web/src/lib/api/admin.ts` | Typed API client for admin endpoints |
| `apps/web/src/hooks/queries/use-admin.ts` | TanStack Query hooks (stats, trends, activity, users, jobs, flagged) |
| `apps/web/src/app/(dashboard)/layout.tsx` | Sidebar navigation (10 admin items) |

---

## UI/UX Features

### Dashboard
- **8 KPI cards** with trend indicators, color-coded gradient icons, hover links
- **Area chart** for 6-month growth trends (users, jobs, contracts)
- **Pie charts** for user distribution and job status breakdown
- **Bar chart** for monthly revenue
- **Activity feed** with type-coded icons and time-ago labels
- **Platform health sidebar** — dispute rate, completion rate, avg rating, active disputes

### Flagged Account Detection
- **Auto-detection rules**: SUSPENDED, LOW_TRUST (< 30), HIGH_DISPUTE_RATE (> 30%), MULTIPLE_DISPUTES (≥ 3)
- **Risk levels**: HIGH (3+ flags or suspended), MEDIUM (2 flags), LOW (1 flag)
- **Risk summary cards** with color-coded counts (red/amber/yellow)
- One-click suspend/activate directly from flagged list
- Links to full user management for detailed investigation

### User Management
- Searchable table with name/email/wallet columns
- Role and status badge filters
- Trust score display with color coding (green > 75, blue > 50, amber < 50)
- Activity counts (contracts, reviews, disputes flagged)
- One-click suspend/activate with confirmation

### Analytics & Reports
- **Line chart** — growth trends across all metrics
- **Area chart** — revenue over time with gradient fill
- **Bar chart** — job pipeline with color-coded status bars
- **Pie chart** — dispute distribution with legend
- **Progress bars** — completion rate, active rate, dispute rate
- **Summary grid** — active users, reviews, messages per month

### Design System
- Consistent with DeTrust emerald-based palette
- Full dark mode support on all pages
- Glass-morphism cards with hover effects
- Responsive grid layouts (1→2→3→4 columns)
- Accessible: keyboard-navigable, proper ARIA labels
- Uses recharts for all charting (consistent with existing review-analytics.tsx)

---

## Business Rules Enforced

1. **All admin routes require `ADMIN` role** — middleware-enforced
2. **Cannot suspend other admins** — service-level check
3. **Admin cannot reverse jury verdicts** — SRS requirement
4. **Reviews are immutable** — admin cannot edit/delete reviews
5. **Messages are private** — admin sees stats only, not content

---

## Remaining Work

| Item | Status | Notes |
|---|---|---|
| Auto-flag accounts | ✅ Done | Risk detection with HIGH/MEDIUM/LOW levels |
| Smart contract parameter config | 🔲 Planned | UI to configure platform fees (on-chain) |
| Export reports to CSV/PDF | 🔲 Planned | Download analytics data |
| Email template management | 🔲 Planned | Configure notification email templates |
| Audit log | 🔲 Planned | Track admin actions |

---

## Dependencies

- `recharts` — Charting library (already installed in apps/web)
- `lucide-react` — Icon library (already installed)
- `@tanstack/react-query` — Data fetching (already installed)
- `sonner` — Toast notifications (already installed)

No new dependencies required.
