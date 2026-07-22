# 02 — Code Map

> Companion documents: [`docs/PROJECT_STRUCTURE.md`](../PROJECT_STRUCTURE.md) for the
> exhaustive file tree, [`docs/TECHNICAL_ARCHITECTURE.md`](../TECHNICAL_ARCHITECTURE.md) for
> system design, [`docs/DATABASE_SCHEMA.md`](../DATABASE_SCHEMA.md) for tables,
> [`docs/TECH_STACK.md`](../TECH_STACK.md) for _why_ each technology was chosen and what was
> rejected. This document is what you need in your head to work in the repo.

---

## Stack, with real versions

Read from `package.json` and `.nvmrc` on 2026-07-22. `docs/TECH_STACK.md` explains the
reasoning behind each choice but states versions loosely ("Next.js 14+"), so trust this
table for versions and that document for rationale.

| Layer                    | Stack                                                                                       | Installed version                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Runtime, package manager | Node.js (`.nvmrc`), pnpm                                                                    | Node 20, pnpm 9.15.4                                                                    |
| Monorepo                 | Turborepo, TypeScript                                                                       | turbo 2.3.3, TypeScript 5.7.3                                                           |
| Web                      | Next.js App Router, React, Tailwind, react-hook-form, socket.io-client, js-cookie           | Next 14.2.22, React 18.3.1, Tailwind 3.4.17, socket.io-client 4.8.3                     |
| Mobile                   | Expo (managed) + Expo Router, React Native, Zustand, expo-secure-store, Sentry React Native | Expo SDK 54.0.33, React Native 0.81.5, React 19.1.0, expo-router 6.0.23, Zustand 5.0.11 |
| API                      | NestJS, Prisma, Zod + class-validator, socket.io, ioredis, helmet, @nestjs/throttler        | NestJS 10.4.15, Zod 3.24.1, helmet 8.2.0, throttler 6.5.0, ioredis 5.9.3                |
| Integration SDKs         | firebase-admin, AWS SDK v3 (S3 + presigner)                                                 | firebase-admin 13.7.0, @aws-sdk/client-s3 3.1014.0                                      |
| Data                     | PostgreSQL 16.14 (RDS), Redis (ElastiCache)                                                 |                                                                                         |

> **Correction to the older docs.** `CLAUDE.md` and `docs/TECH_STACK.md` describe search as
> "PostgreSQL full-text search + GIN indexes + PostGIS". That is the _design intent_, not the
> implementation. `apps/api/src/modules/search/search.service.ts` uses Prisma `contains` with
> `mode: 'insensitive'`, which compiles to `ILIKE '%term%'` — a pattern no B-tree index can
> serve — and there is no `tsvector`, GIN, or PostGIS index in
> `packages/db/prisma/schema.prisma`. Search works fine at current volume and will degrade
> into full table scans in the low thousands of listings. Tracked in
> [06](./06-BACKLOG-PRIORITY-IMPACT.md).

### The React 18 / React 19 split — read this before touching the build

**Web runs React 18.3.1. Mobile runs React 19.1.0.** They live in the same pnpm workspace,
and only one of them can win the hoisted root slot — the lockfile decides, not the filter
flag. This single fact is why the AWS Amplify build spec deletes `apps/mobile` and
`pnpm-lock.yaml` before installing, and then deletes the nested `react` and `react-dom`
inside `apps/web/node_modules` afterwards. Without those steps you get two React instances
in one bundle and the site dies with a `useContext` crash on `/_error`.

If you "clean up" that build spec without understanding it, production web breaks. The full
chain is documented in [07 — Known issues](./07-KNOWN-ISSUES-AND-GOTCHAS.md).

## Repository layout

```
rdn/
├── apps/
│   ├── web/        Next.js 14 App Router — SSR + PWA
│   ├── mobile/     React Native (Expo Router)
│   └── api/        NestJS — the single backend for every client
├── packages/
│   ├── shared/     types, Zod validation, constants, utils, design tokens
│   ├── db/         Prisma schema, generated client, field-level crypto
│   └── config/     shared ESLint, TSConfig, Prettier
└── infrastructure/
    ├── terraform/  AWS infrastructure as code
    └── docker/     Dockerfile.api + docker-compose.yml for local dev
```

### `apps/api` — the 17 modules

Each module under `apps/api/src/modules/` is self-contained (controller, service, DTOs,
tests):

| Module          | Owns                                                       |
| --------------- | ---------------------------------------------------------- |
| `auth`          | Phone OTP login via MSG91, JWT issue and refresh           |
| `users`         | Profiles, DPDP self-service (delete, data export, consent) |
| `societies`     | Society directory, onboarding, verification                |
| `properties`    | Listings, lifecycle, dealer assignment                     |
| `search`        | Postgres full-text + GIN + PostGIS querying                |
| `leads`         | Enquiry capture, lead CRM, status pipeline                 |
| `dealers`       | Dealer applications, approval, bank details                |
| `communication` | Masked calling (Exotel), chat, WebSocket gateway           |
| `notifications` | FCM push, WhatsApp, SES email, device tokens               |
| `commission`    | Commission calculation, GST extraction, Razorpay           |
| `transactions`  | Deal closure and transaction records                       |
| `verification`  | Property and dealer verification workflows                 |
| `grievance`     | Internal grievances plus the public DPDP channel           |
| `referral`      | Referral codes and reward tracking                         |
| `reports`       | Role-scoped dashboards and analytics                       |
| `media`         | S3 pre-signed upload URLs and CloudFront URLs              |
| `admin`         | Super-admin tooling, user role editor, retention cron      |

