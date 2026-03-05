ALTER TYPE "public"."status" ADD VALUE 'FOR_FINALIZATION' BEFORE 'FOR_APPROVAL';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'REQUEST_FINALIZED' BEFORE 'FOR_APPROVAL';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'REQUEST_REJECTED' BEFORE 'FOR_APPROVAL';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'REQUEST_FOR_REVIEW' BEFORE 'FOR_APPROVAL';--> statement-breakpoint
ALTER TABLE "disbursements" ALTER COLUMN "fund_cluster" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "disbursements" ALTER COLUMN "tracking_reference" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "disbursements" ALTER COLUMN "particulars" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "disbursements" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "disbursements" ALTER COLUMN "transaction_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "disbursements" ALTER COLUMN "amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "disbursements" ADD CONSTRAINT "required_fields_when_not_draft" CHECK ((status = 'DRAFT') OR (
      "disbursements"."fund_cluster" IS NOT NULL AND
      "disbursements"."tracking_reference" IS NOT NULL AND
      "disbursements"."particulars" IS NOT NULL AND
      "disbursements"."date" IS NOT NULL AND
      "disbursements"."transaction_type" IS NOT NULL AND
      "disbursements"."amount" IS NOT NULL
    ));