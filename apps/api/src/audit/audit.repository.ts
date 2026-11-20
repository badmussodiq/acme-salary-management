import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { AuditAction, AuditEventDto, JsonValue } from '@acme/contracts';
import { DatabaseService } from '../database/database.service';
import type { Database } from '../database/database.types';

export interface AuditRecord {
  readonly actorUserId: string;
  readonly employeeId: string;
  readonly action: AuditAction;
  readonly before: JsonValue;
  readonly after: JsonValue;
  readonly requestId: string;
}

@Injectable()
export class AuditRepository {
  constructor(private readonly database: DatabaseService) {}

  async record(executor: Kysely<Database>, event: AuditRecord): Promise<void> {
    await executor
      .insertInto('audit_events')
      .values({
        actor_user_id: event.actorUserId,
        employee_id: event.employeeId,
        action: event.action,
        before_snapshot: JSON.stringify(event.before),
        after_snapshot: JSON.stringify(event.after),
        request_id: event.requestId,
      })
      .execute();
  }

  async listForEmployee(
    employeeId: string,
    limit: number,
    offset: number,
  ): Promise<{ readonly events: readonly AuditEventDto[]; readonly total: number }> {
    const { db } = this.database;
    const [totalRow, rows] = await Promise.all([
      db
        .selectFrom('audit_events')
        .select((eb) => eb.fn.countAll<string>().as('total'))
        .where('employee_id', '=', employeeId)
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('audit_events as a')
        .leftJoin('users as u', 'u.id', 'a.actor_user_id')
        .select([
          'a.id',
          'a.employee_id',
          'a.action',
          'a.before_snapshot',
          'a.after_snapshot',
          'a.request_id',
          'a.created_at',
          'u.email as actor_email',
        ])
        .where('a.employee_id', '=', employeeId)
        .orderBy('a.created_at', 'desc')
        .orderBy('a.id')
        .limit(limit)
        .offset(offset)
        .execute(),
    ]);

    return {
      total: Number(totalRow.total),
      events: rows.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        actorEmail: row.actor_email,
        action: row.action,
        before: row.before_snapshot,
        after: row.after_snapshot,
        requestId: row.request_id,
        createdAt: row.created_at.toISOString(),
      })),
    };
  }
}
