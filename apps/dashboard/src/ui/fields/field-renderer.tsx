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

import type { Field } from '@byline/byline'
import { CheckboxField } from '../fields/checkbox/checkbox-field'
import { useFormContext } from '../fields/form-context'
import { RichTextField } from '../fields/richtext/richtext-lexical/richtext-field'
import { SelectField } from '../fields/select/select-field'
import { TextField } from '../fields/text/text-field'
import { DateTimeField } from './datetime/datetime-field'
import { NumericalField } from './numerical/numerical-field'

interface FieldRendererProps {
  field: Field
  initialValue?: any
  basePath?: string
}

export const FieldRenderer = ({ field, initialValue, basePath }: FieldRendererProps) => {
  const { setFieldValue } = useFormContext()
  const path = basePath ? `${basePath}.${field.name}` : field.name

  const handleChange = (value: any) => {
    setFieldValue(path, value)
  }

  switch (field.type) {
    case 'text':
      return <TextField field={field} initialValue={initialValue} onChange={handleChange} />
    case 'checkbox':
      return <CheckboxField field={field} initialValue={initialValue} onChange={handleChange} />
    case 'select':
      return <SelectField field={field} initialValue={initialValue} onChange={handleChange} />
    case 'richText':
      return <RichTextField field={field} initialValue={initialValue} onChange={handleChange} />
    case 'datetime':
      return <DateTimeField field={field} initialValue={initialValue} onChange={handleChange} />
    case 'integer':
      return <NumericalField field={field} initialValue={initialValue} onChange={handleChange} />
    case 'array':
      if (!field.fields) return null
      return (
        <div className="">
          {field.label && <h3 className="text-[1rem] font-medium mb-1">{field.label}</h3>}
          <div className="flex flex-col gap-4">
            {Array.isArray(initialValue) &&
              initialValue.map((item, index) => {
                const arrayElementPath = `${path}.${index}`
                // For block arrays, find the matching field definition for the item.
                const blockType = Object.keys(item)[0]
                const subField = field.fields?.find((f) => f.name === blockType)

                if (subField == null) return null

                return (
                  <div
                    key={arrayElementPath}
                    className="p-4 border border-dashed border-gray-600 rounded-md flex flex-col gap-4"
                  >
                    <FieldRenderer
                      key={subField.name}
                      field={subField}
                      initialValue={item[subField.name]}
                      basePath={arrayElementPath}
                    />
                  </div>
                )
              })}
          </div>
        </div>
      )
    default:
      return null
  }
}
