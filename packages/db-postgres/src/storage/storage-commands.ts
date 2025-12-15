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

import type {
  BlockField,
  CollectionDefinition,
  Field,
  ICollectionCommands,
  IDocumentCommands,
} from '@byline/core'
import { isFileStore, isJsonStore, isNumericStore, isRelationStore } from '@byline/core'
import { and, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { v7 as uuidv7 } from 'uuid'

import {
  booleanStore,
  collections,
  datetimeStore,
  documents,
  documentVersions,
  fileStore,
  jsonStore,
  metaStore,
  numericStore,
  relationStore,
  textStore,
} from '../database/schema/index.js'
import { flattenFields, getFirstOrThrow } from './storage-utils.js'
import type * as schema from '../database/schema/index.js'

type DatabaseConnection = NodePgDatabase<typeof schema>

interface WriteMetaForBlocksParams {
  tx: DatabaseConnection
  documentVersionId: string
  collectionId: string
  collectionConfig: CollectionDefinition
  documentData: any
}

async function writeMetaForBlocks({
  tx,
  documentVersionId,
  collectionId,
  collectionConfig,
  documentData,
}: WriteMetaForBlocksParams) {
  const existingMeta = await tx
    .select({ path: metaStore.path, item_id: metaStore.item_id })
    .from(metaStore)
    .where(and(eq(metaStore.document_version_id, documentVersionId), eq(metaStore.type, 'block')))

  const existingByPath = new Map<string, string>()
  for (const row of existingMeta) {
    existingByPath.set(row.path, row.item_id)
  }

  const metaInserts: {
    id: string
    document_version_id: string
    collection_id: string
    type: string
    path: string
    item_id: string
    meta: unknown
  }[] = []

  function isBlockField(field: Field): field is BlockField {
    return field.type === 'block'
  }

  function traverse(fields: Field[], data: any, basePath = '') {
    for (const fieldConfig of fields) {
      const currentPath = basePath ? `${basePath}.${fieldConfig.name}` : fieldConfig.name
      const value = data?.[fieldConfig.name]

      if (value == null) continue

      if (fieldConfig.type === 'block' && Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          if (item && typeof item === 'object') {
            let blockName: string | undefined
            let blockFieldsData: any

            // Handle new block shape: { type: 'block', name: '...', fields: [...] }
            if (item.type === 'block' && typeof item.name === 'string') {
              blockName = item.name
              blockFieldsData = item.fields
            } else {
              // Legacy shape: { richTextBlock: [...] }
              blockName = Object.keys(item)[0]
              if (blockName) {
                blockFieldsData = item[blockName]
              }
            }

            if (!blockName) return

            const blockPath = `${currentPath}.${index}.${blockName}`
            let itemId = existingByPath.get(blockPath)

            if (item.id) {
              itemId = item.id
            }

            if (!itemId) {
              // Check if we already assigned one in this transaction (unlikely for flat list)
              itemId = existingByPath.get(blockPath)
            }

            if (!itemId) {
              itemId = uuidv7()
            }

            // Always write to metaStore for the new version
            metaInserts.push({
              id: uuidv7(),
              document_version_id: documentVersionId,
              collection_id: collectionId,
              type: 'block',
              path: blockPath,
              item_id: itemId,
              meta: item.meta ?? null, // Preserve other meta if present
            })

            const subFieldConfig = fieldConfig.fields?.find(
              (f): f is BlockField => f.name === blockName && isBlockField(f as Field)
            )

            // Recursion logic (best effort fix for now, focusing on top-level blocks)
            if (subFieldConfig && Array.isArray(blockFieldsData)) {
              const syntheticData: any = {}
              blockFieldsData.forEach((f: any) => {
                if (f && typeof f === 'object') {
                  Object.assign(syntheticData, f)
                }
              })

              traverse(subFieldConfig.fields, syntheticData, `${currentPath}.${index}`)
            }
          }
        })
      } else if (fieldConfig.type === 'array' && Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          const arrayElementPath = `${currentPath}.${index}`

          // Handle new block shape inside array
          if (
            item &&
            typeof item === 'object' &&
            item.type === 'block' &&
            typeof item.name === 'string'
          ) {
            const blockName = item.name
            const blockPath = `${arrayElementPath}.${blockName}`

            // Generate/Retrieve ID
            let itemId = item.id
            if (!itemId) itemId = existingByPath.get(blockPath)
            if (!itemId) itemId = uuidv7()

            metaInserts.push({
              id: uuidv7(),
              document_version_id: documentVersionId,
              collection_id: collectionId,
              type: 'block',
              path: blockPath,
              item_id: itemId,
              meta: item.meta ?? null,
            })

            // Recurse for fields inside the block
            const subField = fieldConfig.fields?.find((f) => f.name === blockName)
            if (subField && subField.type === 'block' && Array.isArray(item.fields)) {
              const syntheticData: any = {}
              item.fields.forEach((f: any) => {
                if (f && typeof f === 'object') {
                  Object.assign(syntheticData, f)
                }
              })
              // subField is the block definition (e.g. richTextBlock).
              // Its fields are e.g. richText.
              // traverse expects data to contain richText.
              traverse(subField.fields as Field[], syntheticData, blockPath)
            }
          } else if (typeof item === 'object' && item !== null && fieldConfig.fields) {
            const fieldName = Object.keys(item)[0]
            if (fieldName != null) {
              const fieldValue = item[fieldName]
              const subField = fieldConfig.fields.find((f) => f.name === fieldName)
              if (subField) {
                traverse([subField], { [fieldName]: fieldValue }, arrayElementPath)
              }
            }
          }
        })
      }
    }
  }

  traverse(collectionConfig.fields as Field[], documentData)

  if (metaInserts.length > 0) {
    await tx.insert(metaStore).values(metaInserts)
  }
}

