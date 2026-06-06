# Mobile Feature-Parity Design — CRM, Commission, Dealer Certification, Grievance

**Date:** 2026-06-07
**Branch:** chore/uat-prep-stabilization
**Status:** Approved (design), pending implementation plan

## Problem

Web + API gained four feature areas (commits `814f169`, `dd2734b`, `c6c09cb`, `fcf1ca2`) that `apps/mobile` does not implement. Mobile lags ~75% on these. Goal: full feature parity with web, including admin actions, using mobile-native UX patterns (bottom sheets, native date pickers, swipe/pull-to-refresh) rather than 1:1 web modal ports.

Audit summary:

| Feature                             | Web      | Mobile (before)               |
| ----------------------------------- | -------- | ----------------------------- |
| CRM pipeline (full lead workflow)   | COMPLETE | PARTIAL (basic statuses only) |
| Commission settle/distribute/cancel | COMPLETE | MISSING                       |
| Dealer certification                | COMPLETE | MISSING                       |
| General grievance file + triage     | COMPLETE | PARTIAL (DPDP grievance only) |

## Decisions

- **Audience:** Full parity incl. admin actions (commission settle/distribute/cancel, dealer certify/revoke, grievance triage), even though admins are rarely on mobile.
- **UX:** Mobile-native adaptation — bottom sheets instead of modals, native date pickers, pull-to-refresh, action sheets. Follow existing `apps/mobile` conventions.
- **Navigation:** No new bottom tabs (5 is the practical max; tabs are home/search/leads/chat/profile). Secondary/admin features reachable via a **role-aware "Manage" hub** in the Profile screen; each entry opens a stack screen. CRM extends the existing `leads` tab and `lead/[id]` detail.

## Architecture

### API client layer (`apps/mobile/src/lib/api/`)

- New: `commission.ts` — list, getById, settle, distribute, cancel.
- New: `grievance.ts` — list, getById, create, update (status), escalate.
- Extend `dealers.ts` — certify, revokeCertification, updateKyc, trainingComplete, setActive.
- Extend `leads.ts` — closeDeal, approveVisit (if not already present).
- Register new libs in `src/lib/api/index.ts`.

### Shared types (`packages/shared`)

- Add `CertificationStatus` enum (NOT_CERTIFIED, CERTIFIED, REVOKED) to shared types — currently DB-schema-only. Lets mobile + web share the type. No DB migration (enum already exists in `schema.prisma`).

### Role gating

- Reuse existing auth/role context in mobile. Hub entries and in-screen actions render conditionally by role:
  - Commission write actions (settle/distribute/cancel): SUPER_ADMIN only. Dealers: read-only own commissions.
  - Dealer management (certify/revoke/kyc/training/active): SUPER_ADMIN + RWA_ADMIN (scoped).
  - Grievance triage (status update): SUPER_ADMIN + RWA_ADMIN. Filing + escalate: any authenticated user.

## Components / Screens

### Area 1 — CRM pipeline (extend existing)

- `app/(tabs)/leads.tsx`: expand status filter set to full enum — add INTERESTED, QUALIFIED, VISITED, MEETING_ARRANGED, DEAL_OPEN, NOT_PICKED, LOST. Add priority badges (HOT/WARM/COLD derived from status, matching web logic).
- `app/lead/[id].tsx`:
  - Status-transition action sheet (`PATCH /leads/:id`).
  - **Plan Visit** bottom sheet → native date picker → sets VISIT_SCHEDULED with scheduled date.
  - **Close Deal** bottom sheet → deal type (RENT/SALE/RENEWAL) + deal value → `POST /leads/:id/close-deal`.
  - Owner **Approve Visit** action → `PATCH /leads/:id/approve-visit`.
  - Masked call button (existing communication API).

### Area 2 — Commission (new)

- `app/commissions/index.tsx` — list with status filter (ALL/PENDING/SETTLED/DISTRIBUTED/CANCELLED), pull-to-refresh. Dealer sees own; SUPER_ADMIN sees all. Shows dealer name, amount, GST, status, payout ref.
- `app/commissions/[id].tsx` — detail. SUPER_ADMIN action sheets:
  - **Settle**: payment method (UPI/IMPS/NEFT/RTGS/CASH) + payment reference → `POST /commissions/:id/settle`.
  - **Distribute**: mark paid → `POST /commissions/:id/distribute`.
  - **Cancel**: reason → `POST /commissions/:id/cancel`.

