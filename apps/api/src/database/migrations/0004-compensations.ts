import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const compensations: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`
      CREATE TABLE compensations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id uuid NOT NULL REFERENCES employees (id),
        amount numeric(14, 2) NOT NULL CHECK (amount > 0),
        currency_code text NOT NULL CHECK (currency_code ~ '^[A-Z]{3}$'),
        pay_frequency text NOT NULL CHECK (pay_frequency IN ('annual', 'monthly', 'hourly')),
        effective_from date NOT NULL,
        effective_to date,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT compensations_valid_range
          CHECK (effective_to IS NULL OR effective_to > effective_from),
        CONSTRAINT compensations_no_overlap
          EXCLUDE USING gist (employee_id WITH =, daterange(effective_from, effective_to) WITH &&)
      )
    `.execute(db);
    await sql`
      CREATE INDEX compensations_employee_idx ON compensations (employee_id, effective_from DESC)
    `.execute(db);
    await sql`CREATE INDEX compensations_currency_idx ON compensations (currency_code)`.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`DROP TABLE compensations`.execute(db);
  },
};
