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

import type { CollectionConfig, ReconstructedFieldValue } from './@types.js'

import { reconstructArrayField, reconstructDocument } from './storage-utils.js';

export class EnhancedDocumentQueries {
  constructor(private db: DatabaseConnection) { }

  /**
   * Gets a complete reconstructed document
   */
  async getCompleteDocument(
    documentId: string,
    collectionConfig: CollectionConfig,
    locale = 'default'
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
    locale = 'default'
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
    locale = 'default'
  ): Promise<ReconstructedFieldValue[]> {
    // This would use your existing TypedFieldValuesQuery.getAllFieldValues
    // but with the enhanced structure
    const queries = await Promise.all([
      this.db.select({
        id: fieldValuesText.id,
        documentVersionId: fieldValuesText.documentVersionId,
        collectionId: fieldValuesText.collectionId,
        fieldPath: fieldValuesText.fieldPath,
        fieldName: fieldValuesText.fieldName,
        locale: fieldValuesText.locale,
        arrayIndex: fieldValuesText.arrayIndex,
        parentPath: fieldValuesText.parentPath,
        value: fieldValuesText.value,
        fieldType: sql<string>`'text'`.as('fieldType'),
      }).from(fieldValuesText).where(
        and(
          eq(fieldValuesText.documentVersionId, versionId),
          eq(fieldValuesText.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesNumeric.id,
        documentVersionId: fieldValuesNumeric.documentVersionId,
        collectionId: fieldValuesNumeric.collectionId,
        fieldPath: fieldValuesNumeric.fieldPath,
        fieldName: fieldValuesNumeric.fieldName,
        locale: fieldValuesNumeric.locale,
        arrayIndex: fieldValuesNumeric.arrayIndex,
        parentPath: fieldValuesNumeric.parentPath,
        value: fieldValuesNumeric.valueInteger, // Simplified - would need type-specific handling
        fieldType: sql<string>`'numeric'`.as('fieldType'),
      }).from(fieldValuesNumeric).where(
        and(
          eq(fieldValuesNumeric.documentVersionId, versionId),
          eq(fieldValuesNumeric.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesBoolean.id,
        documentVersionId: fieldValuesBoolean.documentVersionId,
        collectionId: fieldValuesBoolean.collectionId,
        fieldPath: fieldValuesBoolean.fieldPath,
        fieldName: fieldValuesBoolean.fieldName,
        locale: fieldValuesBoolean.locale,
        arrayIndex: fieldValuesBoolean.arrayIndex,
        parentPath: fieldValuesBoolean.parentPath,
        value: fieldValuesBoolean.value,
        fieldType: sql<string>`'boolean'`.as('fieldType'),
      }).from(fieldValuesBoolean).where(
        and(
          eq(fieldValuesBoolean.documentVersionId, versionId),
          eq(fieldValuesBoolean.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesDateTime.id,
        documentVersionId: fieldValuesDateTime.documentVersionId,
        collectionId: fieldValuesDateTime.collectionId,
        fieldPath: fieldValuesDateTime.fieldPath,
        fieldName: fieldValuesDateTime.fieldName,
        locale: fieldValuesDateTime.locale,
        arrayIndex: fieldValuesDateTime.arrayIndex,
        parentPath: fieldValuesDateTime.parentPath,
        value: fieldValuesDateTime.valueTimestamp,
        fieldType: sql<string>`'datetime'`.as('fieldType'),
      }).from(fieldValuesDateTime).where(
        and(
          eq(fieldValuesDateTime.documentVersionId, versionId),
          or(
            eq(fieldValuesDateTime.locale, locale),
            eq(fieldValuesDateTime.locale, 'default')
          )
        )
      ),

      this.db.select({
        id: fieldValuesJson.id,
        documentVersionId: fieldValuesJson.documentVersionId,
        collectionId: fieldValuesJson.collectionId,
        fieldPath: fieldValuesJson.fieldPath,
        fieldName: fieldValuesJson.fieldName,
        locale: fieldValuesJson.locale,
        arrayIndex: fieldValuesJson.arrayIndex,
        parentPath: fieldValuesJson.parentPath,
        value: fieldValuesJson.value,
        fieldType: sql<string>`'richText'`.as('fieldType'),
      }).from(fieldValuesJson).where(
        and(
          eq(fieldValuesJson.documentVersionId, versionId),
          eq(fieldValuesJson.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesRelation.id,
        documentVersionId: fieldValuesRelation.documentVersionId,
        collectionId: fieldValuesRelation.collectionId,
        fieldPath: fieldValuesRelation.fieldPath,
        fieldName: fieldValuesRelation.fieldName,
        locale: fieldValuesRelation.locale,
        arrayIndex: fieldValuesRelation.arrayIndex,
        parentPath: fieldValuesRelation.parentPath,
        value: fieldValuesRelation.targetDocumentId,
        fieldType: sql<string>`'relation'`.as('fieldType'),
      }).from(fieldValuesRelation).where(
        and(
          eq(fieldValuesRelation.documentVersionId, versionId),
          eq(fieldValuesRelation.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesFile.id,
        documentVersionId: fieldValuesFile.documentVersionId,
        collectionId: fieldValuesFile.collectionId,
        fieldPath: fieldValuesFile.fieldPath,
        fieldName: fieldValuesFile.fieldName,
        locale: fieldValuesFile.locale,
        arrayIndex: fieldValuesFile.arrayIndex,
        parentPath: fieldValuesFile.parentPath,
        value: fieldValuesFile.fileId,
        fieldType: sql<string>`'file'`.as('fieldType'),
      }).from(fieldValuesFile).where(
        and(
          eq(fieldValuesFile.documentVersionId, versionId),
          eq(fieldValuesFile.locale, locale)
        )
      ),
    ]);

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

export function createEnhancedQueryBuilders(db: DatabaseConnection) {
  return {
    documents: new EnhancedDocumentQueries(db),
  };
}