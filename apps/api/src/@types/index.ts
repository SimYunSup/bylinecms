// TYPE DEFINITIONS
// ===============

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type DatabaseConnection = NodePgDatabase<any>;

export interface ParsedFieldPath {
  basePath: string;
  segments: {
    field: string;
  }[]
}

export interface SiteConfig {
  i18n: {
    defaultLocale: string;
    locales: string[];
  }
}

export interface CollectionConfig {
  path: string;
  labels: {
    singular: string;
    plural: string;
  };
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  type: 'text' | 'richText' | 'array' | 'number' | 'integer' | 'decimal' | 'boolean' | 'datetime' | 'relation' | 'file' | 'image' | 'json' | 'object';
  required?: boolean;
  unique?: boolean;
  localized?: boolean;
  fields?: FieldConfig[]; // For array fields
}

// Utility type to exclude 'array' from field types
export type NonArrayFieldType = Exclude<FieldConfig['type'], 'array'>;

export interface BaseFieldValue {
  field_path: string;
  field_name: string;
  locale: string;
  parent_path?: string;
}

export interface TextFieldValue extends BaseFieldValue {
  field_type: 'text';
  value: string; // Should only be string after flattening
}

export interface NumericFieldValue extends BaseFieldValue {
  field_type: 'number' | 'integer' | 'decimal';
  value: number;
}

export interface BooleanFieldValue extends BaseFieldValue {
  field_type: 'boolean';
  value: boolean;
}

export interface DateTimeFieldValue extends BaseFieldValue {
  field_type: 'datetime';
  date_type: 'timestamp' | 'timestampTz' | 'date' | 'time';
  value_time: string;
  value_date: Date;
  value_timestamp: Date,
  value_timestamp_tz: Date,
}

export interface FileFieldValue extends BaseFieldValue {
  field_type: 'file' | 'image';
  file_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_provider: string;
  storage_path: string;
  storage_url?: string;
  file_hash?: string;
  image_width?: number;
  image_height?: number;
  image_format?: string;
  processing_status?: string;
  thumbnail_generated?: boolean;
}

export interface RelationFieldValue extends BaseFieldValue {
  field_type: 'relation';
  target_document_id: string;
  target_collection_id: string;
  relationship_type?: string;
  cascade_delete?: boolean;
}

export interface RichTextFieldValue extends BaseFieldValue {
  field_type: 'richText';
  value: any; // JSON content
}

export interface JsonFieldValue extends BaseFieldValue {
  field_type: 'json' | 'object';
  value: any;
  json_schema?: string;
  object_keys?: string[];
}

// Discriminated union of all field value types
export type FlattenedFieldValue =
  | TextFieldValue
  | RichTextFieldValue
  | NumericFieldValue
  | BooleanFieldValue
  | DateTimeFieldValue
  | FileFieldValue
  | RelationFieldValue
  | JsonFieldValue;

// Type guards for runtime checking
export function isFileFieldValue(fieldValue: FlattenedFieldValue): fieldValue is FileFieldValue {
  return fieldValue.field_type === 'file' || fieldValue.field_type === 'image';
}

export function isRelationFieldValue(fieldValue: FlattenedFieldValue): fieldValue is RelationFieldValue {
  return fieldValue.field_type === 'relation';
}

export function isJsonFieldValue(fieldValue: FlattenedFieldValue): fieldValue is JsonFieldValue {
  return fieldValue.field_type === 'json' || fieldValue.field_type === 'object';
}

export function isNumericFieldValue(fieldValue: FlattenedFieldValue): fieldValue is NumericFieldValue {
  return ['number', 'integer', 'decimal'].includes(fieldValue.field_type);
}

export interface ReconstructedFieldValue {
  id: string;
  field_type: string;
  document_version_id: string;
  collection_id: string;
  field_path: string;
  field_name: string;
  locale: string;
  parent_path?: string | null;
  value: any;
}

// Standardized field value structure for unified processing
export interface UnifiedFieldValue {
  id: string;
  document_version_id: string;
  collection_id: string;
  field_type: string;
  field_path: string;
  field_name: string;
  locale: string;
  parent_path: string | null;

  // Value fields - only one will be populated per row
  text_value: string | null;
  numeric_value: string | null; // Converted to string for uniformity
  boolean_value: boolean | null;
  json_value: any | null;

  // Specialized fields for complex types
  date_type: string | null;
  value_date: Date | null;
  value_time: string | null;
  value_timestamp: Date | null;
  value_timestamp_tz: Date | null;

  // File fields
  file_id: string | null;
  filename: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  storage_provider: string | null;
  storage_path: string | null;
  storage_url: string | null;
  file_hash: string | null;
  image_width: number | null;
  image_height: number | null;
  image_format: string | null;
  processing_status: string | null;
  thumbnail_generated: boolean | null;

  // Relation fields
  target_document_id: string | null;
  target_collection_id: string | null;
  relationship_type: string | null;
  cascade_delete: boolean | null;

  // JSON fields
  json_schema: string | null;
  object_keys: string[] | null;

  // Numeric field type info
  number_type: string | null;
  value_integer: number | null;
  value_decimal: string | null;
  value_float: number | null;
  value_bigint: string | null;
}