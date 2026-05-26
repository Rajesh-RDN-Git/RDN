# Mobile Phase 1 — User-Action Checklist

Engineering items (Phase 0 + scaffolding) done in code. Remaining items need user/external action before first EAS build can succeed.

## 1. Apple Developer Program ($99/yr)

- [ ] Enroll at https://developer.apple.com/programs/enroll/ (individual or organization — org takes 1–2 weeks, D-U-N-S number needed)
- [ ] Note **Apple Team ID** (10-char alphanumeric, found in Membership page)
- [ ] In App Store Connect → Apps → `+` → New App
  - Platform: iOS
  - Name: RDN
  - Primary language: English (India)
  - Bundle ID: `com.rdn.mobile` (must match `app.json` → `ios.bundleIdentifier`)
  - SKU: `rdn-mobile-1`
- [ ] Note **App Store Connect App ID** (numeric, from App Information page)
- [ ] Update `apps/mobile/eas.json` → `submit.production.ios.ascAppId` + `appleTeamId`

## 2. Google Play Console ($25 one-time)

- [ ] Enroll at https://play.google.com/console (24-hour review)
- [ ] Create app: package name `com.rdn.mobile` (must match `app.json` → `android.package`)
- [ ] Service Account JSON for EAS submit:
  - Google Cloud Console → IAM → Service Accounts → Create
  - Role: `Service Account User`
  - Create JSON key, download
  - Play Console → Setup → API access → link service account, grant `Release Manager`
- [ ] Save JSON as `apps/mobile/play-service-account.json` (already in `.gitignore` — verify)

## 3. EAS account + project

- [ ] `pnpm dlx eas-cli@latest login` (Expo account)
- [ ] From `apps/mobile/`: `pnpm dlx eas-cli init` — creates EAS project
- [ ] Copy generated **EAS project ID** into `app.json` → `extra.eas.projectId`
- [ ] Update `app.json` → `owner` to your Expo account/org slug

## 4. GitHub Actions secret

- [ ] Expo dashboard → Account Settings → Access Tokens → create new
- [ ] GitHub repo → Settings → Secrets and variables → Actions → add `EXPO_TOKEN`
- [ ] Verify `.github/workflows/deploy-mobile.yml` references `secrets.EXPO_TOKEN` (already does)

## 5. Push notification credentials (defer to Phase 2)

Phase 2 task. Skip for now.

## 6. App icon + splash assets (designer task)

- [ ] Brief designer per `apps/mobile/assets/README.md`
- [ ] Deliverables:
  - `apps/mobile/assets/icon.png` (1024×1024)
  - `apps/mobile/assets/splash.png` (1284×2778)
  - `apps/mobile/assets/adaptive-icon.png` (1024×1024, transparent bg)
- [ ] Without these, `eas build` will fail. As temporary unblock:
  ```bash
  brew install imagemagick
  cd apps/mobile/assets
  # then run the magick commands in assets/README.md
  ```

## 7. Add gitignore entries

- [ ] Add `play-service-account.json` to `apps/mobile/.gitignore` (or root) — never commit
- [ ] `.env.production` already covered by root `.gitignore`

## 8. First EAS builds

```bash
cd apps/mobile

# Internal dev client for iOS simulator (no signing)
pnpm dlx eas-cli build --platform ios --profile development

# Internal preview hitting UAT API
pnpm dlx eas-cli build --platform all --profile preview

# Production (TestFlight + Play Internal)
pnpm dlx eas-cli build --platform all --profile production
pnpm dlx eas-cli submit --platform all --profile production
```

CI auto-runs on `git tag v1.0.0-beta && git push --tags`.

## 9. Smoke test (Phase 0 verification, doable now without EAS)

```bash
# 1. Ensure UAT API is up
curl -sf https://api-uat-10d1.up.railway.app/v1/health | jq .

# 2. Start Expo dev server
pnpm --filter mobile dev

# 3. Open Expo Go on phone, scan QR
# 4. Login with +919999900001 / OTP any 6 digits
# 5. Confirm:
#    - dashboard loads
#    - socket connects (check Railway logs for `gateway` handshake)
#    - search/property detail render real UAT data
```

## Phase 1 acceptance gate (do not proceed to Phase 2 until)

- [ ] Apple + Google developer accounts active
- [ ] `eas.json` IDs filled, `app.json` projectId filled
- [ ] EAS preview build installable on iPhone (`.ipa` via Diawi/EAS install link) + Android (`.apk` direct install)
- [ ] App opens, shows splash, hits UAT API, login works on real device
- [ ] `EXPO_TOKEN` in GitHub secrets — verified by re-running deploy-mobile workflow manually
