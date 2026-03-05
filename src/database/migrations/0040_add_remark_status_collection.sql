CREATE TYPE "public"."collection_status" AS ENUM('DRAFT', 'FOR_TRIAGE', 'FOR_PROCESSING', 'FOR_PEER_REVIEW', 'FOR_APPROVAL', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "status" "collection_status" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "remarks" text;