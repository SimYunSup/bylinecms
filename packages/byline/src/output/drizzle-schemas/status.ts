import { boolean, integer, json, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const statusEnum = pgEnum('status', ['draft', 'published', 'archived']);