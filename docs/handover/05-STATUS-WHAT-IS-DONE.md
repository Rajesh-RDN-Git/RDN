# 05 — What Is Done

> **How to read the state column.** These words are used precisely, because "done" without
> qualification is how handovers go wrong.
>
> - **Live** — deployed to production and exercised against real usage or a direct check.
> - **Deployed, unverified in production** — the code is in production; nobody has confirmed
>   the behaviour end to end with real users or real data.
> - **Built, not configured** — the code is complete and tested, but a credential, key, or
>   business decision is missing, so the feature does nothing in production.
> - **Partial** — some surfaces done, others not. The gap is named.
> - **Not started** — designed in the PRD, no code.
>
> Evidence for the infrastructure claims was read from live AWS on 2026-07-22. Feature-level
> claims trace to commits on `main` and to the project's session records.

---

## Platform state at a glance

|                       |                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Production web        | Live — https://www.rdnetwork.in returns 200                                                       |
| Production API        | Live — https://api.rdnetwork.in/v1/health returns 200                                             |
| ECS service           | `rdn-prod-api`, ACTIVE, 2 of 2 tasks running, one deployment, task definition `:3`                |
| Deployed image        | `prod-1784fc0…` (also tagged `latest` and `prod-latest`), pushed 2026-07-21                       |
| Database              | RDS `rdn-prod`, PostgreSQL 16.14, multi-AZ, encrypted, 7-day backups, **deletion protection off** |
| Swagger on production | Correctly returns 404 — API docs are disabled outside development                                 |
| API test suite        | 218 passing at handover                                                                           |
| Mobile app            | Built, **not submitted** to either store                                                          |

---

## Feature matrix

| Capability                                  | API module              | Web                | Mobile      | State                                                                                                                   |
| ------------------------------------------- | ----------------------- | ------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| Phone OTP login and registration            | `auth`                  | Yes                | Yes         | **Live** — real handsets receive OTPs; production login confirmed 2026-07-20                                            |
| Society directory and profiles              | `societies`             | Yes (SSR, SEO)     | Yes         | **Live**                                                                                                                |
| Property listings and 6-step listing wizard | `properties`            | Yes                | Yes         | **Live** — both wizards ported and working                                                                              |
| Search with filters                         | `search`                | Yes                | Yes         | **Partial** — the availability filter exists on web but is missing on mobile                                            |
| Media upload (S3 pre-signed)                | `media`                 | Yes                | Yes         | **Live** — fixed 2026-07-21; previously every production upload was silently discarded                                  |
| Lead capture and CRM pipeline               | `leads`                 | Yes                | Yes         | **Live** — includes deduplication and full status dropdown                                                              |
| Dealer assignment (auto and manual)         | `properties`, `dealers` | Yes                | **Partial** | Auto-assign on create is live; the manual override UI exists on web only                                                |
| Masked calling                              | `communication`         | Yes                | Yes         | **Built, not configured** — credentials are set, but Exotel KYC is incomplete so every call fails                       |
| Chat and WebSocket messaging                | `communication`         | Yes                | Yes         | **Deployed, unverified in production** — hardened in the security audit (origin allowlist, server-derived participants) |
| Push notifications (FCM)                    | `notifications`         | —                  | Yes         | **Built, not configured** — no Firebase credentials in the production task definition                                   |
| Transactional email (SES)                   | `notifications`         | —                  | —           | **Built, not configured** — no `AWS_SES_FROM_EMAIL` in the production task definition                                   |
| Commission calculation and GST extraction   | `commission`            | Yes                | Yes         | **Built, blocked** — the RDN/dealer/RWA split is undecided, so settlement and payout cannot run                         |
| Payments (Razorpay)                         | `commission`            | —                  | —           | **Built, not configured** — keys are empty; also missing signature verification and idempotency                         |
| Transactions and deal closure               | `transactions`          | Yes                | Yes         | **Deployed, unverified in production**                                                                                  |
| Verification workflows                      | `verification`          | Yes                | Yes         | **Deployed, unverified in production**                                                                                  |
| Grievance redressal (internal)              | `grievance`             | Yes                | Yes         | **Live**                                                                                                                |
| DPDP public grievance channel               | `grievance`             | Yes (`/grievance`) | Yes         | **Live**, but the endpoint is currently unvalidated — see [06](./06-BACKLOG-PRIORITY-IMPACT.md)                         |
| Referral system                             | `referral`              | Yes                | Yes         | **Deployed, unverified in production**                                                                                  |
| Reports and dashboards                      | `reports`               | Yes                | Yes         | **Partial** — role dashboards are richest for dealer and super-admin                                                    |
| Super-admin user role editor                | `admin`                 | Yes                | Yes         | **Live** — `PATCH /admin/users/:id/role`, deployed 2026-07-20                                                           |
| DPDP self-service (delete, export, consent) | `users`                 | Yes                | Yes         | **Live**                                                                                                                |
| Data retention cron                         | `admin`                 | —                  | —           | **Deployed, unverified in production** — scheduled job, never observed running in production                            |
| Error tracking (Sentry)                     | —                       | —                  | —           | **Built, not configured** on the production API. PII scrubbing is implemented and waiting for a DSN                     |
| Society OS / Phase 2                        | —                       | —                  | —           | **Not started**                                                                                                         |

