// TYPE DEFINITIONS
// ===============

export interface ParsedFieldPath {
  basePath: string;
  segments: {
    field: string;
    arrayIndex?: number;
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
  fieldPath: string;
  fieldName: string;
  locale: string;
  arrayIndex?: number;
  parentPath?: string;
}

export interface TextFieldValue extends BaseFieldValue {
  fieldType: 'text';
  value: string; // Should only be string after flattening
}

export interface NumericFieldValue extends BaseFieldValue {
  fieldType: 'number' | 'integer' | 'decimal';
  value: number;
}

export interface BooleanFieldValue extends BaseFieldValue {
  fieldType: 'boolean';
  value: boolean;
}

export interface DateTimeFieldValue extends BaseFieldValue {
  fieldType: 'datetime';
  dateType: 'timestamp' | 'timestampTz' | 'date' | 'time';
  valueTime: string;
  valueDate: Date;
  valueTimestamp: Date,
  valueTimestampTz: Date,
}

export interface FileFieldValue extends BaseFieldValue {
  fieldType: 'file' | 'image';
  fileId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  storagePath: string;
  storageUrl?: string;
  fileHash?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageFormat?: string;
  processingStatus?: string;
  thumbnailGenerated?: boolean;
}

export interface RelationFieldValue extends BaseFieldValue {
  fieldType: 'relation';
  targetDocumentId: string;
  targetCollectionId: string;
  relationshipType?: string;
  cascadeDelete?: boolean;
}

export interface RichTextFieldValue extends BaseFieldValue {
  fieldType: 'richText';
  value: any; // JSON content
}

export interface JsonFieldValue extends BaseFieldValue {
  fieldType: 'json' | 'object';
  value: any;
  jsonSchema?: string;
  objectKeys?: string[];
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
  return fieldValue.fieldType === 'file' || fieldValue.fieldType === 'image';
}

export function isRelationFieldValue(fieldValue: FlattenedFieldValue): fieldValue is RelationFieldValue {
  return fieldValue.fieldType === 'relation';
}

export function isJsonFieldValue(fieldValue: FlattenedFieldValue): fieldValue is JsonFieldValue {
  return fieldValue.fieldType === 'json' || fieldValue.fieldType === 'object';
}

export function isNumericFieldValue(fieldValue: FlattenedFieldValue): fieldValue is NumericFieldValue {
  return ['number', 'integer', 'decimal'].includes(fieldValue.fieldType);
}

export interface ReconstructedFieldValue {
  id: string;
  documentVersionId: string;
  collectionId: string;
  fieldPath: string;
  fieldName: string;
  locale: string;
  arrayIndex?: number | null;
  parentPath?: string | null;
  value: any;
  fieldType: string;
}