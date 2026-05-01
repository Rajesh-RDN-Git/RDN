# RDN UAT Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the RDN platform to a production-grade UAT environment on AWS — complete with isolated infrastructure, full Path B property listing flow, working third-party integrations, and seeded test data ready for stakeholder validation.

**Architecture:** Five-phase rollout. Phase 0 stabilizes the current 77-file uncommitted diff (commit, fix bugs, green build). Phase 1 provisions UAT AWS infrastructure via Terraform (separate VPC, RDS, Redis, ECS, S3, secrets) and adds a CI/CD deploy workflow. Phase 2 builds the full multi-step Path B property listing flow (replaces minimal Path A modal). Phase 3 wires UAT-specific third-party credentials (MSG91, Exotel, S3, SES). Phase 4 seeds UAT test data and runs end-to-end smoke tests. Phase 5 is the cutover — promote a green tag to UAT, validate, sign-off.

**Tech Stack:** Terraform (AWS provisioning), GitHub Actions (CI/CD), NestJS (API), Next.js 14 App Router (web), React Native + Expo (mobile), PostgreSQL + Prisma, Redis, AWS ECS Fargate, S3 + CloudFront, MSG91, Exotel, Vercel.

**Phases:**

- **Phase 0** — Stabilize current code (Tasks 1–5)
- **Phase 1** — Provision UAT infrastructure (Tasks 6–11)
- **Phase 2** — Build Path B listing flow (Tasks 12–22)
- **Phase 3** — Wire UAT third-party credentials (Tasks 23–25)
- **Phase 4** — Seed UAT data + smoke test (Tasks 26–29)
- **Phase 5** — UAT cutover + sign-off (Tasks 30–32)

---

## Phase 0 — Stabilize Current Code

77 files are uncommitted. Build status unknown. Known issues from research:

- `dealers.controller.ts` may have a `kycStatus` vs `status` field mismatch with `updateDealerKycSchema`
- `societies.service.ts:106` does dynamic `import('@nestjs/common')` for `ForbiddenException` — needs hoisting
- Modified service signatures (search, leads, dealers, societies) but no test updates in diff — tests likely stale
- Tailwind config rewrite references CSS custom properties — verify `globals.css` defines them all

### Task 1: Inventory and triage uncommitted diff

**Files:** No file changes. Investigation only.

- [ ] **Step 1: Capture current diff scope**

Run: `cd /Users/nikhilbhardwaj/Documents/RDN && git diff --stat HEAD > /tmp/rdn-diff-stat.txt && wc -l /tmp/rdn-diff-stat.txt`
Expected: ~77 file entries

- [ ] **Step 2: Group changes by domain**

Run: `git diff --stat HEAD | awk '{print $1}' | grep -E '^(apps|packages)/' | cut -d/ -f1-3 | sort -u`
Expected: list like `apps/api/src/modules`, `apps/web/src/app`, etc.

- [ ] **Step 3: Identify untracked files**

Run: `git status --short | grep '^??'`
Expected: list of new files (icons, design tokens, etc.) that need to be added

- [ ] **Step 4: Note results in plan execution log**

Write a one-paragraph summary noting: number of API service modifications, number of UI component modifications, number of new files. Save to `/tmp/rdn-phase0-inventory.txt`. No commit.

### Task 2: Verify globals.css defines all design-system CSS variables

**Files:**

- Read: `apps/web/src/app/globals.css`
- Read: `apps/web/tailwind.config.ts`

- [ ] **Step 1: Extract all CSS custom property names referenced in tailwind.config.ts**

Run: `grep -oE 'var\(--[a-z0-9-]+\)' apps/web/tailwind.config.ts | sort -u`
Expected: list of `var(--color-...)` and similar references

- [ ] **Step 2: Extract all CSS custom property definitions in globals.css**

Run: `grep -oE '\-\-[a-z0-9-]+:' apps/web/src/app/globals.css | sort -u`
Expected: list of defined `--*:` variables

- [ ] **Step 3: Diff the two lists**

Run: `diff <(grep -oE 'var\(--[a-z0-9-]+\)' apps/web/tailwind.config.ts | sed 's/var(\(.*\))/\1/' | sort -u) <(grep -oE '\-\-[a-z0-9-]+' apps/web/src/app/globals.css | sort -u)`
Expected: empty diff (all referenced vars are defined). If any are missing, **add them to globals.css** under the `:root` and `.dark` selectors using values from `packages/shared/src/design-tokens/colors.ts`.

- [ ] **Step 4: If changes made, run web build to verify**

Run: `pnpm --filter web build 2>&1 | tail -30`
Expected: build succeeds (no Tailwind unknown class errors)

- [ ] **Step 5: Commit if any vars were added**

```bash
git add apps/web/src/app/globals.css
git commit -m "fix(web): add missing design-system CSS variables to globals.css

Tailwind config referenced CSS custom properties that were not defined
in globals.css. Without these, components silently render with
undefined colors."
```

### Task 3: Fix societies.service.ts ForbiddenException dynamic import

**Files:**

- Modify: `apps/api/src/modules/societies/societies.service.ts`

- [ ] **Step 1: Locate the dynamic import**

Run: `grep -n "await import.*@nestjs/common" apps/api/src/modules/societies/societies.service.ts`
Expected: one match around line 106

- [ ] **Step 2: Read existing top-level imports**

Read: `apps/api/src/modules/societies/societies.service.ts:1-30`

- [ ] **Step 3: Add `ForbiddenException` to the top-level `@nestjs/common` import**

Edit the existing `import { ... } from '@nestjs/common';` line at the top of the file. Add `ForbiddenException` to the import list (alphabetical order if the file follows that convention).

- [ ] **Step 4: Replace the dynamic import with direct usage**

Find the line `const { ForbiddenException } = await import('@nestjs/common');` and delete it. The next line that uses `ForbiddenException` will now use the top-level import directly.

- [ ] **Step 5: Run typecheck**

Run: `pnpm --filter api typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/societies/societies.service.ts
git commit -m "refactor(api): hoist ForbiddenException import in societies service

Dynamic import inside conditional was a workaround. Move to
top-level import for clarity and to avoid runtime import overhead."
```

### Task 4: Verify dealers.controller field naming matches schema

**Files:**

- Read: `apps/api/src/modules/dealers/dealers.controller.ts`
- Read: `packages/shared/src/validation/dealer.schema.ts` (or wherever `updateDealerKycSchema` lives)

- [ ] **Step 1: Find the schema definition**

Run: `grep -rn "updateDealerKycSchema" packages/shared/src/`
Expected: one definition file path

- [ ] **Step 2: Read the schema fields**

Read the file from Step 1. Note the exact field name in the Zod schema — is it `status` or `kycStatus`?

- [ ] **Step 3: Read the controller body type and service call**

Read: `apps/api/src/modules/dealers/dealers.controller.ts` (focus on the updateKyc handler around line 75)

- [ ] **Step 4: Reconcile**

If the schema uses `status` but the controller body type / service call uses `kycStatus` (or vice versa), pick the field name that semantically makes sense (`kycStatus` is clearer) and update the OTHER side to match.

If the schema needs updating: edit the Zod schema in `packages/shared/src/validation/dealer.schema.ts` to use `kycStatus`.
If the controller needs updating: edit the controller body type and the service argument to use the schema's actual field name.

- [ ] **Step 5: Verify no other consumers broken**

Run: `grep -rn "kycStatus\|\.status.*REJECTED\|\.status.*APPROVED" apps/api/src/modules/dealers/ packages/shared/src/validation/dealer*`
Expected: all usages consistent on the chosen name

- [ ] **Step 6: Run typecheck across all workspaces**

Run: `pnpm typecheck 2>&1 | tail -40`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(api): align dealer KYC field name between schema and controller

Schema and controller used inconsistent field names (status vs
kycStatus). Standardize on kycStatus for clarity."
```

### Task 5: Commit remaining design-system + auth-scoping changes; verify green build

**Files:**

- Stage: all remaining modified and untracked files in `apps/api/src/modules/`, `apps/web/src/`, `packages/shared/src/`

- [ ] **Step 1: Re-run typecheck across the whole repo**

Run: `pnpm typecheck 2>&1 | tee /tmp/rdn-typecheck.log | tail -30`
Expected: no errors across api, web, mobile, shared, db

- [ ] **Step 2: Run lint**

Run: `pnpm lint 2>&1 | tail -30`
Expected: no errors. Fix any reported issues before proceeding.

- [ ] **Step 3: Run unit tests for modified API services**

Run: `pnpm --filter api test 2>&1 | tail -50`
Expected: green. If specs fail because of the new method signatures (search, leads, dealers, societies all changed signatures per Phase 0 research), update the specs to pass the new arguments. Commit those updates as part of this task.

- [ ] **Step 4: Run web build**

Run: `pnpm --filter web build 2>&1 | tail -30`
Expected: build succeeds

- [ ] **Step 5: Stage all backend service/controller changes and commit**

```bash
git add apps/api/src/modules/dealers apps/api/src/modules/leads apps/api/src/modules/search apps/api/src/modules/societies apps/api/src/modules/communication apps/api/src/modules/grievance packages/shared/src/validation
git commit -m "feat(api): add role-scoped data visibility and admin overrides

- search: filter to RWA_APPROVED/VERIFIED listings only
- dealers: scope findAll by caller role (SUPER_ADMIN sees all,
  RWA_ADMIN sees own societies, DEALER sees self)
- leads: SUPER_ADMIN can approveVisit on behalf of owner
- societies: SUPER_ADMIN can assign RWA_ADMIN with auto-promotion
- controllers: hoist ZodValidationPipe to @Body decorator level"
```

- [ ] **Step 6: Stage all web design-system changes and commit**

```bash
git add apps/web/src apps/web/tailwind.config.ts packages/shared/src/design-tokens
git commit -m "feat(web): migrate to semantic design tokens via CSS variables

Replace hardcoded Tailwind colors with semantic aliases mapped to
CSS custom properties. Adds dark mode foundation and white-label
support without component changes. Includes 8 new icon components
for expanded dashboard navigation."
```

- [ ] **Step 7: Verify clean working tree**

Run: `git status --short`
Expected: empty output (or only files explicitly intended to remain uncommitted)

- [ ] **Step 8: Push to a feature branch and open PR for review**

```bash
git checkout -b chore/uat-prep-stabilization
git push -u origin chore/uat-prep-stabilization
gh pr create --title "chore: stabilize codebase for UAT promotion" --body "$(cat <<'EOF'
## Summary
- Hoist ForbiddenException import in societies service
- Align dealer KYC field naming between schema and controller
- Add missing design-system CSS variables in globals.css
- Commit role-scoped authorization changes (search/dealers/leads/societies)
- Commit design-system migration to semantic tokens

## Test plan
- [ ] pnpm typecheck passes
- [ ] pnpm lint passes
- [ ] pnpm --filter api test passes
- [ ] pnpm --filter web build succeeds
- [ ] Manual smoke test: dashboard loads, search returns results, dealer list scoped correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Phase 1 — Provision UAT Infrastructure

Current Terraform supports `dev` and `prod` only via `environment` variable interpolation. Resource names are derived from `${var.environment}` so adding a third env is straightforward. CI deploys on push to `develop` (→ dev) and `main` (→ prod). Need to add a third deploy track for UAT.

### Task 6: Create UAT Terraform tfvars file

**Files:**

- Create: `infrastructure/terraform/environments/uat.tfvars`

- [ ] **Step 1: Create uat.tfvars**

Write to `infrastructure/terraform/environments/uat.tfvars`:

```hcl
environment       = "uat"
db_instance_class = "db.t3.small"
redis_node_type   = "cache.t3.small"
ecs_cpu           = 512
ecs_memory        = 1024
ecs_desired_count = 2
domain_name       = "uat.rdn.com"
```

UAT sized between dev and prod: prod-shaped enough to catch perf issues, but not Multi-AZ to keep cost down.

- [ ] **Step 2: Verify variables.tf supports all UAT vars**

Run: `grep -E "^variable" infrastructure/terraform/variables.tf`
Expected: all six variables in uat.tfvars are declared. If `domain_name` is not declared, this is fine — it has a default of "".

- [ ] **Step 3: Commit**

