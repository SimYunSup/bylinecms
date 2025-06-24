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
