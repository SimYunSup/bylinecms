import { Select, SelectItem } from '@byline/uikit/react'
import type { SelectField as FieldType } from '~/@types'

export const SelectField = ({
  field,
  initialValue,
}: {
  field: FieldType
  initialValue?: string
}) => (
  <div>
    <Select
      id={field.name}
      name={field.name}
      placeholder="Select an option"
      required={field.required}
      defaultValue={initialValue || ''}
    >
      {field.options.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </Select>
  </div>
)
