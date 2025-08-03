import { defineConfig } from '@byline/core';
import { Docs } from './byline/collections/docs.js';
import { News } from './byline/collections/news.js';
import { Pages } from './byline/collections/pages.js';

import { pgAdapter } from '@byline/db-postgres'


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
  db: pgAdapter({
    connectionString: process.env.DB_CONNECTION_STRING || '',
  }),
})
