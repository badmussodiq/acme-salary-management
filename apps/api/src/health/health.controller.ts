import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { LiveResponse, ReadyResponse } from '@acme/contracts';
import { Public } from '../auth/auth.decorators';
import { AppException } from '../common/app.exception';
import { DatabaseService } from '../database/database.service';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('live')
  live(): LiveResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<ReadyResponse> {
    if (!(await this.database.isReachable())) {
      throw new AppException('SERVICE_UNAVAILABLE', 'Database is unavailable');
    }
    return { status: 'ok', checks: { database: 'ok' } };
  }
}
