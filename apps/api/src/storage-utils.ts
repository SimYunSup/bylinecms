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

import type { CollectionDefinition, Field, ValueField } from '@byline/byline/@types/index'

import type {
  DateTimeStore,
  FileStore,
  FlattenedStore,
  NumericStore,
  RelationStore,
} from './@types/index.js';


export function flattenFields(
  documentData: any,
  collectionConfig: CollectionDefinition,
  locale = 'default'
): FlattenedStore[] {
  const flattenedFields: FlattenedStore[] = [];

  function getParentPath(path: string): string | undefined {
    const parts = path.split('.');
    if (parts.length <= 1) return undefined;
    parts.pop();
    return parts.join('.');
  }

  function flatten(obj: any, fieldConfigs: Field[], basePath = '') {
    for (const fieldConfig of fieldConfigs) {
      const currentPath = basePath ? `${basePath}.${fieldConfig.name}` : fieldConfig.name;
      const value = obj[fieldConfig.name];

      if (value === undefined || value === null) continue;

      if (fieldConfig.type === 'array' && Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayElementPath = `${currentPath}.${index}`;
          if (typeof item === 'object' && item !== null && fieldConfig.fields) {
            // The item is an object with a single key, which is the field name.
            const fieldName = Object.keys(item)[0];
            const fieldValue = item[fieldName];
            const subField = fieldConfig.fields.find(f => f.name === fieldName);
            if (subField) {
              flatten({ [fieldName]: fieldValue }, [subField], arrayElementPath);
            }
          }
        });
      } else if (fieldConfig.localized && typeof value === 'object' && !Array.isArray(value)) {
        for (const [localeKey, localizedValue] of Object.entries(value)) {
          if (localizedValue !== undefined && localizedValue !== null) {
            flattenedFields.push(
              createFlattenedStore(
                currentPath,
                fieldConfig.name,
                fieldConfig.type as ValueField['type'],
                localizedValue,
                localeKey,
                getParentPath(currentPath)
              )
            );
          }
        }
      } else {
        flattenedFields.push(
          createFlattenedStore(
            currentPath,
            fieldConfig.name,
            fieldConfig.type as ValueField['type'],
            value,
            locale,
            getParentPath(currentPath)
          )
        );
      }
    }
  }

  flatten(documentData, collectionConfig.fields);
  return flattenedFields;
}

function createFlattenedStore(
  field_path: string,
  field_name: string,
  field_type: ValueField['type'],
  value: any,
  locale: string,
  parent_path?: string
): FlattenedStore {
  const baseValue = {
    field_path,
    field_name,
    locale,
    parent_path,
  };

  switch (field_type) {
    case 'text':
    case 'boolean':
    case 'checkbox':
    case 'select':
      return { ...baseValue, field_type, value };

    case 'richText':
      return { ...baseValue, field_type, value }

    case 'float':
    case 'integer':
    case 'decimal':
      {
        return {
          ...baseValue,
          field_type,
          number_type: field_type,
          value_float: field_type === 'float' ? value : undefined,
          value_decimal: field_type === 'decimal' ? value : undefined,
          value_integer: field_type === 'integer' ? value : undefined,
        };
      }

    case 'time':
    case 'date':
    case 'datetime':
      {
        return {
          ...baseValue,
          field_type,
          date_type: field_type,
          value_time: field_type === 'time' ? value : undefined,
          value_date: field_type === 'date' ? value : undefined,
          value_timestamp_tz: field_type === 'datetime' ? value : undefined,
        }
      }

    case 'file':
    case 'image':
      {
        const v = value as FileStore;
        return {
          ...baseValue,
          field_type,
          file_id: v.file_id,
          filename: v.filename,
          original_filename: v.original_filename,
          mime_type: v.mime_type,
          file_size: v.file_size,
          storage_provider: v.storage_provider,
          storage_path: v.storage_path,
          storage_url: v.storage_url,
          file_hash: v.file_hash,
          image_width: v.image_width,
          image_height: v.image_height,
          image_format: v.image_format,
          processing_status: v.processing_status,
          thumbnail_generated: v.thumbnail_generated,
        };
      }

    case 'relation':
      return { ...baseValue, field_type, ...value };

    case 'json':
    case 'object':
      return {
        ...baseValue,
        field_type,
        value: value.value,
        json_schema: value.json_schema,
        object_keys: value.object_keys, // Assuming object_keys is part of the value;
      }
    default:
      throw new Error(`Unsupported field type: ${field_type}`);
  }
}

