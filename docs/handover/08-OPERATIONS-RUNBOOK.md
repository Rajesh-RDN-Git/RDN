# 08 — Operations Runbook

> Infrastructure facts below were read from live AWS on 2026-07-22. Related documents:
> [`docs/INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md),
> [`docs/AWS_BACKUP_RESTORE.md`](../AWS_BACKUP_RESTORE.md),
> [`docs/compliance/RETENTION_POLICY.md`](../compliance/RETENTION_POLICY.md).

---

## Daily health check

```bash
curl -s -o /dev/null -w 'api  %{http_code}\n' https://api.rdnetwork.in/v1/health
curl -s -o /dev/null -w 'web  %{http_code}\n' https://www.rdnetwork.in
curl -s -o /dev/null -w 'docs %{http_code}\n' https://api.rdnetwork.in/api/docs   # must be 404

aws ecs describe-services --cluster rdn-prod --services rdn-prod-api \
  --query 'services[0].{running:runningCount,desired:desiredCount,deployments:length(deployments)}'
```

Healthy is: API 200, web 200, `/api/docs` **404** (Swagger must stay disabled in production),
and `running == desired == 2` with exactly one deployment.

Logs are in CloudWatch Logs for the ECS service; Amplify build logs are in the Amplify
console.

## Monitoring as it actually stands

| Alarm                      | State on 2026-07-22                                                            |
| -------------------------- | ------------------------------------------------------------------------------ |
| `rdn-prod-api-5xx`         | OK                                                                             |
| `rdn-prod-ecs-cpu-high`    | OK                                                                             |
| `rdn-prod-rds-storage-low` | INSUFFICIENT_DATA — worth investigating; an alarm with no data is not an alarm |

All three publish to SNS topic `rdn-prod-alerts`, which has exactly one confirmed
subscription: **rajesh@rdngroups.com**. That is correct and must stay that way.

> **Never add a subscription, SES sender or recipient, or notification target at
> `workctrl.tech` or `sworks.co.in`.** This applies to every alerting and notification
> mechanism in the system.

**Two significant monitoring gaps you are inheriting**, both in
[06](./06-BACKLOG-PRIORITY-IMPACT.md):

- There is **no Sentry DSN** in the production task definition. Application errors are not
  being captured anywhere.
- There is **no alarm on authentication failures or OTP-send failures**. Combined with the
  silent OTP failure described in [07](./07-KNOWN-ISSUES-AND-GOTCHAS.md), a complete login
  outage would produce no alert at all. Until both are fixed, MSG91's failure emails to the
  account owner are effectively your OTP monitoring.

## Backups and recovery

RDS instance `rdn-prod`: PostgreSQL 16.14, multi-AZ, storage encrypted, automated backups
with 7-day retention, and a final snapshot configured on deletion.

**Deletion protection is currently `false`.** Turning it on is P0-3.

**The restore path has never been tested.** Backups exist; the ability to restore from them
is an untested assumption. Rehearsing it (P1-5) means: restore a snapshot to a scratch
instance, point a scratch API at it, confirm the field-encryption keys still decrypt real
rows, write down what you did, then delete the instance.

Note carefully: an application rollback does **not** undo a database migration. Migrations
run on container boot. If a bad migration ships, the restore path is your only route back.

## Incident response

Follow `docs/INCIDENT_RESPONSE.md`. The short version:

1. Confirm scope with the health checks above — is it API, web, or database?
2. If it started with a deploy, roll back first and diagnose afterwards. The rollback
   procedure is in [03](./03-ENVIRONMENTS-AND-DEPLOY.md) and takes about two minutes.
3. If login is broken specifically, suspect MSG91 before suspecting your own code — check
   the account owner's email for MSG91 failure notifications and read the two failure modes
   in [07](./07-KNOWN-ISSUES-AND-GOTCHAS.md).
4. If it is a personal-data breach, the DPDP timeline starts immediately. See below.

## DPDP obligations you now carry

RDN processes phone numbers, KYC documents, and bank details for Indian residents. The
Digital Personal Data Protection Act 2023 applies. These are legal obligations, not
features.

**Implemented and live:**

- Application-level AES-256-GCM encryption of phone, nominee details, dealer bank details,
  lead contact details, and DPDP grievance contacts.
- `DELETE /users/me` — account deletion.
- `GET /users/me/data-export` — data portability.
- `GET`/`POST /users/me/consent` and `/consent/history` — consent with an audit trail.
- `POST /grievance/dpdp` — public grievance channel, plus the web page at `/grievance`.
- `RetentionCron` in `apps/api/src/modules/admin/retention.cron.ts`, enforcing the windows in
  `docs/compliance/RETENTION_POLICY.md`. **This job has never been observed running in
  production** — verify it.
- Rate limits: DPDP grievance 5/hour for the public, data export and account deletion
  3/hour, consent 20/minute.

**Not done, and legally exposed:**

- **No DPO or Grievance Officer has been designated.** `docs/compliance/DPIA-v1.md` carries a
  placeholder. A real name and contact must appear in the DPIA, the incident-response
  document, and the public `/grievance` page. This is BIZ-2 and it is a statutory
  requirement, not a nice-to-have.
- Terms, privacy policy, and the RWA mandate agreement have not been reviewed by counsel.
- Breach-notification templates exist at `docs/compliance/templates/dpb-filing.md` but the
  process has never been exercised.

Supporting documents: `docs/compliance/DPIA-v1.md`, `docs/compliance/RETENTION_POLICY.md`,
`docs/INCIDENT_RESPONSE.md`, and the templates folder.

## Routine maintenance

| Cadence         | Task                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weekly          | Skim CloudWatch alarms and, once configured, Sentry. Check the MSG91 balance — if OTP credit runs out, nobody can log in.                                                                       |
| Monthly         | Review AWS spend against the roughly USD 120–200/month baseline. Check for pending RDS minor-version upgrades (AWS retired 16.4 once already and forced a move to 16.14).                       |
| Quarterly       | Rehearse the restore. Rotate the credentials that are safe to rotate — everything except the encryption keys, which need a re-encryption plan. Review IAM users and remove anyone who has left. |
| On every deploy | Watch the rollout converge before starting another. Confirm health returns 200 and `/api/docs` returns 404.                                                                                     |

## Cost

Roughly USD 120–200/month for AWS (ECS Fargate, RDS multi-AZ, ElastiCache, ALB, S3,
CloudFront, Route53, Amplify), plus USD 5–20/month for the Railway UAT stack, plus usage
charges for MSG91 SMS and Exotel calls.

RDS multi-AZ is the largest single line. It is the right call for a production database
holding regulated personal data — do not downgrade it to save money without a deliberate
conversation about the trade-off.
