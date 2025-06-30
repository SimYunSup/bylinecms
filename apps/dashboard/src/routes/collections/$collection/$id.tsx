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
import { getCollectionDefinition } from '@byline/byline/collections/registry'
import type { UpdateTypes } from '@byline/byline/outputs/zod-types/index'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { BreadcrumbsClient } from '@/context/breadcrumbs/breadcrumbs-client'
import { EditView } from '@/modules/collections/edit'

export const Route = createFileRoute('/collections/$collection/$id')({
  loader: async ({ params }): Promise<UpdateTypes[keyof UpdateTypes]> => {
    const collectionDef = getCollectionDefinition(params.collection)
    if (!collectionDef) {
      throw notFound()
    }

    const response = await fetch(`http://localhost:3001/api/${params.collection}/${params.id}`)
    if (!response.ok) {
      if (response.status === 404) {
        throw notFound()
      }
      throw new Error('Failed to fetch record')
    }
    return (await response.json()) as UpdateTypes[typeof params.collection & keyof UpdateTypes]
  },
  staleTime: 0,
  gcTime: 0,
  shouldReload: true,
  component: RouteComponent,
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const { collection, id } = Route.useParams()
  const collectionDef = getCollectionDefinition(collection) as CollectionDefinition

  return (
    <>
      <BreadcrumbsClient
        breadcrumbs={[
          { label: collectionDef.name, href: `/collections/${collection}` },
          {
            label: 'Edit',
            href: `/collections/${collection}/${id}`,
          },
        ]}
      />
      <EditView collectionDefinition={collectionDef} initialData={data} />
    </>
  )
}
