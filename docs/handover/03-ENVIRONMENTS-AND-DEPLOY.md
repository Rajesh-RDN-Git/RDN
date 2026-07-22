# 03 — Environments and Deployment

> Every identifier below was read from live AWS on 2026-07-22, not from memory.
> Read [07 — Known issues](./07-KNOWN-ISSUES-AND-GOTCHAS.md) **before** your first
> production deploy. The traps there are not theoretical; each one has already cost a day.

---

## Branch flow

```
local  →  develop  →  UAT (auto)  →  main  →  production (manual)
```

Work on `develop`. Pushing to `develop` auto-deploys UAT. When UAT looks right, merge
`develop` into `main`. Pushing `main` auto-deploys the **web** app; the **API** needs a
manual three-step deploy (below). At handover, `develop` and `main` are in sync.

Existing branches: `main`, `develop`, plus two stale ones (`chore/uat-prep-stabilization`,
`feat/monorepo-scaffold`) that can be deleted once you are comfortable.

---

## Local development

Prerequisites: Node 20 (see `.nvmrc`), pnpm 9.15.4, Docker.

```bash
pnpm install
docker compose -f infrastructure/docker/docker-compose.yml up -d   # Postgres + Redis
pnpm --filter db prisma migrate dev
pnpm --filter db prisma db seed
pnpm dev                    # everything, or filter to one app:
pnpm --filter api dev       # API on :4000
pnpm --filter web dev       # web on :3100 (see note)
pnpm --filter mobile dev    # Expo
```

Local specifics that are easy to get wrong:

- Postgres 16 on 5432, database `rdn_dev`, user `rdn`. Redis 7 on 6379. API on 4000.
- **Web runs on port 3100, not 3000.** Port 3000 is occupied by another project on the
  outgoing developer's machine, and the convention stuck. `apps/web/package.json` still says
  `next dev -p 3000`, so pass the port explicitly or change it — and whichever you use,
  `ALLOWED_ORIGINS` in `apps/api/.env` must list it.
- **Development OTP bypass:** any phone number with the code `123456`. There is a helper at
  `docs/test-data/login.sh`.
- Photo upload fails locally — there is no local S3 bucket. It works on UAT and production.
- Each app has a `.env.example`. Copy to `.env` and fill from
  [04 — Access and credentials](./04-ACCESS-AND-CREDENTIALS.md).

A workflow note from the outgoing developer: for browser QA, prefer a production build
(`pnpm --filter web build && pnpm --filter web start`) over the dev server. Next 14.2 has a
dev-mode CSS chunking bug that produces misleading visual results.

---

## UAT

| Piece        | Where                                                   |
| ------------ | ------------------------------------------------------- |
| API          | Railway — `api-uat-10d1.up.railway.app`                 |
| Web          | Vercel — project `rdn-web`, at `rdn-web-one.vercel.app` |
| Database     | Railway Postgres                                        |
| Deploys from | `develop`, automatically, on every push                 |
| Cost         | roughly USD 5–20/month                                  |

Vercel's `NEXT_PUBLIC_API_URL` must be `https://api-uat-10d1.up.railway.app/v1` — **the
`/v1` suffix is required** and omitting it breaks every call.

UAT catches application and migration bugs. It does **not** catch infrastructure-class bugs,
because Vercel is not Amplify and Railway is not ECS/RDS. A migration that works on Railway
can still fail on RDS.

> **Security flag.** UAT accepts _any_ six-digit OTP and is publicly reachable on the open
> internet. That is finding C-3 from the security audit and it is still unfixed. Anyone who
> finds the URL can log in as anyone. Putting basic auth or an IP allowlist in front of UAT
> is a P0 item in [06](./06-BACKLOG-PRIORITY-IMPACT.md).

---

## Production

AWS account **574521704385**, region **ap-south-1** (Mumbai).

| Component             | Identifier                                                                             |
| --------------------- | -------------------------------------------------------------------------------------- |
| ECS cluster / service | `rdn-prod` / `rdn-prod-api` (2 tasks, task definition `rdn-prod-api:3`)                |
| Container registry    | ECR repository `rdn-api`                                                               |
| Build project         | CodeBuild `rdn-prod-api-build`                                                         |
| Database              | RDS `rdn-prod`, PostgreSQL 16.14, multi-AZ, encrypted, 7-day backups                   |
| Cache                 | ElastiCache Redis                                                                      |
| Media                 | S3 + CloudFront                                                                        |
| Web hosting           | Amplify app `d28iqbnibvlw12` (`rdn-prod-web`), branch `main`                           |
| DNS                   | Route53 (nameservers delegated from GoDaddy; GoDaddy MX and SPF records preserved)     |
| Secrets               | Secrets Manager: `rdn/prod/api-keys`, `rdn/prod/db-credentials`, `rdn/prod/jwt-secret` |

### Deploying the API — three steps, all manual

GitHub Actions has never run on this repository (see below), so this is the real pipeline.

