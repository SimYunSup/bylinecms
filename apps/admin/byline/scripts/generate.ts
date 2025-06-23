// NOTE: Before you dunk on this, this is a totally naïve and "weekend hack"
// implementation of a schema generator used only for prototype development.
// If we're using Drizzle, then almost certainly a better way to do this.

//@ts-ignore
import fs from 'node:fs'
//@ts-ignore
import path from 'node:path'
//@ts-ignore
import { fileURLToPath } from 'node:url'
import type { CollectionDefinition } from '~/@types'
import { Pages } from '../collections/pages.js'

function generateDrizzleSchema(collection: CollectionDefinition) {
  const lines: string[] = []
  lines.push('// NOTE: This file has been auto-generated - do not edit.')
  lines.push(`import { pgTable, text, boolean, uuid, json, timestamp, integer } from 'drizzle-orm/pg-core'`)
  lines.push(`export const ${collection.slug} = pgTable('${collection.slug}', {`)
  lines.push(`  id: uuid('id').primaryKey(),`)
  lines.push(`  vid: integer('vid').notNull().default(1),`)
  lines.push(`  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),`)
  lines.push(`  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow(),`)

  for (const field of collection.fields) {
    switch (field.type) {
      case 'text':
        lines.push(`  ${field.name}: text('${field.name}')${field.required ? '.notNull()' : ''},`)
        break
      case 'checkbox':
        lines.push(`  ${field.name}: boolean('${field.name}'),`)
        break
      case 'select':
        lines.push(`  ${field.name}: text('${field.name}')${field.required ? '.notNull()' : ''},`)
        break
      case 'richtext':
        lines.push(`  ${field.name}: json('${field.name}')${field.required ? '.notNull()' : ''},`)
        break
    }
  }

  lines.push('})')
  return lines.join('\n')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const schemaContent = generateDrizzleSchema(Pages)
fs.writeFileSync(path.join(__dirname, '../../database/schema/index.ts'), schemaContent)
