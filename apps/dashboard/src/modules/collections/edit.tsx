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

import type { CollectionDefinition } from '@byline/byline/@types/index'
import type { AnyCollectionSchemaTypes } from '@byline/byline/schemas/zod/types'
import { Button, Container, Section } from '@byline/uikit/react'
import { useNavigate } from '@tanstack/react-router'
import { FormRenderer } from '@/ui/fields/form-renderer'

export const EditView = ({
  collectionDefinition,
  initialData,
}: {
  collectionDefinition: CollectionDefinition
  initialData: AnyCollectionSchemaTypes['UpdateType']
}) => {
  const navigate = useNavigate()
  const { labels, path, fields } = collectionDefinition

  const handleSubmit = async (data: any) => {
    try {
      const putRes = await fetch(`http://localhost:3001/api/${path}/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!putRes.ok) {
        const error = await putRes.json()
        console.error('Failed to update page:', error)
        // TODO: Show error to user
      } else {
        navigate({
          to: '/collections/$collection',
          params: { collection: path },
        })
      }
    } catch (err) {
      console.error('Network error:', err)
      // TODO: Show error to user
    }
  }

  return (
    <Section>
      <Container>
        <div className="item-view flex flex-col sm:flex-row justify-start sm:justify-between">
          <h2 className="mb-2">Edit {labels.singular}</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="filled"
              className="min-w-[50px] min-h-[28px]"
              onClick={() =>
                navigate({
                  to: '/collections/$collection/$id',
                  params: { collection: path, id: String(initialData.id) },
                })
              }
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outlined"
              className="min-w-[50px] min-h-[28px]"
              onClick={() =>
                navigate({
                  to: '/collections/$collection/$id',
                  params: { collection: path, id: String(initialData.id) },
                })
              }
            >
              API
            </Button>
          </div>
        </div>
        <FormRenderer
          fields={fields}
          onSubmit={handleSubmit}
          initialData={initialData}
          onCancel={() =>
            navigate({ to: '/collections/$collection', params: { collection: path } })
          }
        />
      </Container>
    </Section>
  )
}
