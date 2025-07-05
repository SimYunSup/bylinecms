// UNIVERSAL QUERY INTERFACE
// =========================

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
        ...this.getBaseSelectFields(),
        value: fieldValuesText.value,
        fieldType: sql<string>`'text'`.as('fieldType'),
      }).from(fieldValuesText).where(
        and(
          eq(fieldValuesText.documentVersionId, documentVersionId),
          eq(fieldValuesText.locale, locale)
        )
      ),

      this.db.select({
        ...this.getBaseSelectFields(),
        value: fieldValuesNumeric.valueInteger, // Simplified - would need type-specific handling
        fieldType: sql<string>`'numeric'`.as('fieldType'),
      }).from(fieldValuesNumeric).where(
        and(
          eq(fieldValuesNumeric.documentVersionId, documentVersionId),
          eq(fieldValuesNumeric.locale, locale)
        )
      ),

      this.db.select({
        ...this.getBaseSelectFields(),
        value: fieldValuesBoolean.value,
        fieldType: sql<string>`'boolean'`.as('fieldType'),
      }).from(fieldValuesBoolean).where(
        and(
          eq(fieldValuesBoolean.documentVersionId, documentVersionId),
          eq(fieldValuesBoolean.locale, locale)
        )
      ),

      this.db.select({
        ...this.getBaseSelectFields(),
        value: fieldValuesDateTime.valueTimestamp,
        fieldType: sql<string>`'datetime'`.as('fieldType'),
      }).from(fieldValuesDateTime).where(
        and(
          eq(fieldValuesDateTime.documentVersionId, documentVersionId),
          eq(fieldValuesDateTime.locale, locale)
        )
      ),

      this.db.select({
        ...this.getBaseSelectFields(),
        value: fieldValuesRelation.targetDocumentId,
        fieldType: sql<string>`'relation'`.as('fieldType'),
      }).from(fieldValuesRelation).where(
        and(
          eq(fieldValuesRelation.documentVersionId, documentVersionId),
          eq(fieldValuesRelation.locale, locale)
        )
      ),

      this.db.select({
        ...this.getBaseSelectFields(),
        value: fieldValuesFile.fileId,
        fieldType: sql<string>`'file'`.as('fieldType'),
      }).from(fieldValuesFile).where(
        and(
          eq(fieldValuesFile.documentVersionId, documentVersionId),
          eq(fieldValuesFile.locale, locale)
        )
      ),

      this.db.select({
        ...this.getBaseSelectFields(),
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

  private getBaseSelectFields() {
    return {
      id: fieldValuesText.id, // Any table works for base fields
      documentVersionId: fieldValuesText.documentVersionId,
      collectionId: fieldValuesText.collectionId,
      fieldPath: fieldValuesText.fieldPath,
      fieldName: fieldValuesText.fieldName,
      locale: fieldValuesText.locale,
      arrayIndex: fieldValuesText.arrayIndex,
      parentPath: fieldValuesText.parentPath,
    };
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

  async findByName(name: string) {
    return await this.db.select().from(collections).where(eq(collections.name, name)).limit(1);
  }

  async findByPath(path: string) {
    return await this.db.select().from(collections).where(eq(collections.name, path)).limit(1);
  }

  async getAll() {
    return await this.db.select().from(collections);
  }

  async create(name: string, config: any) {
    return await this.db.insert(collections).values({
      name,
      config,
    }).returning();
  }

  async delete(id: string) {
    return await this.db.delete(collections).where(eq(collections.id, id));
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

  async create(collectionId: string, path?: string, status = 'draft') {
    return await this.db.insert(documents).values({
      collectionId,
      path,
      status,
    }).returning();
  }

  async updateStatus(id: string, status: string) {
    return await this.db.update(documents).set({
      status,
      updatedAt: new Date(),
    }).where(eq(documents.id, id)).returning();
  }

  async delete(id: string) {
    return await this.db.delete(documents).where(eq(documents.id, id));
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

  async create(documentId: string, versionNumber: number, isCurrent = true, createdBy?: string) {
    // If this is the current version, mark all others as not current
    if (isCurrent) {
      await this.db.update(documentVersions).set({
        isCurrent: false,
      }).where(eq(documentVersions.documentId, documentId));
    }

    return await this.db.insert(documentVersions).values({
      documentId,
      versionNumber,
      isCurrent,
      createdBy,
    }).returning();
  }

  async markAsCurrent(documentId: string, versionNumber: number) {
    // Mark all versions as not current
    await this.db.update(documentVersions).set({
      isCurrent: false,
    }).where(eq(documentVersions.documentId, documentId));

    // Mark the specified version as current
    return await this.db.update(documentVersions).set({
      isCurrent: true,
    }).where(
      and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.versionNumber, versionNumber)
      )
    ).returning();
  }
}

// FIELD VALUE CRUD OPERATIONS
// ============================

export class FieldValueCRUD {
  constructor(private db: DatabaseConnection) { }

  async insertFieldValue(
    documentVersionId: string,
    collectionId: string,
    fieldPath: string,
    fieldName: string,
    fieldType: string,
    value: any,
    locale = 'default',
    arrayIndex?: number,
    parentPath?: string
  ) {
    const baseData = {
      documentVersionId,
      collectionId,
      fieldPath,
      fieldName,
      locale,
      arrayIndex,
      parentPath,
    };

    switch (fieldType) {
      case 'text':
        return await this.db.insert(fieldValuesText).values({
          ...baseData,
          value: value,
          isRichText: false,
        }).returning();

      case 'richText':
        return await this.db.insert(fieldValuesJson).values({
          ...baseData,
          value: value,
        }).returning();

      case 'number':
      case 'integer':
        return await this.db.insert(fieldValuesNumeric).values({
          ...baseData,
          valueInteger: value,
          numberType: 'integer',
        }).returning();

      case 'decimal':
        return await this.db.insert(fieldValuesNumeric).values({
          ...baseData,
          valueDecimal: value,
          numberType: 'decimal',
        }).returning();

      case 'boolean':
        return await this.db.insert(fieldValuesBoolean).values({
          ...baseData,
          value: value,
        }).returning();

      case 'datetime':
        return await this.db.insert(fieldValuesDateTime).values({
          ...baseData,
          valueTimestamp: value,
          dateType: 'timestamp',
        }).returning();

      case 'file':
      case 'image':
        return await this.db.insert(fieldValuesFile).values({
          ...baseData,
          fileId: value.fileId,
          filename: value.filename,
          originalFilename: value.originalFilename,
          mimeType: value.mimeType,
          fileSize: value.fileSize,
          storageProvider: value.storageProvider,
          storagePath: value.storagePath,
        }).returning();

      case 'json':
      case 'object':
        return await this.db.insert(fieldValuesJson).values({
          ...baseData,
          value: value,
        }).returning();

      default:
        throw new Error(`Unsupported field type: ${fieldType}`);
    }
  }

  async updateFieldValue(
    documentVersionId: string,
    fieldPath: string,
    fieldType: string,
    value: any,
    locale = 'default',
    arrayIndex?: number
  ) {
    const conditions = [
      eq(this.getTableForType(fieldType).documentVersionId, documentVersionId),
      eq(this.getTableForType(fieldType).fieldPath, fieldPath),
      eq(this.getTableForType(fieldType).locale, locale)
    ];

    if (arrayIndex !== undefined) {
      conditions.push(eq(this.getTableForType(fieldType).arrayIndex, arrayIndex));
    }

    const baseWhere = and(...conditions);

    const updateData = { updatedAt: new Date() };

    switch (fieldType) {
      case 'text':
        return await this.db.update(fieldValuesText).set({
          ...updateData,
          value: value,
        }).where(baseWhere).returning();

      case 'richText':
        return await this.db.update(fieldValuesJson).set({
          ...updateData,
          value: value,
        }).where(baseWhere).returning();

      case 'number':
      case 'integer':
        return await this.db.update(fieldValuesNumeric).set({
          ...updateData,
          valueInteger: value,
        }).where(baseWhere).returning();

      case 'decimal':
        return await this.db.update(fieldValuesNumeric).set({
          ...updateData,
          valueDecimal: value,
        }).where(baseWhere).returning();

      case 'boolean':
        return await this.db.update(fieldValuesBoolean).set({
          ...updateData,
          value: value,
        }).where(baseWhere).returning();

      case 'datetime':
        return await this.db.update(fieldValuesDateTime).set({
          ...updateData,
          valueTimestamp: value,
        }).where(baseWhere).returning();

      case 'json':
      case 'object':
        return await this.db.update(fieldValuesJson).set({
          ...updateData,
          value: value,
        }).where(baseWhere).returning();

      default:
        throw new Error(`Unsupported field type: ${fieldType}`);
    }
  }

  async deleteFieldValues(documentVersionId: string, fieldPath?: string) {
    const tables = [
      fieldValuesText,
      fieldValuesNumeric,
      fieldValuesBoolean,
      fieldValuesDateTime,
      fieldValuesRelation,
      fieldValuesFile,
      fieldValuesJson,
    ];

    const results = await Promise.all(
      tables.map(table => {
        const whereCondition = fieldPath
          ? and(
            eq(table.documentVersionId, documentVersionId),
            eq(table.fieldPath, fieldPath)
          )
          : eq(table.documentVersionId, documentVersionId);

        return this.db.delete(table).where(whereCondition);
      })
    );

    return results;
  }

  private getTableForType(fieldType: string) {
    switch (fieldType) {
      case 'text':
        return fieldValuesText;
      case 'richText':
      case 'json':
      case 'object':
        return fieldValuesJson;
      case 'number':
      case 'integer':
      case 'decimal':
        return fieldValuesNumeric;
      case 'boolean':
        return fieldValuesBoolean;
      case 'datetime':
        return fieldValuesDateTime;
      case 'relation':
        return fieldValuesRelation;
      case 'file':
      case 'image':
        return fieldValuesFile;
      default:
        throw new Error(`Unknown field type: ${fieldType}`);
    }
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
    fieldValues: new FieldValueCRUD(db),
  };
}

// USAGE EXAMPLE:
// const queryBuilders = createQueryBuilders(db);
// const results = await queryBuilders.textFields.fullTextSearch('example');