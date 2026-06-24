# Chapter 5 — Testing & Evaluation: Test Runner Guide

> Maps every Chapter 5 table to its implementing test file.
> Use this document to run, verify, and trace test coverage.

---

## Quick Start

```bash
# 1. Smart contract tests (Hardhat + Solidity)
cd packages/contracts && npx hardhat test

# 2. Backend unit + integration tests (Jest)
cd apps/api && pnpm test

# 3. Frontend unit tests (run from web app)
cd apps/web && pnpm test

# 4. E2E tests (Playwright — requires running dev stack)
pnpm dev  # start all services first
npx playwright test
```

---

## Test File Map

### 5.1 Unit Testing

| Chapter 5 Table | Test ID | Description | Test File | Test Count |
|---|---|---|---|---|
| Table 47 | UT 2 | `validateWalletAddress()` | [apps/web/src/\_\_tests\_\_/validateWalletAddress.test.ts](../apps/web/src/__tests__/validateWalletAddress.test.ts) | 8 |
| Table 49 | UT 4 | `calculateProfileCompletion()` | [apps/web/src/\_\_tests\_\_/calculateProfileCompletion.test.ts](../apps/web/src/__tests__/calculateProfileCompletion.test.ts) | 8 |
| Table 50 | UT 5 | `verifyWallet()` auth service | [apps/api/tests/unit/services/auth.test.ts](../apps/api/tests/unit/services/auth.test.ts) | 4 |
| Table 54 | UT 9 | `computeFreelancerTrustScore()` | [apps/api/tests/unit/services/trustScore.test.ts](../apps/api/tests/unit/services/trustScore.test.ts) | 5 |
| Table 55 | UT 10 | `computeClientTrustScore()` | [apps/api/tests/unit/services/trustScore.test.ts](../apps/api/tests/unit/services/trustScore.test.ts) | 5 |
| Table 44 | UT 1 | `JobEscrow.sol` smart contract | [packages/contracts/test/JobEscrow.test.ts](../packages/contracts/test/JobEscrow.test.ts) | 22 |
| Table 46 | UT 3 | `ReputationRegistry.sol` | [packages/contracts/test/ReputationRegistry.test.ts](../packages/contracts/test/ReputationRegistry.test.ts) | 20 |
| Table 52 | UT 7 | `DisputeResolution.sol` deployment | [packages/contracts/test/DisputeResolution.test.ts](../packages/contracts/test/DisputeResolution.test.ts) | 29 |

### 5.2 Functional Testing

| Chapter 5 Table | Test ID | Description | Test File | Test Count |
|---|---|---|---|---|
| Table 58 | FT 3 | `createProposal()` validations | [apps/api/tests/unit/services/proposal.test.ts](../apps/api/tests/unit/services/proposal.test.ts) | 7 |
| Table 59 | FT 4 | `submitReview()` + double-blind | [apps/api/tests/unit/services/review.test.ts](../apps/api/tests/unit/services/review.test.ts) | 11 |
| Table 60 | FT 5 | `createDispute()` + `castVote()` | [apps/api/tests/unit/services/dispute.test.ts](../apps/api/tests/unit/services/dispute.test.ts) | 10 |

### 5.3 Business Rule Decision Tables

| Chapter 5 Table | BR ID | Description | Test File | Test Count |
|---|---|---|---|---|
| Table 61 | BR 1 | Milestone escrow flow (submit/approve/auto) | [apps/api/tests/unit/services/milestone.test.ts](../apps/api/tests/unit/services/milestone.test.ts) | 8 |
| Table 62 | BR 2 | Profile completeness gate (≥ 70%) | [apps/api/tests/unit/services/proposal.test.ts](../apps/api/tests/unit/services/proposal.test.ts) | 4 |
| Tables 64–65 | BR 3 | Juror eligibility + vote weight | [apps/api/tests/unit/services/dispute.test.ts](../apps/api/tests/unit/services/dispute.test.ts) | 6 |

### 5.4 Integration Testing

| Chapter 5 Table | Test ID | Description | Test File | Test Count |
|---|---|---|---|---|
| Table 66 | IT 1 | Wallet auth flow (nonce → sign → JWT) | [apps/api/tests/integration/auth.test.ts](../apps/api/tests/integration/auth.test.ts) | 3 |
| Table 67 | IT 3 | Job → Proposal → Contract chain | [apps/api/tests/integration/job.test.ts](../apps/api/tests/integration/job.test.ts) | 1 |
| Table 68 | IT 4 | Contract → Milestone → Review chain | [apps/api/tests/integration/job.test.ts](../apps/api/tests/integration/job.test.ts) | 1 |
| Table 69 | IT 5 | Review → Trust Score recalculation | [apps/api/tests/integration/job.test.ts](../apps/api/tests/integration/job.test.ts) | 1 |
| Table 70 | IT 2,6 | Dispute lifecycle + juror voting | [apps/api/tests/integration/job.test.ts](../apps/api/tests/integration/job.test.ts) | 2 |

### 5.5 E2E / System Testing (Playwright)

| Test ID | Description | Test File | Test Count |
|---|---|---|---|
| E2E Auth | Wallet connect UI, keyboard accessibility | [e2e/auth.spec.ts](../e2e/auth.spec.ts) | 3 |
| E2E Jobs | Public job browse, search, detail page | [e2e/job-posting.spec.ts](../e2e/job-posting.spec.ts) | 4 |

---

## Test Infrastructure

### Fixture Files

| File | Contents |
|---|---|
| [apps/api/tests/fixtures/users.fixture.ts](../apps/api/tests/fixtures/users.fixture.ts) | 5 user mocks (freelancer, client, admin, juror, low-trust) |
| [apps/api/tests/fixtures/contracts.fixture.ts](../apps/api/tests/fixtures/contracts.fixture.ts) | 4 contract states + milestones |
| [apps/api/tests/fixtures/jobs.fixture.ts](../apps/api/tests/fixtures/jobs.fixture.ts) | 3 job states (open, closed, completed) |
| [apps/api/tests/fixtures/reviews.fixture.ts](../apps/api/tests/fixtures/reviews.fixture.ts) | Review mock data + input |
| [apps/api/tests/fixtures/disputes.fixture.ts](../apps/api/tests/fixtures/disputes.fixture.ts) | Dispute states + juror votes |
| [e2e/fixtures/test-wallets.ts](../e2e/fixtures/test-wallets.ts) | Hardhat test wallet addresses |

### Config Files

| File | Purpose |
|---|---|
| [apps/api/jest.config.js](../apps/api/jest.config.js) | Jest config with ts-jest, path aliases, coverage thresholds |
| [apps/api/tests/setup.ts](../apps/api/tests/setup.ts) | Global mocks: Prisma, Redis, events, queues, services |
| [playwright.config.ts](../playwright.config.ts) | Playwright E2E config (Firefox, localhost:3000) |

---

## Coverage Targets

| Layer | Lines | Functions | Branches |
|---|---|---|---|
| Backend (`apps/api`) | ≥ 70% | ≥ 70% | ≥ 60% |
| Smart Contracts | ≥ 90% | ≥ 90% | ≥ 80% |

---

## Total Test Count Summary

| Category | Test Files | Total Tests |
|---|---|---|
| Smart Contract (Hardhat) | 3 | 90 |
| Backend Unit (Jest) | 6 | 59 |
| Backend Integration (Jest) | 2 | 8 |
| Frontend Unit | 2 | 16 |
| E2E (Playwright) | 2 | 7 |
| **TOTAL** | **15** | **180** |
