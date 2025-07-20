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

// Initialize Byline config by importing the shared config package
// NOTE: This is a temporary workaround to ensure the config is loaded
// and will be changed once we refactor our Byline packages.
import '@byline/config';

// IMPORTANT NOTE!: depends on seed-bulk-documents.ts to have run 
// first to create the bulk collection and documents.

import { after, before, describe, it } from 'node:test'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../../database/schema/index.js'
import { createQueryBuilders } from '../storage-queries.js'

// Test database setup
let pool: pg.Pool
let db: NodePgDatabase<typeof schema>
let queryBuilders: ReturnType<typeof createQueryBuilders>

// Global test variables
let collectionId: string

describe('Optional Document Reconstruction', () => {
  before(async () => {
    // Connect to test database

    pool = new pg.Pool({
      connectionString: process.env.POSTGRES_CONNECTION_STRING,
      max: 20, // set pool max size to 20
      idleTimeoutMillis: 2000, // close idle clients after 2 second
      connectionTimeoutMillis: 1000, // return an error after 1 second if connection could not be established
    })

    db = drizzle(pool, { schema })

    queryBuilders = createQueryBuilders(db)

    // Get bulk collection
    const collection = await queryBuilders.collections.getCollectionByPath('docs')
    if (collection == null) {
      throw new Error('Bulk collection not found. Please run seed-bulk-documents.ts first.')
    }
    collectionId = collection.id
  })

  after(async () => {
    if (pool != null && typeof pool.end === 'function') {
      console.log('Drizzle pool is ending...')
      pool.end().catch()
    }
  })

  // describe('Get documents in reconstructed and flattened forms for all locales', () => {
  //   it('get a documents in reconstructed form for all locales', async () => {
  //     const result = await queryBuilders.documents.getDocumentsByPage
  //       ({
  //         collection_id: collectionId,
  //         locale: 'all'
  //       })

  //     if (result.documents.length === 0) {
  //       throw new Error('No documents found for the collection.')
  //     }

  //     const document = await queryBuilders.documents.getDocumentById({
  //       collection_id: collectionId,
  //       document_id: result.documents[0].document_id,
  //       locale: 'all'
  //     })

  //     console.log('Sample reconstructed document:', JSON.stringify(document, null, 2))
  //   })

  //   it('get a documents in flattened form for all locales', async () => {
  //     const result = await queryBuilders.documents.getDocumentsByPage
  //       ({
  //         collection_id: collectionId,
  //         locale: 'all'
  //       })

  //     if (result.documents.length === 0) {
  //       throw new Error('No documents found for the collection.')
  //     }

  //     const document = await queryBuilders.documents.getDocumentById({
  //       collection_id: collectionId,
  //       document_id: result.documents[0].document_id,
  //       locale: 'all',
  //       reconstruct: false
  //     })

  //     console.log('Sample flattened document:', JSON.stringify(document, null, 2))

  //   })
  // })

  describe('Get documents in reconstructed and flattened forms for en locale', () => {
    it('get a documents in reconstructed form for en locale', async () => {
      const result = await queryBuilders.documents.getDocumentsByPage
        ({
          collection_id: collectionId,
          locale: 'en'
        })

      if (result.documents.length === 0) {
        throw new Error('No documents found for the collection.')
      }

      const document = await queryBuilders.documents.getDocumentById({
        collection_id: collectionId,
        document_id: result.documents[0].document_id,
        locale: 'en'
      })

      console.log('Sample reconstructed document:', JSON.stringify(document, null, 2))
    })

    it('get a documents in flattened form for en locale', async () => {
      const result = await queryBuilders.documents.getDocumentsByPage
        ({
          collection_id: collectionId,
          locale: 'en'
        })

      if (result.documents.length === 0) {
        throw new Error('No documents found for the collection.')
      }

      const document = await queryBuilders.documents.getDocumentById({
        collection_id: collectionId,
        document_id: result.documents[0].document_id,
        locale: 'en',
        reconstruct: false
      })

      console.log('Sample flattened document:', JSON.stringify(document, null, 2))

    })
  })
})