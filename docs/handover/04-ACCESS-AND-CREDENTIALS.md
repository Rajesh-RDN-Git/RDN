# 04 — Access and Credentials

> **This document deliberately contains no secret values, and it never should.** It is an
> inventory: what exists, what it is for, where the live value lives, and who has to grant
> you access. It is safe to commit and safe to email.
>
> Actual values move one of two ways only: **access granted at the source** (you get your
> own account or your own key), or, where a value genuinely must be handed over, through a
> **shared password-manager vault entry or a one-time-secret link**. Never through a
> document, an email body, a chat message, or a screenshot.
>
> Everything below was verified against live AWS on 2026-07-22. Key _names_ and value
> _lengths_ were read; values were not.

---

## Where secrets actually live

| Environment       | Store                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Production API    | AWS Secrets Manager, injected into the ECS task definition as container secrets           |
| Production web    | AWS Amplify environment variables (app `d28iqbnibvlw12`)                                  |
| UAT API           | Railway environment variables                                                             |
| UAT web           | Vercel environment variables                                                              |
| Terraform         | `infrastructure/terraform/environments/secrets.prod.tfvars` — gitignored, local file only |
| Local development | per-app `.env` files, gitignored, seeded from each `.env.example`                         |

The three production secrets are `rdn/prod/api-keys`, `rdn/prod/db-credentials`, and
`rdn/prod/jwt-secret`.

---

## Credential inventory

Status column reflects what is actually wired into the running production task definition,
not what the code supports.

### Core platform

| Credential           | Purpose                                            | Lives in                                          | Production status                                                                      |
| -------------------- | -------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | RDS Postgres connection                            | Secrets Manager `rdn/prod/db-credentials`         | Live                                                                                   |
| `REDIS_URL`          | ElastiCache                                        | ECS task definition (plain env, internal address) | Live                                                                                   |
| `JWT_SECRET`         | Access-token signing (15 min)                      | Secrets Manager `rdn/prod/jwt-secret`             | Live                                                                                   |
| `JWT_REFRESH_SECRET` | Refresh-token signing (30 days)                    | Secrets Manager `rdn/prod/jwt-secret`             | Live                                                                                   |
| `AES_ENCRYPTION_KEY` | AES-256-GCM field encryption for PII               | Secrets Manager `rdn/prod/jwt-secret`             | Live — **losing this loses the data**                                                  |
| `BLIND_INDEX_KEY`    | HMAC key deriving the phone lookup hash            | Secrets Manager `rdn/prod/jwt-secret`             | Live — losing this breaks login lookups                                                |
| `ALLOWED_ORIGINS`    | CORS allowlist, also used by the WebSocket gateway | ECS task definition                               | Live                                                                                   |
| `OTP_DEV_BYPASS`     | Any-6-digit OTP bypass                             | Not set in production, by design                  | Correctly absent — the API refuses to boot if it is `true` while `NODE_ENV=production` |

### Third-party services

| Credential                                                                                 | Purpose                                | Lives in                             | Production status                                                             |
| ------------------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID`                                   | Phone OTP (login depends on it)        | Secrets Manager `rdn/prod/api-keys`  | **Live and verified** — real handsets receive OTPs                            |
| `EXOTEL_API_KEY`, `EXOTEL_API_TOKEN`, `EXOTEL_SID`, `EXOTEL_CALLER_ID`, `EXOTEL_SUBDOMAIN` | Masked calling                         | Secrets Manager `rdn/prod/api-keys`  | Populated, but calls fail — **Exotel KYC is incomplete**                      |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`                                                   | Payments and commission settlement     | Secrets Manager `rdn/prod/api-keys`  | **Empty** — payments are off                                                  |
| `RAZORPAY_WEBHOOK_SECRET`                                                                  | Payment webhook signature verification | Not present in any production secret | Not configured                                                                |
| `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT`                                          | Push notifications (FCM)               | Not present in the task definition   | **Not configured — push notifications do not work in production**             |
| `SENTRY_DSN`                                                                               | Error tracking                         | Not present in the task definition   | **Not configured — you are running production blind on errors**               |
| `AWS_SES_FROM_EMAIL`                                                                       | Transactional email                    | Not present in the task definition   | Not configured                                                                |
| `AWS_S3_BUCKET`, `AWS_CLOUDFRONT_URL`, `AWS_REGION`                                        | Media storage and CDN                  | ECS task definition                  | Live. Production authenticates through the **ECS task role**, not static keys |

### Platform and infrastructure accounts

