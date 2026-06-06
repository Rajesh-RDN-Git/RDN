# Mobile Feature-Parity Design — Full Web↔Mobile Parity

**Date:** 2026-06-07
**Branch:** chore/uat-prep-stabilization
**Status:** Approved (design), pending implementation plan

## Goal

Bring `apps/mobile` to full feature parity with `apps/web` + the NestJS API — leaving **no gaps**. A three-way audit (web routes, mobile screens, API endpoints) produced the gap matrix below. Mobile-native UX (bottom sheets, native date pickers, pull-to-refresh, action sheets), not 1:1 web modal ports. Full parity including admin actions.

## Audit method

Three parallel inventories taken at this commit:

- **Web:** 37 page routes across `(public)`, `dashboard`, `(auth)`, homepage.
- **Mobile:** 19 screens, 10 API client libs.
- **API:** ~94 endpoints across 15 modules (canonical capability list).

## Gap Matrix (everything mobile is missing vs web/API)

| #   | Capability                                                                 | Web                               | Mobile (before)                  | API               |
| --- | -------------------------------------------------------------------------- | --------------------------------- | -------------------------------- | ----------------- |
| 1   | CRM pipeline — full lead statuses, Plan Visit, Close Deal, Approve Visit   | ✅                                | PARTIAL (6 statuses, no actions) | ✅                |
| 2   | Commission — view + settle/distribute/cancel                               | ✅                                | MISSING                          | ✅                |
| 3   | Dealer management — approve/reject, KYC, training, active, certify, revoke | ✅                                | MISSING (apply only)             | ✅                |
| 4   | General grievance — file/track/triage/escalate                             | ✅                                | MISSING (DPDP only)              | ✅                |
| 5   | Property management list — my/assigned/all + status filter + search        | ✅                                | thin (home stats)                | ✅                |
| 6   | Property edit                                                              | ✅ `[id]/edit`                    | only `new`                       | ✅ PATCH          |
| 7   | Saved/shortlist properties (buyer)                                         | ✅ (localStorage `rdn_shortlist`) | MISSING                          | n/a (client-side) |
| 8   | Verification queue — RWA/admin approve/reject listings                     | ✅                                | MISSING                          | ✅                |
| 9   | Advanced search filters — price/area range, amenities, furnishing, society | ✅                                | subset (city/type/BHK/sort)      | ✅                |
| 10  | Society management — create/verify/assign-RWA (admin)                      | ✅                                | browse only                      | ✅                |
| 11  | Masked call — dealer call button                                           | ✅                                | MISSING                          | ✅ DEALER         |
| 12  | Reports/analytics — dashboard + leads/txn/commission reports               | ✅                                | MISSING                          | ✅                |
| 13  | Profile edit — name/email/avatar + notification prefs + sessions           | ✅                                | view only                        | ✅                |
| 14  | Transactions — standalone list/detail/payment-status                       | ⚠️ web shows via reports only     | MISSING                          | ✅                |

**Decisions:**

- Full parity **including admin actions**.
- Mobile-native UX patterns.
- **Transactions:** build standalone mobile screen (exceeds web, user-approved).
- **Referral:** SKIP — API exists but neither web nor mobile has UI, so not a parity gap. Flagged as shared future work.
- **Marketing "coming-soon" pages** (about/faq/pricing/etc.): SKIP — web-only, irrelevant in a store app.

## Navigation strategy

No new bottom tabs (5 is the practical max: home/search/leads/chat/profile). New surfaces reached via a **role-aware "Manage" hub** added to the Profile screen; CRM and search extend existing tabs; property management and saved list reachable from Profile + Home.

Profile "Manage" hub rows (role-gated):

- **My Properties / Assigned / All** (OWNER / DEALER / admin) → property list
- **Saved** (BUYER_TENANT) → shortlist
- **Verification Queue** (RWA_ADMIN, SUPER_ADMIN)
- **Dealers** (SUPER_ADMIN, RWA_ADMIN)
- **Societies** (SUPER_ADMIN)
- **Commissions** (SUPER_ADMIN, DEALER)
- **Transactions** (SUPER_ADMIN, RWA_ADMIN)
- **Grievances** (all)
- **Reports** (SUPER_ADMIN, RWA_ADMIN, DEALER, OWNER, BUYER — role-aware content)
- **Edit Profile / Notification Preferences / Security** (all)

## Architecture

### API client layer (`apps/mobile/src/lib/api/`)

