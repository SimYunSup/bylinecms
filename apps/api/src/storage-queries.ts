/**
 * Byline CMS Server Tests
 * 
 * Optimized Storage Queries - Single Query Approach with UNION ALL
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
 *
 */


import { and, eq, inArray, sql } from "drizzle-orm";
import { collections, currentDocumentsView as documents } from '../database/schema/index.js';

import type {
  CollectionConfig,
  DatabaseConnection,
  FlattenedFieldValue,
  SiteConfig,
  UnifiedFieldValue
} from './@types/index.js'

import {
  booleanFields,
  datetimeFields,
  fileFields,
  jsonFields,
  numericFields,
  relationFields,
  textFields
} from './@types/template-queries.js';

import { reconstructDocument } from './storage-utils.js';

export class CollectionQueries {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async findByPath(path: string) {
    return await this.db.select().from(collections).where(eq(collections.path, path)).limit(1);
  }

  async getAll() {
    return await this.db.select().from(collections);
  }
}


export class DocumentQueries {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  /**
   * getAllCurrentDocumentsForCollection
   */
  async getAllCurrentDocumentsForCollection(
    collectionId: string,
    collectionConfig: CollectionConfig,
    locale = 'all'
  ): Promise<any[]> {
    const localeCondition = locale === 'all'
      ? sql`TRUE`
      : sql`fv.locale = ${locale}`;

    // Optimized single query with direct JOINs
    const query = sql`
    SELECT 
      d.id as document_version_id,
      d.document_id as document_id,
      d.path as document_path,
      d.status as document_status,
      fv.id,
      fv.collection_id,
      fv.field_type,
      fv.field_path,
      fv.field_name,
      fv.locale,
      fv.array_index,
      fv.parent_path,
      fv.text_value,
      fv.numeric_value,
      fv.boolean_value,
      fv.json_value,
      fv.date_type,
      fv.value_date,
      fv.value_time,
      fv.value_timestamp,
      fv.value_timestamp_tz,
      fv.file_id,
      fv.filename,
      fv.original_filename,
      fv.mime_type,
      fv.file_size,
      fv.storage_provider,
      fv.storage_path,
      fv.storage_url,
      fv.file_hash,
      fv.image_width,
      fv.image_height,
      fv.image_format,
      fv.processing_status,
      fv.thumbnail_generated,
      fv.target_document_id,
      fv.target_collection_id,
      fv.relationship_type,
      fv.cascade_delete,
      fv.json_schema,
      fv.object_keys,
      fv.number_type,
      fv.value_integer,
      fv.value_decimal,
      fv.value_float,
      fv.value_bigint
    FROM current_documents d
    LEFT JOIN (
      -- Text fields
      SELECT 
        ${textFields}
      FROM field_values_text

      UNION ALL

      -- Numeric fields
      SELECT 
        ${numericFields}
      FROM field_values_numeric

      UNION ALL

      -- Boolean fields
      SELECT 
        ${booleanFields}
      FROM field_values_boolean

      UNION ALL

      -- DateTime fields
      SELECT 
        ${datetimeFields}
      FROM field_values_datetime

      UNION ALL

      -- JSON fields
      SELECT 
        ${jsonFields}
      FROM field_values_json

      UNION ALL

      -- Relation fields
      SELECT 
        ${relationFields}
      FROM field_values_relation

      UNION ALL

      -- File fields
      SELECT 
        ${fileFields}
      FROM field_values_file
    ) fv ON d.id = fv.document_version_id AND ${localeCondition}
    WHERE d.collection_id = ${collectionId}
    ORDER BY d.id, fv.field_path NULLS LAST, fv.array_index NULLS FIRST, fv.locale
  `;

    const { rows }: { rows: Record<string, unknown>[] } = await this.db.execute(query);

    return this.groupAndReconstructDocuments(rows, collectionConfig, locale);
  }

  /**
   * getAllCurrentDocumentsForCollectionBatched
   */
  async getAllCurrentDocumentsForCollectionBatched(
    collectionId: string,
    collectionConfig: CollectionConfig,
    locale = 'all',
    batchSize = 100
  ): Promise<any[]> {
    // First, get all current document IDs for the collection
    const currentDocuments = await this.db.select({
      document_version_id: documents.id,
      document_id: documents.document_id,
      path: documents.path,
      status: documents.status,
    })
      .from(documents)
      .where(eq(documents.collection_id, collectionId))
      .orderBy(documents.path); // Add consistent ordering

    if (currentDocuments.length === 0) return [];

    // Process documents in batches
    const result: any[] = [];
    const documentVersionIds = currentDocuments.map(doc => doc.document_version_id);

    for (let i = 0; i < documentVersionIds.length; i += batchSize) {
      const batch = documentVersionIds.slice(i, i + batchSize);
      const batchResults = await this.getCurrentDocuments(batch, collectionConfig, locale);

      // Add batch results to final result array
      result.push(...batchResults);
    }

    return result;
  }

