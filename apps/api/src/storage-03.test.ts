/**
 * Enhanced Byline CMS Server Tests - Complete Document Handling with Arrays
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

import { after, before, describe, it } from 'node:test'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../database/schema/index.js'
import { createCommandBuilders } from './storage-commands.js'
import { createEnhancedCommandBuilders } from './storage-commands-enhanced.js'
import { createQueryBuilders } from './storage-queries.js'
import { createEnhancedQueryBuilders } from './storage-queries-enhanced.js'
import type { CollectionConfig } from './storage-utils.js'

// Test database setup
let pool: Pool
let db: ReturnType<typeof drizzle>
let queryBuilders: ReturnType<typeof createQueryBuilders>
let queryBuildersEnhanced: ReturnType<typeof createEnhancedQueryBuilders>
let commandBuilders: ReturnType<typeof createCommandBuilders>
let commandBuildersEnhanced: ReturnType<typeof createEnhancedCommandBuilders>

// Test collection configuration (your original example)
const PagesCollectionConfig: CollectionConfig = {
  path: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  fields: [
    { name: 'path', type: 'text', required: true, unique: true },
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText', required: true },
    { name: 'gibberish', type: 'text', required: false, localized: true },
    {
      name: 'cluster', type: 'array', fields: [
        { name: 'one', type: 'text', required: true, localized: true },
        { name: 'two', type: 'text', required: true, localized: true },
        { name: 'three', type: 'text', required: true, localized: true },
      ]
    },
  ],
};

// Test document data
const examplePageDocument = {
  path: "example-page",
  title: "Example Page Title",
  content: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "This is rich text content" }]
      }
    ]
  },
  gibberish: {
    default: "Default gibberish text",
    en: "English gibberish text",
    es: "Spanish gibberish text"
  },
  cluster: [
    {
      one: { default: "First cluster - one", en: "First cluster - one EN" },
      two: { default: "First cluster - two", en: "First cluster - two EN" },
      three: { default: "First cluster - three", en: "First cluster - three EN" }
    },
    {
      one: { default: "Second cluster - one", en: "Second cluster - one EN" },
      two: { default: "Second cluster - two", en: "Second cluster - two EN" },
      three: { default: "Second cluster - three", en: "Second cluster - three EN" }
    },
    {
      one: { default: "Third cluster - one", en: "Third cluster - one EN" },
      two: { default: "Third cluster - two", en: "Third cluster - two EN" },
      three: { default: "Third cluster - three", en: "Third cluster - three EN" }
    }
  ]
};

// Global test collection
let testCollection: { id: string; name: string } = {} as any

describe('Enhanced Storage Model Tests - Complete Document Handling', () => {
  before(async () => {
    // Connect to test database
    pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
    db = drizzle(pool, { schema })
    queryBuilders = createQueryBuilders(db)
    queryBuildersEnhanced = createEnhancedQueryBuilders(db)
    commandBuilders = createCommandBuilders(db)
    commandBuildersEnhanced = createEnhancedCommandBuilders(db)

    // Create test collection
    const timestamp = Date.now()
    const collection = await commandBuilders.collections.create(
      `pages_collection_${timestamp}`,
      PagesCollectionConfig
    )

    testCollection = { id: collection[0].id, name: collection[0].name }
    console.log('Test collection created:', testCollection)
  })

  after(async () => {
    // Clean up test collection
    try {
      await commandBuilders.collections.delete(testCollection.id)
      console.log('Test collection cleaned up')
    } catch (error) {
      console.error('Failed to cleanup test collection:', error)
    }

    // Clean up database connection
    await pool.end()
  })

  describe('Complete Document Creation Strategy', () => {
    it('should create a complete document', async () => {
      const sourceDocument = structuredClone(examplePageDocument)
      sourceDocument.path = `test-page-${Date.now()}` // Ensure unique path for each test run
      sourceDocument.title = `Test Page Title ${Date.now()}` // Ensure unique title for
      const result = await commandBuildersEnhanced.documents.createCompleteDocument(
        testCollection.id,
        PagesCollectionConfig,
        sourceDocument,
        sourceDocument.path,
      )
      console.log('Created complete document:', result)
    })

    it('should create and return a complete document', async () => {
      const sourceDocument = structuredClone(examplePageDocument)
      sourceDocument.path = `test-page-${Date.now()}` // Ensure unique path for each test run
      sourceDocument.title = `Test Page Title ${Date.now()}` // Ensure unique title for
      const result = await commandBuildersEnhanced.documents.createCompleteDocument(
        testCollection.id,
        PagesCollectionConfig,
        sourceDocument,
        sourceDocument.path,
      )
      console.log('Created complete document:', result)
      const completeDocument = await queryBuildersEnhanced.documents.getCompleteDocument(
        result.document.id,
        PagesCollectionConfig,
        'default' // Assuming default locale for simplicity
      )
      console.log('Retrieved complete document:', completeDocument)
    })
  })
})