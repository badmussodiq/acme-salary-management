import { createTransport, type Transporter } from 'nodemailer';
import type { SmtpSettings } from '../config/app-config';
import type { Mailer, MailMessage } from './mailer';

export class SmtpMailer implements Mailer {
  readonly enabled = true;
  private readonly transport: Transporter;

  constructor(private readonly settings: SmtpSettings) {
    this.transport = createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: settings.user ? { user: settings.user, pass: settings.password } : undefined,
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.settings.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
