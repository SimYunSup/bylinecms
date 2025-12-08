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

import type { CheckboxField as FieldType } from '@byline/core'
import { Checkbox } from '@infonomic/uikit/react'

import { useFieldError, useFieldValue, useIsDirty } from '../../fields/form-context'

export const CheckboxField = ({
  field,
  initialValue,
  onChange,
  id,
  path,
}: {
  field: FieldType
  initialValue?: boolean
  onChange?: (value: boolean) => void
  id?: string
  path?: string
}) => {
  const fieldPath = path ?? field.name
  const fieldError = useFieldError(fieldPath)
  const isDirty = useIsDirty(fieldPath)
  const fieldValue = useFieldValue<boolean | undefined>(fieldPath)
  const checked = fieldValue ?? initialValue ?? false

  return (
    <div>
      <Checkbox
        id={id ?? fieldPath}
        name={field.name}
        label={field.label ?? field.name}
        checked={checked}
        helpText={field.helpText}
        // TODO: Handle indeterminate state
        onCheckedChange={(value) => {
          const next = value === 'indeterminate' ? false : Boolean(value)
          onChange?.(next)
        }}
        error={fieldError != null}
        errorText={fieldError}
        className={isDirty ? 'border-blue-300' : ''}
      />
    </div>
  )
}
