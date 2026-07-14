-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_dealer_id_fkey";

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "dealer_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
