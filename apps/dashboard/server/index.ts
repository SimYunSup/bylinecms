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

/** 
 * NOTE: Before you dunk on this, this is a prototype implementation 
 * of our API and used only for development.
 * We'll extract a properly configured API server soon.
 */

// Initialize Byline config by importing the shared config package
// NOTE: This is a temporary workaround to ensure the config is loaded
// and will be changed once we refactor our Byline packages.
import '../byline.config.js';

// TODO: Remove direct dependency on the getCollectionDefinition
import { getCollectionDefinition } from '@byline/byline'
import cors from '@fastify/cors'
import { drizzle } from 'drizzle-orm/node-postgres'
import Fastify from 'fastify'
import { Pool } from 'pg'
import * as z from "zod";
import * as schema from '../database/schema/index.js'
import { createCommandBuilders } from './storage/storage-commands.js'
import { createQueryBuilders } from './storage/storage-queries.js'

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

const pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
const db = drizzle(pool, { schema })
const queries: ReturnType<typeof createQueryBuilders> = createQueryBuilders(db)
const commands: ReturnType<typeof createCommandBuilders> = createCommandBuilders(db)

const metaSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  page_size: z.coerce.number().min(1).max(100).optional(),
  order: z.string().optional(),
  desc: z.boolean().optional(),
  query: z.string().optional(),
  locale: z.string().optional(),
})

type Collection = typeof schema.collections.$inferSelect

/**
 * ensureCollection
 * 
 * Ensures that a collection exists in the database.
 * If it doesn't exist, creates it based on the collection definition from the registry.
 *
 * @param {string} path - The path of the collection to ensure.
 * @returns {Promise<Collection>} The existing or newly created collection.
 */
async function ensureCollection(path: string): Promise<Collection | null | undefined> {
  const collectionDefinition = getCollectionDefinition(path)
  if (collectionDefinition == null) {
    return null
  }

  let collection = await queries.collections.getCollectionByPath(collectionDefinition.path)
  if (collection == null) {
    // Collection doesn't exist in database yet, create it
    await commands.collections.create(collectionDefinition.path, collectionDefinition)
    collection = await queries.collections.getCollectionByPath(collectionDefinition.path)
  }

  return collection
}

/**
 * GET /api/:collection
 * 
 * Get documents from a collection by page. 
 * Defaults to page 1 and page size of 20.
 * 
 * TODO: Implement with optional cursor-based pagination
 * 
 */
app.get<{ Params: { collection: string } }>('/api/:collection', async (request, reply) => {
  const { collection: path } = request.params
  const search = request.query as Record<string, any>

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  const searchParams = metaSchema.safeParse(search)

  const result = await queries.documents.getDocumentsByPage({
    collection_id: collection.id,
    locale: 'en',
    ...searchParams.data
  })
  return result
})

/**
 * POST /api/:collection
 * 
 * Create a new document in a collection.
 * Expects the document data in the request body.
 * 
 * TODO: Re-implement this with the new commands and queries.
 */
app.post<{ Params: { collection: string }; Body: Record<string, any> }>('/api/:collection', async (request, reply) => {
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
    // const documentResults = await commands.documents.createDocument({
    //   collectionId: collectionRecord.id,
    //   collectionConfig: collectionConfig,
    //   action: string,
    //   documentData: any,
    //   path: string,
    //   locale?: string
    //       status?: 'draft' | 'published' | 'archived'
    // })
    // const document = documentResults[0]

    // biome-ignore lint/correctness/noUnreachable: <explanation>
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: 'Validation failed',
        details: z.treeifyError(error)
      })
      return
    }
    app.log.error(error)
    reply.code(500).send({ error: 'Internal app error' })
    return
  }
})

/**
 * GET /api/:collection/:id
 *
 * Get a specific document by ID from a collection. 
 * Note: this expects a logical document_id, and not a 
 * document version ID.
 */
app.get<{ Params: { collection: string; id: string } }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params

  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  const document = await queries.documents.getDocumentById({ collection_id: collection.id, document_id: id, locale: 'en' })
  if (document == null) {
    reply.code(404).send({ error: 'Document not found' })
    return
  }
  reply.code(200).send({ document })
  return
})

/**
 * PUT /api/:collection/:id
 * 
 * Update a specific document by ID in a collection.
 * Expects the updated document data in the request body.
 * 
 * NOTE: In our new immutable 'versioning-by-default' document model,
 * this will create a new version of the document.
 * 
 * TODO: Re-implement this with the new commands and queries.
 */
app.put<{ Params: { collection: string; id: string }; Body: Record<string, any> }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params
  const body = request.body

  console.log('Updating document', JSON.stringify({ path, id, body }, null, 2))

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  // TODO: Implement the update logic with commands
})

/**
 * DELETE /api/:collection/:id
 * Delete a specific document by ID in a collection.
 * 
 * NOTE: In our new immutable 'versioning-by-default' document 
 * model, this will create a new version of the document with 
 * is_deleted set to 'true'.
 * 
 * TODO: Re-implement this with the new commands and queries.
 */
app.delete<{ Params: { collection: string; id: string } }>('/api/:collection/:id', async (request, reply) => {
  const { collection: path, id } = request.params

  // Ensure we have a collection
  const collection = await ensureCollection(path)
  if (collection == null) {
    reply.code(404).send({ error: 'Collection not found in registry or could not be created.' })
    return
  }

  // TODO: Re-implement with our new queries and commands

  // try {
  //   // Get the document to ensure it exists
  //   const documentRecords = await queries.documents.findById(id)
  //   if (documentRecords.length === 0) {
  //     reply.code(404).send({ error: 'Document not found' })
  //     return
  //   }

  //   // Delete the document (cascading deletes will handle versions and field values)
  //   await commands.documents.delete(id)

  //   reply.code(200).send({ status: 'ok' })
  // } catch (error) {
  //   app.log.error(error)
  //   reply.code(500).send({ error: 'Internal app error' })
  // }
})

const port = Number(process.env.PORT) || 3001
app.listen({ port })
  .then(() => app.log.info(`🚀 Server listening on port ${port}`))
  .catch(err => {
    app.log.error(err)
    process.exit(1)
  })