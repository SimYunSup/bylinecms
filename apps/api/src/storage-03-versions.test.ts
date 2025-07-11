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
import * as schema from '../database/schema/index.js'
import type { CollectionConfig, SiteConfig } from './@types/index.js'
import { createCommandBuilders } from './storage-commands.js'
import { createQueryBuilders } from './storage-queries.js'

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

const VersionsCollectionConfig: CollectionConfig = {
  path: 'versioning',
  labels: {
    singular: 'Version',
    plural: 'Versions',
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
        {
          name: 'imageItem', type: 'array', fields: [
            { name: 'image', type: 'file', required: true },
            { name: 'alt', type: 'text', required: true, localized: true },
            { name: 'caption', type: 'text', required: false, localized: true },
          ]
        }
      ]
    },
    {
      name: 'specifications', type: 'array', fields: [
        {
          name: 'specificationItem', type: 'array', fields: [
            { name: 'key', type: 'text', required: true, localized: true },
            { name: 'value', type: 'text', required: true, localized: true },
            { name: 'unit', type: 'text', required: false },
          ]
        }
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
  ],
};

// Complex test document with many fields and arrays
const complexProductDocument = {
  sku: "FOO-12345",
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
  images: [
    {
      imageItem: [
        {
          image: {
            file_id: "018dd0b2-9a2a-7f01-b8b2-a0c719d0f5b3",
            filename: "headphones-main.jpg",
            original_filename: "wireless-headphones.jpg",
            mime_type: "image/jpeg",
            file_size: 2048000,
            storage_provider: "s3",
            storage_path: "/products/img-001.jpg"
          }
        }, {
          alt: {
            en: "Premium wireless headphones front view",
            es: "Vista frontal de auriculares inalámbricos premium",
            fr: "Vue de face du casque sans fil premium"
          }
        }, {
          caption: {
            en: "Sleek design with premium materials",
            es: "Diseño elegante con materiales premium",
            fr: "Design élégant avec des matériaux premium"
          }
        }
      ]
    },
    {
      imageItem: [
        {
          image: {
            file_id: "018dd0b2-9a2a-7f02-8e73-f4c5a9e3d6b8",
            filename: "headphones-side.jpg",
            original_filename: "side-view.jpg",
            mime_type: "image/jpeg",
            file_size: 1536000,
            storage_provider: "s3",
            storage_path: "/products/img-002.jpg"
          }
        }, {
          alt: {
            en: "Side view showing comfort padding",
            es: "Vista lateral mostrando acolchado cómodo",
            fr: "Vue de côté montrant le rembourrage confortable"
          }
        }, {
          caption: {
            en: "Side view showing comfort padding",
            es: "Vista lateral mostrando acolchado cómodo",
            fr: "Vue de côté montrant le rembourrage confortable"
          }
        }
      ]
    }
  ],
  specifications: [
    {
      specificationItem: [
        {
          key: {
            en: "Battery Life",
            es: "Duración de la Batería",
            fr: "Autonomie de la Batterie"
          },
        },
        {
          value: {
            en: "30 hours",
            es: "30 horas",
            fr: "30 heures"
          },
        },
        {
          unit: "hours"
        }
      ]
    },
    {
      specificationItem: [
        {
          key: {
            en: "Weight",
            es: "Peso",
            fr: "Poids"
          },
        }, {
          value: {
            en: "250g",
            es: "250g",
            fr: "250g"
          },
        },
        {
          unit: "grams"
        },
      ]
    },
    {
      specificationItem: [
        {
          key: {
            en: "Driver Size",
            es: "Tamaño del Driver",
            fr: "Taille du Haut-parleur"
          }
        },
        {
          value: {
            en: "40mm",
            es: "40mm",
            fr: "40mm"
          },
        }, {
          unit: "mm"
        }
      ]
    }
  ],
  reviews: [
    {
      reviewItem: [
        { rating: { value_integer: 5 } },
        { comment: { root: { paragraph: 'Some review text here...' } } },
      ]
    },
    {
      reviewItem: [
        { rating: { value_integer: 6 } },
        { comment: { root: { paragraph: 'Some more reviews here...' } } },
      ]
    }
  ],
};

