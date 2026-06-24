# DeTrust MCP Playbook

Use this file to guide MCP selection for each prompt in this repository.

## 1) Project Context Baseline

DeTrust is a monorepo with:
- `apps/web`: Next.js 15 + TypeScript + Tailwind + wagmi/RainbowKit
- `apps/api`: Express + TypeScript + Prisma + Redis + Socket.io
- `apps/ai-service`: FastAPI + Python
- `packages/contracts`: Solidity + Hardhat
- `packages/database`: Prisma/Postgres

Primary context docs:
- [docs/CONTEXT.md](docs/CONTEXT.md)
- [docs/SETUP.md](docs/SETUP.md)
- [docs/API.md](docs/API.md)
- [docs/architecture/README.md](docs/architecture/README.md)
- [docs/contracts/README.md](docs/contracts/README.md)

## 2) Installed MCP Inventory (Current) — Ubuntu / Kali Linux

### Awesome MCP
- 42+ collections available (running on Ubuntu)
- Key collections for DeTrust:
  - `frontend-web-dev`
  - `testing-automation`
  - `context-engineering`
  - `copilot-sdk`
  - `database-data-management`
  - `openapi-to-application-python-fastapi`
  - `openapi-to-application-nodejs-nestjs`

### Local Skill Folders — `.claude/skills/`
- Key skills installed: `refactor`, `web-design-reviewer`, `webapp-testing`, `gh-cli`, `git-commit`, `prd`, `polyglot-test-agent`, `microsoft-docs`, `microsoft-code-reference`, `mcp-cli`, `chrome-devtools`, `penpot-uiux-design`, `copilot-sdk`

### VS Code User Instructions — `/home/kali/.config/Code/User/instructions/`
Installed (16 files — hand-picked for DeTrust stack):

**UI / Frontend (7)**
- `nextjs.instructions.md` — App Router, RSC, layouts, metadata
- `nextjs-tailwind.instructions.md` — Tailwind CSS + Next.js patterns
- `reactjs.instructions.md` — Component design, hooks, state
- `tanstack-start-shadcn-tailwind.instructions.md` — shadcn/ui primitives, TanStack Query
- `html-css-style-color-guide.instructions.md` — 60-30-10 colour rule, accessible palettes
- `a11y.instructions.md` — WCAG 2.2 AA accessibility
- `performance-optimization.instructions.md` — LCP, bundle size, DB query perf

**Backend / API (2)**
- `typescript-5-es2022.instructions.md` — Strict TS, named exports, zod patterns
- `python.instructions.md` — FastAPI, Pydantic v2, async ML patterns

**Security (1)**
- `security-and-owasp.instructions.md` — OWASP Top 10, JWT, escrow security

**Testing (1)**
- `playwright-typescript.instructions.md` — E2E test generation

**DevOps / Infra (3)**
- `containerization-docker-best-practices.instructions.md` — Multi-stage Dockerfiles, compose
- `devops-core-principles.instructions.md` — Deploy strategy, environment management
- `github-actions-ci-cd-best-practices.instructions.md` — CI/CD pipelines, secret management

**Meta / Quality (2)**
- `code-review-generic.instructions.md` — PR reviews, refactoring guidance
- `context-engineering.instructions.md` — AI context window quality

> Source: `/home/kali/Downloads/awesome-copilot-main/instructions/` (170 available)
> To install more: `cp /home/kali/Downloads/awesome-copilot-main/instructions/<name>.instructions.md /home/kali/.config/Code/User/instructions/`

### VS Code User Agents/Prompts — `/.github/prompts/`
- 250+ agents and prompts installed
- Key agents for DeTrust: `expert-nextjs-developer`, `expert-react-frontend-engineer`, `principal-software-engineer`, `tdd-red/green/refactor`, `se-security-reviewer`, `postgresql-dba`, `blueprint-mode`, `polyglot-test-generator`

## 3) Default Selection Matrix

