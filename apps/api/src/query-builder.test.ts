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

import { after, before, beforeEach, describe, it } from 'node:test'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { v7 as uuidv7 } from 'uuid'
import * as schema from '../database/schema/index.js'
import { createQueryBuilders } from './query-builder.js'

// Test database setup
let pool: Pool
let db: ReturnType<typeof drizzle>
let queryBuilders: ReturnType<typeof createQueryBuilders>

// Global test collections to avoid name conflicts
let testCollections: {
  documentTest: { id: string; name: string }
  versionTest: { id: string; name: string }
  fieldTest: { id: string; name: string }
  completeTest: { id: string; name: string }
} = {} as any

describe('Storage Model Tests', () => {
  before(async () => {
    // Connect to test database
    pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
    db = drizzle(pool, { schema })
    queryBuilders = createQueryBuilders(db)

    // Create all test collections once to avoid unique constraint violations
    const timestamp = Date.now()

    const documentTestCollection = await queryBuilders.collections.create(
      `document_test_collection_${timestamp}`,
      {
        name: `Document Test Collection ${timestamp}`,
        path: `document_test_${timestamp}`,
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richText', required: false },
          { name: 'publishedOn', type: 'datetime', required: false }
        ]
      }
    )

    const versionTestCollection = await queryBuilders.collections.create(
      `version_test_collection_${timestamp}`,
      {
        name: `Version Test Collection ${timestamp}`,
        path: `version_test_${timestamp}`,
        fields: [
          { name: 'title', type: 'text', required: true }
        ]
      }
    )

    const fieldTestCollection = await queryBuilders.collections.create(
      `field_test_collection_${timestamp}`,
      {
        name: `Field Test Collection ${timestamp}`,
        path: `field_test_${timestamp}`,
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richText', required: false },
          { name: 'published', type: 'boolean', required: false },
          { name: 'publishedOn', type: 'datetime', required: false },
          { name: 'rating', type: 'integer', required: false }
        ]
      }
    )

    const completeTestCollection = await queryBuilders.collections.create(
      `complete_test_collection_${timestamp}`,
      {
        name: `Complete Test Collection ${timestamp}`,
        path: `complete_test_${timestamp}`,
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richText', required: false },
          { name: 'published', type: 'boolean', required: false },
          { name: 'publishedOn', type: 'datetime', required: false },
          { name: 'rating', type: 'integer', required: false }
        ]
      }
    )

    testCollections = {
      documentTest: { id: documentTestCollection[0].id, name: documentTestCollection[0].name },
      versionTest: { id: versionTestCollection[0].id, name: versionTestCollection[0].name },
      fieldTest: { id: fieldTestCollection[0].id, name: fieldTestCollection[0].name },
      completeTest: { id: completeTestCollection[0].id, name: completeTestCollection[0].name }
    }

    console.log('Test collections created:', testCollections)
  })

  after(async () => {
    // Clean up test collections
    try {
      const collectionIds = Object.values(testCollections).map(c => c.id)
      for (const collectionId of collectionIds) {
        // Note: In a real implementation, you'd want to properly cascade delete
        // For now, we'll assume cascade deletes are handled by foreign key constraints
        await queryBuilders.collections.delete(collectionId)
      }
      console.log('Test collections cleaned up')
    } catch (error) {
      console.error('Failed to cleanup test collections:', error)
    }

    // Clean up database connection
    await pool.end()
  })

  beforeEach(async () => {
    // Clean up data between tests if needed
    // For now, we'll assume tables are recreated fresh
  })

  describe('Collection Operations', () => {
    it('should create a new collection', async () => {
      const collectionName = 'test_collection'
      const collectionConfig = {
        name: collectionName,
        path: 'test',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richText', required: false }
        ]
      }

      const result = await queryBuilders.collections.create(collectionName, collectionConfig)
      console.log('Created collection:', result)
    })

    it('should find collection by name', async () => {
      const collectionName = 'findable_collection'
      const collectionConfig = { name: collectionName, path: 'findable' }

      await queryBuilders.collections.create(collectionName, collectionConfig)
      const found = await queryBuilders.collections.findByName(collectionName)

      console.log('Found collection:', found)
    })

    it('should get all collections', async () => {
      const collections = await queryBuilders.collections.getAll()
      console.log('All collections:', collections)
    })
  })

  describe('Document Operations', () => {
    let testCollectionId: string

    beforeEach(async () => {
      // Use the global test collection
      testCollectionId = testCollections.documentTest.id
    })

    it('should create a new document', async () => {
      const document = await queryBuilders.documents.create(
        testCollectionId,
        '/test-document',
        'draft'
      )

      console.log('Created document:', document)
    })

    it('should find document by id', async () => {
      const document = await queryBuilders.documents.create(testCollectionId, '/findable-doc')
      const found = await queryBuilders.documents.findById(document[0].id)

      console.log('Found document:', found)
    })

    it('should find documents by collection', async () => {
      await queryBuilders.documents.create(testCollectionId, '/doc1')
      await queryBuilders.documents.create(testCollectionId, '/doc2')

      const documents = await queryBuilders.documents.findByCollection(testCollectionId)
      console.log('Documents in collection:', documents)
    })

    it('should update document status', async () => {
      const document = await queryBuilders.documents.create(testCollectionId, '/status-test')
      const updated = await queryBuilders.documents.updateStatus(document[0].id, 'published')

      console.log('Updated document status:', updated)
    })

    it('should delete document', async () => {
      const document = await queryBuilders.documents.create(testCollectionId, '/delete-test')
      await queryBuilders.documents.delete(document[0].id)

      const found = await queryBuilders.documents.findById(document[0].id)
      console.log('Document after deletion (should be empty):', found)
    })
  })

  describe('Document Version Operations', () => {
    let testDocumentId: string

    beforeEach(async () => {
      // Create test document using global collection
      const document = await queryBuilders.documents.create(
        testCollections.versionTest.id,
        `/version-test-${Date.now()}`
      )
      testDocumentId = document[0].id
    })

    it('should create document version', async () => {
      const version = await queryBuilders.documentVersions.create(
        testDocumentId,
        1,
        true,
        'test-user-id'
      )

      console.log('Created document version:', version)
    })

    it('should find current version', async () => {
      await queryBuilders.documentVersions.create(testDocumentId, 1, true)
      const currentVersion = await queryBuilders.documentVersions.findCurrentVersion(testDocumentId)

      console.log('Current version:', currentVersion)
    })

    it('should create multiple versions and mark one as current', async () => {
      await queryBuilders.documentVersions.create(testDocumentId, 1, false)
      await queryBuilders.documentVersions.create(testDocumentId, 2, false)
      await queryBuilders.documentVersions.create(testDocumentId, 3, true)

      const allVersions = await queryBuilders.documentVersions.findByDocument(testDocumentId)
      const currentVersion = await queryBuilders.documentVersions.findCurrentVersion(testDocumentId)

      console.log('All versions:', allVersions)
      console.log('Current version:', currentVersion)
    })

    it('should mark specific version as current', async () => {
      await queryBuilders.documentVersions.create(testDocumentId, 1, true)
      await queryBuilders.documentVersions.create(testDocumentId, 2, false)

      await queryBuilders.documentVersions.markAsCurrent(testDocumentId, 2)
      const currentVersion = await queryBuilders.documentVersions.findCurrentVersion(testDocumentId)

      console.log('New current version:', currentVersion)
    })
  })

  describe('Field Value CRUD Operations', () => {
    let testCollectionId: string
    let testDocumentId: string
    let testVersionId: string

    beforeEach(async () => {
      // Use global test collection and create document and version
      testCollectionId = testCollections.fieldTest.id

      const document = await queryBuilders.documents.create(
        testCollectionId,
        `/field-test-${Date.now()}`
      )
      testDocumentId = document[0].id

      const version = await queryBuilders.documentVersions.create(testDocumentId, 1, true)
      testVersionId = version[0].id
    })

    it('should insert text field value', async () => {
      const result = await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'title',
        'title',
        'text',
        'Test Article Title'
      )

      console.log('Inserted text field:', result)
    })

    it('should insert richText field value', async () => {
      const richTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'This is rich text content' }]
          }
        ]
      }

      const result = await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'content',
        'content',
        'richText',
        richTextContent
      )

      console.log('Inserted richText field:', result)
    })

    it('should insert boolean field value', async () => {
      const result = await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'published',
        'published',
        'boolean',
        true
      )

      console.log('Inserted boolean field:', result)
    })

    it('should insert datetime field value', async () => {
      const now = new Date()
      const result = await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'publishedOn',
        'publishedOn',
        'datetime',
        now
      )

      console.log('Inserted datetime field:', result)
    })

    it('should insert integer field value', async () => {
      const result = await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'rating',
        'rating',
        'integer',
        5
      )

      console.log('Inserted integer field:', result)
    })

    it('should get all field values for a document version', async () => {
      // Insert multiple field values
      await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'title',
        'title',
        'text',
        'Complete Document'
      )

      await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'published',
        'published',
        'boolean',
        true
      )

      await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'rating',
        'rating',
        'integer',
        4
      )

      const allFields = await queryBuilders.typedFieldValues.getAllFieldValues(testVersionId)
      console.log('All field values:', allFields)
    })

    it('should update field values', async () => {
      // Insert initial value
      await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'title',
        'title',
        'text',
        'Original Title'
      )

      // Update the value
      const updated = await queryBuilders.fieldValues.updateFieldValue(
        testVersionId,
        'title',
        'text',
        'Updated Title'
      )

      console.log('Updated field value:', updated)
    })

    it('should delete field values', async () => {
      // Insert some values
      await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'title',
        'title',
        'text',
        'To Be Deleted'
      )

      await queryBuilders.fieldValues.insertFieldValue(
        testVersionId,
        testCollectionId,
        'published',
        'published',
        'boolean',
        false
      )

      // Delete specific field
      await queryBuilders.fieldValues.deleteFieldValues(testVersionId, 'title')

      const remainingFields = await queryBuilders.typedFieldValues.getAllFieldValues(testVersionId)
      console.log('Remaining fields after deletion:', remainingFields)

      // Delete all fields for the version
      await queryBuilders.fieldValues.deleteFieldValues(testVersionId)

      const allFieldsAfterDeletion = await queryBuilders.typedFieldValues.getAllFieldValues(testVersionId)
      console.log('All fields after complete deletion:', allFieldsAfterDeletion)
    })
  })

  describe('Complex Document Operations', () => {
    it('should create a complete document with all field types', async () => {
      // Use global test collection
      const collectionId = testCollections.completeTest.id

      // Create document
      const document = await queryBuilders.documents.create(
        collectionId,
        `/complete-test-${Date.now()}`
      )

      // Create version
      const version = await queryBuilders.documentVersions.create(document[0].id, 1, true)

      // Insert all types of field values
      const fieldOperations = [
        queryBuilders.fieldValues.insertFieldValue(
          version[0].id,
          collectionId,
          'title',
          'title',
          'text',
          'Complete Test Document'
        ),
        queryBuilders.fieldValues.insertFieldValue(
          version[0].id,
          collectionId,
          'content',
          'content',
          'richText',
          { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rich content here' }] }] }
        ),
        queryBuilders.fieldValues.insertFieldValue(
          version[0].id,
          collectionId,
          'published',
          'published',
          'boolean',
          true
        ),
        queryBuilders.fieldValues.insertFieldValue(
          version[0].id,
          collectionId,
          'publishedOn',
          'publishedOn',
          'datetime',
          new Date()
        ),
        queryBuilders.fieldValues.insertFieldValue(
          version[0].id,
          collectionId,
          'rating',
          'rating',
          'integer',
          5
        )
      ]

      await Promise.all(fieldOperations)

      // Retrieve the complete document
      const allFields = await queryBuilders.typedFieldValues.getAllFieldValues(version[0].id)

      console.log('Complete document fields:', allFields)
      console.log('Document metadata:', document[0])
      console.log('Version metadata:', version[0])
    })
  })
})