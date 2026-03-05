ALTER TABLE "allotment_details" ALTER COLUMN "amount" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "allotment_details" ADD COLUMN "balance" bigint DEFAULT 0 NOT NULL;