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
import { createFileRoute } from '@tanstack/react-router'
import { BreadcrumbsClient } from '@/context/breadcrumbs/breadcrumbs-client'
import { EditView } from '@/modules/pages/edit'

export const Route = createFileRoute('/collections/pages/$postid')({
  loader: async ({ params }): Promise<Page> => {
    const response = await fetch(`http://localhost:3001/api/pages/${params.postid}`)
    if (!response.ok) {
      throw new Error('Failed to fetch page')
    }
    return response.json()
  },
  staleTime: 0,
  gcTime: 0,
  shouldReload: true,
  component: Index,
})

function Index() {
  const pageData = Route.useLoaderData()

  return (
    <>
      <BreadcrumbsClient
        breadcrumbs={[
          { label: 'Pages', href: '/collections/pages' },
          { label: pageData.title || 'Edit Page', href: `/pages/${pageData.id}` },
        ]}
      />
      <EditView initialData={pageData} />
    </>
  )
}
