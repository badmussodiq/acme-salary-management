import type { Migration, MigrationProvider } from 'kysely/migration';
import { extensions } from './0001-extensions';
import { users } from './0002-users';
import { employees } from './0003-employees';
import { compensations } from './0004-compensations';
import { auditEvents } from './0005-audit-events';
import { currentCompensationIndex } from './0006-current-compensation-index';
import { sessionVersion } from './0007-session-version';

export const migrations: Readonly<Record<string, Migration>> = {
  '0001_extensions': extensions,
  '0002_users': users,
  '0003_employees': employees,
  '0004_compensations': compensations,
  '0005_audit_events': auditEvents,
  '0006_current_compensation_index': currentCompensationIndex,
  '0007_session_version': sessionVersion,
};

export const inCodeMigrationProvider: MigrationProvider = {
  getMigrations: () => Promise.resolve({ ...migrations }),
};
