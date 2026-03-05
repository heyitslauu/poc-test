CREATE TABLE "disbursement_obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"disbursement_id" uuid NOT NULL,
	"obligation_detail_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "disbursement_obligations" ADD CONSTRAINT "disbursement_obligations_disbursement_id_disbursements_id_fk" FOREIGN KEY ("disbursement_id") REFERENCES "public"."disbursements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disbursement_obligations" ADD CONSTRAINT "disbursement_obligations_obligation_detail_id_obligation_details_id_fk" FOREIGN KEY ("obligation_detail_id") REFERENCES "public"."obligation_details"("id") ON DELETE no action ON UPDATE no action;