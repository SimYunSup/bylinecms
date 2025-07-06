/**
 * Byline CMS Server Tests
 *
 * Copyright © 2025 Anthony Bouch and contributors.
 *
 * This file is part of Byline CMS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type {
  CollectionConfig,
  FieldConfig,
  FileFieldValue,
  FlattenedFieldValue,
  NonArrayFieldType,
  ParsedFieldPath,
  ReconstructedFieldValue,
  RelationFieldValue
} from './@types.js';

// FIELD PATH CONSTRUCTION
// =======================

/**
 * Builds field paths for nested array structures
 * @param basePath - The base field name
 * @param arrayIndex - Optional array index
 * @param nestedField - Optional nested field name
 * @returns Constructed field path
 */
export function buildFieldPath(basePath: string, arrayIndex?: number, nestedField?: string): string {
  let path = basePath;

  if (arrayIndex !== undefined) {
    path += `.${arrayIndex}`;
  }

  if (nestedField) {
    path += `.${nestedField}`;
  }

  return path;
}

/**
 * Parses a field path to extract components
 * @param fieldPath - The field path to parse (e.g., "cluster.1.two")
 * @returns Parsed field path components
 */
export function parseFieldPath(fieldPath: string): ParsedFieldPath {
  const segments = fieldPath.split('.');
  const parsedSegments: Array<{ field: string; arrayIndex?: number }> = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];

    // Check if next segment is a number (array index)
    if (nextSegment && !Number.isNaN(Number.parseInt(nextSegment))) {
      parsedSegments.push({
        field: segment,
        arrayIndex: Number.parseInt(nextSegment)
      });
      i++; // Skip the index segment
    } else {
      parsedSegments.push({ field: segment });
    }
  }

  return {
    basePath: segments[0],
    segments: parsedSegments
  };
}

/**
 * Checks if a field path represents an array field
 * @param fieldPath - The field path to check
 * @returns True if the path contains array indices
 */
export function isArrayFieldPath(fieldPath: string): boolean {
  const segments = fieldPath.split('.');
  return segments.some(segment => !Number.isNaN(Number.parseInt(segment)));
}

/**
 * Gets the parent path for an array field
 * @param fieldPath - The field path (e.g., "cluster.1.two")
 * @returns Parent path (e.g., "cluster")
 */
export function getParentPath(fieldPath: string): string | null {
  const segments = fieldPath.split('.');
  if (segments.length <= 1) return null;

  // Find the first array index and return everything before it
  for (let i = 1; i < segments.length; i++) {
    if (!Number.isNaN(Number.parseInt(segments[i]))) {
      return segments.slice(0, i).join('.');
    }
  }

  return null;
}

/**
 * Gets the array index from a field path
 * @param fieldPath - The field path (e.g., "cluster.1.two")
 * @returns Array index or null if not an array field
 */
