-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('NOT_CERTIFIED', 'CERTIFIED', 'REVOKED');

-- AlterEnum
ALTER TYPE "CommissionStatus" ADD VALUE 'DISTRIBUTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GrievanceCategory" ADD VALUE 'KEY_ARRANGEMENT';
ALTER TYPE "GrievanceCategory" ADD VALUE 'VISIT_TIME';
ALTER TYPE "GrievanceCategory" ADD VALUE 'MEETING_AVAILABILITY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'NOT_PICKED';
ALTER TYPE "LeadStatus" ADD VALUE 'INTERESTED';
ALTER TYPE "LeadStatus" ADD VALUE 'QUALIFIED';
ALTER TYPE "LeadStatus" ADD VALUE 'MEETING_ARRANGED';
ALTER TYPE "LeadStatus" ADD VALUE 'DEAL_OPEN';

-- AlterTable
ALTER TABLE "dealers" ADD COLUMN     "certification_status" "CertificationStatus" NOT NULL DEFAULT 'NOT_CERTIFIED',
ADD COLUMN     "certified_at" TIMESTAMP(3);
