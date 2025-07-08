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
  fieldValuesDatetime,
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

  async create(collection_id: string, path?: string, status = 'draft') {
    return await this.db.insert(documents).values({
      id: uuidv7(),
      collection_id,
      path,
      status,
    }).returning();
  }

  async updateStatus(id: string, status: string) {
    return await this.db.update(documents).set({
      status,
      updated_at: new Date(),
    }).where(eq(documents.id, id)).returning();
  }

  async delete(id: string) {
    return await this.db.delete(documents).where(eq(documents.id, id));
  }
}

export class DocumentVersionCommands {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async create(document_id: string, version_number: number, is_current = true, created_by?: string) {
    // If this is the current version, mark all others as not current
    if (is_current) {
      await this.db.update(documentVersions).set({
        is_current: false,
      }).where(eq(documentVersions.document_id, document_id));
    }

    return await this.db.insert(documentVersions).values({
      id: uuidv7(),
      document_id,
      version_number,
      is_current,
      created_by,
    }).returning();
  }

  async markAsCurrent(document_id: string, version_number: number) {
    // Mark all versions as not current
    await this.db.update(documentVersions).set({
      is_current: false,
    }).where(eq(documentVersions.document_id, document_id));

    // Mark the specified version as current
    return await this.db.update(documentVersions).set({
      is_current: true,
    }).where(
      and(
        eq(documentVersions.document_id, document_id),
        eq(documentVersions.version_number, version_number)
      )
    ).returning();
  }
}

// FIELD VALUE CRUD OPERATIONS
// ============================

export class FieldValueCRUD {
  constructor(private siteConfig: SiteConfig, private db: DatabaseConnection) { }

  async insertFieldValue(
    document_version_id: string,
    collection_id: string,
    field_path: string,
    field_name: string,
    field_type: string,
    value: any,
    locale = 'default',
    array_index?: number,
    parent_path?: string
  ) {
    const baseData = {
      id: uuidv7(),
      document_version_id,
      collection_id,
      field_path,
      field_name,
      locale,
      array_index,
      parent_path,
    };

    switch (field_type) {
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
          value_integer: value,
          number_type: 'integer',
        }).returning();

      case 'decimal':
        return await this.db.insert(fieldValuesNumeric).values({
          ...baseData,
          value_decimal: value,
          number_type: 'decimal',
        }).returning();

      case 'boolean':
        return await this.db.insert(fieldValuesBoolean).values({
          ...baseData,
          value: value,
        }).returning();

      case 'datetime':
        return await this.db.insert(fieldValuesDatetime).values({
          ...baseData,
          value_timestamp: value,
          date_type: 'timestamp',
        }).returning();

      case 'relation':
        return await this.db.insert(fieldValuesRelation).values({
          ...baseData,
          target_document_id: value.target_document_id,
          target_collection_id: value.target_collection_id,
          relationship_type: value.relationship_type || 'reference',
          cascade_delete: value.cascade_delete || false,
        }).returning();

      case 'file':
      case 'image':
        return await this.db.insert(fieldValuesFile).values({
          ...baseData,
          file_id: value.file_id,
          filename: value.filename,
          original_filename: value.original_filename,
          mime_type: value.mime_type,
          file_size: value.file_size,
          storage_provider: value.storage_provider,
          storage_path: value.storage_path,
        }).returning();

      case 'json':
      case 'object':
        return await this.db.insert(fieldValuesJson).values({
          ...baseData,
          value: value,
        }).returning();

      default:
        throw new Error(`Unsupported field type: ${field_type}`);
    }
  }

  async updateFieldValue(
    document_version_id: string,
    field_path: string,
    field_type: string,
    value: any,
    locale = 'default',
    array_index?: number
  ) {
    const conditions = [
      eq(this.getTableForType(field_type).document_version_id, document_version_id),
      eq(this.getTableForType(field_type).field_path, field_path),
      eq(this.getTableForType(field_type).locale, locale)
    ];

    if (array_index !== undefined) {
      conditions.push(eq(this.getTableForType(field_type).array_index, array_index));
    }

    const baseWhere = and(...conditions);

    const updateData = { updated_at: new Date() };

    switch (field_type) {
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
          value_integer: value,
        }).where(baseWhere).returning();

      case 'decimal':
        return await this.db.update(fieldValuesNumeric).set({
          ...updateData,
          value_decimal: value,
        }).where(baseWhere).returning();

      case 'boolean':
        return await this.db.update(fieldValuesBoolean).set({
          ...updateData,
          value: value,
        }).where(baseWhere).returning();

      case 'datetime':
        return await this.db.update(fieldValuesDatetime).set({
          ...updateData,
          value_timestamp: value,
        }).where(baseWhere).returning();

      case 'json':
      case 'object':
        return await this.db.update(fieldValuesJson).set({
          ...updateData,
          value: value,
        }).where(baseWhere).returning();

      default:
        throw new Error(`Unsupported field type: ${field_type}`);
    }
  }

  async deleteFieldValues(document_version_id: string, field_path?: string) {
    const tables = [
      fieldValuesText,
      fieldValuesNumeric,
      fieldValuesBoolean,
      fieldValuesDatetime,
      fieldValuesRelation,
      fieldValuesFile,
      fieldValuesJson,
    ];

    const results = await Promise.all(
      tables.map(table => {
        const whereCondition = field_path
          ? and(
            eq(table.document_version_id, document_version_id),
            eq(table.field_path, field_path)
          )
          : eq(table.document_version_id, document_version_id);

        return this.db.delete(table).where(whereCondition);
      })
    );

    return results;
  }

  private getTableForType(field_type: string) {
    switch (field_type) {
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
        return fieldValuesDatetime;
      case 'relation':
        return fieldValuesRelation;
      case 'file':
      case 'image':
        return fieldValuesFile;
      default:
        throw new Error(`Unknown field type: ${field_type}`);
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