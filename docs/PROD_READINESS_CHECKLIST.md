# RDN — Production Readiness Checklist

> # ⚠️ SUPERSEDED — HISTORICAL DOCUMENT
>
> **RDN went live in production on 2026-07-14.** This checklist was written on 2026-06-21,
> before launch, and its open questions have since been answered. Do not plan from it.
>
> **For current state, use:**
>
> - [handover/05 — What is done](./handover/05-STATUS-WHAT-IS-DONE.md)
> - [handover/06 — Backlog by priority and impact](./handover/06-BACKLOG-PRIORITY-IMPACT.md)
>
> **What this document gets wrong, resolved since:**
>
> - §0 asks which production infrastructure to use. **Decided: all-AWS.** Terraform applied
>   2026-07-14; the Railway-plus-Vercel option became the UAT stack, not production.
> - §1 says AES-256-GCM field encryption is _not implemented_. **It is implemented and live**
>   — `packages/db/src/field-crypto.ts` and `field-encryption.ts`, with a blind index for
>   phone lookups.
> - §2 says the production domain and SSL are missing. **Done** — `rdnetwork.in` with ACM
>   certificates via Route53.
> - §3 secrets are in AWS Secrets Manager (`rdn/prod/api-keys`, `rdn/prod/db-credentials`,
>   `rdn/prod/jwt-secret`). Note that Razorpay, Firebase, SES, and Sentry values are still
>   absent — tracked in the handover backlog.
> - §6 says CloudWatch alarms fire into the void. **Fixed** — SNS topic `rdn-prod-alerts`
>   with a confirmed subscription to rajesh@rdngroups.com.
> - §8's AES field-encryption task is **complete**.
>
> **Still open from this document**, now carried in the handover backlog: an untested backup
> restore (P1-5), the undecided commission split (BIZ-1), and the undesignated DPO (BIZ-2).
>
> Retained for the reasoning it records about how launch decisions were made.

> **Created:** 2026-06-21
> **Branch at creation:** `chore/uat-prep-stabilization`
> **Status:** SUPERSEDED by go-live on 2026-07-14.
>
> Legend: ⛔ hard blocker · ⚠️ should-fix · ✅ done
>
> Related: [OPEN_ITEMS.md](./OPEN_ITEMS.md) · [uat-signoff-2026-05.md](./uat-signoff-2026-05.md) · [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) · [compliance/DPIA-v1.md](./compliance/DPIA-v1.md)

---

## 0. Infra decision (do FIRST — unblocks everything else)

- [ ] ⛔ **Decide prod infra target.** `deploy-prod.yml` + terraform target **AWS ECS**; UAT runs **Railway+Vercel**. Pick one.
  - **Recommendation:** Launch on **Railway + Vercel + managed Postgres** (fast, no dedicated devops). Migrate to AWS terraform later when scale/compliance demands.
  - If Railway+Vercel → rewrite `deploy-prod.yml` off AWS (drop ECR/ECS/migrate-job, point web at Vercel prod project, API at Railway).
  - If AWS → complete §2 AWS items below.
  - Compliance caveat for Railway: must enable §3 AES field-encryption + Railway automated backups (PII/KYC under DPDP).

---

## 1. Security hardening

### Done this session (uncommitted on `chore/uat-prep-stabilization`)

- [x] ✅ OTP bypass refuses to boot in prod — `apps/api/src/modules/auth/services/otp.service.ts` (+ spec)
- [x] ✅ JWT fail-fast in prod (no dev-secret fallback) — `apps/api/src/config/jwt.config.ts`
- [x] ✅ Seed refuses prod unless `ALLOW_PROD_SEED=true` — `packages/db/prisma/seed.ts`
- [x] ✅ helmet security headers — `apps/api/src/main.ts`
- [x] ✅ Swagger disabled in prod — `apps/api/src/main.ts`
- [x] ✅ S3 CORS `["*"]`→`var.cors_allowed_origins` + bucket SSE (AES256) — `infrastructure/terraform/s3.tf`, `variables.tf`

### Remaining

- [ ] ⛔ **AES-256-GCM field encryption** — promised in CLAUDE.md for phone/KYC/bank; **NOT implemented**. Phone is the login lookup key → needs deterministic hash (HMAC) for lookups + encrypted column for display + data migration. Own task (see §8).
- [ ] ⚠️ Commit + push this session's fixes (not yet committed).
- [ ] ⚠️ Confirm app boots clean with helmet + Sentry filter wired (runtime smoke vs live DB/Redis — only build+tests verified so far).
- [ ] ⚠️ Review CSP — helmet default CSP may block web/S3/CDN assets; tune `helmet({ contentSecurityPolicy })` if needed.

---

## 2. Infrastructure & deploy

