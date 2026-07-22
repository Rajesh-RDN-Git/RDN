# RDN — Developer Handover: Start Here

> **Handover date:** 2026-07-22
> **Status:** Production is live and serving real traffic.
> **This folder is the source of truth.** Where any other document in `docs/` disagrees
> with this folder, this folder wins.

---

## What RDN is, in five lines

RDN (Residential Dealer Network) is a real-estate transaction platform for residential
societies in India. It replaces external brokers with a community-controlled network:
the RWA (Resident Welfare Association) approves who operates inside its society, residents
become licensed "resident dealers", owners list their flats, and buyers or tenants search
and enquire. RDN earns commission on completed transactions. Phone numbers are never
exposed between parties — all calls are masked through Exotel.

## What is live right now

| Surface        | URL / location                                  | State                                                   |
| -------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Web            | https://www.rdnetwork.in                        | Live (HTTP 200, verified 2026-07-22)                    |
| API            | https://api.rdnetwork.in/v1/health              | Live (HTTP 200, verified 2026-07-22)                    |
| Infrastructure | AWS ap-south-1 (Mumbai), account `574521704385` | Live since 2026-07-14                                   |
| Mobile app     | Expo / React Native                             | Built, **not yet submitted** to Play Store or App Store |
| UAT            | Railway API + Vercel web                        | Live, auto-deploys from `develop`                       |

Running cost is roughly USD 120–200/month for AWS plus USD 5–20/month for the Railway UAT
stack.

## Read these in order

| #   | Document                                                          | Read it for                                                                      |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 01  | [Product](./01-PRODUCT.md)                                        | What the platform does, the five roles, how RDN makes money                      |
| 02  | [Code map](./02-CODE-MAP.md)                                      | Tech stack with pinned versions, repo layout, the patterns that will trip you up |
| 03  | [Environments and deploy](./03-ENVIRONMENTS-AND-DEPLOY.md)        | Local setup, UAT, and the exact production deploy and rollback runbooks          |
| 04  | [Access and credentials](./04-ACCESS-AND-CREDENTIALS.md)          | Every credential that exists, where it lives, who grants it. No secret values.   |
| 05  | [What is done](./05-STATUS-WHAT-IS-DONE.md)                       | Feature-by-feature state: live, built-but-unconfigured, or partial               |
| 06  | [Backlog by priority and impact](./06-BACKLOG-PRIORITY-IMPACT.md) | What to work on, in order, and why                                               |
| 07  | [Known issues and gotchas](./07-KNOWN-ISSUES-AND-GOTCHAS.md)      | The traps that have each already cost a day. Read before your first deploy.      |
| 08  | [Operations runbook](./08-OPERATIONS-RUNBOOK.md)                  | Monitoring, backups, incidents, and legal obligations you now carry              |
| 09  | [Handover checklist](./09-HANDOVER-CHECKLIST.md)                  | The tickable transfer record — access, rotation, and your independence test      |

## Suggested first month

**Day 1 — get oriented, change nothing.**
Read 01, 02, and 07. Get the stack running locally following 03. Log in with the
development OTP bypass. Do not deploy anything.

**Week 1 — earn deploy confidence.**
Confirm your access against the checklist in 04. Ship one trivial, reversible change
through the full path — `develop`, verify on UAT, merge to `main`, deploy to production,
then practise a rollback. Doing this once while nothing is on fire is the single most
valuable thing you can do in week one.

**Weeks 2–4 — clear the P0 band in [06](./06-BACKLOG-PRIORITY-IMPACT.md).**
Credential rotation, the silent OTP-failure bug, RDS deletion protection, and the UAT edge
gate. These are small in effort and large in risk reduction.

## Who to contact

| Who                               | Role                               | Reach for                                                                                     |
| --------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| **Rajesh** — rajesh@rdngroups.com | Business owner                     | Product decisions, commission split, pricing, anything with money or legal exposure           |
| **Nikhil**                        | Outgoing product/engineering owner | Ad-hoc questions about history and intent. Not on-call. Not an escalation path for incidents. |

## One hard rule, non-negotiable

**Never send email — and never configure anything that sends email — to any address at
`workctrl.tech` or `sworks.co.in` regarding RDN.** That includes SNS subscriptions,
CloudWatch alarm targets, SES senders and recipients, and application notifications. All
alerts and notifications go to **rajesh@rdngroups.com**. This rule is also recorded in the
repository root `CLAUDE.md`.
