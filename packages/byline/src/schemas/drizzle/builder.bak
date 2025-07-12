import { boolean, integer, json, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { CollectionDefinition, Field } from '../../@types/index.js'

export const statusEnum = pgEnum('status', ['draft', 'published', 'archived']);

const createBaseColumns = () => ({
  id: uuid('id').primaryKey(),
  vid: integer('vid').notNull().default(1),
  status: statusEnum().default('draft'),
  created_at: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }).defaultNow(),
})

const createFieldColumn = (field: Field) => {
  switch (field.type) {
    case 'text':
      return field.required ? text(field.name).notNull() : text(field.name)
    case 'checkbox':
      return boolean(field.name)
    case 'select':
      return field.required ? text(field.name).notNull() : text(field.name)
    case 'datetime':
      return field.required
        ? timestamp(field.name, { withTimezone: true }).notNull()
        : timestamp(field.name, { withTimezone: true })
    case 'richtext':
      return field.required ? json(field.name).notNull() : json(field.name)
    default: {
      const exhaustiveCheck: never = field
      throw new Error(`Unhandled field type: ${JSON.stringify(exhaustiveCheck)}`)
    }
  }
}

export const createTableSchema = (collection: CollectionDefinition) => {
  const baseColumns = createBaseColumns()
  const fieldColumns = collection.fields.reduce((acc, field) => {
    acc[field.name] = createFieldColumn(field)
    return acc
  }, {} as Record<string, any>)

  return pgTable(collection.path, {
    ...baseColumns,
    ...fieldColumns,
  })
}

export const createAllTableSchemas = (collections: CollectionDefinition[]) => {
  const schemas: Record<string, any> = {}
  for (const collection of collections) {
    schemas[collection.path] = createTableSchema(collection)
  }
  return schemas
}