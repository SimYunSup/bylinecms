/**
 * Byline CMS
 *
 * Copyright © 2025 Anthony Bouch and contributors.
 *
 * This file is part of Byline CMS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { CollectionDefinition, Field } from '../../src/@types/index.js'

export function generateDrizzleSchema(collection: CollectionDefinition): string {
  const lines: string[] = []

  lines.push('// NOTE: This file has been auto-generated - do not edit.')
  lines.push('')
  lines.push('import { pgTable, text, boolean, uuid, json, timestamp, integer } from \'drizzle-orm/pg-core\'')
  lines.push('')
  lines.push('import { statusEnum } from \'./status.js\'')
  lines.push('')
  lines.push(`export const ${collection.path} = pgTable('${collection.path}', {`)
  lines.push('  // Base schema fields')

  // Generate base field definitions
  lines.push('  id: uuid(\'id\').primaryKey(),')
  lines.push('  vid: integer(\'vid\').notNull().default(1),')
  lines.push('  status: statusEnum().default(\'draft\'),')
  lines.push('  created_at: timestamp(\'created_at\', { precision: 6, withTimezone: true }).defaultNow(),')
  lines.push('  updated_at: timestamp(\'updated_at\', { precision: 6, withTimezone: true }).defaultNow(),')
  lines.push('')
  lines.push('  // Collection-specific fields')

  // Generate field definitions
  for (const field of collection.fields) {
    const columnCode = generateColumnCode(field)
    lines.push(`  ${field.name}: ${columnCode},`)
  }

  lines.push('})')
  lines.push('')

  // Generate TypeScript types
  lines.push(`export type ${capitalize(collection.name)}Record = typeof ${collection.path}.$inferSelect`)
  lines.push(`export type New${capitalize(collection.name)}Record = typeof ${collection.path}.$inferInsert`)

  return lines.join('\n')
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function generateColumnCode(field: Field): string {
  const nullable = field.required ? '.notNull()' : ''

  switch (field.type) {
    case 'text':
      return `text('${field.name}')${nullable}`
    case 'checkbox':
      return `boolean('${field.name}')`
    case 'select':
      return `text('${field.name}')${nullable}`
    case 'datetime':
      return `timestamp('${field.name}', { withTimezone: true })${nullable}`
    case 'richtext':
      return `json('${field.name}')${nullable}`
    default: {
      // Exhaustive check - this should never be reached if Field type is properly defined
      const exhaustiveCheck: never = field
      throw new Error(`Unhandled field type: ${JSON.stringify(exhaustiveCheck)}`)
    }
  }
}
