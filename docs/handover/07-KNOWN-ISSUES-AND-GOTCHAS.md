# 07 — Known Issues and Gotchas

> Every trap here has already cost someone a day or a night. Read this before your first
> production deploy, not after it.

---

## Deployment

### The `latest` tag must be moved by hand after every build

The ECS task definition pulls the image tag `latest`. CodeBuild pushes `prod-latest` and
`prod-<sha>` — it does **not** move `latest`. If you skip the retag step, the deploy appears
to succeed and quietly redeploys the previous image. The exact commands are in
[03](./03-ENVIRONMENTS-AND-DEPLOY.md).

The permanent fix is to either add the `latest` tag in the CodeBuild buildspec
(`infrastructure/terraform/codebuild.tf`) or point the task definition at `prod-latest`.
Neither has been done.

### The container image needs `curl`

The ECS container health check is `curl -f http://localhost:4000/v1/health`, and
`node:20-alpine` ships **without curl**. Every container failed its health check, survived
exactly the 180-second grace period plus three thirty-second failures, and was killed —
producing an entire night of deploy churn that looked like slow boot.

The confusing part: `/v1/health` returned 200 in the application logs the whole time. Those
were the ALB target-group checks, which are separate and were passing.

`Dockerfile.api` now runs `apk add --no-cache openssl curl` in the runner stage (commit
`2f3501c`). **If you ever change the base image, re-check that curl survives.** The tell for
this failure mode is a task that lives roughly five minutes and then dies.

### Do not stack force-new-deployments

Queueing several rollouts while one is mid-transition caused a brief 503 dip in production.
Start one, watch it converge to `running == desired` with a single deployment, then move on.

### The Amplify build spec is load-bearing and looks like nonsense

It lives in `infrastructure/terraform/amplify.tf`. It writes a hoisted `.npmrc` inside the
container, deletes `apps/mobile` and `pnpm-lock.yaml`, installs with `pnpm install --filter
web...`, then post-install deletes `apps/web/node_modules/react` and
`apps/web/node_modules/react-dom`, with `buildPath` set to `/`.

Every step exists for a reason:

1. Amplify cannot bundle pnpm's symlinked `node_modules`, so the install must be hoisted.
2. Mobile is on React 19 and web on React 18. Only one wins the hoisted root slot, and the
   **lockfile** decides — filtering and `--frozen-lockfile` do not save you. Hence deleting
   mobile and the lockfile before installing.
3. Hoisted pnpm then nests the direct dependencies again, producing two React instances in
   one bundle, which crashes at `/_error` with a `useContext` error. Hence deleting the
   nested copies.

Simplify this and production web goes down. Also note that pushing web changes to `main`
triggers an Amplify build that can race a build-spec update — stop the running job and start
a fresh release if you are changing both.

---

## MSG91 and OTP — the login dependency

Two distinct failures, each with a distinct HTTP code:

**HTTP 418 means the IP allowlist.** MSG91 has per-auth-key IP security. The production NAT
gateway's elastic IP `13.204.206.193` is whitelisted. If Terraform recreates the NAT gateway
that IP changes and OTP sending dies. Fix in MSG91's panel under Settings → Authkey.

**HTTP 400 "Template ID Missing or Invalid Template" means the wrong template type.** The
`/api/v5/otp` endpoint only accepts templates created under MSG91's **OTP product** section.
A template created as SMS or Flow type is rejected even when the DLT registration is valid.
The working template was recreated under the OTP product reusing the approved DLT entity.

**Neither failure is visible from the application.** MSG91 returns HTTP 200 with an error
body, the code checks only `response.ok`, and the user is told the OTP was sent. The only
signal was MSG91's failure emails to the account owner. Fixing this is P0-2 in
[06](./06-BACKLOG-PRIORITY-IMPACT.md), and until it is fixed, treat MSG91's emails as a
production monitoring channel.

---

## Data and encryption

**Losing the encryption keys loses the data.** `AES_ENCRYPTION_KEY` and `BLIND_INDEX_KEY`
live in Secrets Manager. There is no recovery path. Before any restore, migration, or
environment clone, confirm the keys travel with the data.

**Phone cannot be queried directly.** It is ciphertext. Equality lookups go through the
`phoneHash` blind index, and the Prisma middleware rewrites `where.phone` for you — but
`findUnique` on an encrypted field does not work, so those call sites use `findFirst`. If a
lookup mysteriously returns nothing, this is usually why.

**Rebuild `@rdn/db` after editing it.** `pnpm --filter @rdn/db build`. Skipping this gives
you stale behaviour that looks like a logic bug.

**Seed scripts refuse to run against production** unless `ALLOW_PROD_SEED=true`. Leave that
guard alone.

**Seeded phone numbers are fake.** `+9199999000xx` cannot receive calls or SMS. Any test of
masked calling or OTP delivery needs real handsets.

---

## Application behaviour worth knowing

**Do not add a blanket auth redirect.** A dead refresh token used to hard-redirect signed-in
users off public property pages to `/login`. The fix is `loginRedirectFor()` in
`apps/web/src/lib/routes.ts`, which only redirects from `/dashboard` routes. The mobile app
has the same latent pattern and has not been fixed.

**S3 uploads silently no-op if the client picks mock mode.** The media service used to leave
mock mode only when static AWS keys were present. Production authenticates via the ECS task
role, so it stayed in mock mode, skipped every PUT, and saved a phantom CDN URL. The
production media bucket was empty for weeks and nobody noticed because the UI reported
success. Fixed 2026-07-21 via `shouldUseMockS3()` using the default credential chain. Images
uploaded before that date are unrecoverable.

**List endpoints double-wrap:** `{data: {data: [...], pagination}}`.

**`NODE_ENV` must be exactly `production` in production.** An earlier bug set something
else, which left Swagger publicly exposed and skipped guards. Production currently returns
404 on `/api/docs`, which is the correct state — check it after any environment change.

---

## Environment quirks

**UAT is unprotected.** Any six-digit OTP works and the URL is public. Do not put anything
sensitive in the UAT database, and close the gate (P0-4).

**Railway domains may not resolve on some home networks.** `*.up.railway.app` failed to
resolve on the outgoing developer's router. That was local DNS, not an outage. Flush with
`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`, or set the resolver to
1.1.1.1.

**Web dev server has a CSS bug.** Next 14.2's dev-mode CSS chunking produces misleading
visual results. For browser QA, build and run production locally instead.

**There is no mobile simulator in the automated environment.** Any real mobile verification
requires an EAS build on a device:
`cd apps/mobile && eas build --profile preview --platform android`.

**Local terraform variable files are the constraint, not state.** State is in S3 and is fine.
`secrets.prod.tfvars` is gitignored and local-only — without it you cannot plan or apply.

---

## Process notes inherited from this project

- **Bug fixes start with a failing test.** Every fix in the recent batch was written that
  way, and it is why the 218-test suite is worth trusting.
- **Never force-push**, and never commit `.env` files or secrets.
- Commits follow Conventional Commits with a subject of 50 characters or less.
- **Never email or configure alerts to `workctrl.tech` or `sworks.co.in`.** All alerting
  goes to rajesh@rdngroups.com. This constraint is in the repository root `CLAUDE.md` and it
  is not negotiable.
