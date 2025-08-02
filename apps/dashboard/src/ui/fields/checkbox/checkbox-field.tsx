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
import { Checkbox } from '@byline/uikit/react'

export const CheckboxField = ({
  field,
  initialValue,
  onChange,
}: {
  field: FieldType
  initialValue?: boolean
  onChange?: (value: boolean) => void
}) => (
  <div>
    <Checkbox
      id={field.name}
      name={field.name}
      label={field.label ?? field.name}
      defaultChecked={initialValue ?? false}
      helpText={field.helpText}
      // TODO: Handle indeterminate state
      onCheckedChange={(value) => onChange?.(value === 'indeterminate' ? false : value)}
    />
  </div>
)
