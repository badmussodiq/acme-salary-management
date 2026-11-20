import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { InitialHrService } from '../src/auth/initial-hr.service';
import { APP_CONFIG, loadAppConfig, type AppConfig } from '../src/config/app-config';
import { configureApp } from '../src/configure-app';
import { ProbeController } from './probe.controller';
import { DatabaseService } from '../src/database/database.service';

export interface FakeDatabase {
  reachable: boolean;
}

export const createTestApp = async (
  overrides: Partial<AppConfig> = {},
  database: FakeDatabase = { reachable: true },
): Promise<NestExpressApplication> => {
  const config: AppConfig = { ...loadAppConfig({ NODE_ENV: 'test' }), ...overrides };
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [ProbeController],
  })
    .overrideProvider(APP_CONFIG)
    .useValue(config)
    .overrideProvider(InitialHrService)
    .useValue({})
    .overrideProvider(DatabaseService)
    .useValue({ isReachable: () => Promise.resolve(database.reachable) })
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, config);
  await app.init();
  return app;
};
