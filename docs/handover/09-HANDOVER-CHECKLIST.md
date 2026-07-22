# 09 — Handover Checklist

> The tickable record of the transfer. Handover is complete when every box below is
> ticked — not when the documents are delivered.
>
> **Handover date:** 2026-07-22
> **Outgoing:** Nikhil (available for questions; not on-call, not an escalation path)
> **Incoming:** ************\_************
> **Business owner:** Rajesh — rajesh@rdngroups.com

---

## Stage 1 — Access granted

|      | Item                                                                                                        | Owner    | Done |
| ---- | ----------------------------------------------------------------------------------------------------------- | -------- | ---- |
| 1.1  | AWS: named IAM user created for the incoming developer, MFA enabled                                         | Outgoing | ☐    |
| 1.2  | GitHub: repository transferred, or incoming developer added as admin                                        | Outgoing | ☐    |
| 1.3  | Railway team invite (UAT API and database)                                                                  | Outgoing | ☐    |
| 1.4  | Vercel team invite (UAT web, project `rdn-web`)                                                             | Outgoing | ☐    |
| 1.5  | Expo `rdn8s-team` member invite                                                                             | Outgoing | ☐    |
| 1.6  | MSG91 dashboard access                                                                                      | Business | ☐    |
| 1.7  | Exotel dashboard access                                                                                     | Business | ☐    |
| 1.8  | GoDaddy registrar access for `rdnetwork.in`                                                                 | Business | ☐    |
| 1.9  | Sentry organisation access (create the organisation if none exists)                                         | Outgoing | ☐    |
| 1.10 | `secrets.prod.tfvars` contents delivered via password vault or one-time link — **not** as a file or message | Outgoing | ☐    |
| 1.11 | Password-vault entries shared for every third-party dashboard                                               | Outgoing | ☐    |

## Stage 2 — Access verified by the incoming developer

Each of these must succeed **from the incoming developer's own machine, under their own
identity**. Someone else running them does not count.

|     | Check                                                                                 | Done |
| --- | ------------------------------------------------------------------------------------- | ---- |
| 2.1 | `aws sts get-caller-identity` returns the incoming developer's IAM user               | ☐    |
| 2.2 | `aws ecs describe-services --cluster rdn-prod --services rdn-prod-api` returns ACTIVE | ☐    |
| 2.3 | `aws secretsmanager list-secrets` lists the three `rdn/prod/*` secrets                | ☐    |
| 2.4 | A push to `develop` succeeds under their own GitHub identity                          | ☐    |
| 2.5 | MSG91, Exotel, Railway, Vercel, and Expo dashboards all open                          | ☐    |
| 2.6 | `terraform plan` runs clean with both tfvars files present                            | ☐    |

## Stage 3 — Credentials rotated

Full list and cautions in [04](./04-ACCESS-AND-CREDENTIALS.md).

|     | Credential                                                                                                        | Done |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---- |
| 3.1 | Railway Postgres password (UAT)                                                                                   | ☐    |
| 3.2 | Expo / EAS token                                                                                                  | ☐    |
| 3.3 | All project GitHub personal access tokens                                                                         | ☐    |
| 3.4 | Cloudflare R2 secret (legacy)                                                                                     | ☐    |
| 3.5 | Old pre-production JWT secrets                                                                                    | ☐    |
| 3.6 | CI IAM access key — its ID leaked into `apply*.log`                                                               | ☐    |
| 3.7 | Production database password                                                                                      | ☐    |
| 3.8 | Local secret-bearing files shredded: `apply.log`, `apply2.log`, `apply3.log`, `prod.tfplan`, `healthcheck.tfplan` | ☐    |
| 3.9 | Confirmed **not** rotated without a migration plan: `AES_ENCRYPTION_KEY`, `BLIND_INDEX_KEY`                       | ☐    |

## Stage 4 — Ownership moved off personal accounts

