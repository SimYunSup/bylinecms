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

import type { CollectionConfig, FlattenedFieldValue } from './storage-utils.js'

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
        return await tx.insert(fieldValuesNumeric).values({
          ...baseData,
          numberType: 'integer',
          value: fieldValue.value,
        })

      case 'decimal':
        return await tx.insert(fieldValuesNumeric).values({
          ...baseData,
          numberType: 'decimal',
          value: fieldValue.value,
        });

      case 'boolean':
        return await tx.insert(fieldValuesBoolean).values({
          ...baseData,
          value: fieldValue.value,
        })

      case 'datetime':
        return await tx.insert(fieldValuesDateTime).values({
          ...baseData,
          value: fieldValue.value,
          dateType: 'timestamp',
        }).returning();

      // case 'file':
      // case 'image':
      //   return await tx.insert(fieldValuesFile).values({
      //     ...baseData,
      //     fileId: fieldValue.fileId,
      //     filename: fieldValue.filename,
      //     originalFilename: fieldValue.originalFilename,
      //     mimeType: fieldValue.mimeType,
      //     fileSize: fieldValue.fileSize,
      //     storageProvider: fieldValue.storageProvider,
      //     storagePath: fieldValue.storagePath,
      //   })

      case 'json':
      case 'object':
        return await this.db.insert(fieldValuesJson).values({
          ...baseData,
          value: fieldValue.value,
        }).returning();

      // Add other field types as needed...
      default:
        throw new Error(`Unsupported field type: ${fieldValue.fieldType}`);
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
