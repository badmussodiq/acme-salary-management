import { Injectable } from '@nestjs/common';
import type { CompensationDto, SessionUser } from '@acme/contracts';
import { AuditRepository } from '../audit/audit.repository';
import { AppException } from '../common/app.exception';
import { isExclusionViolation } from '../common/database-errors';
import { DatabaseService } from '../database/database.service';
import type { CompensationInputDto } from '../employees/dto/employee.dto';
import { toCompensationDto } from '../employees/employee.mapper';
import { EmployeesRepository } from '../employees/employees.repository';
import { CompensationRepository, newCompensation } from './compensation.repository';
import { planCompensationChange } from './compensation.rules';
import { compensationSnapshot } from './compensation.snapshot';

@Injectable()
export class CompensationService {
  constructor(
    private readonly database: DatabaseService,
    private readonly employees: EmployeesRepository,
    private readonly compensations: CompensationRepository,
    private readonly audit: AuditRepository,
  ) {}

  async history(employeeId: string): Promise<readonly CompensationDto[]> {
    const employee = await this.employees.findDetail(employeeId);
    if (!employee) throw new AppException('NOT_FOUND', 'Employee not found');
    const rows = await this.compensations.listForEmployee(employeeId);
    return rows.map(toCompensationDto);
  }

  add(
    employeeId: string,
    input: CompensationInputDto,
    actor: SessionUser,
    requestId: string,
  ): Promise<CompensationDto> {
    return this.database.db.transaction().execute(async (trx) => {
      if (!(await this.employees.lockById(trx, employeeId))) {
        throw new AppException('NOT_FOUND', 'Employee not found');
      }

      const history = await this.compensations.listForEmployee(employeeId, trx);
      const plan = planCompensationChange(
        history.map((row) => ({
          id: row.id,
          effectiveFrom: row.effective_from,
          effectiveTo: row.effective_to,
        })),
        input.effectiveFrom,
      );

      const previous = history.find((row) => row.id === plan.closeId);
      if (plan.closeId) await this.compensations.close(trx, plan.closeId, input.effectiveFrom);

      const created = await this.compensations
        .insert(trx, newCompensation(employeeId, input))
        .catch((error: unknown) => {
          if (isExclusionViolation(error)) {
            throw new AppException('CONFLICT', 'Compensation periods must not overlap');
          }
          throw error;
        });

      await this.audit.record(trx, {
        actorUserId: actor.id,
        employeeId,
        action: 'compensation.added',
        before: previous ? compensationSnapshot(previous) : null,
        after: compensationSnapshot(created),
        requestId,
      });
      return toCompensationDto(created);
    });
  }
}
