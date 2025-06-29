// NOTE: This file has been auto-generated - do not edit.

import type { CreateNews, News, NewsGet, NewsList, UpdateNews } from './news'
import { newsListSchema, newsCreateSchema, newsGetSchema, newsUpdateSchema } from './news'
import type { Pages, PagesList, CreatePages, PagesGet, UpdatePages } from './pages'
import { pagesCreateSchema, pagesGetSchema, pagesListSchema, pagesUpdateSchema } from './pages'

export * from './news'
export * from './pages'
// Schema registries for dynamic lookup

export const listSchemas = {
  pages: pagesListSchema,
  news: newsListSchema,
}

export const createSchemas = {
  pages: pagesCreateSchema,
  news: newsCreateSchema,
}
export const getSchemas = {
  pages: pagesGetSchema,
  news: newsGetSchema,
}

export const updateSchemas = {
  pages: pagesUpdateSchema,
  news: newsUpdateSchema,
}
// Type registries for runtime type access
export type Types = {
  pages: Pages,
  news: News,
}

export type ListTypes = {
  pages: PagesList,
  news: NewsList,
}

export type CreateTypes = {
  pages: CreatePages,
  news: CreateNews,
}
export type GetTypes = {
  pages: PagesGet,
  news: NewsGet,
}

export type UpdateTypes = {
  pages: UpdatePages,
  news: UpdateNews,
}