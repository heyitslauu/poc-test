CREATE TYPE "public"."payee_type" AS ENUM('CREDITOR', 'EMPLOYEE', 'SUPPLIER');--> statement-breakpoint
CREATE TABLE "payees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"employee_id" uuid,
	"type" "payee_type" NOT NULL,
	"name" text,
	"tin_no" text
);
