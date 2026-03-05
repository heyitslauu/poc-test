ALTER TABLE "modification_details" DROP CONSTRAINT "modification_details_uacs_id_allotment_details_id_fk";
--> statement-breakpoint
ALTER TABLE "modifications" ALTER COLUMN "allotment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "modification_details" ADD COLUMN "allotment_details_id" uuid;--> statement-breakpoint
ALTER TABLE "modification_details" ADD COLUMN "sub_aro_details_id" uuid;--> statement-breakpoint
ALTER TABLE "modifications" ADD COLUMN "sub_aro_id" uuid;--> statement-breakpoint
UPDATE "modification_details" SET "allotment_details_id" = "uacs_id" WHERE "uacs_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "modification_details" ADD CONSTRAINT "modification_details_allotment_details_id_allotment_details_id_fk" FOREIGN KEY ("allotment_details_id") REFERENCES "public"."allotment_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modification_details" ADD CONSTRAINT "modification_details_sub_aro_details_id_sub_aro_details_id_fk" FOREIGN KEY ("sub_aro_details_id") REFERENCES "public"."sub_aro_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_sub_aro_id_sub_aros_id_fk" FOREIGN KEY ("sub_aro_id") REFERENCES "public"."sub_aros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modification_details" DROP COLUMN "uacs_id";--> statement-breakpoint
ALTER TABLE "modification_details" ADD CONSTRAINT "only_one_detail_reference" CHECK (("modification_details"."allotment_details_id" IS NOT NULL AND "modification_details"."sub_aro_details_id" IS NULL) OR ("modification_details"."allotment_details_id" IS NULL AND "modification_details"."sub_aro_details_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "only_one_reference" CHECK (("modifications"."allotment_id" IS NOT NULL AND "modifications"."sub_aro_id" IS NULL) OR ("modifications"."allotment_id" IS NULL AND "modifications"."sub_aro_id" IS NOT NULL));