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

import type { RichTextField as FieldType } from '@byline/core'

import { RichTextField as LexicalRichTextField } from './field'
import { defaultEditorConfig } from './field/config/default'

interface Props {
  field: FieldType
  readonly?: boolean
  instanceKey?: string
  initialValue?: any
  editorConfig?: any
  onChange?: (value: any) => void
}

export const RichTextField = ({
  field,
  initialValue,
  editorConfig,
  readonly = false,
  instanceKey,
  onChange,
}: Props) => (
  <div className="flex flex-1 h-full">
    <LexicalRichTextField
      onChange={onChange}
      editorConfig={editorConfig || defaultEditorConfig}
      id={instanceKey ? `${field.name}-${instanceKey}` : field.name}
      name={field.name}
      description={field.helpText}
      readonly={readonly}
      label={field.label}
      required={field.required}
      initialValue={initialValue}
      // Ensure React fully remounts when instanceKey changes
      key={instanceKey ? `${field.name}-${instanceKey}` : field.name}
    />
  </div>
)
