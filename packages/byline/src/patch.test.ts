import { describe, expect, it } from 'vitest'

import { applyPatches } from './patches/apply-patches.js'
import type { ModelCollection } from './model/model-types.js'
import type { DocumentPatch } from './patches/patch-types.js'

const DocsModelExample: ModelCollection = {
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

const DocsPatchExample: DocumentPatch[] = [
  {
    kind: 'field.set',
    path: 'title',
    value: 'Updated title via patch',
  },
]

interface DocsLike {
  title?: string
  path?: string
  summary?: string
}

describe('applyPatches', () => {
  it('applies DocsPatchExample to a simple doc object', () => {
    const original: DocsLike = {
      title: 'Original title',
      path: '/docs/original',
      summary: 'Original summary',
    }

    const { doc, errors } = applyPatches(DocsModelExample, original, DocsPatchExample)

    expect(errors).toHaveLength(0)
    const patched = doc as DocsLike

    expect(patched.title).toBe('Updated title via patch')
    expect(patched.path).toBe(original.path)
    expect(patched.summary).toBe(original.summary)
  })

  it('leaves the document unchanged when no patches are provided', () => {
    const original: DocsLike = {
      title: 'Original title',
      path: '/docs/original',
      summary: 'Original summary',
    }

    const { doc, errors } = applyPatches(DocsModelExample, original, [])

    expect(errors).toHaveLength(0)
    expect(doc).toEqual(original)
  })

  it('reports an error for unsupported patch kinds', () => {
    const original: DocsLike = {
      title: 'Original title',
    }

    const { errors } = applyPatches(DocsModelExample, original, [
      // @ts-expect-error - intentionally passing an unsupported kind to verify type narrowing behaviour
      { kind: 'unknown.kind', path: 'links' },
    ])

    expect(errors.length).toBe(1)
    expect(errors[0]?.message).toContain('Unsupported patch kind')
  })

  it('supports array.insert and array.move with stable ids', () => {
    const original = {
      reviews: [
        { id: 'a', rating: 3 },
        { id: 'b', rating: 4 },
      ],
    }

    const { doc: afterInsert, errors: insertErrors } = applyPatches(DocsModelExample, original, [
      {
        kind: 'array.insert',
        path: 'reviews',
        index: 1,
        item: { id: 'c', rating: 5 },
      },
    ])

    expect(insertErrors).toHaveLength(0)

    const inserted = afterInsert as { reviews: { id: string; rating: number }[] }
    expect(inserted.reviews.map((r) => r.id)).toEqual(['a', 'c', 'b'])

    const { doc: afterMove, errors: moveErrors } = applyPatches(DocsModelExample, inserted, [
      {
        kind: 'array.move',
        path: 'reviews',
        itemId: 'c',
        toIndex: 0,
      },
    ])

    expect(moveErrors).toHaveLength(0)
    const moved = afterMove as { reviews: { id: string; rating: number }[] }
    expect(moved.reviews.map((r) => r.id)).toEqual(['c', 'a', 'b'])
  })

  it('supports block.add and block.updateField on content blocks', () => {
    const original = {
      content: [],
    }

    const { doc: afterAdd, errors: addErrors } = applyPatches(DocsModelExample, original, [
      {
        kind: 'block.add',
        path: 'content',
        blockType: 'richTextBlock',
        initialValue: {
          richText: { ops: [{ insert: 'Hello' }] },
        },
      },
    ])

    expect(addErrors).toHaveLength(0)

    const withBlock = afterAdd as {
      content: [{ id: string; type: string; richText?: unknown }]
    }

    expect(withBlock.content).toHaveLength(1)
    const block = withBlock.content[0]
    expect(block?.type).toBe('richTextBlock')
    expect(block?.richText).toEqual({ ops: [{ insert: 'Hello' }] })

    const { doc: afterUpdate, errors: updateErrors } = applyPatches(DocsModelExample, withBlock, [
      {
        kind: 'block.updateField',
        path: 'content',
        blockId: block.id,
        fieldPath: 'constrainedWidth',
        value: true,
      },
    ])

    expect(updateErrors).toHaveLength(0)
    const updated = afterUpdate as {
      content: { id: string; type: string; constrainedWidth?: boolean }[]
    }

    expect(updated.content[0]?.constrainedWidth).toBe(true)
  })
})