### Area 3 — Dealer certification (new)

- `app/manage/dealers/index.tsx` — dealer list (SUPER_ADMIN/RWA). Badges: KYC, RWA approval, Training, Active, Certification (Certified/Revoked/Not certified).
- `app/manage/dealers/[id].tsx` — action sheets, each gated by current state (mirror web visibility rules):
  - **Certify** (visible when trainingStatus===COMPLETED && certificationStatus!==CERTIFIED) → `PATCH /dealers/:id/certify`.
  - **Revoke Cert** (visible when CERTIFIED) → `PATCH /dealers/:id/revoke-certification`.
  - KYC approve/reject → `PATCH /dealers/:id/kyc`.
  - Training complete → `PATCH /dealers/:id/training-complete`.
  - Active toggle → `PATCH /dealers/:id/active`.
  - RWA approve (RWA_ADMIN) — existing approval endpoint.

### Area 4 — General grievance (new; distinct from DPDP grievance at `settings/grievance.tsx`)

- `app/grievances/index.tsx` — dual view: filer tracks own grievances; SUPER_ADMIN/RWA triage view. Status filter (ALL/OPEN/IN_PROGRESS/ESCALATED/RESOLVED/CLOSED).
- `app/grievances/new.tsx` — file: category (DEALER_CONDUCT, PROPERTY_MISMATCH, COMMISSION, SERVICE, SAFETY, KEY_ARRANGEMENT, VISIT_TIME, MEETING_AVAILABILITY, OTHER), severity (CRITICAL/HIGH/MEDIUM/LOW), description, evidence upload (reuse `MediaUploader`) → `POST /grievances`.
- `app/grievances/[id].tsx` — detail + **Escalate** (any user, `POST /grievances/:id/escalate`) + admin actions: Mark In Progress / Resolve (+notes) / Close (+reason) → `PATCH /grievances/:id`.
- Contextual **"Raise grievance"** entry point on `lead/[id]` and property detail screens (prefills relevant category/context).

### Profile hub

- `app/(tabs)/profile.tsx` — add a **Manage** section rendering role-gated rows: Commissions (dealer + super-admin), Dealers (super-admin + RWA), Grievances (all). Each navigates to the corresponding stack screen.

## Data Flow

Client screen → mobile API lib (axios instance w/ JWT) → NestJS endpoint (RolesGuard + society scope) → Prisma → Postgres. Notifications fan out server-side on settle/distribute and grievance status changes (already implemented in API).

## Error Handling

- Reuse existing mobile API error interceptor + toast/snackbar pattern.
- Optimistic UI avoided for state-changing admin actions; show inline pending state, refetch on success.
- Role-forbidden actions never rendered (defense in depth: API still enforces RolesGuard → 403 surfaced as toast).
- Empty/loading/error states on every new list screen.

## Testing

- Extend Maestro flows (`apps/mobile/.maestro/flows/`):
  - `06-commission-view.yaml` — login dealer → open Commissions → see own list.
  - `07-grievance-file.yaml` — file a general grievance → appears in track view.
  - `08-lead-close-deal.yaml` — dealer moves lead through to Close Deal.
- Typecheck (mobile/api/shared) must pass. Lint-staged on commit.

## Out of Scope

- Razorpay / in-app payments (deferred to v2 per launch plan).
- Property edit/delist on mobile (separate nice-to-have).
- No new DB migrations (all enums already in schema).

## Build Order (for the plan)

1. Shared `CertificationStatus` enum + API libs (foundation, no UI).
2. CRM pipeline extension (highest-traffic, dealer-facing).
3. General grievance (user-facing filing + triage).
4. Commission screens (admin + dealer read).
5. Dealer certification/management screens (admin).
6. Profile Manage hub wiring + contextual grievance entry points.
7. Maestro flows + typecheck/lint pass.
