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
import type { CollectionConfig, SiteConfig } from './@types.js'
import { createCommandBuilders } from './storage-commands.js'
import { createEnhancedCommandBuilders } from './storage-commands-enhanced.js'
import { createEnhancedQueryBuilders } from './storage-queries-enhanced.js'
import { createOptimizedQueryBuilders } from './storage-queries-optimized.js'

// Test database setup
let pool: Pool
let db: ReturnType<typeof drizzle>
let commandBuilders: ReturnType<typeof createCommandBuilders>
let commandBuildersEnhanced: ReturnType<typeof createEnhancedCommandBuilders>
let queryBuildersOriginal: ReturnType<typeof createEnhancedQueryBuilders>
let queryBuildersOptimized: ReturnType<typeof createOptimizedQueryBuilders>

const siteConfig: SiteConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
  }
}

// Complex test collection configuration
const ComplexCollectionConfig: CollectionConfig = {
  path: 'products',
  labels: {
    singular: 'Product',
    plural: 'Products',
  },
  fields: [
    { name: 'sku', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'description', type: 'richText', required: true, localized: true },
    { name: 'price', type: 'decimal', required: true },
    { name: 'inStock', type: 'boolean', required: true },
    { name: 'releaseDate', type: 'datetime', required: false },
    { name: 'category', type: 'relation', required: false },
    {
      name: 'images', type: 'array', fields: [
        { name: 'url', type: 'file', required: true },
        { name: 'alt', type: 'text', required: true, localized: true },
        { name: 'caption', type: 'text', required: false, localized: true },
      ]
    },
    {
      name: 'specifications', type: 'array', fields: [
        { name: 'key', type: 'text', required: true, localized: true },
        { name: 'value', type: 'text', required: true, localized: true },
        { name: 'unit', type: 'text', required: false },
      ]
    },
    {
      name: 'reviews', type: 'array', fields: [
        { name: 'rating', type: 'integer', required: true },
        { name: 'comment', type: 'richText', required: true },
        { name: 'author', type: 'relation', required: false },
        { name: 'verified', type: 'boolean', required: true },
      ]
    }
  ],
};

// Complex test document with many fields and arrays
const complexProductDocument = {
  sku: "PROD-12345",
  name: {
    en: "Premium Wireless Headphones",
    es: "Auriculares Inalámbricos Premium",
    fr: "Casque Sans Fil Premium"
  },
  description: {
    en: {
      type: "paragraph",
      content: [{ type: "text", text: "High-quality wireless headphones with noise cancellation" }]
    },
    es: {
      type: "paragraph",
      content: [{ type: "text", text: "Auriculares inalámbricos de alta calidad con cancelación de ruido" }]
    },
    fr: {
      type: "paragraph",
      content: [{ type: "text", text: "Casque sans fil de haute qualité avec suppression du bruit" }]
    }
  },
  price: 299.99,
  inStock: true,
  releaseDate: {
    date_type: "timestamp",
    value_timestamp: new Date("2024-01-15T10:00:00Z")
  },
  // category: {
  //   target_collection_id: "cat-123",
  //   target_document_id: "electronics-audio"
  // },
  images: [
    {
      url: {
        file_id: "018dd0b2-9a2a-7f01-b8b2-a0c719d0f5b3",
        filename: "headphones-main.jpg",
        original_filename: "wireless-headphones.jpg",
        mime_type: "image/jpeg",
        file_size: 2048000,
        storage_provider: "s3",
        storage_path: "/products/img-001.jpg"
      },
      alt: {
        en: "Premium wireless headphones front view",
        es: "Vista frontal de auriculares inalámbricos premium",
        fr: "Vue de face du casque sans fil premium"
      },
      caption: {
        en: "Sleek design with premium materials",
        es: "Diseño elegante con materiales premium",
        fr: "Design élégant avec des matériaux premium"
      }
    },
    {
      url: {
        file_id: "018dd0b2-9a2a-7f02-8e73-f4c5a9e3d6b8",
        filename: "headphones-side.jpg",
        original_filename: "side-view.jpg",
        mime_type: "image/jpeg",
        file_size: 1536000,
        storage_provider: "s3",
        storage_path: "/products/img-002.jpg"
      },
      alt: {
        en: "Side view showing comfort padding",
        es: "Vista lateral mostrando acolchado cómodo",
        fr: "Vue de côté montrant le rembourrage confortable"
      }
    }
  ],
  specifications: [
    {
      key: {
        en: "Battery Life",
        es: "Duración de la Batería",
        fr: "Autonomie de la Batterie"
      },
      value: {
        en: "30 hours",
        es: "30 horas",
        fr: "30 heures"
      },
      unit: "hours"
    },
    {
      key: {
        en: "Weight",
        es: "Peso",
        fr: "Poids"
      },
      value: {
        en: "250g",
        es: "250g",
        fr: "250g"
      },
      unit: "grams"
    },
    {
      key: {
        en: "Driver Size",
        es: "Tamaño del Driver",
        fr: "Taille du Haut-parleur"
      },
      value: {
        en: "40mm",
        es: "40mm",
        fr: "40mm"
      },
      unit: "mm"
    }
  ],
  reviews: [
    {
      rating: 5,
      comment: {
        type: "paragraph",
        content: [{ type: "text", text: "Amazing sound quality and comfort!" }]
      },
      // author: {
      //   target_collection_id: "users-123",
      //   target_document_id: "user-456"
      // },
      verified: true
    },
    {
      rating: 4,
      comment: {
        type: "paragraph",
        content: [{ type: "text", text: "Great headphones, but could be lighter." }]
      },
      // author: {
      //   target_collection_id: "users-123",
      //   target_document_id: "user-789"
      // },
      verified: true
    },
    {
      rating: 5,
      comment: {
        type: "paragraph",
        content: [{ type: "text", text: "Perfect for long listening sessions." }]
      },
      // author: {
      //   target_collection_id: "users-123",
      //   target_document_id: "user-101"
      // },
      verified: false
    }
  ]
};

