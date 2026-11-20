import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const currentCompensationIndex: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`
      CREATE INDEX compensations_open_period_idx
      ON compensations (employee_id)
      INCLUDE (amount, currency_code, pay_frequency, effective_from)
      WHERE effective_to IS NULL
    `.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`DROP INDEX compensations_open_period_idx`.execute(db);
  },
};