- [ ] ⛔ **Prod domain + SSL.** `prod.tfvars` missing `domain_name` → ACM cert + HTTPS listener won't provision (`alb.tf:42`). Buy/assign domain, set `domain_name` in `environments/prod.tfvars`, DNS records.
- [ ] ⛔ Set `cors_allowed_origins` in `prod.tfvars` to the prod web URL (default still `["*"]`).
- [ ] ⚠️ Decide CDN (CloudFront if AWS; Vercel/Cloudflare otherwise) for media + web.
- [ ] ⚠️ Delete stale Railway duplicate services `mobile` + `web` (web is on Vercel) — per project memory.
- [ ] ⚠️ Confirm migrate-on-boot path for chosen target (Dockerfile.api runs `prisma migrate deploy` on boot; deploy-prod.yml also has a migrate job — avoid double-run confusion).

---

## 3. Secrets & config (prod)

- [ ] ⛔ **Rotate ALL secrets fresh for prod** — JWT_SECRET, JWT_REFRESH_SECRET, DB password, API keys. UAT creds leaked in past chats; never reuse.
- [ ] ⛔ Set required prod env (see `apps/api/.env.example`):
  - [ ] JWT_SECRET, JWT_REFRESH_SECRET (strong, unique — API refuses boot if unset in prod)
  - [ ] MSG91_AUTH_KEY, MSG91_TEMPLATE_ID (OTP)
  - [ ] FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT (push; lib `firebase-admin` already installed)
  - [ ] RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET (payments — see §5)
  - [ ] EXOTEL\_\* (masked calling)
  - [ ] AWS_SES_FROM_EMAIL + SES creds (email)
  - [ ] AWS S3/R2 creds + bucket
  - [ ] SENTRY_DSN (error tracking)
  - [ ] ALLOWED_ORIGINS = prod web URL(s)
  - [ ] OTP_DEV_BYPASS **unset/false** (boot fails if `true` in prod)
- [ ] ⚠️ Store via AWS Secrets Manager (AWS path) or Railway/Vercel env (managed path) — never `.env` in repo.

---

## 4. Compliance (DPDP Act 2023)

- [ ] ⛔ **Designate DPO / Grievance Officer** — `compliance/DPIA-v1.md:6` placeholder. Add real name + contact to DPIA, INCIDENT_RESPONSE.md, and `/grievance` web page.
- [ ] ⛔ AES field-encryption (same as §1) — DPDP exposure if PII plaintext.
- [ ] ⚠️ Verify `/privacy` + `/terms` + `/grievance` web pages live and match store-privacy-answers.md.
- [ ] ⚠️ Confirm RetentionCron (`admin/retention.cron.ts`) runs in prod + retention windows match RETENTION_POLICY.md.
- [ ] ⚠️ Image moderation strategy (OPEN_ITEMS — medium).

---

## 5. Business decisions (block features, not infra)

- [ ] ⛔ **Commission split RDN/Dealer/RWA %** — UNDECIDED. Blocks settlement/payout/RWA-earnings. Once set: wire configurable rates + Razorpay payout. (Launch option: ship without live settlement, manual/offline ops.)
- [ ] ⚠️ Property verification service pricing (who pays / how much) — revenue line, not core.
- [ ] ⚠️ Demand-gen budget + ops team size (non-technical, OPEN_ITEMS §3/§4).

---

## 6. Observability & ops

- [x] ✅ API Sentry wired (no-op without DSN) — set SENTRY_DSN to activate.
- [ ] ⚠️ Route CloudWatch alarms → SNS topic → email/Slack (alarms fire into void now — `cloudwatch-alarms.tf` has no subscriptions).
- [ ] ⚠️ Confirm health check (`/v1/health`) green behind LB.
- [ ] ⚠️ Web + mobile Sentry DSN set (mobile already has @sentry/react-native).

---

## 7. Database & backups

- [ ] ⛔ **Backup + restore tested end-to-end against a prod-like snapshot** (UAT-only tested per uat-signoff). Document procedure.
- [ ] ⚠️ Confirm backup retention (terraform prod RDS = 7 days) / Railway automated backups enabled.
- [ ] ⚠️ Write prod disaster-recovery / rollback runbook (uat-runbook covers UAT only).
- [ ] ⚠️ Confirm seed.ts / seed-uat.ts / seed-gurgaon.ts never run against prod (guard added; verify deploy doesn't call seed).

---

## 8. Follow-up engineering task: AES-256-GCM field encryption (own ticket)

Scope (biggest remaining eng item):

- Crypto util (encrypt/decrypt AES-256-GCM, key from env/Secrets Manager).
- Sensitive fields: phone, KYC, bank details, nominee phone.
- Phone is login lookup → add HMAC/deterministic-hash column for equality search; encrypted column for storage/display.
- Prisma schema migration + backfill migration for existing rows.
- Update all read/write paths + masked-comms (Exotel) flow.
- Tests for round-trip + lookup-by-hash.

---

## Quick "how close" snapshot

- Code-side hardening: ~70% after this session.
- Critical path to launch: **infra decision → domain/SSL → secrets rotation → AES encryption → commission decision → DPO.**
- Test/build state at checkpoint: 135 api tests + typecheck + build green.