```bash
git add infrastructure/terraform/environments/uat.tfvars
git commit -m "infra: add UAT terraform tfvars

UAT sized between dev and prod — large enough to catch perf
regressions, no Multi-AZ to keep cost down. Mirrors prod ECS
sizing for realistic load testing."
```

### Task 7: Verify Terraform resource naming uses environment variable

**Files:**

- Read (no edit unless needed): `infrastructure/terraform/main.tf`, `vpc.tf`, `rds.tf`, `elasticache.tf`, `ecs.tf`, `s3.tf`, `cloudfront.tf`, `secrets.tf`, `alb.tf`

- [ ] **Step 1: Audit resource naming**

Run: `grep -rn 'name.*=.*"' infrastructure/terraform/*.tf | grep -v 'environments/' | grep -E 'rdn|app_name'`
Expected: all resource names should interpolate `${var.environment}` (e.g., `"${var.app_name}-${var.environment}"`)

- [ ] **Step 2: Check for hardcoded "dev" or "prod" strings**

Run: `grep -rn '"dev"\|"prod"' infrastructure/terraform/*.tf`
Expected: no matches outside of comments. If any are found, replace with `var.environment`.

- [ ] **Step 3: Run terraform validate (no apply)**

Run: `cd infrastructure/terraform && terraform init -backend=false && terraform validate`
Expected: "Success! The configuration is valid."

- [ ] **Step 4: Commit any naming fixes**

If changes were made:

```bash
git add infrastructure/terraform
git commit -m "infra: parameterize hardcoded env strings to support UAT"
```

If no changes were needed, skip the commit.

### Task 8: Provision UAT AWS infrastructure via Terraform

**Files:** None (infra apply only)

⚠️ **This task creates real AWS resources that incur cost.** Confirm with the operator before running `terraform apply`. Use a separate Terraform workspace to keep state isolated.

- [ ] **Step 1: Configure AWS credentials for UAT account**

Confirm `aws sts get-caller-identity` returns the expected account. If multi-account setup, use the correct profile: `export AWS_PROFILE=rdn-uat`.

- [ ] **Step 2: Create UAT Terraform workspace**

Run: `cd infrastructure/terraform && terraform workspace new uat || terraform workspace select uat`
Expected: switched to "uat" workspace

- [ ] **Step 3: Generate a strong UAT DB password**

Run: `openssl rand -base64 32 | tr -d '/+=' | head -c 32`
Expected: 32-char alphanumeric password. Save it temporarily (we will store it in AWS Secrets Manager once RDS is up; do not commit).

- [ ] **Step 4: Plan the apply**

Run: `terraform plan -var-file=environments/uat.tfvars -var "db_password=<paste-from-step-3>" -out=uat.tfplan 2>&1 | tail -50`
Expected: plan output shows ~30+ resources to be created (VPC, subnets, RDS, ElastiCache, ECS cluster, ALB, S3, CloudFront, secrets). No resources destroyed.

- [ ] **Step 5: Review the plan with the operator**

Confirm with operator before applying. Show them the resource counts (created/destroyed/updated). Get explicit approval.

- [ ] **Step 6: Apply**

Run: `terraform apply uat.tfplan 2>&1 | tee /tmp/uat-tf-apply.log | tail -30`
Expected: "Apply complete! Resources: N added, 0 changed, 0 destroyed."

- [ ] **Step 7: Capture outputs**

Run: `terraform output -json > /tmp/uat-tf-outputs.json && cat /tmp/uat-tf-outputs.json | jq 'keys'`
Expected: list of outputs (alb_dns_name, rds_endpoint, redis_endpoint, s3_bucket, cloudfront_url, ecr_repository_url, ecs_cluster_name, ecs_service_name)

- [ ] **Step 8: Store DB password in Secrets Manager**

Run: `aws secretsmanager put-secret-value --secret-id rdn/uat/db-credentials --secret-string '{"username":"rdn_admin","password":"<paste-from-step-3>"}'`
Expected: VersionId returned

- [ ] **Step 9: Verify health endpoints reachable from VPC**

Run: `terraform output alb_dns_name`
Note the ALB DNS. The ECS service won't be healthy yet (no Docker image pushed), but the ALB itself should resolve. Run: `dig +short $(terraform output -raw alb_dns_name)`
Expected: AWS ELB IPs

### Task 9: Add deploy-uat.yml GitHub Actions workflow

**Files:**

- Read: `.github/workflows/deploy-dev.yml`
- Create: `.github/workflows/deploy-uat.yml`

- [ ] **Step 1: Copy deploy-dev.yml as a starting point**

Run: `cp .github/workflows/deploy-dev.yml .github/workflows/deploy-uat.yml`

- [ ] **Step 2: Edit deploy-uat.yml**

Open `.github/workflows/deploy-uat.yml`. Apply the following changes:

- Change the `name:` field to `Deploy to UAT`
- Change the trigger to:
  ```yaml
  on:
    push:
      branches:
        - 'release/**'
    workflow_dispatch:
      inputs:
        ref:
          description: 'Git ref to deploy (defaults to release branch HEAD)'
          required: false
          default: ''
  ```
