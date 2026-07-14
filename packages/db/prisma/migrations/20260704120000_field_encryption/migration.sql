-- Field-level encryption for DPDP-sensitive PII.
-- phone/nominee/contact/bank columns now hold AES-256-GCM ciphertext; phone_hash is the
-- HMAC blind index used for equality lookups (login). phone uniqueness moves to phone_hash.

-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "dealers" ALTER COLUMN "bank_account_details" SET DATA TYPE TEXT USING "bank_account_details"::text;

-- AlterTable
ALTER TABLE "dpdp_grievances" ALTER COLUMN "contact" SET DATA TYPE VARCHAR(512);

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "contact_name" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "contact_phone" SET DATA TYPE VARCHAR(512);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_hash" VARCHAR(64),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "nominee_name" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "nominee_phone" SET DATA TYPE VARCHAR(512);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_hash_key" ON "users"("phone_hash");
