import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const users: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL CHECK (email = lower(email) AND char_length(email) <= 254),
        password_hash text NOT NULL,
        role text NOT NULL CHECK (role IN ('hr_manager')),
        status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
        failed_login_count integer NOT NULL DEFAULT 0,
        locked_until timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `.execute(db);
    await sql`CREATE UNIQUE INDEX users_email_key ON users (email)`.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`DROP TABLE users`.execute(db);
  },
};
