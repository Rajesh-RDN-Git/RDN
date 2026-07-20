-- Idempotency backstop for lead creation: at most one OPEN lead per (buyer, property).
-- Terminal leads (CLOSED/LOST) are excluded so a buyer can enquire again after one closes.

-- 1. Collapse any pre-existing duplicate OPEN leads: keep the earliest per (buyer, property),
--    mark the rest LOST. Required before the unique index or its creation would fail.
UPDATE "leads" l
SET "status" = 'LOST'
WHERE l."status" NOT IN ('CLOSED', 'LOST')
  AND l."buyer_id" IS NOT NULL
  AND l."property_id" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "leads" e
    WHERE e."buyer_id" = l."buyer_id"
      AND e."property_id" = l."property_id"
      AND e."status" NOT IN ('CLOSED', 'LOST')
      AND (e."created_at" < l."created_at"
           OR (e."created_at" = l."created_at" AND e."id" < l."id"))
  );

-- 2. Enforce it going forward: partial unique index over open leads only.
CREATE UNIQUE INDEX "leads_open_buyer_property_key"
ON "leads" ("buyer_id", "property_id")
WHERE "status" NOT IN ('CLOSED', 'LOST')
  AND "buyer_id" IS NOT NULL
  AND "property_id" IS NOT NULL;
