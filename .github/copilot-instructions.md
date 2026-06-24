# DeTrust — GitHub Copilot Project Instructions

> Auto-loaded for every Copilot session. Single source of truth for AI agent behaviour.
> Key docs: `docs/CONTEXT.md` · `docs/srs.md` · `docs/API.md` · `docs/MCP_PLAYBOOK.md`

---

## 1. Project Identity

**DeTrust** — Decentralized Freelance Marketplace  
FYP · COMSATS University · 2022–2026 · Authors: Haseeb Ahmad Khalil + Noor-Ul-Huda

| Pillar | What it means |
|---|---|
| Trustless payments | Smart contract escrow; funds only release on client approval |
| Transparent reputation | On-chain trust scores — immutable, auditable, portable |
| Fair start | AI capability scoring eliminates the "cold-start" problem |
| Low fees | 1–3% vs 15–20% on Upwork/Fiverr |
| Fast justice | Community arbitration (7 days) vs platform mediation (weeks) |

**Four user types:** Freelancer · Client · Admin · Juror (eligibility: trust score > 50)

---

## 2. Exact Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router · TypeScript strict · Tailwind CSS v3 · shadcn/ui · wagmi v2 · RainbowKit · Zustand · TanStack Query v5 · React Hook Form |
| Backend | Node.js 20 · Express · TypeScript strict · Prisma ORM · PostgreSQL · Redis · Socket.io · BullMQ |
| AI Service | Python 3.11 · FastAPI · Pydantic v2 · scikit-learn · pandas |
| Blockchain | Solidity 0.8.x · Hardhat · OpenZeppelin · Polygon/Hardhat local (chain 31337) |
| Infra | Docker · docker-compose · pnpm workspaces · Turborepo |

---

## 3. Repository Layout

```
apps/web/src/
  app/(auth)/          → login/ · register/ · verify-2fa/ · forgot-password/ (M-A1–M-A5)
  app/(dashboard)/     → dashboard/ · profile/ · jobs/ · proposals/ · contracts/ · payments/
                          messages/ · notifications/ · settings/ · talent/
                          admin/ · client/ · freelancer/
  app/(public)/        → jobs/ · profile/ · disputes/
  app/layout.tsx       → root layout (providers, fonts)
  app/page.tsx         → landing page
  components/          → reusable shadcn/ui-based components
  hooks/               → custom hooks (use-job-escrow.ts, use-safe-account.ts, use-secure-object-url.ts)
  lib/                 → api/ · wagmi/ · utils/ · validators/ · env.ts · profile-utils.ts · secure-files.ts
  store/               → Zustand stores (auth.store.ts, index.ts)

apps/api/src/
  controllers/         → request handlers
  services/            → business logic (jobService, trustScoreService…)
  validators/          → Zod schemas (input validation)
  routes/              → route registration
  middleware/          → auth JWT, rate limit, error handler
  socket/              → Socket.io real-time events
  jobs/                → BullMQ background jobs

apps/ai-service/app/
  routers/             → FastAPI route definitions
  schemas/             → Pydantic v2 models
  services/            → ML business logic
  ml/                  → model files loaded via singleton (never at import time)

packages/contracts/
  contracts/core/      → JobEscrow.sol · ReputationRegistry.sol · DisputeResolution.sol
  test/                → Hardhat + ethers.js v6 tests
  deployments/         → localhost.json, latest.json (contract addresses)

packages/database/prisma/   → schema.prisma + migrations
packages/types/src/         → shared TypeScript interfaces (api + web)
packages/config/            → shared ESLint, Tailwind, tsconfig
```

---

## 4. All 8 Modules at a Glance

| # | Module | SRS Mockups | Build Status |
|---|---|---|---|
| 1 | Auth & Web App | M-A1–A5, M-C1–C5, M-P1–P1.1 | ⚠️ Partial |
| 2 | Smart Contract Job Board | M-J1–J6 | ❌ Not started |
| 3 | Review & Feedback | M-J7 | ❌ Not started |
| 4 | Trust Scoring | (dashboard widgets) | ❌ Not started |
| 5 | Dispute Resolution | M-P2, M-P3 | ❌ Not started |
| 6 | AI Capability Prediction | M-P4–P7 | ❌ Not started |
| 7 | Admin Dashboard | M-S1 | ❌ Not started |
| 8 | Notifications & Chat | M-S2–S4 | ⚠️ Partial |

