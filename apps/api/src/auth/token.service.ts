import { Inject, Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

const ISSUER = 'acme-salary-management';
const ALGORITHM = 'HS256';

export interface SessionClaims {
  readonly userId: string;
  readonly version: number;
}

@Injectable()
export class TokenService {
  private readonly key: Uint8Array;
  private readonly ttlHours: number;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.key = new TextEncoder().encode(config.jwtSecret);
    this.ttlHours = config.sessionTtlHours;
  }

  issue(claims: SessionClaims): Promise<string> {
    return new SignJWT({ ver: claims.version })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(claims.userId)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlHours}h`)
      .sign(this.key);
  }

  async verify(token: string): Promise<SessionClaims | undefined> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        algorithms: [ALGORITHM],
      });
      const version = payload['ver'];
      return payload.sub && typeof version === 'number'
        ? { userId: payload.sub, version }
        : undefined;
    } catch {
      return undefined;
    }
  }

  get maxAgeMs(): number {
    return this.ttlHours * 3_600_000;
  }
}
