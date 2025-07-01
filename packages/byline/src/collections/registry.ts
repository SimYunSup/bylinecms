import type { CollectionDefinition } from '../@types/index.js'
import { News } from './news.js'
import { Pages } from './pages.js'

export const collections: Record<string, CollectionDefinition> = {
  pages: Pages,
  news: News
}

export const getCollectionDefinition = (path: string): CollectionDefinition | undefined => {
  return collections[path]
}

export const getCollectionNames = (): string[] => {
  return Object.keys(collections)
}

export const getAllCollectionDefinitions = (): CollectionDefinition[] => {
  return Object.values(collections)
}
