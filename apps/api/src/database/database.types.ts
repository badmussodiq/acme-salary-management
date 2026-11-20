import type { ColumnType, Generated } from 'kysely';
import type {
  AuditAction,
  CountryCode,
  CurrencyCode,
  EmploymentStatus,
  JsonValue,
  PayFrequency,
  UserRole,
} from '@acme/contracts';

type DateOnly = ColumnType<string, string, string>;
type Money = ColumnType<string, string, string>;

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: UserRole;
  status: Generated<'active' | 'disabled'>;
  failed_login_count: Generated<number>;
  locked_until: Date | null;
  session_version: Generated<number>;
  created_at: Generated<Date>;
}

export interface EmployeesTable {
  id: Generated<string>;
  employee_number: Generated<string>;
  first_name: string;
  last_name: string;
  email: string;
  country_code: CountryCode;
  department: string;
  job_title: string;
  employment_status: Generated<EmploymentStatus>;
  hired_on: DateOnly;
  is_synthetic: Generated<boolean>;
  version: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CompensationsTable {
  id: Generated<string>;
  employee_id: string;
  amount: Money;
  currency_code: CurrencyCode;
  pay_frequency: PayFrequency;
  effective_from: DateOnly;
  effective_to: ColumnType<string | null, string | null | undefined, string | null>;
  created_at: Generated<Date>;
}

export interface AuditEventsTable {
  id: Generated<string>;
  actor_user_id: string | null;
  employee_id: string | null;
  action: AuditAction;
  before_snapshot: ColumnType<JsonValue, string, never>;
  after_snapshot: ColumnType<JsonValue, string, never>;
  request_id: string;
  created_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  employees: EmployeesTable;
  compensations: CompensationsTable;
  audit_events: AuditEventsTable;
}
