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

import { getCollection } from '@byline/byline/collections/registry'
import * as zodTypes from '@byline/byline/outputs/zod-types/index'
import cors from '@fastify/cors'
import { desc, eq, name } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import Fastify from 'fastify'
import { Pool } from 'pg'
import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import * as schema from '../database/schema/index.js'

const server = Fastify({
  logger: true,
})

await server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

const pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
const db = drizzle(pool, { schema })

// Generic collection routes
server.get<{ Params: { collection: string } }>('/api/:collection', async (request, reply) => {
  const { collection: collectionName } = request.params
  const collection = getCollection(collectionName)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  const table = schema.tables[collection.path]
  if (!table) {
    reply.code(404).send({ error: 'Table not found' })
    return
  }

  try {
    const records = await db.select().from(table).orderBy(desc(table.updated_at))
    console.log(`Records fetched: ${records.length}`)
    return {
      records,
      meta: {
        page: 1,
        page_size: records.length,
        total: records.length,
        total_pages: 1,
      },
      included: {
        collection: {
          name: collection.name,
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
  const { collection: collectionName } = request.params
  const body = request.body

  const collection = getCollection(collectionName)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  const table = schema.tables[collection.path]
  if (!table) {
    reply.code(404).send({ error: 'Table not found' })
    return
  }

  try {
    // Get the create schema for zodTypes
    const createSchema = getCreateSchema(collection.path)
    const validatedData = createSchema.parse(body)

    await db.insert(table).values({
      id: uuidv7(),
      ...validatedData
    })

    reply.code(201).send({ status: 'ok' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: 'zodTypes failed',
        details: error.errors
      })
    } else {
      server.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  }
})

server.get<{ Params: { collection: string; id: string } }>('/api/:collection/:id', async (request, reply) => {
  const { collection: collectionName, id } = request.params

  const collection = getCollection(collectionName)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  const table = schema.tables[collection.path]
  if (!table) {
    reply.code(404).send({ error: 'Table not found' })
    return
  }

  try {
    const records = await db.select().from(table).where(eq(table.id, id)).limit(1)

    if (records.length === 0) {
      reply.code(404).send({ error: 'Record not found' })
      return
    }

    return records[0]
  } catch (error) {
    server.log.error(error)
    reply.code(500).send({ error: 'Internal server error' })
  }
})

server.put<{ Params: { collection: string; id: string }; Body: Record<string, any> }>('/api/:collection/:id', async (request, reply) => {
  const { collection: collectionName, id } = request.params
  const body = request.body

  const collection = getCollection(collectionName)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  const table = schema.tables[collection.path]
  if (!table) {
    reply.code(404).send({ error: 'Table not found' })
    return
  }

  try {
    // Get the update schema for zodTypes
    const updateSchema = getUpdateSchema(collection.path)
    const validatedData = updateSchema.parse(body)

    await db.update(table).set({
      ...validatedData,
      updated_at: new Date()
    }).where(eq(table.id, id))

    reply.code(200).send({ status: 'ok' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: 'zodTypes failed',
        details: error.errors
      })
    } else {
      server.log.error(error)
      reply.code(500).send({ error: 'Internal server error' })
    }
  }
})

server.delete<{ Params: { collection: string; id: string } }>('/api/:collection/:id', async (request, reply) => {
  const { collection: collectionName, id } = request.params

  const collection = getCollection(collectionName)
  if (!collection) {
    reply.code(404).send({ error: 'Collection not found' })
    return
  }

  const table = schema.tables[collection.path]
  if (!table) {
    reply.code(404).send({ error: 'Table not found' })
    return
  }

  try {
    await db.delete(table).where(eq(table.id, id))
    reply.code(200).send({ status: 'ok' })
  } catch (error) {
    server.log.error(error)
    reply.code(500).send({ error: 'Internal server error' })
  }
})

// Helper function to get create schema
function getCreateSchema(collectionPath: string) {
  const schema = zodTypes.createSchemas[collectionPath]
  if (!schema) {
    throw new Error(`No create schema found for collection: ${collectionPath}`)
  }
  return schema
}

// Helper function to get update schema
function getUpdateSchema(collectionPath: string) {
  const schema = zodTypes.updateSchemas[collectionPath]
  if (!schema) {
    throw new Error(`No update schema found for collection: ${collectionPath}`)
  }
  return schema
}

const port = Number(process.env.PORT) || 3001
server.listen({ port })
  .then(() => server.log.info(`🚀 Server listening on port ${port}`))
  .catch(err => {
    server.log.error(err)
    process.exit(1)
  })