### A) UI / Frontend task (`apps/web`)
Use:
1. `nextjs.instructions.md`
2. `nextjs-tailwind.instructions.md`
3. `reactjs.instructions.md`
4. `a11y.instructions.md`
Agent fallback: `expert-react-frontend-engineer.agent.md`

### B) TypeScript backend task (`apps/api`)
Use:
1. `typescript-5-es2022.instructions.md`
2. `copilot-sdk-nodejs.instructions.md` (only when SDK patterns are needed)
3. `containerization-docker-best-practices.instructions.md` (if Docker touched)

### C) Python AI service task (`apps/ai-service`)
Use:
1. `python.instructions.md`
2. `playwright-python.instructions.md` (only for e2e test generation)

### D) DB / Prisma / SQL task
Use:
1. `database-data-management` collection assets
2. `postgresql-optimization.prompt.md` / `postgresql-code-review.prompt.md` as needed

### E) Testing task
Use:
1. `playwright-typescript.instructions.md`
2. `javascript-typescript-jest.prompt.md`
3. TDD agents from `testing-automation` when doing red/green/refactor loops

### F) Contracts task (`packages/contracts`)
Use repo-native docs + tests as primary source:
- [docs/contracts/README.md](docs/contracts/README.md)
- [docs/local-hardhat-env.md](docs/local-hardhat-env.md)
- `packages/contracts/test/*`

Note: current Awesome MCP inventory has no explicit Solidity/Hardhat-focused instruction.

## 4) Per-Prompt Auto-Selection Protocol

For every new user request:

1. Detect target area by paths/keywords:
   - UI keywords (`component`, `page`, `tailwind`, `dashboard`) → Frontend set
   - API keywords (`route`, `controller`, `service`, `validator`) → Backend TS set
   - AI keywords (`fastapi`, `model`, `pydantic`) → Python set
   - DB keywords (`prisma`, `migration`, `query`, `postgres`) → DB set
   - Test keywords (`jest`, `playwright`, `e2e`) → Testing set
   - Contract keywords (`solidity`, `hardhat`, `escrow`) → Contracts rule

2. Announce selected MCP set before coding.

3. Execute task.

4. If scope spans multiple areas, combine sets in this order:
   - Domain rules first (frontend/backend/python/contracts)
   - Then testing rules
   - Then docker/perf rules if needed

## 5) Prompt Prefix You Can Reuse

Use this at the start of any prompt:

> "Use DeTrust MCP auto-selection protocol from docs/MCP_PLAYBOOK.md and [text](../.claude/prompts/suggest-awesome-github-copilot-skills.prompt.md) and [text](../.claude/prompts/suggest-awesome-github-copilot-instructions.prompt.md) and [text](../.claude/prompts/suggest-awesome-github-copilot-agents.prompt.md), choose best skill/rule/agent for this task and not only instruction and agent but also skills as well, announce selection first, then implement."

## 6) MCP vs Local — When to Use Which

| Scenario | Use |
|---|---|
| Looking up API patterns, library docs, examples | **MCP awesome-copilot** (`microsoft-docs`, `context7` skill) |
| Repeatable per-task coding guidance (React, TS, Python) | **Local instructions** in `~/.config/Code/User/instructions/` |
| Complex multi-step tasks (test generation, refactor) | **Local agents** in `~/.config/Code/User/prompts/` |
| Git commits, issue creation, PR workflow | **Local skills** `gh-cli`, `git-commit` in `~/.claude/skills/` |
| UI/UX design review, web testing | **Local skills** `web-design-reviewer`, `webapp-testing` |
| Code review, security | **Agents**: `@se-security-reviewer`, `@gilfoyle` |
| TDD workflow | **Agents**: `@tdd-red` → `@tdd-green` → `@tdd-refactor` |



**Rule of thumb:** Instructions + Skills = always active guardrails. MCP = dynamic look-up when you need fresh external knowledge.

---

## 7) Team Convention

- Keep changes aligned with SRS/module status docs.
- Prefer smallest safe change.
- Validate with targeted test or build step after edits.

