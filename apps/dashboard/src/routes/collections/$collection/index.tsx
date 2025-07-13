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
import { getCollectionSchemasForPath } from '@byline/byline/schemas/zod/cache'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { BreadcrumbsClient } from '@/context/breadcrumbs/breadcrumbs-client'
import { ListView } from '@/modules/collections/list'

const searchSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  page_size: z.coerce.number().min(1).max(100).optional(),
  order: z.string().optional(),
  desc: z.boolean().optional(),
  query: z.string().optional(),
  locale: z.string().optional(),
})

export const Route = createFileRoute('/collections/$collection/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { page, page_size, order, desc, query, locale } }) => ({
    page,
    page_size,
    order,
    desc,
    query,
    locale,
  }),
  loader: async ({ params, deps: { page, page_size, order, desc, query, locale } }) => {
    const collectionDef = getCollectionDefinition(params.collection)
    if (!collectionDef) {
      throw notFound()
    }

    // Get typed schemas for better type inference
    const { list } = getCollectionSchemasForPath(params.collection)

    // // Parse search parameters from location
    const searchParams = new URLSearchParams()

    if (page) {
      searchParams.set('page', page.toString())
    }
    if (page_size) {
      searchParams.set('page_size', page_size.toString())
    }
    if (order) {
      searchParams.set('order', order)
    }
    if (desc) {
      searchParams.set('desc', desc ? 'true' : 'false')
    }
    if (query) {
      searchParams.set('query', query)
    }
    if (locale) {
      searchParams.set('locale', locale)
    }

    const queryString = searchParams.toString()
    const url = `http://localhost:3001/api/${params.collection}${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch collection')
    }

    const rawData = await response.json()
    console.log('Raw data:', rawData)
    // Validate with schema for runtime type safety
    const data = list.parse(rawData)

    return data
  },
  component: RouteComponent,
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const { collection } = Route.useParams()
  const collectionDef = getCollectionDefinition(collection) as CollectionDefinition
  const columns = collectionDef.columns || []

  return (
    <>
      <BreadcrumbsClient
        breadcrumbs={[
          { label: data.included.collection.labels.plural, href: `/collections/${collection}` },
        ]}
      />
      <ListView data={data} columns={columns} />
    </>
  )
}
