import type { IDbAdapter } from '@byline/core'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './database/schema/index.js';
import { createCommandBuilders } from './storage/storage-commands.js';
import { createQueryBuilders } from './storage/storage-queries.js';

export const pgAdapter = ({ connectionString }: { connectionString: string }): IDbAdapter => {
  const pool = new pg.Pool({
    connectionString: connectionString,
    max: 20,
    idleTimeoutMillis: 2000,
    connectionTimeoutMillis: 1000,
  });

  const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

  const commandBuilders = createCommandBuilders(db);
  const queryBuilders = createQueryBuilders(db);

  return { commands: commandBuilders, queries: queryBuilders };
}
