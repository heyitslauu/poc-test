ALTER TABLE "obligation_details" DROP CONSTRAINT "obligation_details_allotment_id_allotments_id_fk";
--> statement-breakpoint
ALTER TABLE "obligation_details" ADD COLUMN "allotment_details_id" uuid;--> statement-breakpoint
ALTER TABLE "obligation_details" ADD CONSTRAINT "obligation_details_allotment_details_id_allotment_details_id_fk" FOREIGN KEY ("allotment_details_id") REFERENCES "public"."allotment_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_details" DROP COLUMN "allotment_id";