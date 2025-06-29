// NOTE: Before you dunk on this, this is a totally naïve and "weekend hack"
// implementation of a schema generator used only for prototype development.
// If we're using Drizzle, then there's almost certainly a better way to do this.

//@ts-ignore
import fs from 'node:fs'
//@ts-ignore
import path from 'node:path'
//@ts-ignore
import { fileURLToPath } from 'node:url'
import { getAllCollections } from '../collections/registry.js'
import { generateDrizzleSchema } from './generators/drizzle-generator.js'
import { generateZodSchema } from './generators/zod-generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateSchemas() {
  const collections = getAllCollections()

  // Ensure directories exist
  const drizzleSchemasDir = path.join(__dirname, '../outputs/drizzle-schemas')
  const zodTypesDir = path.join(__dirname, '../outputs/zod-types')

  if (!fs.existsSync(drizzleSchemasDir)) {
    fs.mkdirSync(drizzleSchemasDir, { recursive: true })
  }

  if (!fs.existsSync(zodTypesDir)) {
    fs.mkdirSync(zodTypesDir, { recursive: true })
  }

  // Generate schemas for each collection
  for (const collection of collections) {
    console.log(`Generating schemas for ${collection.name}...`)

    // Generate Drizzle schema
    const drizzleSchema = generateDrizzleSchema(collection)
    fs.writeFileSync(
      path.join(drizzleSchemasDir, `${collection.path}.ts`),
      drizzleSchema
    )

    // Generate Zod types
    const zodTypes = generateZodSchema(collection)
    fs.writeFileSync(
      path.join(zodTypesDir, `${collection.path}.ts`),
      zodTypes
    )
  }

  // Generate index files
  generateIndexFiles(collections, drizzleSchemasDir, zodTypesDir)

  console.log('Drizzled schema and zod types generation complete!')
}

function generateIndexFiles(collections: any[], drizzleSchemasDir: string, zodTypesDir: string) {
  // Database schema index
  const schemaIndexLines = [
    '// NOTE: This file has been auto-generated - do not edit.',
    '',
    ...collections.map(c => `export * from './${c.path}'`),
    '',
    ...collections.map(c => `import { ${c.path} } from './${c.path}'`),
    '',
    '// Re-export all tables for convenience',
    'export const tables = {',
    ...collections.map(c => `  ${c.path}: ${c.path},`),
    '}',
  ]

  fs.writeFileSync(
    path.join(drizzleSchemasDir, 'index.ts'),
    schemaIndexLines.join('\n')
  )

  // Zod types index with registries
  const zodTypesIndexLines = [
    '// NOTE: This file has been auto-generated - do not edit.',
    '',
    ...collections.map(c => `import { ${c.path}ListSchema, ${c.path}CreateSchema, ${c.path}GetSchema, ${c.path}UpdateSchema } from './${c.path}'`),
    ...collections.map(c => `import type { ${capitalize(c.name)}, ${capitalize(c.name)}List, Create${capitalize(c.name)}, ${capitalize(c.name)}Get, Update${capitalize(c.name)} } from './${c.path}'`),
    '',
    ...collections.map(c => `export * from './${c.path}'`),
    '// Schema registries for dynamic lookup',
    '',
    'export const listSchemas = {',
    ...collections.map(c => `  ${c.path}: ${c.path}ListSchema,`),
    '}',
    '',
    'export const createSchemas = {',
    ...collections.map(c => `  ${c.path}: ${c.path}CreateSchema,`),
    '}',
    'export const getSchemas = {',
    ...collections.map(c => `  ${c.path}: ${c.path}GetSchema,`),
    '}',
    '',
    'export const updateSchemas = {',
    ...collections.map(c => `  ${c.path}: ${c.path}UpdateSchema,`),
    '}',
    '// Type registries for runtime type access',
    'export type Types = {',
    ...collections.map(c => `  ${c.path}: ${capitalize(c.name)},`),
    '}',
    '',
    'export type ListTypes = {',
    ...collections.map(c => `  ${c.path}: ${capitalize(c.name)}List,`),
    '}',
    '',
    'export type CreateTypes = {',
    ...collections.map(c => `  ${c.path}: Create${capitalize(c.name)},`),
    '}',
    'export type GetTypes = {',
    ...collections.map(c => `  ${c.path}: ${capitalize(c.name)}Get,`),
    '}',
    '',
    'export type UpdateTypes = {',
    ...collections.map(c => `  ${c.path}: Update${capitalize(c.name)},`),
    '}',
  ]

  fs.writeFileSync(
    path.join(zodTypesDir, 'index.ts'),
    zodTypesIndexLines.join('\n')
  )
}

generateSchemas().catch(console.error)

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
