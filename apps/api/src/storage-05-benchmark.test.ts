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

import { after, before, describe, it } from 'node:test'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../database/schema/index.js'
import type { SiteConfig } from './@types.js'
import { BulkCollectionConfig } from './seed-bulk-documents.js'
import { createQueryBuilders } from './storage-queries.js'
import { createOptimizedQueryBuilders } from './storage-queries-optimized.js'

// Test database setup
let pool: Pool
let db: ReturnType<typeof drizzle>
let queryBuildersOptimized: ReturnType<typeof createOptimizedQueryBuilders>
let queryBuilders: ReturnType<typeof createQueryBuilders>

const siteConfig: SiteConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
  }
}

// Global test variables
let bulkCollection: { id: string; name: string } = {} as any

describe('Bulk Document Operations', () => {
  before(async () => {
    // Connect to test database
    pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
    db = drizzle(pool, { schema })

    queryBuildersOptimized = createOptimizedQueryBuilders(siteConfig, db)
    queryBuilders = createQueryBuilders(siteConfig, db)

    // Get bulk collection
    const collection = await queryBuilders.collections.findByPath('bulk')
    bulkCollection = { id: collection[0].id, name: collection[0].path }
    console.log('Bulk collection retrieved:', bulkCollection)
  })

  after(async () => {
    await pool.end()
  })

  describe('Get Documents for Collection', () => {
    it('get all documents for collection', async () => {

      const startTime = performance.now()

      const documents = await queryBuildersOptimized.documents.getAllCurrentDocumentsForCollectionOptimized
        (
          bulkCollection.id,
          BulkCollectionConfig,
          'all'
        )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`All documents for collection: ${duration.toFixed(2)}ms`)
      console.log('Retrieved documents:', documents.length)
      console.log('Sample document:', documents[0])
    })
    it('get all documents for collection by page', async () => {

      const startTime = performance.now()

      const result = await queryBuildersOptimized.documents.getCurrentDocumentsForCollectionPaginated(
        bulkCollection.id,
        BulkCollectionConfig,
        {
          locale: 'all',
          limit: 50,
          offset: 0,
          orderBy: 'created_at',
          orderDirection: 'desc'
        }
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`All documents for collection by page: ${duration.toFixed(2)}ms`)
      console.log('Retrieved documents:', result.documents.length)
      console.log('Sample document:', result.documents[0])
    })
  })
})