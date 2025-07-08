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

import { and, eq, isNotNull, like, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  collections,
  documents,
  documentVersions,
  fieldValuesBoolean,
  fieldValuesDatetime,
  fieldValuesFile,
  fieldValuesJson,
  fieldValuesNumeric,
  fieldValuesRelation,
  fieldValuesText
} from '../database/schema/index.js';
import type { SiteConfig } from "./@types.js";

type DatabaseConnection = NodePgDatabase<any>;

export class TypedFieldValuesQuery {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  // Route queries to appropriate table based on field type
  async getFieldValue(
    document_version_id: string,
    field_path: string,
    field_type: string,
    locale = 'default'
  ) {
    const baseWhere = and(
      eq(this.getTableForType(field_type).document_version_id, document_version_id),
      eq(this.getTableForType(field_type).field_path, field_path),
      eq(this.getTableForType(field_type).locale, locale)
    );

    switch (field_type) {
      case 'text':
        return await this.db.select().from(fieldValuesText).where(baseWhere);
      case 'number':
      case 'integer':
      case 'decimal':
        return await this.db.select().from(fieldValuesNumeric).where(baseWhere);
      case 'boolean':
        return await this.db.select().from(fieldValuesBoolean).where(baseWhere);
      case 'date':
      case 'time':
      case 'timestamp':
        return await this.db.select().from(fieldValuesDatetime).where(baseWhere);
      case 'relation':
        return await this.db.select().from(fieldValuesRelation).where(baseWhere);
      case 'file':
      case 'image':
        return await this.db.select().from(fieldValuesFile).where(baseWhere);
      case 'richText':
      case 'json':
      case 'object':
        return await this.db.select().from(fieldValuesJson).where(baseWhere);
      default:
        throw new Error(`Unknown field type: ${field_type}`);
    }
  }

