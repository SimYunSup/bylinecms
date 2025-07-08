// TYPE DEFINITIONS
// ===============

export interface ParsedFieldPath {
  basePath: string;
  segments: {
    field: string;
    array_index?: number;
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
  array_index?: number;
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
  array_index?: number | null;
  parent_path?: string | null;
  value: any;
}