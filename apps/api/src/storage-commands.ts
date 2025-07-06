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

import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { v7 as uuidv7 } from 'uuid'
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

import type { SiteConfig } from './@types.js';

type DatabaseConnection = NodePgDatabase<any>;


// COLLECTION, DOCUMENT AND DOCUMENT VERSION COMMAND HELPERS
// ========================================================

export class CollectionCommands {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async create(path: string, config: any) {
    return await this.db.insert(collections).values({
      id: uuidv7(),
      path,
      config,
    }).returning();
  }

  async delete(id: string) {
    return await this.db.delete(collections).where(eq(collections.id, id));
  }
}

export class DocumentCommands {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async create(collectionId: string, path?: string, status = 'draft') {
    return await this.db.insert(documents).values({
      id: uuidv7(),
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

export class DocumentVersionCommands {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async create(documentId: string, versionNumber: number, isCurrent = true, createdBy?: string) {
    // If this is the current version, mark all others as not current
    if (isCurrent) {
      await this.db.update(documentVersions).set({
        isCurrent: false,
      }).where(eq(documentVersions.documentId, documentId));
    }

    return await this.db.insert(documentVersions).values({
      id: uuidv7(),
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
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

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
      id: uuidv7(),
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

      case 'relation':
        return await this.db.insert(fieldValuesRelation).values({
          ...baseData,
          targetDocumentId: value.targetDocumentId,
          targetCollectionId: value.targetCollectionId,
          relationshipType: value.relationshipType || 'reference',
          cascadeDelete: value.cascadeDelete || false,
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

export function createCommandBuilders(siteConfig: SiteConfig, db: DatabaseConnection) {
  return {
    collections: new CollectionCommands(siteConfig, db),
    documents: new DocumentCommands(siteConfig, db),
    documentVersions: new DocumentVersionCommands(siteConfig, db),
    fieldValues: new FieldValueCRUD(siteConfig, db),
  };
}

// USAGE EXAMPLE:
// const queryBuilders = createQueryBuilders(db);
// const results = await queryBuilders.textFields.fullTextSearch('example');