---

## 5. Module 1 — Current Gaps (priority)

| SRS ID | Feature | Status | Fix needed |
|---|---|---|---|
| FE-1 | Wallet login (SIWE + RainbowKit) | ⚠️ Partial | Make MetaMask injected connector first in wagmi config |
| FE-2 | Role selection onboarding | ✅ Complete | — |
| FE-3 | Profile creation/editing | ❌ Missing | Build freelancer + client forms at `/dashboard/profile` |
| FE-4 | Dashboard with live data | ⚠️ Partial | Wire widgets to `/api/jobs`, `/api/contracts`, `/api/notifications` |

---

## 6. Non-Negotiable Business Rules

1. **Escrow flow**: CLIENT funds escrow → FREELANCER submits milestone → CLIENT approves → smart contract auto-releases payment. Dispute freezes funds.
2. **Freelancer trust score**: `(0.4 × AvgRating) + (0.3 × CompletionRate) + (0.2 × DisputeWinRate) + (0.1 × Experience)`
3. **Client trust score**: `(0.4 × AvgRating) + (0.3 × PaymentPunctuality) + (0.2 × HireRate) + (0.1 × JobClarityRating)`
4. **Juror eligibility**: Trust score **> 50**. Must have zero prior work history with either dispute party.
5. **AI capability levels**: Beginner (0–34) · Intermediate (35–59) · Advanced (60–79) · Expert (80–100)
6. **Platform fee**: **1–3%** only. Smart contract enforces `MAX_PLATFORM_FEE = 10` as hard ceiling.
7. **Reviews are immutable**: Hash stored on-chain via `ReputationRegistry.sol` — never editable.
8. **File storage**: All portfolio items, dispute evidence, deliverables → IPFS. Only hash stored in Postgres.
9. **Non-custodial**: Private keys never touched by app. All tx signing goes through user wallet via wagmi.
10. **Profile gate**: Freelancer profile must be ≥ 70% complete to submit proposals.
11. **Double-blind reviews**: Neither party sees the other's review until both submit OR 14-day window closes.
12. **Skill test cooldown**: One attempt per skill per 30 days.
13. **Auto-approve**: Client has 7 days to review a submitted milestone; no action = auto-approved.
14. **Juror vote weight**: Weighted by the juror's trust score — higher score = more voting power.
15. **Admin cannot overturn jury**: Admin can suspend abusive users but cannot reverse a jury verdict.

---

## 7. Coding Standards

### Universal
- **Smallest safe change** — never refactor unrelated code alongside a feature
- Check `docs/CONTEXT.md` + `docs/srs.md` for business rules before any feature implementation
- API response shape always: `{ data, meta?, error? }` — no exceptions
- Validate with targeted build/test step after every change

### TypeScript — apps/web + apps/api
- `"strict": true` in all tsconfigs
- Named exports only for utilities/hooks/services — no default exports for these
- **Never import `@prisma/client` directly in `apps/api`** — always use `packages/database/src`
- Zod schemas in `apps/api/src/validators/` for all API input
- React Hook Form + Zod for all frontend forms
- Shared types in `packages/types/src/` — never duplicate

### React / Next.js — apps/web
- **Server Components by default** — add `"use client"` only when needed (event handlers, hooks, wagmi)
- App Router conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- **Tailwind utility classes only** — no inline `style={}` except for genuinely dynamic values
- **Never use `window.ethereum` directly** — always wagmi v2 hooks (`useAccount`, `useWriteContract`, `useReadContract`)
- **RainbowKit injected wallets (MetaMask) must be first** in the wagmi connector list
- **Never `next/dynamic` with `{ssr: false}` in a Server Component** — extract to a dedicated Client Component
- shadcn/ui for all UI primitives — check for existing component before building custom
- TanStack Query for server state; Zustand for client state
- Every interactive element: keyboard-accessible, visible focus ring (WCAG 2.2 AA minimum)

### Python — apps/ai-service
- Type annotations on every function signature
- `async def` for route handlers; `def` for pure CPU-bound ML only
- **Never load ML models at import time** — singleton loader pattern in `app/ml/`
- Pydantic v2 models in `app/schemas/` — use `model_validator` (not deprecated `validator`)

