CREATE TYPE "public"."disbursement_fund_cluster" AS ENUM('01', '02', '03', '04', '05', '06', '07');--> statement-breakpoint
CREATE TYPE "public"."disbursement_status" AS ENUM('DRAFT', 'FOR_PROCESSING', 'FOR_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "disbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payee_id" uuid NOT NULL,
	"fund_cluster" "disbursement_fund_cluster" NOT NULL,
	"dv_number" text,
	"tracking_reference" text NOT NULL,
	"particulars" text NOT NULL,
	"date" timestamp NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" bigint NOT NULL,
	"status" "disbursement_status" NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disbursements_dv_number_unique" UNIQUE("dv_number"),
	CONSTRAINT "disbursements_tracking_reference_unique" UNIQUE("tracking_reference")
);
--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;