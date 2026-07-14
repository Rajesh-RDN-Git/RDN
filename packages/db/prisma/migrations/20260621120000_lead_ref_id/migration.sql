-- CreateTable: generic atomic counter (used for lead reference sequences)
CREATE TABLE "counters" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "counters_pkey" PRIMARY KEY ("key")
);

-- AlterTable: add human-readable lead reference id
ALTER TABLE "leads" ADD COLUMN "ref_id" VARCHAR(16);

-- Backfill existing leads with B-/R- reference ids. Prefix R for rent-intent
-- (property transaction_type = RENT), B for buy/sale (SALE or BOTH). Numbered
-- per prefix in creation order, zero-padded to 4 digits.
WITH numbered AS (
    SELECT
        l.id,
        CASE WHEN p.transaction_type = 'RENT' THEN 'R' ELSE 'B' END AS prefix,
        ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN p.transaction_type = 'RENT' THEN 'R' ELSE 'B' END
            ORDER BY l.created_at, l.id
        ) AS seq
    FROM "leads" l
    JOIN "properties" p ON p.id = l.property_id
)
UPDATE "leads"
SET "ref_id" = numbered.prefix || '-' || LPAD(numbered.seq::text, 4, '0')
FROM numbered
WHERE "leads".id = numbered.id;

-- Seed the counters to the current max per prefix so newly created leads continue
-- the sequence (count per prefix == highest seq assigned above).
INSERT INTO "counters" ("key", "value")
SELECT 'lead_' || t.prefix, COUNT(*)
FROM (
    SELECT CASE WHEN p.transaction_type = 'RENT' THEN 'R' ELSE 'B' END AS prefix
    FROM "leads" l
    JOIN "properties" p ON p.id = l.property_id
) t
GROUP BY t.prefix
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value";

-- CreateIndex: unique reference id
CREATE UNIQUE INDEX "leads_ref_id_key" ON "leads"("ref_id");
