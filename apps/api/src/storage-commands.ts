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

// ENHANCED STORAGE COMMANDS WITH ARRAY SUPPORT
// ============================================

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { v7 as uuidv7 } from 'uuid'
import {
  collections,
  documents,
  fieldValuesBoolean,
  fieldValuesDatetime,
  fieldValuesFile,
  fieldValuesJson,
  fieldValuesNumeric,
  fieldValuesRelation,
  fieldValuesText
} from '../database/schema/index.js';

import type { SiteConfig } from './@types/index.js';

type DatabaseConnection = NodePgDatabase<any>;

import { eq } from "drizzle-orm";
import type { CollectionConfig } from './@types/index.js'
import { isFileFieldValue, isJsonFieldValue, isNumericFieldValue, isRelationFieldValue } from './@types/index.js'
import { flattenDocument } from './storage-utils.js';


export class CollectionCommands {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async create(path: string, config: any) {
    return await this.db.insert(collections).values({
      id: uuidv7(),
      path,
      config,
    }).returning();
  }

  async delete(id: string) {
    return await this.db.delete(collections).where(eq(collections.id, id));
  }
}

export class DocumentCommands {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  /**
   * Creates document with all field values from a document object
   */
  async createDocument(options: {
    documentId?: string, // Optional logical document ID when creating a new version for the same logical document
    collectionId: string,
    collectionConfig: CollectionConfig,
    action: string,
    documentData: any,
    path: string,
    locale?: string
    status?: 'draft' | 'published' | 'archived'
    createdBy?: string
  }) {
    return await this.db.transaction(async (tx) => {
      // 1. Create the document - new version for logical document_id or new document
      const document = await tx.insert(documents).values({
        id: uuidv7(), // Document version
        document_id: options.documentId ?? uuidv7(),
        collection_id: options.collectionId,
        path: options.path,
        event_type: options.action ?? 'create',
        status: options.status ?? 'draft',
      }).returning();

      // 2. Flatten the document data to field values
      const flattenedFields = flattenDocument(
        options.documentData,
        options.collectionConfig,
        options.locale ?? 'all'
      );

      // 3. Insert all field values
      for (const fieldValue of flattenedFields) {
        await this.insertFieldValueByType(
          tx,
          document[0].id, // Use the document version ID
          options.collectionId,
          fieldValue
        );
      }

      return {
        document: document[0],
        fieldCount: flattenedFields.length
      };
    });
  }

  private async insertFieldValueByType(
    tx: DatabaseConnection,
    documentVersionId: string,
    collectionId: string,
    fieldValue: any
  ): Promise<any> {
    const baseData = {
      id: uuidv7(),
      document_version_id: documentVersionId,
      collection_id: collectionId,
      field_path: fieldValue.field_path,
      field_name: fieldValue.field_name,
      locale: fieldValue.locale,
      parent_path: fieldValue.parent_path,
    };

    switch (fieldValue.field_type) {
      case 'text':
        // Handle both simple string values and localized object values
        if (typeof fieldValue.value === 'object' && fieldValue.value != null) {
          const values: any[] = [];
          const entries = Object.entries<string>(fieldValue.value);
          for (const [locale, localizedValue] of entries) {
            values.push({
              ...baseData,
              id: uuidv7(), // we need a unique ID for each localized value
              locale: locale,
              value: localizedValue as string,
            })
          }
          return await tx.insert(fieldValuesText).values(values);
        }

        // Simple string value
        return await tx.insert(fieldValuesText).values({
          ...baseData,
          value: fieldValue.value as string,
        });

      case 'number':
      case 'integer':
        if (isNumericFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesNumeric).values({
            ...baseData,
            value_integer: fieldValue.value,
            number_type: 'integer',
          });
        }
        throw new Error(`Invalid numeric field value for ${baseData.field_path}`);

      case 'decimal':
        if (isNumericFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesNumeric).values({
            ...baseData,
            // TODO: Fix
            // @ts-ignore
            value_decimal: fieldValue.value,
            number_type: 'decimal',
          });
        }
        throw new Error(`Invalid numeric field value for ${baseData.field_path}`);

