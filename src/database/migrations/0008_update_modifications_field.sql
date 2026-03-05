ALTER TABLE "modifications" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "modifications" ADD COLUMN "request_id" varchar(150);--> statement-breakpoint
ALTER TABLE "modifications" ADD CONSTRAINT "modifications_request_id_unique" UNIQUE("request_id");