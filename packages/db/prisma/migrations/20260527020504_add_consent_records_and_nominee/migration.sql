-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('CORE_SERVICE', 'MARKETING', 'ANALYTICS', 'THIRD_PARTY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "nominee_name" VARCHAR(255),
ADD COLUMN     "nominee_phone" VARCHAR(255);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "policy_version" VARCHAR(16) NOT NULL,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_records_user_id_idx" ON "consent_records"("user_id");

-- CreateIndex
CREATE INDEX "consent_records_user_id_purpose_idx" ON "consent_records"("user_id", "purpose");

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
