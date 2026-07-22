# RDN — Product Requirements Document

> **Version:** 1.0 (Final)
> **Last Updated:** 2026-02-22 · **Status banner added 2026-07-22**
>
> ### 📍 Build status
>
> **RDN has been live in production since 2026-07-14** (www.rdnetwork.in and
> api.rdnetwork.in, AWS ap-south-1). This PRD remains the authoritative statement of
> _intent_ — the problem, the model, the roles, and the feature specifications are current
> and were not rewritten at launch.
>
> It does **not** describe what is built. Several Phase 1 features here are complete and
> live, some are built but inert because a credential or business decision is missing, and
> all of Phase 2 is unstarted. **Before implementing against any section of this document,
> check [handover/05 — What is done](./handover/05-STATUS-WHAT-IS-DONE.md).**
>
> The one substantive item still undecided from §3 is the commission split between RDN, the
> dealer, and the RWA. It blocks settlement and payout.
>
> Related Documents:
>
> - **[Handover package](./handover/00-START-HERE.md)** — current state, backlog, operations
> - [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
> - [Database Schema](./DATABASE_SCHEMA.md)
> - [Project Structure](./PROJECT_STRUCTURE.md)
> - [Tech Stack](./TECH_STACK.md)
> - [Integrations](./INTEGRATIONS.md)
> - [Open Items](./OPEN_ITEMS.md)

---

## 1. Problem Statement

Residential societies face persistent challenges in real estate transactions:

- Dominance of unverified external property dealers
- Lack of transparency in pricing and commissions
- Security and privacy risks due to unrestricted broker access
- Fragmented processes for listing, verification, documentation, and closure
- Missed income opportunities for RWAs and residents

Residents with local knowledge remain underutilized, and RWAs lack structured tools to control and monetize real estate activity within their societies.

---

## 2. Vision & Purpose

RDN transforms real estate transactions within residential societies by creating a secure, transparent, and community-driven ecosystem. By empowering RWAs and residents as authorized dealers, RDN replaces unregulated external brokers with a trusted, society-controlled network.

---

## 3. Business Model

- **Exclusive RWA agreements** — RWAs mandate that all rent/sale/renewal transactions go through RDN; **3-year lock-in period** per society
- **Free for RWAs initially** — no registration/subscription fee; fees introduced later
- **Free for Resident Dealers initially** — no registration fee; fees introduced later
- **Commission structure:**
  - **Sale/Purchase:** 1% of deal value from buyer + 1% from seller (2% total, inclusive of GST)
  - **Leasing/Rental:** 15 days' rent from tenant + 15 days' rent from owner (1 month total, inclusive of GST)
  - **Renewals:** No commission charged currently. System is configurable — can be enabled later at same rates (1% sale / 15 days rent lease, inclusive of GST) or reduced/zero.
  - **GST treatment:** GST is **included** in the 1% / 15 days — extracted from the commission amount, not added on top
  - **High-value transactions:** Flat rate — same 1%+1% regardless of deal size (no cap, no sliding scale)
  - **Commission sharing (RDN <> Dealer <> RWA):** TBD — must be defined before launch
- **Renewals must happen through the app** — ensures tracking, commission eligibility, and data continuity
- **Resident Dealer is the front face** for all transactions across all price ranges — not RDN directly
- **Commission payout** — deposited into RDN account or payable in cash to company account
- **Referral reward:** 5% of total commission earned on the referred transaction (tentative — will revisit)
- **Property verification services** — paid service (pricing TBD)
- **No adjacent revenue streams in Phase 1**

---

## 4. Go-to-Market

- RDN already has agreements with multiple RWAs
- More RWA associations and integrations are in pipeline
- Inventory is not a constraint — RDN team uploads initial inventory via bulk upload
- RDN team contacts sellers, verifies property details, and professionally posts listings
- RDN markets listings and connects interested buyers/tenants through the application
- **SEO-optimized society and listing pages** for organic discovery from day 1
- **Referral system** for organic growth (see Section 7.15)

### Demand Generation (Buyer/Tenant Acquisition)

- **SEO** — society and listing pages optimized for organic search (long-term)
- **Content marketing** — blog, society spotlights, city guides (see Section 7.17)
- **Social media** — society success stories, testimonials, before/after
- **Referral rewards** — existing users refer friends
- **RWA circular distribution** — RWAs inform all residents of RDN availability
- **Local digital classifieds** — targeted ads in society WhatsApp groups, Facebook community pages
- **Corporate tie-ups** — partner with relocation firms, HR departments for employee housing (Phase 2)
- _Note: Paid ads strategy (Google/Meta) to be defined based on budget_

---

## 5. Phases

| Phase       | Scope                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Phase 1** | Core real estate platform — rentals, sales, renewals, verification, basic trust badges, grievance system, CRM, masked communication, notifications, referrals                                                                                                                  |
| **Phase 2** | Society OS + Intelligence — visitor management, maintenance & dues, community noticeboard, facility booking, vendor management, price heatmaps, commute-based search, full trust scoring algorithm, property comparison, auto-reminder calls, society-level price intelligence |

---

## 6. User Roles & Permissions

### 6.1 Super Admin (RDN)

- Full system access
- RWA onboarding and verification — only verified societies go live
- Dealer approval and compliance control
- Bulk inventory upload (initial phase)
- **Assign inventory to dealers** — distribute properties across dealers to avoid conflicts (e.g., 100 flats / 5 dealers = 20 each); RWA can also assign inventory
- Content moderation
- Commission & compliance oversight
- RWA & dealer performance dashboards
- Verification workflows
- **Agreement tracking dashboard** — track mandate status, renewal dates, terms per RWA
- **"RDN Direct" mode** — when a society has no active dealers, RDN team handles leads directly until dealers are onboarded; ensures no society is left without coverage

### 6.2 RWA / Society Admin

- Onboard their society on RDN (free initially; registration fee added later)
- Verify society details
- Approve or reject property listings inside the society
- **Approve or reject resident dealer applications** before they go live
- **Oversight on dealer conduct** — view dealer performance, ratings, complaints
- **Dealer deactivation** — RWA can flag/request deactivation, but only RDN decides (protects dealers from RWA politics)
- **Listing approval only** — RWA approves listings once; individual property visits managed between dealer and owner (RWA not involved in visit-level approvals)
- **One primary admin per society + secondary accounts** — primary admin has full access; secondary admins can be added with limited permissions. Societies have annual elections but the **3-year mandate lock-in** is society-level (not person-level), so leadership changes don't affect the agreement.
- **Admin transfer process** — when RWA leadership changes (annual elections), RDN facilitates admin role transfer to new committee (old primary admin deactivated, new primary admin onboarded); secondary accounts updated as needed. Mandate survives leadership changes.
- Dashboard: all leads generated, transactions, commission tracking, reports & analytics
- **Visibility into society earnings** from RDN transactions
- **Data export** — download reports as PDF/Excel for board presentations, tax filing
- Later phase: self-service inventory upload

### 6.3 Resident Dealer (Key Differentiator)

- Apply as a dealer to earn within their society (free initially; registration fee added later)
- **Approved by RWA** before going live
- **Mandatory training by RDN** — RDs are the front face of RDN; trained on real estate dealings, processes, and conduct before activation. RDN provides ongoing support.
- Verified resident or authorized local dealer
- **Receives assigned inventory from RDN or RWA** — handles properties assigned to them
- **Auto-reassignment** — if dealer doesn't respond to a lead within a set time, lead auto-routes to next available dealer in the society
- List flats for rent, sale, or commercial units (if applicable)
- Receive leads **only for their society** — no cross-society leads
- No direct phone number sharing with buyers/tenants
- Earn commission through RDN
- Profile with KYC verification
- Built-in CRM for lead status updates
- Commission account (add/delete commissions, settled monthly)
- **Bank account linking** — dealers can link bank accounts for direct commission payouts

### 6.4 Property Owner (Seller/Lessor)

- List property professionally without paying upfront fees
- List property via resident dealer or society dashboard
- Upload photos and videos
- Enter price, size, and availability
- Track inquiries and status: **Visited > Negotiated > Closed**
- **Approve/control property access** — owner must approve visit requests before dealer can schedule
- Receive proper billing for GST input credit claims

### 6.5 Buyer / Tenant

- **Browse listings without creating an account** (open access)
- Sign up required to enquire, save, chat, call, or schedule visits
- Search properties across all-India RWAs
- Filter by city, sector, society, rent/buy, budget, BHK, furnishing
- Connect with resident dealer via **in-app chat** and **masked calling**
- Schedule property visits
- **Structured negotiation** — transparent process without pressure from any party
- Track deal status
- **Buyer/tenant dashboard** — viewed properties, shortlisted, scheduled visits, active negotiations, deal history, saved searches

### 6.6 Role Management & Permissions

**Role Hierarchy:**

```
Super Admin (RDN) → RWA Admin (per society) → Resident Dealer (per society)
Super Admin (RDN) → Property Owner (per listing) / Buyer-Tenant (platform-wide)
```

**Role Lifecycle:**

- **Super Admin:** Created internally by RDN. Sub-permissions: Operations (bulk upload, verification, assignment), Support (grievances, dealer mgmt), Finance (commissions, invoices, settlements), Management (full access, config, reporting)
- **RWA Admin:** Self-registers → verified by RDN → activated. Transfer: RDN deactivates old, onboards new. Deactivation: RDN can deactivate if mandate breached.
- **Resident Dealer:** Self-applies → KYC by RDN → approved by RWA → trained by RDN → activated. Deactivation: RWA requests, RDN decides. Exit: leads auto-reassign, inventory manually reassigned.
- **Property Owner:** Registered when listing (or listed by RDN). Verified during property verification. Active while listing/transaction exists. Can own in multiple societies.
- **Buyer/Tenant:** Self-registers with phone OTP. No KYC to browse/enquire. KYC at deal closure. Can search across all societies.

**Permission Matrix:**

| Action                      | Super Admin |   RWA Admin    |  Dealer  |  Owner   |   Buyer/Tenant    |
| --------------------------- | :---------: | :------------: | :------: | :------: | :---------------: |
| Onboard RWA                 |     Yes     |       -        |    -     |    -     |         -         |
| Bulk upload inventory       |     Yes     |       -        |    -     |    -     |         -         |
| Verify properties           |     Yes     |       -        |    -     |    -     |         -         |
| Assign inventory to dealers |     Yes     |      Yes       |    -     |    -     |         -         |
| Approve/reject listings     |     Yes     |      Yes       |    -     |    -     |         -         |
| Approve/reject dealers      |     Yes     |      Yes       |    -     |    -     |         -         |
| List a property             |     Yes     |      Yes       |   Yes    |   Yes    |         -         |
| View leads (all societies)  |     Yes     |       -        |    -     |    -     |         -         |
| View leads (own society)    |     Yes     |      Yes       | Own only | Own only |         -         |
| Chat / Call (masked)        |     Yes     |       -        |   Yes    |    -     |        Yes        |
| Generate invoices           |     Yes     |       -        |    -     |    -     |         -         |
| View commission reports     |     Yes     |  Own society   | Own only |    -     |         -         |
| File grievance              |     Yes     |      Yes       |   Yes    |   Yes    |        Yes        |
| Resolve grievance           |     Yes     | Own society L2 |    -     |    -     |         -         |
| Deactivate dealer           |     Yes     |  Request only  |    -     |    -     |         -         |
| Browse listings             |     Yes     |      Yes       |   Yes    |   Yes    | Yes (open access) |
| Export data                 |     Yes     |      Yes       |    -     |    -     |         -         |

---

## 7. Core Features

### 7.1 All-India RWA Society Directory

- City-wise, sector-wise, society-wise listings
- **Search flow:** City → Area → Society → Property
- Each **society profile page** shows:
  - Society overview (age, total units, occupancy rate)
  - Amenities with photos (gym, pool, park, clubhouse)
  - Connectivity (metro, highway, schools, hospitals nearby)
  - Available properties with average rent/sale prices per BHK
  - Verified resident dealers
  - RWA status (Onboarded / In Progress)
  - Recent transaction activity (anonymized)
  - Verified badge prominently displayed
  - Testimonials and ratings
- **SEO-optimized** — each society page indexable for "[Society Name] [City] rent/sale"
- **Empty state handling** — for cities with no onboarded societies: "Coming soon to [City]" with waitlist signup and "Notify me" option
- Structured, RWA-based property search platform

### 7.2 Property Listings & Inventory Management

- **Bulk upload** by RDN team (initial phase) — supports CSV/Excel import
- Later: self-service upload by RWAs and property owners
- **Seller/owner verification** — verify seller details before publishing any listing
- **Inventory assignment to dealers** — RDN distributes properties across dealers within a society to avoid conflicts
- **Duplicate listing prevention:**
  - Each property tied to unique identifier (flat number + tower/block + society)
  - System prevents duplicate listings for the same unit
  - Only verified owner or RDN-authorized dealer can list
  - Cannot list a property you're renting (ownership verification required for sale listings)
- Rent / Sale / Renewal classification
- Verified property badges
- **Media requirements:**
  - Minimum 5 photos per listing
  - Recommended resolution guidelines
  - Video walkthrough support (optional but encouraged)
  - RDN may enhance photos/descriptions professionally
- **Availability status** on every listing: Available Now / Available from [date] / Under Notice Period
- Pricing & availability status
- Property details: size, BHK, floor, facing, age of property
- **Trending/hot listings** — "Most viewed this week", "New listings" badge with timestamp, "Recently closed" (anonymized)
- **Data export** — bulk export for RDN admin (CSV/Excel)

### 7.3 Property Search & Smart Matching Engine

- Smart filters:
  - Budget range
  - BHK (Bedroom, Hall, Kitchen)
  - Furnishing details (furnished, semi-furnished, unfurnished)
  - Family / Bachelor allowed
  - Parking details
  - Power backup details
  - Lift availability
- Best match recommendations
- "No surprises" approach — all relevant details upfront
- **Shortlist / Save** — bookmark listings, get notified on price drops or status changes
- **Similar properties** suggestions based on search criteria
- **Save search** — get notified when new listings match criteria

### 7.4 Communication System

- **In-app chat** between buyer/tenant and resident dealer
- **Masked calling** — no phone number sharing between any parties
  - Options: In-app VOIP calling OR masked call bridge (Exotel/Knowlarity/MyOperator)
- **WhatsApp as notification channel** — lead updates, visit reminders, deal status alerts (actual conversations stay in-app for record-keeping)
- Call and chat logs retained for dispute resolution and compliance

### 7.5 Notification System

Unified notification framework across all user types:

| Event                            | In-App | Push | WhatsApp |
| -------------------------------- | :----: | :--: | :------: |
| New lead received                |  Yes   | Yes  |   Yes    |
| Lead status change               |  Yes   | Yes  |    No    |
| Visit scheduled/reminder         |  Yes   | Yes  |   Yes    |
| Visit reminder (2hr before)      |  Yes   | Yes  |   Yes    |
| Owner visit approval request     |  Yes   | Yes  |   Yes    |
| Price drop on saved listing      |  Yes   | Yes  |    No    |
| New listing matches saved search |  Yes   | Yes  |    No    |
| Deal in negotiation              |  Yes   | Yes  |    No    |
| Deal closed                      |  Yes   | Yes  |   Yes    |
| Commission credited              |  Yes   | Yes  |    No    |
| Grievance update                 |  Yes   | Yes  |    No    |
| Renewal reminder (60/30 days)    |  Yes   | Yes  |   Yes    |
| Dealer application status        |  Yes   | Yes  |   Yes    |
| RWA onboarding status            |  Yes   | Yes  |   Yes    |

- Users can configure notification preferences in Settings
- WhatsApp requires opt-in during onboarding

### 7.6 Lead Management & CRM

**Three-level CRM:**

**RDN Level (Platform-wide):**

- All leads across all societies
- Filter by city, society, dealer, status, date range
- Identify stalled leads and intervene
- Reassign leads when needed
- Pipeline view: funnel visualization across all stages
- Lead source tracking (app search, WhatsApp, referral, walk-in)

**RWA Level (Society-wide):**

- All leads within their society
- Dealer performance comparison
- Lead response time monitoring
- Flag slow-responding dealers

**Dealer Level (Assigned leads):**

- Personal CRM inbox
- Lead status tracking: New → Contacted → Visited → Negotiated → Closed
- Lead assignment per society
- WhatsApp follow-up reminders (manual trigger)
- Scheduling and visit coordination
- **Property visit flow:** Buyer requests visit → Dealer coordinates → **Owner approves access** → Visit scheduled → Feedback collected
- **Structured negotiation support** — transparent process, no pressure tactics, RDN mediates if needed
- Inquiry tracking for property owners
- **Follow-up SLA** — if dealer doesn't respond within set time, lead auto-reassigns

### 7.7 Commission & Billing

- **Commission rates:**
  - Sale/Purchase: 1% from buyer + 1% from seller (inclusive of GST)
  - Lease/Rental: 15 days' rent from tenant + 15 days' rent from owner (inclusive of GST)
  - Renewals: Currently zero. Configurable — can be enabled at 1% (sale) / 15 days rent (lease), inclusive of GST.
- **GST treatment:** GST is **included** in the 1% / 15 days amount — extracted from the commission, not added on top. Example: on a Rs 10L sale, buyer pays Rs 10,000 (1%) total, of which ~Rs 1,525 is GST (18% of service value).
- **High-value transactions:** Flat rate — same 1%+1% applies regardless of deal size. No cap, no sliding scale.
- Commission auto-calculated based on deal value and transaction type
- Commission sharing (RDN <> Dealer <> RWA split): configurable, TBD — must be defined before launch
- Commission tracking per transaction
- Commission account per dealer (add/delete entries)
- Monthly settlement cycle
- **Automated GST-compliant invoice generation** (18% GST on service)
- **Owner billing** — proper invoices for owners to claim GST input credit
- **Buyer/tenant billing** — proper invoices for their commission portion
- Revenue reports for RWAs with **full visibility into society earnings**
- Payout to RDN account or cash to company
- Payout to dealer's linked bank account
- **Data export** — invoices, reports downloadable as PDF/Excel

**Commission Collection Mechanism:**

- Invoice generated at deal closure
- Payment collected via: UPI/bank transfer (preferred) or cash to RDN company account
- Payment terms: due at deal closure, before handover/move-in
- Receipt generated for every payment
- Overdue tracking: if commission not paid within 7 days, automated reminders; escalation to RDN team
- Payment gateway: **Razorpay** (UPI, cards, net banking)

### 7.8 Verification System

**A. Society/RWA Verification**

1. RWA submits registration with society details + RWA certificate
2. RDN verifies society exists (local records, Google Maps, physical visit if needed)
3. RDN verifies person is an authorized RWA representative (committee member ID, authorization letter)
4. Society marked as **Verified** → society page goes live

**B. Dealer Verification (KYC)**

1. Resident submits dealer application with Aadhaar/PAN + proof of residency (society ID, utility bill, flat ownership doc)
2. RDN verifies identity documents (Aadhaar validation, PAN check)
3. RDN confirms residency — person actually lives in the society
4. KYC marked **Approved** → sent to RWA for final approval
5. RWA reviews and approves/rejects → dealer goes live after mandatory training

**C. Property Verification**

1. Owner/dealer submits property details + photos
2. RWA admin approves listing (confirms property exists in society)
3. RDN team contacts owner and verifies:
   - **Ownership:** Owner name matches property records
   - **Physical condition:** Photos match reality (video call or visit if needed)
   - **Legal status:** No encumbrances, no pending litigation, clear title (for sale)
   - **Availability:** Confirmed available on stated date
4. Property marked as **Verified** → green verification badge on listing

**Verification Statuses (visible on listings):**

- **Pending** — submitted, awaiting review
- **RWA Approved** — RWA confirmed, RDN verification in progress
- **Verified** — fully verified by RDN (green badge)
- **Flagged** — issue found during verification (not visible to public, under review)
- **Rejected** — verification failed (owner notified with reason)

_Phase 1 uses simple Verified / Not Verified badges. Full trust scoring algorithm moves to Phase 2._

### 7.9 Grievance Redressal System

**Who Can File:** Any user — buyer, tenant, owner, dealer, RWA admin, or against RDN itself.

**Filing Process:**

1. User goes to "Support" / "Raise Grievance" in-app
2. Selects category: Dealer conduct, Property mismatch, Commission dispute, Service quality, Safety concern, Other
3. Selects related transaction/listing/dealer/society
4. Describes the issue (text + optional photo/document upload)
5. Ticket created with unique ID, SLA clock starts

**Escalation Matrix:**

- **Level 1:** Resident Dealer (if complaint involves their transaction) → 48hr to resolve
- **Level 2:** RWA Admin (society-level oversight) → 72hr to resolve
- **Level 3:** RDN Team (final authority)
- **Level 4:** RDN Management / Legal (complex/legal cases)

**SLA Timelines:**

| Severity                                     | Response Time | Resolution Target |
| -------------------------------------------- | ------------- | ----------------- |
| Critical (safety, fraud, legal)              | 4 hours       | 24 hours          |
| High (commission dispute, property mismatch) | 12 hours      | 72 hours          |
| Medium (service quality, conduct)            | 24 hours      | 5 business days   |
| Low (general feedback, suggestions)          | 48 hours      | 10 business days  |

**Resolution Process:**

1. Assigned to appropriate level based on category
2. Investigator reviews: transaction records, chat logs, call logs, visit history
3. Both parties contacted for their side
4. Resolution proposed (refund, dealer warning, listing correction, etc.)
5. If accepted → ticket closed, feedback collected
6. If rejected → escalated to next level
7. Final resolution by RDN is binding

**Actions RDN Can Take:**

- Warn, suspend, or permanently deactivate a dealer
- Issue refunds
- Correct or remove a listing
- Escalate to legal if fraud/criminal activity detected
- Ban a user for policy violations

**Visibility:**

- Filer: ticket status, assigned handler, SLA countdown, resolution
- RWA Admin: all grievances in their society, dealer-specific complaints
- RDN Admin: all grievances platform-wide, SLA compliance, repeat offenders

### 7.10 Testimonials & Feedback

- Post-deal feedback for completed transactions
- General platform testimonials
- Visible on society pages and dealer profiles
- Feeds into verification credibility (Phase 1) and trust scores (Phase 2)

### 7.11 Property Lifecycle Management

- **Status flow:** Available → Under Enquiry → Under Negotiation → Deal Closing → Rented / Sold
- **Rental post-closure:** Property delisted → auto-reminder sent at configurable days before lease expiry → property auto-relists as Available Again
- **Sale post-closure:** Property permanently delisted
- **Deal fallthrough:** Property auto-reverts to Available; buyer/owner notified; lead status reset
- **Deal cancellation policy:**
  - Default expectation displayed to users: "Commission is non-refundable once the deal is marked as Closed"
  - Exceptions handled case-by-case by RDN team
  - Platform supports refund processing when decided by RDN
  - Cancellation before closure: no commission charged, property reverts to Available
- **Owner withdraws listing:** Active leads notified; property delisted; dealer's inventory updated

### 7.12 Renewal Management

- Auto-reminder to tenant and owner before lease expiry (configurable: 60/30 days)
- **Renewals must happen through the app** — ensures tracking, data continuity, and future commission eligibility
- **Renewal commission:** Currently zero (no commission on renewals). System is configurable — can be enabled later at 1% (sale) / 15 days rent (lease), inclusive of GST, or any custom rate.
- Original dealer handles renewal by default; can be reassigned if dealer is inactive
- Renewal counts as a transaction in all dashboards and reports

### 7.13 Dealer Exit & Reassignment

- Dealer can request deactivation (moving out, personal reasons)
- RDN can deactivate a dealer (conduct issues, RWA request)
- On dealer exit:
  - **Active leads auto-reassign** to next available dealer in the society (time-sensitive)
  - **Assigned inventory manually reassigned** by RDN team (requires review)
  - Pending commissions still settled to dealer's bank account
  - Dealer profile archived (not deleted — historical data retained for reports)

### 7.14 Reports & Analytics

- RWA dashboard: leads, transactions, commissions, property performance
- Dealer dashboard: leads, earnings, ratings
- Admin dashboard: platform-wide metrics, RWA performance, dealer performance
- KPIs: RWAs onboarded, active dealers, monthly listings, closures, avg deal time, CSAT, RWA revenue
- **All reports exportable as PDF/Excel**

### 7.15 Referral System

- **Referral reward:** 5% of total commission earned on the referred transaction (tentative — will revisit)
- **Buyer/Tenant referral:** Share listing or platform link → friend signs up and transacts → referrer gets 5% of commission
- **Dealer referral:** Refer new dealer candidates → 5% bonus on their first deal closure
- **RWA referral:** RWA refers another RWA → 5% commission boost or bonus
- Referral tracking with unique codes/links
- Referral dashboard showing invites sent, conversions, rewards earned
- Simple "Share this listing" button on every property (WhatsApp, SMS, copy link)

### 7.16 SEO & Organic Discovery

- Every society profile page SEO-optimized for "[Society Name] [City] rent/buy/flat"
- Every listing page indexable with structured data (Schema.org markup)
- City and area landing pages for "flats for rent in [Area] [City]"
- Sitemap auto-generated as new societies and listings are added
- Meta titles, descriptions auto-generated from property/society data
- Mobile-friendly pages (Google mobile-first indexing)

### 7.17 Content Strategy (Supports SEO & Demand Generation)

- **Blog / Knowledge Center:**
  - "Moving to [City]? Here's your complete guide"
  - "Top 10 societies in [Area] for families"
  - "Renting vs buying: what you need to know"
  - Rent agreement guides by state
  - Society spotlight articles (interviews with RWA, resident stories)
- **Purpose:** Drive organic search traffic, build brand authority, educate users on RDN model
- Content updated weekly; managed by RDN marketing team
- Blog pages link to relevant society/listing pages (internal linking for SEO)
- Shareable on social media (WhatsApp, Facebook, Instagram)

---

## 8. User Journeys

### 8.1 RWA Onboarding

1. RWA committee member registers on RDN with society details + RWA certificate
2. RDN verifies society and representative credentials
3. Exclusive mandate agreement signed (NDA + service agreement) — **3-year lock-in period**
4. Agreement stored in mandate tracking dashboard (dates, terms, lock-in expiry, renewal)
5. RDN team collects property data and bulk uploads initial inventory
6. RWA admin reviews and approves each listing
7. RDN verifies properties → listings go live with verification badges
8. Dashboard goes live — RWA monitors leads, transactions, dealer performance, and earnings
9. RWA approves resident dealer applications as they come in

### 8.2 Resident Dealer Flow

1. Resident discovers RDN (RWA circular, society WhatsApp group, word of mouth)
2. Signs up and submits dealer application with KYC documents + proof of residency
3. RDN verifies identity and residency
4. RWA admin approves the dealer
5. **Mandatory training by RDN** — real estate processes, conduct, platform usage
6. Dealer activated → receives assigned inventory from RDN/RWA
7. Leads arrive in CRM inbox as buyers enquire on assigned properties
8. Dealer responds via masked chat/call (auto-reassignment if no response within set time)
9. Coordinates property visits (owner approves access)
10. Facilitates negotiation (structured, no pressure, RDN mediates if needed)
11. Deal closure with RDN backend support (documentation, invoicing)
12. Commission credited to account → settled monthly to linked bank account
13. Buyer and owner rate the dealer → feeds into profile

### 8.3 Property Owner Flow

1. Owner has a property for rent or sale
2. Submits details via resident dealer or society dashboard (no upfront fee)
3. Uploads photos/videos, enters price, size, availability, restrictions
4. RWA admin approves the listing
5. RDN team verifies owner details and property → listing goes live with badge
6. Owner receives inquiry notifications as leads come in
7. Owner approves property access when visit is requested (sets access rules)
8. Tracks inquiry status: Visited → Negotiated → Closed
9. Participates in negotiation (facilitated by dealer, mediated by RDN if needed)
10. Signs off on deal terms
11. Receives GST-compliant invoice for commission paid
12. For rentals: receives renewal reminder before lease expiry

### 8.4 Buyer/Tenant Flow

1. Discovers RDN (Google search, referral, social media, society recommendation)
2. Browses listings freely without account (open access)
3. Searches: City → Area → Society → Property with smart filters
4. Views verified listings with badges, photos, "no surprises" details
5. Signs up (phone OTP) to enquire, save, or schedule
6. Shortlists properties → receives notifications on changes
7. Connects with resident dealer via masked chat/call
8. Schedules property visit (owner approves access)
9. Visits property with dealer
10. Negotiation (structured, transparent, no pressure)
11. Deal closure → commission paid (15 days rent for rental / 1% for sale)
12. Receives GST-compliant invoice
13. Rates dealer and property accuracy
14. For tenants: receives renewal reminder before lease expiry

### 8.5 Super Admin (RDN Team) Internal Flow

1. **RWA Onboarding:** Receive application → verify → sign mandate → store in tracking dashboard
2. **Bulk Inventory Upload:** Collect data → clean/format → bulk upload (CSV/Excel) → tag status
3. **Property Verification:** Contact owner → verify ownership, condition, legal status → mark Verified or flag
4. **Inventory Assignment:** View dealer roster → distribute properties → notify dealers
5. **Dealer Approval:** Review KYC → verify residency → approve/reject → trigger RWA approval
6. **Lead Monitoring:** View all leads platform-wide → filter/intervene/reassign
7. **Commission Oversight:** Review deals → verify calculations → generate invoices → process settlements
8. **Platform Health:** Monitor KPI dashboard → performance metrics → SLA compliance
9. **Grievance Resolution:** Handle escalated grievances → investigate → resolve
10. **Content Moderation:** Review flagged listings → verify accuracy → remove violations

### 8.6 Grievance Flow

1. Any party submits grievance via app (category, description, evidence)
2. Ticket created with unique ID and SLA clock
3. Assigned to appropriate escalation level
4. Investigation: transaction records, chat/call logs, visit history reviewed
5. Resolution proposed → accepted or escalated
6. Final resolution by RDN is binding
7. Feedback collected post-resolution

---

## 9. Agreements, Compliance & Data Privacy

### 9.1 Legal Agreements (Provided by RDN, hosted on platform)

- NDA & exclusive service agreement between RDN and RWA
- Dealer partnership agreement (commission terms, code of conduct)
- Terms of Service for all user types
- Dispute resolution policy
- _All documents provided by RDN team — platform must host and display them_

### 9.2 Regulatory Compliance

- **RERA** — already in place; no further action needed
- **GST** — 18% on commission services; GST-compliant invoice generation built into the commission module
- **Rent agreements & tenancy** — handled by RDN with state-wise legal templates; not a platform concern
- **Masked calling** — choose a provider (Exotel / Knowlarity / MyOperator); retain call/chat logs for disputes

### 9.3 Data Privacy & Consent (Build into Platform)

Platform must implement the following:

- **Explicit consent collection** before gathering any personal data
- **Consent flows during onboarding** — users must accept before proceeding
- **Privacy policy page** — clearly states what data is collected and why; accessible from app at all times
- **User data rights:**
  - View their own data
  - Correct/update their data
  - Delete their data
- **Data deletion option in Settings** — users can request account and data deletion
- **Role-based access control** — users see only what their role permits
- **KYC data encrypted** at rest and in transit
- **Phone numbers never exposed** between parties (masked calling enforced)
- **Data retention policies** defined per data type
- **Breach notification** — process in place for timely response

---

## 10. UI/UX Guidelines

### 10.1 Design Principles

- **Clean, minimal interface** — real estate platforms are data-heavy; avoid clutter
- **Trust-first design** — verification badges and testimonials should be prominent, not buried
- **Mobile-first** — majority of Indian users will access via mobile; design for mobile, adapt for desktop
- **Fast load times** — property images are heavy; lazy loading, image optimization, skeleton screens
- **Vernacular readiness** — design with multi-language support in mind (Hindi, regional languages in Phase 2)

### 10.2 First-Time User Onboarding

- **Buyer/Tenant:** App opens → brief 3-screen walkthrough ("Search verified societies → Connect with local dealers → Close with confidence") → lands on homepage with search bar → can browse immediately without sign-up
- **Property Owner:** "List your property" → simple form with guided steps → consent + submit → dashboard view
- **Resident Dealer:** "Become a Dealer" → explains earning model → KYC upload flow → "Application submitted, we'll be in touch"
- **RWA Admin:** "Register your Society" → society details form → document upload → "RDN team will verify and contact you"
- All onboarding flows include consent checkboxes (ToS, Privacy Policy) before any data collection
- Contextual tooltips on first use of key features (search, chat, CRM)

### 10.3 Key UI Patterns

**Home / Landing Page**

- Hero search bar with City → Area → Society flow
- Quick filters: Rent / Buy / Renewal toggle
- Trending societies and hot listings carousel
- Trust indicators: "X societies onboarded", "Y deals closed", "Z verified listings"
- Testimonials section
- City-wise browsing cards

**Society Profile Page (Key Landing Page)**

- Hero banner with society photos
- Verified badge (prominent)
- Quick stats: total units, available listings, avg price, amenities count
- Tabs: Overview | Available Properties | Dealers | Reviews
- Average rent/sale price per BHK
- Amenities grid with icons
- Connectivity info (nearby metro, schools, hospitals)
- Resident dealer cards with ratings
- Recent activity feed (anonymized)

**Property Listing Card**

- Primary photo with image count badge
- Availability status tag (Available Now / From Date)
- Price prominently displayed
- Key details: BHK, sqft, floor, furnishing
- Verification badge
- "New" or "Trending" badges where applicable
- Action buttons: Save/Shortlist, Chat, Call (masked)
- Swipeable photo gallery on mobile

**Property Detail Page**

- Full photo/video gallery with fullscreen view
- Price with per-sqft breakdown
- All property details in organized sections (not a wall of text)
- Amenities checklist with icons
- "No surprises" section: parking, power backup, lift, family/bachelor, pets
- Dealer card with rating, response time, deals closed
- Similar properties carousel
- Enquiry CTA (chat / call) — sticky on mobile

**Search & Filter UX**

- Persistent search bar at top
- Filter chips (quick toggle on/off)
- Sort: Price low-high, newest, most viewed, best match
- "X properties found" counter updates in real-time as filters change
- Save search with notification alerts
- **Empty state:** "No results. Try expanding your search or browse nearby societies."

**Buyer/Tenant Dashboard**

- Viewed properties (recent)
- Shortlisted properties with status indicators
- Scheduled visits (upcoming + past)
- Active negotiations
- Deal history
- Saved searches with notification toggle

**Dashboard (RWA / Dealer / Admin)**

- Summary cards at top: leads, active listings, closures, earnings
- Charts: monthly trends, lead funnel, commission breakdown
- Recent activity feed
- Quick actions: upload listing, respond to lead, generate invoice
- Clean data tables with search, filter, export

### 10.4 Mobile App Specifics

- Bottom navigation: Home, Search, My Listings, Chat, Profile
- Pull-to-refresh on listing feeds
- Push notifications for leads, messages, price changes, status updates
- Swipe gestures: swipe to save, swipe to dismiss
- Camera integration for property photo uploads
- Location-based society suggestions on launch

### 10.5 Accessibility & Performance

- WCAG 2.1 AA compliance targets
- Skeleton loading states (not spinners)
- Image lazy loading with blur-up placeholders
- Offline browsing for saved/shortlisted properties (PWA)
- Sub-3-second initial page load target
- Responsive breakpoints: mobile (375px), tablet (768px), desktop (1280px+)

---

## 11. Non-Functional Requirements

- Data security with role-based access
- Compliance with GST & local regulations
- Scalable architecture for multi-society, multi-city onboarding
- High availability & performance
- PWA capabilities for web app
- Native mobile app experience
- Offline-capable for basic browsing (PWA)
- SEO-friendly server-side rendering

**Operational Scalability Note:**

Phase 1 relies heavily on the RDN team for manual operations (verification, bulk upload, dealer training, inventory assignment, grievance resolution, commission processing). Admin tools must be built with efficiency in mind:

- **Batch processing** for bulk upload and verification workflows
- **Template-based** verification checklists (not freeform)
- **Automated commission calculation** — reduce manual entry
- **Workflow queues** with status tracking — so the team knows what's pending
- **Estimated capacity:** Each RDN operations team member can handle ~5 societies / ~500 properties. Plan team size accordingly.
- **Phase 2 self-service** (RWA uploads, dealer self-onboarding with automated KYC) reduces this bottleneck

---

## 12. Success Metrics (KPIs)

**Growth Metrics:**

- Number of RWAs onboarded
- Active resident dealers per society
- Monthly property listings (rent + sale + renewal)
- Monthly deal closures
- Buyer/tenant signups and active users

**Business Metrics:**

- **Revenue per society per month** — core unit economics metric
- **Time to first deal** per new society — measures activation speed
- **Dealer activation rate** — % of trained dealers who close at least 1 deal
- **Listing-to-closure conversion rate** — measures funnel efficiency
- Average deal closure time

**Quality Metrics:**

- User satisfaction (CSAT)
- **Lead response time** — avg time for dealer to respond to new lead
- Grievance resolution rate within SLA
- Verification turnaround time

**Acquisition Metrics:**

- Organic traffic to society/listing pages
- Referral conversion rate
- **Cost per buyer/tenant acquisition** (when paid channels are used)
- Buyer/tenant retention (repeat visits, shortlist usage)

**Revenue Metrics:**

- RWA revenue generated via RDN
- Commission collected per month
- Outstanding commission (overdue payments)

---

## 13. Phase 2 Preview (Society OS + Intelligence)

_Not in scope for Phase 1 — documented for future reference_

**Society OS:**

- Visitor management system
- Maintenance & dues management
- Community noticeboard
- Facility booking (gym, clubhouse, party hall)
- Vendor management (plumber, electrician, etc.)
- Home services marketplace
- Home loan partnerships
- Tenant background verification

**Intelligence Features:**

- Full trust scoring algorithm (property, dealer, society, listing scores)
- Price heatmap — interactive map with rent/sale prices by area
- Commute-based search — "societies within X mins of [location]"
- Property comparison — side-by-side (up to 3)
- Society-level price intelligence — quarterly trends, per-BHK breakdown
- Auto-reminder calls for lead conversion
- Multi-language support (Hindi, regional languages)
- Multi-admin per society
