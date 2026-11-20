import { Logger, type OnModuleInit } from '@nestjs/common';
import {
  BucketAlreadyOwnedByYou,
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchBucket,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AppException } from '../common/app.exception';
import type { S3Settings } from '../config/app-config';
import type { ObjectStorage, StoredObject } from './object-storage';

const unavailable = (): AppException =>
  new AppException('SERVICE_UNAVAILABLE', 'Profile picture storage is unavailable');

export class S3ObjectStorage implements ObjectStorage, OnModuleInit {
  readonly enabled = true;
  private readonly logger = new Logger(S3ObjectStorage.name);
  private readonly client: S3Client;

  constructor(private readonly settings: S3Settings) {
    this.client = new S3Client({
      region: settings.region,
      forcePathStyle: settings.forcePathStyle,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      ...(settings.endpoint ? { endpoint: settings.endpoint } : {}),
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucket();
      this.logger.log(`Bucket "${this.settings.bucket}" is ready`);
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown error';
      this.logger.warn(`Could not verify bucket "${this.settings.bucket}": ${reason}`);
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const write = () =>
      this.client.send(
        new PutObjectCommand({
          Bucket: this.settings.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    try {
      await write();
    } catch (error) {
      if (!(error instanceof NoSuchBucket)) throw unavailable();
      try {
        await this.ensureBucket();
        await write();
      } catch {
        throw unavailable();
      }
    }
  }

  async get(key: string): Promise<StoredObject | undefined> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.settings.bucket, Key: key }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) return undefined;
      return {
        body: Buffer.from(bytes),
        contentType: result.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (error instanceof NoSuchKey || error instanceof NoSuchBucket) return undefined;
      throw unavailable();
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.settings.bucket, Key: key }));
    } catch {
      throw unavailable();
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.settings.bucket }));
    } catch {
      await this.client
        .send(new CreateBucketCommand({ Bucket: this.settings.bucket }))
        .catch((error: unknown) => {
          if (!(error instanceof BucketAlreadyOwnedByYou)) throw error;
        });
    }
  }
}
