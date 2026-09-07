# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint via Next.js

# Database
npm run db:migrate          # Create + apply a new migration during local development (tracked in prisma/migrations)
npm run db:migrate:deploy   # Apply pending migrations non-interactively (CI/production)
npm run db:push             # Push schema changes directly with no migration history — reserved for the disposable test DB (see src/test/setup.ts); do not use for changes headed to production
npm run seed:context-keys   # Seed initial context attributes

# Tests (require Postgres running: docker compose up -d postgres)
npm test                 # Run all tests once
npm run test:watch       # Watch mode
```

Tests use a throwaway Docker Postgres database (`cro_engine_test`) — they never touch the dev database.

## Architecture Overview

This is a **multi-tenant A/B testing control plane** ("CRO Engine Platform"). It is a Next.js 15 App Router application backed by Postgres (via Prisma). The platform is intentionally a **control plane, not a data plane**: the SDK in the consuming application computes bucketing locally; the platform only stores config and receives telemetry.

### Tenant Model

Every data table is scoped by `projectId`. The hierarchy is:

```
Account → Project → (Experiments, ApiKeys, ContextKeys)
                 → Exposures, Conversions
```

### Three Auth Mechanisms

| Mechanism | Where | How |
|-----------|-------|-----|
| Account passwords | `src/lib/password.ts` | `crypto.scrypt`, stored as `salt:hexkey` |
| Sessions | `src/lib/session.ts` | DB-backed (opaque cookie holding only `session.id`); real logout via row delete; 7-day TTL |
| API keys | `src/lib/api-key.ts` | `sk_<192-bit hex>` shown once; SHA256-hashed at rest; Bearer token auth on `/api/v1/*` |

### Middleware

`src/middleware.ts` runs on **Node.js** (not Edge) so it can query the DB directly. It protects `/`, `/projects/*`, and `/api/projects/*`. The public SDK routes (`/api/v1/*`) and auth routes (`/login`, `/signup`) are excluded.

### Authorization

`src/lib/authz.ts` provides two helpers used by all protected handlers:
- `getCurrentAccount()` — resolves the session cookie to an account
- `requireOwnedProject(accountId, projectId)` — verifies multi-tenancy via a `findFirst` that must match both project AND account

### Route Structure

- **Admin API:** `/api/projects/[id]/experiments`, `/api/projects/[id]/api-keys`, `/api/projects/[id]/context-keys` — session-authenticated
- **Public SDK API:** `/api/v1/config` (GET experiment configs), `/api/v1/events` (POST exposures/conversions) — API key authenticated

### Experiment Storage

Experiments store variants and targeting rules as JSON columns (`variantsJson`, `targetingJson`). `src/lib/experiment-repo.ts` handles the mapping between DB rows and typed configs. `toConfig()` strips admin-only labels before sending config to the SDK.

### Exposure Deduplication

`/api/v1/events` uses a check-then-insert pattern for exposures, with a unique DB constraint `@@unique([projectId, userId, experimentKey])` as a race-condition backstop. Conversions are **not** deduplicated (users can convert multiple times).

### Stats

`src/lib/stats.ts` computes per-variant conversion rates using **unique users** (not raw event counts). The baseline is always the **first variant in the experiment config** (not a hardcoded "control" key). Stats delegate to the `@cro-engine/stats-engine` package for significance testing.

### Targeting

`src/lib/targeting-validation.ts` validates targeting rules against registered `ContextKey` records. Context keys have a `type` (`string` | `number`) that determines which operators are valid. The engine fails closed (malformed rules exclude everyone).

### ExperimentWizard

`src/components/ExperimentWizard.tsx` is the most complex component — a 4-step form (Basics → Variants → Targeting → Review) with live validation using `validateConfig()` from `@cro-engine/assignment-engine`.

### Path Alias

`@/*` maps to `./src/*` throughout the codebase.
