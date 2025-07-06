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
  fieldValuesDateTime,
  fieldValuesFile,
  fieldValuesJson,
  fieldValuesNumeric,
  fieldValuesRelation,
  fieldValuesText
} from '../database/schema/index.js';

type DatabaseConnection = NodePgDatabase<any>;

export class TypedFieldValuesQuery {
  constructor(private db: DatabaseConnection) { }

  // Route queries to appropriate table based on field type
  async getFieldValue(
    documentVersionId: string,
    fieldPath: string,
    fieldType: string,
    locale = 'default'
  ) {
    const baseWhere = and(
      eq(this.getTableForType(fieldType).documentVersionId, documentVersionId),
      eq(this.getTableForType(fieldType).fieldPath, fieldPath),
      eq(this.getTableForType(fieldType).locale, locale)
    );

    switch (fieldType) {
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
        return await this.db.select().from(fieldValuesDateTime).where(baseWhere);
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
        throw new Error(`Unknown field type: ${fieldType}`);
    }
  }

  // Get all field values for a document (across all type tables)
  async getAllFieldValues(documentVersionId: string, locale = 'default') {
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
          eq(fieldValuesText.documentVersionId, documentVersionId),
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
          eq(fieldValuesNumeric.documentVersionId, documentVersionId),
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
          eq(fieldValuesBoolean.documentVersionId, documentVersionId),
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
          eq(fieldValuesDateTime.documentVersionId, documentVersionId),
          eq(fieldValuesDateTime.locale, locale)
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
          eq(fieldValuesRelation.documentVersionId, documentVersionId),
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
          eq(fieldValuesFile.documentVersionId, documentVersionId),
          eq(fieldValuesFile.locale, locale)
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
        fieldType: sql<string>`'json'`.as('fieldType'),
      }).from(fieldValuesJson).where(
        and(
          eq(fieldValuesJson.documentVersionId, documentVersionId),
          eq(fieldValuesJson.locale, locale)
        )
      ),
    ]);

    return queries.flat().sort((a, b) => a.fieldPath.localeCompare(b.fieldPath));
  }

  private getTableForType(fieldType: string) {
    switch (fieldType) {
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
        return fieldValuesDateTime;
      case 'relation':
        return fieldValuesRelation;
      case 'file':
      case 'image':
        return fieldValuesFile;
      case 'json':
      case 'object':
        return fieldValuesJson;
      default:
        throw new Error(`Unknown field type: ${fieldType}`);
    }
  }
}

// TYPE-SPECIFIC QUERY BUILDERS
// ============================

// Text field queries
export class TextFieldQueries {
  constructor(private db: DatabaseConnection) { }

