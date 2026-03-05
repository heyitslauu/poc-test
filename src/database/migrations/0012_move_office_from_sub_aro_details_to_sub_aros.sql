ALTER TABLE "sub_aro_details" DROP CONSTRAINT "sub_aro_details_office_id_offices_id_fk";
--> statement-breakpoint
ALTER TABLE "sub_aros" ADD COLUMN "office_id" uuid;--> statement-breakpoint
ALTER TABLE "sub_aros" ADD CONSTRAINT "sub_aros_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_aro_details" DROP COLUMN "office_id";