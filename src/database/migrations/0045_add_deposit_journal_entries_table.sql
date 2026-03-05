CREATE TABLE "deposit_journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"deposit_id" uuid NOT NULL,
	"paps_id" uuid,
	"uacs_id" uuid NOT NULL,
	"debit" bigint DEFAULT 0 NOT NULL,
	"credit" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deposit_journal_entries" ADD CONSTRAINT "deposit_journal_entries_deposit_id_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_journal_entries" ADD CONSTRAINT "deposit_journal_entries_paps_id_paps_id_fk" FOREIGN KEY ("paps_id") REFERENCES "public"."paps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_journal_entries" ADD CONSTRAINT "deposit_journal_entries_uacs_id_revised_chart_of_accounts_id_fk" FOREIGN KEY ("uacs_id") REFERENCES "public"."revised_chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;