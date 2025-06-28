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

export interface BaseSchema {
  id: string
  vid: number
  published: boolean | null
  created_at: string
  updated_at: string
}

export interface CollectionDefinition {
  name: string
  path: string
  fields: Field[]
}

export type FieldType = 'text' | 'checkbox' | 'select' | 'richtext' | 'datetime'

interface BaseField {
  name: string
  label: string
  required?: boolean
  helpText?: string
  placeholder?: string
  admin?: {
    position?: 'default' | 'sidebar'
  }
}

export interface TextField extends BaseField {
  type: 'text'
}

export interface CheckboxField extends BaseField {
  type: 'checkbox'
}

export interface SelectField extends BaseField {
  type: 'select'
  options: { label: string; value: string }[]
}

export interface RichTextField extends BaseField {
  type: 'richtext'
}

export interface DateTimeField extends BaseField {
  type: 'datetime'
  mode?: 'date' | 'datetime'
  yearsInFuture?: number
  yearsInPast?: number
  initialValue?: Date
}

export type Field = TextField | CheckboxField | SelectField | RichTextField | DateTimeField



