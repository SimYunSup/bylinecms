// NOTE: Before you dunk on this, this is a totally naïve  and "weekend hack"
// implementation of a form renderer used only for prototype development.
import { Button } from '@byline/uikit/react'
import { formatDateTime } from '@/utils/utils.general'
import type { Field } from '~/@types'

import { FieldRenderer } from '~/fields/field-renderer'

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
      } else {
        data[field.name] = formData.get(field.name)
      }
    })

    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit(data)
    }
  }

  // Split fields by admin.position
  const defaultFields = fields.filter((f) => !f.admin?.position || f.admin.position === 'default')
  const sidebarFields = fields.filter((f) => f.admin?.position === 'sidebar')

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col">
      <input type="hidden" name="published" value={initialData?.published || false} />
      <div className="form-status-and-actions mb-3 lg:mb-0 flex flex-col lg:flex-row items-start lg:items-center gap-2 justify-start lg:justify-between border-t pt-2 mt-1 border-gray-800">
        <div className="status text-sm flex flex-row items-center gap-2">
          <div className="published flex items-center gap-1 min-w-0">
            <span className="muted shrink-0">Status:</span>
            <span className="truncate overflow-hidden">
              {initialData?.published === true ? 'Published' : 'Unpublished'}
            </span>
          </div>
          <div className="last-modified flex items-center gap-1 min-w-0">
            <span className="muted shrink-0">Last modified:</span>
            <span className="truncate overflow-hidden">
              {formatDateTime(initialData?.updated_at)}
            </span>
          </div>
          <div className="created flex items-center gap-1 min-w-0">
            <span className="muted shrink-0">Created:</span>
            <span className="truncate overflow-hidden">
              {formatDateTime(initialData?.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            intent="noeffect"
            type="button"
            onClick={handleCancel}
            className="min-w-[70px]"
          >
            Cancel
          </Button>
          <Button size="sm" type="submit" className="min-w-[70px]">
            Save
          </Button>
          <Button size="sm" type="submit" intent="success" className="min-w-[80px]">
            {initialData?.published === true ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>
      <div className="page-layout--two-columns--right-sticky">
        <div className="content flex flex-col gap-4">
          {defaultFields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              initialValue={initialData?.[field.name]}
            />
          ))}
        </div>
        <div className="sidebar-second mt-4 p-4 bg-canvas-900 border-l border-gray-800 flex flex-col gap-4">
          {sidebarFields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              initialValue={initialData?.[field.name]}
            />
          ))}
        </div>
      </div>
    </form>
  )
}
