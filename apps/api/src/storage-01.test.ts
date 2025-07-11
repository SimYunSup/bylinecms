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

const DocsCollectionConfig: CollectionConfig = {
  path: 'docs',
  labels: {
    singular: 'Document',
    plural: 'Documents',
  },
  fields: [
    { name: 'path', type: 'text', required: true, unique: true },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'summary', type: 'text', required: true, localized: true },
    { name: 'category', type: 'relation', required: false },
    { name: 'publishedOn', type: 'datetime', required: false },
    {
      name: 'content', type: 'array', fields: [
        {
          name: 'richTextBlock', type: 'array', fields: [
            { name: 'constrainedWidth', type: 'boolean', required: false },
            { name: 'richText', type: 'richText', required: true, localized: true },
          ]
        },
        {
          name: 'photoBlock', type: 'array', fields: [
            { name: 'display', type: 'text', required: false },
            { name: 'photo', type: 'file', required: true },
            { name: 'alt', type: 'text', required: true, localized: false },
            { name: 'caption', type: 'richText', required: false, localized: true },
          ]
        },
      ]
    },
    {
      name: 'reviews', type: 'array', fields: [
        {
          name: 'reviewItem', type: 'array', fields: [
            { name: 'rating', type: 'integer', required: true },
            { name: 'comment', type: 'richText', required: true, localized: false },
          ]
        }
      ]
    },
    {
      name: 'links', type: 'array', fields: [
        { name: "link", type: "text" }
      ]
    }
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
  content: [
    {
      richTextBlock: [
        { constrainedWidth: true },
        {
          richText: {
            en: { root: { paragraph: 'Some text here...' } },
            es: { root: { paragraph: 'Some spanish text here' } }
          }
        },
      ],
    },
    {
      photoBlock: [
        { display: 'wide' },
        {
          photo: {
            file_id: filedId,
            filename: 'docs-photo-01.jpg',
            original_filename: 'some-original-filename.jpg',
            mime_type: "image/jpeg",
            file_size: 123456,
            storage_provider: 'local',
            storage_path: 'uploads/docs-photo-01.jpg',
          }
        },
        { alt: 'Some alt text here' },
        {
          caption: {
            en: { root: { paragraph: 'Some text here...' } },
            es: { root: { paragraph: 'Some spanish text here...' } }
          }
        },
      ]
    },
  ],
  reviews: [
    {
      reviewItem: [
        { rating: 5 },
        { comment: { root: { paragraph: 'Some review text here...' } } },
      ]
    },
    {
      reviewItem: [
        { rating: 2 },
        { comment: { root: { paragraph: 'Some more reviews here...' } } },
      ]
    }
  ],
  links: [
    { link: 'https://example.com' },
    { link: 'https://another-example.com' }
  ]
};

// Global test variables
let testCollection: { id: string; name: string } = {} as any

describe('Document Flattening and Reconstruction', () => {
  before(async () => {
    // Connect to test database
    pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
    db = drizzle(pool, { schema })

    commandBuilders = createCommandBuilders(siteConfig, db)
    queryBuilders = createQueryBuilders(siteConfig, db)

    // Create test collection
    const timestamp = Date.now()
    const collection = await commandBuilders.collections.create(
      `documents_collection_${timestamp}`,
      DocsCollectionConfig
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

  it('should flatten and reconstruct a document', () => {
    const flattened = flattenDocument(sampleDocument, DocsCollectionConfig)
    assert(flattened, 'Flattened document should not be null or undefined')
    assert(flattened.length > 0, 'Flattened document should contain field values')
    console.log('Flattened document:', flattened)

    const reconstructed = reconstructDocument(flattened)
    assert(reconstructed, 'Reconstructed document should not be null or undefined')
    const reconstructedJson = JSON.parse(JSON.stringify(reconstructed, null, 2));
    console.log('Reconstructed document:', reconstructedJson)

    // A simplified version of the sample document for deep equality check
    const sampleDocumentJson = JSON.parse(JSON.stringify(sampleDocument));

    assert.deepStrictEqual(reconstructedJson, sampleDocumentJson, 'Reconstructed document should match the original structure');
  })
})