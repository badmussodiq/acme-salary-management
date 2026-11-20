import { Injectable } from '@nestjs/common';
import type { SessionUser } from '@acme/contracts';
import { AppException } from '../common/app.exception';
import { afterFailedLogin, afterSuccessfulLogin, isLocked } from './lockout';
import { burnPasswordCheck, verifyPassword } from './password';
import { TokenService } from './token.service';
import { UsersRepository } from './users.repository';

export interface LoginResult {
  readonly user: SessionUser;
  readonly token: string;
}

const invalidCredentials = (): AppException =>
  new AppException('UNAUTHENTICATED', 'Invalid email or password');

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly tokens: TokenService,
  ) {}

  async login(email: string, password: string, now: Date = new Date()): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);

    if (
      !user ||
      user.status !== 'active' ||
      isLocked({ failedLoginCount: user.failed_login_count, lockedUntil: user.locked_until }, now)
    ) {
      await burnPasswordCheck(password);
      throw invalidCredentials();
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      await this.users.saveLockState(
        user.id,
        afterFailedLogin(
          { failedLoginCount: user.failed_login_count, lockedUntil: user.locked_until },
          now,
        ),
      );
      throw invalidCredentials();
    }

    await this.users.saveLockState(user.id, afterSuccessfulLogin());
    return {
      user: { id: user.id, email: user.email, role: user.role },
      token: await this.tokens.issue(user.id),
    };
  }
}
