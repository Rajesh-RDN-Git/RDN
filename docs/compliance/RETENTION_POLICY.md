# Data Retention Policy — v1.0

**Effective:** 2026-05-27 · **Owner:** Grievance Officer

Per-table retention periods for RDN. Aligned to DPDP Act 2023 Section 8(7) (retention only as long as necessary for the purpose), tax law (transactions 6 years minimum), and platform requirements.

## Retention schedule

| Table / data                                 | Period                             | Trigger to purge                    | Method                |
| -------------------------------------------- | ---------------------------------- | ----------------------------------- | --------------------- |
| OTPs (`users.otpHash`, `otpExpiresAt`)       | 5 minutes                          | TTL or successful login             | Auto on verify        |
| Refresh tokens (`users.refreshToken`)        | 30 days                            | TTL                                 | Auto on rotation      |
| Sessions (Redis)                             | 30 days idle                       | TTL                                 | Redis EXPIRE          |
| Notifications                                | 90 days                            | Created date                        | Cron daily            |
| Audit logs                                   | 1 year                             | Created date                        | Cron weekly           |
| Chats (`messages` + `conversations`)         | 2 years after listing closed       | Listing status = CLOSED → +730 days | Cron monthly          |
| Property listings (`properties`)             | 7 years                            | Created date (regardless of status) | Cron quarterly        |
| Leads (`leads`)                              | 7 years                            | Created date                        | Cron quarterly        |
| Transactions (`transactions`, `commissions`) | 7 years                            | Created date                        | **Manual** (tax law)  |
| Dealer KYC                                   | 7 years post-account-deletion      | User soft-delete + 7 yr             | Manual review         |
| Bank account details                         | Until account deletion             | User soft-delete                    | Hard purged on delete |
| Device tokens                                | 90 days inactive OR account delete | `lastSeenAt` < now-90d              | Cron weekly           |
| Consent records                              | Forever (append-only)              | Never                               | —                     |
| DPDP grievances                              | 7 years (legal evidentiary)        | Created date                        | Cron quarterly        |
| Sentry crash reports                         | 90 days (Sentry default)           | Sentry TTL                          | Sentry-managed        |

## Purge mechanism

Cron jobs to be added in `apps/api/src/modules/admin/retention.cron.ts` (NestJS @Cron decorator). Job logs each purge to AuditLog.

For account deletion (DPDP Section 11(d)):

- **Immediate:** name, phone, email, avatar scrubbed; device tokens deleted
- **Retained per Section 8(7) legal exception:** transactions, commissions, leads, KYC for 7 years from creation
- **After retention period:** hard purge via cron

## Encryption at rest

Sensitive fields (phone, KYC, bank details) are encrypted with AES-256-GCM at the application layer before DB storage. Keys via AWS KMS / environment secrets.

## Cross-system retention

- **AWS S3:** lifecycle rule — orphaned media (not referenced in DB) deleted after 30 days. Property photos follow listing retention (7 years).
- **AWS SES:** delivery logs purged after 90 days.
- **Sentry:** 90-day default; events with PII (if any escape scrubbing) reported to officer.
- **FCM:** Google retains token-level data per their privacy policy.

## Revision history

| Date       | Version | Author      | Notes                                                                 |
| ---------- | ------- | ----------- | --------------------------------------------------------------------- |
| 2026-05-27 | 1.0     | Engineering | Initial policy. Cron not yet implemented — tracked in DPIA section 6. |
