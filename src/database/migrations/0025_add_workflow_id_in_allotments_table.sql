ALTER TABLE "allotment_drafts" ADD COLUMN "workflow_id" uuid;--> statement-breakpoint
ALTER TABLE "allotments" ADD COLUMN "workflow_id" uuid;