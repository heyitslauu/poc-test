ALTER TABLE "employees" ADD COLUMN "employee_number" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;