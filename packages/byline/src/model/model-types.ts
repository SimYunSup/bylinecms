// Core model types for Byline collections (non-runtime design for now)

export type ModelPath = string

export interface ModelFieldBase {
  id: string
  label?: string
  localized?: boolean
  required?: boolean
}

export type ModelScalarType =
  | 'string'
  | 'text'
  | 'boolean'
  | 'integer'
  | 'float'
  | 'datetime'
  | 'json'

export interface ModelScalarField extends ModelFieldBase {
  kind: 'scalar'
  scalarType: ModelScalarType
}

export interface ModelObjectField extends ModelFieldBase {
  kind: 'object'
  fields: ModelField[]
}

export interface ModelArrayField extends ModelFieldBase {
  kind: 'array'
  item: ModelField
}

export interface ModelBlockUnionField extends ModelFieldBase {
  kind: 'blocks'
  typeDiscriminator: string
  blocks: ModelBlockDefinition[]
}

export interface ModelBlockDefinition {
  type: string
  label?: string
  fields: ModelField[]
}

export type ModelField =
  | ModelScalarField
  | ModelObjectField
  | ModelArrayField
  | ModelBlockUnionField

export interface ModelCollection {
  id: string
  path: string
  label?: string
  schemaVersion?: number
  fields: ModelField[]
}
