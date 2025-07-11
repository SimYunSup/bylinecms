/**
 * Performance Comparison Tests - Optimized vs Original Storage Queries
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

import assert from 'node:assert';
import { after, before, describe, it } from 'node:test'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { v7 as uuidv7 } from 'uuid'
import * as schema from '../database/schema/index.js'
import type { CollectionConfig, SiteConfig } from './@types/index.js'
import { createCommandBuilders } from './storage-commands.js'
import { createQueryBuilders } from './storage-queries.js'
import { flattenDocument, reconstructDocument } from './storage-utils.js'

// Test database setup
let pool: Pool
let db: ReturnType<typeof drizzle>
let commandBuilders: ReturnType<typeof createCommandBuilders>
let queryBuilders: ReturnType<typeof createQueryBuilders>

const siteConfig: SiteConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
  }
}

const FieldTypesCollectionConfig: CollectionConfig = {
  path: 'docs',
  labels: {
    singular: 'FieldTypes',
    plural: 'FieldType',
  },
  fields: [
    { name: 'path', type: 'text', required: true, unique: true },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'summary', type: 'text', required: true, localized: true },
    { name: 'publishedOn', type: 'datetime', required: false },
    { name: 'views', type: 'integer', required: false },
    { name: 'price', type: 'decimal', required: false },
    { name: 'attachment', type: 'file', required: false },
  ],
};

let filedId = uuidv7()

// Complex test document with many fields and arrays
const sampleDocument = {
  path: "my-first-document",
  title: {
    en: "My First Document",
    es: "Mi Primer Documento",
    fr: "Mon Premier Document"
  },
  summary: {
    en: "This is a sample document for testing purposes.",
    es: "Este es un documento de muestra para fines de prueba.",
    fr: "Il s'agit d'un document d'exemple à des fins de test."
  },
  // category: {
  //   target_collection_id: "cat-123",
  //   target_document_id: "electronics-audio"
  // },
  publishedOn: {
    date_type: "timestamp",
    value_timestamp: new Date("2024-01-15T10:00:00")
  },
  views: { field_type: "integer", value_integer: 100 },
  price: { field_type: "decimal", value_decimal: '19.99' },
  attachment: {
    file_id: filedId,
    filename: "sample-attachment.pdf",
    original_filename: "sample-document.pdf",
    file_size: 102400, // 100 KB
    mime_type: "application/pdf",
    storage_provider: 'local',
    storage_path: 'uploads/attachments/sample-attachment.pdf',
  },
};

// Global test variables
let testCollection: { id: string; name: string } = {} as any

describe('Field Types', () => {
  before(async () => {
    // Connect to test database
    pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
    db = drizzle(pool, { schema })

    commandBuilders = createCommandBuilders(siteConfig, db)
    queryBuilders = createQueryBuilders(siteConfig, db)

    // Create test collection
    const timestamp = Date.now()
    const collection = await commandBuilders.collections.create(
      `field_types_collection_${timestamp}`,
      FieldTypesCollectionConfig
    )

    testCollection = { id: collection[0].id, name: collection[0].path }
    console.log('Test collection created:', testCollection)
  })

  after(async () => {
    // Clean up test collection (cascades to documents and fields)
    try {
      await commandBuilders.collections.delete(testCollection.id)
      console.log('Test collection and documents cleaned up')
    } catch (error) {
      console.error('Failed to cleanup test collection:', error)
    }

    await pool.end()
  })

  it('should create and return a field type document', async () => {

    const sourceDocument = structuredClone(sampleDocument)
    sourceDocument.path = `my-first-field-types-document-${Date.now()}` // Ensure unique path

    const result = await commandBuilders.documents.createDocument({
      collectionId: testCollection.id,
      collectionConfig: FieldTypesCollectionConfig,
      action: 'create',
      documentData: sampleDocument,
      path: sourceDocument.path,
    })

    console.log('Created document:', result)

    const document = await queryBuilders.documents.getCurrentDocument(
      result.document.id,
      FieldTypesCollectionConfig
    )

    console.log('Retrieved document:', document)
  })
})
