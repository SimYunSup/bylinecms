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

