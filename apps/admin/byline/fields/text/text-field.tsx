import { Input } from '@byline/uikit/react'
import type { TextField as FieldType } from '~/@types'

export const TextField = ({ field, initialValue }: { field: FieldType; initialValue?: string }) => (
  <div>
    <Input
      id={field.name}
      name={field.name}
      label={field.label}
      required={field.required}
      helpText={field.helpText}
      defaultValue={initialValue || ''}
    />
  </div>
)
