// import { getAllTableSchemas } from '@byline/byline/drizzle-schemas'


import { desc, eq, relations, sql } from 'drizzle-orm';
import { bigint, boolean, date, decimal, index, integer, jsonb, pgTable, pgView, real, text, time, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';


// export const tables = getAllTableSchemas()

// export default tables

// export * from '@byline/byline/drizzle-schemas';

// Collections table
export const collections = pgTable('collections', {
  id: uuid('id').primaryKey(),
  path: varchar('path', { length: 255 }).unique().notNull(),
  singular: text('singular').notNull(), // Singular label for the collection
  plural: text('plural').notNull(), // Plural label for the collection
  config: jsonb('config').notNull(), // Store CollectionConfig
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(), // UUIDv7 versioning by default
  document_id: uuid('document_id').notNull(), // Logical document ID (constant across versions)
  collection_id: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  path: varchar('path', { length: 255 }).notNull(), // Can change between versions
  doc: jsonb('doc'), // optionally store the original document
  event_type: varchar('event_type', { length: 20 }).notNull().default('create'), // 'create', 'update', 'delete'
  status: varchar('status', { length: 50 }).default('draft'),
  is_deleted: boolean('is_deleted').default(false), // Tombstone for soft deletes
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  created_by: uuid('created_by'),
  change_summary: text('change_summary'),

}, (table) => ([
  // Index for finding all versions of a logical document
  index('idx_documents_document_id').on(table.document_id),
  // Index for current document lookup by path
  index('idx_documents_collection_path_deleted').on(table.collection_id, table.path, table.is_deleted),
  // Index for current document lookup by logical document ID
  index('idx_documents_collection_document_deleted').on(table.collection_id, table.document_id, table.is_deleted),
  // Index to optimize the current documents view
  index('idx_documents_current_view').on(table.collection_id, table.document_id, table.is_deleted, table.id),
  // Event and audit indexes
  index('idx_documents_event_type').on(table.event_type),
  index('idx_documents_created_at').on(table.created_at),
  // Ensure logical document belongs to only one collection
  index('idx_documents_document_collection').on(table.document_id, table.collection_id),
  // Ensure unique path per collection (for undeleted documents)
  // unique('unique_document_path').on(table.collection_id, table.document_id, table.path, table.is_deleted),
]));

// Current Documents View - gets latest version of each logical document
export const currentDocumentsView = pgView("current_documents").as((qb) => {
  return qb
    .selectDistinct({
      id: documents.id, // Version ID
      document_id: documents.document_id, // Logical document ID
      collection_id: documents.collection_id,
      path: documents.path,
      event_type: documents.event_type,
      status: documents.status,
      is_deleted: documents.is_deleted,
      created_at: documents.created_at,
      updated_at: documents.updated_at,
      created_by: documents.created_by,
      change_summary: documents.change_summary,
    })
    .from(documents)
    // TODO - remove so that we can optionally show deleted documents in history
    // as well as offer the option to recover a deleted document.
    .where(eq(documents.is_deleted, false))
    .orderBy(
      documents.collection_id,
      documents.document_id,
      desc(documents.id) // Latest version (UUIDv7) first
    );
});

// Base field values structure
const baseStoreColumns = {
  id: uuid('id').primaryKey(),
  document_version_id: uuid('document_version_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(), // References the version ID
  collection_id: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(), // For cross-collection queries
  field_path: varchar('field_path', { length: 500 }).notNull(),
  field_name: varchar('field_name', { length: 255 }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull().default('default'),
  parent_path: varchar('parent_path', { length: 500 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
};

// 1. TEXT FIELDS TABLE
export const textStore = pgTable('store_text', {
  ...baseStoreColumns,

  value: text('value').notNull(),
  word_count: integer('word_count'), // Pre-computed for analytics

}, (table) => ([
  // Optimized indexes for text operations
  index('idx_text_value').on(table.value),
  index('idx_text_fulltext').using('gin', sql`to_tsvector('english', ${table.value})`),
  index('idx_text_locale_value').on(table.locale, table.value),
  index('idx_text_path_value').on(table.field_path, table.value),
  // Unique constraints for unique fields
  unique('unique_text_field').on(table.document_version_id, table.field_path, table.locale),
]));

// 2. NUMERIC FIELDS TABLE  
export const numericStore = pgTable('store_numeric', {
  ...baseStoreColumns,

  // Store the original number type for reconstruction
  number_type: varchar('number_type', { length: 20 }).notNull(), // 'integer', 'decimal', 'float'

  value_integer: integer('value_integer'),
  value_decimal: decimal('value_decimal', { precision: 10, scale: 2 }),
  value_float: real('value_float'),

}, (table) => ([
  // Optimized indexes for numeric operations
  index('idx_numeric_integer').on(table.value_integer),
  index('idx_numeric_decimal').on(table.value_decimal),
  index('idx_numeric_float').on(table.value_float),

  // Range indexes for common queries
  index('idx_numeric_integer_range').on(table.field_path, table.value_integer),
  index('idx_numeric_decimal_range').on(table.field_path, table.value_decimal),

  unique('unique_numeric_field').on(table.document_version_id, table.field_path, table.locale),
]));

// 3. BOOLEAN FIELDS TABLE
export const booleanStore = pgTable('store_boolean', {
  ...baseStoreColumns,

  value: boolean('value').notNull(),

}, (table) => ([
  // Simple but effective indexes for boolean queries
  index('idx_boolean_value').on(table.value),
  index('idx_boolean_path_value').on(table.field_path, table.value),
  index('idx_boolean_collection_value').on(table.collection_id, table.field_path, table.value),
  unique('unique_boolean_field').on(table.document_version_id, table.field_path, table.locale),
]));

// 4. DATE/TIME FIELDS TABLE
export const datetimeStore = pgTable('store_datetime', {
  ...baseStoreColumns,

  // Store the original date type for reconstruction
  date_type: varchar('date_type', { length: 20 }).notNull(), // 'date', 'time', 'timestamptz'

  value_date: date('value_date'),
  value_time: time('value_time'),
  value_timestamp_tz: timestamp('value_timestamp_tz', { withTimezone: true }),
}, (table) => ([
  // Optimized for date range queries
  index('idx_datetime_date').on(table.value_date),
  index('idx_datetime_timestamp_tz').on(table.value_timestamp_tz),
  // Common date query patterns
  index('idx_datetime_path_date').on(table.field_path, table.value_timestamp_tz),
  index('idx_datetime_collection_date').on(table.collection_id, table.value_timestamp_tz),
  unique('unique_datetime_field').on(table.document_version_id, table.field_path, table.locale),
]));

// 5. RELATION FIELDS TABLE
export const relationStore = pgTable('store_relation', {
  ...baseStoreColumns,

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

  unique('unique_relation_field').on(table.document_version_id, table.field_path, table.locale),
]));

// 6. FILE FIELDS TABLE (Your composite type example)
export const fileStore = pgTable('store_file', {
  ...baseStoreColumns,

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

  unique('unique_file_field').on(table.document_version_id, table.field_path, table.locale),
]));

// 7. JSON/STRUCTURED DATA FIELDS TABLE
export const jsonStore = pgTable('store_json', {
  ...baseStoreColumns,

  value: jsonb('value').notNull(),
  // JSON metadata for optimization
  json_schema: varchar('json_schema', { length: 100 }), // Schema identifier for validation
  object_keys: text('object_keys').array(), // Array of top-level keys for indexing

}, (table) => ([
  // JSONB indexes
  index('idx_json_value_gin').using('gin', table.value),
  index('idx_json_schema').on(table.json_schema),
  index('idx_json_keys').using('gin', table.object_keys),

  unique('unique_json_field').on(table.document_version_id, table.field_path, table.locale),
]));

// RELATIONS
// =========

export const collections_relations = relations(collections, ({ many }) => ({
  documents: many(documents),
  field_values: many(textStore), // All field tables reference collections
}));

export const documents_relations = relations(documents, ({ one, many }) => ({
  collection: one(collections, {
    fields: [documents.collection_id],
    references: [collections.id],
  }),
  text_values: many(textStore),
  numeric_values: many(numericStore),
  boolean_values: many(booleanStore),
  datetime_values: many(datetimeStore),
  relation_values: many(relationStore),
  file_values: many(fileStore),
  json_values: many(jsonStore),
}));

// Field value relations
export const text_store_relations = relations(textStore, ({ one }) => ({
  document: one(documents, {
    fields: [textStore.document_version_id],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [textStore.collection_id],
    references: [collections.id],
  }),
}));

export const numeric_store_relations = relations(numericStore, ({ one }) => ({
  document: one(documents, {
    fields: [numericStore.document_version_id],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [numericStore.collection_id],
    references: [collections.id],
  }),
}));

export const boolean_store_relations = relations(booleanStore, ({ one }) => ({
  document: one(documents, {
    fields: [booleanStore.document_version_id],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [booleanStore.collection_id],
    references: [collections.id],
  }),
}));

export const datetime_store_relations = relations(datetimeStore, ({ one }) => ({
  document: one(documents, {
    fields: [datetimeStore.document_version_id],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [datetimeStore.collection_id],
    references: [collections.id],
  }),
}));

export const relation_store_relations = relations(relationStore, ({ one }) => ({
  document: one(documents, {
    fields: [relationStore.document_version_id],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [relationStore.collection_id],
    references: [collections.id],
  }),
  target_document: one(documents, {
    fields: [relationStore.target_document_id],
    references: [documents.id],
  }),
  target_collection: one(collections, {
    fields: [relationStore.target_collection_id],
    references: [collections.id],
  }),
}));

export const file_store_relations = relations(fileStore, ({ one }) => ({
  document: one(documents, {
    fields: [fileStore.document_version_id],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [fileStore.collection_id],
    references: [collections.id],
  }),
}));

export const json_store_relations = relations(jsonStore, ({ one }) => ({
  document: one(documents, {
    fields: [jsonStore.document_version_id],
    references: [documents.id],
  }),
  collection: one(collections, {
    fields: [jsonStore.collection_id],
    references: [collections.id],
  }),
}));