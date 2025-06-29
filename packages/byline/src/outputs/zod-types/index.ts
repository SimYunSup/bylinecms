// NOTE: This file has been auto-generated - do not edit.

import { pagesListSchema, pagesCreateSchema, pagesGetSchema, pagesUpdateSchema } from './pages'
import type { Pages, PagesList, CreatePages, PagesGet, UpdatePages } from './pages'

export * from './pages'
// Schema registries for dynamic lookup

export const listSchemas = {
  pages: pagesListSchema,
}

export const createSchemas = {
  pages: pagesCreateSchema,
}
export const getSchemas = {
  pages: pagesGetSchema,
}

export const updateSchemas = {
  pages: pagesUpdateSchema,
}
// Type registries for runtime type access
export type Types = {
  pages: Pages,
}

export type ListTypes = {
  pages: PagesList,
}

export type CreateTypes = {
  pages: CreatePages,
}
export type GetTypes = {
  pages: PagesGet,
}

export type UpdateTypes = {
  pages: UpdatePages,
}