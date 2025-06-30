import { boolean, integer, json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { CollectionDefinition, Field } from '../../@types/index.js'

const createBaseColumns = () => ({
  id: uuid('id').primaryKey(),
  vid: integer('vid').notNull().default(1),
  published: boolean('published').default(false),
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