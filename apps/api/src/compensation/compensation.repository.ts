import { Injectable } from '@nestjs/common';
import type { Kysely, Selectable } from 'kysely';
import type { CompensationInput, CurrencyCode, PayFrequency } from '@acme/contracts';
import { DatabaseService } from '../database/database.service';
import type { CompensationsTable, Database } from '../database/database.types';

export interface NewCompensation {
  readonly employeeId: string;
  readonly amount: string;
  readonly currencyCode: CurrencyCode;
  readonly payFrequency: PayFrequency;
  readonly effectiveFrom: string;
}

type Executor = Kysely<Database>;

export const newCompensation = (employeeId: string, input: CompensationInput): NewCompensation => ({
  employeeId,
  amount: input.amount,
  currencyCode: input.currencyCode,
  payFrequency: input.payFrequency,
  effectiveFrom: input.effectiveFrom,
});

@Injectable()
export class CompensationRepository {
  constructor(private readonly database: DatabaseService) {}

  listForEmployee(
    employeeId: string,
    executor: Executor = this.database.db,
  ): Promise<Selectable<CompensationsTable>[]> {
    return executor
      .selectFrom('compensations')
      .selectAll()
      .where('employee_id', '=', employeeId)
      .orderBy('effective_from', 'desc')
      .execute();
  }

  close(executor: Executor, id: string, effectiveTo: string) {
    return executor
      .updateTable('compensations')
      .set({ effective_to: effectiveTo })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  insert(executor: Executor, compensation: NewCompensation) {
    return executor
      .insertInto('compensations')
      .values({
        employee_id: compensation.employeeId,
        amount: compensation.amount,
        currency_code: compensation.currencyCode,
        pay_frequency: compensation.payFrequency,
        effective_from: compensation.effectiveFrom,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
