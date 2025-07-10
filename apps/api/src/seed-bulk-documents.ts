
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../database/schema/index.js'
import type { CollectionConfig, SiteConfig } from './@types/index.js'
import { createCommandBuilders } from './storage-commands.js'

// Test database setup
let pool: Pool
let db: ReturnType<typeof drizzle>
let commandBuilders: ReturnType<typeof createCommandBuilders>

const siteConfig: SiteConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
  }
}

export const BulkCollectionConfig: CollectionConfig = {
  path: 'bulk',
  labels: {
    singular: 'Bulk',
    plural: 'Bulk',
  },
  fields: [
    { name: 'path', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'description', type: 'richText', required: true, localized: true },
    { name: 'approved', type: 'boolean', required: true },
    { name: 'publishedOn', type: 'datetime', required: false },
    {
      name: 'images', type: 'array', fields: [
        {
          name: 'imageBlock', type: 'array', fields: [
            { name: 'file', type: 'file', required: true },
            { name: 'alt', type: 'text', required: true, localized: true },
            { name: 'caption', type: 'text', required: false, localized: true },
          ]
        }
      ]
    },
    {
      name: 'reviews', type: 'array', fields: [
        {
          name: 'reviewBlock', type: 'array', fields: [
            { name: 'rating', type: 'integer', required: true },
            { name: 'comment', type: 'richText', required: true, localized: true },
          ]
        }
      ]
    },
  ],
};

// Complex test document with many fields and arrays
export const complexProductDocument = {
  path: "BULK-12345",
  name: {
    en: "A bulk created document.",
    es: "Un documento creado en masa.",
    fr: "Un document créé en masse."
  },
  description: {
    en: {
      type: "paragraph",
      content: [{ type: "text", text: "High quality content for your reading pleasure" }]
    },
    es: {
      type: "paragraph",
      content: [{ type: "text", text: "Contenido de alta calidad para tu disfrute de lectura." }]
    },
    fr: {
      type: "paragraph",
      content: [{ type: "text", text: "Du contenu de haute qualité pour le plaisir de votre lecture." }]
    }
  },
  approved: true,
  publishedOn: {
    date_type: "timestamp",
    value_timestamp: new Date("2024-01-15T10:00:00Z")
  },
  images: [
    {
      imageBlock: [
        {
          file_id: "018dd0b2-9a2a-7f01-b8b2-a0c719d0f5b3",
          filename: "editorial-image-01.jpg",
          original_filename: "editorial-image-01.jpg",
          mime_type: "image/jpeg",
          file_size: 2048000,
          storage_provider: "s3",
          storage_path: "/bulk/img-001.jpg"
        },
        {
          alt: {
            en: "Editorial staff working on a new story.",
            es: "Personal del editorial trabajando en una nueva historia.",
            fr: "Le personnel de rédaction travaillant sur une nouvelle histoire."
          }
        },
        {
          caption: {
            en: "Our editorial team hard at work on a new story.",
            es: "Nuestro equipo editorial trabajando arduamente en una nueva historia.",
            fr: "Notre équipe de rédaction travaille dur sur une nouvelle histoire."
          }
        }
      ]
    },
    {
      imageBlock: [
        {
          file_id: "018dd0b2-9a2a-7f01-b8b2-a0c719d0f5b3",
          filename: "editorial-image-01.jpg",
          original_filename: "editorial-image-02.jpg",
          mime_type: "image/jpeg",
          file_size: 2048000,
          storage_provider: "s3",
          storage_path: "/bulk/img-002.jpg"
        },
        {
          alt: {
            en: "Editorial staff working on a new story.",
            es: "Personal del editorial trabajando en una nueva historia.",
            fr: "Le personnel de rédaction travaillant sur une nouvelle histoire."
          }
        },
        {
          caption: {
            en: "Our editorial team hard at work on a new story.",
            es: "Nuestro equipo editorial trabajando arduamente en una nueva historia.",
            fr: "Notre équipe de rédaction travaille dur sur une nouvelle histoire."
          }
        }
      ]
    },
  ],
  reviews: [
    {
      reviewBlock: [
        { rating: 5 },
        { comment: { root: { paragraph: 'Some review text here...' } } },
      ]
    },
    {
      reviewBlock: [
        { rating: 2 },
        { comment: { root: { paragraph: 'A bad  reviews here...' } } },
      ]
    },
    {
      reviewBlock: [
        { rating: 4 },
        { comment: { root: { paragraph: 'Some more reviews here...' } } },
      ]
    }
  ],
};

async function run() {
  // Connect to test database
  pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
  db = drizzle(pool, { schema })

  commandBuilders = createCommandBuilders(siteConfig, db)

  // Create bulk documents to populate the database.
  const bulkCollectionResult = await commandBuilders.collections.create(
    'bulk',
    BulkCollectionConfig
  )

  const bulkCollection = { id: bulkCollectionResult[0].id, name: bulkCollectionResult[0].path }

  console.log(`Created Bulk Collection ${bulkCollection}`)

  for (let i = 0; i < 1000; i++) {
    const docData = structuredClone(complexProductDocument)
    docData.path = `BULK-${12345 + i}`
    docData.name.en = `A bulk created document. ${i + 1}` // Ensure unique names  
    await commandBuilders.documents.createDocument({
      collectionId: bulkCollection.id,
      collectionConfig: BulkCollectionConfig,
      action: 'create',
      documentData: docData,
      path: docData.path,
    })
  }
}

run()
