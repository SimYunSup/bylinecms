import type { Page } from '~/collections/pages'

export interface PagesResponse {
  pages: Page[] | null
  meta: {
    page: number
    page_size: number
    total: number
    total_pages: number
    query: string
    order: string
    desc: boolean
  }
}