ALTER TABLE "withdrawal_details" DROP CONSTRAINT "withdrawal_details_allotment_details_id_allotment_details_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_allotment_id_allotments_id_fk";
--> statement-breakpoint
ALTER TABLE "withdrawal_details" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "withdrawal_details" ADD COLUMN "sub_aro_details_id" uuid;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "sub_aro_id" uuid;--> statement-breakpoint
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_sub_aro_details_id_sub_aro_details_id_fk" FOREIGN KEY ("sub_aro_details_id") REFERENCES "public"."sub_aro_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_sub_aro_id_sub_aros_id_fk" FOREIGN KEY ("sub_aro_id") REFERENCES "public"."sub_aros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_details" DROP COLUMN "allotment_details_id";--> statement-breakpoint
ALTER TABLE "withdrawal_details" DROP COLUMN "action";--> statement-breakpoint
ALTER TABLE "withdrawals" DROP COLUMN "allotment_id";