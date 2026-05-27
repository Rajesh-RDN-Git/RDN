# Incident Response Runbook — Data Breach (DPDP Act 2023)

**Owner:** Grievance Officer + on-call engineer
**SLA:** Notify Data Protection Board (DPB) within **72 hours** of becoming aware. Notify affected Data Principals as soon as reasonably possible.

## Decision tree: is this a reportable breach?

Reportable = unauthorised processing, accidental disclosure, acquisition, sharing, use, alteration, destruction of, or loss of access to personal data, that compromises confidentiality, integrity, or availability.

If unsure, treat as reportable and rescind later — under-reporting is the bigger risk.

## Phase 1 — Detection (0–4 hours)

1. **Trigger sources:**
   - Sentry alert / error spike
   - Pen-test or bug bounty report
   - User report via grievance form
   - GitHub security advisory / dependency CVE
   - Cloud provider alert (AWS GuardDuty, CloudTrail, Vercel firewall)

2. **First responder actions:**
   - Acknowledge in #incidents Slack channel
   - Assign Incident Commander (IC)
   - Open incident timeline doc (Google Doc template)
   - Page on-call engineer + Grievance Officer

3. **Initial scope assessment (T+0 to T+2h):**
   - What data is affected? (table/field/record count)
   - How many users impacted?
   - Is the breach ongoing? If yes, **contain immediately**:
     - Revoke compromised credentials/tokens
     - Block attacker IP at Vercel/Cloudflare
     - Take affected service offline if needed
     - Rotate secrets (JWT secrets, DB password, S3 keys)

## Phase 2 — Containment + investigation (T+4h to T+24h)

1. Preserve evidence — snapshot DB, capture logs, screenshot Sentry events
2. Reproduce the attack vector in a non-prod environment
3. Patch the underlying vulnerability
4. Verify no other vectors exist (security review of related code)
5. Confirm scope of impact — exact record IDs

## Phase 3 — Notification (T+24h to T+72h)

### To Data Protection Board (mandatory within 72h)

Submit at https://dpb.gov.in (or via prescribed form when published). Include:

- Nature of the breach
- Categories and approximate number of Data Principals affected
- Categories and approximate number of personal data records affected
- Likely consequences
- Measures taken or proposed to mitigate harm
- Contact point (Grievance Officer)

### To affected Data Principals

Channels (in order of preference):

1. In-app notification (Notification module — type=SYSTEM, priority=HIGH)
2. Email (AWS SES)
3. SMS (MSG91) if email bounces
4. WhatsApp (Interakt) as fallback

Template (English; translate to Hindi + regional for high-impact breaches):

```
Subject: Important notice about your RDN account

Dear [Name],

On [date], we discovered that [describe nature of breach in plain language]. Your [data categories] may have been [affected].

What we're doing: [containment + remediation actions]
What you should do: [reset password / update phone / monitor for fraud]

For questions, contact our Grievance Officer at grievance@rdn.example.com or +91-XX-XXXX-XXXX.

We sincerely apologise for any inconvenience.

— RDN Team
```

## Phase 4 — Post-incident (T+72h onwards)

1. **Post-mortem within 7 days** — root cause, timeline, what went wrong, what to fix
2. Update DPIA, RETENTION_POLICY if applicable
3. Add monitoring/alerts to detect similar incidents earlier
4. Update this runbook with lessons learned
5. If a vulnerability in a dependency: notify upstream maintainers

## Contacts

| Role               | Name                   | Channel                   |
| ------------------ | ---------------------- | ------------------------- |
| Incident Commander | [On-call rota]         | PagerDuty                 |
| Grievance Officer  | [TBD]                  | grievance@rdn.example.com |
| CTO                | [TBD]                  | Slack DM                  |
| Legal              | [External counsel TBD] | Email                     |
| AWS Support        | Business plan          | AWS console               |
| Vercel Support     | Pro plan               | Vercel dashboard          |

## Templates

- DPB filing template: `docs/compliance/templates/dpb-filing.md` (to be drafted)
- Customer notification email: see Phase 3 above
- Internal post-mortem: `docs/compliance/templates/post-mortem.md` (to be drafted)

## Revision history

| Date       | Version | Author      | Notes           |
| ---------- | ------- | ----------- | --------------- |
| 2026-05-27 | 1.0     | Engineering | Initial runbook |
