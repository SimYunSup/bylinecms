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

import { Input } from '@byline/uikit/react'
import { useFormContext } from '../../fields/form-context'
import type { TextField as FieldType } from '../@types'

export const TextField = ({
  field,
  initialValue,
  onChange,
}: {
  field: FieldType
  initialValue?: string
  onChange?: (value: string) => void
}) => {
  const { errors, isDirty } = useFormContext()
  const fieldError = errors.find((error) => error.field === field.name)

  return (
    <div>
      <Input
        id={field.name}
        name={field.name}
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        defaultValue={initialValue || undefined}
        onChange={(e) => onChange?.(e.target.value)}
        error={fieldError?.message != null}
        errorText={fieldError?.message}
        className={isDirty(field.name) ? 'border-blue-300' : ''}
      />
    </div>
  )
}
