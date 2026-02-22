# RDN — Technical Architecture

> **Version:** 1.0
> **Last Updated:** 2026-02-22
>
> Related Documents:
> - [PRD](./PRD.md)
> - [Database Schema](./DATABASE_SCHEMA.md)
> - [Project Structure](./PROJECT_STRUCTURE.md)
> - [Tech Stack](./TECH_STACK.md)
> - [Integrations](./INTEGRATIONS.md)
> - [Open Items](./OPEN_ITEMS.md)

---

## 1. Stack Overview

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (end-to-end) |
| **Web App** | Next.js 14+ (App Router) |
| **Mobile App** | React Native (Expo) |
| **Backend API** | Node.js + NestJS |
| **Database** | PostgreSQL (AWS RDS) |
| **ORM** | Prisma |
| **Cache** | Redis (AWS ElastiCache) |
| **Real-time** | Socket.io |
| **Search** | PostgreSQL full-text + GIN indexes |
| **File Storage** | AWS S3 + CloudFront CDN |
| **Auth** | Custom (NestJS + JWT + Phone OTP) |
| **Monorepo** | Turborepo |

> For detailed rationale and alternatives considered, see [Tech Stack](./TECH_STACK.md).
> For third-party service details, see [Integrations](./INTEGRATIONS.md).

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Next.js Web  │  │ React Native │  │   RDN Admin Panel    │   │
│  │  (PWA + SSR)  │  │ (Expo) iOS   │  │   (Next.js, SSR)     │   │
│  │              │  │ + Android     │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                  │                      │               │
└─────────┼──────────────────┼──────────────────────┼───────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Application Load Balancer                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  NestJS API      │ │  NestJS API      │ │  NestJS API      │
│  Instance 1      │ │  Instance 2      │ │  Instance N      │
│  (ECS Fargate)   │ │  (ECS Fargate)   │ │  (Auto-scaled)   │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
         ┌────────────────────┼────────────────────────┐
         ▼                    ▼                         ▼
┌──────────────┐    ┌──────────────┐          ┌──────────────┐
│  PostgreSQL  │    │    Redis     │          │    AWS S3     │
│  (AWS RDS)   │    │ (ElastiCache)│          │  + CloudFront │
│  Primary +   │    │  Cluster     │          │    CDN        │
│  Read Replica│    └──────────────┘          └──────────────┘
└──────────────┘
                    ┌──────────────────────────────────────┐
                    │         THIRD-PARTY SERVICES          │
                    │  ┌─────────┐ ┌──────────┐ ┌───────┐  │
                    │  │ Exotel  │ │WhatsApp  │ │Razorpay│  │
                    │  │ (Calls) │ │ (Notif)  │ │(Payments)│ │
                    │  └─────────┘ └──────────┘ └───────┘  │
                    │  ┌─────────┐ ┌──────────┐ ┌───────┐  │
                    │  │ MSG91   │ │ Firebase │ │  AWS   │  │
                    │  │ (OTP)   │ │  (FCM)   │ │ (SES)  │  │
                    │  └─────────┘ └──────────┘ └───────┘  │
                    └──────────────────────────────────────┘
