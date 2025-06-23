// NOTE: This file has been auto-generated - do not edit.
import { pgTable, text, boolean, uuid, json, timestamp, integer } from 'drizzle-orm/pg-core'
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey(),
  vid: integer('vid').notNull().default(1),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow(),
  title: text('title').notNull(),
  published: boolean('published'),
  category: text('category'),
  content: json('content').notNull(),
})