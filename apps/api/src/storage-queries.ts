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


import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from '../database/schema/index.js'
import { collections, currentDocumentsView as documents } from '../database/schema/index.js';

type DatabaseConnection = NodePgDatabase<typeof schema>;

import type { CollectionDefinition, SiteConfig } from "@byline/byline/@types/index";
import { create } from "domain";
import type {
  FlattenedStore,
  UnionRowValue
} from './@types/index.js'
import {
  booleanFields,
  datetimeFields,
  fileFields,
  jsonFields,
  numericFields,
  relationFields,
  textFields
} from './storage-template-queries.js';
import { reconstructDocument } from './storage-utils.js';

export class CollectionQueries {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async findByPath(path: string) {
    return this.db.query.collections.findFirst({ where: eq(collections.path, path) });
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
      fv.parent_path,
      fv.text_value,
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
      fv.value_float
    FROM current_documents d
    LEFT JOIN (
      -- Text fields
      SELECT 
        ${textFields}
      FROM text_store

      UNION ALL

      -- Numeric fields
      SELECT 
        ${numericFields}
      FROM numeric_store

      UNION ALL

      -- Boolean fields
      SELECT 
        ${booleanFields}
      FROM boolean_store

      UNION ALL

      -- DateTime fields
      SELECT 
        ${datetimeFields}
      FROM datetime_store

      UNION ALL

      -- JSON fields
      SELECT 
        ${jsonFields}
      FROM json_store

      UNION ALL

      -- Relation fields
      SELECT 
        ${relationFields}
      FROM relation_store

      UNION ALL

      -- File fields
      SELECT 
        ${fileFields}
      FROM file_store
    ) fv ON d.id = fv.document_version_id AND ${localeCondition}
    WHERE d.collection_id = ${collectionId}
    ORDER BY d.id, fv.field_path NULLS LAST, fv.locale
  `;

    const { rows }: { rows: Record<string, unknown>[] } = await this.db.execute(query);

    return this.groupAndReconstructDocuments(rows, locale);
  }

  /**
   * getAllCurrentDocumentsForCollectionBatched
   */
  async getAllCurrentDocumentsForCollectionBatched(
    collectionId: string,
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
      const batchResults = await this.getCurrentDocuments(batch, locale);

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
    options: {
      locale?: string;
      page?: number;
      page_size?: number;
      order?: string;
      desc?: boolean;
    } = {}
  ): Promise<{
    documents: any[];
    meta: {
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      order: string;
      desc: boolean;
    };
    included: {
      collection: {
        id: string;
        path: string,
        labels: {
          singular: string;
          plural: string;
        }
      }
    }
  }> {
    const {
      locale = 'all',
      page = 1,
      page_size = 20,
      order = 'created_at',
      desc = true
    } = options;

    const collection = await this.db.query.collections.findFirst({
      where: eq(collections.id, collectionId)
    });

    if (collection == null || collection.config == null
    ) {
      throw new Error(`Collection with ID ${collectionId} not found or missing collection config.`);
    }

    const config = collection.config as CollectionDefinition;

    // First get total count
    const totalResult = await this.db.select({
      count: sql<number>`count(*)`,
    })
      .from(documents)
      .where(eq(documents.collection_id, collectionId)
      );

    // Most robust - handles strings, nulls, undefined, etc.
    const total = Number(totalResult[0]?.count) || 0;

    // Alternative approaches:
    // const total = parseInt(String(totalResult[0]?.count || 0), 10);
    // const total = Math.max(0, Number(totalResult[0]?.count) || 0); // ensures non-negative
    // const total = +(totalResult[0]?.count || 0); // unary plus operator

    const total_pages = Math.ceil(total / page_size);
    const offset = (page - 1) * page_size;

    // Get paginated document IDs
    const orderColumn = order === 'path' ? documents.path : documents.created_at;
    const orderFunc = desc === true ? sql`DESC` : sql`ASC`;

    const paginatedDocs = await this.db.select({
      id: documents.id,
    })
      .from(documents)
      .where(eq(documents.collection_id, collectionId),
      )
      .orderBy(sql`${orderColumn} ${orderFunc}`)
      .limit(page_size)
      .offset(offset);

    const documentVersionIds = paginatedDocs.map(doc => doc.id);
    const documentsData = await this.getCurrentDocuments(documentVersionIds, locale);

    return {
      documents: documentsData,
      meta: { total, page, page_size, total_pages, order, desc },
      included: {
        collection: {
          id: collection.id,
          path: collection.path,
          labels: {
            singular: config.labels.singular || collection.path,
            plural: config.labels.plural || collection.path,
          }
        }
      }
    };
  }

  async getCurrentDocumentByPath(collection_id: string, path: string) {
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

    // 3. Convert unified values back to FlattenedStore format
    const fieldValues = this.convertUnionRowToFlattenedStores(unifiedFieldValues);

    // 4. Reconstruct the document
    const reconstructedDocument = reconstructDocument(
      fieldValues,
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

    // 3. Convert unified values back to FlattenedStore format
    const fieldValues = this.convertUnionRowToFlattenedStores(unifiedFieldValues);

    // 4. Reconstruct the document
    return reconstructDocument(
      fieldValues,
      locale
    );
  }

  /**
   * getCurrentDocuments (multiple)
   */
  async getCurrentDocuments(
    documentVersionIds: string[],
    locale = 'all'
  ): Promise<any[]> {
    if (documentVersionIds.length === 0) return [];

    // Get current documents
    const docs = await this.db.select({
      document_version_id: documents.id,
      document_id: documents.document_id,
      path: documents.path,
      status: documents.status,
      created_at: documents.created_at,
      updated_at: documents.updated_at,
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
    const fieldValuesByVersion = new Map<string, UnionRowValue[]>();
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
      const flattenedFieldValues = this.convertUnionRowToFlattenedStores(versionFieldValues);

      const reconstructedDocument = reconstructDocument(
        flattenedFieldValues,
        locale
      );

      // Add document metadata at root level
      const documentWithMetadata = {
        document_version_id: doc.document_version_id,
        document_id: doc.document_id,
        path: doc.path,
        status: doc.status,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        ...reconstructedDocument
      };

      result.push(documentWithMetadata);
    }

    // Sort by document path for consistent ordering
    return result.sort((a, b) => (a.path || '').localeCompare(b.path || ''));
  }

  async getDocumentHistory(
    documentId: string,
    collectionId: string
  ): Promise<any[]> {
    // Get all versions of the document
    const docs = await this.db.select({
      document_version_id: documents.id,
      document_id: documents.document_id,
      action: documents.event_type,
      is_deleted: documents.is_deleted,
      path: documents.path,
      status: documents.status,
      created_at: documents.created_at,
      updated_at: documents.updated_at,
    }).from(documents)
      .where(
        and(
          eq(documents.document_id, documentId),
          eq(documents.collection_id, collectionId)
        )
      ).orderBy(documents.id);

    return docs
  }

  /**
 * Helper method to group results by document and reconstruct each document
 * Returns an array of complete documents
 */
  private groupAndReconstructDocuments(
    rows: Record<string, unknown>[],
    locale: string
  ): any[] {
    // Group rows by document ID
    const documentGroups = new Map<string, {
      document: { document_version_id: string; document_id: string; path: string; status: string };
      fieldValues: UnionRowValue[];
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
        const fieldValue: UnionRowValue = {
          id: row.id as string,
          document_version_id: row.document_version_id as string,
          collection_id: row.collection_id as string,
          field_type: row.field_type as string,
          field_path: row.field_path as string,
          field_name: row.field_name as string,
          locale: row.locale as string,
          parent_path: row.parent_path as string | null,
          text_value: row.text_value as string | null,
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
        };

        documentGroups.get(documentVersionId)?.fieldValues.push(fieldValue);
      }
    }

    // Reconstruct each document and return as array
    const result: any[] = [];

    for (const [documentId, group] of documentGroups) {
      const flattenedFieldValues = this.convertUnionRowToFlattenedStores(group.fieldValues);

      const head = {
        document_version_id: group.document.document_version_id,
        document_id: group.document.document_id,
        path: group.document.path,
        status: group.document.status
      }

      const document = reconstructDocument(
        flattenedFieldValues,
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
  ): Promise<UnionRowValue[]> {
    const localeCondition = locale === 'all'
      ? sql``
      : sql`AND locale = ${locale}`;

    const query = sql`
      -- Text fields (41 columns total)
      SELECT 
        ${textFields}
      FROM text_store 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- Numeric fields (41 columns total - SAME ORDER)
      SELECT 
        ${numericFields}
      FROM numeric_store 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- Boolean fields (41 columns total - SAME ORDER)
      SELECT 
        ${booleanFields}
      FROM boolean_store 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- DateTime fields (41 columns total - SAME ORDER)
      SELECT 
        ${datetimeFields}
      FROM datetime_store 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- JSON fields (41 columns total - SAME ORDER)
      SELECT 
       ${jsonFields}
      FROM json_store 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- Relation fields (41 columns total - SAME ORDER)
      SELECT 
        ${relationFields}
      FROM relation_store 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      UNION ALL

