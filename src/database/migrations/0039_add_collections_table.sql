CREATE TYPE "public"."collection_spoiled_status" AS ENUM('SPOILED', 'NOT_SPOILED');--> statement-breakpoint
CREATE TYPE "public"."collection_type" AS ENUM('COL002', 'COL003', 'COL006', 'COL010', 'COL026', 'COL028', 'COL030', 'COL031', 'COL032', 'COL034', 'COL035');--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fund_cluster" "fund_cluster" NOT NULL,
	"or_number" text NOT NULL,
	"date" timestamp NOT NULL,
	"payor_type" "payee_type" NOT NULL,
	"payor_id" uuid NOT NULL,
	"collection_type" "collection_type" NOT NULL,
	"particulars" text NOT NULL,
	"spoiled" "collection_spoiled_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_payor_id_payees_id_fk" FOREIGN KEY ("payor_id") REFERENCES "public"."payees"("id") ON DELETE no action ON UPDATE no action;