- **New:** `commission.ts` (list, getById, settle, distribute, cancel)
- **New:** `grievance.ts` (list, getById, create, update, escalate) — general, distinct from existing DPDP `consent.ts` grievance
- **New:** `transactions.ts` (create, list, getById, updatePaymentStatus)
- **New:** `reports.ts` (dashboard, leads, transactions, commissions)
- **New:** `verification.ts` OR fold into existing libs: property verification-queue (GET `/properties/verification-queue`, PATCH `/properties/:id/verification`), society verify (POST `/verification/society/:id`), dealer KYC verify.
- **Extend `dealers.ts`:** approve, reject, updateKyc, trainingComplete, setActive, certify, revokeCertification.
- **Extend `leads.ts`:** confirm closeDeal + approveVisit present (lib already has both); ensure status update covers full enum.
- **Extend `communication.ts`:** `call` (POST `/communication/call`).
- **Extend `search.ts`:** price range, area range, amenities, furnishing, society params.
- **Extend `societies.ts`:** create (POST `/societies`), update/assign-RWA (PATCH `/societies/:id`).
- **Extend `auth.ts`/new `users.ts`:** updateProfile (PATCH `/users/me`), avatar upload via existing media presigned flow.
- Register all new libs in `src/lib/api/index.ts`.

### Shared types (`packages/shared`)

- Add `CertificationStatus` enum (NOT_CERTIFIED, CERTIFIED, REVOKED) — currently DB-schema-only. No DB migration (enum already in `schema.prisma`). Lets mobile + web share the type.

### Role gating

Reuse existing mobile auth store + role context. Hub rows and in-screen actions render conditionally by role. API enforces RolesGuard regardless (defense in depth → 403 surfaced as toast). No forbidden action is rendered.

## Components / Screens

### Area 1 — CRM pipeline (extend existing)

