CREATE TABLE "news" (
	"id" uuid PRIMARY KEY NOT NULL,
	"vid" integer DEFAULT 1 NOT NULL,
	"published" boolean DEFAULT false,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"title" text NOT NULL,
	"content" json NOT NULL,
	"publishedOn" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "publishedOn" SET DATA TYPE timestamp with time zone;