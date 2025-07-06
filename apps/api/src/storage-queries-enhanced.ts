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

import { and, eq, or, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
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

import type { CollectionConfig, FlattenedFieldValue, SiteConfig } from './@types.js'

import { reconstructArrayField, reconstructDocument } from './storage-utils.js';

export class EnhancedDocumentQueries {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  /**
   * Gets a complete reconstructed document
   */
  async getCompleteDocument(
    documentId: string,
    collectionConfig: CollectionConfig,
    locale = 'all'
  ): Promise<any> {
    // 1. Get current version
    const currentVersion = await this.db.select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.isCurrent, true)
        )
      )
      .limit(1);

    if (!currentVersion[0]) {
      throw new Error(`No current version found for document ${documentId}`);
    }

    // 2. Get all field values for this version
    const fieldValues = await this.getAllFieldValuesForVersion(
      currentVersion[0].id,
      locale
    );

    // 3. Reconstruct the document
    return reconstructDocument(
      fieldValues,
      collectionConfig,
      locale
    );
  }

  /**
   * Gets a specific array field from a document
   */
  async getDocumentArrayField(
    documentId: string,
    fieldName: string,
    fieldConfig: any,
    locale = 'all'
  ): Promise<any[]> {
    // Get current version
    const currentVersion = await this.db.select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.isCurrent, true)
        )
      )
      .limit(1);

    if (!currentVersion[0]) {
      throw new Error(`No current version found for document ${documentId}`);
    }

    // Get field values for this array field
    const fieldValues = await this.getArrayFieldValues(
      currentVersion[0].id,
      fieldName,
      locale
    );

    // Reconstruct the array
    return reconstructArrayField(
      fieldValues,
      fieldConfig,
      locale
    );
  }

  private async getAllFieldValuesForVersion(
    versionId: string,
    locale = 'all'
  ): Promise<FlattenedFieldValue[]> {

    const queries = await Promise.all([
      // 1. Text field values
      this.db.select({
        id: fieldValuesText.id,
        documentVersionId: fieldValuesText.documentVersionId,
        collectionId: fieldValuesText.collectionId,
        fieldType: sql<string>`'text'`.as('fieldType'),
        fieldPath: fieldValuesText.fieldPath,
        fieldName: fieldValuesText.fieldName,
        locale: fieldValuesText.locale,
        arrayIndex: fieldValuesText.arrayIndex,
        parentPath: fieldValuesText.parentPath,
        value: fieldValuesText.value,
      }).from(fieldValuesText).where(
        locale === 'all'
          ? eq(fieldValuesText.documentVersionId, versionId)
          : and(eq(fieldValuesText.documentVersionId, versionId), eq(fieldValuesText.locale, locale))
      ),

      // 2. Numeric field values
      this.db.select({
        id: fieldValuesNumeric.id,
        documentVersionId: fieldValuesNumeric.documentVersionId,
        collectionId: fieldValuesNumeric.collectionId,
        fieldType: sql<string>`'numeric'`.as('fieldType'),
        fieldPath: fieldValuesNumeric.fieldPath,
        fieldName: fieldValuesNumeric.fieldName,
        locale: fieldValuesNumeric.locale,
        arrayIndex: fieldValuesNumeric.arrayIndex,
        parentPath: fieldValuesNumeric.parentPath,
        value: fieldValuesNumeric.valueInteger, // Simplified - would need type-specific handling
      }).from(fieldValuesNumeric).where(
        locale === 'all'
          ? eq(fieldValuesNumeric.documentVersionId, versionId)
          : and(eq(fieldValuesNumeric.documentVersionId, versionId), eq(fieldValuesNumeric.locale, locale))
      ),

      // 3. Boolean field values
      this.db.select({
        id: fieldValuesBoolean.id,
        documentVersionId: fieldValuesBoolean.documentVersionId,
        collectionId: fieldValuesBoolean.collectionId,
        fieldType: sql<string>`'boolean'`.as('fieldType'),
        fieldPath: fieldValuesBoolean.fieldPath,
        fieldName: fieldValuesBoolean.fieldName,
        locale: fieldValuesBoolean.locale,
        arrayIndex: fieldValuesBoolean.arrayIndex,
        parentPath: fieldValuesBoolean.parentPath,
        value: fieldValuesBoolean.value,
      }).from(fieldValuesBoolean).where(
        locale === 'all'
          ? eq(fieldValuesBoolean.documentVersionId, versionId)
          : and(eq(fieldValuesBoolean.documentVersionId, versionId), eq(fieldValuesBoolean.locale, locale))
      ),

      // 4. DateTime field values
      this.db.select({
        id: fieldValuesDateTime.id,
        documentVersionId: fieldValuesDateTime.documentVersionId,
        collectionId: fieldValuesDateTime.collectionId,
        fieldType: sql<string>`'datetime'`.as('fieldType'),
        fieldPath: fieldValuesDateTime.fieldPath,
        fieldName: fieldValuesDateTime.fieldName,
        locale: fieldValuesDateTime.locale,
        arrayIndex: fieldValuesDateTime.arrayIndex,
        parentPath: fieldValuesDateTime.parentPath,

        valueDate: fieldValuesDateTime.valueDate,
        valueTime: fieldValuesDateTime.valueTime,
        valueTimestamp: fieldValuesDateTime.valueTimestamp,
        valueTimestampTz: fieldValuesDateTime.valueTimestampTz,
      }).from(fieldValuesDateTime).where(
        locale === 'all'
          ? eq(fieldValuesDateTime.documentVersionId, versionId)
          : and(eq(fieldValuesDateTime.documentVersionId, versionId), eq(fieldValuesDateTime.locale, locale))
      ),

      // 5. Json field values
      this.db.select({
        id: fieldValuesJson.id,
        documentVersionId: fieldValuesJson.documentVersionId,
        collectionId: fieldValuesJson.collectionId,
        fieldType: sql<string>`'richText'`.as('fieldType'),
        fieldPath: fieldValuesJson.fieldPath,
        fieldName: fieldValuesJson.fieldName,
        locale: fieldValuesJson.locale,
        arrayIndex: fieldValuesJson.arrayIndex,
        parentPath: fieldValuesJson.parentPath,
        value: fieldValuesJson.value,
        jsonSchema: fieldValuesJson.jsonSchema,
        objectKeys: fieldValuesJson.objectKeys
      }).from(fieldValuesJson).where(
        locale === 'all'
          ? eq(fieldValuesJson.documentVersionId, versionId)
          : and(eq(fieldValuesJson.documentVersionId, versionId), eq(fieldValuesJson.locale, locale))
      ),

      // 6. Relation field values
      this.db.select({
        id: fieldValuesRelation.id,
        documentVersionId: fieldValuesRelation.documentVersionId,
        collectionId: fieldValuesRelation.collectionId,
        fieldType: sql<string>`'relation'`.as('fieldType'),
        fieldPath: fieldValuesRelation.fieldPath,
        fieldName: fieldValuesRelation.fieldName,
        locale: fieldValuesRelation.locale,
        arrayIndex: fieldValuesRelation.arrayIndex,
        parentPath: fieldValuesRelation.parentPath,
        targetDocumentId: fieldValuesRelation.targetDocumentId,
        targetCollectionId: fieldValuesRelation.targetCollectionId,
        relationshipType: fieldValuesRelation.relationshipType,
        cascadeDelete: fieldValuesRelation.cascadeDelete,
      }).from(fieldValuesRelation).where(
        locale === 'all'
          ? eq(fieldValuesRelation.documentVersionId, versionId)
          : and(eq(fieldValuesRelation.documentVersionId, versionId), eq(fieldValuesRelation.locale, locale))
      ),

      // 7. File field values
      this.db.select({
        id: fieldValuesFile.id,
        documentVersionId: fieldValuesFile.documentVersionId,
        collectionId: fieldValuesFile.collectionId,
        fieldType: sql<string>`'file'`.as('fieldType'),
        fieldPath: fieldValuesFile.fieldPath,
        fieldName: fieldValuesFile.fieldName,
        locale: fieldValuesFile.locale,
        arrayIndex: fieldValuesFile.arrayIndex,
        parentPath: fieldValuesFile.parentPath,

        fileId: fieldValuesFile.fileId,
        filename: fieldValuesFile.filename,
        originalFilename: fieldValuesFile.originalFilename,

        // File metadata
        mimeType: fieldValuesFile.mimeType,
        fileHash: fieldValuesFile.fileHash,
        fileSize: fieldValuesFile.fileSize,

        // Storage information
        storageProvider: fieldValuesFile.storageProvider,
        storagePath: fieldValuesFile.storagePath,
        storageUrl: fieldValuesFile.storageUrl,

        // Image-specific metadata (when applicable)
        imageWidth: fieldValuesFile.imageWidth,
        imageHeight: fieldValuesFile.imageHeight,
        imageFormat: fieldValuesFile.imageFormat,

        // File processing status
        processingStatus: fieldValuesFile.processingStatus,
        thumbnailGenerated: fieldValuesFile.thumbnailGenerated,
      }).from(fieldValuesFile).where(
        locale === 'all'
          ? eq(fieldValuesFile.documentVersionId, versionId)
          : and(eq(fieldValuesFile.documentVersionId, versionId), eq(fieldValuesFile.locale, locale))
      ),
    ]);

    // TODO: Fix
    // @ts-ignore
    return queries.flat().sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
  }

  private async getArrayFieldValues(
    versionId: string,
    fieldName: string,
    locale: string
  ) {
    // Query field values where fieldPath starts with the field name
    const allFieldValues = await this.getAllFieldValuesForVersion(versionId, locale);

    return allFieldValues.filter(fv =>
      fv.fieldPath === fieldName || fv.fieldPath.startsWith(`${fieldName}.`)
    );
  }
}

// FACTORY FUNCTION FOR CONVENIENCE
// ================================

export function createEnhancedQueryBuilders(siteConfig: SiteConfig, db: DatabaseConnection) {
  return {
    documents: new EnhancedDocumentQueries(siteConfig, db),
  };
}