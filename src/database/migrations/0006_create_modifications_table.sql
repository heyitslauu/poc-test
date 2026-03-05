CREATE TABLE "modifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allotment_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"particulars" text NOT NULL,
	"status" "status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_allotment_id_allotments_id_fk" FOREIGN KEY ("allotment_id") REFERENCES "public"."allotments"("id") ON DELETE no action ON UPDATE no action;