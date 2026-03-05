CREATE TYPE "public"."deposit_status" AS ENUM('DRAFT', 'FOR_TRIAGE', 'FOR_PROCESSING', 'FOR_PEER_REVIEW', 'FOR_APPROVAL', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fund_cluster" "fund_cluster" NOT NULL,
	"date" timestamp NOT NULL,
	"bank_account_no" "bank_account_type" NOT NULL,
	"deposit_no" text NOT NULL,
	"status" "deposit_status" DEFAULT 'DRAFT' NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
