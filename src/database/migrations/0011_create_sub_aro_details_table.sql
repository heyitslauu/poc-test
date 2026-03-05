CREATE TABLE "sub_aro_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_aro_id" uuid NOT NULL,
	"uacs_id" uuid NOT NULL,
	"office_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sub_aro_details" ADD CONSTRAINT "sub_aro_details_sub_aro_id_sub_aros_id_fk" FOREIGN KEY ("sub_aro_id") REFERENCES "public"."sub_aros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_aro_details" ADD CONSTRAINT "sub_aro_details_uacs_id_allotment_details_id_fk" FOREIGN KEY ("uacs_id") REFERENCES "public"."allotment_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_aro_details" ADD CONSTRAINT "sub_aro_details_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;