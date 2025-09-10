import type { ClientConfig } from '@byline/core'
import { defineClientConfig } from '@byline/core'

import { Docs } from './byline/collections/docs.js'
import { News } from './byline/collections/news.js'
import { Pages } from './byline/collections/pages.js'

export const config: ClientConfig = {
  serverURL: 'http://localhost:5173/',
  i18n: {
    interface: {
      defaultLocale: 'en',
      locales: ['en', 'es'],
    },
    content: {
      defaultLocale: 'en',
      locales: ['en', 'es'],
    },
  },
  collections: [Docs, News, Pages],
}

defineClientConfig(config)
