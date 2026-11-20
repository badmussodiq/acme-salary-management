import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { loadAppConfig } from '../config/app-config';
import { DatabaseService } from '../database/database.service';
import { DemoDataService } from './demo-data.service';

const run = async (): Promise<void> => {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const config = loadAppConfig(process.env);
  const reset = process.argv.includes('--reset');

  if (reset && config.nodeEnv === 'production') {
    throw new Error('Refusing to reset data when NODE_ENV is production');
  }

  const database = new DatabaseService(config);
  try {
    await database.migrate();
    const seeder = new DemoDataService(database, config);
    const result = await seeder.seed({ count: config.seedEmployeeCount, reset });
    process.stdout.write(
      result.skipped
        ? 'Synthetic employees already exist; nothing to do (use --reset to rebuild)\n'
        : `Seeded ${result.inserted} synthetic employees\n`,
    );
  } finally {
    await database.onApplicationShutdown();
  }
};

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
