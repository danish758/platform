# CRO Engine — Platform

The control plane for [CRO Engine](https://github.com/danish758/cro-engine),
a server-side A/B testing platform built from scratch. Sign up, create a
project, create an experiment through a multistep wizard, get an API key —
that key is what
[`@cro-engine/sdk`](https://github.com/danish758/cro-engine/tree/main/packages/sdk)
uses in your own app to fetch config and evaluate bucketing locally.

This app never computes anyone's bucket. It stores experiment config
(`Experiment` rows) and receives events (`Exposure`/`Conversion` rows) —
the actual assignment decision happens inside the SDK, in the consuming
app's own process. See
[`acme-storefront`](https://github.com/danish758/acme-storefront) for a
worked example of that split.

## Architecture

```
Dashboard (you, logged in via session cookie)
  signup/login → create Project → create ApiKey → create Experiment (wizard)
        │
        ▼
  Postgres: Account / Project / ApiKey / Experiment / Exposure / Conversion
        │
        ▼
Public API (a consuming app's SDK, via API key)
  GET  /api/v1/config   → this project's experiments
  POST /api/v1/events   → exposure/conversion ingestion
```

`middleware.ts` runs on the **Node.js runtime** (stable since Next.js
15.5) and does exactly one thing: verify the session cookie. No
experiment-bucketing logic lives here — that's the SDK's job, running
inside whatever app installed it.

## Running locally

Requires Node 18+ and Docker (for local Postgres).

```bash
git clone https://github.com/danish758/platform.git
cd platform
npm install
docker compose up -d postgres
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev   # http://localhost:3000
```

Sign up, create a project, create an API key, and create at least
`checkout-flow-v2` and `pricing-cta-copy` (two variants, `control`/
`variant`, 50/50 each) if you want to run
[`acme-storefront`](https://github.com/danish758/acme-storefront) against
it — its pages are wired to those two keys specifically.

## Running tests

```bash
docker compose up -d postgres   # tests need Postgres running
npm test
```

Covers the admin API's validation (reusing `validateConfig()` from
`@cro-engine/assignment-engine` — both client- and server-side), and
exposure deduplication against a throwaway Postgres database dedicated to
the test run.

## Documentation

- [`DESIGN.md`](DESIGN.md) — multi-tenancy, auth (scrypt passwords, DB-backed sessions, hashed API keys), exposure dedup, and non-goals/roadmap for the platform specifically.
- [`cro-engine`](https://github.com/danish758/cro-engine) — the packages this app depends on, and their own design decisions (bucketing, targeting, stats).
