# Mobile Phase 4 — Submission Checklist

Engineering scaffolding done. Remaining items require user/external action before App Store / Play Store submission.

## 1. Legal pages — finalise content

- [ ] Replace placeholder content in `apps/web/src/app/(public)/privacy/page.tsx` with legal-reviewed draft
- [ ] Replace placeholder content in `apps/web/src/app/(public)/terms/page.tsx` with legal-reviewed draft
- [ ] Designate **real** Grievance Officer — name, email, phone — update both pages
- [ ] Confirm `app.json` `privacyUrl` + `termsUrl` resolve to live pages on prod domain

## 2. Deep links — finalise IDs

- [ ] Replace `REPLACE_TEAM_ID` in `apps/web/public/.well-known/apple-app-site-association` with actual Apple Team ID
- [ ] Replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256_FROM_PLAY_CONSOLE` in `apps/web/public/.well-known/assetlinks.json` with SHA256 from Play Console → Setup → App integrity → App signing key
- [ ] When moving to prod domain, update `apps/mobile/app.json` → `ios.associatedDomains` + `android.intentFilters[].data[].host`
- [ ] Verify AASA served as `application/json`: `curl -I https://rdn-web-one.vercel.app/.well-known/apple-app-site-association`
- [ ] Verify assetlinks served as `application/json`: `curl -I https://rdn-web-one.vercel.app/.well-known/assetlinks.json`
- [ ] Universal link smoke test: open `https://rdn-web-one.vercel.app/property/<id>` on a phone with app installed — should open in app

## 3. Store assets (designer)

Required dimensions per platform:

| Asset                          | iOS                                                                      | Android                                                                          |
| ------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| App icon                       | 1024×1024 (already in `apps/mobile/assets/icon.png`)                     | 512×512 + adaptive 1024×1024 (already in `apps/mobile/assets/adaptive-icon.png`) |
| Splash                         | 1284×2778 (already in `apps/mobile/assets/splash.png`)                   | same                                                                             |
| Screenshots — phone            | 6.7" (1290×2796) + 6.5" (1242×2688) + 5.5" (1242×2208) — 3–10 per device | phone (1080×1920 or 1080×2340) — 2–8                                             |
| Screenshots — tablet           | 12.9" iPad Pro (2048×2732) — required if `supportsTablet: true`          | 7" + 10" tablet (1200×1920)                                                      |
| Feature graphic (Android only) | —                                                                        | 1024×500                                                                         |
| Promotional video (optional)   | iOS App Preview .mov                                                     | YouTube URL                                                                      |

Place captured screenshots in `apps/mobile/store-assets/` (gitignored — too large for git; use cloud storage).

Generation:

```bash
# After EAS build is installed, capture from iOS simulator + Android emulator
# Use Fastlane snapshot OR manual captures across required device sizes
```

## 4. Store metadata

### App Store Connect → App Information

- [ ] **App name:** RDN — Society Real Estate
- [ ] **Subtitle:** Society-verified rentals & sales
- [ ] **Promotional text** (170 chars, updateable without resubmit): "List, search, and rent/buy homes within your housing society. RWA-verified, India-only."
- [ ] **Description** (4000 chars max) — see `docs/store-metadata.md` draft (to write)
- [ ] **Keywords** (100 chars, comma-separated): `real estate,rent,buy,society,RWA,India,broker free,community,housing,flat`
- [ ] **Support URL:** https://rdn-web-one.vercel.app/grievance
- [ ] **Marketing URL:** https://rdn-web-one.vercel.app
- [ ] **Privacy Policy URL:** https://rdn-web-one.vercel.app/privacy
- [ ] **Primary category:** Lifestyle (or Business)
- [ ] **Secondary category:** Productivity
- [ ] **Age rating:** 4+ (no objectionable content)
- [ ] **Content rights:** confirm we have rights to all assets

### App Store Connect → App Privacy

Disclose data collection per Apple's "Data Collected" questionnaire:

| Data                   | Linked to user? | Used for tracking? | Purpose                                   |
| ---------------------- | --------------- | ------------------ | ----------------------------------------- |
| Phone number           | Yes             | No                 | App functionality, account, communication |
| Name                   | Yes             | No                 | App functionality                         |
| Email (optional)       | Yes             | No                 | Customer support                          |
| Photos                 | Yes             | No                 | App functionality (property uploads)      |
| Coarse location        | Yes             | No                 | Analytics, app functionality              |
| Device ID (push token) | Yes             | No                 | Push notifications                        |
| Crash data             | No              | No                 | Analytics                                 |

### Play Console → Store listing

- [ ] **App title** (30 chars max): "RDN — Society Real Estate"
- [ ] **Short description** (80 chars): "List, search & rent homes within your society. Verified by your RWA."
- [ ] **Full description** (4000 chars): same content as iOS description
- [ ] **App category:** House & Home (or Lifestyle)
- [ ] **Tags:** real estate, rentals, India
- [ ] **Contact:** email, website, phone (optional)
- [ ] **Privacy Policy URL:** https://rdn-web-one.vercel.app/privacy

### Play Console → App content

- [ ] **Privacy Policy** URL set
- [ ] **Ads** declaration: No (we do not show third-party ads)
- [ ] **App access:** provide test login (`+919999900001` / OTP `123456`) — note this is dev-bypass; for production we should provide a real TestFlight/Internal Track account
- [ ] **Data safety form** — fill out per actual collection (same as Apple's questionnaire)
- [ ] **Content rating** questionnaire — should result in PEGI 3 / IARC "everyone"
- [ ] **Target audience:** 18+
- [ ] **News apps:** No
- [ ] **COVID-19 contact tracing:** No
- [ ] **Government apps:** No
- [ ] **Financial features:** Yes (rent transactions via Razorpay) — disclose

## 5. EAS submit configuration

Update `apps/mobile/eas.json` → `submit.production`:

```jsonc
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "1234567890", // numeric App Store Connect App ID
        "appleTeamId": "ABCDE12345", // 10-char Team ID
      },
      "android": {
        "serviceAccountKeyPath": "./play-service-account.json",
        "track": "internal", // promote to "production" later
      },
    },
  },
}
```

## 6. E2E smoke (pre-submission)

- [ ] Login on real device (iOS + Android)
- [ ] Browse → property detail → enquiry
- [ ] Owner wizard end-to-end (when wizard is ported) — submit listing, RWA approves on web
- [ ] Dealer apply → RWA approves on web
- [ ] Receive push notification (requires FIREBASE_SERVICE_ACCOUNT on Railway)
- [ ] Tap push → routes to correct screen
- [ ] Consent toggles persist
- [ ] Data export returns JSON
- [ ] Account deletion: confirm soft-delete in DB, re-login with same phone fails during grace
- [ ] Universal link from Safari/Chrome opens app
- [ ] Background → foreground does not crash
- [ ] Sentry receives a test crash (force from a hidden dev menu)

## 7. Submission day

1. Bump `apps/mobile/app.json` `version` (e.g. 1.0.0 → 1.0.1) and `ios.buildNumber` + `android.versionCode`
2. Commit + tag: `git tag v1.0.0 && git push --tags`
3. CI (`.github/workflows/deploy-mobile.yml`) auto-runs: builds → submits to TestFlight + Play Internal
4. iOS review: 24–72h typically. Android Internal Testing: immediate; Production: a few hours review
5. Promote to production after 1 week internal testing with no critical bugs

## 8. Post-launch

- [ ] Monitor Sentry for crashes
- [ ] Monitor 1-star reviews in App Store + Play Console for breakage
- [ ] Monitor grievances at /grievance
- [ ] Track Apple/Google review feedback if rejected — common reasons:
  - Missing account deletion flow (we have it ✓)
  - Privacy policy URL invalid
  - Permissions used without justification (we have justifications in `infoPlist` ✓)
  - Crash on launch (Sentry will catch)
  - In-app purchase circumvention (we don't have payments in-app ✓)
