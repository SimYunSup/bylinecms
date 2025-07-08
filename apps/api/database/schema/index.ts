// import { getAllTableSchemas } from '@byline/byline/drizzle-schemas'


import { relations, sql } from 'drizzle-orm';
import { bigint, boolean, date, decimal, index, integer, jsonb, pgTable, real, text, time, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

// export const tables = getAllTableSchemas()

// export default tables

// export * from '@byline/byline/drizzle-schemas';

// Collections table - stores collection configurations
export const collections = pgTable('collections', {
  id: uuid('id').primaryKey(),
  path: varchar('path', { length: 255 }).unique().notNull(),
  config: jsonb('config').notNull(), // Store CollectionConfig
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Documents table - main entity records
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  collection_id: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  path: varchar('path', { length: 255 }),
  status: varchar('status', { length: 50 }).default('draft'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ([
  unique().on(table.collection_id, table.path),
]));

// Document versions for versioning support
export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey(),
  document_id: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  version_number: integer('version_number').notNull(),
  is_current: boolean('is_current').default(false),
  created_at: timestamp('created_at').defaultNow(),
  created_by: uuid('created_by'), // TODO: Reference to users table
}, (table) => ([
  unique().on(table.document_id, table.version_number),
]));

// Base field values structure (shared metadata)
const baseFieldValueColumns = {
  id: uuid('id').primaryKey(),
  document_version_id: uuid('document_version_id').references(() => documentVersions.id, { onDelete: 'cascade' }).notNull(),
  collection_id: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(), // For cross-collection queries
  field_path: varchar('field_path', { length: 500 }).notNull(),
  field_name: varchar('field_name', { length: 255 }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull().default('default'),

  // Array and nesting support
  array_index: integer('array_index'),
  parent_path: varchar('parent_path', { length: 500 }),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
};

// 1. TEXT FIELDS TABLE
export const fieldValuesText = pgTable('field_values_text', {
  ...baseFieldValueColumns,

  value: text('value').notNull(),
  word_count: integer('word_count'), // Pre-computed for analytics

}, (table) => ([
  // Optimized indexes for text operations
  index('idx_text_value').on(table.value),
  index('idx_text_fulltext').using('gin', sql`to_tsvector('english', ${table.value})`),
  index('idx_text_locale_value').on(table.locale, table.value),
  index('idx_text_path_value').on(table.field_path, table.value),
  // Unique constraints for unique fields
  unique('unique_text_field').on(table.document_version_id, table.field_path, table.locale, table.array_index),
]));

// 2. NUMERIC FIELDS TABLE  
export const fieldValuesNumeric = pgTable('field_values_numeric', {
  ...baseFieldValueColumns,

  value_integer: integer('value_integer'),
  value_decimal: decimal('value_decimal', { precision: 10, scale: 2 }),
  value_float: real('value_float'),
  value_bigint: bigint('value_bigint', { mode: 'bigint' }),

  // Store the original number type for reconstruction
  number_type: varchar('number_type', { length: 20 }).notNull(), // 'integer', 'decimal', 'float', 'bigint'

}, (table) => ([
  // Optimized indexes for numeric operations
  index('idx_numeric_integer').on(table.value_integer),
  index('idx_numeric_decimal').on(table.value_decimal),
  index('idx_numeric_float').on(table.value_float),

  // Range indexes for common queries
  index('idx_numeric_integer_range').on(table.field_path, table.value_integer),
  index('idx_numeric_decimal_range').on(table.field_path, table.value_decimal),

  unique('unique_numeric_field').on(table.document_version_id, table.field_path, table.locale, table.array_index),
]));

// 3. BOOLEAN FIELDS TABLE
export const fieldValuesBoolean = pgTable('field_values_boolean', {
  ...baseFieldValueColumns,

  value: boolean('value').notNull(),

}, (table) => ([
  // Simple but effective indexes for boolean queries
  index('idx_boolean_value').on(table.value),
  index('idx_boolean_path_value').on(table.field_path, table.value),
  index('idx_boolean_collection_value').on(table.collection_id, table.field_path, table.value),
  unique('unique_boolean_field').on(table.document_version_id, table.field_path, table.locale, table.array_index),
]));

// 4. DATE/TIME FIELDS TABLE
export const fieldValuesDatetime = pgTable('field_values_datetime', {
  ...baseFieldValueColumns,
  value_date: date('value_date'),
  value_time: time('value_time'),
  value_timestamp: timestamp('value_timestamp'),
  value_timestamp_tz: timestamp('value_timestamp_tz', { withTimezone: true }),

  // Store the original date type for reconstruction
  date_type: varchar('date_type', { length: 20 }).notNull(), // 'date', 'time', 'timestamp', 'timestamptz'

}, (table) => ([
  // Optimized for date range queries
  index('idx_datetime_date').on(table.value_date),
  index('idx_datetime_timestamp').on(table.value_timestamp),
  index('idx_datetime_timestamp_tz').on(table.value_timestamp_tz),

  // Common date query patterns
  index('idx_datetime_path_date').on(table.field_path, table.value_timestamp),
  index('idx_datetime_collection_date').on(table.collection_id, table.value_timestamp),

  unique('unique_datetime_field').on(table.document_version_id, table.field_path, table.locale, table.array_index),
]));

// 5. RELATION FIELDS TABLE
export const fieldValuesRelation = pgTable('field_values_relation', {
  ...baseFieldValueColumns,

  // target_document_id: uuid('target_document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  target_document_id: uuid('target_document_id').references(() => documents.id, { onDelete: 'restrict' }).notNull(),
  target_collection_id: uuid('target_collection_id').references(() => collections.id).notNull(),

  // Relationship metadata
  relationship_type: varchar('relationship_type', { length: 50 }).default('reference'), // 'reference', 'embed', 'weak'
  cascade_delete: boolean('cascade_delete').default(false),

}, (table) => ([
  // Critical indexes for relationship queries
  index('idx_relation_target_document').on(table.target_document_id),
  index('idx_relation_target_collection').on(table.target_collection_id),
  index('idx_relation_type').on(table.relationship_type),

  // Reverse relationship lookup
  index('idx_relation_reverse').on(table.target_document_id, table.field_path),

  // Cross-collection relationship queries
  index('idx_relation_collection_to_collection').on(table.collection_id, table.target_collection_id),

  unique('unique_relation_field').on(table.document_version_id, table.field_path, table.locale, table.array_index),
]));

// 6. FILE FIELDS TABLE (Your composite type example)
export const fieldValuesFile = pgTable('field_values_file', {
  ...baseFieldValueColumns,

  // File identity
  file_id: uuid('file_id').notNull(), // Reference to file storage system
  filename: varchar('filename', { length: 255 }).notNull(),
  original_filename: varchar('original_filename', { length: 255 }).notNull(),

  // File metadata
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  file_size: bigint('file_size', { mode: 'number' }).notNull(), // Size in bytes
  file_hash: varchar('file_hash', { length: 64 }), // SHA-256 hash for deduplication

  // Storage information
  storage_provider: varchar('storage_provider', { length: 50 }).notNull(), // 'local', 's3', 'gcs', etc.
  storage_path: text('storage_path').notNull(),
  storage_url: text('storage_url'), // CDN or direct URL

  // Image-specific metadata (when applicable)
  image_width: integer('image_width'),
  image_height: integer('image_height'),
  image_format: varchar('image_format', { length: 20 }),

  // File processing status
  processing_status: varchar('processing_status', { length: 20 }).default('pending'), // 'pending', 'processing', 'completed', 'failed'
  thumbnail_generated: boolean('thumbnail_generated').default(false),

}, (table) => ([
  // File-specific indexes
  index('idx_file_file_id').on(table.file_id),
  index('idx_file_mime_type').on(table.mime_type),
  index('idx_file_size').on(table.file_size),
  index('idx_file_hash').on(table.file_hash),

  // Image queries
  index('idx_file_image_dimensions').on(table.image_width, table.image_height),

  // Storage queries
  index('idx_file_storage_provider').on(table.storage_provider),
  index('idx_file_processing_status').on(table.processing_status),

  unique('unique_file_field').on(table.document_version_id, table.field_path, table.locale, table.array_index),
]));

// 7. JSON/STRUCTURED DATA FIELDS TABLE
export const fieldValuesJson = pgTable('field_values_json', {
  ...baseFieldValueColumns,

  value: jsonb('value').notNull(),
  // JSON metadata for optimization
  json_schema: varchar('json_schema', { length: 100 }), // Schema identifier for validation
  object_keys: text('object_keys').array(), // Array of top-level keys for indexing

}, (table) => ([
  // JSONB indexes
  index('idx_json_value_gin').using('gin', table.value),
  index('idx_json_schema').on(table.json_schema),
  index('idx_json_keys').using('gin', table.object_keys),

  unique('unique_json_field').on(table.document_version_id, table.field_path, table.locale, table.array_index),
]));

// RELATIONS
// =========

export const collections_relations = relations(collections, ({ many }) => ({
  documents: many(documents),
  field_values: many(fieldValuesText), // All field tables reference collections
}));

export const documents_relations = relations(documents, ({ one, many }) => ({
  collection: one(collections, {
    fields: [documents.collection_id],
    references: [collections.id],
  }),
  versions: many(documentVersions),
}));

export const document_versions_relations = relations(documentVersions, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentVersions.document_id],
    references: [documents.id],
  }),
  text_values: many(fieldValuesText),
  numeric_values: many(fieldValuesNumeric),
  boolean_values: many(fieldValuesBoolean),
  datetime_values: many(fieldValuesDatetime),
  relation_values: many(fieldValuesRelation),
  file_values: many(fieldValuesFile),
  json_values: many(fieldValuesJson),
}));

