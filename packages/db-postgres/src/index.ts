/**
 * Byline CMS Server Tests
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

import type { IDbAdapter } from '@byline/core'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from './database/schema/index.js'
import { createCommandBuilders } from './storage/storage-commands.js'
import { createQueryBuilders } from './storage/storage-queries.js'

export const pgAdapter = ({ connectionString }: { connectionString: string }): IDbAdapter => {
  const pool = new pg.Pool({
    connectionString: connectionString,
    max: 20,
    idleTimeoutMillis: 2000,
    connectionTimeoutMillis: 1000,
  })

  const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema })

  const commandBuilders = createCommandBuilders(db)
  const queryBuilders = createQueryBuilders(db)

  return { commands: commandBuilders, queries: queryBuilders }
}
