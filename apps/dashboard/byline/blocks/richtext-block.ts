import type { BlockField } from '@byline/core'

export const RichTextBlock: BlockField = {
  name: 'richTextBlock',
  label: 'Richtext Block',
  type: 'block',
  fields: [
    {
      name: 'richText',
      label: 'Richtext',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'constrainedWidth',
      label: 'Constrained Width',
      type: 'checkbox',
      required: false,
    },
  ],
}