      -- File fields (41 columns total - SAME ORDER)
      SELECT 
        ${fileFields}
      FROM file_store 
      WHERE document_version_id = ${documentVersionId} ${localeCondition}

      ORDER BY field_path, locale
    `;

    const { rows }: { rows: Record<string, unknown>[] } = await this.db.execute(query);
    return rows as unknown as UnionRowValue[];
  }

  /**
   * Gets field values for multiple versions in a single query
   */
  private async getAllFieldValuesForMultipleVersions(
    documentVersionIds: string[],
    locale = 'all'
  ): Promise<UnionRowValue[]> {
    if (documentVersionIds.length === 0) return [];

    const localeCondition = locale === 'all'
      ? sql``
      : sql`AND locale = ${locale}`;

    const documentCondition = sql`document_version_id = ANY(ARRAY[${sql.join(documentVersionIds.map(id => sql`${id}::uuid`), sql`, `)}])`;

    // Use the same UNION ALL query but with IN clause for multiple versions
    const query = sql`
      -- Text fields (41 columns total)
      SELECT 
         ${textFields}
      FROM text_store 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- Numeric fields (41 columns total - SAME ORDER)
      SELECT 
         ${numericFields}
      FROM numeric_store 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- Boolean fields (41 columns total - SAME ORDER)
      SELECT 
        ${booleanFields}
      FROM boolean_store 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- DateTime fields (41 columns total - SAME ORDER)
      SELECT 
        ${datetimeFields}
      FROM datetime_store 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

