# RDN End-to-End Lifecycle Walk — 2026-05-02

## 1. Headline answer

**All workflows working end-to-end? PARTIAL.**

The backend is in great shape — every API in the buyer→dealer→owner→deal lifecycle works and writes the right database state. The web UI, however, is materially incomplete: chat is broken on the wire, the dealer cannot move leads through the pipeline from any UI, and there is no UI at all for notifications, grievances, commissions, dealer applications, KYC/training, or society admin. UAT can demo discovery, enquiry, owner-approve-visit, and close-deal — anything else has to be driven by curl.

- **API pass count: 9 / 9** lifecycle endpoints (after correcting payload shapes that the schema requires).
- **UI gap count: 11** material gaps.
- **BLOCKS_UAT count: 5** (chat, lead pipeline transitions, notifications, dealer onboarding intake, commission settle).

## 2. Per-phase results

| Phase                                    | API works | UI works | Notes                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Anonymous discovery + property detail | YES       | YES      | `/search` 200, `/property/<id>` 200, search returns paginated `data.data`.                                                                                                                                                                                                                                                                                                       |
| B. Buyer signup + create lead            | YES       | YES      | Enquiry modal at `apps/web/src/components/property/enquiry-modal.tsx` wires to `POST /v1/leads`. Dealer auto-assigned + 2 IN_APP notifications written to DB (dealer + owner).                                                                                                                                                                                                   |
| C. Dealer interaction (status + chat)    | YES       | PARTIAL  | `PATCH /v1/leads/:id` works. **Chat is broken**: web `communicationApi.sendMessage` posts `{content}` only, but `sendMessageSchema` requires `{receiverId, content, type?}` — backend returns 400 Validation failed.                                                                                                                                                             |
| D. Visit schedule + owner approval       | YES       | PARTIAL  | Backend transitions `VISIT_SCHEDULED → VISITED → NEGOTIATING` all return 200. UI exposes only the owner Approve-Visit button; nothing in the dealer UI to schedule a visit or advance status.                                                                                                                                                                                    |
| E. Close deal + commission               | YES       | PARTIAL  | `POST /v1/leads/:id/close-deal` writes transaction + commission row + 4 DEAL notifications (dealer/buyer/owner/SA). UI has Close-Deal button on dealer leads page. **No commission settle/cancel UI** even though `POST /v1/commissions/:id/settle` exists.                                                                                                                      |
| F. Notifications                         | YES       | NO       | `GET /v1/notifications` returns the DEAL notification correctly. **Web has zero notification UI** — no bell, no page, even though `notifications.api.ts` client exists.                                                                                                                                                                                                          |
| G. Grievance                             | YES       | NO       | `POST /v1/grievances` (with `category`+`severity`+`description`) creates the row; RWA can list. **No file-grievance UI and no RWA resolve UI.** Reports page only shows an "Open Grievances" stat counter.                                                                                                                                                                       |
| H. Dealer onboarding                     | YES       | PARTIAL  | All four endpoints work end-to-end (apply → RWA approve → KYC approve → training-complete) and the dealer flips to `is_active=true`. UI exposes only `approve` / `reject` on `/dashboard/dealers`; no public dealer-apply page, no KYC update button, no training-complete button (despite `dealersApi.updateKyc` and `dealersApi.completeTraining` existing in the API client). |
| I. Society lifecycle                     | YES       | NO       | SA can create society, verify it, and assign an RWA admin — and the assigned user's role is auto-promoted to `RWA_ADMIN`. **No SA society management UI exists** in `/dashboard`.                                                                                                                                                                                                |

## 3. UI gaps (definitive list)

| #   | Surface                                       | What's missing                                                                                                                                             | API endpoint that exists                                                             | Severity                                            |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 1   | `/dashboard/chat` send-message                | UI sends `{content}`, backend requires `{receiverId, content, type?}` — every send returns 400                                                             | `POST /v1/communication/conversations/:id/messages`                                  | **BLOCKS_UAT**                                      |
| 2   | `/dashboard/leads` status pipeline            | No buttons to advance NEW→CONTACTED→VISIT_SCHEDULED→VISITED→NEGOTIATING (only Close-Deal once already in NEGOTIATING/CLOSING, and Approve-Visit for owner) | `PATCH /v1/leads/:id`                                                                | **BLOCKS_UAT**                                      |
| 3   | Notifications                                 | No bell icon, no notifications page, no unread badge anywhere; client `notifications.api.ts` is dead code                                                  | `GET /v1/notifications`, `PATCH /v1/notifications/:id/read`                          | **BLOCKS_UAT**                                      |
| 4   | Public dealer-apply page                      | No way for a buyer to apply to become a dealer; only path is curl                                                                                          | `POST /v1/dealers/apply`                                                             | **BLOCKS_UAT**                                      |
| 5   | Commission settle UI                          | Reports page lists commissions but has no Settle / Cancel actions                                                                                          | `POST /v1/commissions/:id/settle`, `POST /v1/commissions/:id/cancel`                 | **BLOCKS_UAT**                                      |
| 6   | Dealer KYC + training in `/dashboard/dealers` | Page only exposes Approve / Reject; no KYC status update or training-complete buttons                                                                      | `PATCH /v1/dealers/:id/kyc`, `PATCH /v1/dealers/:id/training-complete`               | NICE_TO_HAVE (SA can do via curl for now)           |
| 7   | Grievance file UI (buyer/owner)               | No form anywhere on the public site or dashboard                                                                                                           | `POST /v1/grievances`                                                                | NICE_TO_HAVE                                        |
| 8   | Grievance triage UI (RWA / SA)                | Reports page shows a stat only; no list, no detail, no resolve                                                                                             | `GET /v1/grievances`, `PATCH /v1/grievances/:id`                                     | NICE_TO_HAVE                                        |
| 9   | Society management (SA)                       | No create/edit/verify/assign-RWA UI                                                                                                                        | `POST /v1/societies`, `POST /v1/verification/society/:id`, `PATCH /v1/societies/:id` | NICE_TO_HAVE for UAT (seed handles initial society) |
| 10  | Sidebar nav                                   | Owner/Buyer have no Chat link; nobody has a Notifications link; SA has no Society / Commissions link                                                       | (see above)                                                                          | NICE_TO_HAVE                                        |
| 11  | Property detail "Request Callback" CTA        | Button is present but is a no-op — not wired to `POST /v1/communication/call`                                                                              | `POST /v1/communication/call`                                                        | NICE_TO_HAVE (Exotel-dependent)                     |

