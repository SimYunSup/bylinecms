CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"vid" integer DEFAULT 1 NOT NULL,
	"published" boolean DEFAULT false,
	"created_at" timestamp (6) DEFAULT now(),
	"updated_at" timestamp (6) DEFAULT now(),
	"title" text NOT NULL,
	"category" text,
	"content" json NOT NULL,
	"publishedOn" timestamp,
	"featured" boolean
);
