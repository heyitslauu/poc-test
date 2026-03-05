ALTER TABLE "allotments" ALTER COLUMN "fund_cluster" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "allotments" ALTER COLUMN "appropriation_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "allotments" ALTER COLUMN "bfars_budget_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "allotments" ALTER COLUMN "allotment_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "allotments" ADD COLUMN "allotment_code" text;--> statement-breakpoint
ALTER TABLE "allotments" ADD CONSTRAINT "allotments_allotment_code_unique" UNIQUE("allotment_code");