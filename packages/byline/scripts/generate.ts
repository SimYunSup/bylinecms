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

// NOTE: Before you dunk on this, this is a totally naïve and "weekend hack"
// implementation of a schema generator used only for prototype development.
// If we're using Drizzle, then there's almost certainly a better way to do this.

//@ts-ignore
import fs from 'node:fs'
//@ts-ignore
import path from 'node:path'
//@ts-ignore
import { fileURLToPath } from 'node:url'
import { getAllCollectionDefinitions } from '../src/collections/registry.js'
import { generateDrizzleSchema } from './generators/drizzle-generator.js'

// import { generateZodSchema } from './generators/zod-generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function generate() {
  const collections = getAllCollectionDefinitions()

  // Ensure directories exist
  const drizzleSchemasDir = path.join(__dirname, '../src/outputs/drizzle-schemas')

  if (!fs.existsSync(drizzleSchemasDir)) {
    fs.mkdirSync(drizzleSchemasDir, { recursive: true })
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
  }

  // Generate index files
  generateIndexFiles(collections, drizzleSchemasDir)

  console.log('Drizzled schema generation complete!')
}

function generateIndexFiles(collections, drizzleSchemasDir) {
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
}

generate().catch(console.error)

