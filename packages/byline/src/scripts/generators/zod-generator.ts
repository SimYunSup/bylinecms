import type { CollectionDefinition, Field } from '../../@types/index.js'

export function generateZodSchema(collection: CollectionDefinition): string {
  const lines: string[] = []

  lines.push('// NOTE: This file has been auto-generated - do not edit.')
  lines.push('')
  lines.push('import { z } from \'zod\'')
  lines.push('')

  // Base schema
  lines.push('const baseSchema = z.object({')
  lines.push('  id: z.string().uuid(),')
  lines.push('  vid: z.number().int().positive(),')
  lines.push('  published: z.boolean().nullable(),')
  lines.push('  created_at: z.string().datetime(),')
  lines.push('  updated_at: z.string().datetime(),')
  lines.push('})')
  lines.push('')

  // Collection-specific schema
  lines.push(`const ${collection.path}FieldsSchema = z.object({`)

  for (const field of collection.fields) {
    const fieldSchema = generateFieldSchema(field)
    lines.push(`  ${field.name}: ${fieldSchema},`)
  }

  lines.push('})')
  lines.push('')

  // Full schema
  lines.push(`export const ${collection.path}Schema = baseSchema.merge(${collection.path}FieldsSchema)`)
  lines.push('')

  // Create/Update schemas (without base fields) - use consistent naming
  lines.push(`export const ${collection.path}CreateSchema = ${collection.path}FieldsSchema`)
  lines.push(`export const ${collection.path}UpdateSchema = ${collection.path}FieldsSchema.partial()`)
  lines.push('')

  // Type exports
  lines.push(`export type ${capitalize(collection.name)} = z.infer<typeof ${collection.path}Schema>`)
  lines.push(`export type Create${capitalize(collection.name)} = z.infer<typeof ${collection.path}CreateSchema>`)
  lines.push(`export type Update${capitalize(collection.name)} = z.infer<typeof ${collection.path}UpdateSchema>`)

  return lines.join('\n')
}

function generateFieldSchema(field: Field): string {
  let schema = ''

  switch (field.type) {
    case 'text':
      schema = 'z.string()'
      break
    case 'checkbox':
      schema = 'z.boolean()'
      break
    case 'select':
      if ('options' in field && field.options) {
        const values = field.options.map(opt => `'${opt.value}'`).join(', ')
        schema = `z.enum([${values}])`
      } else {
        schema = 'z.string()'
      }
      break
    case 'datetime':
      schema = 'z.coerce.date()'
      break
    case 'richtext':
      schema = 'z.any()'
      break
    default:
      schema = 'z.string()'
  }

  if (!field.required) {
    schema += '.optional()'
  }

  return schema
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
