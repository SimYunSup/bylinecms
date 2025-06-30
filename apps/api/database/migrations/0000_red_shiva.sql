CREATE TYPE "public"."status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY NOT NULL,
	"vid" integer DEFAULT 1 NOT NULL,
	"status" "status" DEFAULT 'draft',
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"title" text NOT NULL,
	"content" json NOT NULL,
	"publishedOn" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"vid" integer DEFAULT 1 NOT NULL,
	"status" "status" DEFAULT 'draft',
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"title" text NOT NULL,
	"category" text,
	"content" json NOT NULL,
	"publishedOn" timestamp with time zone NOT NULL,
	"featured" boolean
);
