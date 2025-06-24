import { Checkbox } from '@byline/uikit/react'
import type { CheckboxField as FieldType } from '~/@types'

export const CheckboxField = ({
  field,
  initialValue,
}: {
  field: FieldType
  initialValue?: boolean
}) => (
  <div>
    <Checkbox
      id={field.name}
      name={field.name}
      label={field.label}
      defaultChecked={initialValue || false}
      helpText={field.helpText}
    />
  </div>
)
