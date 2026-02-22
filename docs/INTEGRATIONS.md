# RDN — Third-Party Integrations

> **Version:** 1.0
> **Last Updated:** 2026-02-22
>
> Related Documents:
> - [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
> - [Tech Stack](./TECH_STACK.md)
> - [PRD](./PRD.md)

---

## Overview

RDN integrates with several third-party services for communication, payments, notifications, and infrastructure. This document covers each integration — what account is needed, what it does, where it's configured, and how to set it up.

---

## 1. Exotel — Masked Calling

| | |
|---|---|
| **Purpose** | Call masking between buyers/tenants and dealers. No phone numbers are ever shared between parties. Also provides call recording for dispute resolution and compliance. |
| **Account needed** | Exotel business account (https://exotel.com). Requires business registration and KYC. |
| **Features used** | Virtual number provisioning, call masking (connect two parties without revealing numbers), call recording, call logs via API, IVR (optional). |
| **Pricing model** | Per-minute call charges + virtual number rental. Usage-based — see Exotel pricing page. |

**Configuration:**
- `EXOTEL_SID` — Account SID
- `EXOTEL_API_KEY` — API key
- `EXOTEL_API_TOKEN` — API token
- `EXOTEL_CALLER_ID` — Virtual number used as caller ID

**Config location:** AWS Secrets Manager → injected as environment variables into NestJS API

**Code location:** `apps/api/src/modules/communication/call.service.ts`

**Setup steps:**
1. Sign up for Exotel business account
2. Complete business KYC verification
3. Purchase virtual phone number(s) for call masking
4. Generate API credentials from Exotel dashboard
5. Store credentials in AWS Secrets Manager
6. Configure environment variables in ECS task definition

---

## 2. MSG91 — OTP / SMS

| | |
|---|---|
| **Purpose** | Send OTP for phone-based authentication. Also used for transactional SMS notifications. |
| **Account needed** | MSG91 account (https://msg91.com). Requires DLT registration for SMS in India. |
| **Features used** | OTP API (send, verify, resend), transactional SMS, delivery reports. |
| **Pricing model** | Per-SMS pricing. OTP API has a bundled plan. |

**Configuration:**
- `MSG91_AUTH_KEY` — Authentication key
- `MSG91_TEMPLATE_ID` — DLT-approved OTP template ID
- `MSG91_SENDER_ID` — 6-character sender ID (e.g., "RDNAPP")

**Config location:** AWS Secrets Manager → environment variables

**Code location:** `apps/api/src/modules/auth/auth.service.ts`

**Setup steps:**
1. Sign up for MSG91 account
2. Complete DLT registration (mandatory for SMS in India)
3. Register SMS templates on DLT portal and get them approved
4. Create sender ID
5. Get auth key from MSG91 dashboard
6. Store credentials in AWS Secrets Manager

**Alternative:** Firebase Auth can also handle OTP but gives less control over JWT claims.

---

## 3. Firebase Cloud Messaging (FCM) — Push Notifications

| | |
|---|---|
| **Purpose** | Push notifications to iOS, Android, and web browsers — lead alerts, visit reminders, deal updates. |
| **Account needed** | Firebase project (https://console.firebase.google.com). Free. |
| **Features used** | Cloud Messaging (FCM) — send to individual devices, topics (broadcast), and device groups. |
| **Pricing model** | Free (unlimited messages). |

**Configuration:**
- `FIREBASE_PROJECT_ID` — Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Service account JSON (for server-side sending)
- Client-side: `google-services.json` (Android), `GoogleService-Info.plist` (iOS)

**Config location:**
- Server: AWS Secrets Manager (service account key)
- Mobile: `apps/mobile/` app config files
- Web: `apps/web/public/firebase-messaging-sw.js` (service worker)

**Code location:** `apps/api/src/modules/notifications/push.service.ts`

**Setup steps:**
1. Create Firebase project in Firebase Console
2. Enable Cloud Messaging
3. Download service account key (Settings → Service Accounts → Generate Key)
4. Store key in AWS Secrets Manager
5. Add `google-services.json` to Android config
6. Add `GoogleService-Info.plist` to iOS config
7. Configure Expo push notification setup in `apps/mobile/`
8. Set up web push service worker in `apps/web/`

---

## 4. WhatsApp Business API (via Interakt/Wati) — WhatsApp Notifications

| | |
|---|---|
| **Purpose** | Send template-based WhatsApp messages — lead notifications, visit reminders, deal status alerts, renewal reminders. Actual conversations stay in-app for record-keeping. |
| **Account needed** | WhatsApp Business API account via a Business Solution Provider (BSP) like Interakt (https://interakt.shop) or Wati (https://wati.io). Requires Meta Business verification. |
| **Features used** | Template messages (pre-approved by Meta), delivery/read receipts, webhook for incoming messages (optional). |
| **Pricing model** | Per-conversation pricing (Meta's pricing) + BSP platform fee. |

**Configuration:**
- `WHATSAPP_API_KEY` — BSP API key
- `WHATSAPP_API_URL` — BSP API endpoint
- `WHATSAPP_PHONE_NUMBER_ID` — Registered WhatsApp business number

**Config location:** AWS Secrets Manager → environment variables

**Code location:** `apps/api/src/modules/notifications/whatsapp.service.ts`

**Setup steps:**
1. Sign up with BSP (Interakt or Wati)
2. Complete Meta Business verification
3. Register a phone number for WhatsApp Business
4. Create and submit message templates for Meta approval
5. Get API credentials from BSP dashboard
6. Store credentials in AWS Secrets Manager
7. Configure webhook URL for delivery status callbacks

**Required templates (submit for approval):**
- Lead notification: "You have a new enquiry for [property] at [society]"
- Visit reminder: "Reminder: Property visit at [society] on [date] at [time]"
- Deal closed: "Congratulations! Your deal for [property] has been closed"
- Renewal reminder: "Your lease for [property] expires on [date]. Renew through RDN"
- Dealer application status: "Your dealer application for [society] has been [approved/rejected]"
- RWA onboarding status: "Your society [name] has been [verified/needs more info]"

---

## 5. Razorpay — Payment Gateway

| | |
|---|---|
| **Purpose** | Collect commission payments — UPI, cards, net banking. Generate payment links and handle refunds. |
| **Account needed** | Razorpay business account (https://razorpay.com). Requires business registration, PAN, bank account. |
| **Features used** | Payment Links (for commission collection), Payment Gateway (for inline checkout), Invoicing API, Refunds API, Webhooks (payment status updates). |
| **Pricing model** | 2% per transaction (standard rate). No setup fee. |

**Configuration:**
- `RAZORPAY_KEY_ID` — API key ID
- `RAZORPAY_KEY_SECRET` — API key secret
- `RAZORPAY_WEBHOOK_SECRET` — Webhook signature verification secret

**Config location:** AWS Secrets Manager → environment variables

**Code location:** `apps/api/src/modules/commission/payment.service.ts`

**Setup steps:**
1. Sign up for Razorpay business account
2. Complete business KYC (PAN, GST, bank account)
3. Generate API keys from Razorpay Dashboard → Settings → API Keys
4. Configure webhook endpoint and get webhook secret
5. Store credentials in AWS Secrets Manager
6. Implement webhook handler for payment status callbacks
7. Set up Razorpay test mode for development environment

**Webhook events to handle:**
- `payment.captured` — commission payment successful
- `payment.failed` — payment failed (trigger retry notification)
- `refund.processed` — refund completed

---

## 6. AWS SES — Email

| | |
|---|---|
| **Purpose** | Transactional emails — invoices, deal confirmations, verification status updates, password reset (if email auth added later). |
| **Account needed** | AWS account with SES enabled. Must request production access (sandbox mode limits sending to verified emails only). |
| **Features used** | Send email API, email templates, delivery/bounce tracking. |
| **Pricing model** | $0.10 per 1,000 emails sent. |

**Configuration:**
- `AWS_SES_REGION` — SES region (e.g., `ap-south-1` for Mumbai)
- `SES_FROM_EMAIL` — Verified sender email (e.g., `noreply@rdn.com`)
- AWS IAM role attached to ECS task (no explicit credentials needed)

**Config location:** AWS IAM role + environment variables

**Code location:** `apps/api/src/modules/notifications/email.service.ts`

**Setup steps:**
1. Verify sending domain in SES (rdn.com)
2. Set up SPF, DKIM, DMARC DNS records for deliverability
3. Request production access (move out of sandbox)
4. Create email templates in SES or manage in code (HTML templates)
5. Configure IAM role for ECS tasks with `ses:SendEmail` permission

---

## 7. AWS S3 — File Storage

| | |
|---|---|
| **Purpose** | Store property photos/videos, KYC documents, invoices, agreement PDFs. |
| **Account needed** | AWS account. |
| **Features used** | Object storage, pre-signed URLs (direct client upload), lifecycle policies, server-side encryption. |
| **Pricing model** | ~$0.023/GB/month (S3 Standard). Transfer out via CloudFront is cheaper than direct S3. |

**Configuration:**
- `S3_BUCKET_NAME` — Bucket name (e.g., `rdn-prod-media`)
- `S3_REGION` — Bucket region (`ap-south-1`)
- `CLOUDFRONT_DISTRIBUTION_ID` — CDN distribution
- `CLOUDFRONT_DOMAIN` — CDN domain for serving files
- AWS IAM role attached to ECS task

**Config location:** Environment variables + IAM role

**Code location:** `apps/api/src/modules/media/media.service.ts`

**Bucket structure:**
```
rdn-prod-media/
├── properties/{property_id}/
│   ├── photos/
│   └── videos/
├── kyc/{user_id}/
│   ├── aadhaar.pdf
│   └── pan.pdf
├── invoices/{transaction_id}/
│   ├── buyer-invoice.pdf
│   └── seller-invoice.pdf
├── agreements/{society_id}/
│   └── mandate-agreement.pdf
└── avatars/{user_id}/
    └── profile.jpg
```

**Setup steps:**
1. Create S3 bucket with server-side encryption (AES-256)
2. Configure CORS policy for direct browser uploads
3. Set up lifecycle policies (move old files to S3-IA after 90 days)
4. Create CloudFront distribution pointing to S3 bucket
5. Configure IAM role for ECS with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
6. Set up pre-signed URL generation in media service

---

## 8. AWS CloudFront — CDN

| | |
|---|---|
| **Purpose** | Fast content delivery of property images, videos, and static assets across India. |
| **Account needed** | AWS account (same as S3). |
| **Features used** | Edge caching, HTTPS, custom domain, cache invalidation. |
| **Pricing model** | ~$0.14/GB for India (first 10TB/month). |

**Setup steps:**
1. Create CloudFront distribution with S3 as origin
2. Configure custom domain (e.g., `media.rdn.com`)
3. Set up SSL certificate via AWS Certificate Manager
4. Configure cache behaviors (images: long TTL, HTML: short TTL)
5. Set up Origin Access Identity (OAI) so S3 is only accessible via CloudFront

---

## 9. AWS RDS — Managed PostgreSQL

| | |
|---|---|
| **Purpose** | Managed PostgreSQL database with automated backups, failover, and read replicas. |
| **Account needed** | AWS account. |
| **Features used** | Multi-AZ deployment (prod), read replicas, automated backups, encryption at rest, performance insights. |
| **Pricing model** | Instance-based (see [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) for cost estimates). |

**Configuration:**
- `DATABASE_URL` — PostgreSQL connection string
- Managed via Terraform (see `infrastructure/terraform/modules/rds/`)

---

## 10. AWS ElastiCache — Managed Redis

| | |
|---|---|
| **Purpose** | Managed Redis for caching, session store, rate limiting, OTP storage, Socket.io pub/sub. |
| **Account needed** | AWS account. |
| **Features used** | Redis cluster mode, automatic failover, encryption in transit. |
| **Pricing model** | Instance-based (see [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) for cost estimates). |

**Configuration:**
- `REDIS_URL` — Redis connection string
- Managed via Terraform (see `infrastructure/terraform/modules/elasticache/`)

---

## 11. Sentry — Error Tracking

| | |
|---|---|
| **Purpose** | Application error tracking and monitoring across web, mobile, and API. |
| **Account needed** | Sentry account (https://sentry.io). Free tier: 5,000 errors/month. |
| **Features used** | Error capture with stack traces, breadcrumbs, release tracking, performance monitoring, issue assignment. |
| **Pricing model** | Free tier (5K errors/month). Team plan starts at $26/month. |

**Configuration:**
- `SENTRY_DSN` — Data Source Name (per project — one for API, one for web, one for mobile)
- `SENTRY_AUTH_TOKEN` — For source map uploads in CI

**Config location:** Environment variables

**Code locations:**
- API: `apps/api/src/main.ts` (Sentry NestJS integration)
- Web: `apps/web/sentry.client.config.ts`, `apps/web/sentry.server.config.ts`
- Mobile: `apps/mobile/app/_layout.tsx` (Sentry React Native integration)

**Setup steps:**
1. Create Sentry account and organization
2. Create three projects: `rdn-api`, `rdn-web`, `rdn-mobile`
3. Get DSN for each project
4. Install Sentry SDKs in each app
5. Configure source map uploads in CI (GitHub Actions)
6. Set up alert rules for critical errors

---

## 12. GitHub — Code Repository & CI/CD

| | |
|---|---|
| **Purpose** | Source code hosting, pull request reviews, CI/CD via GitHub Actions. |
| **Account needed** | GitHub organization account. |
| **Features used** | Git repository, pull requests, code review, GitHub Actions (CI/CD), Dependabot (dependency security), branch protection rules. |
| **Pricing model** | Free for public repos. Team plan ($4/user/month) for private repos with advanced features. |

**Setup steps:**
1. Create GitHub organization
2. Create repository (private)
3. Configure branch protection rules (require PR reviews, CI passing)
4. Enable Dependabot for security updates
5. Set up GitHub Actions workflows (see `PROJECT_STRUCTURE.md`)
6. Store deployment secrets in GitHub Secrets

---

## Integration Architecture

```
                    ┌──────────────┐
                    │  NestJS API  │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                       │
   Communication      Notifications            Payments
        │                  │                       │
   ┌────┴────┐    ┌───────┼───────┐          ┌────┴────┐
   │ Exotel  │    │       │       │          │Razorpay │
   │ (Calls) │    │    ┌──┴──┐   │          │(UPI,Cards│
   └─────────┘    │    │ FCM │   │          │Net Bank) │
                  │    │(Push)│   │          └─────────┘
             ┌────┘    └─────┘   └────┐
             │                        │
        ┌────┴────┐             ┌─────┴────┐
        │ MSG91   │             │WhatsApp  │
        │(OTP/SMS)│             │(Template │
        └─────────┘             │Messages) │
                                └──────────┘
```

---

## Environment Variables Summary

All secrets stored in **AWS Secrets Manager** and injected into ECS task definitions. Development uses `.env.local` files (gitignored).

| Variable | Service | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL (RDS) | Yes |
| `REDIS_URL` | Redis (ElastiCache) | Yes |
| `JWT_SECRET` | Custom auth | Yes |
| `JWT_REFRESH_SECRET` | Custom auth | Yes |
| `EXOTEL_SID` | Exotel | Yes |
| `EXOTEL_API_KEY` | Exotel | Yes |
| `EXOTEL_API_TOKEN` | Exotel | Yes |
| `EXOTEL_CALLER_ID` | Exotel | Yes |
| `MSG91_AUTH_KEY` | MSG91 | Yes |
| `MSG91_TEMPLATE_ID` | MSG91 | Yes |
| `MSG91_SENDER_ID` | MSG91 | Yes |
| `FIREBASE_PROJECT_ID` | Firebase | Yes |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase | Yes |
| `WHATSAPP_API_KEY` | WhatsApp BSP | Yes |
| `WHATSAPP_API_URL` | WhatsApp BSP | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp BSP | Yes |
| `RAZORPAY_KEY_ID` | Razorpay | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay | Yes |
| `S3_BUCKET_NAME` | AWS S3 | Yes |
| `S3_REGION` | AWS S3 | Yes |
| `CLOUDFRONT_DOMAIN` | AWS CloudFront | Yes |
| `AWS_SES_REGION` | AWS SES | Yes |
| `SES_FROM_EMAIL` | AWS SES | Yes |
| `SENTRY_DSN` | Sentry | Yes |
| `SENTRY_AUTH_TOKEN` | Sentry | CI only |

---

## Account Setup Checklist

Before development can begin, the following accounts must be created:

- [ ] **AWS Account** — RDS, ElastiCache, S3, CloudFront, SES, ECS, ALB, Secrets Manager, CloudWatch
- [ ] **Exotel Account** — business KYC, virtual number purchase
- [ ] **MSG91 Account** — DLT registration, template approval, sender ID
- [ ] **Firebase Project** — Cloud Messaging enabled, service account key generated
- [ ] **WhatsApp BSP Account** (Interakt/Wati) — Meta Business verification, template approval
- [ ] **Razorpay Account** — business KYC, API keys, webhook configuration
- [ ] **Sentry Account** — organization created, three projects (api, web, mobile)
- [ ] **GitHub Organization** — repository created, Actions configured, Dependabot enabled
- [ ] **Domain Registration** — `rdn.com` (or chosen domain), DNS configured
- [ ] **Apple Developer Account** — for iOS App Store submission ($99/year)
- [ ] **Google Play Console** — for Android Play Store submission ($25 one-time)
