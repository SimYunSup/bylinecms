// TODO: complete the migration to Zod v4 and remove this comment
import type { ZodDate, ZodEffects } from 'zod/'
import { z } from 'zod/v4'
import type { CollectionDefinition, DateTimeField, Field, TextField, ValidationRule } from '../../@types/index.js'
import { getCollectionDefinition } from '../../collections/registry.js'

// Helper function to apply custom validation rules
const applyValidationRules = (schema: z.ZodType, rules: ValidationRule[]): z.ZodType => {
  return rules.reduce((acc, rule) => {
    switch (rule.type) {
      case 'email':
        return (acc as z.ZodEmail).describe(rule.message || 'Invalid email address')
      case 'url':
        return (acc as z.ZodURL).describe(rule.message || 'Invalid URL')
      case 'pattern':
        return (acc as z.ZodString).regex(new RegExp(rule.value), rule.message)
      case 'custom':
        return acc.refine(rule.value, { message: rule.message })
      default:
        return acc
    }
  }, schema)
}

// Helper function to apply text field validation
const applyTextValidation = (schema: z.ZodString, field: TextField): z.ZodString => {
  let validatedSchema = schema

  if (field.validation?.minLength) {
    validatedSchema = validatedSchema.min(field.validation.minLength)
  }

  if (field.validation?.maxLength) {
    validatedSchema = validatedSchema.max(field.validation.maxLength)
  }

  if (field.validation?.pattern) {
    validatedSchema = validatedSchema.regex(new RegExp(field.validation.pattern))
  }

  return validatedSchema
}

// Helper function to apply datetime validation
const applyDateTimeValidation = (schema: ZodEffects<ZodDate, Date, unknown>, field: DateTimeField): ZodEffects<ZodDate, Date, unknown> => {
  // TODO: Implement specific datetime validation if needed
  let validatedSchema = schema
  return validatedSchema as ZodEffects<ZodDate, Date, unknown>
}

// Convert a single field to a Zod schema
export const fieldToZodSchema = (field: Field): z.ZodType => {
  let schema: z.ZodType

  switch (field.type) {
    case 'text': {
      let textSchema = z.string()
      textSchema = applyTextValidation(textSchema, field)

      if (field.validation?.rules) {
        textSchema = applyValidationRules(textSchema, field.validation.rules) as z.ZodString
      }

      schema = textSchema
      break
    }

    case 'checkbox':
      schema = z.boolean()
      break

    case 'select':
      if (field.options && field.options.length > 0) {
        const values = field.options.map(opt => opt.value) as [string, ...string[]]
        schema = z.enum(values)
      } else {
        schema = z.string()
      }
      break

    case 'datetime': {
      let dateSchema = z.preprocess(
        (val) => (val === '' || val == null) ? null : val,
        z.coerce.date()
      )
      // TODO: Implement specific datetime validation if needed
      // dateSchema = applyDateTimeValidation(dateTimeSchema, field)
      schema = dateSchema
      break
    }

    case 'richtext': {
      let richTextSchema = z.any()
      // TODO: Implement rich text validation if needed
      // if (field.validation?.minLength || field.validation?.maxLength) {
      //   // Convert to string for validation if needed
      //   richTextSchema = z.string()
      //   if (field.validation.minLength) {
      //     richTextSchema = (richTextSchema as z.ZodString).min(field.validation.minLength)
      //   }
      //   if (field.validation.maxLength) {
      //     richTextSchema = (richTextSchema as z.ZodString).max(field.validation.maxLength)
      //   }
      // }

      schema = richTextSchema
      break
    }

    default:
      schema = z.string()
  }

  return field.required ? schema : schema.nullable().optional()
}

// Create the base schema that all collections share
export const createBaseSchema = () => z.object({
  id: z.uuid(),
  vid: z.number().int().positive(),
  status: z.enum(['draft', 'published', 'archived']),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

// Create field schemas for a collection
export const createFieldsSchema = (fields: Field[]) => {
  const fieldsSchemaShape: Record<string, z.ZodType> = {}

  for (const field of fields) {
    fieldsSchemaShape[field.name] = fieldToZodSchema(field)
  }

  return z.object(fieldsSchemaShape)
}

// Create pagination/list metadata schema
export const createListMetaSchema = () => z.object({
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().positive(),
})

// Create collection metadata schema
export const createCollectionMetaSchema = (collection: CollectionDefinition) => z.object({
  name: z.literal(collection.name),
  path: z.literal(collection.path),
})

// Helper function to get collection definition before calling createCollectionSchemas  
export const createCollectionSchemasForPath = (path: string) => {
  const collectionDefinition = getCollectionDefinition(path)
  if (collectionDefinition == null) {
    throw new Error(`Collection not found for path: ${path}`)
  }
  return createCollectionSchemas(collectionDefinition)
}

// Main function to create all schemas for a collection
export const createCollectionSchemas = (collection: CollectionDefinition) => {
  const baseSchema = createBaseSchema()
  const fieldsSchema = createFieldsSchema(collection.fields)
  const fullSchema = z.object({
    ...baseSchema.shape,
    ...fieldsSchema.shape
  })

  return {
    base: baseSchema,
    fields: fieldsSchema,
    full: fullSchema,
    list: z.object({
      records: z.array(fullSchema),
      meta: createListMetaSchema(),
      included: z.object({
        collection: createCollectionMetaSchema(collection),
      }),
    }),
    create: fieldsSchema,
    get: fullSchema,
    update: fieldsSchema.partial(),
  }
}

// Aliases for consistency
export const createTypedCollectionSchemas = createCollectionSchemas
export const createTypedCollectionSchemasForPath = createCollectionSchemasForPath