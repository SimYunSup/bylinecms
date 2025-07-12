CREATE TABLE "boolean_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value" boolean NOT NULL,
	CONSTRAINT "unique_boolean_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"path" varchar(255) NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "collections_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "datetime_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"date_type" varchar(20) NOT NULL,
	"value_date" date,
	"value_time" time,
	"value_timestamp" timestamp,
	"value_timestamp_tz" timestamp with time zone,
	CONSTRAINT "unique_datetime_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"path" varchar(255) NOT NULL,
	"doc" jsonb,
	"event_type" varchar(20) DEFAULT 'create' NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" uuid,
	"change_summary" text
);
--> statement-breakpoint
CREATE TABLE "file_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"file_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" bigint NOT NULL,
	"file_hash" varchar(64),
	"storage_provider" varchar(50) NOT NULL,
	"storage_path" text NOT NULL,
	"storage_url" text,
	"image_width" integer,
	"image_height" integer,
	"image_format" varchar(20),
	"processing_status" varchar(20) DEFAULT 'pending',
	"thumbnail_generated" boolean DEFAULT false,
	CONSTRAINT "unique_file_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
CREATE TABLE "json_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value" jsonb NOT NULL,
	"json_schema" varchar(100),
	"object_keys" text[],
	CONSTRAINT "unique_json_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
CREATE TABLE "numeric_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"number_type" varchar(20) NOT NULL,
	"value_integer" integer,
	"value_decimal" numeric(10, 2),
	"value_float" real,
	CONSTRAINT "unique_numeric_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
CREATE TABLE "relation_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"target_document_id" uuid NOT NULL,
	"target_collection_id" uuid NOT NULL,
	"relationship_type" varchar(50) DEFAULT 'reference',
	"cascade_delete" boolean DEFAULT false,
	CONSTRAINT "unique_relation_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
CREATE TABLE "text_store" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value" text NOT NULL,
	"word_count" integer,
	CONSTRAINT "unique_text_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
ALTER TABLE "boolean_store" ADD CONSTRAINT "boolean_store_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boolean_store" ADD CONSTRAINT "boolean_store_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datetime_store" ADD CONSTRAINT "datetime_store_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datetime_store" ADD CONSTRAINT "datetime_store_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_store" ADD CONSTRAINT "file_store_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_store" ADD CONSTRAINT "file_store_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "json_store" ADD CONSTRAINT "json_store_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "json_store" ADD CONSTRAINT "json_store_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "numeric_store" ADD CONSTRAINT "numeric_store_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "numeric_store" ADD CONSTRAINT "numeric_store_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_store" ADD CONSTRAINT "relation_store_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_store" ADD CONSTRAINT "relation_store_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_store" ADD CONSTRAINT "relation_store_target_document_id_documents_id_fk" FOREIGN KEY ("target_document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_store" ADD CONSTRAINT "relation_store_target_collection_id_collections_id_fk" FOREIGN KEY ("target_collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_store" ADD CONSTRAINT "text_store_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_store" ADD CONSTRAINT "text_store_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_boolean_value" ON "boolean_store" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_boolean_path_value" ON "boolean_store" USING btree ("field_path","value");--> statement-breakpoint
CREATE INDEX "idx_boolean_collection_value" ON "boolean_store" USING btree ("collection_id","field_path","value");--> statement-breakpoint
CREATE INDEX "idx_datetime_date" ON "datetime_store" USING btree ("value_date");--> statement-breakpoint
CREATE INDEX "idx_datetime_timestamp" ON "datetime_store" USING btree ("value_timestamp");--> statement-breakpoint
CREATE INDEX "idx_datetime_timestamp_tz" ON "datetime_store" USING btree ("value_timestamp_tz");--> statement-breakpoint
CREATE INDEX "idx_datetime_path_date" ON "datetime_store" USING btree ("field_path","value_timestamp");--> statement-breakpoint
CREATE INDEX "idx_datetime_collection_date" ON "datetime_store" USING btree ("collection_id","value_timestamp");--> statement-breakpoint
CREATE INDEX "idx_documents_document_id" ON "documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_documents_collection_path_deleted" ON "documents" USING btree ("collection_id","path","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_documents_collection_document_deleted" ON "documents" USING btree ("collection_id","document_id","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_documents_current_view" ON "documents" USING btree ("collection_id","document_id","is_deleted","id");--> statement-breakpoint
CREATE INDEX "idx_documents_event_type" ON "documents" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_documents_created_at" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_documents_document_collection" ON "documents" USING btree ("document_id","collection_id");--> statement-breakpoint
CREATE INDEX "idx_file_file_id" ON "file_store" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "idx_file_mime_type" ON "file_store" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "idx_file_size" ON "file_store" USING btree ("file_size");--> statement-breakpoint
CREATE INDEX "idx_file_hash" ON "file_store" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "idx_file_image_dimensions" ON "file_store" USING btree ("image_width","image_height");--> statement-breakpoint
CREATE INDEX "idx_file_storage_provider" ON "file_store" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "idx_file_processing_status" ON "file_store" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_json_value_gin" ON "json_store" USING gin ("value");--> statement-breakpoint
CREATE INDEX "idx_json_schema" ON "json_store" USING btree ("json_schema");--> statement-breakpoint
CREATE INDEX "idx_json_keys" ON "json_store" USING gin ("object_keys");--> statement-breakpoint
CREATE INDEX "idx_numeric_integer" ON "numeric_store" USING btree ("value_integer");--> statement-breakpoint
CREATE INDEX "idx_numeric_decimal" ON "numeric_store" USING btree ("value_decimal");--> statement-breakpoint
CREATE INDEX "idx_numeric_float" ON "numeric_store" USING btree ("value_float");--> statement-breakpoint
CREATE INDEX "idx_numeric_integer_range" ON "numeric_store" USING btree ("field_path","value_integer");--> statement-breakpoint
CREATE INDEX "idx_numeric_decimal_range" ON "numeric_store" USING btree ("field_path","value_decimal");--> statement-breakpoint
CREATE INDEX "idx_relation_target_document" ON "relation_store" USING btree ("target_document_id");--> statement-breakpoint
CREATE INDEX "idx_relation_target_collection" ON "relation_store" USING btree ("target_collection_id");--> statement-breakpoint
CREATE INDEX "idx_relation_type" ON "relation_store" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_relation_reverse" ON "relation_store" USING btree ("target_document_id","field_path");--> statement-breakpoint
CREATE INDEX "idx_relation_collection_to_collection" ON "relation_store" USING btree ("collection_id","target_collection_id");--> statement-breakpoint
CREATE INDEX "idx_text_value" ON "text_store" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_text_fulltext" ON "text_store" USING gin (to_tsvector('english', "value"));--> statement-breakpoint
CREATE INDEX "idx_text_locale_value" ON "text_store" USING btree ("locale","value");--> statement-breakpoint
CREATE INDEX "idx_text_path_value" ON "text_store" USING btree ("field_path","value");--> statement-breakpoint
CREATE VIEW "public"."current_documents" AS (select distinct "id", "document_id", "collection_id", "path", "event_type", "status", "is_deleted", "created_at", "updated_at", "created_by", "change_summary" from "documents" where "documents"."is_deleted" = false order by "documents"."collection_id", "documents"."document_id", "documents"."id" desc);