  /**
   * getCurrentDocumentsForCollectionPaginated
   */
  async getCurrentDocumentsForCollectionPaginated(
    collectionId: string,
    collectionConfig: CollectionConfig,
    options: {
      locale?: string;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    documents: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const {
      locale = 'all',
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;

    // First get total count
    const totalResult = await this.db.select({
      count: sql<number>`count(*)`,
    })
      .from(documents)
      .where(eq(documents.collection_id, collectionId)
      );

    const total = totalResult[0]?.count || 0;

    if (total === 0) {
      return {
        documents: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      };
    }

    // Get paginated document IDs
    const orderColumn = orderBy === 'path' ? documents.path : documents.created_at;
    const orderFunc = orderDirection === 'asc' ? sql`ASC` : sql`DESC`;

    const paginatedDocs = await this.db.select({
      id: documents.id,
    })
      .from(documents)
      .where(eq(documents.collection_id, collectionId),
      )
      .orderBy(sql`${orderColumn} ${orderFunc}`)
      .limit(limit)
      .offset(offset);

    const documentVersionIds = paginatedDocs.map(doc => doc.id);
    const documentsData = await this.getCurrentDocuments(documentVersionIds, collectionConfig, locale);

    return {
      documents: documentsData,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  async getCurrentDocumentByPath(collectionConfig: CollectionConfig, collection_id: string, path: string) {
    // 1. Get current version
    const currentDocument = await this.db.select()
      .from(documents)
      .where(
        and(
          eq(documents.collection_id, collection_id),
          eq(documents.path, path)
        )
      )

    if (!currentDocument[0]) {
      return null; // or throw new Error(`Document not found at path: ${path}`);
    }

    // 2. Get all field values for this document
    const unifiedFieldValues = await this.getAllFieldValues(
      currentDocument[0].id,
      'all' // or pass locale parameter
    );

    // 3. Convert unified values back to FlattenedFieldValue format
    const fieldValues = this.convertUnifiedToFlattenedFieldValues(unifiedFieldValues);

    // 4. Reconstruct the document
    const reconstructedDocument = reconstructDocument(
      fieldValues,
      collectionConfig,
      'all' // or pass locale parameter
    );

    // 5. Add document metadata
    return {
      document_version_id: currentDocument[0].id,
      document_id: currentDocument[0].document_id,
      path: currentDocument[0].path,
      status: currentDocument[0].status,
      ...reconstructedDocument
    };
  }

  /**
   * getCurrentDocument
   */
  async getCurrentDocument(
    documentVersionId: string,
    collectionConfig: CollectionConfig,
    locale = 'all'
  ): Promise<any> {
    // 1. Get current version
    const currentDocument = await this.db.select()
      .from(documents)
      .where(eq(documents.id, documentVersionId))

    if (!currentDocument[0]) {
      throw new Error(`No current version found for document ${documentVersionId}`);
    }

    // 2. Get all field values in a single query using UNION ALL
    const unifiedFieldValues = await this.getAllFieldValues(
      currentDocument[0].id,
      locale
    );

    // 3. Convert unified values back to FlattenedFieldValue format
    const fieldValues = this.convertUnifiedToFlattenedFieldValues(unifiedFieldValues);

    // 4. Reconstruct the document
    return reconstructDocument(
      fieldValues,
      collectionConfig,
      locale
    );
  }

  /**
   * getCurrentDocuments (multiple)
   */
  async getCurrentDocuments(
    documentVersionIds: string[],
    collectionConfig: CollectionConfig,
    locale = 'all'
  ): Promise<any[]> {
    if (documentVersionIds.length === 0) return [];

    // Get current documents
    const docs = await this.db.select({
      document_version_id: documents.id,
      document_id: documents.document_id,
      document_path: documents.path,
      document_status: documents.status,
    })
      .from(documents)
      .where(inArray(documents.id, documentVersionIds));

    if (docs.length === 0) return [];

    // Get all field values for all versions in one query
    const versionIds = docs.map(v => v.document_version_id);

    const allFieldValues = await this.getAllFieldValuesForMultipleVersions(
      versionIds,
      locale
    );

    // Group field values by document version
    const fieldValuesByVersion = new Map<string, UnifiedFieldValue[]>();
    for (const fieldValue of allFieldValues) {
      if (!fieldValuesByVersion.has(fieldValue.document_version_id)) {
        fieldValuesByVersion.set(fieldValue.document_version_id, []);
      }
      fieldValuesByVersion.get(fieldValue.document_version_id)?.push(fieldValue);
    }

    // Reconstruct each document with metadata at root level
    const result: any[] = [];
    for (const doc of docs) {
      const versionFieldValues = fieldValuesByVersion.get(doc.document_version_id) || [];
      const flattenedFieldValues = this.convertUnifiedToFlattenedFieldValues(versionFieldValues);

      const reconstructedDocument = reconstructDocument(
        flattenedFieldValues,
        collectionConfig,
        locale
      );

      // Add document metadata at root level
      const documentWithMetadata = {
        document_version_id: doc.document_version_id,
        document_id: doc.document_id,
        path: doc.document_path,
        status: doc.document_status,
        ...reconstructedDocument
      };

      result.push(documentWithMetadata);
    }

    // Sort by document path for consistent ordering
    return result.sort((a, b) => (a.path || '').localeCompare(b.path || ''));
  }

  /**
   * getFieldValuesByPaths (possibly useful for partial updates - although
   * we may not use this)
   */
  async getFieldValuesByPaths(
    documentVersionId: string,
    fieldPaths: string[],
    locale = 'all'
  ): Promise<FlattenedFieldValue[]> {
    if (fieldPaths.length === 0) return [];

    // Get current version
    const currentDocument = await this.db.select()
      .from(documents)
      .where(eq(documents.id, documentVersionId),
      )

    if (!currentDocument[0]) return [];

    const localeCondition = locale === 'all'
      ? sql``
      : sql`AND locale = ${locale}`;

    const pathCondition = sql`field_path = ANY(${fieldPaths})`;

    // Similar UNION ALL query but filtered by field paths
    const query = sql`
      SELECT 
        'text' as "field_type", field_path as "field_path", field_name as "field_name",
        locale, array_index as "array_index", parent_path as "parent_path",
        value as "text_value"
      FROM field_values_text 
      WHERE document_version_id = ${currentDocument[0].id} 
        AND ${pathCondition} ${localeCondition}

      UNION ALL

      SELECT 
        'numeric', field_path, field_name, locale, array_index, parent_path,
        COALESCE(value_integer::text, value_decimal::text, value_float::text, value_bigint::text)
      FROM field_values_numeric 
      WHERE document_version_id = ${currentDocument[0].id} 
        AND ${pathCondition} ${localeCondition}

      -- Add other field types as needed...

      ORDER BY field_path, array_index NULLS FIRST, locale
    `;

    const results = await this.db.execute(query) as unknown as UnifiedFieldValue[];
    // Convert to FlattenedFieldValue format
    return this.convertUnifiedToFlattenedFieldValues(results);
  }

  /**
 * Helper method to group results by document and reconstruct each document
 * Returns an array of complete documents
 */
  private groupAndReconstructDocuments(
    rows: Record<string, unknown>[],
    collectionConfig: CollectionConfig,
    locale: string
  ): any[] {
    // Group rows by document ID
    const documentGroups = new Map<string, {
      document: { document_version_id: string; document_id: string; path: string; status: string };
      fieldValues: UnifiedFieldValue[];
    }>();

    for (const row of rows) {
      const documentVersionId = row.document_version_id as string;

      if (!documentGroups.has(documentVersionId)) {
        documentGroups.set(documentVersionId, {
          document: {
            document_version_id: documentVersionId,
            document_id: row.document_id as string,
            path: row.document_path as string,
            status: row.document_status as string,
          },
          fieldValues: []
        });
      }

      // Only add field values if they exist (LEFT JOIN can return null field values)
      if (row.id) {
        const fieldValue: UnifiedFieldValue = {
          id: row.id as string,
          document_version_id: row.document_version_id as string,
          collection_id: row.collection_id as string,
          field_type: row.field_type as string,
          field_path: row.field_path as string,
          field_name: row.field_name as string,
          locale: row.locale as string,
          array_index: row.array_index as number | null,
          parent_path: row.parent_path as string | null,
          text_value: row.text_value as string | null,
          numeric_value: row.numeric_value as string | null,
          boolean_value: row.boolean_value as boolean | null,
          json_value: row.json_value as any,
          date_type: row.date_type as string | null,
          value_date: row.value_date as Date | null,
          value_time: row.value_time as string | null,
          value_timestamp: row.value_timestamp as Date | null,
          value_timestamp_tz: row.value_timestamp_tz as Date | null,
          file_id: row.file_id as string | null,
          filename: row.filename as string | null,
          original_filename: row.original_filename as string | null,
          mime_type: row.mime_type as string | null,
          file_size: row.file_size as number | null,
          storage_provider: row.storage_provider as string | null,
          storage_path: row.storage_path as string | null,
          storage_url: row.storage_url as string | null,
          file_hash: row.file_hash as string | null,
          image_width: row.image_width as number | null,
          image_height: row.image_height as number | null,
          image_format: row.image_format as string | null,
          processing_status: row.processing_status as string | null,
          thumbnail_generated: row.thumbnail_generated as boolean | null,
          target_document_id: row.target_document_id as string | null,
          target_collection_id: row.target_collection_id as string | null,
          relationship_type: row.relationship_type as string | null,
          cascade_delete: row.cascade_delete as boolean | null,
          json_schema: row.json_schema as string | null,
          object_keys: row.object_keys as string[] | null,
          number_type: row.number_type as string | null,
          value_integer: row.value_integer as number | null,
          value_decimal: row.value_decimal as string | null,
          value_float: row.value_float as number | null,
          value_bigint: row.value_bigint as string | null,
        };

        documentGroups.get(documentVersionId)?.fieldValues.push(fieldValue);
      }
    }

    // Reconstruct each document and return as array
    const result: any[] = [];

    for (const [documentId, group] of documentGroups) {
      const flattenedFieldValues = this.convertUnifiedToFlattenedFieldValues(group.fieldValues);

      const head = {
        document_version_od: group.document.document_version_id,
        document_id: group.document.document_id,
        path: group.document.path,
        status: group.document.status
      }

      const document = reconstructDocument(
        flattenedFieldValues,
        collectionConfig,
        locale
      );

      result.push({ ...head, ...document });
    }

    // Sort by document path for consistent ordering
    return result.sort((a, b) => (a.__meta?.path || '').localeCompare(b.__meta?.path || ''));
  }

  /**
   * Gets all field values using a single UNION ALL query
   */
  private async getAllFieldValues(
    documentVersionId: string,
    locale = 'all'
  ): Promise<UnifiedFieldValue[]> {
    const localeCondition = locale === 'all'
      ? sql``
      : sql`AND locale = ${locale}`;

    const query = sql`
      -- Text fields (43 columns total)
      SELECT 
        ${textFields}
      FROM field_values_text 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- Numeric fields (43 columns total - SAME ORDER)
      SELECT 
        ${numericFields}
      FROM field_values_numeric 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- Boolean fields (43 columns total - SAME ORDER)
      SELECT 
        ${booleanFields}
      FROM field_values_boolean 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- DateTime fields (43 columns total - SAME ORDER)
      SELECT 
        ${datetimeFields}
      FROM field_values_datetime 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- JSON fields (43 columns total - SAME ORDER)
      SELECT 
       ${jsonFields}
      FROM field_values_json 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- Relation fields (43 columns total - SAME ORDER)
      SELECT 
        ${relationFields}
      FROM field_values_relation 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- File fields (43 columns total - SAME ORDER)
      SELECT 
        ${fileFields}
      FROM field_values_file 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      ORDER BY field_path, array_index NULLS FIRST, locale
    `;

    const { rows }: { rows: Record<string, unknown>[] } = await this.db.execute(query);
    return rows as unknown as UnifiedFieldValue[];
  }

  /**
   * Gets field values for multiple versions in a single query
   */
  private async getAllFieldValuesForMultipleVersions(
    documentVersionIds: string[],
    locale = 'all'
  ): Promise<UnifiedFieldValue[]> {
    if (documentVersionIds.length === 0) return [];

    const localeCondition = locale === 'all'
      ? sql``
      : sql`AND locale = ${locale}`;

    // const documentCondition = sql``
    const documentCondition = sql`document_version_id = ANY(ARRAY[${sql.join(documentVersionIds.map(id => sql`${id}::uuid`), sql`, `)}])`;
    // const documentCondition = sql`document_id = ANY(ARRAY[${sql.join(documentIds.map(id => sql`${id}`), sql`, `)}])`;

    // Use the same UNION ALL query but with IN clause for multiple versions
    const query = sql`
      -- Text fields (43 columns total)
      SELECT 
         ${textFields}
      FROM field_values_text 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- Numeric fields (43 columns total - SAME ORDER)
      SELECT 
         ${numericFields}
      FROM field_values_numeric 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- Boolean fields (43 columns total - SAME ORDER)
      SELECT 
        ${booleanFields}
      FROM field_values_boolean 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- DateTime fields (43 columns total - SAME ORDER)
      SELECT 
        ${datetimeFields}
      FROM field_values_datetime 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

     -- JSON fields (43 columns total - SAME ORDER)
      SELECT 
        ${jsonFields}
      FROM field_values_json 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- Relation fields (43 columns total - SAME ORDER)
      SELECT 
        ${relationFields}
      FROM field_values_relation 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- File fields (43 columns total - SAME ORDER)
      SELECT 
        ${fileFields}
      FROM field_values_file 
      WHERE ${documentCondition} ${localeCondition}

      ORDER BY document_id, field_path, array_index NULLS FIRST, locale
    `;

    const { rows }: { rows: Record<string, unknown>[] } = await this.db.execute(query);
    return rows as unknown as UnifiedFieldValue[];
  }

  /**
   * Converts unified field values back to the FlattenedFieldValue format
   * that the reconstruction utilities expect
   */
  private convertUnifiedToFlattenedFieldValues(
    unifiedValues: UnifiedFieldValue[]
  ): FlattenedFieldValue[] {
    return unifiedValues.map(unified => {
      const baseValue = {
        field_path: unified.field_path,
        field_name: unified.field_name,
        locale: unified.locale,
        array_index: unified.array_index ?? undefined,
        parent_path: unified.parent_path ?? undefined,
      };

      switch (unified.field_type) {
        case 'text':
          return {
            ...baseValue,
            field_type: 'text' as const,
            value: unified.text_value!,
          };

        case 'richText':
          return {
            ...baseValue,
            field_type: 'richText' as const,
            value: unified.json_value!,
          };

        case 'numeric':
          return {
            ...baseValue,
            field_type: unified.number_type as 'number' | 'integer' | 'decimal',
            value: unified.number_type === 'integer'
              ? unified.value_integer!
              : unified.number_type === 'decimal'
                ? Number.parseFloat(unified.value_decimal!)
                : unified.number_type === 'float'
                  ? unified.value_float!
                  : Number.parseInt(unified.value_bigint!),
          };

        case 'boolean':
          return {
            ...baseValue,
            field_type: 'boolean' as const,
            value: unified.boolean_value!,
          };

        case 'datetime':
          return {
            ...baseValue,
            field_type: 'datetime' as const,
            date_type: unified.date_type as any,
            value_time: unified.value_time!,
            value_date: unified.value_date!,
            value_timestamp: unified.value_timestamp!,
            value_timestamp_tz: unified.value_timestamp_tz!,
          };

        case 'file':
          return {
            ...baseValue,
            field_type: 'file' as const,
            file_id: unified.file_id!,
            filename: unified.filename!,
            original_filename: unified.original_filename!,
            mime_type: unified.mime_type!,
            file_size: unified.file_size!,
            storage_provider: unified.storage_provider!,
            storage_path: unified.storage_path!,
            storage_url: unified.storage_url,
            file_hash: unified.file_hash,
            image_width: unified.image_width,
            image_height: unified.image_height,
            image_format: unified.image_format,
            processing_status: unified.processing_status,
            thumbnail_generated: unified.thumbnail_generated,
          };

        case 'relation':
          return {
            ...baseValue,
            field_type: 'relation' as const,
            target_document_id: unified.target_document_id!,
            target_collection_id: unified.target_collection_id!,
            relationship_type: unified.relationship_type,
            cascade_delete: unified.cascade_delete,
          };

        default:
          throw new Error(`Unknown field type: ${unified.field_type}`);
      }
    }) as FlattenedFieldValue[];
  }
}

// FACTORY FUNCTION FOR CONVENIENCE
// ================================

export function createQueryBuilders(siteConfig: SiteConfig, db: DatabaseConnection) {
  return {
    collections: new CollectionQueries(siteConfig, db),
    documents: new DocumentQueries(siteConfig, db),
  };
}