/**
 * CollectionCommands
 */
export class CollectionCommands implements ICollectionCommands {
  constructor(private db: DatabaseConnection) {}

  async create(path: string, config: CollectionDefinition) {
    return await this.db
      .insert(collections)
      .values({
        id: uuidv7(),
        path,
        singular: config.labels.singular || path, // Default to path if singular not provided
        plural: config.labels.plural || `${path}s`, // Default to pluralized path if not
        config,
      })
      .returning()
  }

  async delete(id: string) {
    return await this.db.delete(collections).where(eq(collections.id, id))
  }
}

/**
 * DocumentCommands
 */
export class DocumentCommands implements IDocumentCommands {
  constructor(private db: DatabaseConnection) {}

  /**
   * createDocumentVersion
   *
   * Creates a new document or a new version of an existing document.
   *
   * @param params - Options for creating the document
   * @returns The created document and the number of field values inserted
   */
  async createDocumentVersion(params: {
    documentId?: string // Optional logical document ID when creating a new version for the same logical document
    collectionId: string
    collectionConfig: CollectionDefinition
    action: string
    documentData: any
    path: string
    locale?: string
    status?: 'draft' | 'published' | 'archived'
    createdBy?: string
  }) {
    return await this.db.transaction(async (tx) => {
      let documentId = params.documentId

      // 1. Create the main document if needed
      if (documentId == null) {
        documentId = uuidv7()
        const _document = await tx
          .insert(documents)
          .values({
            id: documentId,
            collection_id: params.collectionId,
          })
          .returning()
          .then(getFirstOrThrow('Failed to create document'))
      }

      // 2. Create the document version
      const documentVersion = await tx
        .insert(documentVersions)
        .values({
          id: uuidv7(), // Document version id
          document_id: documentId,
          collection_id: params.collectionId,
          path: params.path,
          event_type: params.action ?? 'create',
          status: params.status ?? 'draft',
        })
        .returning()
        .then(getFirstOrThrow('Failed to create document version'))

      // 2. Flatten the document data to field values
      const flattenedFields = flattenFields(
        params.documentData,
        params.collectionConfig,
        params.locale ?? 'all'
      )

      // 3. Insert all field values
      for (const fieldValue of flattenedFields) {
        await this.insertFieldValueByType(
          tx,
          documentVersion.id, // Use the document version ID
          params.collectionId,
          fieldValue
        )
      }

      // 4. Write meta data for blocks (e.g. durable block IDs)
      await writeMetaForBlocks({
        tx,
        documentVersionId: documentVersion.id,
        collectionId: params.collectionId,
        collectionConfig: params.collectionConfig,
        documentData: params.documentData,
      })

      return {
        document: documentVersion,
        fieldCount: flattenedFields.length,
      }
    })
  }

