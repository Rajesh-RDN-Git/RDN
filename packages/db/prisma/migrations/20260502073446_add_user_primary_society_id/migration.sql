-- AlterTable
ALTER TABLE "users" ADD COLUMN     "primary_society_id" UUID;

-- CreateIndex
CREATE INDEX "users_primary_society_id_idx" ON "users"("primary_society_id");
