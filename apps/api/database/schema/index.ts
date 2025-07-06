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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Documents table - main entity records
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  path: varchar('path', { length: 255 }),
  status: varchar('status', { length: 50 }).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ([
  unique().on(table.collectionId, table.path),
]));

// Document versions for versioning support
export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: integer('version_number').notNull(),
  isCurrent: boolean('is_current').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by'), // TODO: Reference to users table
}, (table) => ([
  unique().on(table.documentId, table.versionNumber),
]));

// Base field values structure (shared metadata)
const baseFieldValueColumns = {
  id: uuid('id').primaryKey(),
  documentVersionId: uuid('document_version_id').references(() => documentVersions.id, { onDelete: 'cascade' }).notNull(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(), // For cross-collection queries
  fieldPath: varchar('field_path', { length: 500 }).notNull(),
  fieldName: varchar('field_name', { length: 255 }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull().default('default'),

  // Array and nesting support
  arrayIndex: integer('array_index'),
  parentPath: varchar('parent_path', { length: 500 }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
};

// 1. TEXT FIELDS TABLE
export const fieldValuesText = pgTable('field_values_text', {
  ...baseFieldValueColumns,

  value: text('value').notNull(),
  wordCount: integer('word_count'), // Pre-computed for analytics

}, (table) => ([
  // Optimized indexes for text operations
  index('idx_text_value').on(table.value),
  index('idx_text_fulltext').using('gin', sql`to_tsvector('english', ${table.value})`),
  index('idx_text_locale_value').on(table.locale, table.value),
  index('idx_text_path_value').on(table.fieldPath, table.value),
  // Unique constraints for unique fields
  unique('unique_text_field').on(table.documentVersionId, table.fieldPath, table.locale, table.arrayIndex),
]));

// 2. NUMERIC FIELDS TABLE  
export const fieldValuesNumeric = pgTable('field_values_numeric', {
  ...baseFieldValueColumns,

  valueInteger: integer('value_integer'),
  valueDecimal: decimal('value_decimal', { precision: 10, scale: 2 }),
  valueFloat: real('value_float'),
  valueBigInt: bigint('value_bigint', { mode: 'bigint' }),

  // Store the original number type for reconstruction
  numberType: varchar('number_type', { length: 20 }).notNull(), // 'integer', 'decimal', 'float', 'bigint'

}, (table) => ([
  // Optimized indexes for numeric operations
  index('idx_numeric_integer').on(table.valueInteger),
  index('idx_numeric_decimal').on(table.valueDecimal),
  index('idx_numeric_float').on(table.valueFloat),

  // Range indexes for common queries
  index('idx_numeric_integer_range').on(table.fieldPath, table.valueInteger),
  index('idx_numeric_decimal_range').on(table.fieldPath, table.valueDecimal),

  unique('unique_numeric_field').on(table.documentVersionId, table.fieldPath, table.locale, table.arrayIndex),
]));

// 3. BOOLEAN FIELDS TABLE
export const fieldValuesBoolean = pgTable('field_values_boolean', {
  ...baseFieldValueColumns,

  value: boolean('value').notNull(),

}, (table) => ([
  // Simple but effective indexes for boolean queries
  index('idx_boolean_value').on(table.value),
  index('idx_boolean_path_value').on(table.fieldPath, table.value),
  index('idx_boolean_collection_value').on(table.collectionId, table.fieldPath, table.value),
  unique('unique_boolean_field').on(table.documentVersionId, table.fieldPath, table.locale, table.arrayIndex),
]));

// 4. DATE/TIME FIELDS TABLE
export const fieldValuesDateTime = pgTable('field_values_datetime', {
  ...baseFieldValueColumns,
  valueDate: date('value_date'),
  valueTime: time('value_time'),
  valueTimestamp: timestamp('value_timestamp'),
  valueTimestampTz: timestamp('value_timestamp_tz', { withTimezone: true }),

  // Store the original date type for reconstruction
  dateType: varchar('date_type', { length: 20 }).notNull(), // 'date', 'time', 'timestamp', 'timestamptz'

}, (table) => ([
  // Optimized for date range queries
  index('idx_datetime_date').on(table.valueDate),
  index('idx_datetime_timestamp').on(table.valueTimestamp),
  index('idx_datetime_timestamp_tz').on(table.valueTimestampTz),

  // Common date query patterns
  index('idx_datetime_path_date').on(table.fieldPath, table.valueTimestamp),
  index('idx_datetime_collection_date').on(table.collectionId, table.valueTimestamp),

  unique('unique_datetime_field').on(table.documentVersionId, table.fieldPath, table.locale, table.arrayIndex),
]));

// 5. RELATION FIELDS TABLE
export const fieldValuesRelation = pgTable('field_values_relation', {
  ...baseFieldValueColumns,

  targetDocumentId: uuid('target_document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  targetCollectionId: uuid('target_collection_id').references(() => collections.id).notNull(),

  // Relationship metadata
  relationshipType: varchar('relationship_type', { length: 50 }).default('reference'), // 'reference', 'embed', 'weak'
  cascadeDelete: boolean('cascade_delete').default(false),

}, (table) => ([
  // Critical indexes for relationship queries
  index('idx_relation_target_document').on(table.targetDocumentId),
  index('idx_relation_target_collection').on(table.targetCollectionId),
  index('idx_relation_type').on(table.relationshipType),

  // Reverse relationship lookup
  index('idx_relation_reverse').on(table.targetDocumentId, table.fieldPath),

  // Cross-collection relationship queries
  index('idx_relation_collection_to_collection').on(table.collectionId, table.targetCollectionId),

  unique('unique_relation_field').on(table.documentVersionId, table.fieldPath, table.locale, table.arrayIndex),
]));

// 6. FILE FIELDS TABLE (Your composite type example)
export const fieldValuesFile = pgTable('field_values_file', {
  ...baseFieldValueColumns,

  // File identity
  fileId: uuid('file_id').notNull(), // Reference to file storage system
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),

  // File metadata
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(), // Size in bytes
  fileHash: varchar('file_hash', { length: 64 }), // SHA-256 hash for deduplication

  // Storage information
  storageProvider: varchar('storage_provider', { length: 50 }).notNull(), // 'local', 's3', 'gcs', etc.
  storagePath: text('storage_path').notNull(),
  storageUrl: text('storage_url'), // CDN or direct URL

  // Image-specific metadata (when applicable)
  imageWidth: integer('image_width'),
  imageHeight: integer('image_height'),
  imageFormat: varchar('image_format', { length: 20 }),

  // File processing status
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'), // 'pending', 'processing', 'completed', 'failed'
  thumbnailGenerated: boolean('thumbnail_generated').default(false),

}, (table) => ([
  // File-specific indexes
  index('idx_file_file_id').on(table.fileId),
  index('idx_file_mime_type').on(table.mimeType),
  index('idx_file_size').on(table.fileSize),
  index('idx_file_hash').on(table.fileHash),

  // Image queries
  index('idx_file_image_dimensions').on(table.imageWidth, table.imageHeight),

  // Storage queries
  index('idx_file_storage_provider').on(table.storageProvider),
  index('idx_file_processing_status').on(table.processingStatus),

  unique('unique_file_field').on(table.documentVersionId, table.fieldPath, table.locale, table.arrayIndex),
]));

// 7. JSON/STRUCTURED DATA FIELDS TABLE
export const fieldValuesJson = pgTable('field_values_json', {
  ...baseFieldValueColumns,

  value: jsonb('value').notNull(),

  // JSON metadata for optimization
  jsonSchema: varchar('json_schema', { length: 100 }), // Schema identifier for validation
  objectKeys: text('object_keys').array(), // Array of top-level keys for indexing

}, (table) => ([
  // JSONB indexes
  index('idx_json_value_gin').using('gin', table.value),
  index('idx_json_schema').on(table.jsonSchema),
  index('idx_json_keys').using('gin', table.objectKeys),

  unique('unique_json_field').on(table.documentVersionId, table.fieldPath, table.locale, table.arrayIndex),
]));

// RELATIONS
// =========

export const collectionsRelations = relations(collections, ({ many }) => ({
  documents: many(documents),
  fieldValues: many(fieldValuesText), // All field tables reference collections
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  collection: one(collections, {
    fields: [documents.collectionId],
    references: [collections.id],
  }),
  versions: many(documentVersions),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one, many }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
  textValues: many(fieldValuesText),
  numericValues: many(fieldValuesNumeric),
  booleanValues: many(fieldValuesBoolean),
  dateTimeValues: many(fieldValuesDateTime),
  relationValues: many(fieldValuesRelation),
  fileValues: many(fieldValuesFile),
  jsonValues: many(fieldValuesJson),
}));

// Field value relations
export const fieldValuesTextRelations = relations(fieldValuesText, ({ one }) => ({
  documentVersion: one(documentVersions, {
    fields: [fieldValuesText.documentVersionId],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesText.collectionId],
    references: [collections.id],
  }),
}));

export const fieldValuesNumericRelations = relations(fieldValuesNumeric, ({ one }) => ({
  documentVersion: one(documentVersions, {
    fields: [fieldValuesNumeric.documentVersionId],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesNumeric.collectionId],
    references: [collections.id],
  }),
}));

