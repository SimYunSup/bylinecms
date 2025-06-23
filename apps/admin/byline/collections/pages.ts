import type { CollectionDefinition } from '../@types'

export const Pages: CollectionDefinition = {
  name: 'Pages',
  slug: 'pages',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'published', label: 'Published', type: 'checkbox' },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
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
      required: true,
    }
  ],
}

