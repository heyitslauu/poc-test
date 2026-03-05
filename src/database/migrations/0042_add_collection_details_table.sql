CREATE TABLE "collection_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"paps_id" uuid NOT NULL,
	"payee_type" "payee_type" NOT NULL,
	"payee_id" uuid NOT NULL,
	"uacs_id" uuid NOT NULL,
	"debit" bigint DEFAULT 0 NOT NULL,
	"credit" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection_details" ADD CONSTRAINT "collection_details_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_details" ADD CONSTRAINT "collection_details_paps_id_paps_id_fk" FOREIGN KEY ("paps_id") REFERENCES "public"."paps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_details" ADD CONSTRAINT "collection_details_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_details" ADD CONSTRAINT "collection_details_uacs_id_revised_chart_of_accounts_id_fk" FOREIGN KEY ("uacs_id") REFERENCES "public"."revised_chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;