---

## Shipped since go-live (2026-07-14 onward)

Everything here is on `main` and deployed to production.

**Security remediation — three deployed batches**, from a 27-finding audit (3 critical, 10
high, 7 medium, 7 low), each fix written test-first:

- `9d959d8` — registered the throttler guard as a global guard and set `trust proxy`; this
  mattered because `@Throttle` decorators had been silently inert, leaving OTP endpoints with
  no rate limit at all. Same commit closed a family of IDOR bugs (dealer bank details leaking
  to non-owners, lead endpoints not scoped to the caller, unscoped grievance reads) and moved
  OTP generation to `crypto.randomInt`.
- `bce5ec4` — Sentry PII scrubbing, audit-log body scrubbing, throttling on token refresh.
- `28cc230` — WebSocket gateway hardening: CORS moved from `*` to the origin allowlist, and
  message and typing events now emit to a server-derived participant rather than a
  client-supplied recipient ID.

**Production bug batch of seven** (`1784fc0`, deployed 2026-07-21): lead deduplication with a
migration collapsing existing duplicates; Exotel call failures surfaced instead of reported
as success; the media-upload fix described above; dealer auto-assignment plus a manual
override endpoint and web modal; account self-deletion on web; grievance list navigation for
owners and buyers; and a full lead-status dropdown on both web and mobile.

**Auth-bounce fix** (`3e15281`): signed-in users clicking a property were being redirected to
`/login` because a dead refresh token triggered a redirect on public pages. Now gated to
dashboard routes via `loginRedirectFor()`.

**Field-level encryption** (live since the go-live release): AES-256-GCM over user phone,
nominee name and phone, dealer bank details, lead contact details, and DPDP grievance
contacts, with a blind index for phone lookups.

**Mobile store-readiness work**: real photo galleries, safe-area handling, in-app privacy
and terms via WebView, Ionicons navigation, error and retry states across all twelve list
screens, and a buyer-initiated call-back flow.

---

## Known gaps in this document

Stated plainly so you do not mistake silence for completeness:

- Anything marked _deployed, unverified in production_ has not been exercised against real
  production data. Verifying them is genuine work, not a formality.
- Web and mobile Sentry status was not checked against the Amplify and Expo configurations
  during this handover; only the API task definition was verified.
- There is no automated end-to-end test suite running against production. The test reports in
  `docs/test-reports/` are point-in-time manual sweeps from April and May 2026 and are now
  stale.
- The production database was seeded with only limited data. The plan to seed the top fifteen
  Gurugram luxury societies with realistic listings and licensed images was approved but never
  executed — it is waiting on a go from the business owner.
