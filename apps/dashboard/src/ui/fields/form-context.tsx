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

    // Special handling for content blocks so that the structured
    // content array stays in sync with inner field edits.
    if (name.startsWith('content[')) {
      const rootMatch = /^content\[(\d+)\]/.exec(name)
      if (rootMatch) {
        const index = Number.parseInt(rootMatch[1] ?? '0', 10)

        const content = Array.isArray(newFieldValues.content)
          ? [...newFieldValues.content]
          : Array.isArray(initialValues.current.content)
            ? [...(initialValues.current.content as any[])]
            : []

        const existing = content[index]
        if (existing && typeof existing === 'object') {
          // New block shape: { id, type: 'block', name, fields, meta }
          if (existing.type === 'block' && Array.isArray(existing.fields)) {
            // Path is like: content[0].richTextBlock[0].richText
            // We need to parse out the field index and key.

            // Remove "content[0]."
            const relativePath = name.substring(rootMatch[0].length + 1)

            // Check if it matches the block name pattern: "blockName[fieldIndex].fieldName"
            // We expect relativePath to start with existing.name
            if (relativePath.startsWith(existing.name)) {
              const parts = relativePath.split('.')
              // parts[0] should be "blockName[fieldIndex]"
              // parts[1] should be "fieldName"

              if (parts.length >= 2) {
                const blockRef = parts[0]
                const fieldName = parts[1]

                const fieldIndexMatch = /\[(\d+)\]$/.exec(blockRef)
                if (fieldIndexMatch) {
                  const fieldIndex = Number.parseInt(fieldIndexMatch[1], 10)

                  if (existing.fields[fieldIndex]) {
                    const updatedFields = [...existing.fields]
                    // Update the specific field object in the array
                    updatedFields[fieldIndex] = {
                      ...updatedFields[fieldIndex],
                      [fieldName]: value,
                    }

                    content[index] = {
                      ...existing,
                      fields: updatedFields,
                    }
                  }
                }
              }
            }
          }
        }

        newFieldValues.content = content
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
    patchesRef.current = [...patchesRef.current, patch]

    // Clear field-specific errors when value changes
    setErrors((prev) => prev.filter((error) => error.field !== name))
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
