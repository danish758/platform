# DESIGN.md

Design decisions and tradeoffs behind the platform specifically. The
underlying bucketing/targeting/stats engine and the SDK's own design
decisions (context attributes, variant forcing, sticky assignment) live in
the [`cro-engine` repo's own
DESIGN.md](https://github.com/danish758/cro-engine/blob/main/DESIGN.md).

## Node.js middleware, not Edge

`middleware.ts` runs on the **Node.js runtime** — stable since Next.js 15.5
(`export const config = { runtime: 'nodejs' }`, see the
[15.5 release notes](https://nextjs.org/blog/next-15-5#nodejs-middleware-stable)).
This is a better fit for the platform than Edge ever would have been: the
platform already depends on Postgres for everything else, so there was no
constraint pushing it toward Edge in the first place, and Node middleware
lets the session-auth gate query the DB directly instead of needing an
Edge-vs-Node workaround. Middleware does exactly one thing — verify the
session cookie — since experiment-bucketing logic doesn't live in the
platform at all (see "Control plane, not data plane" below).

## Control plane, not data plane

The platform never computes anyone's bucket. It stores experiment config
(`Experiment` rows) and receives events (`Exposure`/`Conversion` rows via
`/api/v1/events`) — that's it. The actual assignment decision happens
inside `@cro-engine/sdk`, running in the *consuming* app's own process,
calling `assign()` from `@cro-engine/assignment-engine`. This mirrors how
GrowthBook, Statsig, and LaunchDarkly are actually architected: their
servers don't decide your variant, your SDK does, using a config payload
their API handed you.

This split is what makes the platform genuinely usable by an unrelated
project rather than just self-consistent: a consuming app never depends on
the platform being reachable to render a page (a cached, possibly-stale
config is enough), and the platform never becomes a per-request bottleneck
for traffic it doesn't own.

## Multi-tenancy: every experiment-data table carries a `projectId`

`Account` (a login) owns zero or more `Project`s; each `Project` owns its
own `ApiKey`s and `Experiment`s. `Exposure` and `Conversion` rows carry
`projectId` directly (not derived through a join) so every query that reads
or writes experiment data is naturally scoped, and uniqueness constraints
are scoped per-project (`@@unique([projectId, key])` on `Experiment`) — two
different projects can both have a `checkout-flow-v2` experiment without
colliding.

Authorization follows the same shape: `requireOwnedProject(accountId,
projectId)` (`src/lib/authz.ts`) is a `findFirst` filtered by *both* the
project id and the requesting account's id, used by every project-scoped
route — a project id alone is never enough to act on it, it must also
belong to whoever's asking. The SDK-facing API uses a completely different
mechanism (API keys, not sessions) for the same reason a browser session
shouldn't be how machine-to-machine calls authenticate.

## Auth: scrypt for passwords, DB-backed sessions, hashed API keys

Three different credentials, three different tradeoffs:

- **Account passwords** are hashed with Node's built-in `crypto.scrypt`
  (`src/lib/password.ts`), not bcrypt or argon2. It's an OWASP-endorsed KDF
  and needs no added dependency — bcrypt requires a package, argon2
  usually needs a native binding that's awkward in serverless. This is
  deliberately the one place in the project that leans on a standard
  primitive rather than "build it yourself": password hashing is a
  well-known place to introduce a real vulnerability if done casually.
- **Sessions are DB-backed** (`Session` rows), not stateless signed
  tokens. The cookie holds only an opaque random id; middleware looks it
  up in Postgres. This makes logout/revocation real — delete the row —
  instead of "valid until it happens to expire," which a signed-token
  approach can't offer without also maintaining a revocation list.
- **API keys are hashed at rest** (`sha256`, not `scrypt` —
  `src/lib/api-key.ts`) and shown once at creation, same UX as
  GitHub/Stripe tokens. `scrypt`'s deliberate slowness defends against
  guessing a low-entropy secret; there's nothing to guess in a 192-bit
  random token, so the extra cost would only slow down every single SDK
  request for no security benefit.

## Exposure deduplication: check-then-insert, with a unique index as backstop

Logging an exposure on every request that touches an experiment would
massively inflate visitor counts relative to real unique exposures — a user
reloading a page ten times would count as ten "visitors," silently
deflating the conversion rate denominator and corrupting every stat derived
from it. The events route (`src/app/api/v1/events/route.ts`) checks for an
existing `(projectId, userId, experimentKey)` row before inserting and
skips if one exists. The `@@unique([projectId, userId, experimentKey])`
index on `Exposure` is a defense-in-depth backstop for the race where two
concurrent requests from a brand-new user both pass the check before either
has inserted — the losing `create` call hits the unique constraint, which
is caught and treated as "someone else already logged this."

## Conversion rate: unique converting users / unique exposed users

A user can convert multiple times — that's allowed and doesn't get
deduplicated at the event level. But conversion *rate* is always computed
as `distinct(userId) with a conversion` / `distinct(userId) exposed`, never
raw event count, or a single enthusiastic user would visibly skew a
variant's apparent rate. See `src/lib/stats.ts`.

Since experiments are created dynamically per project (not hardcoded),
there's no way to infer *which* conversion event belongs to *which*
experiment automatically. Each `Experiment` row carries an optional
`conversionEvent` field, set in the wizard's Basics step — the dashboard
shows visitor counts only (no significance test) when it's unset. Admins
can also name variants anything, so the baseline for lift/significance is
whichever variant is listed *first* in the experiment's own config
(`stats.ts`), not a hardcoded `"control"` key.

## Out of scope

- **Real deployment.** Everything runs locally (Docker Postgres, `npm run
  dev`) by design for this pass — no hosted Postgres, no production
  secrets management, no domain.
- **Billing, rate limiting, or abuse protection on the public API.** A
  real hosted multi-tenant service would need per-key rate limits at
  minimum; `/api/v1/*` currently has none.
- **Team accounts.** One `Account` per login, one login per `Project` (via
  ownership) — no inviting teammates, no roles/permissions beyond "you own
  it or you don't."
- **A generic per-experiment page renderer.** Whether a consuming app has
  a page wired to a given experiment key is entirely up to that app —
  the platform has no opinion, same as any real feature-flag platform
  where not every flag has UI wired to it yet.

## Roadmap

- Deploy for real — hosted Postgres (Supabase was the candidate discussed,
  specifically to keep SQL and self-hostability rather than a proprietary
  NoSQL store).
- Rate limiting per API key on `/api/v1/*`.
- Team accounts / inviting collaborators to a project.
