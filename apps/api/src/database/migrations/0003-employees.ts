import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const employees: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`CREATE SEQUENCE employee_number_seq START 1`.execute(db);
    await sql`
      CREATE TABLE employees (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_number text NOT NULL
          DEFAULT ('EMP-' || lpad(nextval('employee_number_seq')::text, 6, '0')),
        first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 100),
        last_name text NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 100),
        email text NOT NULL CHECK (email = lower(email) AND char_length(email) <= 254),
        country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
        department text NOT NULL CHECK (char_length(department) BETWEEN 1 AND 100),
        job_title text NOT NULL CHECK (char_length(job_title) BETWEEN 1 AND 100),
        employment_status text NOT NULL DEFAULT 'active'
          CHECK (employment_status IN ('active', 'inactive')),
        hired_on date NOT NULL,
        is_synthetic boolean NOT NULL DEFAULT false,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `.execute(db);
    await sql`CREATE UNIQUE INDEX employees_employee_number_key ON employees (employee_number)`.execute(
      db,
    );
    await sql`CREATE UNIQUE INDEX employees_email_key ON employees (email)`.execute(db);
    await sql`CREATE INDEX employees_country_idx ON employees (country_code)`.execute(db);
    await sql`CREATE INDEX employees_department_idx ON employees (department)`.execute(db);
    await sql`CREATE INDEX employees_job_title_idx ON employees (job_title)`.execute(db);
    await sql`CREATE INDEX employees_status_idx ON employees (employment_status)`.execute(db);
    await sql`CREATE INDEX employees_hired_on_idx ON employees (hired_on)`.execute(db);
    await sql`
      CREATE INDEX employees_name_trgm_idx
      ON employees USING gin ((first_name || ' ' || last_name) gin_trgm_ops)
    `.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`DROP TABLE employees`.execute(db);
    await sql`DROP SEQUENCE employee_number_seq`.execute(db);
  },
};