  /**
   * insertFieldValueByType
   *
   * @param tx
   * @param documentVersionId
   * @param collectionId
   * @param fieldValue
   * @returns
   */
  private async insertFieldValueByType(
    tx: DatabaseConnection,
    documentVersionId: string,
    collectionId: string,
    fieldValue: any
  ): Promise<any> {
    const baseData = {
      id: uuidv7(),
      document_version_id: documentVersionId,
      collection_id: collectionId,
      field_path: fieldValue.field_path,
      field_name: fieldValue.field_name,
      locale: fieldValue.locale,
      parent_path: fieldValue.parent_path,
    }

    switch (fieldValue.field_type) {
      case 'select':
      case 'text':
      case 'textArea':
        // Handle both simple string values and localized object values
        if (typeof fieldValue.value === 'object' && fieldValue.value != null) {
          const values: any[] = []
          const entries = Object.entries<string>(fieldValue.value)
          for (const [locale, localizedValue] of entries) {
            values.push({
              ...baseData,
              id: uuidv7(), // we need a unique ID for each localized value
              locale: locale,
              value: localizedValue as string,
            })
          }
          return await tx.insert(textStore).values(values)
        }

        // Simple string value
        return await tx.insert(textStore).values({
          ...baseData,
          value: fieldValue.value as string,
        })

      case 'float':
      case 'integer':
      case 'decimal':
        if (isNumericStore(fieldValue)) {
          return await tx.insert(numericStore).values({
            ...baseData,
            number_type: fieldValue.number_type,
            value_float: fieldValue.value_float, // For 'number' type
            value_integer: fieldValue.value_integer,
            value_decimal: fieldValue.value_decimal,
          })
        }
        throw new Error(`Invalid numeric field value for ${baseData.field_path}`)

      case 'checkbox':
      case 'boolean':
        return await tx.insert(booleanStore).values({
          ...baseData,
          value: fieldValue.value,
        })

      case 'time':
      case 'date':
      case 'datetime':
        return await tx.insert(datetimeStore).values({
          ...baseData,
          date_type: fieldValue.date_type || 'datetime',
          value_time: fieldValue.value_time,
          value_date: fieldValue.value_date,
          value_timestamp_tz: fieldValue.value_timestamp_tz,
        })

      case 'file':
      case 'image':
        if (isFileStore(fieldValue)) {
          return await tx.insert(fileStore).values({
            ...baseData,
            file_id: fieldValue.file_id,
            filename: fieldValue.filename,
            original_filename: fieldValue.original_filename,
            mime_type: fieldValue.mime_type,
            file_size: fieldValue.file_size,
            storage_provider: fieldValue.storage_provider,
            storage_path: fieldValue.storage_path,
            storage_url: fieldValue.storage_url,
            file_hash: fieldValue.file_hash,
            image_width: fieldValue.image_width,
            image_height: fieldValue.image_height,
            image_format: fieldValue.image_format,
            processing_status: fieldValue.processing_status || 'pending',
            thumbnail_generated: fieldValue.thumbnail_generated || false,
          })
        }
        throw new Error(`Invalid file field value for ${baseData.field_path}`)

      case 'relation':
        if (isRelationStore(fieldValue)) {
          return await tx.insert(relationStore).values({
            ...baseData,
            target_document_id: fieldValue.target_document_id,
            target_collection_id: fieldValue.target_collection_id,
            relationship_type: fieldValue.relationship_type || 'reference',
            cascade_delete: fieldValue.cascade_delete || false,
          })
        }
        throw new Error(`Invalid relation field value for ${baseData.field_path}`)

      case 'richText':
        // TODO: What does a localized version of rich text look like?

        // // Handle both simple values and localized object values for rich text
        // if (typeof fieldValue.value === 'object' && fieldValue.value != null) {
        //   const values: any[] = [];
        //   const entries = Object.entries<string>(fieldValue.value);
        //   for (const [locale, localizedValue] of entries) {
        //     values.push({
        //       ...baseData,
        //       id: uuidv7(), // we need a unique ID for each localized value
        //       locale: locale,
        //       value: localizedValue as string,
        //     })
        //   }
        //   return await tx.insert(jsonStore).values(values);
        // }
        // If not a localized object, treat as regular rich text content
        return await tx.insert(jsonStore).values({
          ...baseData,
          value: fieldValue.value,
        })

      case 'json':
      case 'object':
        if (isJsonStore(fieldValue)) {
          // Handle localized JSON/object fields
          if (typeof fieldValue.value === 'object' && fieldValue.value != null) {
            const values: any[] = []
            const entries = Object.entries<string>(fieldValue.value)
            for (const [locale, localizedValue] of entries) {
              values.push({
                ...baseData,
                id: uuidv7(), // we need a unique ID for each localized value
                locale: locale,
                value: localizedValue as string,
              })
            }
            return await tx.insert(jsonStore).values(values)
          }
          // If not a localized object, treat as regular JSON content
          return await tx.insert(jsonStore).values({
            ...baseData,
            value: fieldValue.value,
            json_schema: fieldValue.json_schema,
            object_keys: fieldValue.object_keys,
          })
        }
        throw new Error(`Invalid JSON field value for ${baseData.field_path}`)

      default:
        throw new Error('Unsupported field type')
    }
  }
}

/**
 * Factory function
 * @param siteConfig
 * @param db
 * @returns
 */
export function createCommandBuilders(db: DatabaseConnection) {
  return {
    collections: new CollectionCommands(db),
    documents: new DocumentCommands(db),
  }
}
