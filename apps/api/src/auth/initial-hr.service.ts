import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { hashPassword } from './password';
import { UsersRepository } from './users.repository';

@Injectable()
export class InitialHrService implements OnModuleInit {
  private readonly logger = new Logger(InitialHrService.name);

  constructor(
    private readonly users: UsersRepository,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    if ((await this.users.count()) > 0) return;

    const { initialHr } = this.config;
    if (!initialHr) {
      this.logger.warn('No users exist and INITIAL_HR_EMAIL / INITIAL_HR_PASSWORD are not set');
      return;
    }

    await this.users.create({
      email: initialHr.email,
      passwordHash: await hashPassword(initialHr.password),
      role: 'hr_manager',
    });
    this.logger.log(`Created initial HR manager ${initialHr.email}`);
  }
}
