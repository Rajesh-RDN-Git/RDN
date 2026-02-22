# RDN — Tech Stack

> **Version:** 1.0
> **Last Updated:** 2026-02-22
>
> Related Documents:
> - [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
> - [Project Structure](./PROJECT_STRUCTURE.md)
> - [Integrations](./INTEGRATIONS.md)

---

## Overview

RDN uses a full TypeScript stack across web, mobile, and backend. This document details every technology choice — what it does, why it was chosen, and what alternatives were considered.

---

## Core Language

### TypeScript (End-to-End)

| | |
|---|---|
| **Purpose** | Single language across web, mobile, and backend |
| **Why chosen** | Type safety catches bugs at compile time. Single language means shared types, validation schemas, and utilities across all apps. Best AI coding support (Claude Code, Copilot) — TypeScript has the richest training data. Largest ecosystem of libraries and tools. |
| **Alternatives considered** | **Python (backend) + TypeScript (frontend):** Split stack means no shared code, two ecosystems to maintain. **Dart (Flutter) + TypeScript (web) + Node.js:** Flutter doesn't share the React mental model. **Go/Rust (backend):** Overkill for this stage; TypeScript on Node.js is fast enough and shares types with frontend. |

---

## Frontend — Web

### Next.js 14+ (App Router)

| | |
|---|---|
| **Purpose** | Web application framework — SSR for SEO pages, PWA for app-like experience |
| **Why chosen** | **SSR/SSG** for society and listing pages (critical for SEO — organic discovery is a key GTM channel). App Router provides React Server Components for performance. PWA support for offline browsing. Vercel-optimized but deployable on AWS. React ecosystem gives access to the largest component library ecosystem. |
| **Alternatives considered** | **Remix:** Good SSR but smaller ecosystem, less community support. **Astro:** Great for static sites but lacks the dynamic app capabilities needed for dashboards and CRM. **SvelteKit:** Excellent performance but smaller ecosystem; would lose code/knowledge sharing with React Native. |

---

## Frontend — Mobile

### React Native (Expo)

| | |
|---|---|
| **Purpose** | Native iOS + Android app from a single codebase |
| **Why chosen** | Shares TypeScript/React mental model with the web app — developers context-switch easily. Expo provides managed workflow: OTA updates (no app store review for JS changes), EAS Build for CI/CD, push notifications, camera, file system access. Single codebase for both platforms reduces development and maintenance cost. |
| **Alternatives considered** | **Flutter:** Excellent performance and beautiful UI, but uses Dart — no code sharing with web (Next.js) or API (NestJS). Separate language ecosystem. **Native (Swift + Kotlin):** Two separate codebases, 2x development cost, no code sharing. Only justified for highly performance-sensitive apps. **Capacitor/Ionic:** Web-view based, noticeable performance gap on complex UIs. |

---

## Backend

### Node.js + NestJS

| | |
|---|---|
| **Purpose** | Backend API framework — single API serving web, mobile, and admin |
| **Why chosen** | **NestJS** is the enterprise-grade TypeScript framework. Modular architecture with dependency injection makes it easy to organize 15+ feature modules. Built-in support for guards (RBAC), interceptors (caching, logging), pipes (validation), and middleware (rate limiting). Auto-generates Swagger/OpenAPI docs. Works perfectly with Prisma. Single API serves all clients — no need for separate services in Phase 1. |
| **Alternatives considered** | **Express.js:** Too minimal — no structure, no DI, no guards. Every project ends up building NestJS-like patterns manually. **Fastify:** Fast but same problem as Express — lacks architectural opinions. **tRPC:** Great for type-safe APIs but tightly couples frontend and backend; harder to support mobile clients. **Django/FastAPI (Python):** Would break the all-TypeScript stack. No shared types. |

---

## Database

### PostgreSQL (AWS RDS)

| | |
|---|---|
| **Purpose** | Primary relational database for all structured data |
| **Why chosen** | Relational data model fits perfectly (users, properties, transactions, leads all have clear relationships). **Full-text search** with GIN indexes handles property search without a separate search service in Phase 1. **PostGIS** extension for geo-based queries (find societies near a location). ACID compliant — critical for financial transactions (commissions). Mature, battle-tested, and free. AWS RDS provides managed backups, multi-AZ failover, and read replicas. |
| **Alternatives considered** | **MongoDB:** Schema-less is tempting but property/transaction data is highly relational. Aggregation pipelines for analytics are painful. No native full-text search with ranking. **MySQL:** Viable but lacks PostGIS and has weaker full-text search. PostgreSQL is simply better for this use case. **CockroachDB/PlanetScale:** Overkill for Phase 1 scale. Adds complexity without benefit at current size. |

---

## ORM

### Prisma

| | |
|---|---|
| **Purpose** | Type-safe database access layer with migration management |
| **Why chosen** | Auto-generates TypeScript types from the database schema — zero manual type definitions for DB models. Excellent migration system (version-controlled, reversible). Prisma Studio for visual data browsing during development. Works perfectly with NestJS and TypeScript. Query API is intuitive and prevents SQL injection. |
| **Alternatives considered** | **TypeORM:** Older, more established with NestJS, but TypeScript support is weaker (decorators-based, types can drift). Migration system is less reliable. **Drizzle ORM:** Newer, lighter-weight, SQL-like syntax. Less mature than Prisma, smaller ecosystem. Good alternative if Prisma becomes a bottleneck. **Knex.js:** Query builder, not a full ORM. Would need manual type definitions. More control but more boilerplate. |

---

## Caching

### Redis (AWS ElastiCache)

| | |
|---|---|
| **Purpose** | In-memory cache, session store, rate limiting, real-time pub/sub |
| **Why chosen** | Multi-purpose: caches search results and frequently accessed data, stores OTPs (with TTL), powers rate limiting (sliding window), serves as pub/sub backend for Socket.io horizontal scaling, and stores real-time presence data. AWS ElastiCache provides managed Redis with automatic failover. |
| **Alternatives considered** | **Memcached:** Simpler but lacks pub/sub, sorted sets, and TTL granularity needed for OTPs and rate limiting. **In-memory (Node.js):** Doesn't work with multiple API instances (no shared state). |

---

## Real-Time

### Socket.io

| | |
|---|---|
| **Purpose** | Real-time bidirectional communication — in-app chat, live notifications, lead updates |
| **Why chosen** | Battle-tested WebSocket library with automatic fallback to long-polling. Room support for society-level channels. Redis adapter for horizontal scaling across multiple API instances. Works with both web (browser) and React Native. Built-in reconnection, heartbeat, and binary support. |
| **Alternatives considered** | **Raw WebSockets:** Lower level, would need to build room management, reconnection, and scaling ourselves. **Pusher/Ably:** Managed services, but add cost and external dependency for a core feature. **Server-Sent Events (SSE):** One-directional only (server to client). Not suitable for chat. |

---

## Search

### PostgreSQL Full-Text Search + GIN Indexes

| | |
|---|---|
| **Purpose** | Property and society search with filters, ranking, and geo queries |
| **Why chosen** | No additional infrastructure needed — search runs on the same PostgreSQL database. GIN indexes on JSONB fields (amenities, restrictions) enable fast filter queries. `tsvector` + `tsquery` for full-text search with ranking. PostGIS for "societies near me" queries. Sufficient for Phase 1 scale (thousands of properties, not millions). |
| **Alternatives considered** | **Elasticsearch:** More powerful (fuzzy matching, faceted search, suggestions), but adds significant infrastructure complexity and cost. Planned for Phase 2 if search requirements grow. **Algolia:** Excellent search-as-a-service but expensive at scale and adds external dependency. **Meilisearch/Typesense:** Lighter alternatives to Elasticsearch but still separate infrastructure. |

---

## File Storage

### AWS S3 + CloudFront CDN

| | |
|---|---|
| **Purpose** | Store and serve property photos/videos, KYC documents, invoices, agreement PDFs |
| **Why chosen** | S3 is the industry standard for object storage — virtually unlimited, cheap, durable (99.999999999%). CloudFront CDN delivers images from edge locations across India with low latency. Pre-signed URLs allow direct client-to-S3 uploads (API server not bottlenecked by file transfers). Built-in encryption (AES-256). Lifecycle policies for cost optimization. |
| **Alternatives considered** | **Google Cloud Storage:** Equivalent, but rest of infra is on AWS — keeping everything in one cloud simplifies networking and billing. **Cloudinary/Imgix:** Great for image processing (resize, crop, optimization) but adds cost per transformation. Can add as a CDN layer in front of S3 later if needed. |

---

## Authentication

### Custom (NestJS + JWT + Phone OTP)

| | |
|---|---|
| **Purpose** | Phone-based OTP authentication with role-based access control |
| **Why chosen** | Phone OTP is the standard auth method for Indian consumer apps (higher penetration than email). JWT provides stateless auth — no session store needed for API calls. Custom implementation gives full control over token lifecycle, role embedding, and society-scoped access. NestJS guards integrate naturally with the RBAC system. |
| **Alternatives considered** | **Firebase Auth:** Handles OTP out of the box, but less control over JWT claims (roles, society_id). Would need to sync user data between Firebase and our DB. **Auth0/Clerk:** Full auth platform, but overkill for phone-only OTP. Adds cost and external dependency. **Passport.js:** Works with NestJS but it's a wrapper — we'd still write the OTP and JWT logic ourselves. |

**OTP Provider:** MSG91 (see [Integrations](./INTEGRATIONS.md))

---

## Email

### AWS SES (Simple Email Service)

| | |
|---|---|
| **Purpose** | Transactional emails — invoices, deal confirmations, verification updates |
| **Why chosen** | Cost-effective at scale ($0.10 per 1,000 emails). Already in AWS ecosystem — no additional vendor. High deliverability with SPF/DKIM/DMARC support. Simple API, works well with NestJS. |
| **Alternatives considered** | **SendGrid:** More features (email templates, analytics), but adds cost and external vendor. **Mailgun:** Similar to SendGrid. **Nodemailer + SMTP:** Low-level, would need to manage deliverability ourselves. |

---

## Push Notifications

### Firebase Cloud Messaging (FCM)

| | |
|---|---|
| **Purpose** | Push notifications for iOS, Android, and web |
| **Why chosen** | Free, reliable, industry standard. Works with Expo (via expo-notifications). Single API for all three platforms. Supports topics for broadcast notifications. |
| **Alternatives considered** | **OneSignal:** More analytics and segmentation, but adds cost for features we don't need in Phase 1. **AWS SNS:** Works but less developer-friendly for mobile push than FCM. |

---

## WhatsApp Notifications

### WhatsApp Business API (via Interakt/Wati)

| | |
|---|---|
| **Purpose** | Template-based notifications — lead alerts, visit reminders, deal status |
| **Why chosen** | WhatsApp is the primary communication channel in India. Template-based messages ensure compliance. Interakt/Wati provides easy integration with REST API, message templates, and delivery tracking. |
| **Alternatives considered** | **Direct WhatsApp Cloud API:** More control but requires Meta Business verification and managing template approval directly. **Twilio for WhatsApp:** Higher cost, less India-focused. |

---

## Masked Calling

### Exotel

| | |
|---|---|
| **Purpose** | Call masking — connects buyer/tenant with dealer without revealing phone numbers |
| **Why chosen** | Indian-focused platform used by Ola, Swiggy, and similar scale-ups. Provides call masking, call recording, IVR, and call logging via API. Reliable in India. |
| **Alternatives considered** | **Knowlarity:** Similar features, slightly smaller. **MyOperator:** Also viable, less API-mature. **Twilio:** More powerful globally but higher cost per call in India. |

---

## Payment Gateway

### Razorpay

| | |
|---|---|
| **Purpose** | Commission collection — UPI, cards, net banking |
| **Why chosen** | Indian-first payment gateway. Supports UPI (dominant payment method), cards, net banking, wallets. GST-compliant invoicing API. Easy integration. Used by most Indian startups. |
| **Alternatives considered** | **PayU:** Viable but less developer-friendly API. **Cashfree:** Good alternative, slightly less market share. **Stripe:** Best API globally but UPI support is limited in India. |

---

## PDF Generation

### Puppeteer (Server-side)

| | |
|---|---|
| **Purpose** | Generate GST invoices, commission reports, agreement PDFs |
| **Why chosen** | HTML templates → PDF. Full control over layout using HTML/CSS. Headless Chrome ensures pixel-perfect rendering. Can generate complex layouts (tables, headers, footers, page numbers). |
| **Alternatives considered** | **PDFKit:** Programmatic PDF generation — more lightweight but harder to design complex layouts. **jsPDF:** Client-side, less control. **WeasyPrint (Python):** Would break the TypeScript-only stack. |

---

## Excel/CSV Processing

### ExcelJS + Papa Parse

| | |
|---|---|
| **Purpose** | Bulk upload (CSV/Excel → properties), report export (data → Excel) |
| **Why chosen** | **ExcelJS** for reading/writing `.xlsx` files with formatting, multiple sheets, and formulas. **Papa Parse** for fast CSV parsing. Both are TypeScript-friendly and handle large files with streaming. |
| **Alternatives considered** | **SheetJS (xlsx):** Also viable, slightly less intuitive API. **csv-parse:** Alternative to Papa Parse, similar capabilities. |

---

## Monitoring & Error Tracking

### AWS CloudWatch + Sentry

| | |
|---|---|
| **Purpose** | Infrastructure metrics (CloudWatch) + application error tracking (Sentry) |
| **Why chosen** | **CloudWatch** monitors AWS infrastructure — ECS CPU/memory, RDS connections, ALB latency, S3 storage. Integrated with AWS, no additional setup. **Sentry** tracks application errors across web, mobile, and API with stack traces, breadcrumbs, and release tracking. Free tier is generous. |
| **Alternatives considered** | **Datadog:** More powerful but expensive. Better for Phase 2 when observability needs grow. **New Relic:** Similar to Datadog — powerful but costly. **Grafana + Prometheus:** Open-source alternative, but requires self-hosting and maintenance. |

---

## CI/CD

### GitHub Actions

| | |
|---|---|
| **Purpose** | Automated testing, linting, builds, and deployments |
| **Why chosen** | Native GitHub integration (code and CI in one place). Free for private repos (2,000 minutes/month). Supports matrix builds, caching, and parallel jobs. Large marketplace of actions. Works with Turborepo for cached, parallel task execution. |
| **Alternatives considered** | **GitLab CI:** Would require moving code to GitLab. **CircleCI:** Good but adds a separate vendor. **Jenkins:** Self-hosted, maintenance overhead. |

---

## Monorepo

### Turborepo

| | |
|---|---|
| **Purpose** | Manages web + mobile + API + shared packages in a single repository |
| **Why chosen** | Incremental builds — only rebuilds packages that changed. Remote caching — CI builds are fast because unchanged packages use cached artifacts. Parallel task execution. Works with pnpm workspaces. Minimal configuration. |
| **Alternatives considered** | **Nx:** More powerful (code generation, dependency graph visualization) but heavier configuration and learning curve. Better for very large teams. **Lerna:** Older, less actively maintained, primarily for npm publishing. **pnpm workspaces alone:** Works for dependency management but lacks build caching and parallel execution. |

---

## Package Manager

### pnpm

| | |
|---|---|
| **Purpose** | Package management for the monorepo |
| **Why chosen** | Fastest install times (content-addressable storage — no duplicate packages). Strict by default (prevents phantom dependencies). Native workspace support. Works perfectly with Turborepo. |
| **Alternatives considered** | **npm:** Slower, less strict, workspaces are less mature. **yarn (v3/berry):** Plug'n'Play can cause compatibility issues. Classic yarn is viable but slower than pnpm. |
