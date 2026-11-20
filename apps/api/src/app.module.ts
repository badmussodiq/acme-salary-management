import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { OriginGuard } from './auth/origin.guard';
import { RolesGuard } from './auth/roles.guard';
import { APP_CONFIG, type AppConfig } from './config/app-config';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EmployeesModule } from './employees/employees.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => [
        { name: 'default', ttl: config.throttleTtlMs, limit: config.throttleLimit },
      ],
    }),
    DatabaseModule,
    AuthModule,
    AuditModule,
    EmployeesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
