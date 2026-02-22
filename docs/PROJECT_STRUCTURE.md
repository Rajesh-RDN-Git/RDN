# RDN — Project Structure

> **Version:** 1.0
> **Last Updated:** 2026-02-22
> **Monorepo Tool:** Turborepo with pnpm workspaces
>
> Related Documents:
> - [PRD](./PRD.md)
> - [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
> - [Tech Stack](./TECH_STACK.md)

---

## Monorepo Layout

```
rdn/
├── apps/
│   ├── web/                    # Next.js 14 (App Router)
│   ├── mobile/                 # React Native (Expo)
│   └── api/                    # NestJS Backend (Single API)
│
├── packages/
│   ├── shared/                 # Shared across web + mobile + API
│   ├── db/                     # Prisma client (generated, shared)
│   └── config/                 # Shared configs (ESLint, TypeScript, Prettier)
│
├── infrastructure/             # IaC (Infrastructure as Code)
│   ├── terraform/              # AWS infrastructure definitions
│   └── docker/                 # Docker configs
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
└── pnpm-workspace.yaml         # pnpm workspace config
```

---

## Apps

### `apps/web/` — Next.js 14 (App Router)

The public-facing web application and admin panel. Serves SSR pages for SEO (society profiles, listings) and client-side dashboards for authenticated users.

```
apps/web/
├── app/                        # App Router pages
│   ├── (public)/               # Public pages (no auth required)
│   │   ├── page.tsx            # Homepage — hero search, trending, trust indicators
│   │   ├── search/             # Property search with filters
│   │   ├── society/[slug]/     # Society profile page (SEO landing page)
│   │   ├── property/[id]/      # Property detail page
│   │   ├── cities/             # City-wise browsing
│   │   └── blog/               # Content/knowledge center
│   │
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/              # Phone OTP login
│   │   ├── signup/             # Registration (role-specific flows)
│   │   └── verify/             # OTP verification
│   │
│   ├── dashboard/              # Role-based dashboards (auth required)
│   │   ├── admin/              # RDN Super Admin dashboard
│   │   │   ├── societies/      # RWA management, mandate tracking
│   │   │   ├── dealers/        # Dealer approval, KYC review
│   │   │   ├── properties/     # Bulk upload, inventory assignment
│   │   │   ├── leads/          # Platform-wide CRM
│   │   │   ├── commissions/    # Billing, invoicing, settlements
│   │   │   ├── grievances/     # All grievances, SLA monitoring
│   │   │   ├── reports/        # Platform-wide analytics
│   │   │   └── users/          # User management
│   │   │
│   │   ├── rwa/                # RWA Admin dashboard
│   │   │   ├── listings/       # Approve/reject listings
│   │   │   ├── dealers/        # Approve dealers, performance view
│   │   │   ├── leads/          # Society-wide leads
│   │   │   ├── reports/        # Society analytics, earnings
│   │   │   └── grievances/     # Society grievances
│   │   │
│   │   ├── dealer/             # Resident Dealer dashboard
│   │   │   ├── leads/          # Personal CRM inbox
│   │   │   ├── properties/     # Assigned inventory
│   │   │   ├── commissions/    # Earnings, settlement history
│   │   │   └── profile/        # KYC, bank details, ratings
│   │   │
│   │   ├── owner/              # Property Owner dashboard
│   │   │   ├── listings/       # My properties, status tracking
│   │   │   └── inquiries/      # Leads on my properties
│   │   │
│   │   └── buyer/              # Buyer/Tenant dashboard
│   │       ├── shortlist/      # Saved properties
│   │       ├── visits/         # Scheduled & past visits
│   │       ├── negotiations/   # Active deals
│   │       └── saved-searches/ # Saved search alerts
│   │
│   ├── api/                    # Next.js API routes (BFF)
│   │   └── ...                 # Proxies to NestJS API
│   │
│   └── layout.tsx              # Root layout
│
├── components/                 # React components
│   ├── ui/                     # Design system primitives (Button, Input, Card, etc.)
│   ├── layout/                 # Header, Footer, Sidebar, Navigation
│   ├── property/               # PropertyCard, PropertyGallery, PropertyFilters
│   ├── society/                # SocietyCard, SocietyProfile, AmenitiesGrid
│   ├── dashboard/              # DashboardCards, Charts, DataTables
│   ├── chat/                   # ChatWindow, MessageBubble, ConversationList
│   └── forms/                  # ListingForm, KYCForm, GrievanceForm
│
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts              # Authentication state
│   ├── useSearch.ts            # Search & filter logic
│   ├── useSocket.ts            # Socket.io connection
│   └── useNotifications.ts     # Push notification handling
│
├── lib/                        # Utilities
│   ├── api.ts                  # API client (Axios/fetch wrapper)
│   ├── auth.ts                 # Token management
│   └── seo.ts                  # SEO metadata helpers
│
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons
│
└── next.config.js              # Next.js configuration
```

### `apps/mobile/` — React Native (Expo)

Native mobile app for iOS and Android. Shares TypeScript types and validation schemas with web and API.

```
apps/mobile/
├── app/                        # Expo Router (file-based routing)
│   ├── (tabs)/                 # Tab navigation
│   │   ├── index.tsx           # Home — search, trending, recommendations
│   │   ├── search.tsx          # Property search with filters
│   │   ├── listings.tsx        # My Listings (owner/dealer view)
│   │   ├── chat.tsx            # Chat conversations
│   │   └── profile.tsx         # Profile, settings, role-specific options
│   │
│   ├── (auth)/                 # Auth screens
│   │   ├── login.tsx           # Phone OTP login
│   │   ├── signup.tsx          # Registration
│   │   └── verify.tsx          # OTP verification
│   │
│   ├── property/               # Property screens
│   │   ├── [id].tsx            # Property detail
│   │   └── gallery.tsx         # Fullscreen photo/video gallery
│   │
│   ├── society/                # Society screens
│   │   └── [slug].tsx          # Society profile
│   │
│   ├── dashboard/              # Role-based dashboard screens
│   │   ├── admin/              # Admin views (simplified for mobile)
│   │   ├── dealer/             # Dealer CRM, leads, commissions
│   │   ├── owner/              # Owner listings, inquiries
│   │   └── buyer/              # Shortlist, visits, negotiations
│   │
│   └── chat/                   # Chat screens
│       ├── [id].tsx            # Conversation detail
│       └── call.tsx            # Masked call interface
│
├── components/                 # React Native components
│   ├── ui/                     # Design system (RN equivalents)
│   ├── property/               # PropertyCard, Gallery, Filters
│   ├── chat/                   # ChatBubble, ConversationItem
│   └── common/                 # SharedHeader, BottomSheet, etc.
│
├── hooks/                      # Custom hooks
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── usePushNotifications.ts
│   └── useCamera.ts            # Property photo capture
│
├── lib/                        # Utilities
│   ├── api.ts                  # API client
│   ├── auth.ts                 # SecureStore token management
│   └── notifications.ts        # FCM setup
│
└── app.json                    # Expo configuration
```

### `apps/api/` — NestJS Backend

Single API serving web, mobile, and admin. Modular architecture with NestJS modules.

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth.controller.ts      # POST /auth/send-otp, /auth/verify-otp, /auth/refresh
│   │   │   ├── auth.service.ts         # OTP logic, JWT generation, token rotation
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/             # JWT strategy, OTP strategy
│   │   │   └── dto/                    # SendOtpDto, VerifyOtpDto
│   │   │
│   │   ├── users/              # User management
│   │   │   ├── users.controller.ts     # CRUD, role management
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── societies/          # RWA/Society management
│   │   │   ├── societies.controller.ts # CRUD, onboarding, mandate tracking
│   │   │   ├── societies.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── properties/         # Property listings
│   │   │   ├── properties.controller.ts # CRUD, bulk upload, assignment
│   │   │   ├── properties.service.ts
│   │   │   ├── bulk-upload.service.ts  # CSV/Excel parsing and import
│   │   │   └── dto/
│   │   │
│   │   ├── search/             # Search engine
│   │   │   ├── search.controller.ts    # GET /search with filters
│   │   │   ├── search.service.ts       # Full-text search, PostGIS geo queries
│   │   │   └── dto/
│   │   │
│   │   ├── leads/              # CRM & lead tracking
│   │   │   ├── leads.controller.ts     # CRUD, status updates, reassignment
│   │   │   ├── leads.service.ts
│   │   │   ├── assignment.service.ts   # Auto-reassignment logic
│   │   │   └── dto/
│   │   │
│   │   ├── dealers/            # Dealer management
│   │   │   ├── dealers.controller.ts   # Apply, KYC, approval, deactivation
│   │   │   ├── dealers.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── communication/      # Chat & masked calling
│   │   │   ├── chat.gateway.ts         # Socket.io gateway (WebSocket)
│   │   │   ├── chat.service.ts         # Message persistence, conversation mgmt
│   │   │   ├── call.service.ts         # Exotel masked call integration
│   │   │   └── dto/
│   │   │
│   │   ├── notifications/      # Multi-channel notifications
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts    # Orchestrator
│   │   │   ├── push.service.ts             # Firebase FCM
│   │   │   ├── whatsapp.service.ts         # WhatsApp Business API
│   │   │   ├── email.service.ts            # AWS SES
│   │   │   └── dto/
│   │   │
│   │   ├── commission/         # Billing & payouts
│   │   │   ├── commission.controller.ts
│   │   │   ├── commission.service.ts       # Calculation, tracking
│   │   │   ├── invoice.service.ts          # PDF generation (Puppeteer)
│   │   │   ├── payment.service.ts          # Razorpay integration
│   │   │   └── dto/
│   │   │
│   │   ├── verification/       # Verification workflows
│   │   │   ├── verification.controller.ts
│   │   │   ├── verification.service.ts     # Society, dealer, property verification
│   │   │   └── dto/
│   │   │
│   │   ├── grievance/          # Grievance system
│   │   │   ├── grievance.controller.ts
│   │   │   ├── grievance.service.ts        # Ticketing, escalation, SLA tracking
│   │   │   └── dto/
│   │   │
│   │   ├── referral/           # Referral system
│   │   │   ├── referral.controller.ts
│   │   │   ├── referral.service.ts         # Code generation, tracking, rewards
│   │   │   └── dto/
│   │   │
│   │   ├── reports/            # Analytics & export
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts          # Query aggregation
│   │   │   ├── pdf.service.ts              # PDF generation (Puppeteer)
│   │   │   ├── excel.service.ts            # Excel export (ExcelJS)
│   │   │   └── dto/
│   │   │
│   │   ├── media/              # File upload
│   │   │   ├── media.controller.ts         # Pre-signed URL generation
│   │   │   ├── media.service.ts            # S3 operations, image processing
│   │   │   └── dto/
│   │   │
│   │   └── admin/              # Admin-specific operations
│   │       ├── admin.controller.ts         # Bulk actions, config
│   │       ├── admin.service.ts
│   │       └── dto/
│   │
│   ├── common/                 # Shared infrastructure
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts       # JWT authentication guard
│   │   │   └── roles.guard.ts          # RBAC authorization guard
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts      # @Roles(Role.ADMIN, ...)
│   │   │   └── current-user.decorator.ts # @CurrentUser() — extracts user from JWT
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts  # Request/response logging
│   │   │   ├── transform.interceptor.ts # Response transformation
│   │   │   └── cache.interceptor.ts    # Redis cache interceptor
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Global exception handler
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts  # Zod schema validation
│   │   └── middleware/
│   │       ├── rate-limit.middleware.ts # Redis-based rate limiting
│   │       └── society-scope.middleware.ts # Scopes queries to user's society
│   │
│   ├── config/                 # Environment configuration
│   │   ├── app.config.ts       # App-level config
│   │   ├── database.config.ts  # DB connection config
│   │   ├── redis.config.ts     # Redis connection config
│   │   ├── aws.config.ts       # AWS services config
│   │   └── feature-flags.ts    # Feature toggles
│   │
│   ├── database/               # Database setup
│   │   ├── prisma.service.ts   # Prisma client wrapper for NestJS
│   │   ├── prisma.module.ts
│   │   └── seeds/              # Seed scripts
│   │
│   └── main.ts                 # Application entry point
│
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   ├── migrations/             # Version-controlled migration files
│   └── seed.ts                 # Seed data entry point
│
└── test/
    ├── e2e/                    # End-to-end API tests
    └── fixtures/               # Test data fixtures
```

---

## Packages

### `packages/shared/` — Shared Code

Code shared across all three apps (web, mobile, API). Contains no runtime dependencies on any specific framework.

```
packages/shared/
├── types/                      # TypeScript interfaces & types
│   ├── user.ts                 # User, Role, UserStatus
│   ├── society.ts              # Society, VerificationStatus
│   ├── property.ts             # Property, TransactionType, FurnishingType
│   ├── lead.ts                 # Lead, LeadStatus, LeadSource
│   ├── transaction.ts          # Transaction, PaymentStatus
│   ├── dealer.ts               # Dealer, KYCStatus
│   ├── grievance.ts            # Grievance, GrievanceCategory, Severity
│   ├── notification.ts         # Notification, NotificationType, Channel
│   └── index.ts                # Re-exports all types
│
├── validation/                 # Zod schemas
│   ├── user.schema.ts          # User creation/update validation
│   ├── property.schema.ts      # Property listing validation
│   ├── lead.schema.ts          # Lead creation/update validation
│   ├── search.schema.ts        # Search query validation
│   └── index.ts
│
├── constants/                  # Enums and constants
│   ├── roles.ts                # Role enum, permission definitions
│   ├── statuses.ts             # All status enums
│   ├── commission.ts           # Commission rates, GST rate
│   └── sla.ts                  # SLA timelines per severity
│
├── utils/                      # Pure utility functions
│   ├── commission.ts           # Commission calculation logic
│   ├── formatting.ts           # Price formatting, date formatting
│   └── validation.ts           # Common validation helpers
│
├── package.json
└── tsconfig.json
```

### `packages/db/` — Prisma Client

Generated Prisma client, shared as a package so both API and any scripts can import it.

```
packages/db/
├── prisma/
│   └── schema.prisma           # Symlinked or copied from apps/api/prisma
├── index.ts                    # Exports PrismaClient
├── package.json
└── tsconfig.json
```

### `packages/config/` — Shared Configs

Shared tooling configuration to ensure consistency across all apps.

```
packages/config/
├── eslint/
│   ├── base.js                 # Base ESLint config
│   ├── next.js                 # Next.js specific rules
│   ├── react-native.js         # React Native specific rules
│   └── nest.js                 # NestJS specific rules
│
├── tsconfig/
│   ├── base.json               # Base TypeScript config
│   ├── next.json               # Next.js tsconfig extends base
│   ├── react-native.json       # React Native tsconfig extends base
│   └── nest.json               # NestJS tsconfig extends base
│
└── prettier/
    └── index.js                # Shared Prettier config
```

---

## Infrastructure

### `infrastructure/terraform/` — AWS IaC

```
infrastructure/terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf             # Dev environment composition
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── main.tf             # Prod environment composition
│       ├── variables.tf
│       └── terraform.tfvars
│
├── modules/
│   ├── rds/                    # PostgreSQL RDS module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/                    # ECS Fargate module (API)
│   ├── s3/                     # S3 buckets module
│   ├── elasticache/            # Redis ElastiCache module
│   ├── alb/                    # Application Load Balancer module
│   └── cloudfront/             # CloudFront CDN module
│
└── main.tf                     # Root module
```

### `infrastructure/docker/` — Docker Configs

```
infrastructure/docker/
├── Dockerfile.api              # NestJS API container
└── docker-compose.yml          # Local dev: PostgreSQL + Redis
```

---

## CI/CD

### `.github/workflows/`

```
.github/workflows/
├── ci.yml                      # On PR: lint, typecheck, test
├── deploy-dev.yml              # On merge to develop: deploy to dev
└── deploy-prod.yml             # On merge to main: deploy to prod (manual approval)
```

**CI Pipeline (`ci.yml`):**
1. Install dependencies (`pnpm install`)
2. Run Turborepo tasks in parallel: `turbo run lint typecheck test`
3. Build all apps: `turbo run build`

**Deploy Pipeline:**
1. Run full CI
2. Build Docker image for API → push to ECR
3. Update ECS service with new task definition
4. Build Next.js → deploy to Vercel (or ECS)
5. Run smoke tests against deployed environment

---

## Root Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo pipeline config — defines build, lint, test, typecheck tasks and their dependencies |
| `package.json` | Root scripts, workspace-level dev dependencies |
| `pnpm-workspace.yaml` | Defines workspace packages: `apps/*`, `packages/*` |
| `.nvmrc` | Node.js version pinning |
| `.prettierrc` | Extends `packages/config/prettier` |
| `.eslintrc.js` | Extends `packages/config/eslint/base` |
| `tsconfig.json` | Root TypeScript config (references workspace packages) |
