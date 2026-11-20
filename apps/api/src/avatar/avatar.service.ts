import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { AVATAR_MAX_BYTES, type SessionUser } from '@acme/contracts';
import { AuditRepository } from '../audit/audit.repository';
import { AppException } from '../common/app.exception';
import { DatabaseService } from '../database/database.service';
import { OBJECT_STORAGE, type ObjectStorage, type StoredObject } from '../storage/object-storage';
import { sniffImageType } from './image-type';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

@Injectable()
export class AvatarService {
  constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  get enabled(): boolean {
    return this.storage.enabled;
  }

  private async currentKey(id: string): Promise<string | null> {
    const row = await this.database.db
      .selectFrom('employees')
      .select('avatar_key')
      .where('id', '=', id)
      .executeTakeFirst();
    if (!row) throw new AppException('NOT_FOUND', 'Employee not found');
    return row.avatar_key;
  }

  private setKey(
    id: string,
    key: string | null,
    before: string | null,
    actor: SessionUser,
    requestId: string,
  ): Promise<void> {
    return this.database.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('employees')
        .set({ avatar_key: key, updated_at: sql<Date>`now()` })
        .where('id', '=', id)
        .execute();
      await this.audit.record(trx, {
        actorUserId: actor.id,
        employeeId: id,
        action: 'employee.avatar_changed',
        before: { hasAvatar: before !== null },
        after: { hasAvatar: key !== null },
        requestId,
      });
    });
  }

  async upload(id: string, body: unknown, actor: SessionUser, requestId: string): Promise<void> {
    if (!this.storage.enabled) {
      throw new AppException('SERVICE_UNAVAILABLE', 'Profile pictures are not enabled');
    }
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw new AppException('UNSUPPORTED_MEDIA_TYPE', 'Upload a JPEG, PNG or WebP image');
    }
    if (body.length > AVATAR_MAX_BYTES) {
      throw new AppException('PAYLOAD_TOO_LARGE', 'The image must be 2 MB or smaller');
    }
    const type = sniffImageType(body);
    if (!type) throw new AppException('UNSUPPORTED_MEDIA_TYPE', 'Upload a JPEG, PNG or WebP image');

    const previous = await this.currentKey(id);
    const key = `avatars/${id}/${randomUUID()}.${EXTENSIONS[type]}`;
    await this.storage.put(key, body, type);
    await this.setKey(id, key, previous, actor, requestId);
    if (previous) await this.storage.delete(previous).catch(() => undefined);
  }

  async remove(id: string, actor: SessionUser, requestId: string): Promise<void> {
    const previous = await this.currentKey(id);
    if (!previous) return;
    await this.setKey(id, null, previous, actor, requestId);
    await this.storage.delete(previous).catch(() => undefined);
  }

  async fetch(id: string): Promise<StoredObject> {
    const key = await this.currentKey(id);
    const object = key ? await this.storage.get(key) : undefined;
    if (!object) throw new AppException('NOT_FOUND', 'No profile picture');
    return object;
  }
}
