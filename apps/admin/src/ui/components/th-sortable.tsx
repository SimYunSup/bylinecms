'use client'

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

import { Table } from '@byline/uikit/react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import cx from 'classnames'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  SortAscendingIcon,
  SortDescendingIcon,
  SortNeutralIcon,
} from '@/ui/components/sort-icons.tsx'

type TableHeadingCellProps = React.JSX.IntrinsicElements['th']

export interface TableHeadingCellSortableProps extends TableHeadingCellProps {
  label: string
  path?: string
  fieldName?: string
  sortable?: boolean
  desc?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
}

export function TableHeadingCellSortable({
  path = '/',
  fieldName,
  label,
  sortable = false,
  align = 'left',
  className,
  ...rest
}: TableHeadingCellSortableProps & {
  ref?: React.RefObject<HTMLTableCellElement>
}) {
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })
  const searchParams = useMemo(() => {
    return new URLSearchParams(location.search)
  }, [location])

  const [desc, setDesc] = useState<boolean | null>(null)

  const handleOnSort = (descending: boolean) => (): void => {
    if (fieldName != null) {
      searchParams.delete('page')
      searchParams.set('order', fieldName)
      searchParams.set('desc', descending ? 'true' : 'false')
      setDesc(descending)
      navigate({ to: `${location.pathname}?${searchParams?.toString()}` as string })
    }
  }

  useEffect(() => {
    if (fieldName != null) {
      const order = searchParams.get('order')
      const desc = searchParams.get('desc')
      if (order === fieldName) {
        setDesc(desc === 'true')
      } else {
        setDesc(null)
      }
    }
  }, [fieldName, searchParams])

  if (sortable === false) {
    return (
      <Table.HeadingCell className={className} {...rest}>
        {label}
      </Table.HeadingCell>
    )
  }

  const getSortIcon = () => {
    if (desc === null) {
      return <SortNeutralIcon />
    }
    if (desc === true) {
      return <SortDescendingIcon />
    }
    if (desc === false) {
      return <SortAscendingIcon />
    }
  }

  return (
    <Table.HeadingCell className={className} {...rest}>
      <button
        type="button"
        className={cx('flex font-bold text-[0.975rem] gap-1 pl-[2px] pr-[6px] hover:underline', {
          'ml-auto': align === 'right',
        })}
        onClick={handleOnSort(desc !== true)}
      >
        <span>{label}</span>
        {getSortIcon()}
      </button>
    </Table.HeadingCell>
  )
}
