import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { loadAppConfig } from './config/app-config';
import { configureApp } from './configure-app';

const bootstrap = async (): Promise<void> => {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const config = loadAppConfig(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApp(app, config);
  await app.listen(config.port);
  new Logger('Bootstrap').log(`API listening on port ${config.port}`);
};

void bootstrap();
