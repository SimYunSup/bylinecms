import { getAllCollectionDefinitions } from '../../collections/registry.js'
import { createTableSchema } from './builder.js'

const schemaCache = new Map()

export const getTableSchema = (collectionPath: string) => {
  if (!schemaCache.has(collectionPath)) {
    const collections = getAllCollectionDefinitions()
    const collection = collections.find(c => c.path === collectionPath)

    if (!collection) {
      throw new Error(`Collection not found: ${collectionPath}`)
    }

    schemaCache.set(collectionPath, createTableSchema(collection))
  }

  return schemaCache.get(collectionPath)
}

export const getAllTableSchemas = () => {
  const collections = getAllCollectionDefinitions()
  const schemas: Record<string, any> = {}

  for (const collection of collections) {
    schemas[collection.path] = getTableSchema(collection.path)
  }

  return schemas
}