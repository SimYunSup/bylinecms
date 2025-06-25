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

import type { RichTextField as FieldType } from '~/@types'
import { RichTextField as LexicalRichTextField } from '~/fields/richtext/richtext-lexical/field'
import { defaultEditorConfig } from '~/fields/richtext/richtext-lexical/field/config/default'

interface Props {
  field: FieldType
  initialValue?: any
  editorConfig?: any
  onChange?: (value: any) => void
}

export const RichTextField = ({ field, initialValue, editorConfig, onChange }: Props) => (
  <div>
    <LexicalRichTextField
      onChange={onChange}
      editorConfig={editorConfig || defaultEditorConfig}
      id={field.name}
      name={field.name}
      description={field.helpText}
      label={field.label}
      required={field.required}
      initialValue={initialValue}
    />
  </div>
)
