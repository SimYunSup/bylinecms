// NOTE: This file has been auto-generated - do not edit.

import { pgTable, text, boolean, uuid, json, timestamp, integer } from 'drizzle-orm/pg-core'

import { statusEnum } from './status.js'

export const pages = pgTable('pages', {
  // Base schema fields
  id: uuid('id').primaryKey(),
  vid: integer('vid').notNull().default(1),
  status: statusEnum().default('draft'),
  created_at: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }).defaultNow(),

  // Collection-specific fields
  title: text('title').notNull(),
  category: text('category'),
  content: json('content').notNull(),
  publishedOn: timestamp('publishedOn', { withTimezone: true }).notNull(),
  featured: boolean('featured'),
})

export type PagesRecord = typeof pages.$inferSelect
export type NewPagesRecord = typeof pages.$inferInsert