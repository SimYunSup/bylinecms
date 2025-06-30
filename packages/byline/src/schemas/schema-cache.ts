import type { CollectionDefinition } from '../@types/index.js'
import { getCollectionDefinition } from '../collections/registry.js'
import { createCollectionSchemas } from './schema-builder.js'

type SchemaSet = ReturnType<typeof createCollectionSchemas>

const schemaCache = new Map<string, SchemaSet>()

export const getCollectionSchemasForPath = (path: string): SchemaSet => {
  const collectionDefinition = getCollectionDefinition(path)
  if (collectionDefinition == null) {
    throw new Error(`Collection not found for path: ${path}`)
  }
  return getCollectionSchemas(collectionDefinition)
}

// Get schemas for a collection (with caching)
export const getCollectionSchemas = (collection: CollectionDefinition): SchemaSet => {
  const cacheKey = collection.path

  if (schemaCache.has(cacheKey) === false) {
    schemaCache.set(cacheKey, createCollectionSchemas(collection))
  }

  return schemaCache.get(cacheKey) || createCollectionSchemas(collection)
}

// Clear cache for a specific collection or all collections
export const clearSchemaCache = (collectionPath?: string): void => {
  if (collectionPath) {
    for (const key of schemaCache.keys()) {
      if (key === collectionPath) {
        schemaCache.delete(key)
      }
    }
  } else {
    schemaCache.clear()
  }
}

// Get cache statistics
export const getCacheStats = () => ({
  size: schemaCache.size,
  keys: Array.from(schemaCache.keys()),
})