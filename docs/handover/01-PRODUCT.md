# 01 — The Product

> Full detail lives in [`docs/PRD.md`](../PRD.md) (820 lines, 17 core feature areas). This
> document is the orientation layer: enough to make sensible engineering decisions without
> reading the PRD end to end. Where the PRD describes something as planned, check
> [05 — What is done](./05-STATUS-WHAT-IS-DONE.md) for whether it actually exists.

---

## The problem RDN solves

Residential societies in India transact real estate through unverified external brokers.
That brings opaque pricing, unrestricted stranger access to secure premises, fragmented
paperwork, and no income for the society itself. Meanwhile residents who know the society
best have no structured way to participate.

RDN's answer: the RWA grants RDN an exclusive mandate over rent, sale, and renewal
transactions in its society (3-year lock-in, free to the RWA initially). Residents apply to
become **resident dealers**, are approved by both the RWA and RDN, and become the face of
every transaction. Buyers and tenants search and enquire through the platform. Contact
details never cross between parties.

## The five roles

Enforced in code through NestJS guards — `@Roles()` plus `RolesGuard`, with
society-scoping middleware. The full permission list is PRD §6; this is the shape.

| Role           | Scope              | Owns                                                                                                                                                                                                                                                   |
| -------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPER_ADMIN`  | Platform-wide      | RWA onboarding, dealer approval, bulk inventory upload, inventory assignment, moderation, commission oversight, agreement tracking. Also "RDN Direct" mode — when a society has no active dealer, RDN handles leads itself so no society is uncovered. |
| `RWA_ADMIN`    | One society        | Approves listings and dealer applications inside their society, sees society earnings and reports. Can _request_ dealer deactivation but cannot execute it — only RDN decides, which deliberately protects dealers from society politics.              |
| `DEALER`       | One society        | Receives assigned inventory and leads, works them through the CRM, communicates via masked chat and calls only, earns commission.                                                                                                                      |
| `OWNER`        | Their own listings | Lists the property, approves visit access, tracks enquiries.                                                                                                                                                                                           |
| `BUYER_TENANT` | Platform-wide      | Browses without an account. Signs up with phone OTP to enquire, save, or chat.                                                                                                                                                                         |

A structural note worth internalising: the RWA mandate is **society-level, not
person-level**. Societies hold annual elections, so admin accounts change hands; the
agreement survives the leadership change and there is an admin-transfer process for it.

## How RDN makes money

| Transaction           | Commission                                             | Notes                                                                           |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Sale / purchase       | 1% from buyer + 1% from seller = 2% total              | Flat rate at every deal size — no cap, no sliding scale                         |
| Lease / rental        | 15 days' rent from each side = 1 month total           |                                                                                 |
| Renewal               | 0% currently                                           | Configurable in system settings; can be switched on later without a code deploy |
| Referral reward       | 5% of the total commission on the referred transaction | Marked tentative in the PRD                                                     |
| Property verification | Paid service                                           | **Pricing undecided** — see [06](./06-BACKLOG-PRIORITY-IMPACT.md)               |

**GST is inclusive, not additive.** On a ₹10 lakh sale the buyer pays ₹10,000 total; the GST
component (~₹1,525, being 18% of the service value) is extracted from that amount, not added
to it. The calculation is `gst_amount = commission_amount - (commission_amount / 1.18)`, and
invoices show the total, the GST breakout, and the net service value.

**The one undecided piece blocks real money.** How the collected commission splits between
RDN, the dealer, and the RWA has never been decided. The `TRANSACTIONS` table already carries
nullable `rdn_share`, `dealer_share`, and `rwa_share` columns waiting for it. Until Rajesh
decides, commission settlement, dealer payout, and the RWA earnings dashboard cannot go live.
This is tracked as a business blocker in [06](./06-BACKLOG-PRIORITY-IMPACT.md).

## Go-to-market shape (why the code looks how it does)

Two decisions here drive real engineering constraints:

1. **Organic search is a primary acquisition channel.** Society profile pages and property
   listing pages must be server-side rendered with Schema.org structured data. Each society
   page targets "[Society Name] [City] rent/sale". If you convert those pages to client-side
   rendering, you break the growth model — this is why the web app is Next.js App Router
   with SSR rather than a single-page app.
2. **RDN seeds its own supply.** The operations team bulk-uploads initial inventory, contacts
   sellers, verifies details, and posts listings professionally. Admin tooling is therefore
   a first-class surface, not an afterthought — batch operations and workflow queues matter.

## Phasing

**Phase 1** (what exists) — the core transaction platform: listings, search, masked
communication, notifications, lead CRM, commission and billing, verification, grievance
redressal, referrals, reports, SEO surfaces.

**Phase 2** (designed, not built) — "Society OS": visitor management, maintenance and dues,
community noticeboard, facility booking, vendor management, plus intelligence features like
price heatmaps, commute-based search, a full trust-scoring algorithm, and society-level
price intelligence. Nothing in Phase 2 has been started. See PRD §13.

## Compliance is a product feature here

RDN handles phone numbers, KYC documents, and bank details for Indian residents, which puts
it squarely under the **DPDP Act 2023**. That is why sensitive fields are encrypted at
application level, why there are data-export and account-deletion endpoints, why consent is
recorded with history, and why there is a public grievance channel. Treat these as
load-bearing product surfaces, not optional extras — [08 — Operations](./08-OPERATIONS-RUNBOOK.md)
covers the obligations you inherit.
