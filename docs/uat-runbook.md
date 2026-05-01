# RDN UAT Runbook

## Environment

| Component  | Endpoint                                                 |
| ---------- | -------------------------------------------------------- |
| Web        | _Vercel UAT URL — fill in once `deploy-uat.yml` runs_    |
| API        | _ALB DNS — `terraform output alb_dns_name` after Task 8_ |
| Database   | _RDS endpoint — `terraform output rds_endpoint`_         |
| Cache      | _ElastiCache Redis — `terraform output redis_endpoint`_  |
| File store | S3 bucket `rdn-uat-media` + CloudFront                   |
| Region     | ap-south-1                                               |

## Test accounts

All UAT users are created by `pnpm --filter @rdn/db db:seed:uat`. Phone numbers are reserved test numbers — OTP is sent via MSG91 UAT sender.

| Role         | Phone         | Notes                           |
| ------------ | ------------- | ------------------------------- |
| SUPER_ADMIN  | +919999900001 | Full platform access            |
| RWA_ADMIN GV | +919999900002 | Society: Green Valley UAT       |
| RWA_ADMIN SH | +919999900003 | Society: Sunrise Heights UAT    |
| OWNER 1      | +919999900010 | 2 properties in Green Valley    |
| OWNER 2      | +919999900011 | 1 property in Green Valley      |
| OWNER 3      | +919999900012 | 2 properties in Sunrise Heights |
| DEALER GV    | +919999900020 | Society: Green Valley           |
| DEALER SH    | +919999900021 | Society: Sunrise Heights        |

## Common operations

### Reseed UAT data

```bash
DATABASE_URL=$DATABASE_URL_UAT pnpm --filter @rdn/db db:seed:uat
```

Idempotent — safe to re-run. Restores users, societies, and 5 verified properties to known state.

### Tail API logs

```bash
aws logs tail /ecs/rdn-uat --follow --since 10m
```

### Force ECS redeploy

```bash
aws ecs update-service --cluster rdn-uat --service rdn-uat-api --force-new-deployment
```

Use after rotating secrets or when verifying a fresh task definition.

### SSM tunnel to RDS (private subnet)

```bash
aws ssm start-session \
  --target <bastion-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds-endpoint>"],"portNumber":["5432"],"localPortNumber":["5433"]}'
```

Then connect with `psql "postgresql://rdn_admin:<password>@localhost:5433/rdn?sslmode=require"`.

### Run Prisma migrations

```bash
DATABASE_URL=$DATABASE_URL_UAT pnpm --filter @rdn/db db:migrate:deploy
```

### Trigger UAT deploy from a release branch

```bash
git checkout -b release/uat-N
git push -u origin release/uat-N
# OR manual dispatch
gh workflow run deploy-uat.yml --ref release/uat-N
```

## Rollback

1. Identify last good Docker image tag in ECR:
   ```bash
   aws ecr describe-images --repository-name rdn-api \
     --query 'sort_by(imageDetails,& imagePushedAt)[-5:].imageTags' \
     --output table
   ```
2. Update ECS service to point at the previous task definition revision:
   ```bash
   aws ecs update-service --cluster rdn-uat --service rdn-uat-api \
     --task-definition rdn-uat-api:<previous-revision>
   ```
3. Database rollbacks: restore from automated snapshot (1-day retention on UAT). For schema-only rollbacks, run `pnpm --filter @rdn/db prisma migrate resolve --rolled-back <migration-name>` then re-deploy a fixed migration.

## Smoke test checklist

Run after every UAT deploy. Expected duration: ~10 min.

- [ ] Anonymous buyer search: `GET /` → property cards render. Click any card → property detail loads.
- [ ] OTP signup: enquire on any property → enter test phone → OTP arrives via MSG91 → registration succeeds.
- [ ] Owner listing: log in as `+919999900010` → `/dashboard/properties/new` → walk all 6 wizard steps → submit. Verify property appears in `/dashboard/properties` with status `PENDING`.
- [ ] RWA approval: log in as `+919999900002` → `/dashboard/verification-queue` → approve the new listing. Verify it appears in public search within 5s.
- [ ] Dealer lead receipt: log in as `+919999900020` → `/dashboard/leads` → enquiry from buyer flow visible.
- [ ] Masked call: from buyer or dealer dashboard → click Call button → phone rings via Exotel UAT virtual number with masked caller IDs.

## Known gaps (deferred from UAT scope)

- **Image moderation** — no automated NSFW check. Manual review by RWA_ADMIN only.
- **Bulk CSV import** — SUPER_ADMIN onboarding of 50-flat societies still single-listing-at-a-time. Open question in `docs/prd/property-listing-flow.md`.
- **Commission settlement** — blocked by pending RDN/Dealer/RWA split decision (see `docs/OPEN_ITEMS.md`).
- **Verification rejection reason UX** — Reject button currently sends no reason. Backend supports `reason` field in PATCH body; UI prompt not yet built.
- **Custom UAT domain + ACM cert** — Currently UAT API uses raw ALB DNS. Production cutover will require domain provisioning.

## Useful environment variables

```bash
# Set once per shell, then reuse with the commands above.
export DATABASE_URL_UAT='postgresql://rdn_admin:<password>@<rds-endpoint>:5432/rdn?sslmode=require'
export AWS_PROFILE=rdn-uat   # if multi-account
export AWS_REGION=ap-south-1
```

## Escalation

Production incidents touching UAT (e.g., shared MSG91 quota): page the on-call engineer. UAT-only issues: file in `#rdn-uat` Slack channel during business hours.
