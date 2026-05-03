# 10-Surface UAT Certification — 2026-05-03

## Headline

**PASS 10/10.** All ten UAT surfaces verified end-to-end via API + DB + route HTTP. Backend + routing layer is certifiably working; remaining gaps are cosmetic / browser-only render assertions on client components.

Method: HTTP/curl against API (`localhost:4000`) and web (`localhost:3100`), psql against `rdn_dev`. Browser interactions (modal flows, click handlers, toast confirmations) were not exercisable from this harness — noted per surface.

---

## Per-surface table

| #   | Surface                     | API status                          | Route HTTP | DB state changed                                                                  | Gaps                                                                     |
| --- | --------------------------- | ----------------------------------- | ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Chat send-message           | 201 / 201                           | 200        | Yes (1 conv, 1 msg)                                                               | Socket.io live delivery not asserted                                     |
| 2   | Lead status pipeline        | 200 / 200 / 200                     | 200        | Yes (NEW→CONTACTED→VISIT_SCHEDULED→VISITED)                                       | Button click handlers not exercised                                      |
| 3   | Notifications UI            | 200 (3 notifs)                      | 200        | n/a (read)                                                                        | Bell badge live update not asserted                                      |
| 4   | Public dealer-apply         | 201                                 | 200        | Yes (new dealer row)                                                              | Form submit handler not exercised                                        |
| 5   | Commission settle/cancel    | 200 list, 201 settle                | 200        | Yes (PENDING→SETTLED w/ ref)                                                      | Modal payout-ref entry not exercised                                     |
| 6   | Dealer KYC + training       | 200 / 200                           | 200        | Yes (KYC_APPROVED, COMPLETED)                                                     | Buttons + confirmations not exercised                                    |
| 7   | Grievance UI                | 201 create / 200 update             | 200        | Yes (OPEN→IN_PROGRESS)                                                            | Filter chip clicks not exercised                                         |
| 8   | Society management          | 201 create / 201 verify / 200 patch | 200        | Yes (created, VERIFIED, RWA admin assigned, user role auto-promoted to RWA_ADMIN) | Page is client-rendered; SSR returns skeleton                            |
| 9   | Sidebar Chat link           | n/a                                 | 200        | n/a                                                                               | None — `href="/dashboard/chat"` present in SSR HTML for all roles tested |
| 10  | Request Callback (property) | 201 lead, 201 call (dealer)         | 200        | Yes (new lead)                                                                    | Exotel keys empty in dev → call service returns mock payload (graceful)  |

---

## Detailed notes

### 1. Chat send-message — PASS

- `POST /v1/communication/conversations` (BUYER `0e70b48b…`, lead `2ca5574e…`, dealer user `03e53c23…`) → **201**, conv id `308f270a-c8a1-418d-aaaf-e3a385142c34`.
- `POST /v1/communication/conversations/:id/messages` `{receiverId, content:"second message via API", type:"TEXT"}` → **201**, msg id `8ac66b42…`.
- DB `messages` table now contains 3 rows for that conversation (2 seed + 1 new).
- Route `/dashboard/chat` returns **200** with `<h1>Chat</h1>` in SSR HTML.

### 2. Lead status pipeline — PASS

- Reset lead `26ec552b…` to `NEW`. As DEALER_GV:
  - `PATCH /v1/leads/:id {status:"CONTACTED"}` → **200**
  - `PATCH … {status:"VISIT_SCHEDULED", visitDate:"2026-05-05T11:23:35Z"}` → **200**
  - `PATCH … {status:"VISITED"}` → **200**
- Final DB row: `status=VISITED`, `visit_date=2026-05-05 11:23:35.624`.
- Route `/dashboard/leads` returns **200** with `<h1>Leads</h1>`. Action labels `Contacted`, `Schedule`, `Visited` present in HTML.

### 3. Notifications UI — PASS

- `GET /v1/notifications` (BUYER) → **200**, 3 notifications (DEAL × 2, GRIEVANCE × 1), `unreadCount=3`.
- Route `/dashboard/notifications` → **200** with `<h1>Notifications</h1>`.
- Sidebar on `/dashboard` includes a Notification link (`Notification` text + `/dashboard/notifications` href).

### 4. Public dealer-apply — PASS

- Anon GET `/become-dealer` → **200**, body includes `Become a Dealer`.
- BUYER `POST /v1/dealers/apply {societyId:"06739cb7…"}` (Lakeview Heights — buyer not yet a dealer there) → **201**, new dealer row `09fd0a36…` with `kyc_status=KYC_PENDING, rwa_approval_status=APPR_PENDING`.

### 5. Commission settle/cancel — PASS

- Route `/dashboard/commissions` → **200** with `<h1>Commissions</h1>`.
- `GET /v1/commissions?limit=5` → **200**, 3 records (1 SETTLED, 2 PENDING).
- `POST /v1/commissions/0635df93…/settle {payoutReference:"TEST-REF-001"}` → **201**.
- DB after: `status=SETTLED, payout_reference=TEST-REF-001, settlement_date=2026-05-03`.

### 6. Dealer KYC + training — PASS

- Route `/dashboard/dealers` → **200** with `<h1>Dealers</h1>`.
- Reset dealer `09fd0a36…` to `KYC_PENDING / TRAIN_PENDING`.
- `PATCH /v1/dealers/:id/kyc {kycStatus:"APPROVED"}` (SA) → **200**, `kyc_status=KYC_APPROVED` in DB.
- `PATCH /v1/dealers/:id/training-complete {}` (SA) → **200**, `training_status=COMPLETED` in DB.
- Note: action button labels (`Approve KYC`, `Mark Training Complete`) not present in SSR HTML — page is `'use client'`, labels render in browser only. Cannot verify text without browser.