- Change `environment: dev` (if present in `jobs.*.environment`) to `environment: uat` so GitHub Environment protection rules apply
- Replace all references to `DATABASE_URL_DEV` with `DATABASE_URL_UAT`
- Replace all references to `ECS_CLUSTER_DEV` with `ECS_CLUSTER_UAT`
- Replace all references to `ECS_SERVICE_API_DEV` with `ECS_SERVICE_API_UAT`
- Replace `dev-${{ github.sha }}` and `dev-latest` Docker tags with `uat-${{ github.sha }}` and `uat-latest`
- For the Vercel deploy job, change preview/production target to use a UAT-specific Vercel project (or use Vercel's environment alias `uat`). Replace `VERCEL_PROJECT_ID_WEB` with `VERCEL_PROJECT_ID_WEB_UAT` if a separate Vercel project is used; otherwise pass `--target=preview` and set `vercel alias` to `uat-rdn.vercel.app`.

- [ ] **Step 3: Add a UAT-specific concurrency group**

In `deploy-uat.yml` add at the top level:

```yaml
concurrency:
  group: deploy-uat
  cancel-in-progress: false
```

UAT deploys should not cancel each other — testers may be mid-validation.

- [ ] **Step 4: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-uat.yml'))"`
Expected: no output (success)

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy-uat.yml
git commit -m "ci: add UAT deploy workflow

Triggers on push to release/** branches and via manual dispatch.
Uses GitHub environment 'uat' for protection rules and approvals.
No cancel-in-progress so active testing is not disrupted."
```

### Task 10: Configure GitHub repository secrets and variables for UAT

**Files:** No file changes. GitHub configuration only.

- [ ] **Step 1: Create the UAT GitHub Environment**

Run: `gh api -X PUT /repos/{owner}/{repo}/environments/uat -f wait_timer=0`
Expected: 200/201 response. Replace `{owner}/{repo}` with the actual repo (use `gh repo view --json nameWithOwner -q .nameWithOwner`).

- [ ] **Step 2: Add UAT environment secrets**

Run for each:

```bash
gh secret set DATABASE_URL_UAT --env uat --body "postgresql://rdn_admin:<password>@<rds-endpoint>:5432/rdn?schema=public&sslmode=require"
gh secret set AWS_ACCESS_KEY_ID --env uat --body "<key-id>"
gh secret set AWS_SECRET_ACCESS_KEY --env uat --body "<secret-key>"
```

Expected: each returns confirmation. Pull `<rds-endpoint>` from `terraform output rds_endpoint`.

- [ ] **Step 3: Add UAT environment variables**

```bash
gh variable set ECS_CLUSTER_UAT --env uat --body "rdn-uat"
gh variable set ECS_SERVICE_API_UAT --env uat --body "rdn-uat-api"
gh variable set AWS_REGION --env uat --body "ap-south-1"
gh variable set ECR_REPOSITORY_API --env uat --body "rdn-api"
```

- [ ] **Step 4: Add reviewers to the UAT environment (optional but recommended)**

Run: `gh api -X PUT /repos/{owner}/{repo}/environments/uat -f 'reviewers[][type]=User' -f 'reviewers[][id]=<github-user-id>'`
Expected: 200 response. This forces manual approval before any UAT deploy runs.

- [ ] **Step 5: Verify secrets and variables are set**

Run: `gh secret list --env uat && gh variable list --env uat`
Expected: all four secrets (DATABASE_URL_UAT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, plus VERCEL_TOKEN if separate) and four variables present.

### Task 11: Run database migrations against UAT RDS

**Files:** None (DB operation only)

- [ ] **Step 1: Tunnel to UAT RDS or run from a Bastion**

If RDS is in a private subnet (it is, per Terraform), either:
(a) Run migrations from inside the VPC via an SSM session on a temporary EC2/Fargate task, or
(b) Set up an SSM Session Manager port-forward:

```bash
aws ssm start-session --target <bastion-instance-id> --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["<rds-endpoint>"],"portNumber":["5432"],"localPortNumber":["5433"]}'
```

If no bastion exists, the simplest path is to run migrations as a one-off ECS task using the existing API task definition with command override `pnpm --filter db prisma migrate deploy`. Add this as a step in the deploy workflow if doing it repeatedly.

- [ ] **Step 2: Set DATABASE_URL locally for the migration**

Run: `export DATABASE_URL="postgresql://rdn_admin:<password>@localhost:5433/rdn?schema=public&sslmode=require"`
(Use port 5433 if tunneling, or the direct RDS endpoint if running from inside the VPC.)

- [ ] **Step 3: Run Prisma migrations**

Run: `pnpm --filter db prisma migrate deploy 2>&1 | tail -30`
Expected: "All migrations have been successfully applied."

- [ ] **Step 4: Verify schema**

Run: `pnpm --filter db prisma db execute --stdin <<< "\\dt"` or use psql directly: `psql "$DATABASE_URL" -c "\dt public.*" | head -30`
Expected: list of tables (users, societies, properties, leads, dealers, etc.)

- [ ] **Step 5: Note completion in the PR description**

No commit. Note that UAT DB schema is at the same migration version as the current main branch. Move on.

---

## Phase 2 — Build Path B Property Listing Flow

Spec lives at `docs/prd/property-listing-flow.md`. Six steps: Basics, Specs, Pricing, Photos, Amenities/Restrictions, Review. Backend is ready (POST /properties, /media presigned-url, /media). Need full multi-step frontend, draft autosave, image uploader, RWA verification queue UI.

**Architecture decision:** New page route at `apps/web/src/app/dashboard/properties/new/page.tsx` (NOT a modal). Wizard component lives in `apps/web/src/components/property/wizard/`. State managed via `useReducer` in a top-level `WizardProvider` context. Each step is its own component. Draft autosave via a custom `useDraftAutosave` hook keyed by `userId+societyId+flatNumber` to localStorage every 5s.

### Task 12: Add WizardProvider context and reducer

**Files:**

- Create: `apps/web/src/components/property/wizard/wizard-context.tsx`
- Create: `apps/web/src/components/property/wizard/wizard-types.ts`
- Test: `apps/web/src/components/property/wizard/__tests__/wizard-context.test.tsx`

- [ ] **Step 1: Define wizard types**

Write to `apps/web/src/components/property/wizard/wizard-types.ts`:

```typescript
export type WizardStep = 'basics' | 'specs' | 'pricing' | 'photos' | 'amenities' | 'review';

export const STEP_ORDER: WizardStep[] = [
  'basics',
  'specs',
  'pricing',
  'photos',
  'amenities',
  'review',
];

export type PhotoState = {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
  uploadProgress?: number;
};

export type WizardData = {
  // Basics
  societyId: string;
  flatNumber: string;
  towerBlock: string;
  type: 'APARTMENT' | 'COMMERCIAL' | 'VILLA' | '';
  transactionType: 'RENT' | 'SALE' | 'BOTH' | '';
  // Specs
  bhk?: number;
  carpetArea?: number;
  superArea?: number;
  floor?: number;
  totalFloors?: number;
  facing?: string;
  furnishing?: 'FURNISHED' | 'SEMI' | 'UNFURNISHED';
  // Pricing
  priceRent?: number;
  priceSale?: number;
  securityDeposit?: number;
  maintenance?: number;
  negotiable?: boolean;
  brokerageDisclosed?: boolean;
  // Photos
  photos: PhotoState[];
  // Amenities & Restrictions
  amenities: string[];
  restrictions: Record<string, boolean>;
};

export type WizardState = {
  currentStep: WizardStep;
  data: WizardData;
  errors: Partial<Record<keyof WizardData, string>>;
  isDirty: boolean;
  draftLoadedAt?: number;
};

export type WizardAction =
  | { type: 'SET_FIELD'; field: keyof WizardData; value: WizardData[keyof WizardData] }
  | { type: 'SET_PHOTOS'; photos: PhotoState[] }
  | { type: 'GOTO_STEP'; step: WizardStep }
  | { type: 'SET_ERRORS'; errors: WizardState['errors'] }
  | { type: 'LOAD_DRAFT'; data: WizardData }
  | { type: 'RESET' };

export const INITIAL_DATA: WizardData = {
  societyId: '',
  flatNumber: '',
  towerBlock: '',
  type: '',
  transactionType: '',
  photos: [],
  amenities: [],
  restrictions: {},
};
```

- [ ] **Step 2: Write the failing test**

Write to `apps/web/src/components/property/wizard/__tests__/wizard-context.test.tsx`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { WizardProvider, useWizard } from '../wizard-context';
import { INITIAL_DATA } from '../wizard-types';

describe('WizardProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WizardProvider>{children}</WizardProvider>
  );

  it('initializes at the basics step with empty data', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    expect(result.current.state.currentStep).toBe('basics');
    expect(result.current.state.data).toEqual(INITIAL_DATA);
    expect(result.current.state.isDirty).toBe(false);
  });

  it('updates a field via SET_FIELD and marks dirty', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'SET_FIELD', field: 'flatNumber', value: 'A-101' });
    });
    expect(result.current.state.data.flatNumber).toBe('A-101');
    expect(result.current.state.isDirty).toBe(true);
  });

  it('navigates between steps via GOTO_STEP', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'GOTO_STEP', step: 'specs' });
    });
    expect(result.current.state.currentStep).toBe('specs');
  });

  it('loads a draft and resets isDirty', () => {
    const { result } = renderHook(() => useWizard(), { wrapper });
    const draft = { ...INITIAL_DATA, flatNumber: 'B-202', societyId: 'soc-1' };
    act(() => {
      result.current.dispatch({ type: 'LOAD_DRAFT', data: draft });
    });
    expect(result.current.state.data.flatNumber).toBe('B-202');
    expect(result.current.state.isDirty).toBe(false);
    expect(result.current.state.draftLoadedAt).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter web test wizard-context.test 2>&1 | tail -20`
Expected: FAIL — "Cannot find module '../wizard-context'"

- [ ] **Step 4: Implement WizardProvider and useWizard**

Write to `apps/web/src/components/property/wizard/wizard-context.tsx`:

```typescript
'use client';

import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { INITIAL_DATA, WizardAction, WizardState } from './wizard-types';

const INITIAL_STATE: WizardState = {
  currentStep: 'basics',
  data: INITIAL_DATA,
  errors: {},
  isDirty: false,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        isDirty: true,
      };
    case 'SET_PHOTOS':
      return { ...state, data: { ...state.data, photos: action.photos }, isDirty: true };
    case 'GOTO_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'LOAD_DRAFT':
      return {
        ...state,
        data: action.data,
        isDirty: false,
        draftLoadedAt: Date.now(),
      };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

type WizardContextValue = {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return (
    <WizardContext.Provider value={{ state, dispatch }}>{children}</WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider');
  return ctx;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter web test wizard-context.test 2>&1 | tail -20`
Expected: PASS, 4 tests

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/property/wizard/
git commit -m "feat(web): add property wizard context and reducer

State management for the multi-step Path B listing flow. Pure
reducer + context — no side effects. Draft loading separated
from field updates so isDirty flag tracks user edits only."
```

### Task 13: Add useDraftAutosave hook

**Files:**

- Create: `apps/web/src/components/property/wizard/use-draft-autosave.ts`
- Test: `apps/web/src/components/property/wizard/__tests__/use-draft-autosave.test.ts`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/__tests__/use-draft-autosave.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDraftAutosave, draftKey, loadDraft } from '../use-draft-autosave';
import { INITIAL_DATA } from '../wizard-types';

describe('useDraftAutosave', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('writes the draft to localStorage after the autosave interval', () => {
    const data = { ...INITIAL_DATA, flatNumber: 'A-101', societyId: 'soc-1' };
    renderHook(() => useDraftAutosave({ userId: 'u-1', data, isDirty: true, intervalMs: 5000 }));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    const stored = loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'A-101' });
    expect(stored).toEqual(data);
  });

  it('does not write when isDirty is false', () => {
    const data = { ...INITIAL_DATA, flatNumber: 'A-101', societyId: 'soc-1' };
    renderHook(() => useDraftAutosave({ userId: 'u-1', data, isDirty: false, intervalMs: 5000 }));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    const stored = loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'A-101' });
    expect(stored).toBeNull();
  });

  it('keys drafts so two flats do not collide', () => {
    const data1 = { ...INITIAL_DATA, flatNumber: 'A-101', societyId: 'soc-1', bhk: 2 };
    const data2 = { ...INITIAL_DATA, flatNumber: 'B-202', societyId: 'soc-1', bhk: 3 };
    renderHook(() =>
      useDraftAutosave({ userId: 'u-1', data: data1, isDirty: true, intervalMs: 5000 }),
    );
    renderHook(() =>
      useDraftAutosave({ userId: 'u-1', data: data2, isDirty: true, intervalMs: 5000 }),
    );
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'A-101' })?.bhk).toBe(2);
    expect(loadDraft({ userId: 'u-1', societyId: 'soc-1', flatNumber: 'B-202' })?.bhk).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test use-draft-autosave.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

Write to `apps/web/src/components/property/wizard/use-draft-autosave.ts`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { WizardData } from './wizard-types';

type DraftKeyParts = { userId: string; societyId: string; flatNumber: string };

export function draftKey({ userId, societyId, flatNumber }: DraftKeyParts) {
  return `rdn:property-draft:${userId}:${societyId}:${flatNumber}`;
}

export function loadDraft(parts: DraftKeyParts): WizardData | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(draftKey(parts));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WizardData;
  } catch {
    return null;
  }
}

export function clearDraft(parts: DraftKeyParts) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(draftKey(parts));
}

type Args = {
  userId: string;
  data: WizardData;
  isDirty: boolean;
  intervalMs?: number;
};

export function useDraftAutosave({ userId, data, isDirty, intervalMs = 5000 }: Args) {
  const dataRef = useRef(data);
  const dirtyRef = useRef(isDirty);
  dataRef.current = data;
  dirtyRef.current = isDirty;

  useEffect(() => {
    const id = setInterval(() => {
      if (!dirtyRef.current) return;
      const d = dataRef.current;
      if (!d.societyId || !d.flatNumber) return;
      window.localStorage.setItem(
        draftKey({ userId, societyId: d.societyId, flatNumber: d.flatNumber }),
        JSON.stringify(d),
      );
    }, intervalMs);
    return () => clearInterval(id);
  }, [userId, intervalMs]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test use-draft-autosave.test 2>&1 | tail -20`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/use-draft-autosave.ts apps/web/src/components/property/wizard/__tests__/use-draft-autosave.test.ts
git commit -m "feat(web): add property draft autosave hook

Persists wizard state to localStorage every 5s when dirty. Keyed
by user+society+flat so multiple in-progress drafts don't
collide. Survives tab close, browser restart, 24h inactivity."
```

### Task 14: Build BasicsStep component

**Files:**

- Create: `apps/web/src/components/property/wizard/steps/basics-step.tsx`
- Test: `apps/web/src/components/property/wizard/steps/__tests__/basics-step.test.tsx`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/steps/__tests__/basics-step.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardProvider } from '../../wizard-context';
import { BasicsStep } from '../basics-step';

const mockSocieties = [
  { id: 'soc-1', name: 'Green Valley', city: 'Bengaluru' },
  { id: 'soc-2', name: 'Sunrise Heights', city: 'Bengaluru' },
];

jest.mock('@/lib/api/societies', () => ({
  societiesApi: { list: jest.fn(() => Promise.resolve({ data: mockSocieties })) },
}));

describe('BasicsStep', () => {
  it('renders all required fields', () => {
    render(
      <WizardProvider>
        <BasicsStep userRole="OWNER" primarySocietyId="soc-1" />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/flat number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tower/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/property type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/transaction type/i)).toBeInTheDocument();
  });

  it('locks society field for OWNER role', () => {
    render(
      <WizardProvider>
        <BasicsStep userRole="OWNER" primarySocietyId="soc-1" />
      </WizardProvider>,
    );
    const societyInput = screen.getByLabelText(/society/i) as HTMLInputElement;
    expect(societyInput).toBeDisabled();
  });

  it('allows society selection for SUPER_ADMIN', async () => {
    render(
      <WizardProvider>
        <BasicsStep userRole="SUPER_ADMIN" primarySocietyId={null} />
      </WizardProvider>,
    );
    const societyInput = await screen.findByLabelText(/society/i);
    expect(societyInput).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test basics-step.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement BasicsStep**

Write to `apps/web/src/components/property/wizard/steps/basics-step.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useWizard } from '../wizard-context';
import { societiesApi } from '@/lib/api/societies';

type Society = { id: string; name: string; city: string };

type Props = {
  userRole: 'OWNER' | 'SUPER_ADMIN';
  primarySocietyId: string | null;
};

export function BasicsStep({ userRole, primarySocietyId }: Props) {
  const { state, dispatch } = useWizard();
  const { data, errors } = state;
  const [societies, setSocieties] = useState<Society[]>([]);
  const ownerLocked = userRole === 'OWNER';

  useEffect(() => {
    societiesApi.list().then((r) => setSocieties(r.data));
  }, []);

  useEffect(() => {
    if (ownerLocked && primarySocietyId && !data.societyId) {
      dispatch({ type: 'SET_FIELD', field: 'societyId', value: primarySocietyId });
    }
  }, [ownerLocked, primarySocietyId, data.societyId, dispatch]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="society" className="block text-sm font-medium mb-1">Society</label>
        <Select
          id="society"
          value={data.societyId}
          disabled={ownerLocked}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'societyId', value: e.target.value })}
        >
          <option value="">Select a society</option>
          {societies.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
          ))}
        </Select>
        {errors.societyId && <p className="text-error text-sm mt-1">{errors.societyId}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="flatNumber" className="block text-sm font-medium mb-1">Flat number</label>
          <Input
            id="flatNumber"
            value={data.flatNumber}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'flatNumber', value: e.target.value })}
            placeholder="e.g. A-101"
          />
          {errors.flatNumber && <p className="text-error text-sm mt-1">{errors.flatNumber}</p>}
        </div>
        <div>
          <label htmlFor="towerBlock" className="block text-sm font-medium mb-1">Tower / Block</label>
          <Input
            id="towerBlock"
            value={data.towerBlock}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'towerBlock', value: e.target.value })}
            placeholder="e.g. Tower A"
          />
          {errors.towerBlock && <p className="text-error text-sm mt-1">{errors.towerBlock}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">Property type</label>
        <Select
          id="type"
          value={data.type}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'type', value: e.target.value as never })}
        >
          <option value="">Select type</option>
          <option value="APARTMENT">Apartment</option>
          <option value="VILLA">Villa</option>
          <option value="COMMERCIAL">Commercial</option>
        </Select>
      </div>
      <div>
        <label htmlFor="transactionType" className="block text-sm font-medium mb-1">Transaction type</label>
        <Select
          id="transactionType"
          value={data.transactionType}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'transactionType', value: e.target.value as never })}
        >
          <option value="">Select transaction</option>
          <option value="RENT">Rent</option>
          <option value="SALE">Sale</option>
          <option value="BOTH">Both</option>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test basics-step.test 2>&1 | tail -20`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/steps/
git commit -m "feat(web): add Basics step to property wizard

Society field locked + prefilled for OWNER role; dropdown for
SUPER_ADMIN. Wires flat/tower/type/transactionType into wizard
context."
```

### Task 15: Build SpecsStep component

**Files:**

- Create: `apps/web/src/components/property/wizard/steps/specs-step.tsx`
- Test: `apps/web/src/components/property/wizard/steps/__tests__/specs-step.test.tsx`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/steps/__tests__/specs-step.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { WizardProvider } from '../../wizard-context';
import { SpecsStep } from '../specs-step';
import { useWizard } from '../../wizard-context';

const Setup = ({ propertyType }: { propertyType: 'APARTMENT' | 'COMMERCIAL' | 'VILLA' }) => {
  const { dispatch } = useWizard();
  React.useEffect(() => {
    dispatch({ type: 'SET_FIELD', field: 'type', value: propertyType });
  }, [dispatch, propertyType]);
  return <SpecsStep />;
};

import React from 'react';

describe('SpecsStep', () => {
  it('shows BHK field for APARTMENT', () => {
    render(<WizardProvider><Setup propertyType="APARTMENT" /></WizardProvider>);
    expect(screen.getByLabelText(/bhk/i)).toBeInTheDocument();
  });

  it('hides BHK field for COMMERCIAL', () => {
    render(<WizardProvider><Setup propertyType="COMMERCIAL" /></WizardProvider>);
    expect(screen.queryByLabelText(/bhk/i)).not.toBeInTheDocument();
  });

  it('shows carpet area, super area, floor, facing, furnishing', () => {
    render(<WizardProvider><Setup propertyType="APARTMENT" /></WizardProvider>);
    expect(screen.getByLabelText(/carpet area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/super area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/floor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/facing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/furnishing/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test specs-step.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement SpecsStep**

Write to `apps/web/src/components/property/wizard/steps/specs-step.tsx`:

```typescript
'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useWizard } from '../wizard-context';

export function SpecsStep() {
  const { state, dispatch } = useWizard();
  const { data } = state;
  const showBhk = data.type === 'APARTMENT' || data.type === 'VILLA';

  const setNum = (field: 'bhk' | 'carpetArea' | 'superArea' | 'floor' | 'totalFloors') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({ type: 'SET_FIELD', field, value: e.target.value ? Number(e.target.value) : undefined });

  return (
    <div className="space-y-4">
      {showBhk && (
        <div>
          <label htmlFor="bhk" className="block text-sm font-medium mb-1">BHK</label>
          <Input id="bhk" type="number" min={1} max={10} value={data.bhk ?? ''} onChange={setNum('bhk')} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="carpetArea" className="block text-sm font-medium mb-1">Carpet area (sqft)</label>
          <Input id="carpetArea" type="number" value={data.carpetArea ?? ''} onChange={setNum('carpetArea')} />
        </div>
        <div>
          <label htmlFor="superArea" className="block text-sm font-medium mb-1">Super area (sqft)</label>
          <Input id="superArea" type="number" value={data.superArea ?? ''} onChange={setNum('superArea')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="floor" className="block text-sm font-medium mb-1">Floor</label>
          <Input id="floor" type="number" value={data.floor ?? ''} onChange={setNum('floor')} />
        </div>
        <div>
          <label htmlFor="totalFloors" className="block text-sm font-medium mb-1">Total floors</label>
          <Input id="totalFloors" type="number" value={data.totalFloors ?? ''} onChange={setNum('totalFloors')} />
        </div>
      </div>
      <div>
        <label htmlFor="facing" className="block text-sm font-medium mb-1">Facing</label>
        <Select id="facing" value={data.facing ?? ''} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'facing', value: e.target.value })}>
          <option value="">Select facing</option>
          <option value="N">North</option>
          <option value="S">South</option>
          <option value="E">East</option>
          <option value="W">West</option>
          <option value="NE">North-East</option>
          <option value="NW">North-West</option>
          <option value="SE">South-East</option>
          <option value="SW">South-West</option>
        </Select>
      </div>
      <div>
        <label htmlFor="furnishing" className="block text-sm font-medium mb-1">Furnishing</label>
        <Select id="furnishing" value={data.furnishing ?? ''} onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'furnishing', value: e.target.value as never })}>
          <option value="">Select furnishing</option>
          <option value="FURNISHED">Furnished</option>
          <option value="SEMI">Semi-furnished</option>
          <option value="UNFURNISHED">Unfurnished</option>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test specs-step.test 2>&1 | tail -20`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/steps/specs-step.tsx apps/web/src/components/property/wizard/steps/__tests__/specs-step.test.tsx
git commit -m "feat(web): add Specs step to property wizard

BHK shown for APARTMENT/VILLA only, hidden for COMMERCIAL.
Captures area, floor, facing, furnishing."
```

### Task 16: Build PricingStep component

**Files:**

- Create: `apps/web/src/components/property/wizard/steps/pricing-step.tsx`
- Test: `apps/web/src/components/property/wizard/steps/__tests__/pricing-step.test.tsx`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/steps/__tests__/pricing-step.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WizardProvider, useWizard } from '../../wizard-context';
import { PricingStep } from '../pricing-step';

const Setup = ({ tx }: { tx: 'RENT' | 'SALE' | 'BOTH' }) => {
  const { dispatch } = useWizard();
  React.useEffect(() => {
    dispatch({ type: 'SET_FIELD', field: 'transactionType', value: tx });
  }, [dispatch, tx]);
  return <PricingStep />;
};

describe('PricingStep', () => {
  it('shows rent + deposit + maintenance for RENT', () => {
    render(<WizardProvider><Setup tx="RENT" /></WizardProvider>);
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/security deposit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maintenance/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/sale price/i)).not.toBeInTheDocument();
  });

  it('shows sale price for SALE', () => {
    render(<WizardProvider><Setup tx="SALE" /></WizardProvider>);
    expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/monthly rent/i)).not.toBeInTheDocument();
  });

  it('shows all fields for BOTH', () => {
    render(<WizardProvider><Setup tx="BOTH" /></WizardProvider>);
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test pricing-step.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PricingStep**

Write to `apps/web/src/components/property/wizard/steps/pricing-step.tsx`:

```typescript
'use client';

import { Input } from '@/components/ui/input';
import { useWizard } from '../wizard-context';

export function PricingStep() {
  const { state, dispatch } = useWizard();
  const { data } = state;
  const showRent = data.transactionType === 'RENT' || data.transactionType === 'BOTH';
  const showSale = data.transactionType === 'SALE' || data.transactionType === 'BOTH';

  const setNum = (field: 'priceRent' | 'priceSale' | 'securityDeposit' | 'maintenance') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({ type: 'SET_FIELD', field, value: e.target.value ? Number(e.target.value) : undefined });

  return (
    <div className="space-y-4">
      {showRent && (
        <>
          <div>
            <label htmlFor="priceRent" className="block text-sm font-medium mb-1">Monthly rent (₹)</label>
            <Input id="priceRent" type="number" value={data.priceRent ?? ''} onChange={setNum('priceRent')} />
          </div>
          <div>
            <label htmlFor="securityDeposit" className="block text-sm font-medium mb-1">Security deposit (₹)</label>
            <Input id="securityDeposit" type="number" value={data.securityDeposit ?? ''} onChange={setNum('securityDeposit')} />
          </div>
          <div>
            <label htmlFor="maintenance" className="block text-sm font-medium mb-1">Maintenance (₹/month)</label>
            <Input id="maintenance" type="number" value={data.maintenance ?? ''} onChange={setNum('maintenance')} />
          </div>
        </>
      )}
      {showSale && (
        <div>
          <label htmlFor="priceSale" className="block text-sm font-medium mb-1">Sale price (₹)</label>
          <Input id="priceSale" type="number" value={data.priceSale ?? ''} onChange={setNum('priceSale')} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          id="negotiable"
          type="checkbox"
          checked={!!data.negotiable}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'negotiable', value: e.target.checked })}
        />
        <label htmlFor="negotiable" className="text-sm">Price is negotiable</label>
      </div>
      <div className="flex items-center gap-3">
        <input
          id="brokerageDisclosed"
          type="checkbox"
          checked={!!data.brokerageDisclosed}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'brokerageDisclosed', value: e.target.checked })}
        />
        <label htmlFor="brokerageDisclosed" className="text-sm">Brokerage applies (disclose now)</label>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test pricing-step.test 2>&1 | tail -20`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/steps/pricing-step.tsx apps/web/src/components/property/wizard/steps/__tests__/pricing-step.test.tsx
git commit -m "feat(web): add Pricing step to property wizard

Conditional fields driven by transactionType. Includes
negotiable + brokerage disclosure toggles."
```

### Task 17: Build PhotosStep with S3 presigned upload

**Files:**

- Create: `apps/web/src/components/property/wizard/steps/photos-step.tsx`
- Create: `apps/web/src/lib/api/media.ts` (if not present)
- Test: `apps/web/src/components/property/wizard/steps/__tests__/photos-step.test.tsx`

- [ ] **Step 1: Verify or create the media API client**

Run: `grep -rn "presigned-url" apps/web/src/lib/api/ 2>/dev/null`

If no media client exists, create `apps/web/src/lib/api/media.ts`:

```typescript
import { apiClient } from './client';

export type PresignedResponse = {
  uploadUrl: string;
  key: string;
  cdnUrl: string;
  expiresIn: number;
};

export const mediaApi = {
  getPresignedUrl: (contentType: string, fileName: string) =>
    apiClient
      .post<PresignedResponse>('/media/presigned-url', { contentType, fileName })
      .then((r) => r.data),
  upload: async (uploadUrl: string, file: Blob, onProgress?: (pct: number) => void) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed: ${xhr.status}`));
      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(file);
    });
  },
  attach: (propertyId: string, url: string, type: 'PHOTO' | 'VIDEO', order: number) =>
    apiClient.post('/media', { propertyId, url, type, order }).then((r) => r.data),
};
```

- [ ] **Step 2: Write the failing test for PhotosStep**

Write to `apps/web/src/components/property/wizard/steps/__tests__/photos-step.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardProvider } from '../../wizard-context';
import { PhotosStep } from '../photos-step';

jest.mock('@/lib/api/media', () => ({
  mediaApi: {
    getPresignedUrl: jest.fn(() => Promise.resolve({
      uploadUrl: 'https://s3.example/upload',
      key: 'properties/123.jpg',
      cdnUrl: 'https://cdn.example/properties/123.jpg',
      expiresIn: 300,
    })),
    upload: jest.fn(() => Promise.resolve()),
  },
}));

describe('PhotosStep', () => {
  it('renders the upload dropzone', () => {
    render(<WizardProvider><PhotosStep /></WizardProvider>);
    expect(screen.getByText(/drag photos here|tap to add photos/i)).toBeInTheDocument();
  });

  it('shows minimum-photo warning when fewer than 3 uploaded', () => {
    render(<WizardProvider><PhotosStep /></WizardProvider>);
    expect(screen.getByText(/at least 3 photos required/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter web test photos-step.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 4: Implement PhotosStep**

Write to `apps/web/src/components/property/wizard/steps/photos-step.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';
import { useWizard } from '../wizard-context';
import { mediaApi } from '@/lib/api/media';
import { PhotoState } from '../wizard-types';

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 15;
const MAX_DIM = 1920;

async function downscaleImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
    reader.onerror = reject;
    img.onload = () => {
      const ratio = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Blob conversion failed'))), 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotosStep() {
  const { state, dispatch } = useWizard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photos = state.data.photos;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    setBusy(true);
    setError(null);
    const next = [...photos];
    try {
      for (const file of Array.from(files)) {
        const blob = await downscaleImage(file);
        const presigned = await mediaApi.getPresignedUrl('image/jpeg', file.name);
        await mediaApi.upload(presigned.uploadUrl, blob);
        next.push({
          id: presigned.key,
          url: presigned.cdnUrl,
          isCover: next.length === 0,
          order: next.length,
        });
      }
      dispatch({ type: 'SET_PHOTOS', photos: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const setCover = (id: string) => {
    dispatch({ type: 'SET_PHOTOS', photos: photos.map((p) => ({ ...p, isCover: p.id === id })) });
  };

  const remove = (id: string) => {
    dispatch({ type: 'SET_PHOTOS', photos: photos.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })) });
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-foreground">Drag photos here or tap to add photos</p>
        <p className="text-sm text-muted mt-1">{photos.length}/{MAX_PHOTOS} uploaded</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy}
        />
      </div>
      {photos.length < MIN_PHOTOS && (
        <p className="text-warning text-sm">At least 3 photos required to publish.</p>
      )}
      {error && <p className="text-error text-sm">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative group">
            <img src={p.url} alt="" className={`w-full h-32 object-cover rounded ${p.isCover ? 'ring-2 ring-brand' : ''}`} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/50 rounded flex items-center justify-center gap-2">
              <button type="button" className="text-white text-sm" onClick={() => setCover(p.id)}>Cover</button>
              <button type="button" className="text-white text-sm" onClick={() => remove(p.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter web test photos-step.test 2>&1 | tail -20`
Expected: PASS, 2 tests

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/property/wizard/steps/photos-step.tsx apps/web/src/components/property/wizard/steps/__tests__/photos-step.test.tsx apps/web/src/lib/api/media.ts
git commit -m "feat(web): add Photos step with S3 presigned upload

Client-side downscale to 1920px before upload. Min 3, max 15
photos. Cover image selection. Mobile camera capture via
input[capture]. Progress reported via XHR upload events."
```

### Task 18: Build AmenitiesStep component

**Files:**

- Create: `apps/web/src/components/property/wizard/steps/amenities-step.tsx`
- Test: `apps/web/src/components/property/wizard/steps/__tests__/amenities-step.test.tsx`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/steps/__tests__/amenities-step.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardProvider } from '../../wizard-context';
import { AmenitiesStep } from '../amenities-step';

const societyAmenities = ['Pool', 'Gym', 'Park', 'Clubhouse'];

describe('AmenitiesStep', () => {
  it('renders chips for each society amenity', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    societyAmenities.forEach((a) => expect(screen.getByText(a)).toBeInTheDocument());
  });

  it('toggles amenity selection on click', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    const poolChip = screen.getByText('Pool');
    fireEvent.click(poolChip);
    expect(poolChip.closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders restriction toggles', () => {
    render(
      <WizardProvider>
        <AmenitiesStep societyAmenities={societyAmenities} />
      </WizardProvider>,
    );
    expect(screen.getByLabelText(/vegetarian only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/family only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/no pets/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bachelors allowed/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test amenities-step.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement AmenitiesStep**

Write to `apps/web/src/components/property/wizard/steps/amenities-step.tsx`:

```typescript
'use client';

import { useWizard } from '../wizard-context';

const RESTRICTIONS = [
  { key: 'vegetarianOnly', label: 'Vegetarian only' },
  { key: 'familyOnly', label: 'Family only' },
  { key: 'noPets', label: 'No pets' },
  { key: 'bachelorsAllowed', label: 'Bachelors allowed' },
];

type Props = {
  societyAmenities: string[];
};

export function AmenitiesStep({ societyAmenities }: Props) {
  const { state, dispatch } = useWizard();
  const selected = new Set(state.data.amenities);
  const restrictions = state.data.restrictions ?? {};

  const toggle = (a: string) => {
    const next = new Set(selected);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    dispatch({ type: 'SET_FIELD', field: 'amenities', value: Array.from(next) });
  };

  const setRestriction = (key: string, value: boolean) => {
    dispatch({
      type: 'SET_FIELD',
      field: 'restrictions',
      value: { ...restrictions, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Amenities (society-defined)</h3>
        <div className="flex flex-wrap gap-2">
          {societyAmenities.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => toggle(a)}
              aria-pressed={selected.has(a)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                selected.has(a) ? 'bg-brand text-white border-brand' : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Restrictions</h3>
        <div className="space-y-2">
          {RESTRICTIONS.map((r) => (
            <label key={r.key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                id={r.key}
                checked={!!restrictions[r.key]}
                onChange={(e) => setRestriction(r.key, e.target.checked)}
              />
              {r.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test amenities-step.test 2>&1 | tail -20`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/steps/amenities-step.tsx apps/web/src/components/property/wizard/steps/__tests__/amenities-step.test.tsx
git commit -m "feat(web): add Amenities & Restrictions step

Society amenity universe rendered as toggleable chips. Restrictions
captured as keyed booleans. Owner picks from society's defined
amenities only."
```

### Task 19: Build ReviewStep with submission logic

**Files:**

- Create: `apps/web/src/components/property/wizard/steps/review-step.tsx`
- Test: `apps/web/src/components/property/wizard/steps/__tests__/review-step.test.tsx`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/steps/__tests__/review-step.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardProvider, useWizard } from '../../wizard-context';
import { ReviewStep } from '../review-step';
import React from 'react';

jest.mock('@/lib/api/properties', () => ({
  propertiesApi: { create: jest.fn(() => Promise.resolve({ data: { id: 'prop-new' } })) },
}));

jest.mock('@/lib/api/media', () => ({
  mediaApi: { attach: jest.fn(() => Promise.resolve({})) },
}));

const Setup = () => {
  const { dispatch } = useWizard();
  React.useEffect(() => {
    dispatch({
      type: 'LOAD_DRAFT',
      data: {
        societyId: 'soc-1',
        flatNumber: 'A-101',
        towerBlock: 'Tower A',
        type: 'APARTMENT',
        transactionType: 'RENT',
        bhk: 2,
        priceRent: 25000,
        photos: [
          { id: 'p1', url: 'https://cdn/1.jpg', isCover: true, order: 0 },
          { id: 'p2', url: 'https://cdn/2.jpg', isCover: false, order: 1 },
          { id: 'p3', url: 'https://cdn/3.jpg', isCover: false, order: 2 },
        ],
        amenities: ['Pool', 'Gym'],
        restrictions: {},
      },
    });
  }, [dispatch]);
  return <ReviewStep onPublished={jest.fn()} />;
};

describe('ReviewStep', () => {
  it('renders summary fields from wizard state', () => {
    render(<WizardProvider><Setup /></WizardProvider>);
    expect(screen.getByText(/A-101/)).toBeInTheDocument();
    expect(screen.getByText(/Tower A/)).toBeInTheDocument();
    expect(screen.getByText(/2 BHK/)).toBeInTheDocument();
    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  it('shows Save Draft and Submit for Verification CTAs', () => {
    render(<WizardProvider><Setup /></WizardProvider>);
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit for verification/i })).toBeInTheDocument();
  });

  it('calls propertiesApi.create on submit', async () => {
    const { propertiesApi } = jest.requireMock('@/lib/api/properties');
    render(<WizardProvider><Setup /></WizardProvider>);
    fireEvent.click(screen.getByRole('button', { name: /submit for verification/i }));
    await waitFor(() => expect(propertiesApi.create).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test review-step.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ReviewStep**

Write to `apps/web/src/components/property/wizard/steps/review-step.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useWizard } from '../wizard-context';
import { propertiesApi } from '@/lib/api/properties';
import { mediaApi } from '@/lib/api/media';
import { clearDraft } from '../use-draft-autosave';

type Props = {
  onPublished: (propertyId: string) => void;
  userId: string;
};

const formatCurrency = (n?: number) =>
  typeof n === 'number' ? new Intl.NumberFormat('en-IN').format(n) : '—';

export function ReviewStep({ onPublished, userId }: Props) {
  const { state } = useWizard();
  const { data } = state;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const property = await propertiesApi.create({
        societyId: data.societyId,
        flatNumber: data.flatNumber,
        towerBlock: data.towerBlock,
        type: data.type as 'APARTMENT',
        transactionType: data.transactionType as 'RENT',
        bhk: data.bhk,
        carpetArea: data.carpetArea,
        superArea: data.superArea,
        floor: data.floor,
        totalFloors: data.totalFloors,
        facing: data.facing,
        furnishing: data.furnishing,
        priceRent: data.priceRent,
        priceSale: data.priceSale,
        securityDeposit: data.securityDeposit,
        amenities: Object.fromEntries(data.amenities.map((a) => [a, true])),
        restrictions: data.restrictions,
      });
      const cover = data.photos.find((p) => p.isCover);
      const ordered = [
        ...(cover ? [cover] : []),
        ...data.photos.filter((p) => !p.isCover),
      ];
      for (let i = 0; i < ordered.length; i++) {
        await mediaApi.attach(property.data.id, ordered[i].url, 'PHOTO', i);
      }
      clearDraft({ userId, societyId: data.societyId, flatNumber: data.flatNumber });
      onPublished(property.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Property</h3>
        <p className="text-sm text-foreground">{data.flatNumber}, {data.towerBlock}</p>
        <p className="text-sm text-muted">{data.type} · {data.transactionType}{data.bhk ? ` · ${data.bhk} BHK` : ''}</p>
      </section>
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Pricing</h3>
        {data.priceRent && <p className="text-sm">Rent: ₹{formatCurrency(data.priceRent)}/month</p>}
        {data.priceSale && <p className="text-sm">Sale: ₹{formatCurrency(data.priceSale)}</p>}
        {data.securityDeposit && <p className="text-sm text-muted">Deposit: ₹{formatCurrency(data.securityDeposit)}</p>}
      </section>
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Photos ({data.photos.length})</h3>
        <div className="grid grid-cols-4 gap-2">
          {data.photos.map((p) => (
            <img key={p.id} src={p.url} alt="" className="w-full h-20 object-cover rounded" />
          ))}
        </div>
      </section>
      <section className="border border-border rounded p-4">
        <h3 className="font-semibold mb-2">Amenities</h3>
        <p className="text-sm text-muted">{data.amenities.join(', ') || '—'}</p>
      </section>
      {error && <p className="text-error text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="button" className="px-4 py-2 border border-border rounded">Save draft</button>
        <button type="button" disabled={submitting} onClick={submit} className="px-4 py-2 bg-brand text-white rounded disabled:opacity-50">
          {submitting ? 'Submitting…' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test review-step.test 2>&1 | tail -20`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/steps/review-step.tsx apps/web/src/components/property/wizard/steps/__tests__/review-step.test.tsx
git commit -m "feat(web): add Review & Publish step

Renders summary in buyer-view layout. Submit creates property
via API, then attaches uploaded photos in cover-first order.
Clears localStorage draft on success."
```

### Task 20: Add Zod step-validation logic

**Files:**

- Create: `apps/web/src/components/property/wizard/step-validation.ts`
- Test: `apps/web/src/components/property/wizard/__tests__/step-validation.test.ts`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/__tests__/step-validation.test.ts`:

```typescript
import { validateStep } from '../step-validation';
import { INITIAL_DATA } from '../wizard-types';

describe('validateStep', () => {
  it('basics: requires society, flat, tower, type, transactionType', () => {
    const r = validateStep('basics', INITIAL_DATA);
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors)).toEqual(
      expect.arrayContaining(['societyId', 'flatNumber', 'towerBlock', 'type', 'transactionType']),
    );
  });

  it('basics: passes when all required fields present', () => {
    const r = validateStep('basics', {
      ...INITIAL_DATA,
      societyId: 'soc-1',
      flatNumber: 'A-101',
      towerBlock: 'A',
      type: 'APARTMENT',
      transactionType: 'RENT',
    });
    expect(r.ok).toBe(true);
  });

  it('pricing: RENT requires priceRent', () => {
    const r = validateStep('pricing', { ...INITIAL_DATA, transactionType: 'RENT' });
    expect(r.ok).toBe(false);
    expect(r.errors.priceRent).toBeDefined();
  });

  it('pricing: SALE requires priceSale', () => {
    const r = validateStep('pricing', { ...INITIAL_DATA, transactionType: 'SALE' });
    expect(r.ok).toBe(false);
    expect(r.errors.priceSale).toBeDefined();
  });

  it('photos: requires at least 3 photos', () => {
    const r = validateStep('photos', INITIAL_DATA);
    expect(r.ok).toBe(false);
    expect(r.errors.photos).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test step-validation.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement validation**

Write to `apps/web/src/components/property/wizard/step-validation.ts`:

```typescript
import { WizardData, WizardStep } from './wizard-types';

type ValidationResult =
  | { ok: true; errors: Record<string, never> }
  | { ok: false; errors: Partial<Record<keyof WizardData, string>> };

export function validateStep(step: WizardStep, data: WizardData): ValidationResult {
  const errors: Partial<Record<keyof WizardData, string>> = {};

  if (step === 'basics') {
    if (!data.societyId) errors.societyId = 'Society required';
    if (!data.flatNumber) errors.flatNumber = 'Flat number required';
    if (!data.towerBlock) errors.towerBlock = 'Tower / block required';
    if (!data.type) errors.type = 'Property type required';
    if (!data.transactionType) errors.transactionType = 'Transaction type required';
  }

  if (step === 'specs') {
    if ((data.type === 'APARTMENT' || data.type === 'VILLA') && !data.bhk) {
      errors.bhk = 'BHK required';
    }
    if (!data.carpetArea) errors.carpetArea = 'Carpet area required';
  }

  if (step === 'pricing') {
    if ((data.transactionType === 'RENT' || data.transactionType === 'BOTH') && !data.priceRent) {
      errors.priceRent = 'Monthly rent required';
    }
    if ((data.transactionType === 'SALE' || data.transactionType === 'BOTH') && !data.priceSale) {
      errors.priceSale = 'Sale price required';
    }
  }

  if (step === 'photos') {
    if (data.photos.length < 3) errors.photos = 'At least 3 photos required';
  }

  if (Object.keys(errors).length === 0) return { ok: true, errors: {} };
  return { ok: false, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test step-validation.test 2>&1 | tail -20`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/step-validation.ts apps/web/src/components/property/wizard/__tests__/step-validation.test.ts
git commit -m "feat(web): add per-step validation rules for wizard

Each step validated independently before allowing advance. Pricing
and Specs rules driven by selections from earlier steps."
```

### Task 21: Wire steps into PropertyWizard shell with navigation + autosave

**Files:**

- Create: `apps/web/src/components/property/wizard/property-wizard.tsx`
- Test: `apps/web/src/components/property/wizard/__tests__/property-wizard.test.tsx`

- [ ] **Step 1: Write the failing test**

Write to `apps/web/src/components/property/wizard/__tests__/property-wizard.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyWizard } from '../property-wizard';

jest.mock('@/lib/api/societies', () => ({
  societiesApi: { list: jest.fn(() => Promise.resolve({ data: [{ id: 'soc-1', name: 'Test Society', city: 'BLR', amenities: ['Pool'] }] })) },
}));

jest.mock('@/lib/api/properties', () => ({ propertiesApi: { create: jest.fn() } }));
jest.mock('@/lib/api/media', () => ({ mediaApi: { attach: jest.fn(), getPresignedUrl: jest.fn(), upload: jest.fn() } }));

describe('PropertyWizard', () => {
  it('starts on Basics step with progress indicator', () => {
    render(<PropertyWizard userRole="OWNER" userId="u-1" primarySocietyId="soc-1" onPublished={jest.fn()} />);
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flat number/i)).toBeInTheDocument();
  });

  it('blocks Next when basics step has errors', () => {
    render(<PropertyWizard userRole="OWNER" userId="u-1" primarySocietyId="soc-1" onPublished={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/flat number required/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test property-wizard.test 2>&1 | tail -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PropertyWizard shell**

Write to `apps/web/src/components/property/wizard/property-wizard.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { WizardProvider, useWizard } from './wizard-context';
import { STEP_ORDER, WizardStep } from './wizard-types';
import { useDraftAutosave, loadDraft } from './use-draft-autosave';
import { validateStep } from './step-validation';
import { BasicsStep } from './steps/basics-step';
import { SpecsStep } from './steps/specs-step';
import { PricingStep } from './steps/pricing-step';
import { PhotosStep } from './steps/photos-step';
import { AmenitiesStep } from './steps/amenities-step';
import { ReviewStep } from './steps/review-step';
import { societiesApi } from '@/lib/api/societies';

type Props = {
  userRole: 'OWNER' | 'SUPER_ADMIN';
  userId: string;
  primarySocietyId: string | null;
  onPublished: (propertyId: string) => void;
};

const STEP_LABELS: Record<WizardStep, string> = {
  basics: 'Basics',
  specs: 'Specs',
  pricing: 'Pricing',
  photos: 'Photos',
  amenities: 'Amenities',
  review: 'Review',
};

function WizardInner({ userRole, userId, primarySocietyId, onPublished }: Props) {
  const { state, dispatch } = useWizard();
  const [societyAmenities, setSocietyAmenities] = useState<string[]>([]);
  useDraftAutosave({ userId, data: state.data, isDirty: state.isDirty });

  useEffect(() => {
    if (state.data.societyId) {
      societiesApi.list().then((r) => {
        const s = r.data.find((x: { id: string }) => x.id === state.data.societyId) as { amenities?: string[] } | undefined;
        setSocietyAmenities(Array.isArray(s?.amenities) ? s!.amenities! : []);
      });
    }
  }, [state.data.societyId]);

  useEffect(() => {
    if (primarySocietyId && !state.data.societyId) {
      const draft = loadDraft({ userId, societyId: primarySocietyId, flatNumber: '' });
      if (draft) dispatch({ type: 'LOAD_DRAFT', data: draft });
    }
  }, [primarySocietyId, userId, state.data.societyId, dispatch]);

  const currentIndex = STEP_ORDER.indexOf(state.currentStep);

  const goNext = () => {
    const result = validateStep(state.currentStep, state.data);
    if (!result.ok) {
      dispatch({ type: 'SET_ERRORS', errors: result.errors });
      return;
    }
    dispatch({ type: 'SET_ERRORS', errors: {} });
    if (currentIndex < STEP_ORDER.length - 1) {
      dispatch({ type: 'GOTO_STEP', step: STEP_ORDER[currentIndex + 1] });
    }
  };

  const goBack = () => {
    if (currentIndex > 0) dispatch({ type: 'GOTO_STEP', step: STEP_ORDER[currentIndex - 1] });
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 'basics':    return <BasicsStep userRole={userRole} primarySocietyId={primarySocietyId} />;
      case 'specs':     return <SpecsStep />;
      case 'pricing':   return <PricingStep />;
      case 'photos':    return <PhotosStep />;
      case 'amenities': return <AmenitiesStep societyAmenities={societyAmenities} />;
      case 'review':    return <ReviewStep onPublished={onPublished} userId={userId} />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="mb-6">
        <p className="text-sm text-muted">Step {currentIndex + 1} of {STEP_ORDER.length}: {STEP_LABELS[state.currentStep]}</p>
        <div className="h-2 bg-muted rounded mt-2">
          <div className="h-2 bg-brand rounded transition-all" style={{ width: `${((currentIndex + 1) / STEP_ORDER.length) * 100}%` }} />
        </div>
      </div>
      {renderStep()}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex justify-between max-w-3xl mx-auto">
        <button type="button" onClick={goBack} disabled={currentIndex === 0} className="px-4 py-2 border border-border rounded disabled:opacity-50">Back</button>
        {state.currentStep !== 'review' && (
          <button type="button" onClick={goNext} className="px-4 py-2 bg-brand text-white rounded">Next</button>
        )}
      </div>
    </div>
  );
}

export function PropertyWizard(props: Props) {
  return (
    <WizardProvider>
      <WizardInner {...props} />
    </WizardProvider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test property-wizard.test 2>&1 | tail -20`
Expected: PASS, 2 tests

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/property/wizard/property-wizard.tsx apps/web/src/components/property/wizard/__tests__/property-wizard.test.tsx
git commit -m "feat(web): wire wizard shell with progress + step navigation

Sticky bottom CTA with Back/Next. Progress bar reflects current
step. Next is gated by per-step validation. Draft autosave runs
in background. Society amenities fetched once societyId is set."
```

### Task 22: Add /dashboard/properties/new route and remove old modal trigger

**Files:**

- Create: `apps/web/src/app/dashboard/properties/new/page.tsx`
- Modify: `apps/web/src/app/dashboard/properties/page.tsx` (remove modal trigger; replace with router push)
- Modify: `apps/web/src/components/property/create-property-modal.tsx` (delete or mark deprecated)

- [ ] **Step 1: Create the new route**

Write to `apps/web/src/app/dashboard/properties/new/page.tsx`:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { PropertyWizard } from '@/components/property/wizard/property-wizard';
import { useAuth } from '@/lib/auth/use-auth';

export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
    return <p className="p-6">You don&apos;t have permission to add properties.</p>;
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">Add Property</h1>
      <PropertyWizard
        userRole={user.role}
        userId={user.id}
        primarySocietyId={user.primarySocietyId ?? null}
        onPublished={(id) => router.push(`/dashboard/properties?published=${id}`)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update the dashboard properties page Add Property button**

Read: `apps/web/src/app/dashboard/properties/page.tsx`. Find the "Add Property" button click handler (currently opens the CreatePropertyModal). Replace with:

```typescript
import { useRouter } from 'next/navigation';
// ... inside component:
const router = useRouter();
// ... button handler:
onClick={() => router.push('/dashboard/properties/new')}
```

Remove the `<CreatePropertyModal>` JSX and any `useState` for modal open/close.

- [ ] **Step 3: Mark old modal as deprecated**

At the top of `apps/web/src/components/property/create-property-modal.tsx`, add a single-line comment:

```typescript
// Deprecated: superseded by PropertyWizard at /dashboard/properties/new (Path B). Kept for reference; remove once PR merged.
```

(Will fully delete after Phase 5 sign-off — keeping the file in place for reviewer comparison.)

- [ ] **Step 4: Verify the User type includes role and primarySocietyId**

Run: `grep -rn "primarySocietyId" packages/db/prisma/schema.prisma apps/web/src/lib/auth/`

If `primarySocietyId` is not on the User model in Prisma, add it:

- Edit `packages/db/prisma/schema.prisma` — add `primarySocietyId String? @map("primary_society_id") @db.Uuid` to the User model
- Run: `pnpm --filter db prisma migrate dev --name add_user_primary_society_id`
- Run: `pnpm --filter db prisma generate`
- Update API auth response to include `primarySocietyId`
- Update web `useAuth` types

- [ ] **Step 5: Run web build**

Run: `pnpm --filter web build 2>&1 | tail -30`
Expected: build succeeds

- [ ] **Step 6: Manual smoke test (local)**

Start the API + web locally:

```bash
docker compose up -d
pnpm --filter db prisma migrate deploy
pnpm dev
```

Open `http://localhost:3000/dashboard/properties/new` as a logged-in OWNER. Walk through all 6 steps using a real flow:

1. Society prefilled, fill flat A-101, tower A, type APARTMENT, transaction RENT → Next
2. Fill BHK 2, carpet 950, super 1100, floor 3/10, facing E, semi-furnished → Next
3. Fill rent 25000, deposit 100000 → Next
4. Upload 3 sample images → Next
5. Pick 2 amenities, set "no pets" restriction → Next
6. Review summary, click Submit for Verification

Verify:

- Property appears in `/dashboard/properties` list with `verificationStatus = PENDING`
- localStorage no longer has the draft entry
- All 3 photos attached to the property record (check via property detail page)

If anything fails, fix and re-test before committing.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/dashboard/properties apps/web/src/components/property/create-property-modal.tsx packages/db/prisma/schema.prisma packages/db/prisma/migrations apps/api/src/modules/auth apps/web/src/lib/auth
git commit -m "feat(web): replace CreatePropertyModal with /properties/new wizard

Path B multi-step listing flow now reachable from Add Property
button. Old modal kept as deprecated reference (deleted post-UAT).
Adds User.primarySocietyId for OWNER auto-binding."
```

---

## Phase 3 — Wire UAT Third-Party Credentials

API .env.example shows credentials needed for: MSG91 (OTP), AWS S3 + CloudFront, AWS SES, Exotel (masked calling). Each needs a UAT-specific account or test mode.

### Task 23: Provision UAT MSG91 + Exotel + SES credentials

**Files:** None (external service config only — log everything in a private secrets vault)

- [ ] **Step 1: MSG91 — create or reuse UAT sender ID**

Log into MSG91 dashboard. Either:
(a) Create a separate "UAT" sub-account under the parent org, OR
(b) Use the existing sender ID with a test-mode template (mark messages as `[UAT]` to distinguish from real OTPs).

Capture: `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_TEMPLATE_ID`. Store securely.

- [ ] **Step 2: Exotel — create UAT virtual number**

In Exotel dashboard, provision a separate virtual caller ID for UAT (or reuse with explicit allowlist of test phone numbers).

Capture: `EXOTEL_API_KEY`, `EXOTEL_API_TOKEN`, `EXOTEL_SID`, `EXOTEL_CALLER_ID`, `EXOTEL_SUBDOMAIN`. Store securely.

- [ ] **Step 3: SES — verify UAT sender domain**

In AWS SES (ap-south-1), verify a `noreply@uat.rdn.com` (or similar) sender. If still in sandbox mode, also verify the recipient test addresses.

Capture: `AWS_SES_FROM_EMAIL`. No new keys needed (uses the same IAM role as the ECS task).

- [ ] **Step 4: Generate UAT JWT secrets**

Run: `openssl rand -base64 64 | tr -d '\n'` (twice, one for access and one for refresh)

Capture: `JWT_SECRET`, `JWT_REFRESH_SECRET`.

- [ ] **Step 5: Compile complete UAT env values**

Build a single `.env.uat` (do NOT commit) with all values:

- DATABASE_URL (from terraform output)
- REDIS_URL (from terraform output)
- JWT_SECRET, JWT_REFRESH_SECRET (from step 4)
- MSG91\_\* (from step 1)
- EXOTEL\_\* (from step 2)
- AWS_REGION=ap-south-1
- AWS_S3_BUCKET (from terraform output)
- AWS_CLOUDFRONT_URL (from terraform output)
- AWS_SES_FROM_EMAIL (from step 3)
- ALLOWED_ORIGINS (UAT web + mobile origins)
- NODE_ENV=production
- PORT=4000

### Task 24: Push UAT secrets into AWS Secrets Manager

**Files:** None (AWS only)

- [ ] **Step 1: Update db-credentials secret**

Already done in Task 8 Step 8.

- [ ] **Step 2: Push JWT secrets**

Run:

```bash
aws secretsmanager put-secret-value --secret-id rdn/uat/jwt-secret --secret-string "$(jq -n --arg a "$JWT_SECRET" --arg r "$JWT_REFRESH_SECRET" '{access:$a, refresh:$r}')"
```

Expected: VersionId returned.

- [ ] **Step 3: Push api-keys secret**

Run:

```bash
aws secretsmanager put-secret-value --secret-id rdn/uat/api-keys --secret-string "$(jq -n \
  --arg msg91_key "$MSG91_AUTH_KEY" \
  --arg msg91_sender "$MSG91_SENDER_ID" \
  --arg msg91_template "$MSG91_TEMPLATE_ID" \
  --arg exotel_key "$EXOTEL_API_KEY" \
  --arg exotel_token "$EXOTEL_API_TOKEN" \
  --arg exotel_sid "$EXOTEL_SID" \
  --arg exotel_caller "$EXOTEL_CALLER_ID" \
  --arg exotel_subdomain "$EXOTEL_SUBDOMAIN" \
  '{msg91_auth_key:$msg91_key, msg91_sender_id:$msg91_sender, msg91_template_id:$msg91_template, exotel_api_key:$exotel_key, exotel_api_token:$exotel_token, exotel_sid:$exotel_sid, exotel_caller_id:$exotel_caller, exotel_subdomain:$exotel_subdomain}')"
```

Expected: VersionId returned.

- [ ] **Step 4: Verify ECS task definition reads from secrets**

Read: `infrastructure/terraform/ecs.tf`. The container definition `secrets` block should map each env var (e.g., `MSG91_AUTH_KEY`) to the corresponding Secrets Manager ARN with JSON key path (e.g., `arn:aws:secretsmanager:...rdn/uat/api-keys:msg91_auth_key::`).

If the ecs.tf doesn't reference the api-keys/jwt-secret JSON keys correctly, update it. Reference syntax:

```hcl
secrets = [
  { name = "MSG91_AUTH_KEY", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:msg91_auth_key::" },
  { name = "JWT_SECRET",    valueFrom = "${aws_secretsmanager_secret.jwt.arn}:access::" },
  # ... one per secret key
]
```

If you had to update ecs.tf, re-run `terraform apply -var-file=environments/uat.tfvars` to push the task definition revision.

- [ ] **Step 5: Trigger an ECS service redeploy to pick up new secrets**

Run: `aws ecs update-service --cluster rdn-uat --service rdn-uat-api --force-new-deployment`
Expected: service deployment in progress.

- [ ] **Step 6: Tail ECS task logs**

Run: `aws logs tail /ecs/rdn-uat --follow --since 5m | head -100`
Expected: API boots cleanly, no missing-env errors.

- [ ] **Step 7: Verify health endpoint over the ALB**

Run: `curl -fsS https://$(cd infrastructure/terraform && terraform output -raw alb_dns_name)/v1/health`
Expected: `{"status":"ok"}` or similar 200 response.

### Task 25: Deploy first UAT image via the new workflow

**Files:** None (CI run only)

- [ ] **Step 1: Cut a release branch from main**

```bash
git checkout main && git pull
git checkout -b release/uat-1
git push -u origin release/uat-1
```

- [ ] **Step 2: Watch the deploy-uat workflow**

Run: `gh run watch $(gh run list --workflow=deploy-uat.yml --limit=1 --json databaseId -q '.[0].databaseId')`
Expected: workflow goes through CI → Deploy API → Migrations → Deploy Web. All steps green.

- [ ] **Step 3: Confirm web is reachable**

Open the Vercel UAT URL (from workflow output). Verify the homepage loads. Open `/dashboard/properties/new` after logging in to confirm the wizard renders.

- [ ] **Step 4: Note any deploy issues for fix-up**

If anything fails, capture the error, fix, push to `release/uat-1`, re-watch. Do not move to Phase 4 until a clean deploy completes.

---

## Phase 4 — Seed UAT Data and Smoke Test

### Task 26: Build UAT seed script

**Files:**

- Create: `packages/db/prisma/seed-uat.ts`
- Modify: `packages/db/package.json` (add `seed:uat` script)

- [ ] **Step 1: Write the seed script**

Write to `packages/db/prisma/seed-uat.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding UAT data...');

  // 2 societies
  const society1 = await prisma.society.upsert({
    where: { slug: 'green-valley-uat' },
    update: {},
    create: {
      name: 'Green Valley UAT',
      slug: 'green-valley-uat',
      city: 'Bengaluru',
      address: 'Whitefield, Bengaluru 560066',
      totalUnits: 200,
      amenities: { items: ['Pool', 'Gym', 'Park', 'Clubhouse', 'Children Play Area'] },
    },
  });

  const society2 = await prisma.society.upsert({
    where: { slug: 'sunrise-heights-uat' },
    update: {},
    create: {
      name: 'Sunrise Heights UAT',
      slug: 'sunrise-heights-uat',
      city: 'Bengaluru',
      address: 'Indiranagar, Bengaluru 560038',
      totalUnits: 120,
      amenities: { items: ['Gym', 'Park', 'Clubhouse'] },
    },
  });

  // 1 SUPER_ADMIN
  await prisma.user.upsert({
    where: { phone: '+919999900001' },
    update: {},
    create: {
      phone: '+919999900001',
      name: 'UAT Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });

  // 1 RWA_ADMIN per society
  await prisma.user.upsert({
    where: { phone: '+919999900002' },
    update: {},
    create: {
      phone: '+919999900002',
      name: 'UAT RWA Admin GV',
      role: 'RWA_ADMIN',
      isVerified: true,
      primarySocietyId: society1.id,
    },
  });
  await prisma.user.upsert({
    where: { phone: '+919999900003' },
    update: {},
    create: {
      phone: '+919999900003',
      name: 'UAT RWA Admin SH',
      role: 'RWA_ADMIN',
      isVerified: true,
      primarySocietyId: society2.id,
    },
  });

  // 2 OWNERS per society
  const owners = await Promise.all([
    prisma.user.upsert({
      where: { phone: '+919999900010' },
      update: {},
      create: {
        phone: '+919999900010',
        name: 'UAT Owner 1',
        role: 'OWNER',
        isVerified: true,
        primarySocietyId: society1.id,
      },
    }),
    prisma.user.upsert({
      where: { phone: '+919999900011' },
      update: {},
      create: {
        phone: '+919999900011',
        name: 'UAT Owner 2',
        role: 'OWNER',
        isVerified: true,
        primarySocietyId: society1.id,
      },
    }),
    prisma.user.upsert({
      where: { phone: '+919999900012' },
      update: {},
      create: {
        phone: '+919999900012',
        name: 'UAT Owner 3',
        role: 'OWNER',
        isVerified: true,
        primarySocietyId: society2.id,
      },
    }),
  ]);

  // 1 DEALER per society
  await prisma.user.upsert({
    where: { phone: '+919999900020' },
    update: {},
    create: {
      phone: '+919999900020',
      name: 'UAT Dealer GV',
      role: 'DEALER',
      isVerified: true,
      primarySocietyId: society1.id,
    },
  });
  await prisma.user.upsert({
    where: { phone: '+919999900021' },
    update: {},
    create: {
      phone: '+919999900021',
      name: 'UAT Dealer SH',
      role: 'DEALER',
      isVerified: true,
      primarySocietyId: society2.id,
    },
  });

  // 5 verified properties across both societies
  const propertiesData = [
    {
      society: society1,
      owner: owners[0],
      flat: 'A-101',
      tower: 'Tower A',
      tx: 'RENT' as const,
      bhk: 2,
      rent: 28000,
    },
    {
      society: society1,
      owner: owners[0],
      flat: 'A-205',
      tower: 'Tower A',
      tx: 'SALE' as const,
      bhk: 3,
      sale: 12000000,
    },
    {
      society: society1,
      owner: owners[1],
      flat: 'B-301',
      tower: 'Tower B',
      tx: 'RENT' as const,
      bhk: 1,
      rent: 18000,
    },
    {
      society: society2,
      owner: owners[2],
      flat: 'C-101',
      tower: 'Tower C',
      tx: 'BOTH' as const,
      bhk: 3,
      rent: 45000,
      sale: 18000000,
    },
    {
      society: society2,
      owner: owners[2],
      flat: 'C-202',
      tower: 'Tower C',
      tx: 'RENT' as const,
      bhk: 2,
      rent: 32000,
    },
  ];

  for (const p of propertiesData) {
    await prisma.property.upsert({
      where: {
        societyId_flatNumber_towerBlock: {
          societyId: p.society.id,
          flatNumber: p.flat,
          towerBlock: p.tower,
        },
      },
      update: {},
      create: {
        societyId: p.society.id,
        ownerId: p.owner.id,
        flatNumber: p.flat,
        towerBlock: p.tower,
        type: 'APARTMENT',
        transactionType: p.tx,
        bhk: p.bhk,
        carpetArea: 950,
        superArea: 1100,
        floor: 3,
        totalFloors: 12,
        facing: 'E',
        furnishing: 'SEMI',
        priceRent: p.rent,
        priceSale: p.sale,
        verificationStatus: 'VERIFIED',
        amenities: { Pool: true, Gym: true },
        restrictions: {},
      },
    });
  }

  console.log('UAT seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed:uat script to packages/db/package.json**

Edit `packages/db/package.json`. Add to scripts:

```json
"seed:uat": "tsx prisma/seed-uat.ts"
```

- [ ] **Step 3: Run the seed against UAT DB**

Run: `cd packages/db && DATABASE_URL=$DATABASE_URL_UAT pnpm seed:uat`
Expected: "UAT seed complete." and no errors.

- [ ] **Step 4: Spot-check seeded data**

Run: `psql "$DATABASE_URL_UAT" -c "SELECT name, slug, city FROM societies WHERE slug LIKE '%-uat';"`
Expected: 2 rows.

Run: `psql "$DATABASE_URL_UAT" -c "SELECT phone, role FROM users WHERE phone LIKE '+91999990%';"`
Expected: 7 rows (1 super, 2 rwa, 3 owners, 2 dealers — adjust if seed differs).

Run: `psql "$DATABASE_URL_UAT" -c "SELECT flat_number, transaction_type, verification_status FROM properties WHERE society_id IN (SELECT id FROM societies WHERE slug LIKE '%-uat');"`
Expected: 5 rows, all VERIFIED.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/seed-uat.ts packages/db/package.json
git commit -m "chore(db): add UAT seed script

Seeds 2 societies, 1 super admin, 2 RWA admins, 3 owners, 2
dealers, 5 verified properties. Idempotent — safe to re-run."
```

### Task 27: Run end-to-end smoke test on UAT

**Files:** None (manual verification)

- [ ] **Step 1: Buyer flow — search and enquire**

Open the UAT web URL anonymously. Search for "Green Valley UAT". Expected: society profile page loads, lists 3 verified properties. Click one. Click "Enquire Now". Sign up via OTP using a real test phone number. Expected: OTP arrives via MSG91, registration succeeds, enquiry submitted.

If OTP doesn't arrive, check: MSG91 dashboard for delivery status, ECS logs for API errors.

- [ ] **Step 2: Owner flow — list a property**

Log in as `+919999900010` (UAT Owner 1). Navigate to `/dashboard/properties/new`. Walk through all 6 wizard steps and submit. Expected: property created with `verificationStatus = PENDING`, draft cleared from localStorage.

- [ ] **Step 3: RWA admin flow — approve listing**

Log in as `+919999900002` (UAT RWA Admin GV). Navigate to verification queue (or `/dashboard/properties` if no separate queue UI exists yet). Find the PENDING property. Approve it. Expected: status moves to RWA_APPROVED, property visible in public search within 5 seconds.

If a verification queue UI is missing, file a follow-up issue; for UAT smoke test, manually update the DB:

```sql
UPDATE properties SET verification_status = 'RWA_APPROVED' WHERE id = '<id>';
```

- [ ] **Step 4: Dealer flow — receive lead**

Log in as `+919999900020` (UAT Dealer GV). Navigate to `/dashboard/leads`. Expected: the enquiry from Step 1 appears in the lead list (assuming dealer is assigned to the property's society).

- [ ] **Step 5: Masked call — verify Exotel routing**

From buyer or dealer dashboard, trigger a "Call" button. Expected: phone rings via Exotel virtual number. Caller IDs are masked (neither party sees the other's real number).

If call doesn't connect, check: Exotel dashboard call logs, ECS logs for `/communication/call` endpoint errors.

- [ ] **Step 6: File a checklist with results**

Write a markdown summary of what passed and what failed to `docs/uat-smoke-test-results-$(date +%F).md`. Commit it.

```bash
git add docs/uat-smoke-test-results-*.md
git commit -m "docs: record UAT smoke test results

$(date +%F) — initial UAT smoke pass. See doc for per-flow results."
```

### Task 28: Build a verification queue UI (if smoke test revealed it's missing)

**Files (conditional):**

- Create: `apps/web/src/app/dashboard/verification-queue/page.tsx`
- Create: `apps/api/src/modules/properties/verification.controller.ts` (or extend existing)

If Step 3 of Task 27 worked via existing UI, **skip this task**.

If a manual SQL update was needed, build the missing UI:

- [ ] **Step 1: Add API endpoint to list pending properties scoped to RWA admin's society**

Edit `apps/api/src/modules/properties/properties.controller.ts`. Add:

```typescript
@Get('verification-queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RWA_ADMIN', 'SUPER_ADMIN')
async getQueue(@CurrentUser() user: AuthenticatedUser) {
  return this.propertiesService.getVerificationQueue(user.id, user.role);
}

@Patch(':id/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RWA_ADMIN', 'SUPER_ADMIN')
async approve(
  @Param('id') id: string,
  @Body() body: { decision: 'RWA_APPROVED' | 'REJECTED'; reason?: string },
  @CurrentUser() user: AuthenticatedUser,
) {
  return this.propertiesService.updateVerification(id, body.decision, body.reason, user);
}
```

Implement the corresponding service methods.

- [ ] **Step 2: Add the page**

Write to `apps/web/src/app/dashboard/verification-queue/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { propertiesApi } from '@/lib/api/properties';

type PendingProperty = { id: string; flatNumber: string; towerBlock: string; society: { name: string }; createdAt: string };

export default function VerificationQueuePage() {
  const [items, setItems] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => propertiesApi.getQueue().then((r) => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const decide = async (id: string, decision: 'RWA_APPROVED' | 'REJECTED') => {
    await propertiesApi.updateVerification(id, decision);
    await refresh();
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Verification Queue</h1>
      {items.length === 0 ? (
        <p className="text-muted">No pending listings.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="flex justify-between items-center p-4 border border-border rounded">
              <div>
                <p className="font-medium">{p.flatNumber}, {p.towerBlock}</p>
                <p className="text-sm text-muted">{p.society.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => decide(p.id, 'RWA_APPROVED')} className="px-3 py-1 bg-success text-white rounded text-sm">Approve</button>
                <button onClick={() => decide(p.id, 'REJECTED')} className="px-3 py-1 bg-error text-white rounded text-sm">Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add link to sidebar nav for RWA_ADMIN**

Read: `apps/web/src/components/layout/sidebar.tsx`. Add a nav item conditional on `user.role === 'RWA_ADMIN' || user.role === 'SUPER_ADMIN'` pointing to `/dashboard/verification-queue`.

- [ ] **Step 4: Re-run Task 27 Step 3 to validate**

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/properties apps/web/src/app/dashboard/verification-queue apps/web/src/lib/api/properties.ts apps/web/src/components/layout/sidebar.tsx
git commit -m "feat: add RWA verification queue UI and endpoints

PENDING listings appear in queue scoped by society. RWA_ADMIN
can approve or reject. Approved listings flow into public
search within seconds."
```

### Task 29: Create UAT runbook

**Files:**

- Create: `docs/uat-runbook.md`

- [ ] **Step 1: Write the runbook**

Write to `docs/uat-runbook.md`:

```markdown
# RDN UAT Runbook

## Environment

- Web: <Vercel UAT URL>
- API: <ALB DNS>
- Database: <RDS endpoint>
- Region: ap-south-1

## Test accounts

| Role         | Phone         | Notes                        |
| ------------ | ------------- | ---------------------------- |
| SUPER_ADMIN  | +919999900001 | Full access                  |
| RWA_ADMIN GV | +919999900002 | Society: Green Valley UAT    |
| RWA_ADMIN SH | +919999900003 | Society: Sunrise Heights UAT |
| OWNER 1      | +919999900010 | 2 properties in GV           |
| OWNER 2      | +919999900011 | 1 property in GV             |
| OWNER 3      | +919999900012 | 2 properties in SH           |
| DEALER GV    | +919999900020 | Society: GV                  |
| DEALER SH    | +919999900021 | Society: SH                  |

## Common operations

- Reseed UAT data: `DATABASE_URL=$DATABASE_URL_UAT pnpm --filter db seed:uat`
- Tail API logs: `aws logs tail /ecs/rdn-uat --follow`
- Force ECS redeploy: `aws ecs update-service --cluster rdn-uat --service rdn-uat-api --force-new-deployment`
- Tunnel to RDS: `aws ssm start-session --target <bastion-id> --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["<rds>"],"portNumber":["5432"],"localPortNumber":["5433"]}'`

## Known gaps

- Image moderation not automated
- Bulk CSV import not built (open question in property-listing-flow PRD)
- Commission settlement blocked by pending RDN/Dealer/RWA split decision (see docs/OPEN_ITEMS.md)

## Rollback

1. Identify last good Docker image tag in ECR: `aws ecr describe-images --repository-name rdn-api --query 'sort_by(imageDetails,& imagePushedAt)[-5:].imageTags' --output table`
2. Update ECS task definition to point to that tag (or use `aws ecs update-service` with the previous task definition revision).
3. Reset DB only if migrations broke things — restore from last automated snapshot (24h retention).
```

- [ ] **Step 2: Commit**

```bash
git add docs/uat-runbook.md
git commit -m "docs: add UAT environment runbook

Test accounts, common ops commands, known gaps, rollback steps."
```

---

## Phase 5 — UAT Cutover and Sign-off

### Task 30: Tag the UAT release and announce

**Files:** None

- [ ] **Step 1: Merge release/uat-1 back to main**

Open PR: `gh pr create --base main --head release/uat-1 --title "release: UAT-1 cutover" --body "First UAT promotion. See docs/uat-runbook.md."`
Get review approval. Merge.

- [ ] **Step 2: Tag the release**

```bash
git checkout main && git pull
git tag -a uat-1.0 -m "UAT 1.0 — first stakeholder validation cut"
git push origin uat-1.0
```

- [ ] **Step 3: Notify stakeholders**

Send the runbook URL + test accounts + UAT web URL to the stakeholder distribution list. Include the smoke-test results doc path.

### Task 31: Set up basic UAT monitoring

**Files:**

- Create: `infrastructure/terraform/cloudwatch-alarms.tf` (or extend existing)

- [ ] **Step 1: Add alarms for the UAT environment**

Write to `infrastructure/terraform/cloudwatch-alarms.tf` (if it doesn't exist):

```hcl
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.app_name}-${var.environment}-api-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.app_name}-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.app_name}-${var.environment}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5000000000  # 5 GB
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}
```

- [ ] **Step 2: Apply Terraform**

```bash
cd infrastructure/terraform
terraform workspace select uat
terraform apply -var-file=environments/uat.tfvars -var "db_password=<password>" 2>&1 | tail -20
```

Expected: 3 alarms created.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/terraform/cloudwatch-alarms.tf
git commit -m "infra: add CloudWatch alarms for API 5xx, ECS CPU, RDS storage

Baseline alerting for UAT. Same alarms apply to dev/prod when
applied with their respective tfvars."
```

### Task 32: Sign-off checklist

**Files:**

- Create: `docs/uat-signoff-2026-05.md`

- [ ] **Step 1: Compile the sign-off doc**

Write to `docs/uat-signoff-2026-05.md`:

```markdown
# RDN UAT Sign-off — 2026-05

## Scope of UAT

- Path B property listing flow (6-step wizard, S3 photo upload, draft autosave)
- Buyer search, enquiry, OTP signup
- Owner listing creation
- RWA admin verification queue
- Dealer lead receipt
- Masked calling via Exotel

## Environment

- Web: <Vercel UAT URL>
- API: <ALB DNS>
- Build tag: uat-1.0

## Test accounts

See docs/uat-runbook.md.

## Sign-off matrix

| Stakeholder | Role             | Sign-off date | Notes |
| ----------- | ---------------- | ------------- | ----- |
|             | Product owner    |               |       |
|             | Engineering lead |               |       |
|             | RWA pilot lead   |               |       |
|             | Operations lead  |               |       |

## Open items pre-prod

- [ ] Commission split decision (blocks settlement module)
- [ ] Verification service pricing decision
- [ ] Image moderation strategy (auto vs manual)
- [ ] Bulk CSV import for SUPER_ADMIN onboarding (open question in property-listing-flow PRD)
- [ ] Domain + SSL cert for production (currently UAT uses ALB DNS only)

## Production cutover prerequisites

- All sign-offs collected
- Open items resolved or explicitly deferred with risk acceptance
- Production tfvars updated with prod sizing + Multi-AZ
- Production secrets rotated (no shared values with UAT)
- Production DNS + ACM cert provisioned
```

- [ ] **Step 2: Commit and circulate**

```bash
git add docs/uat-signoff-2026-05.md
git commit -m "docs: add UAT sign-off checklist for 2026-05 cycle"
```

Send to stakeholders. Wait for sign-offs before scheduling production promotion.

---

## Self-Review Notes

**Spec coverage check:**

- Phase 0 covers: 77-file diff, build green, known bugs (kycStatus, ForbiddenException, missing CSS vars)
- Phase 1 covers: UAT terraform tfvars, infra apply, CI workflow, GitHub secrets, DB migrations
- Phase 2 covers all six steps from `docs/prd/property-listing-flow.md`: Basics, Specs, Pricing, Photos (with S3 + downscale), Amenities/Restrictions, Review/Submit. Plus draft autosave, step validation, route, primarySocietyId schema gap. Verification queue UI conditional on smoke-test outcome (Task 28).
- Phase 3 covers: MSG91, Exotel, SES, JWT, Secrets Manager population, ECS task redeploy
- Phase 4 covers: Seed script, end-to-end smoke test, runbook, conditional verification queue UI
- Phase 5 covers: tag, monitoring alarms, sign-off doc

**Type consistency:** `WizardStep`, `WizardData`, `PhotoState`, `WizardAction` defined once in Task 12 and consumed identically in Tasks 13–22. `validateStep` returns same shape used by wizard shell.

**Gaps acknowledged in plan:** image moderation (deferred), bulk CSV import (deferred), production DNS/ACM (called out in sign-off checklist), commission split (called out in sign-off checklist).

**Plan length:** 32 tasks across 5 phases. Phase 2 is the longest (11 tasks) because Path B is the largest unbuilt piece. Each task is bite-sized and TDD-shaped where applicable; infrastructure and config tasks (terraform apply, secret rotation) are step-by-step verification rather than red-green-refactor.
