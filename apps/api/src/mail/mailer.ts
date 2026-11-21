export const MAILER = Symbol('MAILER');

export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}

export interface Mailer {
  readonly enabled: boolean;
  send(message: MailMessage): Promise<void>;
}
