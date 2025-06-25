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

import {
  Container,
  IconButton,
  LoaderRing,
  PlusIcon,
  Search,
  Section,
  Select,
  SelectItem,
  Table,
} from '@byline/uikit/react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import cx from 'classnames'
import { useState } from 'react'
import { RouterPager } from '@/ui/components/router-pager'
import {
  TableHeadingCellSortable,
  type TableHeadingCellSortableProps,
} from '@/ui/components/th-sortable.tsx'
import { formatDateTime, formatNumber } from '@/utils/utils.general.ts'

import type { PagesResponse } from './@types'

// TODO: Extract from Pages collection definition
const tableColumnDefs: Omit<TableHeadingCellSortableProps, 'lng'>[] = [
  {
    fieldName: 'name',
    label: 'Title',
    path: '/collections/pages',
    sortable: true,
    scope: 'col',
    align: 'left',
    className: 'w-[30%]',
  },
  {
    fieldName: 'updated_at',
    label: 'Last Updated',
    path: '/collections/pages',
    sortable: true,
    scope: 'col',
    align: 'right',
    className: 'w-[20%]',
  },
]

function Stats({ total }: { total: number }) {
  // const progress = useProgressBarContext()
  // const [showLoader, setShowLoader] = useState(false)
  const [showLoader, _] = useState(false)

  // useEffect(() => {
  //   let timeoutId: NodeJS.Timeout
  //   if (progress.loading === true) {
  //     timeoutId = setTimeout(() => {
  //       setShowLoader(true)
  //     }, 200)
  //   } else {
  //     setShowLoader(false)
  //   }

  //   return () => {
  //     if (timeoutId) {
  //       clearTimeout(timeoutId)
  //     }
  //   }
  // }, [progress.loading])

  if (showLoader) {
    return <LoaderRing className="mr-auto -mb-[4px]" size={24} color="#666666" />
  }
  return (
    <span
      className={cx(
        'flex items-center justify-center mr-auto h-[28px] min-w-[28px] px-[6px] py-[5px] -mb-[4px]',
        'whitespace-nowrap text-sm leading-0',
        'bg-gray-25 dark:bg-canvas-700 border rounded-md'
      )}
    >
      {formatNumber(total as number, 0)}
    </span>
  )
}

function padRows(value: number) {
  return Array.from({ length: value }).map((_, index) => (
    <div
      key={`empty-row-${
        // biome-ignore lint/suspicious/noArrayIndexKey: we're okay here
        index
      }`}
      className="h-[32px] border-none"
    >
      &nbsp;
    </div>
  ))
}

export const CollectionView = ({ data }: { data: PagesResponse }) => {
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })
  const searchParams = new URLSearchParams(location.search)

  const handleOnSearch = (query: string): void => {
    if (query != null && query.length > 0) {
      searchParams.delete('page')
      searchParams.set('query', query)
      navigate({ to: `/collections/pages?${searchParams?.toString()}` as string })
    }
  }

  const handleOnClear = (): void => {
    searchParams.delete('page')
    searchParams.delete('query')
    navigate({ to: `/collections/pages?${searchParams?.toString()}` as string })
  }

  function handleOnPageSizeChange(value: string): void {
    if (value != null && value.length > 0) {
      searchParams.delete('page')
      searchParams.set('page_size', value)
      navigate({
        to: `/collections/pages?${searchParams?.toString()}` as string,
      })
    }
  }

  return (
    <Section>
      <Container>
        <div className="flex items-center gap-3 py-[2px]">
          <h1 className="!m-0 pb-[2px]">Pages</h1>
          <Stats total={data?.meta.total} />
          <IconButton aria-label="Create New" asChild>
            <Link to="/collections/pages/create">
              <PlusIcon height="18px" width="18px" svgClassName="stroke-white" />
            </Link>
          </IconButton>
        </div>
        <div className="options flex flex-col gap-2 sm:flex-row items-start sm:items-center mt-3 mb-3">
          <Search
            onSearch={handleOnSearch}
            onClear={handleOnClear}
            inputSize="sm"
            placeholder="Search"
            className="mr-auto w-full max-w-[350px]"
          />

          <RouterPager
            lng="en"
            page={data?.meta.page}
            count={data?.meta.total_pages}
            showFirstButton
            showLastButton
            componentName="pagerTop"
            aria-label="Top Pager"
          />
        </div>
        <Table.Container className="mt-2 mb-3">
          <Table>
            <Table.Header>
              <Table.Row>
                {tableColumnDefs.map((column) => {
                  return (
                    <TableHeadingCellSortable key={column.fieldName} {...column} ref={undefined} />
                  )
                })}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {data?.pages?.map((page) => {
                return (
                  <Table.Row key={page.id}>
                    <Table.Cell>
                      <Link to="/collections/pages/$postid" params={{ postid: page.id }}>
                        {page.title ?? '------'}
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      {formatDateTime(page.created_at)}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
          {padRows(6 - (data?.pages?.length ?? 0))}
        </Table.Container>
        <div className="options flex flex-col gap-2 sm:flex-row items-start sm:items-center mb-5">
          <Select
            containerClassName="sm:ml-auto"
            id="page_size"
            name="page_size"
            size="sm"
            defaultValue="15"
            onValueChange={handleOnPageSizeChange}
          >
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </Select>
          <RouterPager
            smoothScrollToTop={true}
            lng="en"
            page={data?.meta.page}
            count={data?.meta.total_pages}
            showFirstButton
            showLastButton
            componentName="pagerBottom"
            aria-label="Bottom Pager"
          />
        </div>
      </Container>
    </Section>
  )
}
