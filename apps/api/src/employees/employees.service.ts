import { Injectable } from '@nestjs/common';
import type {
  EmployeeDetailDto,
  EmployeeFacetsDto,
  EmployeeSummaryDto,
  JsonValue,
  Paginated,
  SessionUser,
} from '@acme/contracts';
import { AuditRepository } from '../audit/audit.repository';
import { AppException } from '../common/app.exception';
import { isUniqueViolation } from '../common/database-errors';
import { toPageRequest, toPaginated } from '../common/pagination';
import { compensationSnapshot } from '../compensation/compensation.snapshot';
import { CompensationRepository, newCompensation } from '../compensation/compensation.repository';
import { DatabaseService } from '../database/database.service';
import type {
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import { toEmployeeDetail, toEmployeeSummary } from './employee.mapper';
import { EmployeesRepository, type EmployeePatch } from './employees.repository';

const EMAIL_CONFLICT = 'An employee with this email already exists';

const notFound = (): AppException => new AppException('NOT_FOUND', 'Employee not found');

interface FieldChange {
  readonly key: string;
  readonly column: keyof EmployeePatch;
  readonly before: string;
  readonly after: string;
}

const changeOf = <T extends string>(
  key: string,
  column: keyof EmployeePatch,
  next: T | undefined,
  current: string,
): FieldChange[] =>
  next !== undefined && next !== current ? [{ key, column, before: current, after: next }] : [];

@Injectable()
export class EmployeesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly employees: EmployeesRepository,
    private readonly compensations: CompensationRepository,
    private readonly audit: AuditRepository,
  ) {}

  async list(query: ListEmployeesQueryDto): Promise<Paginated<EmployeeSummaryDto>> {
    const request = toPageRequest(query);
    const { rows, total } = await this.employees.list(
      {
        search: query.search,
        countryCode: query.countryCode,
        department: query.department,
        jobTitle: query.jobTitle,
        employmentStatus: query.employmentStatus,
        currencyCode: query.currencyCode,
      },
      { by: query.sortBy ?? 'name', direction: query.sortDir ?? 'asc' },
      request.limit,
      request.offset,
    );
    return toPaginated(rows.map(toEmployeeSummary), total, request);
  }

  async get(id: string): Promise<EmployeeDetailDto> {
    const row = await this.employees.findDetail(id);
    if (!row) throw notFound();
    return toEmployeeDetail(row);
  }

  async ensureExists(id: string): Promise<void> {
    await this.get(id);
  }

  facets(): Promise<EmployeeFacetsDto> {
    return this.employees.facets();
  }

  async create(
    dto: CreateEmployeeDto,
    actor: SessionUser,
    requestId: string,
  ): Promise<EmployeeDetailDto> {
    const createdId = await this.database.db.transaction().execute(async (trx) => {
      const employee = await this.employees
        .insert(trx, {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          countryCode: dto.countryCode,
          department: dto.department,
          jobTitle: dto.jobTitle,
          hiredOn: dto.hiredOn,
          employmentStatus: dto.employmentStatus ?? 'active',
        })
        .catch((error: unknown) => {
          if (isUniqueViolation(error, 'employees_email_key')) {
            throw new AppException('CONFLICT', EMAIL_CONFLICT);
          }
          throw error;
        });

      const compensation = await this.compensations.insert(
        trx,
        newCompensation(employee.id, dto.compensation),
      );

      const base = { actorUserId: actor.id, employeeId: employee.id, requestId };
      await this.audit.record(trx, {
        ...base,
        action: 'employee.created',
        before: null,
        after: employeeSnapshot(employee),
      });
      await this.audit.record(trx, {
        ...base,
        action: 'compensation.added',
        before: null,
        after: compensationSnapshot(compensation),
      });
      return employee.id;
    });
    return this.get(createdId);
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
    actor: SessionUser,
    requestId: string,
  ): Promise<EmployeeDetailDto> {
    await this.database.db.transaction().execute(async (trx) => {
      const current = await this.employees.lockById(trx, id);
      if (!current) throw notFound();
      if (current.version !== dto.version) {
        throw new AppException(
          'CONFLICT',
          'This employee was changed by someone else. Reload and try again.',
        );
      }

      const changes = [
        ...changeOf('firstName', 'first_name', dto.firstName, current.first_name),
        ...changeOf('lastName', 'last_name', dto.lastName, current.last_name),
        ...changeOf('email', 'email', dto.email, current.email),
        ...changeOf('countryCode', 'country_code', dto.countryCode, current.country_code),
        ...changeOf('department', 'department', dto.department, current.department),
        ...changeOf('jobTitle', 'job_title', dto.jobTitle, current.job_title),
        ...changeOf(
          'employmentStatus',
          'employment_status',
          dto.employmentStatus,
          current.employment_status,
        ),
      ];
      if (changes.length === 0) {
        throw new AppException('VALIDATION_FAILED', 'No changes were provided');
      }

      const patch: EmployeePatch = Object.assign(
        {},
        ...changes.map((change) => ({ [change.column]: change.after })),
      );
      await this.employees.update(trx, id, patch).catch((error: unknown) => {
        if (isUniqueViolation(error, 'employees_email_key')) {
          throw new AppException('CONFLICT', EMAIL_CONFLICT);
        }
        throw error;
      });

      await this.audit.record(trx, {
        actorUserId: actor.id,
        employeeId: id,
        action: 'employee.updated',
        before: Object.fromEntries(changes.map((change) => [change.key, change.before])),
        after: Object.fromEntries(changes.map((change) => [change.key, change.after])),
        requestId,
      });
    });
    return this.get(id);
  }
}

const employeeSnapshot = (employee: {
  readonly employee_number: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly country_code: string;
  readonly department: string;
  readonly job_title: string;
  readonly employment_status: string;
  readonly hired_on: string;
}): JsonValue => ({
  employeeNumber: employee.employee_number,
  firstName: employee.first_name,
  lastName: employee.last_name,
  email: employee.email,
  countryCode: employee.country_code,
  department: employee.department,
  jobTitle: employee.job_title,
  employmentStatus: employee.employment_status,
  hiredOn: employee.hired_on,
});
