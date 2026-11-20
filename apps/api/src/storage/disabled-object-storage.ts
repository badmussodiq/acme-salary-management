import { AppException } from '../common/app.exception';
import type { ObjectStorage, StoredObject } from './object-storage';

const notConfigured = (): AppException =>
  new AppException('SERVICE_UNAVAILABLE', 'Profile pictures are not enabled on this server');

export class DisabledObjectStorage implements ObjectStorage {
  readonly enabled = false;

  put(): Promise<void> {
    return Promise.reject(notConfigured());
  }

  get(): Promise<StoredObject | undefined> {
    return Promise.resolve(undefined);
  }

  delete(): Promise<void> {
    return Promise.resolve();
  }
}
