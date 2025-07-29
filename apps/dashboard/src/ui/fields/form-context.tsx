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

import type { Field } from '@byline/byline'
import { get as getNestedValue, set as setNestedValue } from 'lodash-es'
import type React from 'react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

interface FormError {
  field: string
  message: string
}

interface FormContextType {
  setFieldValue: (name: string, value: any) => void
  getFieldValue: (name: string) => any
  getFieldValues: () => Record<string, any>
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
  const dirtyFields = useRef<Set<string>>(new Set())

  const setFieldValue = useCallback((name: string, value: any) => {
    const newFieldValues = { ...fieldValues.current }
    setNestedValue(newFieldValues, name, value)
    fieldValues.current = newFieldValues
    dirtyFields.current.add(name)

    // Clear field-specific errors when value changes
    setErrors((prev) => prev.filter((error) => error.field !== name))
  }, [])

  const getFieldValues = useCallback(() => fieldValues.current, [])

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
