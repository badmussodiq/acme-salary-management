import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DisabledObjectStorage } from './disabled-object-storage';
import { OBJECT_STORAGE, type ObjectStorage } from './object-storage';
import { S3ObjectStorage } from './s3-object-storage';

@Global()
@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): ObjectStorage =>
        config.s3 ? new S3ObjectStorage(config.s3) : new DisabledObjectStorage(),
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
