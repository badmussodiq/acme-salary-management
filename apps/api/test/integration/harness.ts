import { randomInt, randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { sql } from 'kysely';
import { Client } from 'pg';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { AppModule } from '../../src/app.module';
import { hashPassword } from '../../src/auth/password';
import { MAILER, type Mailer, type MailMessage } from '../../src/mail/mailer';
import { UsersRepository } from '../../src/auth/users.repository';
import { APP_CONFIG, loadAppConfig, type AppConfig } from '../../src/config/app-config';
import { configureApp } from '../../src/configure-app';
import { DatabaseService } from '../../src/database/database.service';

const ADMIN_URL =
  process.env['TEST_DATABASE_ADMIN_URL'] ?? 'postgres://acme:acme@localhost:5432/postgres';

const withDatabase = (url: string, name: string): string => {
  const parsed = new URL(url);
  parsed.pathname = `/${name}`;
  return parsed.toString();
};

const adminQuery = async (statement: string): Promise<void> => {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  try {
    await client.query(statement);
  } finally {
    await client.end();
  }
};

export const randomIp = (): string =>
  `10.${randomInt(0, 256)}.${randomInt(0, 256)}.${randomInt(1, 255)}`;

export interface IntegrationApp {
  readonly app: NestExpressApplication;
  readonly config: AppConfig;
  readonly database: DatabaseService;
  readonly users: UsersRepository;
  readonly mailbox: MailMessage[];
  anonymous(): TestAgent;
  loginAgent(email?: string, password?: string): Promise<TestAgent>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

export const hrCredentials = () => {
  const { initialHr } = loadAppConfig({});
  if (!initialHr) throw new Error('Development HR credentials are not configured');
  return initialHr;
};

export const startIntegrationApp = async (
  overrides: Partial<AppConfig> = {},
): Promise<IntegrationApp> => {
  const databaseName = `acme_test_${randomUUID().replaceAll('-', '')}`;
  await adminQuery(`CREATE DATABASE "${databaseName}"`);

  const config: AppConfig = {
    ...loadAppConfig({ NODE_ENV: 'test' }),
    databaseUrl: withDatabase(ADMIN_URL, databaseName),
    trustProxyHops: 1,
    throttleLimit: 100_000,
    ...overrides,
  };

  const mailbox: MailMessage[] = [];
  const capturingMailer: Mailer = {
    enabled: true,
    send: (message) => {
      mailbox.push(message);
      return Promise.resolve();
    },
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(APP_CONFIG)
    .useValue(config)
    .overrideProvider(MAILER)
    .useValue(capturingMailer)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app, config);
  await app.init();

  const database = app.get(DatabaseService);
  const users = app.get(UsersRepository);
  const { initialHr } = config;

  const anonymous = (): TestAgent =>
    request.agent(app.getHttpServer()).set('X-Forwarded-For', randomIp());

  return {
    app,
    config,
    database,
    users,
    mailbox,
    anonymous,
    loginAgent: async (
      email = initialHr?.email ?? '',
      password = initialHr?.password ?? '',
    ): Promise<TestAgent> => {
      const agent = anonymous();
      const response = await agent.post('/api/v1/auth/login').send({ email, password });
      if (response.status !== 200) throw new Error(`Login failed with status ${response.status}`);
      return agent;
    },
    reset: async (): Promise<void> => {
      await sql`TRUNCATE audit_events, compensations, employees`.execute(database.db);
      await sql`ALTER SEQUENCE employee_number_seq RESTART WITH 1`.execute(database.db);
    },
    close: async (): Promise<void> => {
      await app.close();
      await adminQuery(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    },
  };
};

export const createUser = async (
  context: IntegrationApp,
  email: string,
  password: string,
): Promise<void> => {
  await context.users.create({
    email,
    passwordHash: await hashPassword(password),
    role: 'hr_manager',
  });
};