### Smart contracts — packages/contracts
- Always inherit from OpenZeppelin base contracts
- Every state-changing function emits a named event
- Tests with Hardhat + ethers.js v6 before any deployment
- Never store sensitive data on-chain — IPFS hash only

### Code Splitting & File Size — ALL layers

No file should grow indefinitely. Apply these hard limits and split aggressively:

**Hard limits**
| File type | Max lines | Split trigger |
|---|---|---|
| React page (`page.tsx`) | 80 lines | Extract sections to sub-components |
| React component | 150 lines | Extract child components, custom hooks |
| Express controller | 80 lines | Move logic to service layer |
| Service file (`*.service.ts`) | 200 lines | Split by domain responsibility |
| Custom hook (`use*.ts`) | 80 lines | Split into smaller focused hooks |
| Utility file (`*.utils.ts`) | 100 lines | Group by concern into separate util files |
| Python router (`*.py`) | 100 lines | Extract to service / helper modules |
| Solidity contract (`.sol`) | 300 lines | Extract libraries or base contracts |

**How to split — by layer**

*Frontend (`apps/web`)*
```
feature/
  components/          ← dumb presentational pieces (< 150 lines each)
    FeatureCard.tsx
    FeatureList.tsx
  hooks/               ← one concern per hook
    useFeatureData.ts  ← data fetching
    useFeatureForm.ts  ← form state
  utils/               ← pure helper functions
    featureHelpers.ts
  types.ts             ← local types if not shared
  index.ts             ← barrel export only
```

*Backend (`apps/api`)*
```
feature/
  feature.controller.ts   ← request/response only, delegates everything
  feature.service.ts      ← core business logic
  feature.validator.ts    ← zod schemas
  feature.types.ts        ← local interfaces
```

*AI service (`apps/ai-service`)*
```
feature/
  router.py      ← route definitions only
  service.py     ← business logic
  schema.py      ← pydantic models
  helpers.py     ← pure functions
```

  *Smart contracts (`packages/contracts`)*
```
contracts/
  JobEscrow.sol          ← core escrow logic
  ReputationRegistry.sol  ← trust score management  
  DisputeResolution.sol   ← juror voting, dispute flow
```
  

**Rules**
- If you need to scroll more than one screen to read a file → split it
- One exported concept per file (one component, one hook, one service class)
- Never put multiple React components in one file unless they are tiny + private to that file
- Co-locate feature code; only truly shared code goes in `components/ui/` or `lib/`
- Barrel exports (`index.ts`) allowed only at feature boundary — not inside

---

## 8. UI/UX Standards for DeTrust

### Design System
- **Font**: Inter · **Icons**: lucide-react
- **Trust palette**: Green `#22c55e` (score > 75), Blue `#3b82f6` (50–75), Yellow `#eab308` (< 50), Red `#ef4444` (disputes/errors only)
- **Dark mode**: Tailwind `dark:` variant from the start on every component

### DeTrust-specific component patterns

**Trust Score Badge** — appears on all profiles and job listings:
```tsx
// Always color-coded; never hideable by user (SRS FR-P1.1)
<TrustScoreBadge score={85.5} size="lg" showBreakdown />
```

**AI Capability Badge** — freelancer profiles only (SRS FR-P4.1, FR-P4.2):
```tsx
// Must include tooltip explaining AI-estimated nature
<AICapabilityBadge level="Advanced" score={72} withTooltip />
```

**Wallet + Transaction States** — all blockchain interactions must show 3 states (SRS USE-3):
1. "Sign in wallet" (waiting for user to sign)
2. "Processing..." with spinner + block confirmations
3. "Confirmed ✓" with tx hash link to explorer

**IPFS Upload** — file uploads (evidence, deliverables, portfolio):
- Progress bar during upload
- Show truncated IPFS hash when complete
- Max 5 files, 25MB each (SRS FR-P2.2)

**Notifications** — non-intrusive toasts for success/info (SRS UI-4):
- Use shadcn/ui `toast` for routine updates
- Use `AlertDialog` modal ONLY for critical/destructive: fund escrow, open dispute, approve payment

> For full SRS mockup → route mapping, see [docs/srs.md](docs/srs.md) section 2.1 — Table 4.

---

## 9. Agent & Instruction Auto-Selection Protocol

For every prompt, detect area by keywords and **automatically apply** the matching instructions and invoke the best agent:

