/**
 * Byline CMS
 *
 * Copyright © 2025 Anthony Bouch and contributors.
 *
 * This file is part of Byline CMS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// NOTE: Before you dunk on this, this is a totally naïve  and "weekend hack"
// implementation of a form renderer used only for prototype development.
import { Button } from '@byline/uikit/react'
import { formatDateTime } from '@/utils/utils.general'
import type { Field } from '~/@types'

import { FieldRenderer } from '~/fields/field-renderer'
import { FormProvider, useFormContext } from '~/fields/form-context'

const FormStatusDisplay = ({ initialData }: { initialData?: Record<string, any> }) => (
  <div className="form-status text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2">
    <div className="published flex items-center gap-1 min-w-0">
      <span className="muted shrink-0">Status:</span>
      <span className="truncate overflow-hidden">
        {initialData?.published === true ? 'Published' : 'Unpublished'}
      </span>
    </div>

    {initialData?.updated_at != null && (
      <div className="last-modified flex items-center gap-1 min-w-0">
        <span className="muted shrink-0">Last modified:</span>
        <span className="truncate overflow-hidden">{formatDateTime(initialData?.updated_at)}</span>
      </div>
    )}

    {initialData?.created_at != null && (
      <div className="created flex items-center gap-1 min-w-0">
        <span className="muted shrink-0">Created:</span>
        <span className="truncate overflow-hidden">{formatDateTime(initialData?.created_at)}</span>
      </div>
    )}
  </div>
)

const FormContent = ({
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
  const { getFieldValues } = useFormContext()

  const handleCancel = () => {
    if (onCancel && typeof onCancel === 'function') {
      onCancel()
    }
  }

  const serializeValueForFormData = (field: Field, value: any) => {
    switch (field.type) {
      case 'checkbox':
        return value === true
      case 'datetime':
        return value ? value : null
      default:
        return value ?? ''
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fieldValues = getFieldValues()
    const data: any = {}

    fields.forEach((field) => {
      const contextValue = fieldValues[field.name]
      const initialValue = initialData?.[field.name]

      // Use context value if available, otherwise fall back to initial value
      const currentValue = contextValue !== undefined ? contextValue : initialValue

      data[field.name] = serializeValueForFormData(field, currentValue)
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
      <div className="form-status-and-actions mb-3 lg:mb-0 flex flex-col lg:flex-row items-start lg:items-center gap-2 justify-start lg:justify-between border-t pt-2 mt-1 border-gray-800">
        <FormStatusDisplay initialData={initialData} />
        <div className="form-actions flex items-center gap-2">
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

export const FormRenderer = (props: {
  fields: Field[]
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: Record<string, any>
}) => (
  <FormProvider>
    <FormContent {...props} />
  </FormProvider>
)
