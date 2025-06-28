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

import cors from '@fastify/cors'
import { desc, eq } from 'drizzle-orm';
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
  // You can customize the CORS policy here
  origin: true, // or specify an array of origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

const pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING })
const db = drizzle(pool, { schema })

server.get('/api/pages', async () => {
  const pages = await db.select().from(schema.pages).orderBy(desc(schema.pages.updated_at))
  return {
    pages,
    meta: {
      page: 1,
      page_size: 10,
      total: pages.length,
      total_pages: Math.ceil(pages.length / 10),
      query: '',
      order: 'created_at',
      desc: false,
    }
  }
})

server.post<{ Body: Record<string, any> }>('/api/pages', async (request, reply) => {
  const body = request.body
  // @ts-expect-error: test for now
  await db.insert(schema.pages).values({ id: uuidv7(), ...body })
  reply.code(201).send({ status: 'ok' })
})

server.get('/api/pages/:id', async (request, reply) => {
  const { id } = request.params as { id: string }
  const page = await db.select().from(schema.pages).where(eq(schema.pages.id, id)).limit(1)

  if (page.length === 0) {
    reply.code(404).send({ error: 'Page not found' })
    return
  }

  return page[0]
})

// Note: Temporary schema before generated types and field API 
// have been properly implemented
const pageUpdateSchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  content: z.any().optional(),
  publishedOn: z.coerce.date().optional(), // This will coerce string to Date
  featured: z.boolean().optional(),
  // Add other fields as needed
})

server.put<{ Body: Record<string, any>; Params: { id: string } }>('/api/pages/:id', async (request, reply) => {
  const { id } = request.params
  const body = request.body
  try {
    const validatedData = pageUpdateSchema.parse(body)
    await db.update(schema.pages).set(validatedData).where(eq(schema.pages.id, id))
    reply.code(200).send({ status: 'ok' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        error: 'Validation failed',
        details: error.errors
      })
    } else {
      reply.code(500).send({ error: 'Internal server error' })
    }
  }
})

const port = Number(process.env.PORT) || 3001
server.listen({ port })
  .then(() => server.log.info(`🚀 Server listening on port ${port}`))
  .catch(err => {
    server.log.error(err)
    process.exit(1)
  })
