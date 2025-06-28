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
  const schemaDir = path.join(__dirname, '../outputs/schema')
  const validationDir = path.join(__dirname, '../outputs/validation')

  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true })
  }

  if (!fs.existsSync(validationDir)) {
    fs.mkdirSync(validationDir, { recursive: true })
  }

  // Generate schemas for each collection
  for (const collection of collections) {
    console.log(`Generating schemas for ${collection.name}...`)

    // Generate Drizzle schema
    const drizzleSchema = generateDrizzleSchema(collection)
    fs.writeFileSync(
      path.join(schemaDir, `${collection.path}.ts`),
      drizzleSchema
    )

    // Generate Zod schema
    const zodSchema = generateZodSchema(collection)
    fs.writeFileSync(
      path.join(validationDir, `${collection.path}.ts`),
      zodSchema
    )
  }

  // Generate index files
  generateIndexFiles(collections, schemaDir, validationDir)

  console.log('Schema generation complete!')
}

function generateIndexFiles(collections: any[], schemaDir: string, validationDir: string) {
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
    path.join(schemaDir, 'index.ts'),
    schemaIndexLines.join('\n')
  )

  // Validation schema index
  const validationIndexLines = [
    '// NOTE: This file has been auto-generated - do not edit.',
    '',
    ...collections.map(c => `export * from './${c.path}'`),
  ]

  fs.writeFileSync(
    path.join(validationDir, 'index.ts'),
    validationIndexLines.join('\n')
  )
}

generateSchemas().catch(console.error)
