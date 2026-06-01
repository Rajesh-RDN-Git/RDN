# Store Listings — Copy-Paste Ready

Drop-in copy for App Store Connect + Google Play Console. Numbers in `()` are character limits enforced by each store.

---

## Apple — App Store Connect

### App Information

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| App name (30)      | `RDN — Society Real Estate`                                       |
| Subtitle (30)      | `Society-verified rentals`                                        |
| Bundle ID          | `com.rdn.mobile`                                                  |
| SKU                | `rdn-mobile-001`                                                  |
| Primary language   | English (India)                                                   |
| Primary category   | Lifestyle                                                         |
| Secondary category | House & Home                                                      |
| Content rights     | "Does not contain, show, or access third-party content" → **Yes** |

### Pricing & Availability

| Field        | Value                       |
| ------------ | --------------------------- |
| Price        | Free                        |
| Availability | India only (initial launch) |
| Pre-order    | No                          |

### Promotional Text (170, updateable without re-review)

```
List, search, and rent or buy homes within your housing society. RWA-verified listings, masked calling, zero broker fees. India-only.
```

### Description (4000)

```
RDN — Residential Dealer Network

The community-owned real estate platform for residential societies in India.

RDN lets owners, tenants, and buyers within a housing society connect directly — without paying external brokers. Every listing is verified by your society's RWA (Resident Welfare Association). Every dealer is a community-approved resident. Every conversation is masked for your privacy.

WHAT YOU CAN DO

For Owners
• List your flat for rent or sale in minutes with our 6-step guided wizard
• Upload photos and documents securely
• Approve visits from verified buyers and tenants
• Track inquiries and active leads in one place
• Masked calls and chat — your phone number stays private

For Buyers and Tenants
• Browse RWA-verified listings inside your society or nearby societies
• Filter by BHK, budget, furnishing, floor, facing, and amenities
• Save favourites, schedule visits, and chat with the owner or a resident dealer
• No external brokers, no inflated prices, no fake listings

For Resident Dealers
• Get RWA-approved status and earn commission on closed deals
• Receive assigned leads with full property context
• Manage your pipeline, masked chats, and commission ledger
• Build your reputation within your community

For Society Admins (RWA)
• Approve listings and dealer applications inside your society
• See pipeline analytics, dealer performance, and grievances
• Maintain your society's integrity end-to-end

WHY RDN

✓ RWA-verified — every property and dealer is approved by your society
✓ Resident-first — dealers are vetted members of your community
✓ Phone privacy — masked calling routes through our number, never yours
✓ Zero brokerage — no external broker fees, ever
✓ Transparent — see inquiry history, dealer status, and commission upfront
✓ DPDP-compliant — Indian data protection law from day one. Export, edit, or delete your data anytime

PRIVACY & SECURITY

• Phone OTP login — no passwords to remember or leak
• Encrypted at rest — sensitive details (KYC, bank, ID) protected
• Granular consent — pause marketing, analytics, or WhatsApp updates anytime
• One-tap data export — full account JSON delivered to your phone
• One-tap account deletion — DPDP Section 11(c) right to erasure
• Grievance Officer reachable from inside the app — DPDP Section 13

WHO IT'S FOR

RDN is built for residents of India's gated communities, apartment complexes, and registered housing societies. Onboarding requires your society to be enrolled on RDN. Ask your RWA to register at rdn-web-one.vercel.app — onboarding is free.

GET STARTED

1. Install RDN
2. Sign up with your phone — one-tap OTP
3. Pick your society from the verified list
4. Start browsing or list your first property

Support: rdn-web-one.vercel.app/grievance
Privacy: rdn-web-one.vercel.app/privacy
Terms: rdn-web-one.vercel.app/terms
```

### Keywords (100, comma-separated, no spaces around commas)

```
real estate,rent,buy,society,RWA,India,broker free,housing,flat,apartment,rental,community,dealer,owner
```

### Support / Marketing URLs

| Field              | URL                                      |
| ------------------ | ---------------------------------------- |
| Support URL        | https://rdn-web-one.vercel.app/grievance |
| Marketing URL      | https://rdn-web-one.vercel.app           |
| Privacy Policy URL | https://rdn-web-one.vercel.app/privacy   |
| EULA               | Standard Apple EULA                      |

### Age Rating

| Question                              | Answer                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Cartoon or Fantasy Violence           | None                                                                     |
| Realistic Violence                    | None                                                                     |
| Prolonged Graphic / Sadistic Violence | None                                                                     |
| Profanity / Crude Humor               | None                                                                     |
| Mature/Suggestive Themes              | None                                                                     |
| Horror/Fear Themes                    | None                                                                     |
| Medical/Treatment Info                | None                                                                     |
| Alcohol, Tobacco, Drugs               | None                                                                     |
| Simulated Gambling                    | None                                                                     |
| Sexual Content / Nudity               | None                                                                     |
| Contests                              | None                                                                     |
| Unrestricted Web Access               | No                                                                       |
| User-Generated Content                | **Yes** (property listings, chat messages) — must enable moderation flow |

