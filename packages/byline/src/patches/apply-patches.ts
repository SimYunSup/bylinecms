// Core implementation of the patch engine

import type { ModelCollection, ModelField } from '../model/model-types.js'
import type {
  ApplyPatchesResult,
  ArrayPatch,
  BlockPatch,
  DocumentPatch,
  FieldPatch,
  FieldSetPatch,
  PatchPath,
} from './patch-types.js'

interface PathSegmentField {
  kind: 'field'
  key: string
}

interface PathSegmentIndex {
  kind: 'index'
  index: number
}

interface PathSegmentId {
  kind: 'id'
  id: string
}

type PathSegment = PathSegmentField | PathSegmentIndex | PathSegmentId

// Very small path grammar:
// - "foo.bar" -> [{field: 'foo'}, {field: 'bar'}]
// - "reviews[0].rating" -> [{field: 'reviews'}, {index: 0}, {field: 'rating'}]
// - "reviews[id=abc].rating" -> [{field: 'reviews'}, {id: 'abc'}, {field: 'rating'}]
// - "content[id=xyz]" -> [{field: 'content'}, {id: 'xyz'}]
export function parsePatchPath(path: PatchPath): PathSegment[] {
  if (!path) return []

  const segments: PathSegment[] = []
  const parts = String(path).split('.')

  for (const part of parts) {
    const fieldMatch = part.match(/^([^[]+)/)
    if (!fieldMatch) {
      continue
    }
    const field = fieldMatch[1]!
    segments.push({ kind: 'field', key: field })

    const bracketRegex = /\[([^\]]+)\]/g
    let match: RegExpExecArray | null
    // Biome: avoid assignment in the while condition
    // eslint-disable-next-line no-constant-condition
    while (true) {
      match = bracketRegex.exec(part)
      if (match === null) break

      const token = match[1]!
      if (/^\d+$/.test(token)) {
        segments.push({ kind: 'index', index: Number.parseInt(token, 10) })
      } else if (token.startsWith('id=')) {
        segments.push({ kind: 'id', id: token.slice(3) })
      }
    }
  }

  return segments
}

// Very small, best-effort resolver that walks the ModelCollection to find the
// field targeted by a patch path. This is intentionally conservative and
// currently only understands top-level fields and simple nested array fields.
export function resolveModelFieldForPath(
  model: ModelCollection | null | undefined,
  path: PatchPath
): ModelField | null {
  if (!model || !path) return null

  const segments = parsePatchPath(path)
  if (segments.length === 0) return null

  // Only attempt to resolve simple field paths of the form
  // "field", "field.subField", or "arrayField[0].subField" for now.
  const [first, ...rest] = segments
  if (!first || first.kind !== 'field') return null

  let current: ModelField | undefined = model.fields.find((f) => f.id === first.key)
  if (!current) return null

  // Walk remaining segments in a very small subset of the full grammar.
  for (const segment of rest) {
    if (!current) return null

    if (segment.kind === 'index') {
      // Index segments only make sense on array fields; we just step into the item.
      if (current.kind !== 'array') return null
      current = current.item
    } else if (segment.kind === 'field') {
      if (current.kind === 'object') {
        current = current.fields.find((f) => f.id === segment.key)
      } else {
        // For now we don't attempt to resolve arbitrary nested structures under
        // non-object fields.
        return null
      }
    } else if (segment.kind === 'id') {
      // Block unions and id-addressed arrays are not yet model-resolved here.
      return null
    }
  }

  return current ?? null
}

function getBySegments(
  root: any,
  segments: PathSegment[]
): { parent: any; key: string | number | null } {
  let current = root
  let parent: any = null
  let key: string | number | null = null

  for (const segment of segments) {
    parent = current
    if (parent == null) {
      break
    }

    if (segment.kind === 'field') {
      key = segment.key
      current = parent[key]
    } else if (segment.kind === 'index') {
      if (!Array.isArray(parent)) {
        throw new Error(`Expected array when resolving index segment in path`)
      }
      key = segment.index
      current = parent[segment.index]
    } else if (segment.kind === 'id') {
      if (!Array.isArray(parent)) {
        throw new Error(`Expected array when resolving id segment in path`)
      }
      const foundIndex = parent.findIndex((item: any) => item && item.id === segment.id)
      if (foundIndex === -1) {
        throw new Error(`Item with id=${segment.id} not found in array`)
      }
      key = foundIndex
      current = parent[foundIndex]
    }
  }

  return { parent, key }
}

