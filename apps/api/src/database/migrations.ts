import { sql, type Kysely } from 'kysely';
import type { Migration, MigrationProvider } from 'kysely/migration';

const enableTrigramSearch: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`DROP EXTENSION IF EXISTS pg_trgm`.execute(db);
  },
};

export const migrations: Readonly<Record<string, Migration>> = {
  '0001_enable_trigram_search': enableTrigramSearch,
};

export const inCodeMigrationProvider: MigrationProvider = {
  getMigrations: () => Promise.resolve({ ...migrations }),
};