### 7. Grievance UI — PASS

- `POST /v1/grievances {category:"SERVICE", severity:"LOW", description:"…"}` (BUYER) → **201**, grievance `c8ed8178…` created with `status=OPEN, escalation_level=1, sla_deadline=2026-05-10`.
- Route `/dashboard/grievances` (RWA_GV) → **200** with `<h1>Grievances</h1>`.
- `PATCH /v1/grievances/:id {status:"IN_PROGRESS"}` (RWA_GV) → **200**, DB `status=IN_PROGRESS`.

### 8. Society management — PASS

- Route `/dashboard/societies` (SA) → **200**. SSR HTML is a client-component skeleton (no `<h1>` rendered server-side); the "BUYER TENANT" sidebar label appears to be an SSR cookie/role-detection artefact (the JWT's role claim is correctly `SUPER_ADMIN`, and `/v1/users/me` returns `SUPER_ADMIN`). **Logged for follow-up but not blocking** — could be a layout cookie-read issue in the dashboard layout SSR pass.
- `POST /v1/societies {name, slug, address, city, state, pincode, totalUnits, amenities}` → **201**, society `d023e55b…` created (`status=IN_PROGRESS, verificationStatus=PENDING`).
- `POST /v1/verification/society/:id {status:"VERIFIED"}` → **201**, society now `verificationStatus=VERIFIED, status=ONBOARDED`.
- `PATCH /v1/societies/:id {rwaAdminId:"f3233c7c…"}` → **200**. DB confirms `rwa_admin_id` set, AND target user role auto-promoted from `BUYER_TENANT` to `RWA_ADMIN`. Auto-promotion side-effect is working as designed.

### 9. Sidebar Chat link — PASS

- SSR HTML for `/dashboard` contains `href="/dashboard/chat"` for BUYER, DEALER, and SA tokens. Sidebar Chat nav-item is universally rendered.

### 10. Request Callback (property page) — PASS

- Anon GET `/property/9e1b4565…` → **200**. Page title: `3 BHK APARTMENT for RENT in Green Valley Apartments - 35,000/mo`. HTML contains both `Request Callback` and `Enquire` button text.
- BUYER `POST /v1/leads {propertyId, source:"APP_SEARCH"}` → **201**, lead `7f78dc04…` created and assigned to dealer `7e3fd0eb…`.
- BUYER `POST /v1/communication/call` → **403** (endpoint is `@Roles('DEALER')` — buyer cannot self-initiate). This is a deliberate RBAC choice; the buyer-facing "Request Callback" flow is a _lead create_ (which works), not a direct call dial.
- DEALER `POST /v1/communication/call {leadId, toUserId}` → **201** with mock payload `{"status":"mock","message":"Call service not configured. In production, a masked call would be initiated."}`. Graceful fallback works correctly with empty Exotel credentials.

---

## Browser-only gaps (not blockers, but cannot certify here)

- Real-time message delivery via Socket.io for surface 1.
- Notification bell unread-count badge / live polling on surface 3.
- Modal payout-reference entry UX on surface 5.
- KYC/Training action button visibility & confirmation modal on surface 6.
- Society create modal / verify dropdown / RWA admin select on surface 8.
- Property page "Request Callback" button → modal → form submit → lead creation full path on surface 10.

All underlying APIs and routes exist and respond correctly; client-side wiring requires a real browser to certify.

---

## Issues logged (NOT auto-fixed per instructions)

1. **`/dashboard/societies` SSR sidebar shows "BUYER TENANT" when SA-cookie is sent** (surface 8). The JWT and `/v1/users/me` correctly identify the user as SUPER_ADMIN. The dashboard layout's SSR role-display likely has a cookie-read or user-fetch fallback that defaults to `BUYER_TENANT`. Investigate `apps/web/src/components/layout/sidebar.tsx` SSR path. Cosmetic-only — page still loads + APIs work.
2. **Several dashboard pages are pure client components** (`commissions`, `dealers`, `societies`, `grievances`) and emit no meaningful SSR content beyond layout chrome. This is fine for app behavior but means SSR route checks can't validate page-specific UI. Consider keeping at least the page heading server-rendered for SEO/auditability.
3. **`/v1/communication/call` returns 201 (not 200) on success.** Spec line in task expected 200/201; observed 201. Acceptable but inconsistent with other PATCH/POST endpoints — worth standardising.

---

## Blocker recommendations

**None.** All five blocker surfaces (1–5) and all five nice-to-have surfaces (6–10) verified end-to-end at the API + DB layer. The surfaces are ready for browser-driven UAT.

---

## Test artefacts (DB rows created during certification)

- conv `308f270a-c8a1-418d-aaaf-e3a385142c34` + msg `8ac66b42…` (surface 1)
- lead `26ec552b…` flipped NEW→VISITED (surface 2)
- dealer `09fd0a36…` for buyer at Lakeview Heights, KYC_APPROVED + COMPLETED (surfaces 4, 6)
- commission `0635df93…` SETTLED with `TEST-REF-001` (surface 5)
- grievance `c8ed8178…` IN_PROGRESS (surface 7)
- society `d023e55b… "UAT Cert Society"` ONBOARDED + VERIFIED, RWA admin assigned to user `f3233c7c…` (auto-promoted to RWA_ADMIN) (surface 8)
- lead `7f78dc04…` from BUYER on property `9e1b4565…` (surface 10)

These can be cleaned up if interfering with future test runs, but were left in place for inspection.
