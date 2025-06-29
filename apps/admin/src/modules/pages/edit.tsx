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

import type { Page } from '@byline/byline/collections/pages'
import { Pages } from '@byline/byline/collections/pages'
import { Button, Container, Section } from '@byline/uikit/react'
import { useNavigate } from '@tanstack/react-router'
import { FormRenderer } from '@/ui/fields/form-renderer'

export const EditView = ({ path, initialData }: { path: string; initialData: Page }) => {
  const navigate = useNavigate()

  const handleSubmit = async (data: any) => {
    try {
      const putRes = await fetch(`http://localhost:3001/api/pages/${initialData.id}`, {
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
          <h2 className="mb-2">Edit Page</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="filled"
              className="min-w-[50px] min-h-[28px]"
              onClick={() =>
                navigate({
                  to: '/collections/$collection/$postid',
                  params: { collection: path, postid: initialData.id },
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
                  to: '/collections/$collection/$postid',
                  params: { collection: path, postid: initialData.id },
                })
              }
            >
              API
            </Button>
          </div>
        </div>
        <FormRenderer
          fields={Pages.fields}
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
