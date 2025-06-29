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

export const pagesCreateSchema = pagesFieldsSchema
export const pagesUpdateSchema = pagesFieldsSchema.partial()

// List schema with pagination and metadata
export const pagesListSchema = z.object({
  records: z.array(pagesSchema),
  meta: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().positive(),
  }),
  included: z.object({
    collection: z.literal('Pages'),
    path: z.literal('pages'),
  }),
})

// Get schema (individual item)
export const pagesGetSchema = pagesSchema

export type Pages = z.infer<typeof pagesSchema>
export type PagesList = z.infer<typeof pagesListSchema>
export type PagesGet = z.infer<typeof pagesGetSchema>
export type CreatePages = z.infer<typeof pagesCreateSchema>
export type UpdatePages = z.infer<typeof pagesUpdateSchema>