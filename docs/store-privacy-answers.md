# Store Privacy Questionnaires — Pre-Filled Answers

Audited against current code. Click-through cheatsheet for Apple App Privacy + Play Data Safety. Re-verify if data flow changes.

Last audit: 2026-05-30. Based on `chore/uat-prep-stabilization` @ `4bb09a0`.

---

## Code audit — what we collect

| Data                      | Where collected                                          | Where stored                                  | Used for                              | Linked to user?                               | Optional?                           |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------- | ------------------------------------- | --------------------------------------------- | ----------------------------------- |
| Phone (E.164)             | Auth OTP                                                 | Postgres `users.phone` (encrypted at rest)    | Login, account, masked comms          | Yes                                           | No (required for login)             |
| Name                      | Profile setup                                            | `users.name`                                  | Display in app, lead context          | Yes                                           | No                                  |
| Email                     | Profile (optional)                                       | `users.email`                                 | Transactional email, customer support | Yes                                           | Yes                                 |
| Avatar URL                | Profile (optional)                                       | `users.avatar_url`                            | Display only                          | Yes                                           | Yes                                 |
| Property photos           | Property wizard upload                                   | AWS S3 (pre-signed PUT) → CDN                 | Display in listings                   | Yes (via listing → owner)                     | No (for listing)                    |
| Coarse location (city)    | Society selection at signup                              | `users.primary_society_id` → `societies.city` | Show local listings                   | Yes                                           | No (society required)               |
| Device push token         | `expo-notifications.getDevicePushTokenAsync` after login | `device_tokens` table                         | Push delivery via FCM/APNs            | Yes                                           | Yes (user can deny push permission) |
| Crash data                | Sentry SDK (`@sentry/react-native`)                      | Sentry SaaS                                   | Crash diagnostics                     | Anonymized (PII scrub in `src/lib/sentry.ts`) | No (init at boot)                   |
| Lead / chat content       | In-app messaging                                         | `conversations` + `messages` tables           | App functionality                     | Yes                                           | No (for that flow)                  |
| Nominee name + phone      | DPDP §11(b) profile                                      | `users.nominee_name/phone` (encrypted)        | Account inheritance                   | Yes                                           | Yes                                 |
| Consent ledger            | Consent screen                                           | `consent_records` (append-only)               | Compliance proof                      | Yes                                           | No (legal requirement)              |
| Razorpay payment metadata | Commission settlement                                    | `transactions`, `commissions`                 | Financial reporting                   | Yes                                           | No (for paid txns only)             |

**Tracking / advertising IDs: NOT collected.** No IDFA, no AAID, no third-party analytics SDK.

---

## Apple — App Privacy ("Data Collected")

App Store Connect → App Privacy → "Get Started" → answer each category.

### Q1. Does your app collect any data?

**Yes.**

### Categories — toggle each on/off

| Category         | Collected?                   | Items                                                                                                                             |
| ---------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Contact Info     | **Yes**                      | Name, Email Address, Phone Number                                                                                                 |
| Health & Fitness | No                           | —                                                                                                                                 |
| Financial Info   | **Yes**                      | Payment Info (only for users completing a Razorpay txn; Razorpay handles card; we store txn ID + amount)                          |
| Location         | **Yes**                      | Coarse Location (society → city derived)                                                                                          |
| Sensitive Info   | No                           | —                                                                                                                                 |
| Contacts         | No                           | —                                                                                                                                 |
| User Content     | **Yes**                      | Photos or Videos (property photos); Customer Support (in-app grievance); Other User Content (chat messages, listing descriptions) |
| Browsing History | No                           | —                                                                                                                                 |
| Search History   | No                           | — (search queries not stored)                                                                                                     |
| Identifiers      | **Yes**                      | User ID (our internal UUID); Device ID (push token)                                                                               |
| Purchases        | **Yes** (only for paid txns) | Purchase History (rent/sale brokerage settlements)                                                                                |
| Usage Data       | No                           | (no product interaction telemetry beyond Sentry crash)                                                                            |
| Diagnostics      | **Yes**                      | Crash Data, Performance Data (Sentry)                                                                                             |
| Surroundings     | No                           | —                                                                                                                                 |
| Body             | No                           | —                                                                                                                                 |
| Other Data       | No                           | —                                                                                                                                 |