```

### Data Flow

1. **Clients** (Web, Mobile, Admin) connect to the **AWS ALB** over HTTPS
2. ALB distributes traffic across **NestJS API instances** running on ECS Fargate
3. API instances connect to:
   - **PostgreSQL** (RDS) for persistent data — with read replicas for heavy read queries
   - **Redis** (ElastiCache) for caching, session management, real-time pub/sub, rate limiting
   - **AWS S3** for file storage (property photos, KYC documents, invoices)
4. **CloudFront CDN** serves static assets and S3 media with edge caching across India
5. **Socket.io** (backed by Redis adapter) provides real-time chat and notifications
6. Third-party services handle specialized functions (see [Integrations](./INTEGRATIONS.md))

---

## 3. Authentication & Authorization

### Auth Flow

1. User enters phone number → OTP sent via MSG91
2. User enters OTP → verified → JWT issued (access token: 15min, refresh token: 30 days)
3. Access token sent with every API request (Bearer header)
4. Refresh token used to get new access tokens silently
5. Role embedded in JWT payload → NestJS guards check permissions per endpoint

### RBAC Implementation (NestJS Guards)

```typescript
@Roles(Role.SUPER_ADMIN, Role.RWA_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('societies/:id/dealers/approve')
approveDealer() { ... }
```

- Custom `@Roles()` decorator on each endpoint
- `RolesGuard` checks JWT role against required roles
- **Society-scoped access:** RWA admin can only access their own society's data (enforced via middleware)
- **Dealer-scoped access:** Dealers only see their assigned leads/properties

### Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 minutes | Memory (web), SecureStore (mobile) | API authentication |
| Refresh Token | 30 days | HttpOnly cookie (web), SecureStore (mobile) | Silent token renewal |

- Refresh tokens are rotated on use (old token invalidated)
- Logout invalidates all refresh tokens for the user

---

## 4. Environments & DevOps

### Two Environments

| | Dev | Production |
|--|-----|-----------|
| **API** | ECS Fargate (1 task, 0.5 vCPU) | ECS Fargate (2+ tasks, auto-scaled) |
| **Database** | RDS db.t3.micro (single AZ) | RDS db.t3.medium (multi-AZ, read replica) |
| **Redis** | ElastiCache t3.micro (single) | ElastiCache t3.small (cluster) |
| **S3** | Single bucket (rdn-dev-media) | Single bucket (rdn-prod-media) + CloudFront |
| **Domain** | dev.rdn.com | rdn.com / www.rdn.com |
| **Web** | Vercel preview (or ECS) | Vercel production (or ECS + CloudFront) |
| **Mobile** | Expo Dev builds | Expo Production builds (App Store + Play Store) |

### CI/CD Pipeline (GitHub Actions)

- **PR** → lint + typecheck + unit tests → deploy to dev (auto)
- **Merge to `main`** → full test suite → deploy to prod (manual approval)
- **Mobile:** Expo EAS Build triggered on tag → submit to App Store / Play Store

### Docker (Local Development)

- `docker-compose.yml` with PostgreSQL + Redis for local development
- NestJS runs natively with hot reload
- Next.js runs natively with hot reload
- Expo runs on phone/simulator

---

## 5. Security Architecture

| Layer | Implementation |
|-------|---------------|
| **Transport** | TLS/HTTPS everywhere (AWS Certificate Manager) |
| **Data at rest** | RDS encryption enabled, S3 encryption (AES-256) |
| **Sensitive fields** | Phone numbers, KYC data, bank details encrypted at application level (AES-256-GCM) before DB storage |
| **API security** | Helmet (HTTP headers), CORS (whitelist domains), rate limiting (Redis-based), request validation (Zod + class-validator) |
| **Auth** | JWT with short-lived access tokens (15min) + long-lived refresh tokens (30 days, rotated on use) |
| **File uploads** | Pre-signed S3 URLs (files go directly to S3, never through API server), file type + size validation |
| **RBAC** | NestJS guards + society-scoped middleware (users can only access data from their society) |
| **Audit log** | Every write operation logged with user, action, before/after state |
| **Secrets** | AWS Secrets Manager (no secrets in code or env files in repo) |
| **Dependency security** | Dependabot + npm audit in CI |
| **Phone masking** | Exotel handles call routing; phone numbers never sent to frontend |

### Security Checklist

- [ ] All API endpoints behind auth guards (except public listing/search)
- [ ] Society-scoped middleware prevents cross-society data access
- [ ] Pre-signed URLs for all S3 uploads (no API proxy)
- [ ] Rate limiting on OTP endpoints (prevent abuse)
- [ ] Input validation on all endpoints (Zod schemas from shared package)
- [ ] CORS whitelist only known domains
- [ ] Helmet headers on all responses
- [ ] Audit log captures all write operations
- [ ] No secrets in codebase (AWS Secrets Manager)
- [ ] Dependabot enabled for all packages

---

## 6. Estimated AWS Monthly Cost

| Service | Dev | Production |
|---------|-----|-----------|
| ECS Fargate (API) | $15 | $60-120 |
| RDS PostgreSQL | $15 | $50-100 |
| ElastiCache Redis | $12 | $25-50 |
| S3 + CloudFront | $5 | $20-50 |
| ALB | $20 | $25 |
| SES (email) | $1 | $5 |
| CloudWatch | $5 | $10 |
| Secrets Manager | $2 | $2 |
| **Total** | **~$75/mo** | **~$200-360/mo** |
| | **~Rs 6,300/mo** | **~Rs 17,000-30,000/mo** |

*Third-party costs (Exotel, MSG91, Razorpay, WhatsApp API) are usage-based and separate. See [Integrations](./INTEGRATIONS.md) for details.*

---

## 7. Scaling Strategy

### Phase 1 (Launch)

- Single NestJS API behind ALB (2 instances minimum for HA)
- PostgreSQL with read replica for read-heavy queries (search, listings)
- Redis cluster for caching and real-time
- CloudFront for media delivery

### Phase 1 Growth

- Auto-scaling ECS tasks based on CPU/memory
- RDS scaling (instance size upgrade, additional read replicas)
- Database query optimization (materialized views for analytics)

### Phase 2

- Elasticsearch for advanced search (property search, geo-based queries)
- Dedicated analytics database (read-only replica or data warehouse)
- Microservice extraction if needed (notification service, commission service)
- CDN optimization for multi-city coverage

### Performance Targets

| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms |
| Page load (initial) | < 3 seconds |
| Search results | < 500ms |
| Chat message delivery | < 100ms |
| Image load (CDN) | < 1 second |
| Uptime | 99.9% |