export const fieldValuesBooleanRelations = relations(fieldValuesBoolean, ({ one }) => ({
  documentVersion: one(documentVersions, {
    fields: [fieldValuesBoolean.documentVersionId],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesBoolean.collectionId],
    references: [collections.id],
  }),
}));

export const fieldValuesDateTimeRelations = relations(fieldValuesDateTime, ({ one }) => ({
  documentVersion: one(documentVersions, {
    fields: [fieldValuesDateTime.documentVersionId],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesDateTime.collectionId],
    references: [collections.id],
  }),
}));

export const fieldValuesRelationRelations = relations(fieldValuesRelation, ({ one }) => ({
  documentVersion: one(documentVersions, {
    fields: [fieldValuesRelation.documentVersionId],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesRelation.collectionId],
    references: [collections.id],
  }),
  targetDocument: one(documents, {
    fields: [fieldValuesRelation.targetDocumentId],
    references: [documents.id],
  }),
  targetCollection: one(collections, {
    fields: [fieldValuesRelation.targetCollectionId],
    references: [collections.id],
  }),
}));

export const fieldValuesFileRelations = relations(fieldValuesFile, ({ one }) => ({
  documentVersion: one(documentVersions, {
    fields: [fieldValuesFile.documentVersionId],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesFile.collectionId],
    references: [collections.id],
  }),
}));

export const fieldValuesJsonRelations = relations(fieldValuesJson, ({ one }) => ({
  documentVersion: one(documentVersions, {
    fields: [fieldValuesJson.documentVersionId],
    references: [documentVersions.id],
  }),
  collection: one(collections, {
    fields: [fieldValuesJson.collectionId],
    references: [collections.id],
  }),
}));