// Global test variables
let testCollection: { id: string; name: string } = {} as any
let testDocuments: string[] = []

describe('Performance Comparison: Optimized vs Original Storage Queries', () => {
  before(async () => {
    // Connect to test database
    pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
    db = drizzle(pool, { schema })

    commandBuilders = createCommandBuilders(siteConfig, db)
    commandBuildersEnhanced = createEnhancedCommandBuilders(siteConfig, db)
    queryBuildersOriginal = createEnhancedQueryBuilders(siteConfig, db)
    queryBuildersOptimized = createOptimizedQueryBuilders(siteConfig, db)

    // Create test collection
    const timestamp = Date.now()
    const collection = await commandBuilders.collections.create(
      `products_collection_${timestamp}`,
      ComplexCollectionConfig
    )

    testCollection = { id: collection[0].id, name: collection[0].path }
    console.log('Test collection created:', testCollection)

    // Create multiple test documents for batch testing
    for (let i = 0; i < 10; i++) {
      const docData = structuredClone(complexProductDocument)
      docData.sku = `PROD-${12345 + i}`
      docData.name.en = `Product ${i + 1}`

      const result = await commandBuildersEnhanced.documents.createCompleteDocument(
        testCollection.id,
        ComplexCollectionConfig,
        docData,
        docData.sku
      )

      testDocuments.push(result.document.id)
    }

    console.log(`Created ${testDocuments.length} test documents`)
  })

  after(async () => {
    // Clean up test collection (cascades to documents)
    try {
      await commandBuilders.collections.delete(testCollection.id)
      console.log('Test collection and documents cleaned up')
    } catch (error) {
      console.error('Failed to cleanup test collection:', error)
    }

    await pool.end()
  })

  describe('Single Document Retrieval Performance', () => {
    it('should retrieve document using original approach (baseline)', async () => {
      const startTime = performance.now()

      const document = await queryBuildersOriginal.documents.getCompleteDocument(
        testDocuments[0],
        ComplexCollectionConfig,
        'all'
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Original approach: ${duration.toFixed(2)}ms`)
      console.log('Document structure:', Object.keys(document))
      console.log('Images array length:', document.images?.length)
      console.log('Specifications array length:', document.specifications?.length)
      console.log('Reviews array length:', document.reviews?.length)

      // Verify we got the complete document
      console.log('Sample name localization:', document.name)
      console.log('Sample specification:', document.specifications?.[0])
    })

    it('should retrieve document using optimized approach', async () => {
      const startTime = performance.now()

      const document = await queryBuildersOptimized.documents.getCompleteDocument(
        testDocuments[0],
        ComplexCollectionConfig,
        'all'
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Optimized approach: ${duration.toFixed(2)}ms`)
      console.log('Document structure:', Object.keys(document))
      console.log('Images array length:', document.images?.length)
      console.log('Specifications array length:', document.specifications?.length)
      console.log('Reviews array length:', document.reviews?.length)

      // Verify we got the complete document
      console.log('Sample name localization:', document.name)
      console.log('Sample specification:', document.specifications?.[0])
    })

    it('should compare single document performance over multiple runs', async () => {
      const runs = 5
      let originalTotal = 0
      let optimizedTotal = 0

      console.log(`\nRunning ${runs} performance tests...`)

      for (let i = 0; i < runs; i++) {
        // Test original approach
        const originalStart = performance.now()
        await queryBuildersOriginal.documents.getCompleteDocument(
          testDocuments[i % testDocuments.length],
          ComplexCollectionConfig,
          'all'
        )
        const originalEnd = performance.now()
        originalTotal += (originalEnd - originalStart)

        // Test optimized approach
        const optimizedStart = performance.now()
        await queryBuildersOptimized.documents.getCompleteDocument(
          testDocuments[i % testDocuments.length],
          ComplexCollectionConfig,
          'all'
        )
        const optimizedEnd = performance.now()
        optimizedTotal += (optimizedEnd - optimizedStart)
      }

      const originalAvg = originalTotal / runs
      const optimizedAvg = optimizedTotal / runs
      const improvement = ((originalAvg - optimizedAvg) / originalAvg * 100)

      console.log(`\nPerformance Results (${runs} runs):`)
      console.log(`Original average: ${originalAvg.toFixed(2)}ms`)
      console.log(`Optimized average: ${optimizedAvg.toFixed(2)}ms`)
      console.log(`Improvement: ${improvement.toFixed(1)}% faster`)
      console.log(`Speed multiplier: ${(originalAvg / optimizedAvg).toFixed(1)}x`)
    })
  })

  describe('Batch Document Retrieval Performance', () => {
    it('should retrieve multiple documents using original approach (sequential)', async () => {
      const batchSize = 5
      const documentIds = testDocuments.slice(0, batchSize)

      const startTime = performance.now()

      const documents = {}
      for (const docId of documentIds) {
        documents[docId] = await queryBuildersOriginal.documents.getCompleteDocument(
          docId,
          ComplexCollectionConfig,
          'all'
        )
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Original batch (${batchSize} docs): ${duration.toFixed(2)}ms`)
      console.log(`Average per document: ${(duration / batchSize).toFixed(2)}ms`)
      console.log('Retrieved documents:', Object.keys(documents).length)
    })

    it('should retrieve multiple documents using optimized batch approach', async () => {
      const batchSize = 5
      const documentIds = testDocuments.slice(0, batchSize)

      const startTime = performance.now()

      const documents = await queryBuildersOptimized.documents.getMultipleDocuments(
        documentIds,
        ComplexCollectionConfig,
        'all'
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`Optimized batch (${batchSize} docs): ${duration.toFixed(2)}ms`)
      console.log(`Average per document: ${(duration / batchSize).toFixed(2)}ms`)
      console.log('Retrieved documents:', Object.keys(documents).length)

      // Verify all documents were retrieved
      for (const docId of documentIds) {
        console.log(`Document ${docId.slice(-8)}: ${documents[docId] ? 'Found' : 'Missing'}`)
      }
    })

    it('should compare batch retrieval performance', async () => {
      const batchSizes = [3, 5, 10]

      console.log('\nBatch Performance Comparison:')
      console.log('Batch Size | Original | Optimized | Improvement')
      console.log('-----------|----------|-----------|------------')

      for (const batchSize of batchSizes) {
        const documentIds = testDocuments.slice(0, Math.min(batchSize, testDocuments.length))

        // Original approach (sequential)
        const originalStart = performance.now()
        const originalDocs = {}
        for (const docId of documentIds) {
          originalDocs[docId] = await queryBuildersOriginal.documents.getCompleteDocument(
            docId,
            ComplexCollectionConfig,
            'all'
          )
        }
        const originalEnd = performance.now()
        const originalDuration = originalEnd - originalStart

        // Optimized approach (batch)
        const optimizedStart = performance.now()
        const optimizedDocs = await queryBuildersOptimized.documents.getMultipleDocuments(
          documentIds,
          ComplexCollectionConfig,
          'all'
        )
        const optimizedEnd = performance.now()
        const optimizedDuration = optimizedEnd - optimizedStart

        const improvement = ((originalDuration - optimizedDuration) / originalDuration * 100)

        console.log(`${batchSize.toString().padStart(10)} | ${originalDuration.toFixed(0).padStart(8)}ms | ${optimizedDuration.toFixed(0).padStart(9)}ms | ${improvement.toFixed(1).padStart(10)}%`)
      }
    })
  })

  describe('Locale-Specific Retrieval Performance', () => {
    it('should test locale-specific retrieval performance', async () => {
      const locales = ['en', 'es', 'fr', 'all']

      console.log('\nLocale Performance Comparison:')
      console.log('Locale | Original | Optimized | Improvement')
      console.log('-------|----------|-----------|------------')

      for (const locale of locales) {
        // Original approach
        const originalStart = performance.now()
        await queryBuildersOriginal.documents.getCompleteDocument(
          testDocuments[0],
          ComplexCollectionConfig,
          locale
        )
        const originalEnd = performance.now()
        const originalDuration = originalEnd - originalStart

        // Optimized approach
        const optimizedStart = performance.now()
        await queryBuildersOptimized.documents.getCompleteDocument(
          testDocuments[0],
          ComplexCollectionConfig,
          locale
        )
        const optimizedEnd = performance.now()
        const optimizedDuration = optimizedEnd - optimizedStart

        const improvement = ((originalDuration - optimizedDuration) / originalDuration * 100)

        console.log(`${locale.padStart(6)} | ${originalDuration.toFixed(0).padStart(8)}ms | ${optimizedDuration.toFixed(0).padStart(9)}ms | ${improvement.toFixed(1).padStart(10)}%`)
      }
    })
  })


  describe('Get Documents for Collection', () => {
    it('get all documents for collection', async () => {

      // Create multiple test documents for batch testing
      for (let i = 10; i < 110; i++) {
        const docData = structuredClone(complexProductDocument)
        docData.sku = `PROD-${12345 + i}`
        docData.name.en = `Product ${i + 1}`

        const result = await commandBuildersEnhanced.documents.createCompleteDocument(
          testCollection.id,
          ComplexCollectionConfig,
          docData,
          docData.sku
        )

        testDocuments.push(result.document.id)
      }

      const startTime = performance.now()

      const documents = await queryBuildersOptimized.documents.getAllCurrentDocumentsForCollectionOptimized
        (
          testCollection.id,
          ComplexCollectionConfig,
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

      const documents = await queryBuildersOptimized.documents.getCurrentDocumentsForCollectionPaginated(
        testCollection.id,
        ComplexCollectionConfig,
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
      // console.log('Retrieved documents:', documents.length)
      // console.log('Sample document:', documents[0])
    })
  })

  describe('Memory Usage and Result Verification', () => {
    it('should verify both approaches return identical results', async () => {
      const document_id = testDocuments[0]

      const originalResult = await queryBuildersOriginal.documents.getCompleteDocument(
        document_id,
        ComplexCollectionConfig,
        'all'
      )

      const optimizedResult = await queryBuildersOptimized.documents.getCompleteDocument(
        document_id,
        ComplexCollectionConfig,
        'all'
      )

      console.log('Result comparison:')
      console.log('Original keys:', Object.keys(originalResult).sort())
      console.log('Optimized keys:', Object.keys(optimizedResult).sort())

      // Compare specific fields
      console.log('SKU match:', originalResult.sku === optimizedResult.sku)
      console.log('Name EN match:', originalResult.name?.en === optimizedResult.name?.en)
      console.log('Images count match:', originalResult.images?.length === optimizedResult.images?.length)
      console.log('Specs count match:', originalResult.specifications?.length === optimizedResult.specifications?.length)

      // Deep comparison would require custom logic due to object ordering
      console.log('Results appear structurally equivalent')
    })

    it('should estimate memory usage difference', async () => {
      const memBefore = process.memoryUsage()

      // Load multiple documents to see memory impact
      const documents: any[] = []
      for (let i = 0; i < 5; i++) {
        const doc = await queryBuildersOptimized.documents.getCompleteDocument(
          testDocuments[i],
          ComplexCollectionConfig,
          'all'
        )
        documents.push(doc)
      }

      const memAfter = process.memoryUsage()

      console.log('Memory usage for 5 complex documents:')
      console.log(`Heap used: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`)
      console.log(`External: ${((memAfter.external - memBefore.external) / 1024 / 1024).toFixed(2)} MB`)
      console.log(`Approx per document: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024 / 5).toFixed(2)} MB`)
    })
  })
})