      case 'boolean':
        return await tx.insert(fieldValuesBoolean).values({
          ...baseData,
          value: fieldValue.value,
        });

      case 'datetime':
        return await tx.insert(fieldValuesDatetime).values({
          ...baseData,
          date_type: fieldValue.date_type || 'timestamp',
          value_time: fieldValue.value_time,
          value_date: fieldValue.value_date,
          value_timestamp: fieldValue.value_timestamp,
          value_timestamp_tz: fieldValue.value_timestamp_tz,
        });

      case 'file':
      case 'image':
        if (isFileFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesFile).values({
            ...baseData,
            file_id: fieldValue.file_id,
            filename: fieldValue.filename,
            original_filename: fieldValue.original_filename,
            mime_type: fieldValue.mime_type,
            file_size: fieldValue.file_size,
            storage_provider: fieldValue.storage_provider,
            storage_path: fieldValue.storage_path,
            storage_url: fieldValue.storage_url,
            file_hash: fieldValue.file_hash,
            image_width: fieldValue.image_width,
            image_height: fieldValue.image_height,
            image_format: fieldValue.image_format,
            processing_status: fieldValue.processing_status || 'pending',
            thumbnail_generated: fieldValue.thumbnail_generated || false,
          });
        }
        throw new Error(`Invalid file field value for ${baseData.field_path}`);

      case 'relation':
        if (isRelationFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesRelation).values({
            ...baseData,
            target_document_id: fieldValue.target_document_id,
            target_collection_id: fieldValue.target_collection_id,
            relationship_type: fieldValue.relationship_type || 'reference',
            cascade_delete: fieldValue.cascade_delete || false,
          });
        }
        throw new Error(`Invalid relation field value for ${baseData.field_path}`);

      case 'richText':
        // TODO: What does a localized version of rich text look like?

        // // Handle both simple values and localized object values for rich text
        // if (typeof fieldValue.value === 'object' && fieldValue.value != null) {
        //   const values: any[] = [];
        //   const entries = Object.entries<string>(fieldValue.value);
        //   for (const [locale, localizedValue] of entries) {
        //     values.push({
        //       ...baseData,
        //       id: uuidv7(), // we need a unique ID for each localized value
        //       locale: locale,
        //       value: localizedValue as string,
        //     })
        //   }
        //   return await tx.insert(fieldValuesJson).values(values);
        // }
        // If not a localized object, treat as regular rich text content
        return await tx.insert(fieldValuesJson).values({
          ...baseData,
          value: fieldValue.value,
        });

      case 'json':
      case 'object':
        if (isJsonFieldValue(fieldValue)) {
          // Handle localized JSON/object fields
          if (typeof fieldValue.value === 'object' && fieldValue.value != null) {
            const values: any[] = [];
            const entries = Object.entries<string>(fieldValue.value);
            for (const [locale, localizedValue] of entries) {
              values.push({
                ...baseData,
                id: uuidv7(), // we need a unique ID for each localized value
                locale: locale,
                value: localizedValue as string,
              })
            }
            return await tx.insert(fieldValuesJson).values(values);
          }
          // If not a localized object, treat as regular JSON content
          return await tx.insert(fieldValuesJson).values({
            ...baseData,
            value: fieldValue.value,
            json_schema: fieldValue.json_schema,
            object_keys: fieldValue.object_keys,
          });
        }
        throw new Error(`Invalid JSON field value for ${baseData.field_path}`);

      default:
        throw new Error('Unsupported field type');
    }
  }
}

// FACTORY FUNCTION FOR CONVENIENCE
// ================================

export function createCommandBuilders(siteConfig: SiteConfig, db: DatabaseConnection) {
  return {
    collections: new CollectionCommands(siteConfig, db),
    documents: new DocumentCommands(siteConfig, db),
  };
}
