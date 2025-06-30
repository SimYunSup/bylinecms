// NOTE: This file has been auto-generated - do not edit.

import { pgTable, text, boolean, uuid, json, timestamp, integer } from 'drizzle-orm/pg-core'

import { statusEnum } from './status.js'

export const news = pgTable('news', {
  // Base schema fields
  id: uuid('id').primaryKey(),
  vid: integer('vid').notNull().default(1),
  status: statusEnum().default('draft'),
  created_at: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }).defaultNow(),

  // Collection-specific fields
  title: text('title').notNull(),
  content: json('content').notNull(),
  publishedOn: timestamp('publishedOn', { withTimezone: true }),
})

export type NewsRecord = typeof news.$inferSelect
export type NewNewsRecord = typeof news.$inferInsert