```bash
# 1. Build. Push to main first; CodeBuild builds that commit.
aws codebuild start-build --project-name rdn-prod-api-build

# 2. Wait for SUCCEEDED, then retag. The task definition pulls the tag `latest`,
#    but CodeBuild pushes `prod-latest` and `prod-<sha>` — so `latest` must be moved.
MANIFEST=$(aws ecr batch-get-image --repository-name rdn-api \
  --image-ids imageTag=prod-latest --query 'images[0].imageManifest' --output text)
aws ecr put-image --repository-name rdn-api --image-tag latest --image-manifest "$MANIFEST"

# 3. Roll it out.
aws ecs update-service --cluster rdn-prod --service rdn-prod-api --force-new-deployment
```

**Forgetting step 2 is the single most common mistake** — the deploy appears to succeed and
silently redeploys the previous image.

Database migrations need no separate step: `Dockerfile.api`'s CMD runs
`prisma migrate deploy` before starting the server, and it is idempotent.

Watch the rollout, and do not start another one while it is in progress:

```bash
aws ecs describe-services --cluster rdn-prod --services rdn-prod-api \
  --query 'services[0].{running:runningCount,desired:desiredCount,deployments:length(deployments)}'
curl -s -o /dev/null -w '%{http_code}\n' https://api.rdnetwork.in/v1/health
```

Converged looks like `running == desired == 2` with exactly one deployment, and health 200.

### Deploying the web app

Push to `main`. Amplify builds and deploys to www.rdnetwork.in automatically. The build
spec lives in `infrastructure/terraform/amplify.tf` and is deliberately, precariously
hand-tuned — read [07](./07-KNOWN-ISSUES-AND-GOTCHAS.md) before editing it. Note that a
web push to `main` can trigger an Amplify build that races a build-spec update.

### Rolling back

Point the service at the previous image and force a new deployment. Roughly two minutes.

```bash
aws ecr describe-images --repository-name rdn-api \
  --query 'sort_by(imageDetails,&imagePushedAt)[-5:].{tags:imageTags,pushed:imagePushedAt}'
# retag `latest` to the previous prod-<sha> manifest, then:
aws ecs update-service --cluster rdn-prod --service rdn-prod-api --force-new-deployment
```

A rollback does **not** undo a database migration. If the bad deploy shipped a destructive
migration, you need the RDS snapshot path in [08](./08-OPERATIONS-RUNBOOK.md) — a restore
procedure that has never been rehearsed. Rehearsing it is a P1 item.

---

## Terraform

State is remote and correct: S3 bucket `rdn-terraform-state`, locking via DynamoDB table
`rdn-terraform-locks`, region ap-south-1, encrypted. Configuration is in
`infrastructure/terraform/` (`vpc.tf`, `rds.tf`, `ecs.tf`, `alb.tf`, `s3.tf`,
`cloudfront.tf`, `elasticache.tf`, `route53.tf`, `amplify.tf`, `codebuild.tf`, `ecr.tf`,
`secrets.tf`, `iam-ci.tf`, `cloudwatch-alarms.tf`, `monitoring-sns.tf`).

Variable files live in `infrastructure/terraform/environments/`. `prod.tfvars` holds
non-secret configuration (domain, sizes, CORS origins) and **is now committed** as part of
this handover. `secrets.prod.tfvars` holds the database password and GitHub token, is
gitignored, and must reach you through the password vault — see
[04](./04-ACCESS-AND-CREDENTIALS.md).

```bash
cd infrastructure/terraform
terraform init
terraform plan -var-file=environments/prod.tfvars -var-file=environments/secrets.prod.tfvars
```

One known drift point at handover: **`deletion_protection` on RDS is `false`** in live AWS
(verified 2026-07-22), which is P0-3 in [06](./06-BACKLOG-PRIORITY-IMPACT.md). The working
tree itself is clean — the container health check's `startPeriod = 180` is committed
(`e52b7de`) and matches the deployed task definition `:3`. Always read what `plan` says
before you `apply` anything.

---

## Continuous integration — currently dead

GitHub Actions has **zero runs, ever**, despite workflows being registered and active with
correct triggers. The diagnosis on file is that the repository owner account
`Rajesh-RDN-Git` has an unverified primary email, which silently blocks Actions on
user-owned repositories — the workflows appear active and simply never fire.

Preparation is already done: `ci.yml` now triggers on pushes to `develop` and `main` (it was
pull-request-only, which alone would have explained zero runs), and `deploy-dev.yml` and
`deploy-prod.yml` were set to `workflow_dispatch` so that reviving Actions cannot suddenly
fire deploys that collide with the manual CodeBuild path.

`.github/workflows/deploy-prod.yml` is a **complete, working AWS deploy** (ECR build, ECS
update, migration job). If you want Actions to own production deploys instead of the manual
CodeBuild sequence, flip its trigger back to `push: [main]` — but only after you have
verified the manual path works in your hands first.

To revive Actions, the owner must verify their GitHub email, confirm repository Settings →
Actions → General allows all actions, then push to `develop` and check the Actions tab.