  async fullTextSearch(searchTerm: string, collectionId?: string) {
    const conditions = [
      sql`to_tsvector('english', ${fieldValuesText.value}) @@ plainto_tsquery('english', ${searchTerm})`
    ];

    if (collectionId) {
      conditions.push(eq(fieldValuesText.collectionId, collectionId));
    }

    const query = this.db
      .select({
        documentVersionId: fieldValuesText.documentVersionId,
        fieldPath: fieldValuesText.fieldPath,
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
  constructor(private db: DatabaseConnection) { }

  async findInRange(fieldPath: string, min: number, max: number) {
    return await this.db
      .select()
      .from(fieldValuesNumeric)
      .where(
        and(
          eq(fieldValuesNumeric.fieldPath, fieldPath),
          sql`COALESCE(${fieldValuesNumeric.valueInteger}, ${fieldValuesNumeric.valueDecimal}, ${fieldValuesNumeric.valueFloat}) BETWEEN ${min} AND ${max}`
        )
      );
  }

  async getStatistics(fieldPath: string) {
    return await this.db
      .select({
        count: sql<number>`COUNT(*)`.as('count'),
        avg: sql<number>`AVG(COALESCE(${fieldValuesNumeric.valueInteger}, ${fieldValuesNumeric.valueDecimal}, ${fieldValuesNumeric.valueFloat}))`.as('avg'),
        min: sql<number>`MIN(COALESCE(${fieldValuesNumeric.valueInteger}, ${fieldValuesNumeric.valueDecimal}, ${fieldValuesNumeric.valueFloat}))`.as('min'),
        max: sql<number>`MAX(COALESCE(${fieldValuesNumeric.valueInteger}, ${fieldValuesNumeric.valueDecimal}, ${fieldValuesNumeric.valueFloat}))`.as('max'),
      })
      .from(fieldValuesNumeric)
      .where(eq(fieldValuesNumeric.fieldPath, fieldPath));
  }
}

// File field queries
export class FileFieldQueries {
  constructor(private db: DatabaseConnection) { }

  async findByMimeType(mimeType: string) {
    return await this.db
      .select()
      .from(fieldValuesFile)
      .where(eq(fieldValuesFile.mimeType, mimeType));
  }

  async findLargeFiles(sizeThresholdMB: number) {
    const sizeThresholdBytes = sizeThresholdMB * 1024 * 1024;
    return await this.db
      .select()
      .from(fieldValuesFile)
      .where(sql`${fieldValuesFile.fileSize} > ${sizeThresholdBytes}`);
  }

  async findDuplicateFiles() {
    return await this.db
      .select({
        fileHash: fieldValuesFile.fileHash,
        count: sql<number>`COUNT(*)`.as('count'),
        fileIds: sql<string[]>`array_agg(${fieldValuesFile.fileId})`.as('fileIds'),
      })
      .from(fieldValuesFile)
      .where(isNotNull(fieldValuesFile.fileHash))
      .groupBy(fieldValuesFile.fileHash)
      .having(sql`COUNT(*) > 1`);
  }
}

// COLLECTION, DOCUMENT AND DOCUMENT VERSION QUERY HELPERS
// ========================================================

export class CollectionQueries {
  constructor(private db: DatabaseConnection) { }

  async findByPath(path: string) {
    return await this.db.select().from(collections).where(eq(collections.path, path)).limit(1);
  }

  async getAll() {
    return await this.db.select().from(collections);
  }
}

export class DocumentQueries {
  constructor(private db: DatabaseConnection) { }

  async findByCollection(collectionId: string) {
    return await this.db.select().from(documents).where(eq(documents.collectionId, collectionId));
  }

  async findById(id: string) {
    return await this.db.select().from(documents).where(eq(documents.id, id)).limit(1);
  }

  async findByPath(collectionId: string, path: string) {
    return await this.db.select().from(documents).where(
      and(
        eq(documents.collectionId, collectionId),
        eq(documents.path, path)
      )
    ).limit(1);
  }
}

export class DocumentVersionQueries {
  constructor(private db: DatabaseConnection) { }

  async findByDocument(documentId: string) {
    return await this.db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId));
  }

  async findCurrentVersion(documentId: string) {
    return await this.db.select().from(documentVersions).where(
      and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.isCurrent, true)
      )
    ).limit(1);
  }

  async findByVersion(documentId: string, versionNumber: number) {
    return await this.db.select().from(documentVersions).where(
      and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.versionNumber, versionNumber)
      )
    ).limit(1);
  }
}



// FACTORY FUNCTION FOR CONVENIENCE
// ================================

export function createQueryBuilders(db: DatabaseConnection) {
  return {
    typedFieldValues: new TypedFieldValuesQuery(db),
    textFields: new TextFieldQueries(db),
    numericFields: new NumericFieldQueries(db),
    fileFields: new FileFieldQueries(db),
    collections: new CollectionQueries(db),
    documents: new DocumentQueries(db),
    documentVersions: new DocumentVersionQueries(db),
  };
}

// USAGE EXAMPLE:
// const queryBuilders = createQueryBuilders(db);
// const results = await queryBuilders.textFields.fullTextSearch('example');