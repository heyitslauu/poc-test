CREATE TABLE "allotment_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_allotment_id" uuid,
	"date" timestamp,
	"fund_cluster" "fund_cluster",
	"particulars" text,
	"appropriation_type" "appropriation_type",
	"bfars_budget_type" "bfars_budget_type",
	"allotment_type" "allotment_type",
	"total_allotment" bigint,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allotment_drafts" ADD CONSTRAINT "allotment_drafts_target_allotment_id_allotments_id_fk" FOREIGN KEY ("target_allotment_id") REFERENCES "public"."allotments"("id") ON DELETE no action ON UPDATE no action;