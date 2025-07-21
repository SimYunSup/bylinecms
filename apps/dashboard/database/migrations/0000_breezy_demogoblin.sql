CREATE TABLE "store_boolean" (
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
	"singular" text NOT NULL,
	"plural" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "collections_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "store_datetime" (
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
	"value_timestamp_tz" timestamp with time zone,
	CONSTRAINT "unique_datetime_field" UNIQUE("document_version_id","field_path","locale")
);
--> statement-breakpoint
CREATE TABLE "document_relationships" (
	"parent_document_id" uuid NOT NULL,
	"child_document_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "document_relationships_parent_document_id_child_document_id_unique" UNIQUE("parent_document_id","child_document_id")
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
CREATE TABLE "store_file" (
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
CREATE TABLE "store_json" (
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
CREATE TABLE "store_numeric" (
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
CREATE TABLE "store_relation" (
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
CREATE TABLE "store_text" (
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
ALTER TABLE "store_boolean" ADD CONSTRAINT "store_boolean_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_boolean" ADD CONSTRAINT "store_boolean_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_datetime" ADD CONSTRAINT "store_datetime_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_datetime" ADD CONSTRAINT "store_datetime_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_file" ADD CONSTRAINT "store_file_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_file" ADD CONSTRAINT "store_file_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_json" ADD CONSTRAINT "store_json_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_json" ADD CONSTRAINT "store_json_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_numeric" ADD CONSTRAINT "store_numeric_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_numeric" ADD CONSTRAINT "store_numeric_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_relation" ADD CONSTRAINT "store_relation_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_relation" ADD CONSTRAINT "store_relation_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_relation" ADD CONSTRAINT "store_relation_target_collection_id_collections_id_fk" FOREIGN KEY ("target_collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_text" ADD CONSTRAINT "store_text_document_version_id_documents_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_text" ADD CONSTRAINT "store_text_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_boolean_value" ON "store_boolean" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_boolean_path_value" ON "store_boolean" USING btree ("field_path","value");--> statement-breakpoint
CREATE INDEX "idx_boolean_collection_value" ON "store_boolean" USING btree ("collection_id","field_path","value");--> statement-breakpoint
CREATE INDEX "idx_datetime_date" ON "store_datetime" USING btree ("value_date");--> statement-breakpoint
CREATE INDEX "idx_datetime_timestamp_tz" ON "store_datetime" USING btree ("value_timestamp_tz");--> statement-breakpoint
CREATE INDEX "idx_datetime_path_date" ON "store_datetime" USING btree ("field_path","value_timestamp_tz");--> statement-breakpoint
CREATE INDEX "idx_datetime_collection_date" ON "store_datetime" USING btree ("collection_id","value_timestamp_tz");--> statement-breakpoint
CREATE INDEX "idx_document_relationships_parent" ON "document_relationships" USING btree ("parent_document_id");--> statement-breakpoint
CREATE INDEX "idx_document_relationships_child" ON "document_relationships" USING btree ("child_document_id");--> statement-breakpoint
CREATE INDEX "idx_documents_document_id" ON "documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_documents_collection_path_deleted" ON "documents" USING btree ("collection_id","path","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_documents_collection_document_deleted" ON "documents" USING btree ("collection_id","document_id","is_deleted");--> statement-breakpoint
CREATE INDEX "idx_documents_current_view" ON "documents" USING btree ("collection_id","document_id","is_deleted","id");--> statement-breakpoint
CREATE INDEX "idx_documents_event_type" ON "documents" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_documents_created_at" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_documents_document_collection" ON "documents" USING btree ("document_id","collection_id");--> statement-breakpoint
CREATE INDEX "idx_file_file_id" ON "store_file" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "idx_file_mime_type" ON "store_file" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "idx_file_size" ON "store_file" USING btree ("file_size");--> statement-breakpoint
CREATE INDEX "idx_file_hash" ON "store_file" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "idx_file_image_dimensions" ON "store_file" USING btree ("image_width","image_height");--> statement-breakpoint
CREATE INDEX "idx_file_storage_provider" ON "store_file" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "idx_file_processing_status" ON "store_file" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_json_value_gin" ON "store_json" USING gin ("value");--> statement-breakpoint
CREATE INDEX "idx_json_schema" ON "store_json" USING btree ("json_schema");--> statement-breakpoint
CREATE INDEX "idx_json_keys" ON "store_json" USING gin ("object_keys");--> statement-breakpoint
CREATE INDEX "idx_numeric_integer" ON "store_numeric" USING btree ("value_integer");--> statement-breakpoint
CREATE INDEX "idx_numeric_decimal" ON "store_numeric" USING btree ("value_decimal");--> statement-breakpoint
CREATE INDEX "idx_numeric_float" ON "store_numeric" USING btree ("value_float");--> statement-breakpoint
CREATE INDEX "idx_numeric_integer_range" ON "store_numeric" USING btree ("field_path","value_integer");--> statement-breakpoint
CREATE INDEX "idx_numeric_decimal_range" ON "store_numeric" USING btree ("field_path","value_decimal");--> statement-breakpoint
CREATE INDEX "idx_relation_target_document" ON "store_relation" USING btree ("target_document_id");--> statement-breakpoint
CREATE INDEX "idx_relation_target_collection" ON "store_relation" USING btree ("target_collection_id");--> statement-breakpoint
CREATE INDEX "idx_relation_type" ON "store_relation" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_relation_reverse" ON "store_relation" USING btree ("target_document_id","field_path");--> statement-breakpoint
CREATE INDEX "idx_relation_collection_to_collection" ON "store_relation" USING btree ("collection_id","target_collection_id");--> statement-breakpoint
CREATE INDEX "idx_text_value" ON "store_text" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_text_fulltext" ON "store_text" USING gin (to_tsvector('english', "value"));--> statement-breakpoint
CREATE INDEX "idx_text_locale_value" ON "store_text" USING btree ("locale","value");--> statement-breakpoint
CREATE INDEX "idx_text_path_value" ON "store_text" USING btree ("field_path","value");--> statement-breakpoint
CREATE VIEW "public"."current_documents" AS (select distinct "id", "document_id", "collection_id", "path", "event_type", "status", "is_deleted", "created_at", "updated_at", "created_by", "change_summary" from "documents" where "documents"."is_deleted" = false order by "documents"."collection_id", "documents"."document_id", "documents"."id" desc);