CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"vid" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp (6) DEFAULT now(),
	"updated_at" timestamp (6) DEFAULT now(),
	"title" text NOT NULL,
	"published" boolean,
	"category" text,
	"content" json NOT NULL
);
