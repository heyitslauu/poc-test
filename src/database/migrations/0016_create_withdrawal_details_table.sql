CREATE TABLE "withdrawal_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"withdrawal_id" uuid NOT NULL,
	"allotment_details_id" uuid NOT NULL,
	"action" "action" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_withdrawal_id_withdrawals_id_fk" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_allotment_details_id_allotment_details_id_fk" FOREIGN KEY ("allotment_details_id") REFERENCES "public"."allotment_details"("id") ON DELETE no action ON UPDATE no action;