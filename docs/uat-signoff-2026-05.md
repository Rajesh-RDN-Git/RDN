# RDN UAT Sign-off — 2026-05

## Scope of UAT

- Path B property listing flow (6-step wizard, S3 photo upload, draft autosave)
- Buyer search, enquiry, OTP signup
- Owner listing creation
- RWA admin verification queue (approve / reject)
- Dealer lead receipt
- Masked calling via Exotel
- Role-scoped data visibility (search, dealers, leads, societies)

## Environment

| Field     | Value                                               |
| --------- | --------------------------------------------------- |
| Web URL   | _Vercel UAT URL — fill in after Task 25 deploy_     |
| API URL   | _ALB DNS — fill in after Task 8 terraform apply_    |
| Build tag | uat-1.0                                             |
| Branch    | main (post-merge of `chore/uat-prep-stabilization`) |
| Region    | ap-south-1                                          |

## Test accounts

See [`docs/uat-runbook.md`](./uat-runbook.md) for the full account matrix.

## Sign-off matrix

| Stakeholder | Role             | Sign-off date | Notes |
| ----------- | ---------------- | ------------- | ----- |
|             | Product owner    |               |       |
|             | Engineering lead |               |       |
|             | RWA pilot lead   |               |       |
|             | Operations lead  |               |       |

## Smoke test results

Reference: `docs/uat-smoke-test-results-YYYY-MM-DD.md` (created during Task 27 execution).

## Open items pre-prod

- [ ] **Commission split decision** (RDN / Dealer / RWA percentages) — blocks settlement module. See `docs/OPEN_ITEMS.md`.
- [ ] **Verification service pricing** decision — blocks verification billing.
- [ ] **Image moderation strategy** — automated NSFW vs manual RWA review.
- [ ] **Bulk CSV import** for SUPER_ADMIN onboarding — open question in `docs/prd/property-listing-flow.md`.
- [ ] **Domain + SSL cert** for production (UAT currently uses raw ALB DNS).
- [ ] **Production secrets rotation** — generate fresh JWT/MSG91/Exotel/SES creds; do not reuse UAT values.
- [ ] **Verification rejection reason UX** — Reject button currently sends no reason; backend supports it.

## Known gaps in UAT scope (deferred, not blocking)

- Old `CreatePropertyModal` retained as deprecated reference — remove after sign-off
- API has `Body() body` for verification PATCH unvalidated by Zod — works but lacks defensive parsing
- Verification queue page has no client-side role guard (relies on API 403)
- Pre-existing lint warnings (no-explicit-any, next/image preference) not addressed in this cycle

## Production cutover prerequisites

Before promoting any UAT-validated build to production:

- [ ] All sign-offs collected
- [ ] All open items resolved or explicitly deferred with documented risk acceptance
- [ ] Production tfvars updated with prod sizing + Multi-AZ (already in place — verify)
- [ ] Production secrets rotated (no shared values with UAT)
- [ ] Production DNS + ACM cert provisioned
- [ ] Production CloudWatch alarms verified firing into the on-call channel
- [ ] Database backup & restore tested end-to-end against a UAT snapshot
- [ ] Run `prisma migrate deploy` against production with a backup taken first
- [ ] First production deploy uses `gh workflow run deploy-prod.yml` with approval gate

## Rollback plan if UAT exposes blocking defects

1. Identify the offending change via `git log uat-1.0..HEAD` on the relevant branch
2. Revert the bad commit on `main` and tag `uat-1.0.1`
3. Re-deploy via `release/uat-N+1` branch
4. Communicate ETA in `#rdn-uat` Slack channel

## Sign-off statement

By signing below, the stakeholder confirms that the UAT build at the named tag meets the acceptance criteria for the in-scope flows, and that any deferred items above are acceptable for the production cutover gate.
