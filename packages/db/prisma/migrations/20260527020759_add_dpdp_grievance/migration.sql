-- CreateEnum
CREATE TYPE "DpdpGrievanceCategory" AS ENUM ('DATA_ACCESS', 'DATA_ERASURE', 'DATA_CORRECTION', 'CONSENT_WITHDRAWAL', 'DPDP_OTHER');

-- CreateEnum
CREATE TYPE "DpdpGrievanceStatus" AS ENUM ('RECEIVED', 'ACKNOWLEDGED', 'DPDP_IN_PROGRESS', 'DPDP_RESOLVED', 'DPDP_REJECTED');

-- CreateTable
CREATE TABLE "dpdp_grievances" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "category" "DpdpGrievanceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "contact" VARCHAR(200),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "status" "DpdpGrievanceStatus" NOT NULL DEFAULT 'RECEIVED',
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "dpdp_grievances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dpdp_grievances_status_idx" ON "dpdp_grievances"("status");

-- CreateIndex
CREATE INDEX "dpdp_grievances_created_at_idx" ON "dpdp_grievances"("created_at");
