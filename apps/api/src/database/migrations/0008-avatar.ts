import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const avatar: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`ALTER TABLE employees ADD COLUMN avatar_key text`.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`ALTER TABLE employees DROP COLUMN avatar_key`.execute(db);
  },
};
