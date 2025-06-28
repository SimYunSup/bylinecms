import type { CollectionDefinition } from '../@types/index.js'
import { Pages } from './pages.js'

export const collections: Record<string, CollectionDefinition> = {
  pages: Pages,
}

export const getCollection = (name: string): CollectionDefinition | undefined => {
  return collections[name]
}

export const getCollectionNames = (): string[] => {
  return Object.keys(collections)
}

export const getAllCollections = (): CollectionDefinition[] => {
  return Object.values(collections)
}
