CREATE TYPE "public"."journal_entry_type" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payee_id" uuid NOT NULL,
	"disbursement_id" uuid NOT NULL,
	"obligation_detail_id" uuid NOT NULL,
	"rca_id" uuid NOT NULL,
	"rca_sub_object_id" uuid,
	"entry_type" "journal_entry_type" NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_disbursement_id_disbursements_id_fk" FOREIGN KEY ("disbursement_id") REFERENCES "public"."disbursements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_obligation_detail_id_obligation_details_id_fk" FOREIGN KEY ("obligation_detail_id") REFERENCES "public"."obligation_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_rca_id_revised_chart_of_accounts_id_fk" FOREIGN KEY ("rca_id") REFERENCES "public"."revised_chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_rca_sub_object_id_rca_sub_objects_id_fk" FOREIGN KEY ("rca_sub_object_id") REFERENCES "public"."rca_sub_objects"("id") ON DELETE no action ON UPDATE no action;