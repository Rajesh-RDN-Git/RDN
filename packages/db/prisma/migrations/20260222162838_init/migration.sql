-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'RWA_ADMIN', 'DEALER', 'OWNER', 'BUYER_TENANT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FLAGGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SocietyStatus" AS ENUM ('ONBOARDED', 'IN_PROGRESS', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'COMMERCIAL', 'VILLA');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RENT', 'SALE', 'BOTH');

-- CreateEnum
CREATE TYPE "FurnishingType" AS ENUM ('FURNISHED', 'SEMI', 'UNFURNISHED');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE_NOW', 'AVAILABLE_FROM', 'UNDER_NOTICE', 'OCCUPIED', 'SOLD');

-- CreateEnum
CREATE TYPE "PropertyVerificationStatus" AS ENUM ('PROP_PENDING', 'RWA_APPROVED', 'PROP_VERIFIED', 'PROP_FLAGGED', 'PROP_REJECTED');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'DELISTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'VISITED', 'NEGOTIATING', 'CLOSING', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('APP_SEARCH', 'REFERRAL', 'WHATSAPP', 'WALK_IN');

-- CreateEnum
CREATE TYPE "DealTransactionType" AS ENUM ('DEAL_RENT', 'DEAL_SALE', 'RENEWAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAY_PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('COMM_PENDING', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "GrievanceCategory" AS ENUM ('DEALER_CONDUCT', 'PROPERTY_MISMATCH', 'COMMISSION', 'SERVICE', 'SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "GrievanceSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'GRIEV_CLOSED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('REF_PENDING', 'SIGNED_UP', 'TRANSACTED', 'REWARDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAD', 'VISIT', 'DEAL', 'NOTIF_COMMISSION', 'NOTIF_GRIEVANCE', 'NOTIF_SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('KYC_PENDING', 'KYC_APPROVED', 'KYC_REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('APPR_PENDING', 'APPR_APPROVED', 'APPR_REJECTED');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('TRAIN_PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar_url" VARCHAR(512),
    "otp_hash" VARCHAR(255),
    "otp_expires_at" TIMESTAMP(3),
    "refresh_token" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "societies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "total_units" INTEGER,
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "rwa_admin_id" UUID,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "mandate_start_date" DATE,
    "mandate_end_date" DATE,
    "status" "SocietyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "kyc_status" "KYCStatus" NOT NULL DEFAULT 'KYC_PENDING',
    "rwa_approval_status" "ApprovalStatus" NOT NULL DEFAULT 'APPR_PENDING',
    "training_status" "TrainingStatus" NOT NULL DEFAULT 'TRAIN_PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "bank_account_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "assigned_dealer_id" UUID,
    "flat_number" VARCHAR(50) NOT NULL,
    "tower_block" VARCHAR(100) NOT NULL,
    "type" "PropertyType" NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "bhk" SMALLINT,
    "carpet_area" DECIMAL(10,2),
    "super_area" DECIMAL(10,2),
    "floor" SMALLINT,
    "total_floors" SMALLINT,
    "facing" VARCHAR(20),
    "furnishing" "FurnishingType",
    "price_rent" DECIMAL(12,2),
    "price_sale" DECIMAL(14,2),
    "security_deposit" DECIMAL(12,2),
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE_NOW',
    "available_from" DATE,
    "verification_status" "PropertyVerificationStatus" NOT NULL DEFAULT 'PROP_PENDING',
    "restrictions" JSONB NOT NULL DEFAULT '{}',
    "amenities" JSONB NOT NULL DEFAULT '{}',
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_media" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "type" "MediaType" NOT NULL,
    "order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "dealer_id" UUID NOT NULL,
    "society_id" UUID NOT NULL,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "visit_date" TIMESTAMP(3),
    "visit_approved_by_owner" BOOLEAN NOT NULL DEFAULT false,
    "notes" JSONB NOT NULL DEFAULT '[]',
    "auto_reassigned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "type" "DealTransactionType" NOT NULL,
    "deal_value" DECIMAL(14,2) NOT NULL,
    "buyer_commission" DECIMAL(12,2) NOT NULL,
    "seller_commission" DECIMAL(12,2) NOT NULL,
    "gst_amount" DECIMAL(10,2) NOT NULL,
    "rdn_share" DECIMAL(12,2),
    "dealer_share" DECIMAL(12,2),
    "rwa_share" DECIMAL(12,2),
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PAY_PENDING',
    "invoice_urls" JSONB NOT NULL DEFAULT '{}',
    "closed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL,
    "dealer_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "gst" DECIMAL(10,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'COMM_PENDING',
    "settlement_date" DATE,
    "payout_reference" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "lead_id" UUID,
    "participants" JSONB NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievances" (
    "id" UUID NOT NULL,
    "filed_by" UUID NOT NULL,
    "against_user_id" UUID,
    "society_id" UUID,
    "transaction_id" UUID,
    "category" "GrievanceCategory" NOT NULL,
    "severity" "GrievanceSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" JSONB NOT NULL DEFAULT '[]',
    "status" "GrievanceStatus" NOT NULL DEFAULT 'OPEN',
    "escalation_level" SMALLINT NOT NULL DEFAULT 1,
    "assigned_to" UUID,
    "sla_deadline" TIMESTAMP(3) NOT NULL,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL,
    "referrer_id" UUID NOT NULL,
    "referred_id" UUID,
    "referral_code" VARCHAR(20) NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'REF_PENDING',
    "reward_amount" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "channel" "NotificationChannel" NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "societies_slug_key" ON "societies"("slug");

-- CreateIndex
CREATE INDEX "societies_city_idx" ON "societies"("city");

-- CreateIndex
CREATE INDEX "societies_state_idx" ON "societies"("state");

-- CreateIndex
CREATE INDEX "societies_pincode_idx" ON "societies"("pincode");

-- CreateIndex
CREATE INDEX "societies_verification_status_idx" ON "societies"("verification_status");

-- CreateIndex
CREATE INDEX "societies_status_idx" ON "societies"("status");

-- CreateIndex
CREATE INDEX "dealers_society_id_idx" ON "dealers"("society_id");

-- CreateIndex
CREATE INDEX "dealers_is_active_idx" ON "dealers"("is_active");

-- CreateIndex
CREATE INDEX "dealers_kyc_status_idx" ON "dealers"("kyc_status");

-- CreateIndex
CREATE UNIQUE INDEX "dealers_user_id_society_id_key" ON "dealers"("user_id", "society_id");

-- CreateIndex
CREATE INDEX "properties_society_id_idx" ON "properties"("society_id");

-- CreateIndex
CREATE INDEX "properties_owner_id_idx" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "properties_assigned_dealer_id_idx" ON "properties"("assigned_dealer_id");

-- CreateIndex
CREATE INDEX "properties_transaction_type_idx" ON "properties"("transaction_type");

-- CreateIndex
CREATE INDEX "properties_bhk_idx" ON "properties"("bhk");

-- CreateIndex
CREATE INDEX "properties_price_rent_idx" ON "properties"("price_rent");

-- CreateIndex
CREATE INDEX "properties_price_sale_idx" ON "properties"("price_sale");

-- CreateIndex
CREATE INDEX "properties_availability_status_idx" ON "properties"("availability_status");

-- CreateIndex
CREATE INDEX "properties_verification_status_idx" ON "properties"("verification_status");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE UNIQUE INDEX "properties_society_id_flat_number_tower_block_key" ON "properties"("society_id", "flat_number", "tower_block");

-- CreateIndex
CREATE INDEX "property_media_property_id_idx" ON "property_media"("property_id");

-- CreateIndex
CREATE INDEX "leads_property_id_idx" ON "leads"("property_id");

-- CreateIndex
CREATE INDEX "leads_buyer_id_idx" ON "leads"("buyer_id");

-- CreateIndex
CREATE INDEX "leads_dealer_id_idx" ON "leads"("dealer_id");

-- CreateIndex
CREATE INDEX "leads_society_id_idx" ON "leads"("society_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "transactions_lead_id_idx" ON "transactions"("lead_id");

-- CreateIndex
CREATE INDEX "transactions_property_id_idx" ON "transactions"("property_id");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_payment_status_idx" ON "transactions"("payment_status");

-- CreateIndex
CREATE INDEX "transactions_closed_at_idx" ON "transactions"("closed_at");

-- CreateIndex
CREATE INDEX "commissions_dealer_id_idx" ON "commissions"("dealer_id");

-- CreateIndex
CREATE INDEX "commissions_transaction_id_idx" ON "commissions"("transaction_id");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "commissions_settlement_date_idx" ON "commissions"("settlement_date");

-- CreateIndex
CREATE INDEX "conversations_lead_id_idx" ON "conversations"("lead_id");

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_receiver_id_idx" ON "messages"("receiver_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "grievances_filed_by_idx" ON "grievances"("filed_by");

-- CreateIndex
CREATE INDEX "grievances_against_user_id_idx" ON "grievances"("against_user_id");

-- CreateIndex
CREATE INDEX "grievances_society_id_idx" ON "grievances"("society_id");

-- CreateIndex
CREATE INDEX "grievances_status_idx" ON "grievances"("status");

-- CreateIndex
CREATE INDEX "grievances_severity_idx" ON "grievances"("severity");

-- CreateIndex
CREATE INDEX "grievances_escalation_level_idx" ON "grievances"("escalation_level");

-- CreateIndex
CREATE INDEX "grievances_assigned_to_idx" ON "grievances"("assigned_to");

-- CreateIndex
CREATE INDEX "grievances_sla_deadline_idx" ON "grievances"("sla_deadline");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referral_code_key" ON "referrals"("referral_code");

-- CreateIndex
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "referrals_referred_id_idx" ON "referrals"("referred_id");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "societies" ADD CONSTRAINT "societies_rwa_admin_id_fkey" FOREIGN KEY ("rwa_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_assigned_dealer_id_fkey" FOREIGN KEY ("assigned_dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_filed_by_fkey" FOREIGN KEY ("filed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_against_user_id_fkey" FOREIGN KEY ("against_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
