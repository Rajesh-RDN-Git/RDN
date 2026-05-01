-- Idempotent test-data top-up for E2E role testing.
-- Adds: 2nd RWA_ADMIN, 2nd OWNER, 1 active dealer in Sunrise Towers, 1 PENDING dealer in Green Valley, 1 PENDING dealer in Sunrise Towers.
-- Safe to re-run (uses ON CONFLICT DO NOTHING on phone-unique users).

BEGIN;

-- 2nd RWA_ADMIN — for Sunrise Towers
INSERT INTO users (id, phone, name, email, role, status, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000010',
  '+919999900006', 'Sunrise RWA Admin', 'rwa.sunrise@rdn.dev', 'RWA_ADMIN', 'ACTIVE', NOW(), NOW()
) ON CONFLICT (phone) DO NOTHING;

-- 2nd OWNER — owns flats in Sunrise
INSERT INTO users (id, phone, name, email, role, status, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000011',
  '+919999900007', 'Sunrise Owner', 'owner.sunrise@rdn.dev', 'OWNER', 'ACTIVE', NOW(), NOW()
) ON CONFLICT (phone) DO NOTHING;

-- Dealer user (will be active in Sunrise)
INSERT INTO users (id, phone, name, email, role, status, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000012',
  '+919999900008', 'Sunrise Dealer', 'dealer.sunrise@rdn.dev', 'DEALER', 'ACTIVE', NOW(), NOW()
) ON CONFLICT (phone) DO NOTHING;

-- Pending dealer applicant (Green Valley) — for testing approve/reject
INSERT INTO users (id, phone, name, email, role, status, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000013',
  '+919999900009', 'Pending Dealer GV', 'pending.gv@rdn.dev', 'DEALER', 'ACTIVE', NOW(), NOW()
) ON CONFLICT (phone) DO NOTHING;

-- Assign the 2nd RWA admin to Sunrise Towers
UPDATE societies
SET rwa_admin_id = '00000000-0000-4000-8000-000000000010', updated_at = NOW()
WHERE slug = 'sunrise-towers' AND rwa_admin_id IS NULL;

-- Active dealer record in Sunrise Towers (so leads on Sunrise properties have somewhere to go)
INSERT INTO dealers (id, user_id, society_id, kyc_status, rwa_approval_status, training_status, is_active, created_at, updated_at)
SELECT
  '00000000-0000-4000-8000-000000000020',
  '00000000-0000-4000-8000-000000000012',
  s.id,
  'KYC_APPROVED'::"KYCStatus",
  'APPR_APPROVED'::"ApprovalStatus",
  'COMPLETED'::"TrainingStatus",
  true,
  NOW(), NOW()
FROM societies s WHERE s.slug = 'sunrise-towers'
ON CONFLICT (user_id, society_id) DO NOTHING;

-- Pending dealer in Green Valley (needs RWA approval)
INSERT INTO dealers (id, user_id, society_id, kyc_status, rwa_approval_status, training_status, is_active, created_at, updated_at)
SELECT
  '00000000-0000-4000-8000-000000000021',
  '00000000-0000-4000-8000-000000000013',
  s.id,
  'KYC_PENDING'::"KYCStatus",
  'APPR_PENDING'::"ApprovalStatus",
  'TRAIN_PENDING'::"TrainingStatus",
  false,
  NOW(), NOW()
FROM societies s WHERE s.slug = 'green-valley-apartments'
ON CONFLICT (user_id, society_id) DO NOTHING;

COMMIT;

-- Sanity
SELECT role, count(*) FROM users GROUP BY role ORDER BY role;
SELECT s.name, count(d.id) AS dealer_count, sum(case when d.is_active then 1 else 0 end) AS active_dealers
FROM societies s LEFT JOIN dealers d ON d.society_id = s.id GROUP BY s.name;