function ensurePath(
  root: any,
  segments: PathSegment[]
): { parent: any; key: string | number | null } {
  if (segments.length === 0) {
    return { parent: root, key: null }
  }

  let current = root
  let parent: any = null
  let key: string | number | null = null

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!
    const next = segments[i + 1]
    parent = current

    if (segment.kind === 'field') {
      key = segment.key
      if (parent == null) {
        throw new Error('ensurePath encountered null/undefined parent before field segment')
      }

      // If this field is followed by an index/id segment, it represents
      // an array-like field (e.g. "content[0]", "reviews[id=...]"),
      // so initialise it as [] when missing. Otherwise initialise as {}.
      const isArrayLikeNext = next && (next.kind === 'index' || next.kind === 'id')
      if (parent[key] === undefined || parent[key] === null) {
        parent[key] = isArrayLikeNext ? [] : {}
      }
      current = parent[key]
    } else if (segment.kind === 'index') {
      if (parent == null) {
        throw new Error('ensurePath encountered null/undefined parent before index segment')
      }
      if (!Array.isArray(parent)) {
        throw new Error('ensurePath expected array parent for index segment')
      }
      key = segment.index
      if (parent[key] === undefined || parent[key] === null) {
        parent[key] = {}
      }
      current = parent[key]
    } else if (segment.kind === 'id') {
      if (parent == null) {
        throw new Error('ensurePath encountered null/undefined parent before id segment')
      }
      if (!Array.isArray(parent)) {
        throw new Error('ensurePath expected array parent for id segment')
      }
      let idx = parent.findIndex((item: any) => item && item.id === segment.id)
      if (idx === -1) {
        idx = parent.length
        parent.push({ id: segment.id })
      }
      key = idx
      current = parent[idx]
    }
  }

  return { parent, key }
}

function applyFieldPatch(doc: any, patch: FieldPatch) {
  const segments = parsePatchPath(patch.path)
  if (segments.length === 0) {
    throw new Error('Empty path for field patch')
  }

  if (patch.kind === 'field.set') {
    const { parent, key } = ensurePath(doc, segments)
    if (key === null) throw new Error('Invalid target for field.set')
    ;(parent as any)[key] = patch.value
  } else if (patch.kind === 'field.clear') {
    const { parent, key } = getBySegments(doc, segments)
    if (parent && key !== null && Object.hasOwn(parent, key)) {
      if (Array.isArray(parent) && typeof key === 'number') {
        parent.splice(key, 1)
      } else {
        delete (parent as any)[key]
      }
    }
  }
}

function resolveArrayAtPath(doc: any, path: PatchPath): any[] {
  const segments = parsePatchPath(path)
  const { parent, key } = ensurePath(doc, segments)
  if (key === null) {
    throw new Error('Array path must point to an array field')
  }
  if (!Array.isArray(parent[key])) {
    parent[key] = []
  }
  return parent[key]
}

function applyArrayPatch(doc: any, patch: ArrayPatch, model: ModelCollection) {
  const array = resolveArrayAtPath(doc, patch.path)

  if (patch.kind === 'array.insert') {
    const index = patch.index ?? array.length
    array.splice(index, 0, patch.item)
  } else if (patch.kind === 'array.move') {
    const currentIndex = array.findIndex((item) => item && item.id === patch.itemId)

    // Fallback for arrays without stable ids: treat itemId as an index
    const index = currentIndex === -1 ? Number.parseInt(patch.itemId, 10) : currentIndex

    if (!Number.isFinite(index) || index < 0 || index >= array.length) {
      throw new Error(`array.move: item with idOrIndex=${patch.itemId} not found`)
    }

    const [moved] = array.splice(index, 1)
    const toIndex = patch.toIndex ?? array.length
    array.splice(toIndex, 0, moved)
  } else if (patch.kind === 'array.remove') {
    const index = array.findIndex((item) => item && item.id === patch.itemId)
    if (index === -1) {
      return
    }
    array.splice(index, 1)
  } else if (patch.kind === 'array.updateItem') {
    const index = array.findIndex((item) => item && item.id === patch.itemId)
    if (index === -1) {
      throw new Error(`array.updateItem: item with id=${patch.itemId} not found`)
    }
    const current = array[index]
    const { doc: updated, errors } = applyPatches(model, current, patch.patches)
    if (errors.length > 0) {
      throw new Error(
        `array.updateItem produced nested errors: ${errors.map((e) => e.message).join('; ')}`
      )
    }
    array[index] = updated
  }
}

