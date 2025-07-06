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

import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { v7 as uuidv7 } from 'uuid'
import {
  documents,
  documentVersions,
  fieldValuesBoolean,
  fieldValuesDateTime,
  fieldValuesFile,
  fieldValuesJson,
  fieldValuesNumeric,
  fieldValuesRelation,
  fieldValuesText
} from '../database/schema/index.js';

type DatabaseConnection = NodePgDatabase<any>;

import type { CollectionConfig, FlattenedFieldValue } from './@types.js'
import { isFileFieldValue, isJsonFieldValue, isNumericFieldValue, isRelationFieldValue } from './@types.js'

import { flattenDocumentToFieldValues } from './storage-utils.js';

export class EnhancedDocumentCommands {
  constructor(private db: DatabaseConnection) { }

  /**
   * Creates a complete document with all field values from a document object
   */
  async createCompleteDocument(
    collectionId: string,
    collectionConfig: CollectionConfig,
    documentData: any,
    path: string,
    locale = 'default',
    createdBy?: string
  ) {
    return await this.db.transaction(async (tx) => {
      // 1. Create the document
      const document = await tx.insert(documents).values({
        id: uuidv7(),
        collectionId,
        path: path,
        status: 'draft',
      }).returning();

      // 2. Create the first version
      const version = await tx.insert(documentVersions).values({
        id: uuidv7(),
        documentId: document[0].id,
        versionNumber: 1,
        isCurrent: true,
        createdBy,
      }).returning();

      // 3. Flatten the document data to field values
      const flattenedFields = flattenDocumentToFieldValues(
        documentData,
        collectionConfig,
        locale
      );

      // 4. Insert all field values
      for (const fieldValue of flattenedFields) {
        await this.insertFieldValueByType(
          tx,
          version[0].id,
          collectionId,
          fieldValue
        );
      }

      return {
        document: document[0],
        version: version[0],
        fieldCount: flattenedFields.length
      };
    });
  }

  /**
   * Creates a new version of a document with updated field values
   */
  async createDocumentVersion(
    documentId: string,
    collectionId: string,
    collectionConfig: CollectionConfig,
    documentData: any,
    versionNumber: number,
    locale = 'default',
    createdBy?: string
  ) {
    return await this.db.transaction(async (tx) => {
      // 1. Mark existing versions as not current
      await tx.update(documentVersions).set({
        isCurrent: false,
      }).where(eq(documentVersions.documentId, documentId));

      // 2. Create new version
      const version = await tx.insert(documentVersions).values({
        id: uuidv7(),
        documentId,
        versionNumber,
        isCurrent: true,
        createdBy,
      }).returning();

      // 3. Flatten the document data to field values
      const flattenedFields = flattenDocumentToFieldValues(
        documentData,
        collectionConfig,
        locale
      );

      // 4. Insert all field values
      for (const fieldValue of flattenedFields) {
        await this.insertFieldValueByType(
          tx,
          version[0].id,
          collectionId,
          fieldValue
        );
      }

      return {
        version: version[0],
        fieldCount: flattenedFields.length
      };
    });
  }

  private async insertFieldValueByType(
    tx: any,
    documentVersionId: string,
    collectionId: string,
    fieldValue: FlattenedFieldValue
  ) {
    const baseData = {
      id: uuidv7(),
      documentVersionId,
      collectionId,
      fieldPath: fieldValue.fieldPath,
      fieldName: fieldValue.fieldName,
      locale: fieldValue.locale,
      arrayIndex: fieldValue.arrayIndex,
      parentPath: fieldValue.parentPath,
    };

    switch (fieldValue.fieldType) {
      case 'text':
        return await tx.insert(fieldValuesText).values({
          ...baseData,
          value: fieldValue.value,
        });

      case 'richText':
        return await tx.insert(fieldValuesJson).values({
          ...baseData,
          value: fieldValue.value,
        });

      case 'number':
      case 'integer':
        if (isNumericFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesNumeric).values({
            ...baseData,
            valueInteger: fieldValue.value,
            numberType: 'integer',
          });
        }
        throw new Error(`Invalid file field value for ${baseData.fieldPath}`);

      case 'decimal':
        if (isNumericFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesNumeric).values({
            ...baseData,
            valueDecimal: fieldValue.value,
            numberType: 'decimal',
          });
        }
        throw new Error(`Invalid file field value for ${baseData.fieldPath}`);

      case 'boolean':
        return await tx.insert(fieldValuesBoolean).values({
          ...baseData,
          value: fieldValue.value,
        });

      case 'datetime':
        return await tx.insert(fieldValuesDateTime).values({
          ...baseData,
          valueTimestamp: fieldValue.value,
          dateType: 'timestamp',
        });

      case 'file':
      case 'image':
        if (isFileFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesFile).values({
            ...baseData,
            fileId: fieldValue.fileId,
            filename: fieldValue.filename,
            originalFilename: fieldValue.originalFilename,
            mimeType: fieldValue.mimeType,
            fileSize: fieldValue.fileSize,
            storageProvider: fieldValue.storageProvider,
            storagePath: fieldValue.storagePath,
            storageUrl: fieldValue.storageUrl,
            fileHash: fieldValue.fileHash,
            imageWidth: fieldValue.imageWidth,
            imageHeight: fieldValue.imageHeight,
            imageFormat: fieldValue.imageFormat,
            processingStatus: fieldValue.processingStatus || 'pending',
            thumbnailGenerated: fieldValue.thumbnailGenerated || false,
          });
        }
        throw new Error(`Invalid file field value for ${baseData.fieldPath}`);

      case 'relation':
        if (isRelationFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesRelation).values({
            ...baseData,
            targetDocumentId: fieldValue.targetDocumentId,
            targetCollectionId: fieldValue.targetCollectionId,
            relationshipType: fieldValue.relationshipType || 'reference',
            cascadeDelete: fieldValue.cascadeDelete || false,
          });
        }
        throw new Error(`Invalid relation field value for ${baseData.fieldPath}`);

      case 'json':
      case 'object':
        if (isJsonFieldValue(fieldValue)) {
          return await tx.insert(fieldValuesJson).values({
            ...baseData,
            value: fieldValue.value,
            jsonSchema: fieldValue.jsonSchema,
            objectKeys: fieldValue.objectKeys,
          });
        }
        throw new Error(`Invalid JSON field value for ${baseData.fieldPath}`);

      default:
        throw new Error('Unsupported field type');
    }
  }
}

// FACTORY FUNCTION FOR CONVENIENCE
// ================================

export function createEnhancedCommandBuilders(db: DatabaseConnection) {
  return {
    documents: new EnhancedDocumentCommands(db),
  };
}
