import { defineConfig } from '@byline/byline';
import { Docs } from '~/collections/docs';
import { News } from '~/collections/news';
import { Pages } from '~/collections/pages';

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
