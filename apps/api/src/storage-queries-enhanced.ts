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
  currentDocumentsView,
  documents,
  fieldValuesBoolean,
  fieldValuesDatetime,
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
    document_id: string,
    collectionConfig: CollectionConfig,
    locale = 'all'
  ): Promise<any> {
    // 1. Get current version
    const currentVersion = await this.db.select()
      .from(currentDocumentsView)
      .where(eq(currentDocumentsView.document_id, document_id))

    if (!currentVersion[0]) {
      throw new Error(`No current version found for document ${document_id}`);
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
    document_id: string,
    field_name: string,
    fieldConfig: any,
    locale = 'all'
  ): Promise<any[]> {
    // Get current version
    const currentVersion = await this.db.select()
      .from(currentDocumentsView)
      .where(eq(currentDocumentsView.document_id, document_id))

    if (!currentVersion[0]) {
      throw new Error(`No current version found for document ${document_id}`);
    }

    // Get field values for this array field
    const fieldValues = await this.getArrayFieldValues(
      currentVersion[0].id,
      field_name,
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
    documentId: string,
    locale = 'all'
  ): Promise<FlattenedFieldValue[]> {

    /**
     * Consider using a single query with UNION ALL
     * This should be more efficient than multiple separate queries, 
     * especially for large datasets.
     * Example:
          return await this.db.execute(sql`
              SELECT 'text' as type, field_path, value, locale FROM field_values_text WHERE document_id = ${documentId}
              UNION ALL
              SELECT 'numeric' as type, field_path, value_integer::text, locale FROM field_values_numeric WHERE document_id = ${documentId}
          -- ... etc
        `);
     */
    const queries = await Promise.all([
      // 1. Text field values
      this.db.select({
        id: fieldValuesText.id,
        document_id: fieldValuesText.document_id,
        collection_id: fieldValuesText.collection_id,
        field_type: sql<string>`'text'`.as('field_type'),
        field_path: fieldValuesText.field_path,
        field_name: fieldValuesText.field_name,
        locale: fieldValuesText.locale,
        array_index: fieldValuesText.array_index,
        parent_path: fieldValuesText.parent_path,
        value: fieldValuesText.value,
      }).from(fieldValuesText).where(
        locale === 'all'
          ? eq(fieldValuesText.document_id, documentId)
          : and(eq(fieldValuesText.document_id, documentId), eq(fieldValuesText.locale, locale))
      ),

      // 2. Numeric field values
      this.db.select({
        id: fieldValuesNumeric.id,
        document_id: fieldValuesNumeric.document_id,
        collection_id: fieldValuesNumeric.collection_id,
        field_type: sql<string>`'numeric'`.as('field_type'),
        field_path: fieldValuesNumeric.field_path,
        field_name: fieldValuesNumeric.field_name,
        locale: fieldValuesNumeric.locale,
        array_index: fieldValuesNumeric.array_index,
        parent_path: fieldValuesNumeric.parent_path,
        value: fieldValuesNumeric.value_integer, // Simplified - would need type-specific handling
      }).from(fieldValuesNumeric).where(
        locale === 'all'
          ? eq(fieldValuesNumeric.document_id, documentId)
          : and(eq(fieldValuesNumeric.document_id, documentId), eq(fieldValuesNumeric.locale, locale))
      ),

      // 3. Boolean field values
      this.db.select({
        id: fieldValuesBoolean.id,
        document_id: fieldValuesBoolean.document_id,
        collection_id: fieldValuesBoolean.collection_id,
        field_type: sql<string>`'boolean'`.as('field_type'),
        field_path: fieldValuesBoolean.field_path,
        field_name: fieldValuesBoolean.field_name,
        locale: fieldValuesBoolean.locale,
        array_index: fieldValuesBoolean.array_index,
        parent_path: fieldValuesBoolean.parent_path,
        value: fieldValuesBoolean.value,
      }).from(fieldValuesBoolean).where(
        locale === 'all'
          ? eq(fieldValuesBoolean.document_id, documentId)
          : and(eq(fieldValuesBoolean.document_id, documentId), eq(fieldValuesBoolean.locale, locale))
      ),

      // 4. DateTime field values
      this.db.select({
        id: fieldValuesDatetime.id,
        document_id: fieldValuesDatetime.document_id,
        collection_id: fieldValuesDatetime.collection_id,
        field_type: sql<string>`'datetime'`.as('field_type'),
        field_path: fieldValuesDatetime.field_path,
        field_name: fieldValuesDatetime.field_name,
        locale: fieldValuesDatetime.locale,
        array_index: fieldValuesDatetime.array_index,
        parent_path: fieldValuesDatetime.parent_path,

        value_date: fieldValuesDatetime.value_date,
        value_time: fieldValuesDatetime.value_time,
        value_timestamp: fieldValuesDatetime.value_timestamp,
        value_timestamp_tz: fieldValuesDatetime.value_timestamp_tz,
      }).from(fieldValuesDatetime).where(
        locale === 'all'
          ? eq(fieldValuesDatetime.document_id, documentId)
          : and(eq(fieldValuesDatetime.document_id, documentId), eq(fieldValuesDatetime.locale, locale))
      ),

      // 5. Json field values
      this.db.select({
        id: fieldValuesJson.id,
        document_id: fieldValuesJson.document_id,
        collection_id: fieldValuesJson.collection_id,
        field_type: sql<string>`'richText'`.as('field_type'),
        field_path: fieldValuesJson.field_path,
        field_name: fieldValuesJson.field_name,
        locale: fieldValuesJson.locale,
        array_index: fieldValuesJson.array_index,
        parent_path: fieldValuesJson.parent_path,
        value: fieldValuesJson.value,
        json_schema: fieldValuesJson.json_schema,
        object_keys: fieldValuesJson.object_keys
      }).from(fieldValuesJson).where(
        locale === 'all'
          ? eq(fieldValuesJson.document_id, documentId)
          : and(eq(fieldValuesJson.document_id, documentId), eq(fieldValuesJson.locale, locale))
      ),

      // 6. Relation field values
      this.db.select({
        id: fieldValuesRelation.id,
        document_id: fieldValuesRelation.document_id,
        collection_id: fieldValuesRelation.collection_id,
        field_type: sql<string>`'relation'`.as('field_type'),
        field_path: fieldValuesRelation.field_path,
        field_name: fieldValuesRelation.field_name,
        locale: fieldValuesRelation.locale,
        array_index: fieldValuesRelation.array_index,
        parent_path: fieldValuesRelation.parent_path,
        target_document_id: fieldValuesRelation.target_document_id,
        target_collection_id: fieldValuesRelation.target_collection_id,
        relationship_type: fieldValuesRelation.relationship_type,
        cascade_delete: fieldValuesRelation.cascade_delete,
      }).from(fieldValuesRelation).where(
        locale === 'all'
          ? eq(fieldValuesRelation.document_id, documentId)
          : and(eq(fieldValuesRelation.document_id, documentId), eq(fieldValuesRelation.locale, locale))
      ),

      // 7. File field values
      this.db.select({
        id: fieldValuesFile.id,
        document_id: fieldValuesFile.document_id,
        collection_id: fieldValuesFile.collection_id,
        field_type: sql<string>`'file'`.as('field_type'),
        field_path: fieldValuesFile.field_path,
        field_name: fieldValuesFile.field_name,
        locale: fieldValuesFile.locale,
        array_index: fieldValuesFile.array_index,
        parent_path: fieldValuesFile.parent_path,

        file_id: fieldValuesFile.file_id,
        filename: fieldValuesFile.filename,
        original_filename: fieldValuesFile.original_filename,

        // File metadata
        mime_type: fieldValuesFile.mime_type,
        file_hash: fieldValuesFile.file_hash,
        file_size: fieldValuesFile.file_size,

        // Storage information
        storage_provider: fieldValuesFile.storage_provider,
        storage_path: fieldValuesFile.storage_path,
        storage_url: fieldValuesFile.storage_url,

        // Image-specific metadata (when applicable)
        image_width: fieldValuesFile.image_width,
        image_height: fieldValuesFile.image_height,
        image_format: fieldValuesFile.image_format,

        // File processing status
        processing_status: fieldValuesFile.processing_status,
        thumbnail_generated: fieldValuesFile.thumbnail_generated,
      }).from(fieldValuesFile).where(
        locale === 'all'
          ? eq(fieldValuesFile.document_id, documentId)
          : and(eq(fieldValuesFile.document_id, documentId), eq(fieldValuesFile.locale, locale))
      ),
    ]);

    // TODO: Fix
    // @ts-ignore
    return queries.flat().sort((a, b) => a.field_path.localeCompare(b.field_path));
  }

  private async getArrayFieldValues(
    documentId: string,
    field_name: string,
    locale: string
  ) {
    // Query field values where field_path starts with the field name
    const allFieldValues = await this.getAllFieldValuesForVersion(documentId, locale);

    return allFieldValues.filter(fv =>
      fv.field_path === field_name || fv.field_path.startsWith(`${field_name}.`)
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