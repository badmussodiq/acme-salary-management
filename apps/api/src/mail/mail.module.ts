import { Global, Module } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DisabledMailer } from './disabled-mailer';
import { MAILER, type Mailer } from './mailer';
import { SmtpMailer } from './smtp-mailer';

@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): Mailer =>
        config.smtp ? new SmtpMailer(config.smtp) : new DisabledMailer(),
    },
  ],
  exports: [MAILER],
})
export class MailModule {}