// Global test variables
let testCollection: { id: string; name: string } = {} as any

describe('Document Creation and Versioning', () => {
  before(async () => {
    // Connect to test database
    pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
    db = drizzle(pool, { schema })

    commandBuilders = createCommandBuilders(siteConfig, db)
    queryBuilders = createQueryBuilders(siteConfig, db)

    // Create test collection
    const timestamp = Date.now()
    const collection = await commandBuilders.collections.create(
      `versions_collection_${timestamp}`,
      VersionsCollectionConfig
    )

    testCollection = { id: collection[0].id, name: collection[0].path }
    console.log('Test collection created:', testCollection)
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

  describe('Should create documents and document versions', () => {

    it('should create a document', async () => {
      const timestamp = Date.now()

      const docData = structuredClone(complexProductDocument)
      docData.sku = `PROD-${timestamp}`
      docData.name.en = `Product ${timestamp}`

      const result = await commandBuilders.documents.createDocument({
        collectionId: testCollection.id,
        collectionConfig: VersionsCollectionConfig,
        action: 'create',
        documentData: docData,
        path: docData.sku,
        locale: 'all',
        status: 'draft',
      })

      console.log('Document created:', result)

      assert.notStrictEqual(result.document.document_id, null, 'Document creation failed');
    })

    it('should create a document and document version with the same path', async () => {
      const timestamp = Date.now()

      const docData = structuredClone(complexProductDocument)
      docData.sku = `PROD-${timestamp}`
      docData.name.en = `Product ${timestamp}`

      const firstVersion = await commandBuilders.documents.createDocument({
        collectionId: testCollection.id,
        collectionConfig: VersionsCollectionConfig,
        action: 'create',
        documentData: docData,
        path: docData.sku,
        locale: 'all',
        status: 'draft',
      })

      console.log('firstVersion created:', firstVersion)

      assert.notStrictEqual(firstVersion.document.document_id, null, 'Document creation failed');

      const secondVersion = await commandBuilders.documents.createDocument({
        documentId: firstVersion.document.document_id,
        collectionId: testCollection.id,
        collectionConfig: VersionsCollectionConfig,
        action: 'update',
        documentData: docData,
        path: docData.sku,
        locale: 'all',
        status: 'draft',
      })

      console.log('secondVersion created:', secondVersion)
    })

    it('should create multiple versions of a document and return a version history', async () => {
      const timestamp = Date.now()

      const docData = structuredClone(complexProductDocument)
      docData.sku = `PROD-${timestamp}`
      docData.name.en = `Product ${timestamp}`

      const firstVersion = await commandBuilders.documents.createDocument({
        collectionId: testCollection.id,
        collectionConfig: VersionsCollectionConfig,
        action: 'create',
        documentData: docData,
        path: docData.sku,
        locale: 'all',
        status: 'draft',
      })

      assert.notStrictEqual(firstVersion.document.document_id, null, 'Document creation failed');

      const secondVersion = await commandBuilders.documents.createDocument({
        documentId: firstVersion.document.document_id,
        collectionId: testCollection.id,
        collectionConfig: VersionsCollectionConfig,
        action: 'update',
        documentData: docData,
        path: docData.sku,
        locale: 'all',
        status: 'draft',
      })

      assert.notStrictEqual(secondVersion.document.document_id, null, 'Document creation failed');

      const thirdVersion = await commandBuilders.documents.createDocument({
        documentId: firstVersion.document.document_id,
        collectionId: testCollection.id,
        collectionConfig: VersionsCollectionConfig,
        action: 'update',
        documentData: docData,
        path: docData.sku,
        locale: 'all',
        status: 'draft',
      })

      assert.notStrictEqual(thirdVersion.document.document_id, null, 'Document creation failed');

      const versionHistory = await queryBuilders.documents.getDocumentHistory(
        firstVersion.document.document_id,
        testCollection.id,
      )

      console.log('Version history:', versionHistory)
    })
  })
})