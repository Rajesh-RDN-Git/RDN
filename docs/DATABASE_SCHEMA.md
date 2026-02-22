# RDN — Database Schema

> **Version:** 1.0
> **Last Updated:** 2026-02-22
> **Database:** PostgreSQL (AWS RDS) with Prisma ORM
>
> Related Documents:
> - [PRD](./PRD.md)
> - [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
> - [Project Structure](./PROJECT_STRUCTURE.md)

---

## Schema Conventions

- **Primary keys:** UUID v4 for all tables (`id` field)
- **Timestamps:** All tables include `created_at` and `updated_at` (auto-managed by Prisma)
- **Soft deletes:** Critical entities use `status` field (not hard deletes) to preserve audit trail
- **Encryption:** Sensitive fields (phone, KYC, bank details) encrypted at application level (AES-256-GCM) before storage
- **Enums:** Stored as PostgreSQL enums for type safety
- **JSONB:** Used for flexible/dynamic fields (amenities, restrictions, metadata)
- **Indexes:** GIN indexes on JSONB fields, B-tree on foreign keys and frequently queried columns, GiST/PostGIS for geo queries
- **Naming:** snake_case for all columns and tables

---

## Entity Relationship Overview

```
USERS ─────────┬──────── SOCIETIES (rwa_admin_id)
               │
               ├──────── DEALERS (user_id) ──── SOCIETIES (society_id)
               │
               ├──────── PROPERTIES (owner_id) ──── SOCIETIES (society_id)
               │                                     DEALERS (assigned_dealer_id)
               │
               ├──────── LEADS (buyer_id) ──── PROPERTIES, DEALERS, SOCIETIES
               │
               ├──────── TRANSACTIONS (via lead_id) ──── LEADS, PROPERTIES
               │
               ├──────── COMMISSIONS (via dealer_id) ──── DEALERS, TRANSACTIONS
               │
               ├──────── MESSAGES (sender_id, receiver_id) ──── CONVERSATIONS
               │
               ├──────── GRIEVANCES (filed_by, against_user_id, assigned_to)
               │
               ├──────── REFERRALS (referrer_id, referred_id)
               │
               ├──────── NOTIFICATIONS (user_id)
               │
               └──────── AUDIT_LOG (user_id)

PROPERTIES ──── PROPERTY_MEDIA (property_id)
LEADS ──── CONVERSATIONS (lead_id)
```

---

## Tables

### 1. USERS

The central user table for all roles on the platform.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default uuid_generate_v4() | Unique user identifier |
| `phone` | VARCHAR(255) | UNIQUE, NOT NULL, encrypted | Phone number (encrypted at app level) |
| `email` | VARCHAR(255) | UNIQUE, nullable | Optional email address |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `role` | ENUM | NOT NULL | `SUPER_ADMIN`, `RWA_ADMIN`, `DEALER`, `OWNER`, `BUYER_TENANT` |
| `status` | ENUM | NOT NULL, default `ACTIVE` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION` |
| `avatar_url` | VARCHAR(512) | nullable | S3 URL for profile photo |
| `created_at` | TIMESTAMP | NOT NULL, default now() | Record creation time |
| `updated_at` | TIMESTAMP | NOT NULL, auto-updated | Last modification time |

**Indexes:**
- `UNIQUE(phone)`
- `UNIQUE(email)` (where not null)
- `INDEX(role)`
- `INDEX(status)`

---

### 2. SOCIETIES

Represents an RWA-managed residential society.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique society identifier |
| `name` | VARCHAR(255) | NOT NULL | Society name |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | SEO-friendly URL slug |
| `address` | TEXT | NOT NULL | Full address |
| `city` | VARCHAR(100) | NOT NULL | City name |
| `state` | VARCHAR(100) | NOT NULL | State name |
| `pincode` | VARCHAR(10) | NOT NULL | PIN code |
| `lat` | DECIMAL(10,8) | nullable | Latitude (PostGIS point) |
| `lng` | DECIMAL(11,8) | nullable | Longitude (PostGIS point) |
| `total_units` | INTEGER | nullable | Total residential units |
| `amenities` | JSONB | default '[]' | Array of amenity objects |
| `rwa_admin_id` | UUID | FK → USERS, nullable | Primary RWA admin |
| `verification_status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `VERIFIED`, `FLAGGED`, `REJECTED` |
| `mandate_start_date` | DATE | nullable | Mandate agreement start |
| `mandate_end_date` | DATE | nullable | Mandate agreement end (3-year lock-in) |
| `status` | ENUM | NOT NULL, default `IN_PROGRESS` | `ONBOARDED`, `IN_PROGRESS`, `INACTIVE` |
| `meta` | JSONB | default '{}' | Photos, description, connectivity info |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |
| `updated_at` | TIMESTAMP | NOT NULL, auto-updated | |

**Indexes:**
- `UNIQUE(slug)`
- `INDEX(city)`
- `INDEX(state)`
- `INDEX(pincode)`
- `INDEX(verification_status)`
- `INDEX(status)`
- `GiST INDEX(lat, lng)` — for geo-based queries

---

### 3. DEALERS

Resident dealers within a society. Links a user to a society with KYC and approval status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique dealer record |
| `user_id` | UUID | FK → USERS, NOT NULL | The user who is a dealer |
| `society_id` | UUID | FK → SOCIETIES, NOT NULL | Society they deal in |
| `kyc_status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `APPROVED`, `REJECTED` |
| `rwa_approval_status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `APPROVED`, `REJECTED` |
| `training_status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `COMPLETED` |
| `is_active` | BOOLEAN | NOT NULL, default false | Active only after full approval + training |
| `bank_account_details` | JSONB | nullable, encrypted | Bank info for commission payouts |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |
| `updated_at` | TIMESTAMP | NOT NULL, auto-updated | |

**Indexes:**
- `UNIQUE(user_id, society_id)` — one dealer record per user per society
- `INDEX(society_id)`
- `INDEX(is_active)`
- `INDEX(kyc_status)`

**Activation Rule:** `is_active = true` only when `kyc_status = APPROVED AND rwa_approval_status = APPROVED AND training_status = COMPLETED`

---

### 4. PROPERTIES

Property listings (rent, sale, or both).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique property identifier |
| `society_id` | UUID | FK → SOCIETIES, NOT NULL | Society this property belongs to |
| `owner_id` | UUID | FK → USERS, NOT NULL | Property owner |
| `assigned_dealer_id` | UUID | FK → DEALERS, nullable | Dealer handling this property |
| `flat_number` | VARCHAR(50) | NOT NULL | Flat/unit number |
| `tower_block` | VARCHAR(100) | NOT NULL | Tower or block name |
| `type` | ENUM | NOT NULL | `APARTMENT`, `COMMERCIAL`, `VILLA` |
| `transaction_type` | ENUM | NOT NULL | `RENT`, `SALE`, `BOTH` |
| `bhk` | SMALLINT | nullable | Number of bedrooms |
| `carpet_area` | DECIMAL(10,2) | nullable | Carpet area in sqft |
| `super_area` | DECIMAL(10,2) | nullable | Super built-up area in sqft |
| `floor` | SMALLINT | nullable | Floor number |
| `total_floors` | SMALLINT | nullable | Total floors in building |
| `facing` | VARCHAR(20) | nullable | Direction facing (N, S, E, W, etc.) |
| `furnishing` | ENUM | nullable | `FURNISHED`, `SEMI`, `UNFURNISHED` |
| `price_rent` | DECIMAL(12,2) | nullable | Monthly rent amount |
| `price_sale` | DECIMAL(14,2) | nullable | Sale price |
| `security_deposit` | DECIMAL(12,2) | nullable | Security deposit amount |
| `availability_status` | ENUM | NOT NULL, default `AVAILABLE_NOW` | `AVAILABLE_NOW`, `AVAILABLE_FROM`, `UNDER_NOTICE`, `OCCUPIED`, `SOLD` |
| `available_from` | DATE | nullable | Date property becomes available |
| `verification_status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `RWA_APPROVED`, `VERIFIED`, `FLAGGED`, `REJECTED` |
| `restrictions` | JSONB | default '{}' | Family/bachelor, pets, veg/non-veg preferences |
| `amenities` | JSONB | default '{}' | Parking, power backup, lift, etc. |
| `status` | ENUM | NOT NULL, default `ACTIVE` | `ACTIVE`, `DELISTED`, `CLOSED` |
| `views_count` | INTEGER | NOT NULL, default 0 | Number of views |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |
| `updated_at` | TIMESTAMP | NOT NULL, auto-updated | |

**Indexes:**
- `UNIQUE(society_id, flat_number, tower_block)` — prevents duplicate listings
- `INDEX(society_id)`
- `INDEX(owner_id)`
- `INDEX(assigned_dealer_id)`
- `INDEX(transaction_type)`
- `INDEX(bhk)`
- `INDEX(price_rent)`
- `INDEX(price_sale)`
- `INDEX(availability_status)`
- `INDEX(verification_status)`
- `INDEX(status)`
- `GIN INDEX(restrictions)` — for JSONB filter queries
- `GIN INDEX(amenities)` — for JSONB filter queries
- Full-text search index on `flat_number, tower_block` combined with society name

---

### 5. PROPERTY_MEDIA

Photos and videos associated with property listings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique media identifier |
| `property_id` | UUID | FK → PROPERTIES, NOT NULL, ON DELETE CASCADE | Parent property |
| `url` | VARCHAR(512) | NOT NULL | S3 path / CloudFront URL |
| `type` | ENUM | NOT NULL | `PHOTO`, `VIDEO` |
| `order` | SMALLINT | NOT NULL, default 0 | Display order |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Indexes:**
- `INDEX(property_id)`

---

### 6. LEADS

Tracks buyer/tenant interest in a property through the full lifecycle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique lead identifier |
| `property_id` | UUID | FK → PROPERTIES, NOT NULL | Property of interest |
| `buyer_id` | UUID | FK → USERS, NOT NULL | Buyer/tenant who enquired |
| `dealer_id` | UUID | FK → DEALERS, NOT NULL | Assigned dealer |
| `society_id` | UUID | FK → SOCIETIES, NOT NULL | Society (denormalized for query performance) |
| `source` | ENUM | NOT NULL | `APP_SEARCH`, `REFERRAL`, `WHATSAPP`, `WALK_IN` |
| `status` | ENUM | NOT NULL, default `NEW` | `NEW`, `CONTACTED`, `VISIT_SCHEDULED`, `VISITED`, `NEGOTIATING`, `CLOSING`, `CLOSED`, `LOST` |
| `visit_date` | TIMESTAMP | nullable | Scheduled visit date/time |
| `visit_approved_by_owner` | BOOLEAN | default false | Owner has approved the visit |
| `notes` | JSONB | default '[]' | Timeline of interactions |
| `auto_reassigned` | BOOLEAN | default false | Whether this lead was auto-reassigned |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |
| `updated_at` | TIMESTAMP | NOT NULL, auto-updated | |

**Indexes:**
- `INDEX(property_id)`
- `INDEX(buyer_id)`
- `INDEX(dealer_id)`
- `INDEX(society_id)`
- `INDEX(status)`
- `INDEX(source)`
- `INDEX(created_at)` — for date range queries

---

### 7. TRANSACTIONS

Completed/closed deals (rent, sale, or renewal).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique transaction identifier |
| `lead_id` | UUID | FK → LEADS, NOT NULL | Source lead |
| `property_id` | UUID | FK → PROPERTIES, NOT NULL | Property transacted |
| `type` | ENUM | NOT NULL | `RENT`, `SALE`, `RENEWAL` |
| `deal_value` | DECIMAL(14,2) | NOT NULL | Total deal value |
| `buyer_commission` | DECIMAL(12,2) | NOT NULL | Commission from buyer/tenant |
| `seller_commission` | DECIMAL(12,2) | NOT NULL | Commission from seller/owner |
| `gst_amount` | DECIMAL(10,2) | NOT NULL | GST extracted from commission |
| `rdn_share` | DECIMAL(12,2) | nullable | RDN's share (TBD split) |
| `dealer_share` | DECIMAL(12,2) | nullable | Dealer's share (TBD split) |
| `rwa_share` | DECIMAL(12,2) | nullable | RWA's share (TBD split) |
| `payment_status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `PARTIAL`, `PAID`, `OVERDUE` |
| `invoice_urls` | JSONB | default '{}' | Buyer invoice URL, seller invoice URL |
| `closed_at` | TIMESTAMP | NOT NULL | When the deal was closed |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |
| `updated_at` | TIMESTAMP | NOT NULL, auto-updated | |

**Indexes:**
- `INDEX(lead_id)`
- `INDEX(property_id)`
- `INDEX(type)`
- `INDEX(payment_status)`
- `INDEX(closed_at)` — for reporting date ranges

**Note:** `rdn_share`, `dealer_share`, and `rwa_share` are nullable until the commission split is decided. See [Open Items](./OPEN_ITEMS.md).

---

### 8. COMMISSIONS

Per-dealer commission records tied to transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique commission record |
| `dealer_id` | UUID | FK → DEALERS, NOT NULL | Dealer earning the commission |
| `transaction_id` | UUID | FK → TRANSACTIONS, NOT NULL | Related transaction |
| `amount` | DECIMAL(12,2) | NOT NULL | Commission amount |
| `gst` | DECIMAL(10,2) | NOT NULL | GST on commission |
| `status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `SETTLED`, `CANCELLED` |
| `settlement_date` | DATE | nullable | When commission was settled |
| `payout_reference` | VARCHAR(255) | nullable | Bank transfer / payment reference |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Indexes:**
- `INDEX(dealer_id)`
- `INDEX(transaction_id)`
- `INDEX(status)`
- `INDEX(settlement_date)` — for monthly settlement queries

---

### 9. MESSAGES

Individual chat messages between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique message identifier |
| `conversation_id` | UUID | FK → CONVERSATIONS, NOT NULL | Parent conversation |
| `sender_id` | UUID | FK → USERS, NOT NULL | Message sender |
| `receiver_id` | UUID | FK → USERS, NOT NULL | Message receiver |
| `content` | TEXT | NOT NULL, encrypted | Message content (encrypted at app level) |
| `type` | ENUM | NOT NULL, default `TEXT` | `TEXT`, `IMAGE`, `SYSTEM` |
| `read_at` | TIMESTAMP | nullable | When receiver read the message |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Indexes:**
- `INDEX(conversation_id)`
- `INDEX(sender_id)`
- `INDEX(receiver_id)`
- `INDEX(created_at)` — for message pagination

---

### 10. CONVERSATIONS

Chat conversation threads, typically linked to a lead.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique conversation identifier |
| `lead_id` | UUID | FK → LEADS, nullable | Associated lead (if any) |
| `participants` | JSONB | NOT NULL | Array of user IDs in the conversation |
| `last_message_at` | TIMESTAMP | nullable | Timestamp of most recent message |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Indexes:**
- `INDEX(lead_id)`
- `INDEX(last_message_at)` — for sorting conversations by recency
- `GIN INDEX(participants)` — for querying conversations by participant

---

### 11. GRIEVANCES

Support tickets and complaints filed by any user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique grievance identifier |
| `filed_by` | UUID | FK → USERS, NOT NULL | User who filed |
| `against_user_id` | UUID | FK → USERS, nullable | User the complaint is against |
| `society_id` | UUID | FK → SOCIETIES, nullable | Related society |
| `transaction_id` | UUID | FK → TRANSACTIONS, nullable | Related transaction |
| `category` | ENUM | NOT NULL | `DEALER_CONDUCT`, `PROPERTY_MISMATCH`, `COMMISSION`, `SERVICE`, `SAFETY`, `OTHER` |
| `severity` | ENUM | NOT NULL | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `description` | TEXT | NOT NULL | Issue description |
| `evidence_urls` | JSONB | default '[]' | Array of S3 URLs (photos, documents) |
| `status` | ENUM | NOT NULL, default `OPEN` | `OPEN`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED` |
| `escalation_level` | SMALLINT | NOT NULL, default 1 | 1 (Dealer), 2 (RWA), 3 (RDN), 4 (Legal) |
| `assigned_to` | UUID | FK → USERS, nullable | Handler assigned to resolve |
| `sla_deadline` | TIMESTAMP | NOT NULL | SLA resolution deadline |
| `resolution_notes` | TEXT | nullable | How it was resolved |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |
| `updated_at` | TIMESTAMP | NOT NULL, auto-updated | |
| `resolved_at` | TIMESTAMP | nullable | When resolution was reached |

**Indexes:**
- `INDEX(filed_by)`
- `INDEX(against_user_id)`
- `INDEX(society_id)`
- `INDEX(status)`
- `INDEX(severity)`
- `INDEX(escalation_level)`
- `INDEX(assigned_to)`
- `INDEX(sla_deadline)` — for SLA monitoring queries

**SLA Calculation Rules:**
| Severity | Response Time | Resolution Target |
|----------|--------------|-------------------|
| CRITICAL | 4 hours | 24 hours |
| HIGH | 12 hours | 72 hours |
| MEDIUM | 24 hours | 5 business days |
| LOW | 48 hours | 10 business days |

---

### 12. REFERRALS

Referral tracking for user acquisition and commission bonuses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique referral record |
| `referrer_id` | UUID | FK → USERS, NOT NULL | User who referred |
| `referred_id` | UUID | FK → USERS, nullable | Referred user (null until signup) |
| `referral_code` | VARCHAR(20) | UNIQUE, NOT NULL | Unique referral code |
| `status` | ENUM | NOT NULL, default `PENDING` | `PENDING`, `SIGNED_UP`, `TRANSACTED`, `REWARDED` |
| `reward_amount` | DECIMAL(10,2) | nullable | Reward amount (5% of commission) |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Indexes:**
- `UNIQUE(referral_code)`
- `INDEX(referrer_id)`
- `INDEX(referred_id)`
- `INDEX(status)`

---

### 13. NOTIFICATIONS

All notifications sent to users across all channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique notification identifier |
| `user_id` | UUID | FK → USERS, NOT NULL | Recipient |
| `type` | ENUM | NOT NULL | `LEAD`, `VISIT`, `DEAL`, `COMMISSION`, `GRIEVANCE`, `SYSTEM` |
| `title` | VARCHAR(255) | NOT NULL | Notification title |
| `body` | TEXT | NOT NULL | Notification body |
| `data` | JSONB | default '{}' | Deep link info, entity references |
| `channel` | ENUM | NOT NULL | `IN_APP`, `PUSH`, `WHATSAPP`, `EMAIL` |
| `read_at` | TIMESTAMP | nullable | When user read the notification |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Indexes:**
- `INDEX(user_id)`
- `INDEX(type)`
- `INDEX(channel)`
- `INDEX(read_at)` — for unread count queries
- `INDEX(created_at)` — for pagination

---

### 14. AUDIT_LOG

Immutable audit trail for all write operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique audit entry |
| `user_id` | UUID | FK → USERS, NOT NULL | User who performed the action |
| `action` | VARCHAR(100) | NOT NULL | Action description (e.g., `property.create`, `lead.update`) |
| `entity_type` | VARCHAR(50) | NOT NULL | Entity type (e.g., `property`, `lead`, `dealer`) |
| `entity_id` | UUID | NOT NULL | ID of the entity affected |
| `changes` | JSONB | default '{}' | Before/after state diff |
| `ip_address` | VARCHAR(45) | nullable | Client IP address |
| `created_at` | TIMESTAMP | NOT NULL, default now() | |

**Indexes:**
- `INDEX(user_id)`
- `INDEX(entity_type, entity_id)` — for looking up history of a specific entity
- `INDEX(action)`
- `INDEX(created_at)` — for time-based queries

**Note:** This table is append-only. No updates or deletes allowed. Consider partitioning by `created_at` for long-term performance.

---

## Migration Strategy

1. Schema managed via **Prisma Migrate** — version-controlled migration files
2. Migrations run automatically in CI/CD pipeline before deployment
3. Seed data (`prisma/seed.ts`) includes:
   - Default super admin user
   - Enum values
   - Sample data for development environment
4. **Zero-downtime migrations** — use expand/contract pattern for breaking changes:
   - Add new column (nullable) → deploy code that writes to both → backfill → deploy code that reads from new → drop old column

## Data Retention

| Data Type | Retention |
|-----------|-----------|
| Active user data | Indefinite (while account active) |
| Deleted user data | 90 days post-deletion request, then purged |
| Chat messages | 2 years |
| Call logs | 1 year |
| Audit logs | 5 years (compliance) |
| KYC documents | Duration of account + 1 year |
| Transaction records | 7 years (GST compliance) |
| Grievance records | 3 years post-resolution |
