import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

export const auditEvents: Migration = {
  up: async (db: Kysely<unknown>): Promise<void> => {
    await sql`
      CREATE TABLE audit_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id uuid REFERENCES users (id),
        employee_id uuid REFERENCES employees (id),
        action text NOT NULL,
        before_snapshot jsonb NOT NULL DEFAULT 'null'::jsonb,
        after_snapshot jsonb NOT NULL DEFAULT 'null'::jsonb,
        request_id text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `.execute(db);
    await sql`
      CREATE INDEX audit_events_employee_idx ON audit_events (employee_id, created_at DESC)
    `.execute(db);
    await sql`
      CREATE FUNCTION audit_events_reject_change() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'audit_events is append-only';
      END
      $$
    `.execute(db);
    await sql`
      CREATE TRIGGER audit_events_append_only
      BEFORE UPDATE OR DELETE ON audit_events
      FOR EACH ROW EXECUTE FUNCTION audit_events_reject_change()
    `.execute(db);
  },
  down: async (db: Kysely<unknown>): Promise<void> => {
    await sql`DROP TABLE audit_events`.execute(db);
    await sql`DROP FUNCTION audit_events_reject_change()`.execute(db);
  },
};