// Field value relations
export const field_values_text_relations = relations(fieldValuesText, ({ one }) => ({
  document_version: one(documentVersions, {
    fields: [fieldValuesText.document_version_id],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesText.collection_id],
    references: [collections.id],
  }),
}));

export const field_values_numeric_relations = relations(fieldValuesNumeric, ({ one }) => ({
  document_version: one(documentVersions, {
    fields: [fieldValuesNumeric.document_version_id],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesNumeric.collection_id],
    references: [collections.id],
  }),
}));

export const field_values_boolean_relations = relations(fieldValuesBoolean, ({ one }) => ({
  document_version: one(documentVersions, {
    fields: [fieldValuesBoolean.document_version_id],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesBoolean.collection_id],
    references: [collections.id],
  }),
}));

export const field_values_datetime_relations = relations(fieldValuesDatetime, ({ one }) => ({
  document_version: one(documentVersions, {
    fields: [fieldValuesDatetime.document_version_id],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesDatetime.collection_id],
    references: [collections.id],
  }),
}));

export const field_values_relation_relations = relations(fieldValuesRelation, ({ one }) => ({
  document_version: one(documentVersions, {
    fields: [fieldValuesRelation.document_version_id],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesRelation.collection_id],
    references: [collections.id],
  }),
  target_document: one(documents, {
    fields: [fieldValuesRelation.target_document_id],
    references: [documents.id],
  }),
  target_collection: one(collections, {
    fields: [fieldValuesRelation.target_collection_id],
    references: [collections.id],
  }),
}));

export const field_values_file_relations = relations(fieldValuesFile, ({ one }) => ({
  document_version: one(documentVersions, {
    fields: [fieldValuesFile.document_version_id],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesFile.collection_id],
    references: [collections.id],
  }),
}));

export const field_values_json_relations = relations(fieldValuesJson, ({ one }) => ({
  document_version: one(documentVersions, {
    fields: [fieldValuesJson.document_version_id],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesJson.collection_id],
    references: [collections.id],
  }),
}));