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

// NOTE: Before you dunk on this, this is a totally naïve and "weekend hack"
// implementation of a field renderer used only for prototype development.

import { type ReactNode, useEffect, useState } from 'react'

import type { ArrayField as ArrayFieldType, Field } from '@byline/core'
import { GripperVerticalIcon } from '@infonomic/uikit/react'
import cx from 'classnames'

import { DraggableSortable, moveItem, useSortable } from '@/ui/dnd/draggable-sortable'
import { CheckboxField } from '../fields/checkbox/checkbox-field'
import { useFormContext } from '../fields/form-context'
import { RichTextField } from '../fields/richtext/richtext-lexical/richtext-field'
import { SelectField } from '../fields/select/select-field'
import { TextField } from '../fields/text/text-field'
import { DateTimeField } from './datetime/datetime-field'
import { NumericalField } from './numerical/numerical-field'

const SortableItem = ({
  id,
  label,
  children,
}: {
  id: string
  label: ReactNode
  children: ReactNode
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0, 0.2, 0.2, 1)',
    },
  })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 10 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx('p-4 pt-2 border border-dashed border-gray-600 rounded-md', {
        'shadow-sm bg-canvas-800': !isDragging,
        'shadow-md bg-canvas-700/30': isDragging,
      })}
    >
      <div className="flex items-center gap-2 mb-3 -ml-3">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-800 rounded text-gray-400 flex items-center justify-center"
          {...attributes}
          {...listeners}
        >
          <GripperVerticalIcon className="w-4 h-4" />
        </button>
        <div className="text-[1rem] font-medium">{label}</div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

const ArrayField = ({
  field,
  initialValue,
  path,
  disableSorting = false,
}: {
  field: ArrayFieldType
  initialValue: any
  path: string
  disableSorting?: boolean
}) => {
  const [items, setItems] = useState<{ id: string; data: any }[]>([])

  useEffect(() => {
    if (Array.isArray(initialValue)) {
      setItems(initialValue.map((item) => ({ id: crypto.randomUUID(), data: item })))
    } else {
      setItems([])
    }
  }, [initialValue])

  const handleDragEnd = ({
    moveFromIndex,
    moveToIndex,
  }: {
    moveFromIndex: number
    moveToIndex: number
  }) => {
    setItems((prev) => moveItem(prev, moveFromIndex, moveToIndex))
  }

  const renderItem = (itemWrapper: { id: string; data: any }, index: number) => {
    const item = itemWrapper.data
    const arrayElementPath = `${path}.${index}`
    // For block arrays, find the matching field definition for the item.
    const blockType = Object.keys(item)[0]
    const subField = field.fields?.find((f) => f.name === blockType)

    if (subField == null) return null

    const body = (
      <FieldRenderer
        key={subField.name}
        field={subField}
        initialValue={item[subField.name]}
        basePath={arrayElementPath}
        disableSorting={true}
        hideLabel={true}
      />
    )

    if (disableSorting) {
      return (
        <div
          key={itemWrapper.id}
          className="p-4 border border-dashed border-gray-600 rounded-md flex flex-col gap-4"
        >
          {subField.label && <h3 className="text-[1rem] font-medium mb-1">{subField.label}</h3>}
          {body}
        </div>
      )
    }

    return (
      <SortableItem
        key={itemWrapper.id}
        id={itemWrapper.id}
        label={subField.label ?? subField.name}
      >
        {body}
      </SortableItem>
    )
  }

  return (
    <div className="">
      {!disableSorting && field.label && (
        <h3 className="text-[1rem] font-medium mb-1">{field.label}</h3>
      )}
      {disableSorting ? (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      ) : (
        <DraggableSortable
          ids={items.map((i) => i.id)}
          onDragEnd={handleDragEnd}
          className="flex flex-col gap-4"
        >
          {items.map((item, index) => renderItem(item, index))}
        </DraggableSortable>
      )}
    </div>
  )
}

interface FieldRendererProps {
  field: Field
  initialValue?: any
  basePath?: string
  disableSorting?: boolean
  hideLabel?: boolean
}

export const FieldRenderer = ({
  field,
  initialValue,
  basePath,
  disableSorting,
  hideLabel,
}: FieldRendererProps) => {
  const { setFieldValue } = useFormContext()
  const path = basePath ? `${basePath}.${field.name}` : field.name

  const handleChange = (value: any) => {
    setFieldValue(path, value)
  }

  switch (field.type) {
    case 'text':
      return (
        <TextField
          field={hideLabel ? { ...field, label: undefined } : field}
          initialValue={initialValue}
          onChange={handleChange}
        />
      )
    case 'checkbox':
      return (
        <CheckboxField
          field={hideLabel ? { ...field, label: undefined } : field}
          initialValue={initialValue}
          onChange={handleChange}
        />
      )
    case 'select':
      return (
        <SelectField
          field={hideLabel ? { ...field, label: undefined } : field}
          initialValue={initialValue}
          onChange={handleChange}
        />
      )
    case 'richText':
      return (
        <RichTextField
          field={hideLabel ? { ...field, label: undefined } : field}
          initialValue={initialValue}
          onChange={handleChange}
        />
      )
    case 'datetime':
      return (
        <DateTimeField
          field={hideLabel ? { ...field, label: undefined } : field}
          initialValue={initialValue}
          onChange={handleChange}
        />
      )
    case 'integer':
      return (
        <NumericalField
          field={hideLabel ? { ...field, label: undefined } : field}
          initialValue={initialValue}
          onChange={handleChange}
        />
      )
    case 'array':
      if (!field.fields) return null
      return (
        <ArrayField
          field={field}
          initialValue={initialValue}
          path={path}
          disableSorting={disableSorting}
        />
      )
    default:
      return null
  }
}
