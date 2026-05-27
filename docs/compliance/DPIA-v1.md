# Data Protection Impact Assessment (DPIA) — v1.0

**System:** RDN (Residential Dealer Network)
**Date:** 2026-05-27
**Reviewer:** [Grievance Officer / DPO — to be designated]
**Applicable law:** Digital Personal Data Protection Act, 2023 (India) and Rules 2026

## 1. Purpose of processing

RDN operates a society-scoped real-estate marketplace connecting RWAs, resident dealers, property owners, and prospective buyers/tenants. Personal data is processed to:

- Authenticate users (phone OTP)
- List, search, and rent/sell residential properties
- Facilitate masked communication (chat + voice routing)
- Process commission payments
- Send transactional and (with consent) marketing notifications
- Handle grievances and disputes

## 2. Data inventory

| Category            | Examples                                           | Lawful basis                   | Sensitivity |
| ------------------- | -------------------------------------------------- | ------------------------------ | ----------- |
| Identity            | phone (mandatory), name, email, role               | Consent + service performance  | Medium      |
| Society affiliation | society_id, flat_number, tower_block               | Consent                        | Low         |
| Property data       | address, photos, price, amenities                  | Consent + listing performance  | Low         |
| Dealer KYC          | bank account, ID proofs (encrypted)                | Consent + regulatory (RBI KYC) | **High**    |
| Communications      | chat messages, call metadata (not recordings)      | Service performance            | Medium      |
| Device              | FCM token, app version, IP, coarse location        | Consent                        | Low         |
| Payments            | transaction status, amount (card/UPI via Razorpay) | Service performance + tax      | Medium      |
| Audit logs          | actor, action, entity, timestamp                   | Legitimate use (fraud, audit)  | Low         |

## 3. Data flows

```
[User device] ──HTTPS──► [Vercel CDN] ──► [Next.js web] ──► [Railway/AWS] ──► [Postgres RDS Mumbai]
              ──HTTPS──► [NestJS API]       │
                                            ├──► [S3 Mumbai + CloudFront] (media)
                                            ├──► [Redis ElastiCache] (sessions)
                                            ├──► [MSG91] (OTP)
                                            ├──► [FCM Google US] (push)
                                            ├──► [Razorpay] (payments)
                                            ├──► [Exotel] (masked calls)
                                            ├──► [Interakt] (WhatsApp)
                                            ├──► [AWS SES] (email)
                                            └──► [Sentry US/EU] (crash, PII scrubbed)
```

Cross-border transfer: Firebase (US) and Sentry (US/EU) only. Disclosed in privacy notice.

## 4. Risks identified

| #   | Risk                                              | Likelihood | Impact   | Mitigation                                                                             |
| --- | ------------------------------------------------- | ---------- | -------- | -------------------------------------------------------------------------------------- |
| R1  | Phone number leak via API logs                    | Med        | High     | PII scrub interceptor; never log request bodies; Sentry beforeSend redacts             |
| R2  | KYC/bank details breach                           | Low        | Critical | App-layer AES-256-GCM encryption; restricted DB IAM; field-level access logging        |
| R3  | Account takeover via SIM swap                     | Med        | High     | OTP rate-limiting; refresh-token rotation; device-binding on suspicious login (future) |
| R4  | Dealer impersonation                              | Low        | High     | KYC + RWA approval workflow; in-app verified badge                                     |
| R5  | Cross-tenant data leak (society A sees society B) | Low        | High     | Society-scoped middleware; e2e tests on RBAC guards                                    |
| R6  | Improper retention (data held beyond purpose)     | Med        | Med      | Retention policy doc + cron-enforced purge (planned)                                   |
| R7  | Consent not granular                              | High       | Med      | Granular ConsentRecord ledger per purpose; withdrawal recorded for audit               |
| R8  | Failure to honor erasure                          | Low        | High     | DELETE /users/me endpoint; cascade anonymization; 30-day grace + hard purge            |
| R9  | Breach not reported in 72h                        | Med        | Critical | INCIDENT_RESPONSE.md runbook; on-call rota                                             |
| R10 | Children's data processed                         | Low        | High     | 18+ age gate at signup + ToS clause                                                    |

## 5. Mitigations implemented (this release)

- [x] App-layer AES-256-GCM for KYC, bank, phone (existing)
- [x] PII scrub in HTTP exception filter (`apps/api/src/common/utils/pii-scrub.ts`)
- [x] Sentry init with `beforeSend` PII redaction (mobile)
- [x] ConsentRecord ledger per-purpose, append-only
- [x] Account deletion endpoint (`DELETE /users/me`) — soft delete + scrub + device-token purge
- [x] Data export endpoint (`GET /users/me/data-export`) — JSON portability
- [x] DpdpGrievance model + public submission endpoint
- [x] Grievance Officer designated in privacy notice (placeholder pending real designation)

## 6. Mitigations pending

- [ ] Designate real Grievance Officer (replace placeholders in privacy.tsx)
- [ ] Email notification to officer on grievance submission
- [ ] Retention purge cron (`apps/api/src/modules/...`) — currently no automatic purge
- [ ] Per-society middleware re-audit (manual code review)
- [ ] Hindi + 1 regional language for privacy notice
- [ ] Detox/Maestro E2E for RBAC

## 7. Residual risk

After mitigations, residual risk is rated **Medium**. Highest residual risks are R3 (SIM swap) and R6 (retention enforcement). Both have planned mitigations in Q3.

## 8. Approval

- [ ] Grievance Officer signoff
- [ ] CTO signoff
- [ ] Re-review on major schema change or new third-party integration

## 9. Revision history

| Date       | Version | Author      | Notes                             |
| ---------- | ------- | ----------- | --------------------------------- |
| 2026-05-27 | 1.0     | Engineering | Initial DPIA before public launch |
