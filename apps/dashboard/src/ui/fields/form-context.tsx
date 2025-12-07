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

import type React from 'react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

import type { Field } from '@byline/core'
import type { DocumentPatch, FieldSetPatch } from '@byline/core/patches'
import { get as getNestedValue, set as setNestedValue } from 'lodash-es'

interface FormError {
  field: string
  message: string
}

interface FormContextType {
  setFieldValue: (name: string, value: any) => void
  getFieldValue: (name: string) => any
  getFieldValues: () => Record<string, any>
  getPatches: () => DocumentPatch[]
  appendPatch: (patch: DocumentPatch) => void
  resetPatches: () => void
  hasChanges: () => boolean
  resetHasChanges: () => void
  validateForm: (fields: Field[]) => FormError[]
  errors: FormError[]
  clearErrors: () => void
  isDirty: (fieldName: string) => boolean
}

const FormContext = createContext<FormContextType | null>(null)

export const useFormContext = () => {
  const context = useContext(FormContext)
  if (context == null) {
    throw new Error('useFormContext must be used within a FormProvider')
  }
  return context
}

export const FormProvider = ({
  children,
  initialData = {},
}: {
  children: React.ReactNode
  initialData?: Record<string, any>
}) => {
  const fieldValues = useRef<Record<string, any>>(JSON.parse(JSON.stringify(initialData)))
  const initialValues = useRef<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<FormError[]>([])
  const [, setDirtyVersion] = useState(0)
  const dirtyFields = useRef<Set<string>>(new Set())
  const patchesRef = useRef<DocumentPatch[]>([])

  const setFieldValue = useCallback((name: string, value: any) => {
    const newFieldValues = { ...fieldValues.current }

    // Keep nested path values up to date for generic usage and patches.
    setNestedValue(newFieldValues, name, value)

    // Generic handling for block fields:
    // If the path traverses a block object (identified by { type: 'block', name: '...' }),
    // and the path segment matches the block name, we must also update the internal `fields` array.
    // This ensures that the structured data (used for persistence) stays in sync with the
    // "virtual" path used by the UI (e.g. content[0].richTextBlock[0].richText).

    // We walk the path segments against the object tree.
    // Path format: "content[0].richTextBlock[0].richText"
    // Segments: ["content", "0", "richTextBlock", "0", "richText"]
    // (Note: lodash/set handles the parsing implicitly, but we need to do it explicitly here to find blocks)

    // Simple path parser that handles dot notation and brackets
    const segments = name.replace(/\]/g, '').split(/[.[]/)

    let current = newFieldValues
    for (let i = 0; i < segments.length; i++) {
      const key = segments[i]

      // Check if current object is a block and the key matches its name
      if (
        current &&
        typeof current === 'object' &&
        current.type === 'block' &&
        current.name === key
      ) {
        // We found a block traversal!
        // The path continues into the block's virtual structure.
        // We need to apply the update to the `fields` array instead.

        // The remaining segments describe the path INSIDE the block's fields.
        // e.g. if path was "content[0].richTextBlock[0].richText",
        // we are at "richTextBlock". Remaining: ["0", "richText"].
        // This maps to `fields[0].richText`.

        const remainingSegments = segments.slice(i + 1)
        if (remainingSegments.length > 0) {
          // We need to update `current.fields` at `remainingSegments`.
          // Since `current` is a reference to the object in the tree, modifying it works.
          // However, for React/Immutability, we should ideally clone.
          // But `setNestedValue` above already mutated the tree structure (or cloned parts of it).
          // Since `newFieldValues` is a shallow copy of root, and `setNestedValue` handles deep cloning/mutation,
          // we can assume `current` is the object we want to modify.

          // Ensure fields array exists
          if (!Array.isArray(current.fields)) {
            current.fields = []
          }

          // Use setNestedValue to update the fields array
          // We construct a path string for the remaining part
          // e.g. "0.richText" -> "fields[0].richText"
          // But `setNestedValue` takes an object and a path.
          // We can just call it on `current` with path `fields.${remainingPath}`

          // Reconstruct path from segments (handling array indices)
          // Actually, `setNestedValue` supports array path.
          const fieldsPath = ['fields', ...remainingSegments]
          setNestedValue(current, fieldsPath, value)
        }

        // We don't need to continue traversing down the "virtual" path because
        // we've handled the sync to "fields".
        // (The virtual path update was already done by the first setNestedValue call at the top)
        break
      }

      // Move to next level
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        // Path doesn't exist in the tree (or we hit a leaf), stop.
        break
      }
    }

    fieldValues.current = newFieldValues
    dirtyFields.current.add(name)
    setDirtyVersion((v) => v + 1)

    const patch: FieldSetPatch = {
      kind: 'field.set',
      path: name,
      value,
    }

    // Optimization: Coalesce consecutive field.set patches for the same path
    const lastPatch = patchesRef.current[patchesRef.current.length - 1]
    if (lastPatch && lastPatch.kind === 'field.set' && lastPatch.path === name) {
      const newPatches = [...patchesRef.current]
      newPatches[newPatches.length - 1] = patch
      patchesRef.current = newPatches
    } else {
      patchesRef.current = [...patchesRef.current, patch]
    }

    // Clear field-specific errors when value changes
    setErrors((prev) => prev.filter((error) => error.field !== name))
    console.log('Current patch list:', patchesRef.current)
  }, [])

  const getFieldValues = useCallback(() => fieldValues.current, [])

  const getPatches = useCallback(() => patchesRef.current, [])
  const appendPatch = useCallback((patch: DocumentPatch) => {
    patchesRef.current = [...patchesRef.current, patch]
    // Mark a generic dirty flag so hasChanges() becomes true even
    // for patches that don't correspond to a specific field.set.
    dirtyFields.current.add('__patch__')
    setDirtyVersion((v) => v + 1)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('FormContext.appendPatch', { patch, dirtyCount: dirtyFields.current.size })
    }
  }, [])

  const getFieldValue = useCallback((name: string) => {
    const dirty = dirtyFields.current.has(name)
    const currentValue = getNestedValue(fieldValues.current, name)

    if (currentValue !== undefined) {
      return currentValue
    }
    if (!dirty) {
      return getNestedValue(initialValues.current, name)
    }
    return undefined
  }, [])

  const hasChanges = useCallback(() => {
    return dirtyFields.current.size > 0
  }, [])

  const resetHasChanges = useCallback(() => {
    dirtyFields.current.clear()
    patchesRef.current = []
    setDirtyVersion((v) => v + 1)
  }, [])

  const isDirty = useCallback((fieldName: string) => {
    return dirtyFields.current.has(fieldName)
  }, [])

  const validateForm = useCallback(
    (fields: Field[]): FormError[] => {
      const formErrors: FormError[] = []

      // This validation logic might need to be enhanced to handle nested fields.
      // For now, it will validate top-level fields.
      for (const field of fields) {
        const value = getFieldValue(field.name)

        // Required field validation
        if (field.required && (value == null || value === '')) {
          formErrors.push({
            field: field.name,
            message: `${field.label} is required`,
          })
        }

        // Type-specific validation
        if (value != null && value !== '') {
          switch (field.type) {
            case 'text':
              if (typeof value !== 'string') {
                formErrors.push({
                  field: field.name,
                  message: `${field.label} must be text`,
                })
              }
              break
            case 'checkbox':
              if (typeof value !== 'boolean') {
                formErrors.push({
                  field: field.name,
                  message: `${field.label} must be true or false`,
                })
              }
              break
            case 'select':
              if ('options' in field && field.options) {
                const validValues = field.options.map((opt) => opt.value)
                if (!validValues.includes(value)) {
                  formErrors.push({
                    field: field.name,
                    message: `${field.label} must be one of: ${validValues.join(', ')}`,
                  })
                }
              }
              break
            case 'datetime':
              if (value instanceof Date === false && typeof value !== 'string') {
                formErrors.push({
                  field: field.name,
                  message: `${field.label} must be a valid date`,
                })
              }
              break
          }
        }
      }

      setErrors(formErrors)
      return formErrors
    },
    [getFieldValue]
  )

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  return (
    <FormContext.Provider
      value={{
        setFieldValue,
        getFieldValue,
        getFieldValues,
        getPatches,
        appendPatch,
        resetPatches: () => {
          patchesRef.current = []
        },
        hasChanges,
        resetHasChanges,
        validateForm,
        errors,
        clearErrors,
        isDirty,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}
