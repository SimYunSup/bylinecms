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
import type { CollectionConfig, SiteConfig } from './@types.js'
import { createCommandBuilders } from './storage-commands.js'
import { createEnhancedCommandBuilders } from './storage-commands-enhanced.js'
import { createQueryBuilders } from './storage-queries.js'
import { createEnhancedQueryBuilders } from './storage-queries-enhanced.js'

// Test database setup
let pool: Pool
let db: ReturnType<typeof drizzle>
let queryBuilders: ReturnType<typeof createQueryBuilders>
let queryBuildersEnhanced: ReturnType<typeof createEnhancedQueryBuilders>
let commandBuilders: ReturnType<typeof createCommandBuilders>
let commandBuildersEnhanced: ReturnType<typeof createEnhancedCommandBuilders>


const siteConfig: SiteConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
  }
}

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
    { name: 'related', type: 'relation', required: false },
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
    type: "paragraph",
    content: [{ type: "text", text: "This is rich text content" }]
  },
  gibberish: {
    en: "English gibberish text",
    es: "Spanish gibberish text"
  },
  related: {},
  cluster: [
    {
      one: { es: "First cluster - one", en: "First cluster - one EN" },
      two: { es: "First cluster - two", en: "First cluster - two EN" },
      three: { es: "First cluster - three", en: "First cluster - three EN" }
    },
    {
      one: { es: "Second cluster - one", en: "Second cluster - one EN" },
      two: { es: "Second cluster - two", en: "Second cluster - two EN" },
      three: { es: "Second cluster - three", en: "Second cluster - three EN" }
    },
    {
      one: { es: "Third cluster - one", en: "Third cluster - one EN" },
      two: { es: "Third cluster - two", en: "Third cluster - two EN" },
      three: { es: "Third cluster - three", en: "Third cluster - three EN" }
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
    queryBuilders = createQueryBuilders(siteConfig, db)
    queryBuildersEnhanced = createEnhancedQueryBuilders(siteConfig, db)
    commandBuilders = createCommandBuilders(siteConfig, db)
    commandBuildersEnhanced = createEnhancedCommandBuilders(siteConfig, db)

    // Create test collection
    const timestamp = Date.now()
    const collection = await commandBuilders.collections.create(
      `pages_collection_${timestamp}`,
      PagesCollectionConfig
    )

    testCollection = { id: collection[0].id, name: collection[0].path }
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
        'all' // Assuming 'all' locale for simplicity
      )
      // console.log('Retrieved complete document:', JSON.stringify(completeDocument, null, 2))
      console.log('Retrieved complete document:', completeDocument)
    })
  })

  describe('Document Relation Strategy', () => {
    it('should create a complete document with a relationship to another document', async () => {
      const sourceDocument1 = structuredClone(examplePageDocument)
      sourceDocument1.path = `test-page-${Date.now()}` // Ensure unique path for each test run
      sourceDocument1.title = `Test Page Title ${Date.now()}` // Ensure unique title for
      const result1 = await commandBuildersEnhanced.documents.createCompleteDocument(
        testCollection.id,
        PagesCollectionConfig,
        sourceDocument1,
        sourceDocument1.path,
      )

      const sourceDocument2 = structuredClone(examplePageDocument)
      sourceDocument2.related = { targetCollectionId: testCollection.id, targetDocumentId: result1.document.id }
      sourceDocument2.path = `test-page-${Date.now()}` // Ensure unique path for each test run
      sourceDocument2.title = `Test Page Title ${Date.now()}` // Ensure unique title for
      const result2 = await commandBuildersEnhanced.documents.createCompleteDocument(
        testCollection.id,
        PagesCollectionConfig,
        sourceDocument2,
        sourceDocument2.path,
      )
      console.log('Created document with relationship:', result2)
      const completeDocument = await queryBuildersEnhanced.documents.getCompleteDocument(
        result2.document.id,
        PagesCollectionConfig,
        'all' // Assuming all locale for simplicity
      )
      console.log('Retrieved document with relationship:', completeDocument)
    })
  })
})