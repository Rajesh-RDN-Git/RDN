# RDN — Open Items

> **Version:** 1.1
> **Last Updated:** 2026-07-22
>
> Related Documents:
>
> - [PRD](./PRD.md)
> - [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
> - **[Handover backlog](./handover/06-BACKLOG-PRIORITY-IMPACT.md)** — the live, prioritised list

---

> **Scope note (2026-07-22).** This document tracks **business decisions only**. The
> engineering backlog moved to
> [`handover/06-BACKLOG-PRIORITY-IMPACT.md`](./handover/06-BACKLOG-PRIORITY-IMPACT.md),
> where these decisions appear as the `BIZ-*` band alongside their technical consequences.
> Maintaining two lists is how they drift, so treat the handover backlog as authoritative
> for anything with a code implication.

## Pending Items (Must Resolve Before Development)

These items require business decisions before the corresponding features can be fully implemented.

Two items have been added since v1.0 (both surfaced after go-live, both now tracked as
`BIZ-2` and `BIZ-7` in the handover backlog):

- **DPO / Grievance Officer designation** — a statutory requirement under the DPDP Act 2023.
  `compliance/DPIA-v1.md` still carries a placeholder. Blocks nothing technically; it is a
  live legal exposure.
- **Legal sign-off** on the terms of service, privacy policy, and RWA mandate agreement —
  none have been reviewed by counsel.

### 1. Commission Sharing Split (RDN <> Dealer <> RWA)

|                      |                                                                                                                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**           | Pending — **still undecided as of 2026-07-22**, now the single largest product blocker (see `BIZ-1`)                                                                                                                                      |
| **Impact**           | High — the platform is live and can transact, but cannot pay anyone. Blocks commission settlement, dealer payout, and the RWA earnings dashboard.                                                                                         |
| **Context**          | Total commission collected is 2% on sale (1% buyer + 1% seller) or 1 month rent on lease (15 days from each party). How this total is split between RDN, the Resident Dealer, and the RWA has not been decided.                           |
| **What's needed**    | Percentage split definition. Example: 50% RDN / 40% Dealer / 10% RWA — or any other split.                                                                                                                                                |
| **Technical impact** | The `TRANSACTIONS` table has `rdn_share`, `dealer_share`, `rwa_share` columns (nullable until decided). Commission calculation logic in `apps/api/src/modules/commission/` will use configurable rates stored in a settings/config table. |
| **Blocked features** | Commission settlement, dealer payout, RWA earnings dashboard                                                                                                                                                                              |

### 2. Property Verification Service Pricing

|                      |                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Status**           | Pending                                                                                                              |
| **Impact**           | Medium — does not block core platform but blocks verification as a revenue stream                                    |
| **Context**          | Property verification is listed as a paid service. Who pays (owner? buyer? both?) and how much has not been decided. |
| **What's needed**    | Pricing model: flat fee vs percentage, who pays, when payment is collected.                                          |
| **Technical impact** | Needs a pricing entry in the commission/billing module. May require a separate invoice type.                         |
| **Blocked features** | Verification billing, verification as a revenue line item                                                            |

### 3. Demand Generation Budget and Channel Strategy

|                      |                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Status**           | Pending                                                                                                                                    |
| **Impact**           | Medium — affects marketing execution, not platform development                                                                             |
| **Context**          | SEO, content marketing, and referrals are defined. Paid advertising strategy (Google Ads, Meta Ads) depends on budget allocation.          |
| **What's needed**    | Monthly marketing budget, channel allocation (SEO vs paid vs content vs referral), target CAC (cost per acquisition).                      |
| **Technical impact** | Low — platform supports UTM tracking and referral codes regardless of channel strategy. May need landing page variants for paid campaigns. |
| **Blocked features** | None technically — but marketing execution is blocked                                                                                      |

### 4. RDN Operations Team Size Planning

|                      |                                                                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**           | Pending                                                                                                                                                                                                                                |
| **Impact**           | Medium — affects operational readiness, not development                                                                                                                                                                                |
| **Context**          | Phase 1 relies on the RDN team for verification, bulk upload, dealer training, inventory assignment, grievance resolution, and commission processing. Estimated capacity is ~5 societies / ~500 properties per operations team member. |
| **What's needed**    | Target number of societies for launch → calculate team size needed.                                                                                                                                                                    |
| **Technical impact** | Affects admin tool design — batch processing efficiency, workflow queue capacity, dashboard load expectations.                                                                                                                         |
| **Blocked features** | None technically — but operational launch is blocked                                                                                                                                                                                   |

---

## Decided Items (Resolved)

These items were previously open but have been resolved with clear decisions.

### Renewal Commission Rate

|                              |                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Decision**                 | Zero commission on renewals currently                                                                                                                                                |
| **Details**                  | System is configurable — can be enabled later at 1% (sale) / 15 days rent (lease), inclusive of GST, or any custom rate.                                                             |
| **Technical implementation** | Commission calculation checks `transaction.type === RENEWAL` and applies the configured renewal rate (default: 0). Rate stored in system config, changeable without code deployment. |

### GST Treatment ("Inclusive of GST")

|                              |                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision**                 | GST is included in the commission amount — extracted from the total, not added on top                                                                     |
| **Details**                  | On a Rs 10L sale, buyer pays Rs 10,000 (1%). Of that, ~Rs 1,525 is GST (18% of the service component). The buyer's total outflow is still just Rs 10,000. |
| **Technical implementation** | `gst_amount = commission_amount - (commission_amount / 1.18)`. Invoice shows total, GST breakout, and net service value.                                  |

### High-Value Transaction Commission

|                              |                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Decision**                 | Flat rate — same 1%+1% regardless of deal value                                                            |
| **Details**                  | No cap, no sliding scale, no tiered pricing. A Rs 5Cr property pays the same 1% rate as a Rs 50L property. |
| **Technical implementation** | Simple percentage calculation, no conditional logic needed.                                                |

### Referral Reward Structure

|                              |                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Decision**                 | 5% of total commission earned on the referred transaction (tentative — may revisit)                                       |
| **Details**                  | Applies to buyer/tenant referrals, dealer referrals, and RWA referrals. Tracked via unique referral codes/links.          |
| **Technical implementation** | `REFERRALS` table tracks referrer, referred user, and status. Reward calculated as `transaction_total_commission * 0.05`. |

### Payment Gateway

|              |                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision** | Razorpay                                                                                                                                                  |
| **Details**  | Indian-first. Supports UPI (dominant in India), cards, net banking. GST-compliant invoicing API. See [Integrations](./INTEGRATIONS.md) for setup details. |

### Tech Stack

|              |                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **Decision** | Full TypeScript: Next.js (web) + React Native/Expo (mobile) + NestJS (API) + PostgreSQL + Prisma + Redis |
| **Details**  | See [Tech Stack](./TECH_STACK.md) for complete rationale and alternatives considered.                    |

### Masked Calling Provider

|              |                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision** | Exotel                                                                                                                                              |
| **Details**  | Indian-focused, used by Ola/Swiggy. Provides call masking, recording, and logging via API. See [Integrations](./INTEGRATIONS.md) for setup details. |

---

## Decision Log

| Date       | Item                             | Decision                                                                           | Decided By          |
| ---------- | -------------------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| 2026-07-04 | Production infrastructure target | **All-AWS** — ECS/RDS/ElastiCache/S3+CloudFront, web on Amplify (moved off Vercel) | Product + Tech team |
| 2026-07-14 | Go-live                          | Production launched on AWS ap-south-1; www.rdnetwork.in and api.rdnetwork.in live  | Product team        |
| 2026-02-22 | Renewal commission               | Zero currently, configurable later                                                 | Product team        |
| 2026-02-22 | GST treatment                    | Inclusive (extracted from commission)                                              | Product team        |
| 2026-02-22 | High-value commission            | Flat rate, no cap                                                                  | Product team        |
| 2026-02-22 | Referral reward                  | 5% of commission (tentative)                                                       | Product team        |
| 2026-02-22 | Payment gateway                  | Razorpay                                                                           | Product + Tech team |
| 2026-02-22 | Tech stack                       | TypeScript full-stack (see TECH_STACK.md)                                          | Tech team           |
| 2026-02-22 | Masked calling                   | Exotel                                                                             | Tech team           |
