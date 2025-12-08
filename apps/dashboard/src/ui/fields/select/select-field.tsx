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

import type { SelectField as FieldType } from '@byline/core'
import { Select, SelectItem } from '@infonomic/uikit/react'

import { useFieldError, useIsDirty } from '../../fields/form-context'

export const SelectField = ({
  field,
  initialValue,
  onChange,
  id,
}: {
  field: FieldType
  initialValue?: string
  onChange?: (value: any) => void
  id?: string
}) => {
  const fieldError = useFieldError(field.name)
  const isDirty = useIsDirty(field.name)

  return (
    <div>
      <Select
        size="sm"
        id={id ?? field.name}
        name={field.name}
        placeholder="Select an option"
        required={field.required}
        defaultValue={initialValue || ''}
        helpText={field.helpText}
        onValueChange={(value) => onChange?.(value)}
        className={isDirty ? 'border-blue-300' : ''}
      >
        {field.options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>
      {fieldError && <div className="mt-1 text-xs text-red-400">{fieldError}</div>}
    </div>
  )
}