Cross-cutting code sits in `apps/api/src/common/`: `crypto`, `decorators`, `filters`,
`guards`, `interceptors`, `middleware`, `pipes`, `redis`, `utils`.

### `apps/web` — route groups matter

- `app/(public)/` — public pages get the header and footer from `(public)/layout.tsx`:
  `search`, `property`, `society`, `societies`, plus marketing and legal pages (`privacy`,
  `terms`, `grievance`, `pricing`, `how-it-works`, `faq`, `become-dealer`, and others).
- `app/(auth)/` — `login`, `register`.
- `app/dashboard/` — authenticated app, sidebar from `dashboard/layout.tsx`:
  `properties`, `leads`, `chat`, `commissions`, `dealers`, `societies`, `users`, `reports`,
  `grievances`, `notifications`, `verification-queue`, `settings`.
- The homepage `app/page.tsx` sits **outside both groups** and carries its own header and
  footer. Changing shared chrome means changing it in more than one place — check the
  homepage separately.

Supporting folders: `src/components`, `src/hooks`, `src/lib`, `src/providers`,
`src/stores`, and `src/middleware.ts`.

### `apps/mobile` — Expo Router

`app/(auth)`, `app/(tabs)`, plus stack routes: `property/[id]`, `lead`, `conversation`,
`saved`, `settings`, `society`, `commissions`, `transactions`, `grievances`, `reports`,
`legal`, and a `manage/` section mirroring the web dashboard (`properties`, `dealers`,
`societies`, `users`, `verification-queue`).

## Patterns that will bite you if you do not know them

**Validation is shared, never duplicated.** Zod schemas live in
`packages/shared/validation/` and are imported by both the API and the front ends. If you
write a second copy of a rule, they will drift.

**Prisma is the type source of truth.** The schema is
`packages/db/prisma/schema.prisma`. Never hand-write database types. After changing the
schema, regenerate with `pnpm --filter db db:generate` — note that the
`pnpm --filter db prisma generate` form printed in `CLAUDE.md` does **not** work.

**Field-level encryption is transparent but fragile.** Sensitive fields (user phone,
nominee name and phone, dealer bank details, lead contact name and phone, DPDP grievance
contact) are AES-256-GCM encrypted at the application layer by a Prisma `$use` middleware in
`packages/db/src/field-encryption.ts`, with primitives in `packages/db/src/field-crypto.ts`.
Consequences you must respect:

- Phone is the login lookup key, so it cannot be queried directly. A **blind index** —
  HMAC-SHA256 over the E.164-normalised phone, stored in `phoneHash` — carries equality
  lookups. The middleware rewrites `where.phone` into `where.phoneHash` for you.
- `findUnique` on an encrypted field does not work; those call sites use `findFirst`.
- Ciphertext is stored as `v1:base64(iv||tag||ct)`; the `v1:` prefix is the key-version tag
  that makes future key rotation possible.
- **Losing `AES_ENCRYPTION_KEY` or `BLIND_INDEX_KEY` means losing the data.** They are in
  AWS Secrets Manager. Treat them like the database itself.
- After editing anything in `packages/db/src/`, rebuild the package:
  `pnpm --filter @rdn/db build`. Skipping this produces confusing stale-code behaviour.

**RBAC on every endpoint.** `@Roles()` plus `RolesGuard`, with society-scoping middleware so
RWA admins and dealers only ever see their own society's data. A recent security audit found
a family of IDOR bugs from endpoints that skipped this — when you add an endpoint, add the
guard and a caller-scoping check, and write the test that proves a foreign user gets denied.

**Uploads bypass the API.** The API issues an S3 pre-signed URL and the client PUTs directly
to S3. Files never pass through the API server. In production the S3 client authenticates
through the **ECS task role**, not static keys — a bug where mock mode was chosen whenever
static keys were absent silently discarded every production upload for weeks.

**List endpoints double-wrap.** They return `{data: {data: [...], pagination}}`. Unwrap both
layers or you will be confused by an "empty" list that is not empty.

**Web images use plain `<img>`, not `next/image`,** because URLs are S3 pre-signed and
CloudFront-backed.

**Auth redirects are gated by route.** `apps/web/src/lib/routes.ts` exposes
`loginRedirectFor()`, which only redirects to login from `/dashboard` routes. A dead refresh
token used to bounce signed-in users off public property pages to `/login`; this is the fix,
so do not reintroduce a blanket redirect.

**ESLint treats an empty catch block as an error.** Always leave a reason comment:
`catch { /* reason */ }`.

## Tests

32 spec files across the workspace. The API suite is the meaningful one and stood at 218
passing at handover.

```bash
pnpm test                    # everything
pnpm --filter api test       # API unit tests — the suite that matters
pnpm --filter api test:e2e   # API end-to-end
pnpm --filter web test       # web
pnpm typecheck               # TypeScript across all packages
pnpm lint
```

**House rule inherited from this project: a bug fix starts with the failing test.** Every
fix in the recent production bug batch was written that way, and it is why the suite is
worth trusting.

## Design system

Shared design tokens (colours, typography, spacing) live in
`packages/shared/src/design-tokens/`, and the web Tailwind config imports them. The web UI
component library is `apps/web/src/components/ui/` — 30-plus SVG icons in `icons.tsx` plus
carousel, range-slider, chip, dropdown, button, stat-card, modal, otp-input, and phone-input.
`DESIGN_SYSTEM.md` at the repository root is the full reference.

Mobile has **not** been migrated onto the tokens: roughly 840 hardcoded hex values across 49
files remain, and `apps/mobile/src/lib/theme.ts` is a bridge that is largely unused. That is
a known, scoped backlog item, not an accident.
