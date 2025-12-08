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

import { useCallback, useRef } from 'react'

import type { TextField as FieldType } from '@byline/core'
import { Input } from '@infonomic/uikit/react'

import { useFieldError, useIsDirty } from '../../fields/form-context'

export const TextField = ({
  field,
  initialValue,
  onChange,
  id,
}: {
  field: FieldType
  initialValue?: string
  onChange?: (value: string) => void
  id?: string
}) => {
  const fieldError = useFieldError(field.name)
  const isDirty = useIsDirty(field.name)
  const dispatchFieldUpdateTask = useRef<number>(undefined)

  const handleChange = useCallback(
    (value: string) => {
      const updateFieldValue = (val: string) => {
        if (onChange) {
          onChange(val)
        }
      }

      if (typeof window.requestIdleCallback === 'function') {
        if (typeof window.cancelIdleCallback === 'function' && dispatchFieldUpdateTask.current) {
          cancelIdleCallback(dispatchFieldUpdateTask.current)
        }
        dispatchFieldUpdateTask.current = requestIdleCallback(() => updateFieldValue(value), {
          timeout: 500,
        })
      } else {
        updateFieldValue(value)
      }
    },
    [onChange]
  )

  return (
    <div>
      <Input
        id={id ?? field.name}
        name={field.name}
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        defaultValue={initialValue || undefined}
        onChange={(e) => handleChange(e.target.value)}
        error={fieldError != null}
        errorText={fieldError}
        className={isDirty ? 'border-blue-300' : ''}
      />
    </div>
  )
}
