CREATE TYPE "public"."bank_account_type" AS ENUM('REGULAR_AGENCY_LBP_MDS', 'REGULAR_AGENCY_LBP_DSWD_BIR', 'REGULAR_AGENCY_BTR', 'FOREIGN_ASSISTED_LBP_MDS_KALAHI', 'FOREIGN_ASSISTED_LBP_DSWD_FOV_KC', 'FOREIGN_ASSISTED_BTR', 'SPECIAL_LOCALLY_FUNDED_DSWD_FO5_BCDA', 'SPECIAL_LOCALLY_FUNDED_BTR', 'SPECIAL_FOREIGN_ASSISTED_LBP_MDS', 'SPECIAL_FOREIGN_ASSISTED_BTR', 'INTERNALLY_GENERATED_BTR', 'BUSINESS_RELATED_LBP_SEA_RSF', 'BUSINESS_RELATED_BTR', 'TRUST_RECEIPTS_LBP_MDS', 'TRUST_RECEIPTS_DBP_MISC', 'TRUST_RECEIPTS_BTR');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('DRAFT', 'FOR_TRIAGE', 'FOR_PROCESSING', 'FOR_PEER_REVIEW', 'FOR_APPROVAL', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('CHECK', 'ADA');--> statement-breakpoint
CREATE TYPE "public"."spoil_check_status" AS ENUM('NOT_SPOILED', 'SPOILED');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"fund_cluster" "fund_cluster",
	"bank_account_no" "bank_account_type" NOT NULL,
	"status" "payment_status" NOT NULL,
	"type" "payment_type" NOT NULL,
	"payment_reference_no" text,
	"spoil_check_status" "spoil_check_status" NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
