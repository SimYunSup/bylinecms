export interface Page {
  id: string;
  vid: number;
  title: string;
  published: boolean | null;
  category: string | null;
  content: unknown;
  created_at: string;
  updated_at: string;
}

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