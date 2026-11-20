import { Injectable, Logger } from '@nestjs/common';
import type { SessionUser } from '@acme/contracts';
import { AppException } from '../common/app.exception';
import { afterFailedLogin, afterSuccessfulLogin, isLocked } from './lockout';
import { burnPasswordCheck, verifyPassword } from './password';
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: TokenService,
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

  async logout(token: string | undefined): Promise<void> {
    const claims = token ? await this.tokens.verify(token) : undefined;
    if (!claims) return;
    await this.users.bumpSessionVersion(claims.userId, claims.version);
    this.logger.log(`User ${claims.userId} signed out; existing sessions revoked`);
  }
}
