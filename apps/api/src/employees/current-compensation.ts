import { sql, type Kysely } from 'kysely';
import type { Database } from '../database/database.types';

export const withCurrentCompensation = (executor: Kysely<Database>) =>
  executor.selectFrom('employees as e').leftJoin('compensations as c', (join) =>
    join
      .onRef('c.employee_id', '=', 'e.id')
      .on('c.effective_from', '<=', sql<string>`CURRENT_DATE`)
      .on((eb) =>
        eb.or([
          eb('c.effective_to', 'is', null),
          eb('c.effective_to', '>', sql<string>`CURRENT_DATE`),
        ]),
      ),
  );

export const CURRENT_COMPENSATION_SQL = sql`
  c.effective_from <= CURRENT_DATE AND (c.effective_to IS NULL OR c.effective_to > CURRENT_DATE)
`;
