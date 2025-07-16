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

import type { SiteConfig } from '@byline/byline/@types/index'
import { getCollectionDefinition } from '@byline/byline/collections/registry'
import cors from '@fastify/cors'
import { drizzle } from 'drizzle-orm/node-postgres'
import Fastify from 'fastify'
import { Pool } from 'pg'
// import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import { th } from 'zod/v4/locales'
import * as schema from '../database/schema/index.js'
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

const metaSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  page_size: z.coerce.number().min(1).max(100).optional(),
  order: z.string().optional(),
  desc: z.boolean().optional(),
  query: z.string().optional(),
  locale: z.string().optional(),
})

type Collection = typeof schema.collections.$inferSelect

async function ensureCollection(path: string): Promise<Collection | null | undefined> {
  // 1. Get the collection definition from the registry
  const collectionDefinition = getCollectionDefinition(path)
  if (collectionDefinition == null) {
    return null
  }

  // 2. Get or create the collection in the database
  let collection = await queryBuilders.collections.getCollectionByPath(collectionDefinition.path)
  if (collection == null) {
    // Collection doesn't exist in database yet, create it
    await commandBuilders.collections.create(collectionDefinition.path, collectionDefinition)
    collection = await queryBuilders.collections.getCollectionByPath(collectionDefinition.path)
  }

  return collection
}

// Get documents
server.get<{ Params: { collection: string } }>('/api/:collection', async (request, reply) => {
  const { collection: path } = request.params
  const search = request.query as Record<string, any>

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  const searchParams = metaSchema.safeParse(search)

  const result = await queryBuilders.documents.getDocumentsByPage(collection.id,
    { ...searchParams.data, locale: 'en' }, // Default to 'en' locale if not provided
  )

  return result
})

server.post<{ Params: { collection: string }; Body: Record<string, any> }>('/api/:collection', async (request, reply) => {
  const { collection: path } = request.params
  const body = request.body

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  try {
    // Create document
    // const documentResults = await commandBuilders.documents.createDocument({
    //   collectionId: collectionRecord.id,
    //   collectionConfig: collectionConfig,
    //   action: string,
    //   documentData: any,
    //   path: string,
    //   locale?: string
    //       status?: 'draft' | 'published' | 'archived'
    // })
    // const document = documentResults[0]

    // // Create initial version
    // const versionResults = await commandBuilders.documentVersions.create(
    //   document.id,
    //   1,
    //   true
    // )
    // const version = versionResults[0]

    // // Store field values
    // await storeDocumentFields(
    //   version.id,
    //   collectionRecord.id,
    //   collection,
    //   body
    // )

    // reply.code(201).send({
    //   status: 'ok',
    //   document: {
    //     id: document.id,
    //     path: document.path,
    //     status: document.status
    //   }
    // })
    // biome-ignore lint/correctness/noUnreachable: <explanation>
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

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  // Get current document
  const document = await queryBuilders.documents.getDocumentById(collection.id, id)
  if (document == null) {
    reply.code(404).send({ error: 'Document version not found' })
    return
  }
  reply.code(200).send({ document })
  return
})

server.put<{ Params: { collection: string; id: string }; Body: Record<string, any> }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params
  const body = request.body

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  // try {
  //   // Get the document
  //   const documentRecords = await queryBuilders.documents.findById(id)
  //   if (documentRecords.length === 0) {
  //     reply.code(404).send({ error: 'Document not found' })
  //     return
  //   }
  //   const document = documentRecords[0]

  //   // Get current version
  //   const currentVersions = await queryBuilders.documentVersions.findCurrentVersion(document.id)
  //   if (currentVersions.length === 0) {
  //     reply.code(404).send({ error: 'Document version not found' })
  //     return
  //   }
  //   const currentVersion = currentVersions[0]

  //   // Update field values in the current version
  //   await updateDocumentFields(currentVersion.id, collection, body)

  //   // Update document metadata if status changed
  //   if (body.status && body.status !== document.status) {
  //     await commandBuilders.documents.updateStatus(document.id, body.status)
  //   }

  //   reply.code(200).send({ status: 'ok' })
  // } catch (error) {
  //   if (error instanceof z.ZodError) {
  //     reply.code(400).send({
  //       error: 'Validation failed',
  //       details: error.errors
  //     })
  //   } else {
  //     server.log.error(error)
  //     reply.code(500).send({ error: 'Internal server error' })
  //   }
  // }
})

server.delete<{ Params: { collection: string; id: string } }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  // const collection = getCollectionDefinition(path)
  // if (!collection) {
  //   reply.code(404).send({ error: 'Collection not found' })
  //   return
  // }

  // try {
  //   // Get the document to ensure it exists
  //   const documentRecords = await queryBuilders.documents.findById(id)
  //   if (documentRecords.length === 0) {
  //     reply.code(404).send({ error: 'Document not found' })
  //     return
  //   }

  //   // Delete the document (cascading deletes will handle versions and field values)
  //   await commandBuilders.documents.delete(id)

  //   reply.code(200).send({ status: 'ok' })
  // } catch (error) {
  //   server.log.error(error)
  //   reply.code(500).send({ error: 'Internal server error' })
  // }
})

const port = Number(process.env.PORT) || 3001
server.listen({ port })
  .then(() => server.log.info(`🚀 Server listening on port ${port}`))
  .catch(err => {
    server.log.error(err)
    process.exit(1)
  })