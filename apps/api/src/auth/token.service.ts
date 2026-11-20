import { Inject, Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

const ISSUER = 'acme-salary-management';
const ALGORITHM = 'HS256';

@Injectable()
export class TokenService {
  private readonly key: Uint8Array;
  private readonly ttlHours: number;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.key = new TextEncoder().encode(config.jwtSecret);
    this.ttlHours = config.sessionTtlHours;
  }

  issue(userId: string): Promise<string> {
    return new SignJWT({})
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(userId)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlHours}h`)
      .sign(this.key);
  }

  async verify(token: string): Promise<string | undefined> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        algorithms: [ALGORITHM],
      });
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  get maxAgeMs(): number {
    return this.ttlHours * 3_600_000;
  }
}