function applyBlockPatch(doc: any, patch: BlockPatch, model: ModelCollection) {
  // Blocks are just arrays of objects with stable ids under the hood.
  const array = resolveArrayAtPath(doc, patch.path)

  if (patch.kind === 'block.add') {
    const id = crypto.randomUUID()
    const base: any = { id, type: patch.blockType }
    if (patch.initialValue && typeof patch.initialValue === 'object') {
      Object.assign(base, patch.initialValue)
    }
    const index = patch.index ?? array.length
    array.splice(index, 0, base)
  } else if (patch.kind === 'block.move') {
    const index = array.findIndex((item) => item && item.id === patch.blockId)
    if (index === -1) {
      throw new Error(`block.move: block with id=${patch.blockId} not found`)
    }
    const [item] = array.splice(index, 1)
    const toIndex = Math.max(0, Math.min(patch.toIndex, array.length))
    array.splice(toIndex, 0, item)
  } else if (patch.kind === 'block.remove') {
    const index = array.findIndex((item) => item && item.id === patch.blockId)
    if (index === -1) {
      return
    }
    array.splice(index, 1)
  } else if (patch.kind === 'block.updateField') {
    const index = array.findIndex((item) => item && item.id === patch.blockId)
    if (index === -1) {
      throw new Error(`block.updateField: block with id=${patch.blockId} not found`)
    }
    const block = array[index]
    const fieldPatch: FieldSetPatch = {
      kind: 'field.set',
      path: patch.fieldPath,
      value: patch.value,
    }
    const { errors } = applyPatches(model, block, [fieldPatch])
    if (errors.length > 0) {
      throw new Error(
        `block.updateField produced nested errors: ${errors.map((e) => e.message).join('; ')}`
      )
    }
  }
}

// Main entry point: apply all patches against a cloned document.
export function applyPatches(
  model: ModelCollection,
  doc: Record<string, any>,
  patches: DocumentPatch[]
): ApplyPatchesResult {
  const working = structuredClone(doc)
  const errors: ApplyPatchesResult['errors'] = []

  patches.forEach((patch, index) => {
    try {
      // Best-effort schema-aware validation: skip patches whose paths do not
      // resolve against the provided model collection. This is intentionally
      // conservative and currently only understands a subset of the path
      // grammar implemented in parsePatchPath/resolveModelFieldForPath.
      // const resolvedField = resolveModelFieldForPath(model, patch.path)
      // if (!resolvedField) {
      //   errors.push({
      //     index,
      //     message: `Patch path not found in model: ${String(patch.path ?? '')}`,
      //     patch,
      //   })
      //   return
      // }

      if (patch.kind === 'field.set' || patch.kind === 'field.clear') {
        applyFieldPatch(working, patch)
      } else if (
        patch.kind === 'array.insert' ||
        patch.kind === 'array.move' ||
        patch.kind === 'array.remove' ||
        patch.kind === 'array.updateItem'
      ) {
        applyArrayPatch(working, patch, model)
      } else if (
        patch.kind === 'block.add' ||
        patch.kind === 'block.move' ||
        patch.kind === 'block.remove' ||
        patch.kind === 'block.updateField'
      ) {
        applyBlockPatch(working, patch, model)
      } else {
        errors.push({
          index,
          message: `Unsupported patch kind: ${(patch as { kind: string }).kind}`,
          patch,
        })
      }
    } catch (err) {
      errors.push({
        index,
        message: err instanceof Error ? err.message : 'Unknown patch error',
        patch,
      })
    }
  })

  return { doc: working, errors }
}
