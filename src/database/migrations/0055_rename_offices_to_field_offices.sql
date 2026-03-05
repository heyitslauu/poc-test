ALTER TABLE "offices" RENAME TO "field_offices";--> statement-breakpoint
ALTER TABLE "field_offices" DROP CONSTRAINT "offices_code_unique";--> statement-breakpoint
ALTER TABLE "field_offices" DROP CONSTRAINT "offices_office_key_unique";--> statement-breakpoint
ALTER TABLE "allotment_details" DROP CONSTRAINT "allotment_details_office_id_offices_id_fk";
--> statement-breakpoint
ALTER TABLE "sub_aros" DROP CONSTRAINT "sub_aros_office_id_offices_id_fk";
--> statement-breakpoint
ALTER TABLE "allotment_details" ADD CONSTRAINT "allotment_details_office_id_field_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."field_offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_aros" ADD CONSTRAINT "sub_aros_office_id_field_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."field_offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_offices" ADD CONSTRAINT "field_offices_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "field_offices" ADD CONSTRAINT "field_offices_office_key_unique" UNIQUE("office_key");