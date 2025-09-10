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

// IMPORTANT NOTE!: depends on seed-bulk-documents.ts to have run
// first to create the bulk collection and documents.

import { after, before, describe, it } from 'node:test'

import { setupTestDB, teardownTestDB } from '../../lib/test-helper.js'

// Test database setup
let queryBuilders: ReturnType<typeof import('../storage-queries.js').createQueryBuilders>

// Global test variables
let collectionId: string

describe('06 Optional Document Reconstruction', () => {
  before(async () => {
    // Connect to test database
    const testDB = setupTestDB()
    queryBuilders = testDB.queryBuilders

    // Get bulk collection
    const collection = await queryBuilders.collections.getCollectionByPath('docs')
    if (collection == null) {
      throw new Error('Bulk collection not found. Please run seed-bulk-documents.ts first.')
    }
    collectionId = collection.id
  })

  after(async () => {
    await teardownTestDB()
  })

  describe('Get documents in reconstructed and flattened forms for all locales', () => {
    it('get a documents in reconstructed form for all locales', async () => {
      const result = await queryBuilders.documents.getDocumentsByPage({
        collection_id: collectionId,
        locale: 'all',
      })

      if (result.documents.length === 0) {
        throw new Error('No documents found for the collection.')
      }

      const _document = await queryBuilders.documents.getDocumentById({
        collection_id: collectionId,
        document_id: result.documents[0].document_id,
        locale: 'all',
      })

      // console.log('Sample reconstructed document:', JSON.stringify(document, null, 2))
    })

    it('get a documents in flattened form for all locales', async () => {
      const result = await queryBuilders.documents.getDocumentsByPage({
        collection_id: collectionId,
        locale: 'all',
      })

      if (result.documents.length === 0) {
        throw new Error('No documents found for the collection.')
      }

      const _document = await queryBuilders.documents.getDocumentById({
        collection_id: collectionId,
        document_id: result.documents[0].document_id,
        locale: 'all',
        reconstruct: false,
      })

      // console.log('Sample flattened document:', JSON.stringify(document, null, 2))
    })
  })

  describe('Get documents in reconstructed and flattened forms for en locale', () => {
    it('get a documents in reconstructed form for en locale', async () => {
      const result = await queryBuilders.documents.getDocumentsByPage({
        collection_id: collectionId,
        locale: 'en',
      })

      if (result.documents.length === 0) {
        throw new Error('No documents found for the collection.')
      }

      const _document = await queryBuilders.documents.getDocumentById({
        collection_id: collectionId,
        document_id: result.documents[0].document_id,
        locale: 'en',
      })

      // console.log('Sample reconstructed document:', JSON.stringify(document, null, 2))
    })

    it('get a documents in flattened form for en locale', async () => {
      const result = await queryBuilders.documents.getDocumentsByPage({
        collection_id: collectionId,
        locale: 'en',
      })

      if (result.documents.length === 0) {
        throw new Error('No documents found for the collection.')
      }

      const _document = await queryBuilders.documents.getDocumentById({
        collection_id: collectionId,
        document_id: result.documents[0].document_id,
        locale: 'en',
        reconstruct: false,
      })

      // console.log('Sample flattened document:', JSON.stringify(document, null, 2))
    })
  })
})
