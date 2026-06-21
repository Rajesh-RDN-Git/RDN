-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadSource" ADD VALUE 'CALLBACK';
ALTER TYPE "LeadSource" ADD VALUE 'MANUAL';

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_property_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_society_id_fkey";

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "contact_name" VARCHAR(120),
ADD COLUMN     "contact_phone" VARCHAR(20),
ALTER COLUMN "property_id" DROP NOT NULL,
ALTER COLUMN "buyer_id" DROP NOT NULL,
ALTER COLUMN "society_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "additional_rooms" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "floor_label" VARCHAR(20),
ADD COLUMN     "furnishing_details" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "property_view" JSONB NOT NULL DEFAULT '[]';

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
