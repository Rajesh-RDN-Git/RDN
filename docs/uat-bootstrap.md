# RDN UAT Bootstrap — Day 1 Setup

Run this end-to-end the first time UAT infrastructure is provisioned. Idempotent except where noted.

Estimated time: 90 min. Costs: ~$150–300/month for UAT (mostly RDS + ECS + ALB + NAT). Tear down with `terraform destroy` when not in use.

---

## Prerequisites (you do these once)

- [ ] AWS account credentials with admin or scoped IAM in `ap-south-1`
- [ ] `aws sts get-caller-identity` returns the UAT account
- [ ] `terraform` CLI ≥ 1.6
- [ ] `gh` CLI authenticated to `NikB8/RDN` (`gh auth status`)
- [ ] MSG91 UAT sender ID + auth key + template ID
- [ ] Exotel UAT virtual number + API key/token + SID + subdomain
- [ ] AWS SES sender identity verified for `noreply@uat.rdn.com` (or chosen domain)
- [ ] (Optional) Vercel UAT project created — capture `VERCEL_PROJECT_ID_WEB_UAT`

---

## Step 1 — Bootstrap terraform state backend (one-time, manual)

The state backend (`rdn-terraform-state` S3 + `rdn-terraform-locks` DynamoDB) must exist before `terraform init`. If already created for dev/prod, skip.

```bash
aws s3 mb s3://rdn-terraform-state --region ap-south-1
aws s3api put-bucket-versioning --bucket rdn-terraform-state --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket rdn-terraform-state --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws dynamodb create-table --table-name rdn-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region ap-south-1
```

---

## Step 2 — Generate UAT DB password and tfvars

```bash
cd infrastructure/terraform

# Strong password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
echo "Save this DB password securely (you'll also store it in Secrets Manager): $DB_PASSWORD"

# Copy example to real tfvars (gitignored)
cp environments/uat.tfvars.example environments/uat.tfvars
```

---

## Step 3 — Provision UAT infrastructure

```bash
terraform init
terraform workspace new uat || terraform workspace select uat

terraform plan -var-file=environments/uat.tfvars -var "db_password=$DB_PASSWORD" -out=uat.tfplan
# REVIEW the plan. Expected: ~30 resources to add, 0 destroyed.

terraform apply uat.tfplan
```

Capture outputs:

```bash
terraform output -json > /tmp/uat-tf-outputs.json
ALB_DNS=$(terraform output -raw alb_dns_name)
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
S3_BUCKET=$(terraform output -raw s3_bucket)
ECR_URL=$(terraform output -raw ecr_repository_url)
echo "ALB:   $ALB_DNS"
echo "RDS:   $RDS_ENDPOINT"
echo "Redis: $REDIS_ENDPOINT"
echo "S3:    $S3_BUCKET"
echo "ECR:   $ECR_URL"
```

---

## Step 4 — Push secrets to AWS Secrets Manager

```bash
# DB credentials
aws secretsmanager put-secret-value --secret-id rdn/uat/db-credentials \
  --secret-string "{\"username\":\"rdn_admin\",\"password\":\"$DB_PASSWORD\"}"

# JWT secrets
JWT_ACCESS=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH=$(openssl rand -base64 64 | tr -d '\n')
aws secretsmanager put-secret-value --secret-id rdn/uat/jwt-secret \
  --secret-string "$(jq -n --arg a "$JWT_ACCESS" --arg r "$JWT_REFRESH" '{access:$a, refresh:$r}')"

# Third-party API keys (substitute your real values)
aws secretsmanager put-secret-value --secret-id rdn/uat/api-keys \
  --secret-string "$(jq -n \
    --arg m1 'YOUR_MSG91_AUTH_KEY' \
    --arg m2 'YOUR_MSG91_SENDER_ID' \
    --arg m3 'YOUR_MSG91_TEMPLATE_ID' \
    --arg e1 'YOUR_EXOTEL_API_KEY' \
    --arg e2 'YOUR_EXOTEL_API_TOKEN' \
    --arg e3 'YOUR_EXOTEL_SID' \
    --arg e4 'YOUR_EXOTEL_CALLER_ID' \
    --arg e5 'YOUR_EXOTEL_SUBDOMAIN' \
    '{msg91_auth_key:$m1, msg91_sender_id:$m2, msg91_template_id:$m3, exotel_api_key:$e1, exotel_api_token:$e2, exotel_sid:$e3, exotel_caller_id:$e4, exotel_subdomain:$e5}')"
```

Verify ECS task definition references these secrets via the JSON-key syntax (`<arn>:<key>::`). Inspect with:

```bash
aws ecs describe-task-definition --task-definition rdn-uat-api --query 'taskDefinition.containerDefinitions[0].secrets'
```

---

## Step 5 — Create GitHub `uat` environment + secrets

