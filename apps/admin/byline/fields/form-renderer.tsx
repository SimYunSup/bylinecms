// NOTE: Before you dunk on this, this is a totally naïve  and "weekend hack"
// implementation of a form renderer used only for prototype development.

import { Button, Checkbox, Input, Select, SelectItem } from '@byline/uikit/react'
import { useEffect, useState } from 'react'
import type { Field } from '~/@types'
import { RichTextField } from '~/fields/richtext/richtext-lexical/field'
import { defaultEditorConfig } from '~/fields/richtext/richtext-lexical/field/config/default'

export const FormRenderer = ({
  fields,
  onSubmit,
  onCancel,
  initialData,
}: {
  fields: Field[]
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: Record<string, any>
}) => {
  const [richtextValues, setRichtextValues] = useState<Record<string, any>>({})

  const handleCancel = () => {
    if (onCancel && typeof onCancel === 'function') {
      onCancel()
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data: any = {}

    fields.forEach((field) => {
      if (field.type === 'checkbox') {
        data[field.name] = formData.get(field.name) === 'on'
      } else if (field.type === 'richtext') {
        data[field.name] = richtextValues[field.name] || null
      } else {
        data[field.name] = formData.get(field.name)
      }
    })

    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit(data)
    }
  }

  useEffect(() => {
    if (initialData) {
      // Initialize richtext values from initial data
      const richtextInitial: Record<string, any> = {}
      fields.forEach((field) => {
        if (field.type === 'richtext' && initialData[field.name]) {
          richtextInitial[field.name] = initialData[field.name]
        }
      })
      setRichtextValues(richtextInitial)
    }
  }, [initialData, fields])

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fields.map((field) => {
        switch (field.type) {
          case 'text':
            return (
              <div key={field.name}>
                <Input
                  id={field.name}
                  name={field.name}
                  label={field.label}
                  required={field.required}
                  defaultValue={initialData?.[field.name] || ''}
                />
              </div>
            )
          case 'checkbox':
            return (
              <div key={field.name}>
                <Checkbox
                  id={field.name}
                  name={field.name}
                  label={field.label}
                  defaultChecked={initialData?.[field.name] || false}
                />
              </div>
            )
          case 'select':
            return (
              <div key={field.name}>
                <Select
                  id={field.name}
                  name={field.name}
                  placeholder="Select an option"
                  required={field.required}
                  defaultValue={initialData?.[field.name] || ''}
                >
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )
          case 'richtext':
            return (
              <div key={field.name}>
                <RichTextField
                  onChange={(value) => {
                    console.log(`Value for ${field.name}:`, value)
                    setRichtextValues((prev) => ({
                      ...prev,
                      [field.name]: value,
                    }))
                  }}
                  editorConfig={defaultEditorConfig}
                  id={field.name}
                  name={field.name}
                  label={field.label}
                  required={field.required}
                  initialValue={initialData?.[field.name]}
                />
              </div>
            )
        }
      })}
      <div className="form-actions flex items-center gap-2">
        <Button intent="noeffect" type="button" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  )
}