export function getArrayIndex(fieldPath: string): number | null {
  const segments = fieldPath.split('.');

  for (let i = 1; i < segments.length; i++) {
    const parsed = Number.parseInt(segments[i]);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

// DOCUMENT FLATTENING
// ===================

/**
 * Flattens a complete document into field values for storage
 * @param document - The document object to flatten
 * @param collectionConfig - The collection configuration
 * @param locale - Default locale for non-localized fields
 * @returns Array of flattened field values
 */
export function flattenDocumentToFieldValues(
  documentData: any,
  collectionConfig: CollectionConfig,
  locale = 'default'
): FlattenedFieldValue[] {
  const flattenedFields: FlattenedFieldValue[] = [];

  function flattenObject(
    obj: any,
    fieldConfigs: any[],
    basePath = '',
    parentPath?: string,
    arrayIndex?: number
  ) {
    for (const fieldConfig of fieldConfigs) {
      const fieldPath = basePath ? `${basePath}.${fieldConfig.name}` : fieldConfig.name;
      const value = obj[fieldConfig.name];

      if (value === undefined || value === null) continue;

      // Handle field-specific properties based on type
      switch (fieldConfig.type) {
        case 'file':
        case 'image':
          if (typeof value === 'object' && value.fileId) {
            flattenedFields.push({
              fieldType: fieldConfig.type,
              fieldPath,
              fieldName: fieldConfig.name,
              locale,
              arrayIndex,
              parentPath,
              value: value.fileId, // For backward compatibility
              fileId: value.fileId,
              filename: value.filename,
              originalFilename: value.originalFilename,
              mimeType: value.mimeType,
              fileSize: value.fileSize,
              storageProvider: value.storageProvider,
              storagePath: value.storagePath,
              storageUrl: value.storageUrl,
              fileHash: value.fileHash,
              imageWidth: value.imageWidth,
              imageHeight: value.imageHeight,
              imageFormat: value.imageFormat,
              processingStatus: value.processingStatus,
              thumbnailGenerated: value.thumbnailGenerated,
            } as FileFieldValue);
          }
          break;

        case 'relation':
          if (typeof value === 'object' && value.targetDocumentId) {
            flattenedFields.push({
              fieldType: 'relation',
              fieldPath,
              fieldName: fieldConfig.name,
              locale,
              arrayIndex,
              parentPath,
              value: value.targetDocumentId,
              targetDocumentId: value.targetDocumentId,
              targetCollectionId: value.targetCollectionId,
              relationshipType: value.relationshipType,
              cascadeDelete: value.cascadeDelete,
            } as RelationFieldValue);
          } else if (typeof value === 'string') {
            // Handle simple string reference
            flattenedFields.push({
              fieldType: 'relation',
              fieldPath,
              fieldName: fieldConfig.name,
              locale,
              arrayIndex,
              parentPath,
              value: value,
              targetDocumentId: value,
              targetCollectionId: fieldConfig.targetCollection || '',
            } as RelationFieldValue);
          }
          break;

        case 'json':
        case 'object':
          flattenedFields.push({
            fieldType: fieldConfig.type,
            fieldPath,
            fieldName: fieldConfig.name,
            locale,
            arrayIndex,
            parentPath,
            value,
            jsonSchema: fieldConfig.jsonSchema,
            objectKeys: typeof value === 'object' ? Object.keys(value) : undefined,
          });
          break;

        case 'array':
          if (Array.isArray(value) && fieldConfig.fields) {
            value.forEach((item, index) => {
              flattenObject(
                item,
                fieldConfig.fields,
                fieldPath,
                fieldPath,
                index
              );
            });
          }
          break;

        default:
          // Handle simple field types
          flattenedFields.push({
            fieldType: fieldConfig.type,
            fieldPath,
            fieldName: fieldConfig.name,
            locale,
            arrayIndex,
            parentPath,
            value,
          } as FlattenedFieldValue);
      }
    }
  }

  flattenObject(documentData, collectionConfig.fields);
  return flattenedFields;
}

/**
 * Flattens a single field (recursive for arrays and nested structures)
 * @param value - The field value
 * @param fieldConfig - Field configuration
 * @param fieldPath - Current field path
 * @param fieldName - Field name
 * @param result - Array to accumulate results
 * @param defaultLocale - Default locale
 * @param arrayIndex - Current array index (if applicable)
 * @param parentPath - Parent field path (if applicable)
 */
export function flattenField(
  value: any,
  fieldConfig: FieldConfig,
  fieldPath: string,
  fieldName: string,
  result: FlattenedFieldValue[],
  defaultLocale: string,
  arrayIndex?: number,
  parentPath?: string
): void {

  if (fieldConfig.type === 'array' && Array.isArray(value)) {
    // Handle array fields - don't create field values for the array itself
    value.forEach((arrayItem, index) => {
      const arrayPath = buildFieldPath(fieldPath, index);

      // Process each field in the array item
      if (fieldConfig.fields) {
        for (const subFieldConfig of fieldConfig.fields) {
          const subFieldValue = arrayItem[subFieldConfig.name];
          if (subFieldValue !== undefined && subFieldValue !== null) {
            flattenField(
              subFieldValue,
              subFieldConfig,
              buildFieldPath(arrayPath, undefined, subFieldConfig.name),
              subFieldConfig.name,
              result,
              defaultLocale,
              index,
              fieldPath
            );
          }
        }
      }
    });
  } else if (fieldConfig.localized && typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // Handle localized fields (object with locale keys)
    for (const [locale, localizedValue] of Object.entries(value)) {
      if (localizedValue !== undefined && localizedValue !== null) {
        // Create field-specific type based on fieldConfig.type
        result.push(createFieldSpecificValue(
          fieldPath,
          fieldName,
          fieldConfig.type as NonArrayFieldType,
          localizedValue,
          locale,
          arrayIndex,
          parentPath
        ));
      }
    }
  } else {
    // Handle regular fields (non-array types only)
    if (fieldConfig.type !== 'array') {
      result.push(createFieldSpecificValue(
        fieldPath,
        fieldName,
        fieldConfig.type as NonArrayFieldType,
        value,
        defaultLocale,
        arrayIndex,
        parentPath
      ));
    }
  }
}

/**
 * Creates a field-specific value object based on field type
 */
function createFieldSpecificValue(
  fieldPath: string,
  fieldName: string,
  fieldType: NonArrayFieldType,
  value: any,
  locale: string,
  arrayIndex?: number,
  parentPath?: string
): FlattenedFieldValue {
  const baseValue = {
    fieldPath,
    fieldName,
    locale,
    arrayIndex,
    parentPath,
  };

  switch (fieldType) {
    case 'text':
      return {
        ...baseValue,
        fieldType: 'text',
        value: value,
      };

    case 'richText':
      return {
        ...baseValue,
        fieldType: 'richText',
        value: value,
      };

    case 'number':
    case 'integer':
    case 'decimal':
      return {
        ...baseValue,
        fieldType: fieldType,
        value: value,
      };

    case 'boolean':
      return {
        ...baseValue,
        fieldType: 'boolean',
        value: value,
      };

    case 'datetime':
      return {
        ...baseValue,
        fieldType: 'datetime',
        value: value,
      };

    case 'file':
    case 'image':
      // Handle file fields - extract file-specific properties
      if (typeof value === 'object' && value.fileId) {
        return {
          ...baseValue,
          fieldType: fieldType,
          value: value.fileId,
          fileId: value.fileId,
          filename: value.filename,
          originalFilename: value.originalFilename,
          mimeType: value.mimeType,
          fileSize: value.fileSize,
          storageProvider: value.storageProvider,
          storagePath: value.storagePath,
          storageUrl: value.storageUrl,
          fileHash: value.fileHash,
          imageWidth: value.imageWidth,
          imageHeight: value.imageHeight,
          imageFormat: value.imageFormat,
          processingStatus: value.processingStatus,
          thumbnailGenerated: value.thumbnailGenerated,
        };
      }
      // Fallback for simple file values
      return {
        ...baseValue,
        fieldType: fieldType,
        value: value,
        fileId: value,
        filename: '',
        originalFilename: '',
        mimeType: '',
        fileSize: 0,
        storageProvider: '',
        storagePath: '',
      };

    case 'relation':
      // Handle relation fields - extract relation-specific properties
      if (typeof value === 'object' && value.targetDocumentId) {
        return {
          ...baseValue,
          fieldType: 'relation',
          value: value.targetDocumentId,
          targetDocumentId: value.targetDocumentId,
          targetCollectionId: value.targetCollectionId,
          relationshipType: value.relationshipType,
          cascadeDelete: value.cascadeDelete,
        };
      }
      // Fallback for simple relation values
      return {
        ...baseValue,
        fieldType: 'relation',
        value: value,
        targetDocumentId: value,
        targetCollectionId: '',
      };

    case 'json':
    case 'object':
      return {
        ...baseValue,
        fieldType: fieldType,
        value: value,
        jsonSchema: undefined,
        objectKeys: typeof value === 'object' ? Object.keys(value) : undefined,
      };

    default:
      // This should never happen with proper typing, but provide a fallback
      throw new Error(`Unsupported field type: ${fieldType}`);
  }
}

// DOCUMENT RECONSTRUCTION
// ======================

/**
 * Reconstructs a complete document from flattened field values
 * @param fieldValues - Array of field values from storage
 * @param collectionConfig - Collection configuration
 * @param locale - Preferred locale for reconstruction
 * @returns Reconstructed document object
 */
export function reconstructDocument(
  fieldValues: ReconstructedFieldValue[],
  collectionConfig: CollectionConfig,
  locale = 'default'
): any {
  const document: any = {};

  // Group field values by top-level field
  const fieldGroups = groupFieldsByTopLevel(fieldValues);

  for (const fieldConfig of collectionConfig.fields) {
    const fieldGroup = fieldGroups[fieldConfig.name];
    if (fieldGroup && fieldGroup.length > 0) {
      document[fieldConfig.name] = reconstructField(
        fieldGroup,
        fieldConfig,
        locale
      );
    }
  }

  return document;
}

/**
 * Reconstructs a specific array field from field values
 * @param fieldValues - Field values for the array
 * @param fieldConfig - Field configuration for the array
 * @param locale - Preferred locale
 * @returns Reconstructed array
 */
export function reconstructArrayField(
  fieldValues: ReconstructedFieldValue[],
  fieldConfig: FieldConfig,
  locale = 'default'
): any[] {
  // Group by array index
  const arrayItems: { [index: number]: ReconstructedFieldValue[] } = {};

  for (const fieldValue of fieldValues) {
    if (fieldValue.arrayIndex !== null && fieldValue.arrayIndex !== undefined) {
      if (!arrayItems[fieldValue.arrayIndex]) {
        arrayItems[fieldValue.arrayIndex] = [];
      }
      arrayItems[fieldValue.arrayIndex].push(fieldValue);
    }
  }

  // Reconstruct each array item
  const result: any[] = [];
  const sortedIndexes = Object.keys(arrayItems).map(Number).sort((a, b) => a - b);

  for (const index of sortedIndexes) {
    const itemFieldValues = arrayItems[index];
    const reconstructedItem = reconstructArrayItem(
      itemFieldValues,
      fieldConfig.fields || [],
      locale
    );
    result[index] = reconstructedItem;
  }

  return result;
}

/**
 * Reconstructs a single field value
 * @param fieldValues - Field values for this field
 * @param fieldConfig - Field configuration
 * @param locale - Preferred locale
 * @returns Reconstructed field value
 */
export function reconstructField(
  fieldValues: ReconstructedFieldValue[],
  fieldConfig: FieldConfig,
  locale: string
): any {
  if (fieldConfig.type === 'array') {
    return reconstructArrayField(fieldValues, fieldConfig, locale);
  } if (fieldConfig.localized) {
    return reconstructLocalizedField(fieldValues, locale);
  }
  // Regular field - return the value for the specified locale or default
  const fieldValue = fieldValues.find(fv =>
    fv.locale === locale || (fv.locale === 'default' && !fieldValues.some(f => f.locale === locale))
  );
  return fieldValue?.value;
}

/**
 * Reconstructs a localized field
 * @param fieldValues - Field values with different locales
 * @param preferredLocale - Preferred locale
 * @returns Localized field value (object or single value)
 */
export function reconstructLocalizedField(
  fieldValues: ReconstructedFieldValue[],
  preferredLocale: string
): any {
  const localizedValues: { [locale: string]: any } = {};

  for (const fieldValue of fieldValues) {
    localizedValues[fieldValue.locale] = fieldValue.value;
  }

  // If requesting a specific locale and it exists, return just that value
  // If requesting all locales or the field has multiple locales, return the object
  if (Object.keys(localizedValues).length === 1 && localizedValues[preferredLocale]) {
    return localizedValues[preferredLocale];
  }

  return localizedValues;
}

/**
 * Reconstructs an array item from field values
 * @param fieldValues - Field values for the array item
 * @param subFieldConfigs - Field configurations for array item fields
 * @param locale - Preferred locale
 * @returns Reconstructed array item object
 */
export function reconstructArrayItem(
  fieldValues: ReconstructedFieldValue[],
  subFieldConfigs: FieldConfig[],
  locale: string
): any {
  const item: any = {};

  for (const subFieldConfig of subFieldConfigs) {
    const subFieldValues = fieldValues.filter(fv =>
      fv.fieldName === subFieldConfig.name
    );

    if (subFieldValues.length > 0) {
      item[subFieldConfig.name] = reconstructField(
        subFieldValues,
        subFieldConfig,
        locale
      );
    }
  }

  return item;
}

/**
 * Groups field values by their top-level field name
 * @param fieldValues - Array of field values
 * @returns Grouped field values by top-level field
 */
export function groupFieldsByTopLevel(
  fieldValues: ReconstructedFieldValue[]
): { [fieldName: string]: ReconstructedFieldValue[] } {
  const groups: { [fieldName: string]: ReconstructedFieldValue[] } = {};

  for (const fieldValue of fieldValues) {
    const topLevelField = fieldValue.fieldPath.split('.')[0];
    if (!groups[topLevelField]) {
      groups[topLevelField] = [];
    }
    groups[topLevelField].push(fieldValue);
  }

  return groups;
}

/**
 * Gets field values for a specific array field
 * @param fieldValues - All field values
 * @param arrayFieldName - Name of the array field
 * @returns Field values that belong to the array field
 */
export function getArrayFieldValues(
  fieldValues: ReconstructedFieldValue[],
  arrayFieldName: string
): ReconstructedFieldValue[] {
  return fieldValues.filter(fv =>
    fv.fieldPath === arrayFieldName || fv.fieldPath.startsWith(`${arrayFieldName}.`)
  );
}

/**
 * Gets field values for a specific path pattern
 * @param fieldValues - All field values
 * @param pathPattern - Path pattern to match (supports wildcards)
 * @returns Matching field values
 */
export function getFieldValuesByPath(
  fieldValues: ReconstructedFieldValue[],
  pathPattern: string
): ReconstructedFieldValue[] {
  if (pathPattern.includes('*')) {
    // Convert wildcard pattern to regex
    const regexPattern = pathPattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);

    return fieldValues.filter(fv => regex.test(fv.fieldPath));
  }
  // Exact match or starts with
  return fieldValues.filter(fv =>
    fv.fieldPath === pathPattern || fv.fieldPath.startsWith(`${pathPattern}.`)
  );
}

// UTILITY FUNCTIONS
// =================

/**
 * Validates a flattened field value
 * @param fieldValue - The field value to validate
 * @returns True if valid, false otherwise
 */
export function validateFlattenedFieldValue(fieldValue: FlattenedFieldValue): boolean {
  return !!(
    fieldValue.fieldPath &&
    fieldValue.fieldName &&
    fieldValue.fieldType &&
    fieldValue.locale &&
    fieldValue.value !== undefined
  );
}

/**
 * Validates a collection configuration
 * @param config - The collection config to validate
 * @returns True if valid, false otherwise
 */
export function validateCollectionConfig(config: CollectionConfig): boolean {
  if (!config.path || !config.labels || !Array.isArray(config.fields)) {
    return false;
  }

  // Validate each field
  for (const field of config.fields) {
    if (!field.name || !field.type) {
      return false;
    }

    // Validate array fields have sub-fields
    if (field.type === 'array' && (!field.fields || !Array.isArray(field.fields))) {
      return false;
    }
  }

  return true;
}

/**
 * Gets all unique locales from a set of field values
 * @param fieldValues - Array of field values
 * @returns Array of unique locale strings
 */
export function getUniqueLocales(fieldValues: ReconstructedFieldValue[]): string[] {
  const locales = new Set(fieldValues.map(fv => fv.locale));
  return Array.from(locales).sort();
}

/**
 * Filters field values by locale
 * @param fieldValues - Array of field values
 * @param locale - Locale to filter by
 * @param includeDefault - Whether to include 'default' locale as fallback
 * @returns Filtered field values
 */
export function filterFieldValuesByLocale(
  fieldValues: ReconstructedFieldValue[],
  locale: string,
  includeDefault = true
): ReconstructedFieldValue[] {
  return fieldValues.filter(fv =>
    fv.locale === locale || (includeDefault && fv.locale === 'default')
  );
}