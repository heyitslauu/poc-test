CREATE TABLE "allotment_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"allotment_id" uuid NOT NULL,
	"office_id" uuid NOT NULL,
	"pap_id" uuid NOT NULL,
	"rca_id" uuid NOT NULL,
	"rca_sub_object_id" uuid,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allotment_details" ADD CONSTRAINT "allotment_details_allotment_id_allotments_id_fk" FOREIGN KEY ("allotment_id") REFERENCES "public"."allotments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allotment_details" ADD CONSTRAINT "allotment_details_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allotment_details" ADD CONSTRAINT "allotment_details_pap_id_paps_id_fk" FOREIGN KEY ("pap_id") REFERENCES "public"."paps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allotment_details" ADD CONSTRAINT "allotment_details_rca_id_revised_chart_of_accounts_id_fk" FOREIGN KEY ("rca_id") REFERENCES "public"."revised_chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allotment_details" ADD CONSTRAINT "allotment_details_rca_sub_object_id_rca_sub_objects_id_fk" FOREIGN KEY ("rca_sub_object_id") REFERENCES "public"."rca_sub_objects"("id") ON DELETE no action ON UPDATE no action;