|     | Item                                                                                    | Done |
| --- | --------------------------------------------------------------------------------------- | ---- |
| 4.1 | GitHub repository owned by the business or an organisation, not a personal account      | ☐    |
| 4.2 | AWS root account credentials held by the business, with MFA                             | ☐    |
| 4.3 | Expo, Sentry, Railway, and Vercel accounts registered to business email addresses       | ☐    |
| 4.4 | SNS alarm subscription still points at rajesh@rdngroups.com and nowhere else            | ☐    |
| 4.5 | Outgoing developer's access revoked once the incoming developer is verified independent | ☐    |

## Stage 5 — Walkthrough session

Suggested agenda, roughly two hours, screen-shared, with the incoming developer driving.

|     | Topic                                                                                                                  | Reference                                                                | Done |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---- |
| 5.1 | Product and roles, and why the RWA mandate shapes the model                                                            | [01](./01-PRODUCT.md)                                                    | ☐    |
| 5.2 | Repository tour, and the patterns that bite — encryption, blind index, double-wrapped lists, route-gated auth redirect | [02](./02-CODE-MAP.md)                                                   | ☐    |
| 5.3 | Local setup, live, on the incoming developer's machine                                                                 | [03](./03-ENVIRONMENTS-AND-DEPLOY.md)                                    | ☐    |
| 5.4 | A production deploy performed by the incoming developer with the outgoing one watching                                 | [03](./03-ENVIRONMENTS-AND-DEPLOY.md)                                    | ☐    |
| 5.5 | The gotchas, read together — especially the retag step, curl in the image, and the Amplify build spec                  | [07](./07-KNOWN-ISSUES-AND-GOTCHAS.md)                                   | ☐    |
| 5.6 | Current state and the priority backlog, with the P0 band agreed                                                        | [05](./05-STATUS-WHAT-IS-DONE.md), [06](./06-BACKLOG-PRIORITY-IMPACT.md) | ☐    |
| 5.7 | Operations, alarms, and the DPDP obligations now carried                                                               | [08](./08-OPERATIONS-RUNBOOK.md)                                         | ☐    |

## Stage 6 — The independence test

**This is the real acceptance criterion.** The incoming developer performs each of these
alone, with no help, using only this documentation. Anything that needs a phone call is a
documentation bug — fix the document, then retest.

|     | Task                                                                                           | Done |
| --- | ---------------------------------------------------------------------------------------------- | ---- |
| 6.1 | Run the full stack locally and log in with the development OTP bypass                          | ☐    |
| 6.2 | Make a trivial change, push to `develop`, and confirm it on UAT                                | ☐    |
| 6.3 | Merge to `main` and deploy the API to production — build, retag, roll out — and confirm health | ☐    |
| 6.4 | Deploy a web change to production via Amplify                                                  | ☐    |
| 6.5 | Create and apply a database migration                                                          | ☐    |
| 6.6 | Perform a production rollback and confirm the service converges                                | ☐    |
| 6.7 | Locate the production logs and alarms unaided                                                  | ☐    |

## Stage 7 — Business handoff

|     | Item                                                                                                  | Owner        | Done |
| --- | ----------------------------------------------------------------------------------------------------- | ------------ | ---- |
| 7.1 | Commission split decided (BIZ-1) — unblocks settlement and payout                                     | Rajesh       | ☐    |
| 7.2 | DPO / Grievance Officer designated (BIZ-2) — statutory requirement                                    | Rajesh       | ☐    |
| 7.3 | Exotel KYC completed — masked calling is dead until then                                              | Rajesh       | ☐    |
| 7.4 | Go or no-go on the society seed dataset (BIZ-4)                                                       | Rajesh       | ☐    |
| 7.5 | Property photos re-uploaded for pre-2026-07-21 listings (BIZ-5)                                       | Business ops | ☐    |
| 7.6 | Escalation path agreed: who the incoming developer calls at 2am, and who signs off production changes | Rajesh       | ☐    |

---

## Sign-off

Handover is complete when Stages 1 through 6 are fully ticked. Stage 7 items are business
dependencies that can remain open — but each one has a named owner and a stated
consequence, and none of them should be allowed to drift silently.

|                                         | Name | Date |
| --------------------------------------- | ---- | ---- |
| Incoming developer accepts the handover |      |      |
| Outgoing developer confirms transfer    |      |      |
| Business owner acknowledges             |      |      |