     -- JSON fields (41 columns total - SAME ORDER)
      SELECT 
        ${jsonFields}
      FROM json_store 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- Relation fields (41 columns total - SAME ORDER)
      SELECT 
        ${relationFields}
      FROM relation_store 
      WHERE ${documentCondition} ${localeCondition}

      UNION ALL

      -- File fields (41 columns total - SAME ORDER)
      SELECT 
        ${fileFields}
      FROM file_store 
      WHERE ${documentCondition} ${localeCondition}

      ORDER BY document_version_id, field_path, locale
    `;

    const { rows }: { rows: Record<string, unknown>[] } = await this.db.execute(query);
    return rows as unknown as UnionRowValue[];
  }

  /**
   * Converts a union field row - back into an array of FlattenedStore
   * that the reconstruction utilities expect
   */
  private convertUnionRowToFlattenedStores(
    unionRowValues: UnionRowValue[]
  ): FlattenedStore[] {
    return unionRowValues.map(row => {
      const baseValue = {
        field_path: row.field_path,
        field_name: row.field_name,
        locale: row.locale,
        parent_path: row.parent_path ?? undefined,
      };

      switch (row.field_type) {
        case 'text':
          return {
            ...baseValue,
            field_type: 'text' as const,
            value: row.text_value,
          };

        case 'richText':
          return {
            ...baseValue,
            field_type: 'richText' as const,
            value: row.json_value,
          };

        case 'numeric':
          return {
            ...baseValue,
            field_type: row.number_type as 'float' | 'integer' | 'decimal',
            number_type: row.number_type,
            value_integer: row.value_integer,
            value_decimal: row.value_decimal,
            value_float: row.value_float,
          };

        // case 'numeric':
        //   return {
        //     ...baseValue,
        //     field_type: row.number_type as 'float' | 'integer' | 'decimal',
        //     value: row.number_type === 'integer'
        //       ? row.value_integer
        //       : row.number_type === 'decimal'
        //         ? Number.parseFloat(row.value_decimal as string)
        //         : row.number_type
        //   };

        // case 'number':
        // case 'integer':
        // case 'bigint':
        // case 'decimal': {
        //   return {
        //     ...baseValue,
        //     field_type: unified.field_type,
        //     value_integer: unified.value_integer,
        //     value_decimal: unified.value_decimal,
        //     value_float: unified.value_float,
        //     value_bigint: unified.value_bigint
        //   };
        // }

        case 'boolean':
          return {
            ...baseValue,
            field_type: 'boolean' as const,
            value: row.boolean_value,
          };

        case 'datetime':
          return {
            ...baseValue,
            field_type: 'datetime' as const,
            date_type: row.date_type,
            value_time: row.value_time,
            value_date: row.value_date,
            value_timestamp: row.value_timestamp,
            value_timestamp_tz: row.value_timestamp_tz,
          };

        case 'file':
          return {
            ...baseValue,
            field_type: 'file' as const,
            file_id: row.file_id,
            filename: row.filename,
            original_filename: row.original_filename,
            mime_type: row.mime_type,
            file_size: row.file_size,
            storage_provider: row.storage_provider,
            storage_path: row.storage_path,
            storage_url: row.storage_url,
            file_hash: row.file_hash,
            image_width: row.image_width,
            image_height: row.image_height,
            image_format: row.image_format,
            processing_status: row.processing_status,
            thumbnail_generated: row.thumbnail_generated,
          };

        case 'relation':
          return {
            ...baseValue,
            field_type: 'relation' as const,
            target_document_id: row.target_document_id,
            target_collection_id: row.target_collection_id,
            relationship_type: row.relationship_type,
            cascade_delete: row.cascade_delete,
          };

        default:
          throw new Error(`Unknown field type: ${row.field_type}`);
      }
    }) as FlattenedStore[];
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