**Resulting rating:** 4+

### What's New in This Version (4000)

```
First public release.

• Browse RWA-verified listings inside your society
• 6-step property listing wizard for owners
• Masked calling and chat — phone numbers stay private
• Push notifications for new inquiries, leads, and chat messages
• Full DPDP compliance — consent management, data export, account deletion
• In-app grievance filing
```

### Review Notes / App Access (for App Review)

```
Test login for App Review:
Phone: +919999900001 (Super Admin)
OTP: 123456 (dev bypass — accepts any 6-digit OTP)

Note: Production OTP via MSG91. Dev bypass is active on the UAT API
(api-uat-10d1.up.railway.app) which this build points to. Real OTP
will be enabled when the production API and prod build go live.

Test flow:
1. Open app → enter phone above → submit any 6-digit OTP
2. Lands on Dashboard
3. Tap "Search" → browse 5 seeded properties across 2 societies
4. Tap any property → property detail → tap "Enquire" or "Save"
5. Tap "Profile" → test "Manage consent", "Export my data",
   "Delete account", "File a grievance"

Demo personas (same OTP `123456`):
• +919999900001 — SUPER_ADMIN
• +919999900002 — RWA Admin (Green Valley)
• +919999900010 — Owner (Green Valley)
• +919999900020 — Dealer (Green Valley)
```

---

## Google — Play Console

### Store Listing

| Field                   | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| App name (30)           | `RDN — Society Real Estate`                                                    |
| Short description (80)  | `List, search & rent homes inside your society. RWA-verified. Zero brokerage.` |
| Full description (4000) | _(same as Apple Description above)_                                            |
| App category            | House & Home                                                                   |
| Tags                    | Real estate, Rentals, India, Society, Apartment                                |
| Email                   | _(your support email)_                                                         |
| Phone (optional)        | _(your support phone)_                                                         |
| Website                 | https://rdn-web-one.vercel.app                                                 |
| Privacy Policy          | https://rdn-web-one.vercel.app/privacy                                         |

### Graphic Assets — required dimensions

| Asset             | Dimensions             | Notes                           |
| ----------------- | ---------------------- | ------------------------------- |
| App icon          | 512×512 PNG            | Brand `#2563eb`                 |
| Feature graphic   | 1024×500 PNG/JPG       | Hero shot for Play Store header |
| Phone screenshots | 1080×1920 or 1080×2340 | 2–8, ideally 5                  |
| 7" tablet         | 1200×1920              | 1–8                             |
| 10" tablet        | 1600×2560              | 1–8                             |
| Video (optional)  | YouTube URL            | Not required                    |

### App Content

| Section                  | Answer                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy Policy URL       | https://rdn-web-one.vercel.app/privacy                                                                                                                                              |
| Ads                      | **No** ads                                                                                                                                                                          |
| App access               | Provide test login `+919999900001` / OTP `123456`. Set "All functionality is available without restrictions" → No → "All or some functionality is restricted" → provide credentials |
| Content rating           | See questionnaire answers in `docs/store-privacy-answers.md`                                                                                                                        |
| Target audience          | 18+                                                                                                                                                                                 |
| News apps                | No                                                                                                                                                                                  |
| COVID-19 contact tracing | No                                                                                                                                                                                  |
| Data safety              | See `docs/store-privacy-answers.md`                                                                                                                                                 |
| Government apps          | No                                                                                                                                                                                  |
| Financial features       | Yes → Pay-per-transaction (Razorpay rent/sale brokerage settlements)                                                                                                                |

### Production Release Notes

```
First public release of RDN — community real estate inside your society.

• RWA-verified listings inside your housing society
• 6-step property wizard for owners
• Masked calling — your phone number stays private
• Push notifications for inquiries and chat
• DPDP-compliant: manage consent, export data, delete account from inside the app
• File a grievance with our Data Protection Officer in-app
```

---

## Source-of-truth metadata in repo

These same values flow into:

- `apps/mobile/app.json` → `name`, `description`, `version`, bundle/package IDs
- `apps/mobile/eas.json` → `submit.production.ios.ascAppId` (fill after creating App Store record)
- Apple Connect: app name + bundle ID must match `apps/mobile/app.json`

## Pre-submission checks

- [ ] Promotional text inserted in App Store Connect (170-char max)
- [ ] Description copy reviewed by legal (no claims like "guaranteed", "official", etc.)
- [ ] Demo login credentials handed over to Apple App Review notes
- [ ] Same demo login works on the build pointed to by `EXPO_PUBLIC_API_URL` in `eas.json` `production`
- [ ] All URLs in metadata resolve (manually open each one)
- [ ] Screenshots captured at all required sizes (see `docs/mobile-phase4-submission.md` §3)
- [ ] Feature graphic generated (Android only, 1024×500)
- [ ] Apple App Privacy + Play Data Safety filled per `docs/store-privacy-answers.md`
