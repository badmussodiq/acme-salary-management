import { Injectable } from '@nestjs/common';
import type { Selectable } from 'kysely';
import type { UserRole } from '@acme/contracts';
import { DatabaseService } from '../database/database.service';
import type { UsersTable } from '../database/database.types';
import type { LockState } from './lockout';

export type UserRow = Selectable<UsersTable>;

export interface NewUser {
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  findByEmail(email: string): Promise<UserRow | undefined> {
    return this.database.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  findById(id: string): Promise<UserRow | undefined> {
    return this.database.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
  }

  async count(): Promise<number> {
    const row = await this.database.db
      .selectFrom('users')
      .select((builder) => builder.fn.countAll<string>().as('total'))
      .executeTakeFirstOrThrow();
    return Number(row.total);
  }

  async create(user: NewUser): Promise<void> {
    await this.database.db
      .insertInto('users')
      .values({ email: user.email, password_hash: user.passwordHash, role: user.role })
      .execute();
  }

  async bumpSessionVersion(id: string, currentVersion: number): Promise<void> {
    await this.database.db
      .updateTable('users')
      .set((eb) => ({ session_version: eb('session_version', '+', 1) }))
      .where('id', '=', id)
      .where('session_version', '=', currentVersion)
      .execute();
  }

  async saveLockState(id: string, state: LockState): Promise<void> {
    await this.database.db
      .updateTable('users')
      .set({ failed_login_count: state.failedLoginCount, locked_until: state.lockedUntil })
      .where('id', '=', id)
      .execute();
  }

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.database.db
      .updateTable('users')
      .set((eb) => ({
        password_hash: passwordHash,
        session_version: eb('session_version', '+', 1),
        failed_login_count: 0,
        locked_until: null,
      }))
      .where('id', '=', id)
      .execute();
  }
}
