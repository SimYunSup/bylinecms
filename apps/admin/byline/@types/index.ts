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

export type FieldType = 'text' | 'checkbox' | 'select' | 'richtext'

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

export type Field = TextField | CheckboxField | SelectField | RichTextField