| Keywords | Instructions (auto-applied) | Agent |
|---|---|---|
| component, page, tailwind, dashboard, UI, CSS, shadcn | `nextjs` · `nextjs-tailwind` · `reactjs` · `a11y` · `tanstack-start-shadcn-tailwind` · `html-css-style-color-guide` · `performance-optimization` | `@expert-nextjs-developer` |
| UX, wireframe, user journey, design, mockup, layout | `a11y` · `html-css-style-color-guide` · `nextjs-tailwind` | `@se-ux-ui-designer` |
| route, controller, service, validator, API, express | `typescript-5-es2022` · `containerization-docker-best-practices` · `security-and-owasp` | `@principal-software-engineer` |
| fastapi, model, pydantic, scikit, ML, pandas, AI | `python` | (use directly) |
| prisma, migration, query, postgres, schema, database | `typescript-5-es2022` | `@postgresql-dba` |
| jest, playwright, e2e, test, spec, unit | `playwright-typescript` | `@tdd-red` → `@tdd-green` → `@tdd-refactor` |
| solidity, hardhat, escrow, contract, blockchain | (use docs/contracts/README.md directly) | `@se-security-reviewer` |
| docker, CI, deploy, compose, pipeline, workflow | `containerization-docker-best-practices` · `devops-core-principles` · `github-actions-ci-cd-best-practices` | `@se-gitops-ci-specialist` |
| review, audit, security, owasp, vulnerability | `code-review-generic` · `security-and-owasp` | `@se-security-reviewer` |
| slow, performance, LCP, cache, optimize, latency | `performance-optimization` | `@principal-software-engineer` |
| refactor, clean up, simplify, extract | `code-review-generic` (load refactor skill) | `@principal-software-engineer` |
| full feature, planning, blueprint, architecture | — | `@blueprint-mode` |

### Layer stacking rules (apply in order when multiple are relevant)

**UI implementation** (component/page/dashboard keywords):
1. `nextjs.instructions.md` — App Router, RSC, routing
2. `nextjs-tailwind.instructions.md` — Tailwind + Next.js patterns
3. `reactjs.instructions.md` — component patterns, hooks
4. `tanstack-start-shadcn-tailwind.instructions.md` — shadcn/ui primitives
5. `html-css-style-color-guide.instructions.md` — colour, spacing
6. `a11y.instructions.md` — WCAG 2.2 AA
7. `performance-optimization.instructions.md` — LCP, CLS, bundle
→ Agent: `@expert-nextjs-developer`

**UI design / critique** (UX/wireframe/mockup/layout keywords):
1. `a11y.instructions.md`
2. `html-css-style-color-guide.instructions.md`
3. `nextjs-tailwind.instructions.md`
→ Agent: `@se-ux-ui-designer`

**TypeScript backend** (route/controller/service/API keywords):
1. `typescript-5-es2022.instructions.md`
2. `security-and-owasp.instructions.md`
3. `containerization-docker-best-practices.instructions.md`
→ Agent: `@principal-software-engineer`

**Python AI service** (fastapi/pydantic/model/ML keywords):
1. `python.instructions.md`
→ Agent: (use directly or `@principal-software-engineer`)

**Database / Prisma** (prisma/migration/query/postgres keywords):
1. `typescript-5-es2022.instructions.md`
2. `performance-optimization.instructions.md`
→ Agent: `@postgresql-dba`

**Testing** (jest/playwright/e2e/spec keywords):
1. `playwright-typescript.instructions.md`
→ Agent: `@tdd-red` → `@tdd-green` → `@tdd-refactor`

**Smart contracts** (solidity/hardhat/escrow keywords):
1. `security-and-owasp.instructions.md`
2. Use `docs/contracts/README.md` directly
→ Agent: `@se-security-reviewer`

**DevOps / CI / Docker** (docker/CI/deploy/compose keywords):
1. `containerization-docker-best-practices.instructions.md`
2. `devops-core-principles.instructions.md`
3. `github-actions-ci-cd-best-practices.instructions.md`
→ Agent: `@se-gitops-ci-specialist`

**Security / audit** (review/owasp/vulnerability keywords):
1. `security-and-owasp.instructions.md`
2. `code-review-generic.instructions.md`
→ Agent: `@se-security-reviewer`

