export type FieldType = 'text' | 'checkbox' | 'select' | 'richtext'

interface BaseField {
  name: string
  label: string
  required?: boolean
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

export interface CollectionDefinition {
  name: string
  slug: string
  fields: Field[]
}

