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

import { Container, Section } from '@byline/uikit/react'
import { useNavigate } from '@tanstack/react-router'
import { Pages } from '~/collections/pages'
import { FormRenderer } from '~/fields/form-renderer'

export const CreateView = () => {
  const navigate = useNavigate()
  // const location = useRouterState({ select: (s) => s.location })

  const handleSubmit = async (data: any) => {
    try {
      const postRes = await fetch('http://localhost:3001/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!postRes.ok) {
        console.error(`Failed to create page: ${postRes.statusText}`)
      }
      const res = await fetch('http://localhost:3001/api/pages')
      if (!res.ok) {
        console.error(`Failed to fetch pages: ${res.statusText}`)
      } else {
        navigate({
          to: '/collections/pages',
        })
      }
    } catch (err) {
      // Optionally, you can show this error to the user
      console.error(err)
    }
  }

  return (
    <Section>
      <Container>
        <h2 className="mb-2">Create Page</h2>
        <FormRenderer
          fields={Pages.fields}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: '/collections/pages' })}
        />
      </Container>
    </Section>
  )
}
