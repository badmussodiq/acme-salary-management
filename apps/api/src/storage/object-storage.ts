export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface StoredObject {
  readonly body: Buffer;
  readonly contentType: string;
}

export interface ObjectStorage {
  readonly enabled: boolean;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | undefined>;
  delete(key: string): Promise<void>;
}
