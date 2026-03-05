CREATE TYPE "public"."allotment_type" AS ENUM('DIRECT_RELEASE', 'CENTRALLY_MANAGED_FUND');--> statement-breakpoint
CREATE TYPE "public"."appropriation_type" AS ENUM('CURRENT_APPROPRIATION', 'CONTINUING_APPROPRIATION_CO', 'CONTINUING_APPROPRIATION_FO');--> statement-breakpoint
CREATE TYPE "public"."bfars_budget_type" AS ENUM('AGENCY_SPECIFIC_BUDGET', 'AUTOMATIC_APPROPRIATIONS', 'SPECIAL_PURPOSE_FUNDS');--> statement-breakpoint
CREATE TYPE "public"."fund_cluster" AS ENUM('01', '02', '03', '04', '05', '06', '07');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('DRAFT', 'FOR_TRIAGE', 'FOR_PROCESSING', 'FOR_PEER_REVIEW', 'FOR_APPROVAL', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "allotments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tracking_reference" text NOT NULL,
	"date" timestamp NOT NULL,
	"fund_cluster" "fund_cluster" NOT NULL,
	"particulars" text NOT NULL,
	"appropriation_type" "appropriation_type" NOT NULL,
	"bfars_budget_type" "bfars_budget_type" NOT NULL,
	"allotment_type" "allotment_type" NOT NULL,
	"total_allotment" bigint NOT NULL,
	"status" "status" NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "allotments_tracking_reference_unique" UNIQUE("tracking_reference")
);