```bash
REPO=NikB8/RDN

# Create environment
gh api -X PUT /repos/$REPO/environments/uat -f wait_timer=0

# Secrets
gh secret set DATABASE_URL_UAT --env uat \
  --body "postgresql://rdn_admin:$DB_PASSWORD@$RDS_ENDPOINT/rdn?schema=public&sslmode=require"
gh secret set AWS_ACCESS_KEY_ID --env uat --body "<your-aws-access-key-id>"
gh secret set AWS_SECRET_ACCESS_KEY --env uat --body "<your-aws-secret-access-key>"
gh secret set VERCEL_PROJECT_ID_WEB_UAT --env uat --body "<your-vercel-project-id>"

# Variables
gh variable set ECS_CLUSTER_UAT --env uat --body "rdn-uat"
gh variable set ECS_SERVICE_API_UAT --env uat --body "rdn-uat-api"
gh variable set AWS_REGION --env uat --body "ap-south-1"
gh variable set ECR_REPOSITORY_API --env uat --body "rdn-api"

# Verify
gh secret list --env uat
gh variable list --env uat
```

---

## Step 6 — Run Prisma migrations against UAT RDS

UAT RDS lives in a private subnet. Two options:

**Option A — One-off ECS task (recommended):**

```bash
aws ecs run-task --cluster rdn-uat \
  --task-definition rdn-uat-api \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-id>],securityGroups=[<ecs-sg-id>],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"api","command":["pnpm","--filter","@rdn/db","db:migrate:deploy"]}]}'
```

**Option B — SSM tunnel (if a bastion exists):**

```bash
aws ssm start-session --target <bastion-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"$RDS_ENDPOINT\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"5433\"]}"
# In another terminal:
DATABASE_URL="postgresql://rdn_admin:$DB_PASSWORD@localhost:5433/rdn?sslmode=require" \
  pnpm --filter @rdn/db db:migrate:deploy
```

Verify schema:

```bash
DATABASE_URL=... psql -c "\dt public.*"
# Expect ~20 tables including users, societies, properties, leads, etc.
```

---

## Step 7 — Seed UAT data

```bash
DATABASE_URL=... pnpm --filter @rdn/db db:seed:uat
```

Verify (against UAT DB):

```bash
DATABASE_URL=... psql -c "SELECT name, slug FROM societies WHERE slug LIKE '%-uat';"
DATABASE_URL=... psql -c "SELECT phone, role FROM users WHERE phone LIKE '+91999990%' ORDER BY phone;"
```

---

## Step 8 — Cut release branch + first deploy

```bash
git checkout main && git pull
git checkout -b release/uat-1
git push -u origin release/uat-1
```

Watch the workflow:

```bash
gh run watch $(gh run list --workflow=deploy-uat.yml --limit=1 --json databaseId -q '.[0].databaseId')
```

Workflow stages:

1. CI (lint + typecheck + tests + build)
2. Deploy API (ECR push + ECS update)
3. Run Prisma migrations
4. Deploy Web (Vercel)

If any stage fails, fix on `release/uat-1`, push, watch again.

---

## Step 9 — Smoke test

Follow `docs/uat-runbook.md` § "Smoke test checklist".

---

## Step 10 — Tag and announce

After smoke test passes:

```bash
# Open PR back to main if release/uat-1 has fixes
gh pr create --base main --head release/uat-1 \
  --title "release: UAT-1 cutover" \
  --body "First UAT promotion. See docs/uat-runbook.md and docs/uat-signoff-2026-05.md."

# After merge:
git checkout main && git pull
git tag -a uat-1.0 -m "UAT 1.0 — first stakeholder validation cut"
git push origin uat-1.0
```

Send the runbook + signoff doc + UAT URLs to stakeholders.

---

## Tear-down (when UAT not in use)

```bash
cd infrastructure/terraform
terraform workspace select uat
terraform destroy -var-file=environments/uat.tfvars -var "db_password=$DB_PASSWORD"
```

Stops all costs except a final RDS snapshot (kept by default if `skip_final_snapshot = false` in rds.tf for non-prod; verify before destroy).

---

## Cost controls

- `ecs_desired_count` in `uat.tfvars` is `2`; reduce to `1` to halve ECS cost
- RDS Multi-AZ disabled for UAT (saves ~$50/mo)
- NAT Gateway is the highest fixed cost (~$35/mo); cannot remove if private subnets need outbound
- Set up AWS Budgets alert at $200/mo for the UAT account

---

## Troubleshooting

**ECS task won't start:** check CloudWatch `/ecs/rdn-uat` log group. Common causes: missing secret in Secrets Manager, IAM role lacks `secretsmanager:GetSecretValue`, image pull failure.

**Migration fails:** Prisma needs `DATABASE_URL` with `sslmode=require` for RDS. Verify with `psql` first before invoking Prisma.

**Vercel deploy fails:** confirm `VERCEL_PROJECT_ID_WEB_UAT` matches the UAT project, not dev/prod.

**Health check 502:** ECS task is up but `/v1/health` not responding. Check ALB target group health threshold settings vs container boot time.
