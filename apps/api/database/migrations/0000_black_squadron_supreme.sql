CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"path" varchar(255) NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "collections_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"is_current" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "document_versions_document_id_version_number_unique" UNIQUE("document_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"collection_id" uuid NOT NULL,
	"path" varchar(255),
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "documents_collection_id_path_unique" UNIQUE("collection_id","path")
);
--> statement-breakpoint
CREATE TABLE "field_values_boolean" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"array_index" integer,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value" boolean NOT NULL,
	CONSTRAINT "unique_boolean_field" UNIQUE("document_version_id","field_path","locale","array_index")
);
--> statement-breakpoint
CREATE TABLE "field_values_datetime" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"array_index" integer,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value_date" date,
	"value_time" time,
	"value_timestamp" timestamp,
	"value_timestamp_tz" timestamp with time zone,
	"date_type" varchar(20) NOT NULL,
	CONSTRAINT "unique_datetime_field" UNIQUE("document_version_id","field_path","locale","array_index")
);
--> statement-breakpoint
CREATE TABLE "field_values_file" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"array_index" integer,
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
	CONSTRAINT "unique_file_field" UNIQUE("document_version_id","field_path","locale","array_index")
);
--> statement-breakpoint
CREATE TABLE "field_values_json" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"array_index" integer,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value" jsonb NOT NULL,
	"json_schema" varchar(100),
	"object_keys" text[],
	CONSTRAINT "unique_json_field" UNIQUE("document_version_id","field_path","locale","array_index")
);
--> statement-breakpoint
CREATE TABLE "field_values_numeric" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"array_index" integer,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value_integer" integer,
	"value_decimal" numeric(10, 2),
	"value_float" real,
	"value_bigint" bigint,
	"number_type" varchar(20) NOT NULL,
	CONSTRAINT "unique_numeric_field" UNIQUE("document_version_id","field_path","locale","array_index")
);
--> statement-breakpoint
CREATE TABLE "field_values_relation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"array_index" integer,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"target_document_id" uuid NOT NULL,
	"target_collection_id" uuid NOT NULL,
	"relationship_type" varchar(50) DEFAULT 'reference',
	"cascade_delete" boolean DEFAULT false,
	CONSTRAINT "unique_relation_field" UNIQUE("document_version_id","field_path","locale","array_index")
);
--> statement-breakpoint
CREATE TABLE "field_values_text" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_version_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"field_path" varchar(500) NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"locale" varchar(10) DEFAULT 'default' NOT NULL,
	"array_index" integer,
	"parent_path" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"value" text NOT NULL,
	"word_count" integer,
	CONSTRAINT "unique_text_field" UNIQUE("document_version_id","field_path","locale","array_index")
);
--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_boolean" ADD CONSTRAINT "field_values_boolean_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_boolean" ADD CONSTRAINT "field_values_boolean_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_datetime" ADD CONSTRAINT "field_values_datetime_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_datetime" ADD CONSTRAINT "field_values_datetime_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_file" ADD CONSTRAINT "field_values_file_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_file" ADD CONSTRAINT "field_values_file_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_json" ADD CONSTRAINT "field_values_json_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_json" ADD CONSTRAINT "field_values_json_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_numeric" ADD CONSTRAINT "field_values_numeric_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_numeric" ADD CONSTRAINT "field_values_numeric_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_relation" ADD CONSTRAINT "field_values_relation_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_relation" ADD CONSTRAINT "field_values_relation_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_relation" ADD CONSTRAINT "field_values_relation_target_document_id_documents_id_fk" FOREIGN KEY ("target_document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_relation" ADD CONSTRAINT "field_values_relation_target_collection_id_collections_id_fk" FOREIGN KEY ("target_collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_text" ADD CONSTRAINT "field_values_text_document_version_id_document_versions_id_fk" FOREIGN KEY ("document_version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_values_text" ADD CONSTRAINT "field_values_text_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_boolean_value" ON "field_values_boolean" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_boolean_path_value" ON "field_values_boolean" USING btree ("field_path","value");--> statement-breakpoint
CREATE INDEX "idx_boolean_collection_value" ON "field_values_boolean" USING btree ("collection_id","field_path","value");--> statement-breakpoint
CREATE INDEX "idx_datetime_date" ON "field_values_datetime" USING btree ("value_date");--> statement-breakpoint
CREATE INDEX "idx_datetime_timestamp" ON "field_values_datetime" USING btree ("value_timestamp");--> statement-breakpoint
CREATE INDEX "idx_datetime_timestamp_tz" ON "field_values_datetime" USING btree ("value_timestamp_tz");--> statement-breakpoint
CREATE INDEX "idx_datetime_path_date" ON "field_values_datetime" USING btree ("field_path","value_timestamp");--> statement-breakpoint
CREATE INDEX "idx_datetime_collection_date" ON "field_values_datetime" USING btree ("collection_id","value_timestamp");--> statement-breakpoint
CREATE INDEX "idx_file_file_id" ON "field_values_file" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "idx_file_mime_type" ON "field_values_file" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "idx_file_size" ON "field_values_file" USING btree ("file_size");--> statement-breakpoint
CREATE INDEX "idx_file_hash" ON "field_values_file" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "idx_file_image_dimensions" ON "field_values_file" USING btree ("image_width","image_height");--> statement-breakpoint
CREATE INDEX "idx_file_storage_provider" ON "field_values_file" USING btree ("storage_provider");--> statement-breakpoint
CREATE INDEX "idx_file_processing_status" ON "field_values_file" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_json_value_gin" ON "field_values_json" USING gin ("value");--> statement-breakpoint
CREATE INDEX "idx_json_schema" ON "field_values_json" USING btree ("json_schema");--> statement-breakpoint
CREATE INDEX "idx_json_keys" ON "field_values_json" USING gin ("object_keys");--> statement-breakpoint
CREATE INDEX "idx_numeric_integer" ON "field_values_numeric" USING btree ("value_integer");--> statement-breakpoint
CREATE INDEX "idx_numeric_decimal" ON "field_values_numeric" USING btree ("value_decimal");--> statement-breakpoint
CREATE INDEX "idx_numeric_float" ON "field_values_numeric" USING btree ("value_float");--> statement-breakpoint
CREATE INDEX "idx_numeric_integer_range" ON "field_values_numeric" USING btree ("field_path","value_integer");--> statement-breakpoint
CREATE INDEX "idx_numeric_decimal_range" ON "field_values_numeric" USING btree ("field_path","value_decimal");--> statement-breakpoint
CREATE INDEX "idx_relation_target_document" ON "field_values_relation" USING btree ("target_document_id");--> statement-breakpoint
CREATE INDEX "idx_relation_target_collection" ON "field_values_relation" USING btree ("target_collection_id");--> statement-breakpoint
CREATE INDEX "idx_relation_type" ON "field_values_relation" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_relation_reverse" ON "field_values_relation" USING btree ("target_document_id","field_path");--> statement-breakpoint
CREATE INDEX "idx_relation_collection_to_collection" ON "field_values_relation" USING btree ("collection_id","target_collection_id");--> statement-breakpoint
CREATE INDEX "idx_text_value" ON "field_values_text" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_text_fulltext" ON "field_values_text" USING gin (to_tsvector('english', "value"));--> statement-breakpoint
CREATE INDEX "idx_text_locale_value" ON "field_values_text" USING btree ("locale","value");--> statement-breakpoint
CREATE INDEX "idx_text_path_value" ON "field_values_text" USING btree ("field_path","value");