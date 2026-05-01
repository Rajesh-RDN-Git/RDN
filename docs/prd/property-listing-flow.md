# Property Listing Flow (Path B)

**Status:** Deferred — build before UAT
**Created:** 2026-04-26
**Replaces:** `apps/web/src/components/property/create-property-modal.tsx` (Path A — minimal modal, sufficient for dev/staging only)

---

## Why this exists

Path A (the modal shipped today) lets us create properties end-to-end so we can walk every downstream flow — search → enquiry → lead → masked chat → commission. It is **not** a UX a real user should ever see. Owners need a flow they can complete on a phone with photos and confidence; SUPER_ADMINs need to onboard 50+ flats per society without dying.

Before UAT, replace the modal with the dedicated flow described below.

---

## Scope

**Route:** `/dashboard/properties/new` (owned by an OWNER) and `/dashboard/properties/new?society=<id>` (deep-link from SUPER_ADMIN's society page)

**Steps** (multi-step form, sticky bottom CTA on mobile):

1. **Basics**
   - Society — locked + prefilled for OWNER (read from their primary society binding); searchable dropdown for SUPER_ADMIN
   - Flat number, tower/block — typeahead against existing units in that society to prevent duplicates
   - Property type, transaction type
2. **Specs**
   - BHK (hidden for COMMERCIAL)
   - Carpet area, super area, floor / total floors, facing, furnishing
3. **Pricing**
   - Conditional fields driven by transaction type (rent + deposit + maintenance, or sale price, or both)
   - "Negotiable" toggle, "Brokerage" disclosure
4. **Photos**
   - Multi-image upload via S3 presigned URLs (`/media`)
   - Drag to reorder, set cover image, max 15 images, min 3 to publish
   - Client-side downscale before upload, target 1920px longest edge
5. **Amenities & Restrictions**
   - Amenities — multi-select against the society's defined amenity list (society's amenities are the universe)
   - Restrictions — vegetarian only, family only, no pets, bachelors allowed, etc. (society sets defaults; owner can tighten but not loosen)
6. **Review & Publish**
   - Render the listing exactly as a buyer will see it
   - "Save draft" / "Submit for verification" — submitted listings enter the RWA_ADMIN approval queue (society-scoped)

---

## Non-functional

- **Draft autosave** every 5s to localStorage keyed by `userId+societyId+flatNumber`; recover on return; offer "discard draft" CTA.
- **Step validation** — can't advance with errors. Final "Submit" only if all required steps complete.
- **Mobile-first** — single column, sticky bottom CTA, photos step uses native `<input capture>` for direct camera.
- **Verification queue** — `verificationStatus = PENDING` on submit. RWA_ADMIN sees in their queue. Approval moves to `RWA_APPROVED`; surface in `/search` only when approved.
- **Edit flow** — `/dashboard/properties/[id]/edit` reuses the same component; pre-fills, preserves draft autosave, handles partial submission.

---

## Open questions for the PRD review

1. **Owner self-listing vs admin bulk-add.** Same form? Or split — keep this for owners, build a CSV import for SUPER_ADMIN onboarding new societies?
2. **Society creation flow.** Today societies are created via `/societies` API but no UI. RWA_ADMIN needs an onboarding wizard _before_ this flow is useful at scale.
3. **Photo moderation.** Automated NSFW (cheap), or manual RWA_ADMIN review (slow), or both?
4. **Owner-society binding.** A user can theoretically own flats in multiple societies. Schema currently has no `User.primarySocietyId`. Either add it, or always make OWNER pick.
5. **Anti-duplicate.** Schema has unique `(societyId, flatNumber, towerBlock)`. UI should warn before submit if duplicate exists, with a "claim ownership" path (which probably means RWA_ADMIN dispute resolution).

---

## Dependencies

| What                                | Status                                                               |
| ----------------------------------- | -------------------------------------------------------------------- |
| `POST /properties`                  | ✅ exists, used by Path A                                            |
| `GET /societies`                    | ✅ exists                                                            |
| Media presign endpoints             | ✅ `/media` module exists; verify presign + multipart                |
| Verification queue UI for RWA_ADMIN | ❌ not built — separate ticket                                       |
| Image moderation                    | ❌ does not exist — decide build vs Cloudflare Images vs Rekognition |
| `User.primarySocietyId`             | ❌ schema gap                                                        |

---

## Acceptance criteria (when ready to call B done)

- [ ] An OWNER can publish their first listing in <3 minutes on a phone, including 3 photos
- [ ] A SUPER_ADMIN can onboard a 50-flat society's full inventory in <30 minutes (or use bulk import — separate ticket)
- [ ] Submitted listings appear in the originating society's RWA_ADMIN approval queue within 1 second
- [ ] Approved listings appear in `/search` within 5 seconds of approval
- [ ] Drafts survive accidental tab close, browser restart, and 24h inactivity
- [ ] Image upload works on a 3G connection without hanging the form

---

## What Path A does NOT cover (so you know what's missing today)

- Photos
- Amenities multi-select / restrictions
- Mobile-optimised layout (works, but cramped)
- Draft autosave
- Verification queue routing UI
- Owner-society auto-binding
- Duplicate detection beyond DB constraint (errors after submit, not before)
