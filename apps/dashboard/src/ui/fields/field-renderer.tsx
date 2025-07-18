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

// NOTE: Before you dunk on this, this is a totally naïve and "weekend hack"
// implementation of a field renderer used only for prototype development.

import type { Field } from '@byline/byline/@types/index'
import { CheckboxField } from '../fields/checkbox/checkbox-field'
import { useFormContext } from '../fields/form-context'
import { RichTextField } from '../fields/richtext/richtext-lexical/richtext-field'
import { SelectField } from '../fields/select/select-field'
import { TextField } from '../fields/text/text-field'
import { DateTimeField } from './datetime/datetime-field'

interface FieldRendererProps {
  field: Field | Field[]
  initialValue?: any
  fieldPath?: string // Add field path for nested value extraction
}

export const FieldRenderer = ({ field, initialValue, fieldPath = '' }: FieldRendererProps) => {
  const { setFieldValue } = useFormContext()
  console.log('Rendering field:', field, 'with initial value:', initialValue)
  // Handle array of fields (nested groups)
  if (Array.isArray(field)) {
    return (
      <div className="field-group">
        {field.map((childField, index) => (
          <FieldRenderer
            key={`${fieldPath}.${childField.name || index}`}
            field={childField}
            initialValue={initialValue}
            fieldPath={fieldPath}
          />
        ))}
      </div>
    )
  }

  // Handle single field
  const currentFieldPath = fieldPath ? `${fieldPath}.${field.name}` : field.name

  const handleChange = (value: any) => {
    setFieldValue(currentFieldPath, value)
  }

  // Extract value for nested fields
  const extractFieldValue = (data: any, fieldName: string, path: string): any => {
    if (data == null) return undefined

    // For simple top-level fields
    if (!path || path === fieldName) {
      return data
    }

    // For nested fields, we need to traverse the data structure
    // This is a simplified approach - you may need to enhance this
    // based on your exact data structure requirements
    return data[fieldName]
  }

  const fieldValue = extractFieldValue(initialValue, field.name, currentFieldPath)

  // Handle nested array fields
  if (field.type === 'array' && field.fields) {
    const arrayData = fieldValue || []

    return (
      <div className="array-field">
        <div className="block font-medium text-[1rem] mb-2">{field.label || field.name}</div>
        <div className="array-items space-y-4">
          {arrayData.map((item: any, index: number) => (
            <div key={index} className="array-item border border-gray-700 rounded p-4">
              <FieldRenderer
                field={field.fields}
                initialValue={item}
                fieldPath={`${currentFieldPath}[${index}]`}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  switch (field.type) {
    case 'text':
      return <TextField field={field} initialValue={fieldValue} onChange={handleChange} />
    case 'checkbox':
      return <CheckboxField field={field} initialValue={fieldValue} onChange={handleChange} />
    case 'select':
      return <SelectField field={field} initialValue={fieldValue} onChange={handleChange} />
    case 'richText':
      return <RichTextField field={field} initialValue={fieldValue} onChange={handleChange} />
    case 'datetime':
      return <DateTimeField field={field} initialValue={fieldValue} onChange={handleChange} />
    default:
      return null
  }
}