- `app/(tabs)/leads.tsx`: full status filter set (add INTERESTED, QUALIFIED, VISITED, MEETING_ARRANGED, DEAL_OPEN, NOT_PICKED, LOST). Priority badges (HOT/WARM/COLD) matching web logic.
- `app/lead/[id].tsx`: status-transition action sheet (`PATCH /leads/:id`); **Plan Visit** sheet → native date picker → VISIT_SCHEDULED; **Close Deal** sheet → deal type (RENT/SALE/RENEWAL) + value → `POST /leads/:id/close-deal`; owner **Approve Visit** → `PATCH /leads/:id/approve-visit`; **masked call** button (#11) → `POST /communication/call`; **Raise grievance** contextual entry (#4).

### Area 2 — Commission

- `app/commissions/index.tsx`: list, status filter (ALL/PENDING/SETTLED/DISTRIBUTED/CANCELLED), pull-to-refresh. Dealer = own; SUPER_ADMIN = all. Shows dealer, amount, GST, status, payout ref.
- `app/commissions/[id].tsx`: detail; SUPER_ADMIN sheets — **Settle** (method UPI/IMPS/NEFT/RTGS/CASH + ref), **Distribute** (mark paid), **Cancel** (reason).

### Area 3 — Dealer management + certification

- `app/manage/dealers/index.tsx`: dealer list (SUPER_ADMIN/RWA, society-scoped for RWA). Badges: KYC, RWA approval, Training, Active, Certification.
- `app/manage/dealers/[id].tsx`: state-gated action sheets — Approve/Reject application, KYC approve/reject, Training complete, Active toggle, **Certify** (when training COMPLETED && not CERTIFIED), **Revoke Cert** (when CERTIFIED).

### Area 4 — General grievance (distinct from DPDP at `settings/grievance.tsx`)

- `app/grievances/index.tsx`: dual view — filer tracks own; SUPER_ADMIN/RWA triage. Status filter.
- `app/grievances/new.tsx`: category (8), severity (4), description, evidence upload (reuse `MediaUploader`) → `POST /grievances`.
- `app/grievances/[id].tsx`: detail + **Escalate** (any user); admin actions In Progress / Resolve (+notes) / Close (+reason) → `PATCH /grievances/:id`.
- Contextual **Raise grievance** entry on lead + property detail (prefills category/context).

### Area 5 — Property management list

- `app/manage/properties/index.tsx`: role-scoped list — OWNER (own), DEALER (assigned), SUPER_ADMIN/RWA (all). Status filter (DRAFT/PENDING/RWA_APPROVED/PUBLISHED/etc.) + search by flat/tower/society + pagination. Each row → property detail; owner/admin sees Edit + Delist.

### Area 6 — Property edit

- `app/property/[id]/edit.tsx`: reuse the existing 6-step `property-wizard` in edit mode, prefilled from `GET /properties/:id` → `PATCH /properties/:id`. Photo re-upload via MediaUploader.

### Area 7 — Saved / shortlist (buyer)

- Shortlist stored in AsyncStorage key `rdn_shortlist` (mirror web `rdn_shortlist`). Heart toggle on property cards (search, home, society) + property detail.
- `app/saved/index.tsx`: resolves stored ids via `GET /properties/:id`, renders cards. Works pre-login.

### Area 8 — Verification queue

- `app/manage/verification-queue/index.tsx` (RWA_ADMIN, SUPER_ADMIN): pending listings via `GET /properties/verification-queue`; **Approve/Reject** action per item → `PATCH /properties/:id/verification`.

### Area 9 — Advanced search filters

- Extend `app/(tabs)/search.tsx` filter UI: price range, area range, amenities multi-select, furnishing, society — wired to extended `search.ts` params. Mobile-native bottom-sheet filter panel; applied-filter chips.

### Area 10 — Society management (admin)

- `app/manage/societies/index.tsx` (SUPER_ADMIN): society list with verification status.
- `app/manage/societies/new.tsx`: create (name, slug, address, city, state, pincode, units, amenities) → `POST /societies`.
- `app/manage/societies/[id].tsx`: **Verify** (VERIFIED/FLAGGED/REJECTED + notes) → `POST /verification/society/:id`; **Assign/Reassign RWA admin** → `PATCH /societies/:id`.

### Area 11 — Masked call

- `communication.ts` gains `call`. Dealer **Call** button on `lead/[id]` (and where dealer↔buyer contact applies) → `POST /communication/call`. Number never shown (Exotel routing).

### Area 12 — Reports / analytics

- `app/reports/index.tsx`: role-aware dashboard stats (`GET /reports/dashboard`). Tabs for SUPER_ADMIN/RWA: Leads (`/reports/leads`), Transactions (`/reports/transactions`, SUPER_ADMIN), Commissions (`/reports/commissions`, SUPER_ADMIN). Mobile-native segmented control instead of web tabs.

### Area 13 — Profile edit + preferences + security

- `app/settings/edit-profile.tsx`: edit name/email, upload avatar (media presigned), masked phone read-only → `PATCH /users/me`.
- `app/settings/notification-preferences.tsx`: toggle prefs (lead updates, deals, commissions, visits, announcements).
- `app/settings/security.tsx`: phone-OTP info + active sessions view.

### Area 14 — Transactions (standalone, exceeds web)

- `app/transactions/index.tsx` (SUPER_ADMIN, RWA_ADMIN): list with type/status filter → `GET /transactions`.
- `app/transactions/[id].tsx`: detail; SUPER_ADMIN **Update payment status** → `PATCH /transactions/:id/payment-status`.

### Profile hub wiring

- `app/(tabs)/profile.tsx`: add role-gated **Manage** section linking to all the above stack screens.

## Data flow

Screen → mobile API lib (axios + JWT) → NestJS endpoint (RolesGuard + society scope) → Prisma → Postgres. Server-side notification fan-out already implemented for settle/distribute, grievance status, lead transitions.

## Error handling

- Reuse existing axios error interceptor + toast pattern.
- No optimistic UI for state-changing admin actions: inline pending state, refetch on success.
- Every new list screen: loading / empty / error states.
- Forbidden actions never rendered; API 403 surfaced as toast (defense in depth).

## Testing

Extend Maestro flows (`apps/mobile/.maestro/flows/`):

- `06-commission-view.yaml`, `07-grievance-file.yaml`, `08-lead-close-deal.yaml`
- `09-property-edit.yaml`, `10-verification-approve.yaml`, `11-save-property.yaml`, `12-reports-view.yaml`
  Typecheck (mobile/api/shared) + lint-staged must pass.

## Out of scope

- Razorpay / in-app payments (v2).
- Referral UI (not a parity gap; web lacks it too).
- Marketing "coming-soon" pages.
- No new DB migrations (all enums already in schema).

## Build order (for the plan)

1. **Foundation:** shared `CertificationStatus` enum; all new/extended API libs + `index.ts` registration (no UI).
2. **CRM pipeline** (#1) + **masked call** (#11) — highest-traffic, dealer-facing.
3. **General grievance** (#4) — user-facing.
4. **Saved/shortlist** (#7) + **advanced search filters** (#9) — buyer-facing.
5. **Property management list** (#5) + **property edit** (#6) — owner/admin.
6. **Verification queue** (#8).
7. **Commission** (#2) + **transactions** (#14).
8. **Dealer management** (#3) + **society management** (#10).
9. **Reports** (#12).
10. **Profile edit + preferences + security** (#13).
11. **Profile Manage-hub wiring** + contextual grievance entries.
12. **Maestro flows** + full typecheck/lint pass.
