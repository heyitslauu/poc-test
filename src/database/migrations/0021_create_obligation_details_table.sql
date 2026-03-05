CREATE TABLE "obligation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"obligation_id" uuid NOT NULL,
	"allotment_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "obligation_details" ADD CONSTRAINT "obligation_details_obligation_id_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."obligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_details" ADD CONSTRAINT "obligation_details_allotment_id_allotments_id_fk" FOREIGN KEY ("allotment_id") REFERENCES "public"."allotments"("id") ON DELETE no action ON UPDATE no action;