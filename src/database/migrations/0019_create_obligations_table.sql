CREATE TABLE "obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payee_id" uuid NOT NULL,
	"fund_cluster" "fund_cluster",
	"ors_number" varchar(150),
	"tracking_reference" varchar(150) NOT NULL,
	"particulars" text NOT NULL,
	"date" timestamp NOT NULL,
	"transaction_type" text,
	"amount" bigint NOT NULL,
	"status" "status" NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "obligations_ors_number_unique" UNIQUE("ors_number"),
	CONSTRAINT "obligations_tracking_reference_unique" UNIQUE("tracking_reference")
);
--> statement-breakpoint
ALTER TABLE "obligations" ADD CONSTRAINT "obligations_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;