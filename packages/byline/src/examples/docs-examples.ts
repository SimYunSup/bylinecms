// Example model and layout definitions for the Docs collection.
// These are design-time examples and not yet wired into runtime.

import type { LayoutCollection } from '../layout/layout-types.js'
import type { ModelCollection } from '../model/model-types.js'

export const DocsModelExample: ModelCollection = {
  id: 'docs',
  path: 'docs',
  label: 'Documents',
  fields: [
    { id: 'path', label: 'Path', kind: 'scalar', scalarType: 'string', required: true },
    { id: 'title', label: 'Title', kind: 'scalar', scalarType: 'string', required: true },
    { id: 'summary', label: 'Summary', kind: 'scalar', scalarType: 'text', localized: true },
    {
      id: 'publishedOn',
      label: 'Published On',
      kind: 'scalar',
      scalarType: 'datetime',
      required: true,
    },
    {
      id: 'featured',
      label: 'Featured',
      kind: 'scalar',
      scalarType: 'boolean',
    },
    {
      id: 'content',
      label: 'Content',
      kind: 'blocks',
      typeDiscriminator: 'type',
      blocks: [
        {
          type: 'richTextBlock',
          label: 'Richtext Block',
          fields: [
            {
              id: 'richText',
              label: 'Richtext',
              kind: 'scalar',
              scalarType: 'json',
            },
            {
              id: 'constrainedWidth',
              label: 'Constrained Width',
              kind: 'scalar',
              scalarType: 'boolean',
            },
          ],
        },
        {
          type: 'photoBlock',
          label: 'Photo Block',
          fields: [
            { id: 'display', label: 'Display', kind: 'scalar', scalarType: 'string' },
            { id: 'photo', label: 'Photo', kind: 'scalar', scalarType: 'json' },
            { id: 'alt', label: 'Alt', kind: 'scalar', scalarType: 'string' },
            { id: 'caption', label: 'Caption', kind: 'scalar', scalarType: 'json' },
          ],
        },
      ],
    },
    {
      id: 'reviews',
      label: 'Reviews',
      kind: 'array',
      item: {
        id: 'reviewItem',
        label: 'Review Item',
        kind: 'object',
        fields: [
          { id: 'rating', label: 'Rating', kind: 'scalar', scalarType: 'integer' },
          { id: 'comment', label: 'Comments', kind: 'scalar', scalarType: 'json' },
        ],
      },
    },
    {
      id: 'links',
      label: 'Links',
      kind: 'array',
      item: {
        id: 'linkItem',
        label: 'Link',
        kind: 'object',
        fields: [{ id: 'link', label: 'Link', kind: 'scalar', scalarType: 'string' }],
      },
    },
  ],
}

export const DocsLayoutExample: LayoutCollection = {
  id: 'docs',
  tabs: [
    {
      id: 'details',
      label: 'Details',
      sections: [
        {
          kind: 'section',
          id: 'main-details',
          fields: [
            {
              kind: 'row',
              id: 'title-row',
              fields: [{ target: 'title' }, { target: 'path' }],
            },
            { target: 'summary' },
          ],
        },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      sections: [
        {
          kind: 'section',
          id: 'content-section',
          fields: [{ target: 'content' }],
        },
      ],
    },
    {
      id: 'meta',
      label: 'Meta',
      sections: [
        {
          kind: 'section',
          id: 'meta-section',
          fields: [
            { target: 'publishedOn' },
            { target: 'featured' },
            { target: 'reviews' },
            { target: 'links' },
          ],
        },
      ],
    },
  ],
  blocks: [
    {
      target: 'content',
      allowedBlockTypes: ['richTextBlock', 'photoBlock'],
    },
  ],
}
