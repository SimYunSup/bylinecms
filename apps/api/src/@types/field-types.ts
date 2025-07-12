// Site, collection and field configuration types
// ===============

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
  type: 'text' | 'richText' | 'array' | 'float' | 'integer' | 'decimal' | 'boolean' | 'datetime' | 'relation' | 'file' | 'image' | 'json' | 'object';
  required?: boolean;
  unique?: boolean;
  localized?: boolean;
  fields?: FieldConfig[]; // For array fields
}

// Utility type to exclude 'array' from field types
export type NonArrayFieldType = Exclude<FieldConfig['type'], 'array'>;