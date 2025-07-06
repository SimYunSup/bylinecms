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
import type { CollectionConfig, ReconstructedFieldValue } from './@types.js'
import { createCommandBuilders } from './storage-commands.js'
import { createEnhancedCommandBuilders } from './storage-commands-enhanced.js'
import { createQueryBuilders } from './storage-queries.js'
import { createEnhancedQueryBuilders } from './storage-queries-enhanced.js'
import {
  buildFieldPath,
  flattenDocumentToFieldValues,
  parseFieldPath,
  reconstructArrayField,
  reconstructDocument
} from './storage-utils.js'

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

describe('Enhanced Storage Model Tests - Document Flattening and Reconstruction', () => {
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

  describe('Field Path Construction Strategy', () => {
    it('should build correct field paths for simple fields', () => {
      const simplePath = buildFieldPath('title')
      console.log('Simple field path:', simplePath)
      // Expected: "title"
    })

    it('should build correct field paths for array fields', () => {
      const arrayPath = buildFieldPath('cluster', 0)
      console.log('Array field path:', arrayPath)
      // Expected: "cluster.0"
    })

    it('should build correct field paths for nested array fields', () => {
      const nestedPath = buildFieldPath('cluster', 1, 'two')
      console.log('Nested array field path:', nestedPath)
      // Expected: "cluster.1.two"
    })

    it('should parse field paths correctly', () => {
      const testPaths = [
        'title',
        'cluster.0',
        'cluster.1.two',
        'cluster.2.three'
      ]

      for (const path of testPaths) {
        const parsed = parseFieldPath(path)
        console.log(`Parsed "${path}":`, parsed)
      }
    })
  })

  describe('Document Flattening (flattenDocumentToFieldValues)', () => {
    it('should flatten simple fields correctly', () => {
      const simpleDoc = {
        path: "test-path",
        title: "Test Title"
      }

      const flattened = flattenDocumentToFieldValues(
        simpleDoc,
        PagesCollectionConfig,
        'default'
      )

      console.log('Flattened simple document:', flattened)

      // Should have 2 field values
      console.log(`Expected 2 fields, got ${flattened.length}`)
    })

    it('should flatten localized fields correctly', () => {
      const localizedDoc = {
        gibberish: {
          default: "Default text",
          en: "English text",
          es: "Spanish text"
        }
      }

      const flattened = flattenDocumentToFieldValues(
        localizedDoc,
        PagesCollectionConfig,
        'default'
      )

      console.log('Flattened localized document:', flattened)

      // Should have 3 field values (one per locale)
      console.log(`Expected 3 localized fields, got ${flattened.length}`)
    })

    it('should flatten array fields correctly', () => {
      const arrayDoc = {
        cluster: [
          {
            one: { default: "First one", en: "First one EN" },
            two: { default: "First two", en: "First two EN" }
          },
          {
            one: { default: "Second one", en: "Second one EN" },
            two: { default: "Second two", en: "Second two EN" }
          }
        ]
      }

      const flattened = flattenDocumentToFieldValues(
        arrayDoc,
        PagesCollectionConfig,
        'default'
      )

      console.log('Flattened array document:', flattened)

      // Should have field values for:
      // cluster.0.one (default, en) = 2 values
      // cluster.0.two (default, en) = 2 values  
      // cluster.1.one (default, en) = 2 values
      // cluster.1.two (default, en) = 2 values
      // Total: 8 field values
      console.log(`Expected 8 array field values, got ${flattened.length}`)

      // Check field paths
      const fieldPaths = flattened.map(f => f.fieldPath).sort()
      console.log('Generated field paths:', fieldPaths)
    })

    it('should flatten complete document correctly', () => {
      const flattened = flattenDocumentToFieldValues(
        examplePageDocument,
        PagesCollectionConfig,
        'default'
      )

      console.log('Flattened complete document:', flattened)
      console.log(`Total flattened fields: ${flattened.length}`)

      // Group by field type for analysis
      const byType = flattened.reduce((acc, field) => {
        acc[field.fieldType] = (acc[field.fieldType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('Fields by type:', byType)

      // Group by locale for analysis  
      const byLocale = flattened.reduce((acc, field) => {
        acc[field.locale] = (acc[field.locale] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('Fields by locale:', byLocale)
    })
  })

  describe('Document Reconstruction (reconstructDocument)', () => {
    it('should reconstruct simple fields correctly', async () => {
      // First create and store a simple document
      const simpleDoc = {
        path: "test-reconstruct",
        title: "Reconstruction Test"
      }

      // Create document in database
      const document = await commandBuilders.documents.create(testCollection.id, simpleDoc.path)
      const version = await commandBuilders.documentVersions.create(document[0].id, 1, true)

      // Flatten and store field values
      const flattened = flattenDocumentToFieldValues(simpleDoc, PagesCollectionConfig)

      for (const fieldValue of flattened) {
        await commandBuilders.fieldValues.insertFieldValue(
          version[0].id,
          testCollection.id,
          fieldValue.fieldPath,
          fieldValue.fieldName,
          fieldValue.fieldType,
          fieldValue.value,
          fieldValue.locale,
          fieldValue.arrayIndex,
          fieldValue.parentPath
        )
      }

      // Retrieve and reconstruct
      const storedFieldValues = await queryBuilders.typedFieldValues.getAllFieldValues(version[0].id)

      // Convert to ReconstructedFieldValue format
      const reconstructedFieldValues: ReconstructedFieldValue[] = storedFieldValues.map(fv => ({
        id: fv.id,
        documentVersionId: fv.documentVersionId,
        collectionId: fv.collectionId,
        fieldPath: fv.fieldPath,
        fieldName: fv.fieldName,
        locale: fv.locale,
        arrayIndex: fv.arrayIndex,
        parentPath: fv.parentPath,
        value: fv.value,
        fieldType: fv.fieldType
      }))

      const reconstructed = reconstructDocument(
        reconstructedFieldValues,
        PagesCollectionConfig,
        'default'
      )

      console.log('Original simple document:', simpleDoc)
      console.log('Reconstructed simple document:', reconstructed)
    })

    it('should reconstruct localized fields correctly', async () => {
      const localizedDoc = {
        path: "localized-test",
        gibberish: {
          default: "Default gibberish",
          en: "English gibberish",
          es: "Spanish gibberish"
        }
      }

      // Create and store
      const document = await commandBuilders.documents.create(testCollection.id, localizedDoc.path)
      const version = await commandBuilders.documentVersions.create(document[0].id, 1, true)

      const flattened = flattenDocumentToFieldValues(localizedDoc, PagesCollectionConfig)

      for (const fieldValue of flattened) {
        await commandBuilders.fieldValues.insertFieldValue(
          version[0].id,
          testCollection.id,
          fieldValue.fieldPath,
          fieldValue.fieldName,
          fieldValue.fieldType,
          fieldValue.value,
          fieldValue.locale,
          fieldValue.arrayIndex,
          fieldValue.parentPath
        )
      }

      // Retrieve and reconstruct for different locales
      const storedFieldValues = await queryBuilders.typedFieldValues.getAllFieldValues(version[0].id)

      const reconstructedFieldValues: ReconstructedFieldValue[] = storedFieldValues.map(fv => ({
        id: fv.id,
        documentVersionId: fv.documentVersionId,
        collectionId: fv.collectionId,
        fieldPath: fv.fieldPath,
        fieldName: fv.fieldName,
        locale: fv.locale,
        arrayIndex: fv.arrayIndex,
        parentPath: fv.parentPath,
        value: fv.value,
        fieldType: fv.fieldType
      }))

      const reconstructedDefault = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'default')
      const reconstructedEnglish = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'en')
      const reconstructedSpanish = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'es')

      console.log('Original localized document:', localizedDoc)
      console.log('Reconstructed (default):', reconstructedDefault)
      console.log('Reconstructed (en):', reconstructedEnglish)
      console.log('Reconstructed (es):', reconstructedSpanish)
    })

    it('should reconstruct array fields correctly', async () => {
      const arrayDoc = {
        path: "array-test",
        cluster: [
          {
            one: { default: "Array 0 - one", en: "Array 0 - one EN" },
            two: { default: "Array 0 - two", en: "Array 0 - two EN" },
            three: { default: "Array 0 - three", en: "Array 0 - three EN" }
          },
          {
            one: { default: "Array 1 - one", en: "Array 1 - one EN" },
            two: { default: "Array 1 - two", en: "Array 1 - two EN" },
            three: { default: "Array 1 - three", en: "Array 1 - three EN" }
          }
        ]
      }

      // Create and store
      const document = await commandBuilders.documents.create(testCollection.id, arrayDoc.path)
      const version = await commandBuilders.documentVersions.create(document[0].id, 1, true)

      const flattened = flattenDocumentToFieldValues(arrayDoc, PagesCollectionConfig)
      console.log('Flattened array document for storage:', flattened)

      for (const fieldValue of flattened) {
        await commandBuilders.fieldValues.insertFieldValue(
          version[0].id,
          testCollection.id,
          fieldValue.fieldPath,
          fieldValue.fieldName,
          fieldValue.fieldType,
          fieldValue.value,
          fieldValue.locale,
          fieldValue.arrayIndex,
          fieldValue.parentPath
        )
      }

      // Retrieve and reconstruct
      const storedFieldValues = await queryBuilders.typedFieldValues.getAllFieldValues(version[0].id)

      const reconstructedFieldValues: ReconstructedFieldValue[] = storedFieldValues.map(fv => ({
        id: fv.id,
        documentVersionId: fv.documentVersionId,
        collectionId: fv.collectionId,
        fieldPath: fv.fieldPath,
        fieldName: fv.fieldName,
        locale: fv.locale,
        arrayIndex: fv.arrayIndex,
        parentPath: fv.parentPath,
        value: fv.value,
        fieldType: fv.fieldType
      }))

      const reconstructed = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'default')

      console.log('Original array document:', arrayDoc)
      console.log('Reconstructed array document:', reconstructed)

      // Test array field reconstruction specifically
      const clusterFieldConfig = PagesCollectionConfig.fields.find(f => f.name === 'cluster')!
      const clusterFieldValues = reconstructedFieldValues.filter(fv =>
        fv.fieldPath.startsWith('cluster')
      )

      const reconstructedCluster = reconstructArrayField(
        clusterFieldValues,
        clusterFieldConfig,
        'default'
      )

      console.log('Reconstructed cluster array (default locale):', reconstructedCluster)

      const reconstructedClusterEn = reconstructArrayField(
        clusterFieldValues,
        clusterFieldConfig,
        'en'
      )

      console.log('Reconstructed cluster array (en locale):', reconstructedClusterEn)
    })

    it('should reconstruct complete document correctly', async () => {
      // Create and store the complete example document
      const document = await commandBuilders.documents.create(testCollection.id, examplePageDocument.path)
      const version = await commandBuilders.documentVersions.create(document[0].id, 1, true)

      const flattened = flattenDocumentToFieldValues(examplePageDocument, PagesCollectionConfig)
      console.log(`Storing ${flattened.length} field values for complete document`)

      for (const fieldValue of flattened) {
        await commandBuilders.fieldValues.insertFieldValue(
          version[0].id,
          testCollection.id,
          fieldValue.fieldPath,
          fieldValue.fieldName,
          fieldValue.fieldType,
          fieldValue.value,
          fieldValue.locale,
          fieldValue.arrayIndex,
          fieldValue.parentPath
        )
      }

      // Retrieve and reconstruct
      const storedFieldValues = await queryBuilders.typedFieldValues.getAllFieldValues(version[0].id)
      console.log(`Retrieved ${storedFieldValues.length} field values from storage`)

      const reconstructedFieldValues: ReconstructedFieldValue[] = storedFieldValues.map(fv => ({
        id: fv.id,
        documentVersionId: fv.documentVersionId,
        collectionId: fv.collectionId,
        fieldPath: fv.fieldPath,
        fieldName: fv.fieldName,
        locale: fv.locale,
        arrayIndex: fv.arrayIndex,
        parentPath: fv.parentPath,
        value: fv.value,
        fieldType: fv.fieldType
      }))

      const reconstructed = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'default')

      console.log('Original complete document:')
      console.log(JSON.stringify(examplePageDocument, null, 2))

      console.log('Reconstructed complete document:')
      console.log(JSON.stringify(reconstructed, null, 2))

      // Test specific field reconstruction
      console.log('Reconstructed path:', reconstructed.path)
      console.log('Reconstructed title:', reconstructed.title)
      console.log('Reconstructed gibberish (localized):', reconstructed.gibberish)
      console.log('Reconstructed cluster array length:', reconstructed.cluster?.length)
      console.log('First cluster item:', reconstructed.cluster?.[0])
    })
  })

  describe('Round-trip Testing (Complete Workflow)', () => {
    it('should maintain data integrity through flatten -> store -> retrieve -> reconstruct cycle', async () => {
      const originalDoc = {
        path: "round-trip-test",
        title: "Round Trip Test Document",
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Main Heading" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "This is a test paragraph with " }, { type: "text", marks: [{ type: "strong" }], text: "bold text" }]
            }
          ]
        },
        gibberish: {
          default: "Round trip gibberish",
          en: "English round trip gibberish",
          fr: "French round trip gibberish"
        },
        cluster: [
          {
            one: { default: "RT Cluster 0 - one", en: "RT Cluster 0 - one EN", fr: "RT Cluster 0 - one FR" },
            two: { default: "RT Cluster 0 - two", en: "RT Cluster 0 - two EN", fr: "RT Cluster 0 - two FR" },
            three: { default: "RT Cluster 0 - three", en: "RT Cluster 0 - three EN", fr: "RT Cluster 0 - three FR" }
          },
          {
            one: { default: "RT Cluster 1 - one", en: "RT Cluster 1 - one EN", fr: "RT Cluster 1 - one FR" },
            two: { default: "RT Cluster 1 - two", en: "RT Cluster 1 - two EN", fr: "RT Cluster 1 - two FR" },
            three: { default: "RT Cluster 1 - three", en: "RT Cluster 1 - three EN", fr: "RT Cluster 1 - three FR" }
          },
          {
            one: { default: "RT Cluster 2 - one", en: "RT Cluster 2 - one EN", fr: "RT Cluster 2 - one FR" },
            two: { default: "RT Cluster 2 - two", en: "RT Cluster 2 - two EN", fr: "RT Cluster 2 - two FR" },
            three: { default: "RT Cluster 2 - three", en: "RT Cluster 2 - three EN", fr: "RT Cluster 2 - three FR" }
          }
        ]
      }

      // Step 1: Flatten
      console.log('Step 1: Flattening document...')
      const flattened = flattenDocumentToFieldValues(originalDoc, PagesCollectionConfig)
      console.log(`Flattened into ${flattened.length} field values`)

      // Step 2: Store in database
      console.log('Step 2: Storing in database...')
      const document = await commandBuilders.documents.create(testCollection.id, originalDoc.path)
      const version = await commandBuilders.documentVersions.create(document[0].id, 1, true)

      for (const fieldValue of flattened) {
        await commandBuilders.fieldValues.insertFieldValue(
          version[0].id,
          testCollection.id,
          fieldValue.fieldPath,
          fieldValue.fieldName,
          fieldValue.fieldType,
          fieldValue.value,
          fieldValue.locale,
          fieldValue.arrayIndex,
          fieldValue.parentPath
        )
      }

      // Step 3: Retrieve from database
      console.log('Step 3: Retrieving from database...')
      const storedFieldValues = await queryBuilders.typedFieldValues.getAllFieldValues(version[0].id)
      console.log(`Retrieved ${storedFieldValues.length} field values`)

      // Step 4: Reconstruct for different locales
      console.log('Step 4: Reconstructing for different locales...')

      const reconstructedFieldValues: ReconstructedFieldValue[] = storedFieldValues.map(fv => ({
        id: fv.id,
        documentVersionId: fv.documentVersionId,
        collectionId: fv.collectionId,
        fieldPath: fv.fieldPath,
        fieldName: fv.fieldName,
        locale: fv.locale,
        arrayIndex: fv.arrayIndex,
        parentPath: fv.parentPath,
        value: fv.value,
        fieldType: fv.fieldType
      }))

      const reconstructedDefault = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'default')
      const reconstructedEnglish = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'en')
      const reconstructedFrench = reconstructDocument(reconstructedFieldValues, PagesCollectionConfig, 'fr')

      // Step 5: Verify data integrity
      console.log('Step 5: Verifying data integrity...')

      // Check basic fields
      console.log('Original path:', originalDoc.path)
      console.log('Reconstructed path:', reconstructedDefault.path)

      console.log('Original title:', originalDoc.title)
      console.log('Reconstructed title:', reconstructedDefault.title)

      // Check rich text content
      console.log('Original content type:', typeof originalDoc.content)
      console.log('Reconstructed content type:', typeof reconstructedDefault.content)

      // Check localized fields
      console.log('Original gibberish locales:', Object.keys(originalDoc.gibberish))
      console.log('Reconstructed gibberish (default):', reconstructedDefault.gibberish)
      console.log('Reconstructed gibberish (en):', reconstructedEnglish.gibberish)
      console.log('Reconstructed gibberish (fr):', reconstructedFrench.gibberish)

      // Check array fields
      console.log('Original cluster length:', originalDoc.cluster.length)
      console.log('Reconstructed cluster length (default):', reconstructedDefault.cluster?.length)
      console.log('Reconstructed cluster length (en):', reconstructedEnglish.cluster?.length)
      console.log('Reconstructed cluster length (fr):', reconstructedFrench.cluster?.length)

      // Check array item structure
      if (reconstructedDefault.cluster && reconstructedDefault.cluster.length > 0) {
        console.log('Original first cluster item keys:', Object.keys(originalDoc.cluster[0]))
        console.log('Reconstructed first cluster item keys:', Object.keys(reconstructedDefault.cluster[0]))

        console.log('Original cluster[0].one:', originalDoc.cluster[0].one)
        console.log('Reconstructed cluster[0].one (default):', reconstructedDefault.cluster[0].one)
        console.log('Reconstructed cluster[0].one (en):', reconstructedEnglish.cluster[0].one)
        console.log('Reconstructed cluster[0].one (fr):', reconstructedFrench.cluster[0].one)
      }

      console.log('Round-trip test completed successfully!')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty arrays correctly', async () => {
      const docWithEmptyArray = {
        path: "empty-array-test",
        title: "Empty Array Test",
        cluster: []
      }

      const flattened = flattenDocumentToFieldValues(docWithEmptyArray, PagesCollectionConfig)
      console.log('Flattened document with empty array:', flattened)

      // Should only have path and title, no cluster fields
      const clusterFields = flattened.filter(f => f.fieldPath.startsWith('cluster'))
      console.log('Cluster fields for empty array:', clusterFields.length)
    })

    it('should handle missing optional fields correctly', async () => {
      const minimalDoc = {
        path: "minimal-test",
        title: "Minimal Test Document",
        content: { type: "doc", content: [] }
        // Missing gibberish and cluster (both optional)
      }

      const flattened = flattenDocumentToFieldValues(minimalDoc, PagesCollectionConfig)
      console.log('Flattened minimal document:', flattened)

      // Should only have required fields
      const fieldNames = flattened.map(f => f.fieldName)
      console.log('Field names in minimal document:', fieldNames)
    })

    it('should handle null and undefined values correctly', async () => {
      const docWithNulls = {
        path: "null-test",
        title: "Null Test Document",
        content: { type: "doc", content: [] },
        gibberish: null, // Explicitly null
        cluster: undefined // Explicitly undefined
      }

      const flattened = flattenDocumentToFieldValues(docWithNulls, PagesCollectionConfig)
      console.log('Flattened document with nulls:', flattened)

      // Should not include null/undefined fields
      const nullFields = flattened.filter(f => f.value === null || f.value === undefined)
      console.log('Null/undefined fields:', nullFields.length)
    })

    it('should handle partial localization correctly', async () => {
      const partialLocalizedDoc = {
        path: "partial-localized-test",
        gibberish: {
          default: "Default text",
          en: "English text"
          // Missing other locales
        },
        cluster: [
          {
            one: { default: "Only default" }, // Missing other locales
            two: { default: "Default", en: "English", fr: "French" }, // Full localization
            three: { en: "Only English" } // Missing default
          }
        ]
      }

      const flattened = flattenDocumentToFieldValues(partialLocalizedDoc, PagesCollectionConfig)
      console.log('Flattened partially localized document:', flattened)

      // Group by locale to see distribution
      const byLocale = flattened.reduce((acc, field) => {
        acc[field.locale] = (acc[field.locale] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('Fields by locale in partial document:', byLocale)
    })
  })

  describe('Array Field Path Testing', () => {
    it('should handle deeply nested array paths correctly', async () => {
      const complexArrayDoc = {
        path: "complex-array-test",
        cluster: [
          {
            one: { default: "Item 0 - Field 1", en: "Item 0 - Field 1 EN", es: "Item 0 - Field 1 ES" },
            two: { default: "Item 0 - Field 2", en: "Item 0 - Field 2 EN", es: "Item 0 - Field 2 ES" },
            three: { default: "Item 0 - Field 3", en: "Item 0 - Field 3 EN", es: "Item 0 - Field 3 ES" }
          },
          {
            one: { default: "Item 1 - Field 1", en: "Item 1 - Field 1 EN", es: "Item 1 - Field 1 ES" },
            two: { default: "Item 1 - Field 2", en: "Item 1 - Field 2 EN", es: "Item 1 - Field 2 ES" },
            three: { default: "Item 1 - Field 3", en: "Item 1 - Field 3 EN", es: "Item 1 - Field 3 ES" }
          },
          {
            one: { default: "Item 2 - Field 1", en: "Item 2 - Field 1 EN", es: "Item 2 - Field 1 ES" },
            two: { default: "Item 2 - Field 2", en: "Item 2 - Field 2 EN", es: "Item 2 - Field 2 ES" },
            three: { default: "Item 2 - Field 3", en: "Item 2 - Field 3 EN", es: "Item 2 - Field 3 ES" }
          }
        ]
      }
      const flattened = flattenDocumentToFieldValues(complexArrayDoc, PagesCollectionConfig)
      console.log('Flattened complex array document:', flattened)
      // Should have field values for:
      // cluster.0.one (default, en, es) = 3 values
      // cluster.0.two (default, en, es) = 3 values
      // cluster.0.three (default, en, es) = 3 values
      // cluster.1.one (default, en, es) = 3 values
      // cluster.1.two (default, en, es) = 3 values
      // cluster.1.three (default, en, es) = 3 values
      // cluster.2.one (default, en, es) = 3 values
      // cluster.2.two (default, en, es) = 3 values
      // cluster.2.three (default, en, es) = 3 values
      // Total: 27 field values
      console.log(`Expected 27 field values, got ${flattened.length}`)
      // Check field paths
      const fieldPaths = flattened.map(f => f.fieldPath).sort()
      console.log('Generated field paths:', fieldPaths)
      // Should have paths like:
      // cluster.0.one.default, cluster.0.one.en, cluster.0.one.es
      // cluster.0.two.default, cluster.0.two.en, cluster.0.two.es
      // cluster.0.three.default, cluster.0.three.en, cluster.0.three.es
      // cluster.1.one.default, cluster.1.one.en, cluster.1.one.es
      // cluster.1.two.default, cluster.1.two.en, cluster.1.two.es
      // cluster.1.three.default, cluster.1.three.en, cluster.1.three.es
      // cluster.2.one.default, cluster.2.one.en, cluster.2.one.es
      // cluster.2.two.default, cluster.2.two.en, cluster.2.two.es
      // cluster.2.three.default, cluster.2.three.en, cluster.2.three.es
    })
  })
})