**Performance** (slow/LCP/cache/optimize keywords):
1. `performance-optimization.instructions.md`
→ Agent: `@principal-software-engineer`

**Refactor / clean-up**:
1. `code-review-generic.instructions.md`
→ Agent: `@principal-software-engineer` + load `refactor` skill

**Full feature / planning**:
→ Agent: `@blueprint-mode`

**Prompt prefix to reuse:**
> "Use DeTrust MCP auto-selection from docs/MCP_PLAYBOOK.md. Context: docs/CONTEXT.md + docs/srs.md. Announce instruction+agent selection, then implement."

---

## 10. Development Environment

| Command | Purpose |
|---|---|
| `pnpm dev` | Start all apps via Turborepo |
| `docker-compose up -d postgres redis` | Start DB + cache |
| `cd packages/database && pnpm prisma migrate dev` | Run DB migrations |
| `cd packages/contracts && npx hardhat node` | Local blockchain (port 8545) |
| `cd packages/contracts && npx hardhat run scripts/deploy.ts --network localhost` | Deploy contracts |
| `pnpm build` | Production build |
| `pnpm test` | All tests |

**Service ports**: Web `3000` · API `4000` · AI `8000` · Postgres `5432` · Redis `6379` · Hardhat `8545`

---

## 11. Reference Docs

| Doc | Purpose |
|---|---|
| [docs/CONTEXT.md](docs/CONTEXT.md) | Full flows, patterns, DB schema, env vars |
| [docs/srs.md](docs/srs.md) | All 34 mockup FRs, NFRs, business rules |
| [docs/API.md](docs/API.md) | Complete REST API reference |
| [docs/architecture/README.md](docs/architecture/README.md) | Architecture diagrams |
| [docs/architecture/database-schema.md](docs/architecture/database-schema.md) | Prisma table definitions |
| [docs/contracts/README.md](docs/contracts/README.md) | Solidity functions, ABIs, events |
| [docs/module-1-status.md](docs/module-1-status.md) | Current implementation audit |
| [docs/MCP_PLAYBOOK.md](docs/MCP_PLAYBOOK.md) | MCP vs local, full inventory |
| [docs/local-hardhat-env.md](docs/local-hardhat-env.md) | Local blockchain setup |

---

## 12. Installed Instructions Inventory

> Location: `/home/kali/.config/Code/User/instructions/` (16 files)
> Source pool: `/home/kali/Downloads/awesome-copilot-main/instructions/` (170 available)

| File | Scope | Relevance to DeTrust |
|---|---|---|
| `nextjs.instructions.md` | `**/*.tsx, **/*.ts` in web | App Router, RSC, layouts, metadata |
| `nextjs-tailwind.instructions.md` | `apps/web/**` | Tailwind + Next.js component patterns |
| `reactjs.instructions.md` | `**/*.tsx` | Hooks, component design, state |
| `tanstack-start-shadcn-tailwind.instructions.md` | `apps/web/**` | shadcn/ui primitives, TanStack Query |
| `html-css-style-color-guide.instructions.md` | `**/*.html, **/*.css` | 60-30-10 colour rule, accessible palettes |
| `a11y.instructions.md` | `**/*.tsx` | WCAG 2.2 AA — trust score badges, forms |
| `typescript-5-es2022.instructions.md` | `**/*.ts` | Strict TS, named exports, zod patterns |
| `python.instructions.md` | `apps/ai-service/**` | FastAPI, Pydantic v2, async patterns |
| `playwright-typescript.instructions.md` | `**/*.spec.ts` | E2E test generation |
| `security-and-owasp.instructions.md` | `*` | OWASP Top 10 — wallets, escrow, JWT |
| `performance-optimization.instructions.md` | `*` | LCP < 4s (SRS PERF-3), bundle, DB queries |
| `github-actions-ci-cd-best-practices.instructions.md` | `.github/workflows/**` | CI/CD pipelines, secret management |
| `containerization-docker-best-practices.instructions.md` | `Dockerfile, docker-compose*` | Multi-stage builds, compose services |
| `devops-core-principles.instructions.md` | `*` | Deploy strategy, environment management |
| `code-review-generic.instructions.md` | `*` | PR reviews, refactoring guidance |
| `context-engineering.instructions.md` | `*` | AI context window, prompt quality |

always first read  docs/MCP_PLAYBOOK.md 