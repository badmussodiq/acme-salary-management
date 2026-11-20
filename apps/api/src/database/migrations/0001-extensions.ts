import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const extensions: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);
    await sql`CREATE EXTENSION IF NOT EXISTS btree_gist`.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`DROP EXTENSION IF EXISTS btree_gist`.execute(db);
    await sql`DROP EXTENSION IF EXISTS pg_trgm`.execute(db);
  },
};