### For each collected item, answer:

**Q: Is the data used to track the user across apps or websites?** **NO** for all items.
**Q: Is the data linked to the user's identity?**

| Item                   | Linked?                                   | Purpose(s)                                          |
| ---------------------- | ----------------------------------------- | --------------------------------------------------- |
| Name                   | Yes                                       | App Functionality, Customer Support                 |
| Email                  | Yes                                       | App Functionality, Customer Support                 |
| Phone                  | Yes                                       | App Functionality, Customer Support, Authentication |
| Payment Info           | Yes                                       | App Functionality                                   |
| Coarse Location        | Yes                                       | App Functionality, Analytics                        |
| Photos                 | Yes                                       | App Functionality                                   |
| Customer Support       | Yes                                       | Customer Support                                    |
| Chat messages          | Yes                                       | App Functionality                                   |
| User ID                | Yes                                       | App Functionality, Authentication                   |
| Device ID (push token) | Yes                                       | App Functionality (push delivery)                   |
| Purchase History       | Yes                                       | App Functionality                                   |
| Crash Data             | **No** (PII scrub in `src/lib/sentry.ts`) | App Functionality, Analytics                        |
| Performance Data       | No                                        | Analytics                                           |

### Q: Do you or your third-party partners use this data for advertising?

**No.**

### Required disclosures string (auto-generated by Apple)

After completing the form, Apple will generate the "Data Linked to You" / "Data Not Linked to You" panels shown on the App Store page. Re-screenshot for marketing.

---

## Google — Data Safety (Play Console)

Play Console → App content → Data safety.

### Section 1: Data collection and security

| Question                                                              | Answer                                                                                         |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Does your app collect or share any of the required user data types?   | **Yes**                                                                                        |
| Is all of the user data collected by your app encrypted in transit?   | **Yes** (TLS to api-uat-10d1.up.railway.app + S3 + Razorpay)                                   |
| Do you provide a way for users to request that their data is deleted? | **Yes** — in-app at Profile → Delete account; also at https://rdn-web-one.vercel.app/grievance |

### Section 2: Data types collected

For each, mark "Collected" (transmitted off device) and answer purpose, optional-or-required, link-to-identity.

| Data type                                                           | Collected    | Shared               | Optional           | Purposes                                  |
| ------------------------------------------------------------------- | ------------ | -------------------- | ------------------ | ----------------------------------------- |
| **Personal info → Name**                                            | Yes          | No                   | No                 | App functionality                         |
| **Personal info → Email address**                                   | Yes          | No                   | Yes                | App functionality, Customer support       |
| **Personal info → Phone number**                                    | Yes          | No                   | No                 | Account management, App functionality     |
| **Personal info → User IDs**                                        | Yes          | No                   | No                 | Account management, App functionality     |
| **Personal info → Other info** (nominee)                            | Yes          | No                   | Yes                | Account management                        |
| **Financial info → Purchase history**                               | Yes          | No                   | No (for paid txns) | App functionality                         |
| **Financial info → Other financial info** (transaction ID + amount) | Yes          | No                   | No (for paid txns) | App functionality, Fraud prevention       |
| **Location → Approximate location**                                 | Yes          | No                   | No                 | App functionality (show society listings) |
| **Photos and videos → Photos**                                      | Yes          | No                   | No (for listing)   | App functionality                         |
| **Messages → Other in-app messages**                                | Yes          | No                   | No                 | App functionality                         |
| **App activity → In-app search history**                            | No           | —                    | —                  | —                                         |
| **App activity → Other actions**                                    | No           | —                    | —                  | —                                         |
| **App info and performance → Crash logs**                           | Yes (Sentry) | Shared with Sentry   | No                 | App functionality, Analytics              |
| **App info and performance → Diagnostics**                          | Yes (Sentry) | Shared with Sentry   | No                 | Analytics                                 |
| **Device or other IDs**                                             | Yes          | Shared with Firebase | No                 | App functionality (push notifications)    |