export function reconstructFields(
  fieldValues: FlattenedStore[],
  locale = 'default'
): any {
  const document: any = {};

  const setValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const nextKey = keys[i + 1];
      const isNextKeyIndex = !Number.isNaN(Number.parseInt(nextKey, 10));

      if (isNextKeyIndex) {
        if (!current[key] || !Array.isArray(current[key])) {
          current[key] = [];
        }
      } else if (!current[key] || typeof current[key] !== 'object') {
        if (Array.isArray(current) && typeof key === 'string' && !Number.isNaN(Number.parseInt(key, 10))) {
          const index = Number.parseInt(key, 10);
          if (!current[index]) {
            current[index] = {};
          }
        } else {
          current[key] = {};
        }
      }
      current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current) && typeof lastKey === 'string' && !Number.isNaN(Number.parseInt(lastKey, 10))) {
      const index = Number.parseInt(lastKey, 10);
      if (current[index] && typeof current[index] === 'object') {
        Object.assign(current[index], value);
      } else {
        current[index] = value;
      }
    } else {
      current[lastKey] = value;
    }
  };

  const fieldValuesByPath: Record<string, FlattenedStore[]> = {};
  for (const fv of fieldValues) {
    if (!fieldValuesByPath[fv.field_path]) {
      fieldValuesByPath[fv.field_path] = [];
    }
    fieldValuesByPath[fv.field_path].push(fv);
  }

  for (const path in fieldValuesByPath) {
    const values = fieldValuesByPath[path];
    const preferredValue = values.find(v => v.locale === locale) || values.find(v => v.locale === 'default') || values[0];

    if (values.length > 1 && values.some(v => v.locale !== 'default')) { // Localized
      const localizedObject: Record<string, any> = {};
      values.forEach(v => {
        localizedObject[v.locale] = createReconstructedValue(v);
      });
      setValue(document, path, localizedObject);
    } else if (preferredValue) {
      const valueToSet = createReconstructedValue(preferredValue);
      setValue(document, path, valueToSet);
    }
  }

  return document;
}

function createReconstructedValue(fieldValue: FlattenedStore): any {
  switch (fieldValue.field_type) {
    case 'text':
    case 'select':
    case 'richText':
    case 'checkbox':
    case 'boolean':
    case 'json':
    case 'object':
      return (fieldValue as any).value;

    case 'float':
    case 'integer':
    case 'decimal': {
      const value = fieldValue as NumericStore;
      if (fieldValue.field_type === 'float') {
        return value.value_float
      }
      if (fieldValue.field_type === 'integer') {
        return fieldValue.value_integer
      }
      if (fieldValue.field_type === 'decimal') {
        return fieldValue.value_decimal
      }
      return undefined;
    }

    case 'time':
    case 'date':
    case 'datetime': {
      const value = fieldValue as DateTimeStore
      if (value.date_type === 'time') {
        return value.value_time;
      }
      if (value.date_type === 'date') {
        return value.value_date;
      }
      // Assuming timestamp_tz is the default for datetime
      if (value.date_type === 'datetime') {
        return value.value_timestamp_tz;
      }
      return undefined;
    }

    case 'file':
    case 'image': {
      const fileValue = fieldValue as FileStore;
      return {
        file_id: fileValue.file_id,
        filename: fileValue.filename,
        original_filename: fileValue.original_filename,
        mime_type: fileValue.mime_type,
        file_size: fileValue.file_size,
        storage_provider: fileValue.storage_provider,
        storage_path: fileValue.storage_path,
        storage_url: fileValue.storage_url,
        file_hash: fileValue.file_hash,
        image_width: fileValue.image_width,
        image_height: fileValue.image_height,
        image_format: fileValue.image_format,
        processing_status: fileValue.processing_status,
        thumbnail_generated: fileValue.thumbnail_generated,
      };
    }

    case 'relation': {
      const relationValue = fieldValue as RelationStore;
      return {
        target_document_id: relationValue.target_document_id,
        target_collection_id: relationValue.target_collection_id,
        relationship_type: relationValue.relationship_type,
        cascade_delete: relationValue.cascade_delete,
      };
    }

    default:
      return (fieldValue as any).value;
  }
}