| Account                                 | Current holder                                                             | What you need                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| AWS account `574521704385` (ap-south-1) | Root with the business owner; IAM user `rdn-terraform` used for admin work | Your own named IAM user with MFA. Do not inherit `rdn-terraform`.                 |
| GitHub repository                       | Owner `Rajesh-RDN-Git`; pushes were made via a second account, `NikB8`     | Repository transferred to you or to an organisation, plus your own PAT or SSH key |
| Amplify (`rdn-prod-web`)                | Inside the AWS account                                                     | Covered by AWS access                                                             |
| Railway (UAT)                           | Logged in as `admin@rdnetwork.in`                                          | Team invite                                                                       |
| Vercel (UAT web, project `rdn-web`)     | —                                                                          | Team invite                                                                       |
| Expo / EAS (mobile builds)              | Organisation `rdn8s-team`                                                  | Member invite; then generate your own EAS token                                   |
| MSG91                                   | Business account, DLT-registered                                           | Dashboard login. Note the IP allowlist — see below                                |
| Exotel                                  | Business account, KYC pending                                              | Dashboard login                                                                   |
| Razorpay                                | Not yet configured                                                         | Account creation and KYC                                                          |
| Sentry                                  | —                                                                          | Organisation invite, then create the DSN                                          |
| Domain `rdnetwork.in`                   | Registered at GoDaddy, nameservers delegated to Route53                    | GoDaddy account access for registrar-level changes                                |
| Google Play / Apple App Store           | Not yet submitted                                                          | Developer accounts in the business's name                                         |

> **MSG91 has an IP allowlist tied to the auth key.** The production NAT gateway's elastic
> IP, `13.204.206.193`, is whitelisted. If Terraform ever recreates the NAT gateway, that IP
> changes and OTP sending starts failing with HTTP 418. See
> [07](./07-KNOWN-ISSUES-AND-GOTCHAS.md).

---

## Checklist A — access to grant (outgoing owner does this)

- [ ] AWS: create a named IAM user for the incoming developer, with MFA and appropriate policy
- [ ] AWS: confirm the incoming developer can assume whatever the Terraform work requires
- [ ] GitHub: transfer repository ownership, or add as admin collaborator
- [ ] Railway: team invite
- [ ] Vercel: team invite
- [ ] Expo `rdn8s-team`: member invite
- [ ] MSG91: dashboard access
- [ ] Exotel: dashboard access
- [ ] Sentry: organisation invite (create the org if it does not exist)
- [ ] GoDaddy: registrar account access for `rdnetwork.in`
- [ ] AWS SNS: confirm alarm subscriptions still point at rajesh@rdngroups.com and nowhere else
- [ ] Hand over `secrets.prod.tfvars` contents through the password vault — not by file copy
- [ ] Share the password-vault entries for every third-party dashboard login

## Checklist B — rotate at handover (do not skip)

Several credentials were exposed in chat transcripts or log files during development. A
change of ownership is exactly the right moment to clear all of them. Rotate, do not merely
audit.

- [ ] Railway Postgres password (UAT)
- [ ] Expo / EAS token
- [ ] All GitHub personal access tokens issued for this project
- [ ] Cloudflare R2 secret (legacy, from the earlier storage setup)
- [ ] Old JWT secrets from the pre-production era
- [ ] CI IAM access key — **its key ID leaked into `infrastructure/terraform/apply*.log`**
- [ ] Production database password
- [ ] Any UAT credential reused from an earlier environment

**Also shred these local files**, which contain secrets and the leaked key ID and were never
meant to persist:

```
infrastructure/terraform/apply.log
infrastructure/terraform/apply2.log
infrastructure/terraform/apply3.log
infrastructure/terraform/prod.tfplan
infrastructure/terraform/healthcheck.tfplan
```

They are gitignored, so they were never committed — but they are on disk on the outgoing
developer's machine and must not travel with a machine handover or a backup.

> **Do not rotate `AES_ENCRYPTION_KEY` or `BLIND_INDEX_KEY` casually.** Unlike the others,
> these are not merely credentials — they decrypt live data. Rotating them requires a
> re-encryption migration (the ciphertext `v1:` prefix exists precisely to support versioned
> keys). Plan it as a project, not a checklist tick.

## Checklist C — verify you actually have access

You do not have the handover until each of these returns successfully **from your own
machine, with your own credentials**:

- [ ] `aws sts get-caller-identity` shows _your_ IAM user
- [ ] `aws ecs describe-services --cluster rdn-prod --services rdn-prod-api` returns ACTIVE
- [ ] `aws secretsmanager list-secrets` lists the three `rdn/prod/*` secrets
- [ ] `git push` to `develop` succeeds under your own GitHub identity
- [ ] You can open the MSG91, Exotel, Railway, Vercel, and Expo dashboards
- [ ] `terraform plan` runs clean with both tfvars files present
