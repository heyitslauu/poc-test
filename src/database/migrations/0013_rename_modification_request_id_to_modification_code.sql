ALTER TABLE "modifications" RENAME COLUMN "request_id" TO "modification_code";--> statement-breakpoint
ALTER TABLE "modifications" DROP CONSTRAINT "modifications_request_id_unique";--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_modification_code_unique" UNIQUE("modification_code");