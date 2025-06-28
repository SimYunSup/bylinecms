// NOTE: This file has been auto-generated - do not edit.

import { z } from 'zod'

const baseSchema = z.object({
  id: z.string().uuid(),
  vid: z.number().int().positive(),
  published: z.boolean().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

const pagesFieldsSchema = z.object({
  title: z.string(),
  category: z.enum(['foo', 'bar', 'baz']).optional(),
  content: z.any(),
  publishedOn: z.coerce.date().optional(),
  featured: z.boolean().optional(),
})

export const pagesSchema = baseSchema.merge(pagesFieldsSchema)

export const createPagesSchema = pagesFieldsSchema
export const updatePagesSchema = pagesFieldsSchema.partial()

export type Pages = z.infer<typeof pagesSchema>
export type CreatePages = z.infer<typeof createPagesSchema>
export type UpdatePages = z.infer<typeof updatePagesSchema>