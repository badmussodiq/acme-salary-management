import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: DatabaseService,
      inject: [APP_CONFIG],
      useFactory: async (config: AppConfig): Promise<DatabaseService> => {
        const service = new DatabaseService(config);
        await service.migrate();
        return service;
      },
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
