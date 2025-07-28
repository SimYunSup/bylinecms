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

import type { CollectionDefinition } from '@byline/byline'
import type { AnyCollectionSchemaTypes } from '@byline/byline/zod-schemas'
import { Button, Container, HistoryIcon, IconButton, Section } from '@byline/uikit/react'
import { useNavigate } from '@tanstack/react-router'
import { allExpanded, darkStyles, defaultStyles, JsonView } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'

export const ApiView = ({
  collectionDefinition,
  initialData,
}: {
  collectionDefinition: CollectionDefinition
  initialData: AnyCollectionSchemaTypes['UpdateType']
}) => {
  const navigate = useNavigate()
  const { labels, path } = collectionDefinition

  return (
    <Section>
      <Container>
        <div className="item-view flex flex-col sm:flex-row justify-start sm:justify-between mb-2">
          <h2 className="mb-2">{labels.singular} API</h2>
          <div className="flex items-center gap-2">
            <IconButton
              className="min-w-[24px] min-h-[24px]"
              size="sm"
              variant="text"
              onClick={() =>
                navigate({
                  to: '/collections/$collection/$id/history',
                  params: { collection: path, id: String(initialData.document_id) },
                })
              }
            >
              <HistoryIcon className="w-4 h-4" />
            </IconButton>
            <Button
              size="sm"
              variant="filled"
              className="min-w-[50px] min-h-[28px]"
              onClick={() =>
                navigate({
                  to: '/collections/$collection/$id',
                  params: { collection: path, id: String(initialData.document_id) },
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
                  to: '/collections/$collection/$id/api',
                  params: { collection: path, id: String(initialData.document_id) },
                })
              }
            >
              API
            </Button>
          </div>
        </div>
        <div className="border bg-canvas-800 rounded p-1 font-mono text-sm font-weight-normal">
          <JsonView
            data={initialData}
            shouldExpandNode={allExpanded}
            style={{ ...darkStyles, container: 'api-json-view' }}
          />
        </div>
      </Container>
    </Section>
  )
}
