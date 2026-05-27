# DPB Breach Filing Template

To be submitted within **72 hours** of awareness of a personal data breach, per DPDP Act 2023 Section 8(6) and Rules.

Channel: https://dpb.gov.in (or prescribed portal/email once published).

---

## 1. Reporter

- **Data Fiduciary:** RDN [legal entity name]
- **PAN/CIN:** [fill]
- **Registered address:** [fill]
- **Reporter name + designation:** [Grievance Officer / DPO]
- **Contact email + phone:** [fill]

## 2. Incident summary

- **Date/time breach started (UTC):** YYYY-MM-DDTHH:MM:SSZ
- **Date/time RDN became aware (UTC):** YYYY-MM-DDTHH:MM:SSZ
- **Date/time breach contained (UTC):** YYYY-MM-DDTHH:MM:SSZ (or "ongoing")
- **Nature of breach** (tick all):
  - [ ] Unauthorised access
  - [ ] Unauthorised disclosure
  - [ ] Loss / accidental destruction
  - [ ] Alteration / corruption
  - [ ] Loss of access (ransomware, DoS)
- **Was breach intentional/malicious?** [Yes / No / Under investigation]
- **Vector** (one-line): [e.g., compromised AWS access key, SQL injection in /v1/properties endpoint, misconfigured S3 bucket]

## 3. Scope

- **Number of Data Principals affected:** [exact or estimate]
- **Categories of personal data affected** (tick):
  - [ ] Phone number
  - [ ] Name
  - [ ] Email
  - [ ] Address (society, flat)
  - [ ] Photos / property media
  - [ ] KYC documents (ID proof, address proof)
  - [ ] Bank account details
  - [ ] Payment / transaction records
  - [ ] Chat messages
  - [ ] Device IDs / push tokens
  - [ ] Other: \_\_\_
- **Special categories (sensitive)** involved? [Yes / No — list]
- **Children's data** involved (under 18)? [Yes / No]
- **Records count (exact / estimate):** [number]
- **Cross-border:** any data hosted outside India affected? [Yes / No — list jurisdictions]

## 4. Likely consequences

- **Financial harm:** [low / med / high — explain]
- **Reputational harm:** [low / med / high]
- **Discrimination, identity theft, fraud:** [yes/no with reasoning]
- **Other harm:** [physical safety, e.g., address disclosure of women residents]

## 5. Actions taken

### Containment

- [list with timestamps]

### Mitigation

- [list with timestamps]

### Notification to Data Principals

- **Method(s):** in-app / email / SMS / WhatsApp / phone call
- **Date initiated:** YYYY-MM-DDTHH:MM:SSZ
- **Reach (% of affected notified):** [%]
- **Content of notification:** [attach]

## 6. Root cause (interim — update after full RCA)

[Brief technical RCA. Update within 30 days.]

## 7. Remediation roadmap

| Action | Owner | ETA        |
| ------ | ----- | ---------- |
| ...    | ...   | YYYY-MM-DD |

## 8. Supporting evidence

- Incident timeline doc: [link]
- Sentry / log snapshots: [link]
- DB snapshots: [link]
- Communication archive: [link]

## 9. Declaration

I certify that the information above is true to the best of my knowledge as of the time of filing. Updates will be submitted as the investigation proceeds.

**Signature:** ********\_\_\_\_********
**Name:** ********\_\_\_\_********
**Date:** YYYY-MM-DD

---

**Internal-only fields (do not submit to DPB):**

- Incident commander: [name]
- Slack incident channel: [#inc-YYYY-MM-DD-X]
- Cost of remediation (est. INR): [number]
- Insurance claim filed? [Y/N]
