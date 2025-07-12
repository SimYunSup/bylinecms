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

    try {
      const schema = createTableSchema(collection)
      schemaCache.set(collectionPath, schema)
    } catch (error) {
      console.error(`Error creating schema for ${collectionPath}:`, error)
      throw new Error(`Failed to create schema for collection: ${collectionPath}`)
    }
  }

  return schemaCache.get(collectionPath)
}

export const getAllTableSchemas = () => {
  const collections = getAllCollectionDefinitions()
  const schemas: Record<string, any> = {}

  for (const collection of collections) {
    try {
      schemas[collection.path] = getTableSchema(collection.path)
    } catch (error) {
      console.error(`Error getting schema for ${collection.path}:`, error)
      throw error
    }
  }

  return schemas
}

export const clearSchemaCache = () => {
  schemaCache.clear()
}