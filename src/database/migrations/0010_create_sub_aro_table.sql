CREATE TABLE "sub_aros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"allotment_id" uuid NOT NULL,
	"sub_aro_code" varchar(150),
	"date" timestamp NOT NULL,
	"particulars" text NOT NULL,
	"status" "status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sub_aros_sub_aro_code_unique" UNIQUE("sub_aro_code")
);
--> statement-breakpoint
ALTER TABLE "sub_aros" ADD CONSTRAINT "sub_aros_allotment_id_allotments_id_fk" FOREIGN KEY ("allotment_id") REFERENCES "public"."allotments"("id") ON DELETE no action ON UPDATE no action;