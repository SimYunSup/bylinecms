/**
 * Byline CMS
 *
 * Copyright © 2025 Anthony Bouch and contributors.
 *
 * This file is part of Byline CMS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { BaseSchema, CollectionDefinition } from '../@types'

// Hard coded for now. Will generate from collection definition soon.
export interface Page extends BaseSchema {
  title: string;
  category: string | null;
  content: unknown;
}

export const Pages: CollectionDefinition = {
  name: 'Pages',
  path: 'pages',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      helpText: 'Select a category for this page',
      options: [
        { label: 'Foo', value: 'foo' },
        { label: 'Bar', value: 'bar' },
        { label: 'Baz', value: 'baz' },
      ],
    },
    {
      name: 'content',
      label: 'Content',
      type: 'richtext',
      helpText: 'Enter the main content for this page.',
      required: true,
    },
    { name: 'publishedOn', label: 'Published On', type: 'datetime', mode: 'date', admin: { position: 'sidebar' } },
    { name: 'featured', label: 'Featured', type: 'checkbox', helpText: 'Is this page featured on the home page?', admin: { position: 'sidebar' } },
  ],
}

