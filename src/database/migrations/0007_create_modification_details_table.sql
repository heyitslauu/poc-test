CREATE TYPE "public"."action" AS ENUM('ADD', 'SUBTRACT');--> statement-breakpoint
CREATE TABLE "modification_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"modification_id" uuid NOT NULL,
	"uacs_id" uuid NOT NULL,
	"action" "action" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modification_details" ADD CONSTRAINT "modification_details_modification_id_modifications_id_fk" FOREIGN KEY ("modification_id") REFERENCES "public"."modifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modification_details" ADD CONSTRAINT "modification_details_uacs_id_allotment_details_id_fk" FOREIGN KEY ("uacs_id") REFERENCES "public"."allotment_details"("id") ON DELETE no action ON UPDATE no action;