**All other Play data categories (Health, Fitness, Audio, Contacts, Calendar, Web browsing, Files and docs, Installed apps, etc.):** Not collected.

### Section 3: Data sharing

Mark "Shared" only if data leaves first-party servers to a third party.

| Third party                   | What is shared                                    | Why                                                   |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| Sentry (crash reporting SaaS) | Crash logs, diagnostics, device model, OS version | App quality monitoring. PII scrubbed before send.     |
| Firebase Cloud Messaging      | Device push token                                 | Push notification delivery                            |
| Razorpay (payment processor)  | Phone, name, email, payment instrument            | Payment processing for rent/sale brokerage settlement |
| AWS S3 / CloudFront           | Property photos, KYC docs                         | File storage and CDN delivery                         |
| Exotel                        | Phone number → call routing token                 | Masked calling                                        |
| MSG91 / Interakt              | Phone number                                      | OTP delivery + WhatsApp transactional notifications   |
| AWS SES                       | Email address                                     | Transactional email                                   |

For each: "Is data shared with the third party?" → **Yes (with these third parties)** and list purposes per data item.

### Section 4: Security practices

| Question                          | Answer                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Data encrypted in transit         | **Yes**                                                                                                                                          |
| Users can request data deletion   | **Yes** (in-app + grievance page)                                                                                                                |
| Data deletion request method      | In-app: Profile → Delete account. Web: https://rdn-web-one.vercel.app/grievance. Email: _(grievance officer email — see app.json/privacy page)_. |
| Committed to Play Families Policy | **No** (app is 18+)                                                                                                                              |
| Independent security review       | **No** (not yet — flag as future commitment)                                                                                                     |

---

## Content Rating Questionnaire (IARC)

Play Console → App content → Content rating. Apple uses a similar self-rating form.

| Question                                   | Answer                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Category                                   | Utility / Productivity / Communication / Other → **Other**                                                                                   |
| Violence                                   | None                                                                                                                                         |
| Sexuality                                  | None                                                                                                                                         |
| Language                                   | None                                                                                                                                         |
| Controlled substances                      | None                                                                                                                                         |
| Gambling                                   | None                                                                                                                                         |
| Crude humor                                | None                                                                                                                                         |
| Horror                                     | None                                                                                                                                         |
| Mature themes                              | None                                                                                                                                         |
| Discrimination                             | None                                                                                                                                         |
| User-generated content                     | **Yes** — chat messages, property descriptions. Moderation: in-app report (planned), grievance officer review, RWA admin can remove listings |
| Users can interact / share                 | **Yes** — masked chat between buyer/owner/dealer                                                                                             |
| Shares user-provided location              | **No** (city-level only, not precise GPS)                                                                                                    |
| Allows purchase of physical goods/services | **No** (real-estate brokerage is a service but settled externally via Razorpay; no in-app purchase)                                          |
| Allows purchase of digital goods           | **No**                                                                                                                                       |

**Expected rating:** IARC "Everyone" / PEGI 3 / ESRB "Everyone" / Apple 4+.

---

## Pre-submission verification

Before clicking "Submit for review" on either store, re-confirm against current code:

```bash
# What data fields are read into requests?
grep -rn "phone\|email\|name\|address" apps/mobile/src/api/ | head

# What permissions does the app declare?
cat apps/mobile/app.json | grep -A 5 -i "permission\|usage"

# Does Sentry actually scrub PII?
cat apps/mobile/src/lib/sentry.ts

# Where are the third-party network calls?
grep -rn "sentry.io\|firebase\|razorpay\|exotel\|msg91\|amazonaws" apps/mobile/src/ apps/api/src/
```

If any new third-party SDK is added or any new data field is collected, **update this file + resubmit Data Safety + App Privacy.** Apple in particular will reject builds where the declared privacy doesn't match observed network traffic.
