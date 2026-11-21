import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SessionUser } from '@acme/contracts';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { MAILER, type Mailer } from '../mail/mailer';
import { AppException } from '../common/app.exception';
import { afterFailedLogin, afterSuccessfulLogin, isLocked } from './lockout';
import { burnPasswordCheck, hashPassword, verifyPassword } from './password';
import { TokenService } from './token.service';
import { UsersRepository, type UserRow } from './users.repository';

export interface LoginResult {
  readonly user: SessionUser;
  readonly token: string;
}

const invalidCredentials = (): AppException =>
  new AppException('UNAUTHENTICATED', 'Invalid email or password');

const lockStateOf = (user: UserRow) => ({
  failedLoginCount: user.failed_login_count,
  lockedUntil: user.locked_until,
});

const fingerprintOf = (passwordHash: string): string =>
  createHash('sha256').update(passwordHash).digest('hex').slice(0, 32);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: TokenService,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async login(email: string, password: string, now: Date = new Date()): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);

    if (!user || user.status !== 'active' || isLocked(lockStateOf(user), now)) {
      this.logger.warn(
        user
          ? `Login rejected for user ${user.id} (disabled or locked)`
          : 'Login rejected: unknown account',
      );
      await burnPasswordCheck(password);
      throw invalidCredentials();
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      const next = afterFailedLogin(lockStateOf(user), now);
      await this.users.saveLockState(user.id, next);
      this.logger.warn(
        next.lockedUntil && next.lockedUntil !== user.locked_until
          ? `User ${user.id} locked after repeated failed logins`
          : `Failed login for user ${user.id}`,
      );
      throw invalidCredentials();
    }

    await this.users.saveLockState(user.id, afterSuccessfulLogin());
    return {
      user: { id: user.id, email: user.email, role: user.role },
      token: await this.tokens.issue({ userId: user.id, version: user.session_version }),
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.status !== 'active') return;

    const token = await this.tokens.issueReset(user.id, fingerprintOf(user.password_hash));
    const link = new URL('/reset-password', this.config.webOrigin);
    link.searchParams.set('token', token);

    this.mailer
      .send({
        to: user.email,
        subject: 'Reset your ACME Salary password',
        text: [
          'We received a request to reset your password.',
          '',
          `Choose a new one here (valid for 30 minutes, single use): ${link.toString()}`,
          '',
          'If you did not ask for this, you can ignore this email.',
        ].join('\n'),
      })
      .catch((error: unknown) =>
        this.logger.error(`Password reset mail for user ${user.id} failed: ${String(error)}`),
      );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const claims = await this.tokens.verifyReset(token);
    const user = claims ? await this.users.findById(claims.userId) : undefined;
    if (
      !claims ||
      !user ||
      user.status !== 'active' ||
      claims.fingerprint !== fingerprintOf(user.password_hash)
    ) {
      throw new AppException('VALIDATION_FAILED', 'This reset link is invalid or has expired');
    }
    await this.users.setPassword(user.id, await hashPassword(password));
    this.logger.log(`User ${user.id} reset their password; existing sessions revoked`);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<string> {
    const user = await this.users.findById(userId);
    if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
      throw new AppException('VALIDATION_FAILED', 'Current password is incorrect', [
        { field: 'currentPassword', message: 'Current password is incorrect' },
      ]);
    }
    await this.users.setPassword(user.id, await hashPassword(newPassword));
    this.logger.log(`User ${user.id} changed their password; other sessions revoked`);
    return this.tokens.issue({ userId: user.id, version: user.session_version + 1 });
  }

  async logout(token: string | undefined): Promise<void> {
    const claims = token ? await this.tokens.verify(token) : undefined;
    if (!claims) return;
    await this.users.bumpSessionVersion(claims.userId, claims.version);
    this.logger.log(`User ${claims.userId} signed out; existing sessions revoked`);
  }
}
