import { defineConfig } from '@byline/byline';
import { Docs } from '@/collections/docs.js';
import { News } from '@/collections/news.js';
import { Pages } from '@/collections/pages.js';

defineConfig({
  serverURL: 'http://localhost:5173/',
  i18n: {
    interface: {
      defaultLocale: 'en',
      locales: ['en', 'es']
    },
    content: {
      defaultLocale: 'en',
      locales: ['en', 'es']
    },
  },
  collections: [
    Docs,
    News,
    Pages
  ],
})
