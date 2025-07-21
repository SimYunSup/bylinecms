import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../../database/schema/index.js';
import { createCommandBuilders } from '../storage/storage-commands.js';
import { createQueryBuilders } from '../storage/storage-queries.js';

// Initialize Byline config by importing the shared config package
// NOTE: This is a temporary workaround to ensure the config is loaded
// and will be changed once we refactor our Byline packages.
import '../../byline.config';

let pool: pg.Pool;
let db: NodePgDatabase<typeof schema>;
let commandBuilders: ReturnType<typeof createCommandBuilders>;
let queryBuilders: ReturnType<typeof createQueryBuilders>;

export function setupTestDB() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.POSTGRES_CONNECTION_STRING,
      max: 20,
      idleTimeoutMillis: 2000,
      connectionTimeoutMillis: 1000,
    });
  }

  if (!db) {
    db = drizzle(pool, { schema });
  }

  if (!commandBuilders) {
    commandBuilders = createCommandBuilders(db);
  }

  if (!queryBuilders) {
    queryBuilders = createQueryBuilders(db);
  }

  return { pool, db, commandBuilders, queryBuilders };
}

export async function teardownTestDB() {
  if (pool) {
    await pool.end();
    pool = undefined as any;
    db = undefined as any;
    commandBuilders = undefined as any;
    queryBuilders = undefined as any;
  }
}
