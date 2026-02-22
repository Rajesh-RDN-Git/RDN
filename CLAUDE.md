# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RDN (Residential Dealer Network) — a real estate transaction platform for residential societies in India. Connects RWAs (Resident Welfare Associations), resident dealers, property owners, and buyers/tenants. Replaces external brokers with a community-driven, society-controlled ecosystem.

## Tech Stack

- **Language:** TypeScript end-to-end
- **Monorepo:** Turborepo with pnpm workspaces
- **Web:** Next.js 14+ (App Router) with SSR and PWA
- **Mobile:** React Native (Expo) with Expo Router
- **API:** NestJS (single backend serving web + mobile)
- **Database:** PostgreSQL (AWS RDS) with Prisma ORM
- **Cache:** Redis (AWS ElastiCache)
- **Real-time:** Socket.io (chat, notifications)
- **Auth:** Phone OTP (MSG91) + JWT (access 15min / refresh 30 days)
- **File Storage:** AWS S3 + CloudFront CDN (pre-signed uploads)
- **Search:** PostgreSQL full-text search + GIN indexes + PostGIS

## Architecture

```
rdn/
├── apps/
│   ├── web/        # Next.js 14 (App Router, SSR, PWA)
│   ├── mobile/     # React Native (Expo, Expo Router)
│   └── api/        # NestJS backend (single API for all clients)
├── packages/
│   ├── shared/     # Types, Zod validation schemas, constants, utils
│   ├── db/         # Prisma schema + generated client
│   └── config/     # Shared ESLint, TSConfig, Prettier configs
└── infrastructure/
    ├── terraform/  # AWS IaC (dev + prod environments)
    └── docker/     # Dockerfile.api + docker-compose.yml (local dev)
```

### Key Architectural Decisions

- **Single API:** NestJS serves web, PWA, and mobile. No separate backends.
- **Shared validation:** Zod schemas in `packages/shared/validation/` are used by both frontend and backend. Never duplicate validation logic.
- **Prisma as source of truth:** Database schema lives in `packages/db/prisma/schema.prisma`. Types are auto-generated. Never manually define DB types.
- **RBAC via NestJS Guards:** Use `@Roles()` decorator + `RolesGuard` on every endpoint. Society-scoped middleware ensures RWA admins and dealers only access their own society's data.
- **Pre-signed S3 uploads:** Files go directly from client to S3. API generates pre-signed URLs. Files never pass through the API server.
- **Masked communication:** Phone numbers are never sent to any frontend. Exotel handles call routing.

## Common Commands

```bash
# Install dependencies (from root)
pnpm install

# Run all apps in development
pnpm dev

# Run individual apps
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter mobile dev        # or: cd apps/mobile && npx expo start

# Build
pnpm build                      # all apps
pnpm --filter api build
pnpm --filter web build

# Database
pnpm --filter db prisma generate          # regenerate Prisma client after schema changes
pnpm --filter db prisma migrate dev       # create + apply migration (dev)
pnpm --filter db prisma migrate deploy    # apply migrations (prod)
pnpm --filter db prisma db seed           # seed database

# Linting & formatting
pnpm lint                       # all packages
pnpm typecheck                  # TypeScript check across all packages

# Testing
pnpm test                       # all tests
pnpm --filter api test          # API unit tests
pnpm --filter api test:e2e      # API e2e tests
pnpm --filter web test          # Web tests

# Local infrastructure
docker compose up -d            # PostgreSQL + Redis for local dev
docker compose down
```

## User Roles (RBAC)

Five roles with hierarchical permissions. Always enforce via NestJS guards:

1. **SUPER_ADMIN** — Full platform access. RWA onboarding, dealer approval, inventory assignment, commission oversight.
2. **RWA_ADMIN** — Society-scoped. Approves listings and dealers within their society. Cannot deactivate dealers (only request).
3. **DEALER** — Society-scoped. Receives assigned leads/inventory. Masked chat/call only. Earns commission.
4. **OWNER** — Listing-scoped. Lists property, approves visit access, tracks inquiries.
5. **BUYER_TENANT** — Platform-wide. Browse without account. Sign up (phone OTP) to enquire/save/chat.

## NestJS API Module Structure

Each module in `apps/api/src/modules/` is self-contained with controller, service, DTOs, and tests:

`auth` | `users` | `societies` | `properties` | `search` | `leads` | `dealers` | `communication` | `notifications` | `commission` | `verification` | `grievance` | `referral` | `reports` | `media` | `admin`

Shared cross-cutting code lives in `apps/api/src/common/` (guards, decorators, interceptors, filters, pipes, middleware).

## Database Conventions

- All primary keys are UUIDs
- Timestamps: `created_at`, `updated_at` on every table
- Sensitive fields (phone, KYC, bank details) encrypted at application level (AES-256-GCM) before DB storage
- JSONB for flexible fields: amenities, restrictions, evidence_urls, notes, meta
- Unique constraint on `(society_id, flat_number, tower_block)` in properties table to prevent duplicate listings
- Soft concepts via status fields (ACTIVE/INACTIVE/SUSPENDED), not soft-delete columns

## Third-Party Integrations

| Service | Purpose | Config Location |
|---------|---------|----------------|
| MSG91 | Phone OTP | `apps/api/src/modules/auth/` |
| Firebase (FCM) | Push notifications | `apps/api/src/modules/notifications/` |
| Exotel | Masked calling | `apps/api/src/modules/communication/` |
| Interakt/Wati | WhatsApp notifications | `apps/api/src/modules/notifications/` |
| Razorpay | Payments | `apps/api/src/modules/commission/` |
| AWS S3 | File storage | `apps/api/src/modules/media/` |
| AWS SES | Transactional email | `apps/api/src/modules/notifications/` |

## Environment Variables

Secrets managed via AWS Secrets Manager in deployed environments. Locally, use `.env` files (never committed). Each app has its own `.env.example`.

## SEO Requirements

Society profile pages and property listing pages must be server-side rendered (Next.js SSR) with Schema.org structured data for organic search discovery. Every society page targets "[Society Name] [City] rent/sale" keywords.
