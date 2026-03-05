ALTER TABLE "offices" ADD COLUMN "office_key" varchar(100);--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_office_key_unique" UNIQUE("office_key");