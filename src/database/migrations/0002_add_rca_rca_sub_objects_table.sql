CREATE TABLE "rca_sub_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rca_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rca_sub_objects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "revised_chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"allows_sub_object" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "revised_chart_of_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "paps" ALTER COLUMN "name" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "rca_sub_objects" ADD CONSTRAINT "rca_sub_objects_rca_id_revised_chart_of_accounts_id_fk" FOREIGN KEY ("rca_id") REFERENCES "public"."revised_chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;