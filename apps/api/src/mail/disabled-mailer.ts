import { Logger } from '@nestjs/common';
import type { Mailer, MailMessage } from './mailer';

export class DisabledMailer implements Mailer {
  readonly enabled = false;
  private readonly logger = new Logger('Mailer');

  send(message: MailMessage): Promise<void> {
    this.logger.warn(`Mail to ${message.to} not sent: SMTP is not configured`);
    return Promise.resolve();
  }
}
