import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const sessionVersion: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`ALTER TABLE users ADD COLUMN session_version integer NOT NULL DEFAULT 1`.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`ALTER TABLE users DROP COLUMN session_version`.execute(db);
  },
};
