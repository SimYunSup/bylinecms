// NOTE: This file has been auto-generated - do not edit.

import { z } from 'zod'

const baseSchema = z.object({
  id: z.string().uuid(),
  vid: z.number().int().positive(),
  published: z.boolean().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

const newsFieldsSchema = z.object({
  title: z.string(),
  content: z.any(),
  publishedOn: z.coerce.date().optional(),
})

export const newsSchema = baseSchema.merge(newsFieldsSchema)

export const newsCreateSchema = newsFieldsSchema
export const newsUpdateSchema = newsFieldsSchema.partial()

// List schema with pagination and metadata
export const newsListSchema = z.object({
  records: z.array(newsSchema),
  meta: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().positive(),
  }),
  included: z.object({
    collection: z.object({
      name: z.literal('News'),
      path: z.literal('news'),
    }),
  }),
})

// Get schema (individual item)
export const newsGetSchema = newsSchema

export type News = z.infer<typeof newsSchema>
export type NewsList = z.infer<typeof newsListSchema>
export type NewsGet = z.infer<typeof newsGetSchema>
export type CreateNews = z.infer<typeof newsCreateSchema>
export type UpdateNews = z.infer<typeof newsUpdateSchema>