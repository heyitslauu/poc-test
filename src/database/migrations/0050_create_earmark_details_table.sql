CREATE TABLE "earmark_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"earmark_id" uuid NOT NULL,
	"allotment_details_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "earmark_details" ADD CONSTRAINT "earmark_details_earmark_id_earmarks_id_fk" FOREIGN KEY ("earmark_id") REFERENCES "public"."earmarks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earmark_details" ADD CONSTRAINT "earmark_details_allotment_details_id_allotment_details_id_fk" FOREIGN KEY ("allotment_details_id") REFERENCES "public"."allotment_details"("id") ON DELETE no action ON UPDATE no action;