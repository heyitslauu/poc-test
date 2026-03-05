CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"allotment_id" uuid NOT NULL,
	"withdrawal_code" varchar(150),
	"date" timestamp NOT NULL,
	"particulars" text NOT NULL,
	"status" "status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "withdrawals_withdrawal_code_unique" UNIQUE("withdrawal_code")
);
--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_allotment_id_allotments_id_fk" FOREIGN KEY ("allotment_id") REFERENCES "public"."allotments"("id") ON DELETE no action ON UPDATE no action;