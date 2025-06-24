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
