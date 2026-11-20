import { Inject, Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Migrator } from 'kysely/migration';
import { Pool, types } from 'pg';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import type { Database } from './database.types';
import { inCodeMigrationProvider } from './migrations';

types.setTypeParser(types.builtins.DATE, (value: string) => value);

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  readonly db: Kysely<Database>;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: config.databaseUrl,
          max: config.dbPoolMax,
          statement_timeout: config.dbStatementTimeoutMs,
          connectionTimeoutMillis: 5_000,
        }),
      }),
    });
  }

  async migrate(): Promise<void> {
    const migrator = new Migrator({ db: this.db, provider: inCodeMigrationProvider });
    const { error, results } = await migrator.migrateToLatest();
    results?.forEach((result) => {
      this.logger.log(`Migration ${result.migrationName}: ${result.status}`);
    });
    if (error) throw error;
  }

  async isReachable(): Promise<boolean> {
    try {
      await sql`SELECT 1`.execute(this.db);
      return true;
    } catch {
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.db.destroy();
  }
}