  // Get all field values for a document (across all type tables)
  async getAllFieldValues(document_version_id: string, locale = 'default') {
    const queries = await Promise.all([
      this.db.select({
        id: fieldValuesText.id,
        document_version_id: fieldValuesText.document_version_id,
        collection_id: fieldValuesText.collection_id,
        field_path: fieldValuesText.field_path,
        field_name: fieldValuesText.field_name,
        locale: fieldValuesText.locale,
        array_index: fieldValuesText.array_index,
        parent_path: fieldValuesText.parent_path,
        value: fieldValuesText.value,
        field_type: sql<string>`'text'`.as('field_type'),
      }).from(fieldValuesText).where(
        and(
          eq(fieldValuesText.document_version_id, document_version_id),
          eq(fieldValuesText.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesNumeric.id,
        document_version_id: fieldValuesNumeric.document_version_id,
        collection_id: fieldValuesNumeric.collection_id,
        field_path: fieldValuesNumeric.field_path,
        field_name: fieldValuesNumeric.field_name,
        locale: fieldValuesNumeric.locale,
        array_index: fieldValuesNumeric.array_index,
        parent_path: fieldValuesNumeric.parent_path,
        value: fieldValuesNumeric.value_integer, // Simplified - would need type-specific handling
        field_type: sql<string>`'numeric'`.as('field_type'),
      }).from(fieldValuesNumeric).where(
        and(
          eq(fieldValuesNumeric.document_version_id, document_version_id),
          eq(fieldValuesNumeric.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesBoolean.id,
        document_version_id: fieldValuesBoolean.document_version_id,
        collection_id: fieldValuesBoolean.collection_id,
        field_path: fieldValuesBoolean.field_path,
        field_name: fieldValuesBoolean.field_name,
        locale: fieldValuesBoolean.locale,
        array_index: fieldValuesBoolean.array_index,
        parent_path: fieldValuesBoolean.parent_path,
        value: fieldValuesBoolean.value,
        field_type: sql<string>`'boolean'`.as('field_type'),
      }).from(fieldValuesBoolean).where(
        and(
          eq(fieldValuesBoolean.document_version_id, document_version_id),
          eq(fieldValuesBoolean.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesDatetime.id,
        document_version_id: fieldValuesDatetime.document_version_id,
        collection_id: fieldValuesDatetime.collection_id,
        field_path: fieldValuesDatetime.field_path,
        field_name: fieldValuesDatetime.field_name,
        locale: fieldValuesDatetime.locale,
        array_index: fieldValuesDatetime.array_index,
        parent_path: fieldValuesDatetime.parent_path,
        value: fieldValuesDatetime.value_timestamp,
        field_type: sql<string>`'datetime'`.as('field_type'),
      }).from(fieldValuesDatetime).where(
        and(
          eq(fieldValuesDatetime.document_version_id, document_version_id),
          eq(fieldValuesDatetime.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesRelation.id,
        document_version_id: fieldValuesRelation.document_version_id,
        collection_id: fieldValuesRelation.collection_id,
        field_path: fieldValuesRelation.field_path,
        field_name: fieldValuesRelation.field_name,
        locale: fieldValuesRelation.locale,
        array_index: fieldValuesRelation.array_index,
        parent_path: fieldValuesRelation.parent_path,
        value: fieldValuesRelation.target_document_id,
        field_type: sql<string>`'relation'`.as('field_type'),
      }).from(fieldValuesRelation).where(
        and(
          eq(fieldValuesRelation.document_version_id, document_version_id),
          eq(fieldValuesRelation.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesFile.id,
        document_version_id: fieldValuesFile.document_version_id,
        collection_id: fieldValuesFile.collection_id,
        field_path: fieldValuesFile.field_path,
        field_name: fieldValuesFile.field_name,
        locale: fieldValuesFile.locale,
        array_index: fieldValuesFile.array_index,
        parent_path: fieldValuesFile.parent_path,
        value: fieldValuesFile.file_id,
        field_type: sql<string>`'file'`.as('field_type'),
      }).from(fieldValuesFile).where(
        and(
          eq(fieldValuesFile.document_version_id, document_version_id),
          eq(fieldValuesFile.locale, locale)
        )
      ),

      this.db.select({
        id: fieldValuesJson.id,
        document_version_id: fieldValuesJson.document_version_id,
        collection_id: fieldValuesJson.collection_id,
        field_path: fieldValuesJson.field_path,
        field_name: fieldValuesJson.field_name,
        locale: fieldValuesJson.locale,
        array_index: fieldValuesJson.array_index,
        parent_path: fieldValuesJson.parent_path,
        value: fieldValuesJson.value,
        field_type: sql<string>`'json'`.as('field_type'),
      }).from(fieldValuesJson).where(
        and(
          eq(fieldValuesJson.document_version_id, document_version_id),
          eq(fieldValuesJson.locale, locale)
        )
      ),
    ]);

    return queries.flat().sort((a, b) => a.field_path.localeCompare(b.field_path));
  }

  private getTableForType(field_type: string) {
    switch (field_type) {
      case 'text':
      case 'richText':
        return fieldValuesText;
      case 'number':
      case 'integer':
      case 'decimal':
        return fieldValuesNumeric;
      case 'boolean':
        return fieldValuesBoolean;
      case 'date':
      case 'time':
      case 'timestamp':
        return fieldValuesDatetime;
      case 'relation':
        return fieldValuesRelation;
      case 'file':
      case 'image':
        return fieldValuesFile;
      case 'json':
      case 'object':
        return fieldValuesJson;
      default:
        throw new Error(`Unknown field type: ${field_type}`);
    }
  }
}

// TYPE-SPECIFIC QUERY BUILDERS
// ============================

// Text field queries
export class TextFieldQueries {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async fullTextSearch(searchTerm: string, collection_id?: string) {
    const conditions = [
      sql`to_tsvector('english', ${fieldValuesText.value}) @@ plainto_tsquery('english', ${searchTerm})`
    ];

    if (collection_id) {
      conditions.push(eq(fieldValuesText.collection_id, collection_id));
    }

    const query = this.db
      .select({
        document_version_id: fieldValuesText.document_version_id,
        field_path: fieldValuesText.field_path,
        value: fieldValuesText.value,
        rank: sql<number>`ts_rank(to_tsvector('english', ${fieldValuesText.value}), plainto_tsquery('english', ${searchTerm}))`.as('rank'),
      })
      .from(fieldValuesText)
      .where(and(...conditions));

    return await query.orderBy(sql`rank DESC`);
  }

  async findByTextValue(value: string, exactMatch = false) {
    const condition = exactMatch
      ? eq(fieldValuesText.value, value)
      : like(fieldValuesText.value, `%${value}%`);

    return await this.db
      .select()
      .from(fieldValuesText)
      .where(condition);
  }
}

// Numeric field queries
export class NumericFieldQueries {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async findInRange(field_path: string, min: number, max: number) {
    return await this.db
      .select()
      .from(fieldValuesNumeric)
      .where(
        and(
          eq(fieldValuesNumeric.field_path, field_path),
          sql`COALESCE(${fieldValuesNumeric.value_integer}, ${fieldValuesNumeric.value_decimal}, ${fieldValuesNumeric.value_float}) BETWEEN ${min} AND ${max}`
        )
      );
  }

  async getStatistics(field_path: string) {
    return await this.db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
        avg: sql<number>`AVG(COALESCE(${fieldValuesNumeric.value_integer}, ${fieldValuesNumeric.value_decimal}, ${fieldValuesNumeric.value_float}))`.as('avg'),
        min: sql<number>`MIN(COALESCE(${fieldValuesNumeric.value_integer}, ${fieldValuesNumeric.value_decimal}, ${fieldValuesNumeric.value_float}))`.as('min'),
        max: sql<number>`MAX(COALESCE(${fieldValuesNumeric.value_integer}, ${fieldValuesNumeric.value_decimal}, ${fieldValuesNumeric.value_float}))`.as('max'),
      })
      .from(fieldValuesNumeric)
      .where(eq(fieldValuesNumeric.field_path, field_path));
  }
}

// File field queries
export class FileFieldQueries {
  constructor(siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async findByMimeType(mime_type: string) {
    return await this.db
      .select()
      .from(fieldValuesFile)
      .where(eq(fieldValuesFile.mime_type, mime_type));
  }

  async findLargeFiles(sizeThresholdMB: number) {
    const sizeThresholdBytes = sizeThresholdMB * 1024 * 1024;
    return await this.db
      .select()
      .from(fieldValuesFile)
      .where(sql`${fieldValuesFile.file_size} > ${sizeThresholdBytes}`);
  }

  async findDuplicateFiles() {
    return await this.db
      .select({
        file_hash: fieldValuesFile.file_hash,
        count: sql<number>`COUNT(*)`.as('count'),
        fileIds: sql<string[]>`array_agg(${fieldValuesFile.file_id})`.as('fileIds'),
      })
      .from(fieldValuesFile)
      .where(isNotNull(fieldValuesFile.file_hash))
      .groupBy(fieldValuesFile.file_hash)
      .having(sql`COUNT(*) > 1`);
  }
}

// COLLECTION, DOCUMENT AND DOCUMENT VERSION QUERY HELPERS
// ========================================================

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

  async findByCollection(collection_id: string) {
    return await this.db.select().from(documents).where(eq(documents.collection_id, collection_id));
  }

  async findById(id: string) {
    return await this.db.select().from(documents).where(eq(documents.id, id)).limit(1);
  }

  async findByPath(collection_id: string, path: string) {
    return await this.db.select().from(documents).where(
      and(
        eq(documents.collection_id, collection_id),
        eq(documents.path, path)
      )
    ).limit(1);
  }
}

export class DocumentVersionQueries {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async findByDocument(document_id: string) {
    return await this.db.select().from(documentVersions).where(eq(documentVersions.document_id, document_id));
  }

  async findCurrentVersion(document_id: string) {
    return await this.db.select().from(documentVersions).where(
      and(
        eq(documentVersions.document_id, document_id),
        eq(documentVersions.is_current, true)
      )
    ).limit(1);
  }

  async findByVersion(document_id: string, version_number: number) {
    return await this.db.select().from(documentVersions).where(
      and(
        eq(documentVersions.document_id, document_id),
        eq(documentVersions.version_number, version_number)
      )
    ).limit(1);
  }
}



// FACTORY FUNCTION FOR CONVENIENCE
// ================================

export function createQueryBuilders(siteConfig: SiteConfig, db: DatabaseConnection) {
  return {
    typedFieldValues: new TypedFieldValuesQuery(siteConfig, db),
    textFields: new TextFieldQueries(siteConfig, db),
    numericFields: new NumericFieldQueries(siteConfig, db),
    fileFields: new FileFieldQueries(siteConfig, db),
    collections: new CollectionQueries(siteConfig, db),
    documents: new DocumentQueries(siteConfig, db),
    documentVersions: new DocumentVersionQueries(siteConfig, db),
  };
}

// USAGE EXAMPLE:
// const queryBuilders = createQueryBuilders(db);
// const results = await queryBuilders.textFields.fullTextSearch('example');