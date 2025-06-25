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

import type { Field } from '~/@types'
import { CheckboxField } from '~/fields/checkbox/checkbox-field'
import { RichTextField } from '~/fields/richtext/richtext-lexical/richtext-field'
import { SelectField } from '~/fields/select/select-field'
import { TextField } from '~/fields/text/text-field'

interface FieldRendererProps {
  field: Field
  initialValue?: any
}

export const FieldRenderer = ({ field, initialValue }: FieldRendererProps) => {
  switch (field.type) {
    case 'text':
      return <TextField field={field} initialValue={initialValue || ''} />
    case 'checkbox':
      return <CheckboxField field={field} initialValue={initialValue || false} />
    case 'select':
      return <SelectField field={field} initialValue={initialValue || ''} />
    case 'richtext':
      return (
        <RichTextField
          field={field}
          initialValue={initialValue}
          onChange={(value) => console.log('RichText changed:', value)}
        />
      )
    default:
      return null
  }
}
