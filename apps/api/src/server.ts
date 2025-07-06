/**
 * Byline CMS
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

// NOTE: Before you dunk on this, this is a totally naïve and "weekend hack"
// implementation of our API and used only for prototype development.
// We'll extract a 'proper' API server into a separate app folder soon.

import { getCollectionDefinition } from '@byline/byline/collections/registry'
import cors from '@fastify/cors'
import { drizzle } from 'drizzle-orm/node-postgres'
import Fastify from 'fastify'
import { Pool } from 'pg'
// import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import * as schema from '../database/schema/index.js'
import type { SiteConfig } from './@types.js'
import { createCommandBuilders } from './storage-commands.js'
import { createQueryBuilders } from './storage-queries.js'

const server = Fastify({
  logger: true,
})

await server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

const siteConfig: SiteConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
  }
}

const pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
const db = drizzle(pool, { schema })
const queryBuilders: ReturnType<typeof createQueryBuilders> = createQueryBuilders(siteConfig, db)
const commandBuilders: ReturnType<typeof createCommandBuilders> = createCommandBuilders(siteConfig, db)

// Helper function to reconstruct document from field values
async function reconstructDocument(documentVersionId: string) {
  const fieldValues = await queryBuilders.typedFieldValues.getAllFieldValues(documentVersionId)

  const document = {}
  for (const field of fieldValues) {
    document[field.fieldName] = field.value
  }

  return document
}

// Helper function to store document fields
async function storeDocumentFields(
  documentVersionId: string,
  collectionId: string,
  collectionDefinition: any,
  data: Record<string, any>
) {
  const results: any[] = []

  for (const field of collectionDefinition.fields) {
    const fieldValue = data[field.name]
    if (fieldValue !== undefined) {
      const result = await commandBuilders.fieldValues.insertFieldValue(
        documentVersionId,
        collectionId,
        field.name, // fieldPath same as fieldName for top-level fields
        field.name,
        field.type === 'richtext' ? 'richText' : field.type,
        fieldValue
      )
      results.push(result)
    }
  }

  return results
}

// Helper function to update document fields
async function updateDocumentFields(
  documentVersionId: string,
  collectionDefinition: any,
  data: Record<string, any>
) {
  const results: any[] = []

  for (const field of collectionDefinition.fields) {
    const fieldValue = data[field.name]
    if (fieldValue !== undefined) {
      const result = await commandBuilders.fieldValues.updateFieldValue(
        documentVersionId,
        field.name,
        field.type === 'richtext' ? 'richText' : field.type,
        fieldValue
      )
      results.push(result)
    }
  }

  return results
}

// Generic collection routes
server.get<{ Params: { collection: string } }>('/api/:collection', async (request, reply) => {
  const { collection: path } = request.params
  const collection = getCollectionDefinition(path)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  try {
    // Find the collection in our database
    const collectionRecords = await queryBuilders.collections.findByPath(path)
    if (collectionRecords.length === 0) {
      // Collection doesn't exist in database yet, create it
      await commandBuilders.collections.create(collection.path, collection)
    }
    const collectionRecord = collectionRecords[0]

    // Get all documents for this collection
    const documents = await queryBuilders.documents.findByCollection(collectionRecord.id)

    // Reconstruct each document from field values
    const reconstructedDocuments: any[] = []
    for (const doc of documents) {
      const currentVersion = await queryBuilders.documentVersions.findCurrentVersion(doc.id)
      if (currentVersion.length > 0) {
        const documentData = await reconstructDocument(currentVersion[0].id)
        reconstructedDocuments.push({
          id: doc.id,
          path: doc.path,
          status: doc.status,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          ...documentData
        })
      }
    }

    return {
      records: reconstructedDocuments,
      meta: {
        page: 1,
        page_size: 10,
        total: reconstructedDocuments.length,
        total_pages: 1,
      },
      included: {
        collection: {
          path: collection.path,
        }
      }
    }
  } catch (error) {
    server.log.error(error)
    reply.code(500).send({ error: 'Internal server error' })
  }
})

server.post<{ Params: { collection: string }; Body: Record<string, any> }>('/api/:collection', async (request, reply) => {
  const { collection: path } = request.params
  const body = request.body

  const collection = getCollectionDefinition(path)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  try {
    // Find or create collection in database
    let collectionRecords = await queryBuilders.collections.findByPath(path)
    if (collectionRecords.length === 0) {
      collectionRecords = await commandBuilders.collections.create(collection.name, collection)
    }
    const collectionRecord = collectionRecords[0]

    // Create document
    const documentResults = await commandBuilders.documents.create(
      collectionRecord.id,
      body.path,
      body.status || 'draft'
    )
    const document = documentResults[0]

    // Create initial version
    const versionResults = await commandBuilders.documentVersions.create(
      document.id,
      1,
      true
    )
    const version = versionResults[0]

    // Store field values
    await storeDocumentFields(
      version.id,
      collectionRecord.id,
      collection,
      body
    )

    reply.code(201).send({
      status: 'ok',
      document: {
        id: document.id,
        path: document.path,
        status: document.status
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: 'Validation failed',
        details: error.errors
      })
    } else {
      server.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  }
})

server.get<{ Params: { collection: string; id: string } }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params

  const collection = getCollectionDefinition(path)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  try {
    // Get the document
    const documentRecords = await queryBuilders.documents.findById(id)
    if (documentRecords.length === 0) {
      reply.code(404).send({ error: 'Document not found' })
      return
    }
    const document = documentRecords[0]

    // Get current version
    const currentVersions = await queryBuilders.documentVersions.findCurrentVersion(document.id)
    if (currentVersions.length === 0) {
      reply.code(404).send({ error: 'Document version not found' })
      return
    }
    const currentVersion = currentVersions[0]

    // Reconstruct document from field values
    const documentData = await reconstructDocument(currentVersion.id)

    return {
      id: document.id,
      path: document.path,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      version: currentVersion.versionNumber,
      ...documentData
    }
  } catch (error) {
    server.log.error(error)
    reply.code(500).send({ error: 'Internal server error' })
  }
})

server.put<{ Params: { collection: string; id: string }; Body: Record<string, any> }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params
  const body = request.body

  const collection = getCollectionDefinition(path)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  try {
    // Get the document
    const documentRecords = await queryBuilders.documents.findById(id)
    if (documentRecords.length === 0) {
      reply.code(404).send({ error: 'Document not found' })
      return
    }
    const document = documentRecords[0]

    // Get current version
    const currentVersions = await queryBuilders.documentVersions.findCurrentVersion(document.id)
    if (currentVersions.length === 0) {
      reply.code(404).send({ error: 'Document version not found' })
      return
    }
    const currentVersion = currentVersions[0]

    // Update field values in the current version
    await updateDocumentFields(currentVersion.id, collection, body)

    // Update document metadata if status changed
    if (body.status && body.status !== document.status) {
      await commandBuilders.documents.updateStatus(document.id, body.status)
    }

    reply.code(200).send({ status: 'ok' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: 'Validation failed',
        details: error.errors
      })
    } else {
      server.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  }
})

server.delete<{ Params: { collection: string; id: string } }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params

  const collection = getCollectionDefinition(path)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  try {
    // Get the document to ensure it exists
    const documentRecords = await queryBuilders.documents.findById(id)
    if (documentRecords.length === 0) {
      reply.code(404).send({ error: 'Document not found' })
      return
    }

    // Delete the document (cascading deletes will handle versions and field values)
    await commandBuilders.documents.delete(id)

    reply.code(200).send({ status: 'ok' })
  } catch (error) {
    server.log.error(error)
    reply.code(500).send({ error: 'Internal server error' })
  }
})

const port = Number(process.env.PORT) || 3001
server.listen({ port })
  .then(() => server.log.info(`🚀 Server listening on port ${port}`))
  .catch(err => {
    server.log.error(err)
    process.exit(1)
  })