## 4. API gaps

None of the lifecycle endpoints are broken. Two minor concerns surfaced:

- `createLeadSchema.source` enum is `APP_SEARCH | REFERRAL | WHATSAPP | WALK_IN`. The lifecycle script (and presumably any web client) might assume a `WEB` source — there isn't one. The web enquiry modal correctly defaults to `APP_SEARCH`, so this is informational rather than broken, but `WEB` is the obvious channel and arguably should exist.
- `verification/society/:id` accepts `{status, notes}` (POST). Worked once `pincode` and `state` were supplied on `POST /v1/societies` (both required by Zod but not surfaced anywhere obvious to a UI builder).

## 5. Recommended UI build order (UAT promotion priority)

1. **Fix chat send-message payload** (one-line web fix: send `{receiverId, content, type:'TEXT'}`). Without this, the demo cannot show buyer/dealer messaging.
2. **Add lead pipeline status buttons** to `apps/web/src/app/dashboard/leads/page.tsx` (a status dropdown that calls `leadsApi.update`, with a date-picker when transitioning to `VISIT_SCHEDULED`).
3. **Notification UI** — bell in header + `/dashboard/notifications` page wired to existing `notifications.api.ts`. Crucial so users see the four DEAL notifications + lead notifications the API is already emitting.
4. **Public dealer-apply page** (`/become-a-dealer`) using existing `POST /v1/dealers/apply`.
5. **Commission settle/cancel actions** on the reports → commissions tab (SA-only). Without it the close-deal demo dead-ends.
6. **Dealer KYC + training-complete buttons** on `/dashboard/dealers` (SA actions next to existing Approve/Reject).
7. **Grievance file form** (public + dashboard) and **RWA grievance triage page**.
8. **SA society management** (create + verify + assign RWA admin) — can stay manual via seed for first UAT round.
9. **Sidebar additions** — Notifications for everyone; Chat for OWNER/BUYER; Society + Commissions for SA.
10. **Wire the "Request Callback" CTA** on property detail to `POST /v1/communication/call` (or hide until Exotel is live).

## 6. Evidence (artefacts created during the walk)

- New buyer user: `2384fea0-c8d1-4d2e-98c3-d71ceb72657d` (`+918888777666`)
- Lead walked to CLOSED: `481769cc-b011-4727-9006-ed38a509942f` on property `ed45623b-62ba-45b9-8acb-169ace62f865` (Green Valley WIZ-T1)
- Transaction: `2269ec57-1e1b-4be8-a6c8-fde3ae27e275` (RENT 30000, dealerShare 15000, rwaShare 3000, rdnShare 12000, gst 5400)
- Commission: `40b8f37d-6ec9-4ca8-966a-6287cf6e703b` (PENDING)
- Conversation: `457a0c88-ab34-4643-ae0a-2834156eed84` + one TEXT message
- Grievance: `b44e2ab7-a303-41e9-8d95-e9f249deef9b` (DEALER_CONDUCT, MEDIUM, OPEN)
- Onboarded dealer: `39397441-8879-4879-831b-60fbb4fbc2c2` for user `+918887776660` (KYC_APPROVED, TRAINING COMPLETED, is_active=true)
- New society: `6bf73305-d539-4cce-ae70-aa78c6b8e6b5` (Lifecycle Test Society, Mumbai), VERIFIED, RWA admin = `89604ac2-5c81-47d0-a430-dc5ce9a6fc19` (auto-promoted to RWA_ADMIN)
- 4 DEAL notifications written; 2 LEAD notifications written.

## 7. Files inspected

- `apps/web/src/app/(public)/property/[id]/client.tsx` — enquiry CTA wired correctly.
- `apps/web/src/components/property/enquiry-modal.tsx` — calls `leadsApi.create` correctly.
- `apps/web/src/app/dashboard/leads/page.tsx` — confirms missing pipeline transition buttons; only Close-Deal + Approve-Visit.
- `apps/web/src/app/dashboard/chat/page.tsx` + `apps/web/src/lib/api/communication.api.ts` — confirms send-message payload mismatch.
- `apps/web/src/app/dashboard/dealers/page.tsx` + `apps/web/src/lib/api/dealers.api.ts` — confirms only approve/reject wired.
- `apps/web/src/app/dashboard/reports/page.tsx` — commissions tab present, no settle action.
- `apps/web/src/components/layout/sidebar.tsx` — confirms missing nav entries.
- `apps/api/src/modules/communication/communication.controller.ts` — endpoints `/conversations`, `/conversations/:id/messages`, `/call`.
- `apps/api/src/modules/dealers/dealers.controller.ts` — endpoints `/apply`, `/:id/approve|reject|kyc|training-complete`.
- `apps/api/src/modules/commission/commission.controller.ts` — `/settle`, `/cancel` endpoints exist.
- `packages/shared/src/validation/{lead,communication,grievance,dealer,society}.schema.ts` — confirmed required payload shapes.
