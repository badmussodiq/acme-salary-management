import { plainToInstance, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export const APP_CONFIG = Symbol('APP_CONFIG');

export interface AppConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly port: number;
  readonly databaseUrl: string;
  readonly webOrigin: string;
  readonly trustProxyHops: number;
  readonly bodyLimit: string;
  readonly throttleTtlMs: number;
  readonly throttleLimit: number;
  readonly dbPoolMax: number;
  readonly dbStatementTimeoutMs: number;
  readonly jwtSecret: string;
  readonly sessionTtlHours: number;
  readonly cookieSecure: boolean;
  readonly initialHr: InitialHr | undefined;
  readonly seedDemoData: boolean;
  readonly seedEmployeeCount: number;
}

export interface InitialHr {
  readonly email: string;
  readonly password: string;
}

export const DEVELOPMENT_JWT_SECRET = 'development-only-secret-replace-me-before-deploying';

class RawEnvironment {
  @IsIn(NODE_ENVIRONMENTS) NODE_ENV: NodeEnvironment = 'development';
  @Type(() => Number) @IsInt() @Min(1) @Max(65535) PORT = 3001;
  @Matches(/^postgres(ql)?:\/\/\S+$/) DATABASE_URL = 'postgres://acme:acme@localhost:5432/acme';
  @IsUrl({ require_tld: false, protocols: ['http', 'https'], require_protocol: true })
  WEB_ORIGIN = 'http://localhost:3000';
  @Type(() => Number) @IsInt() @Min(0) @Max(10) TRUST_PROXY_HOPS = 0;
  @Matches(/^\d+(kb|mb)$/) BODY_LIMIT = '100kb';
  @Type(() => Number) @IsInt() @Min(1000) THROTTLE_TTL_MS = 60_000;
  @Type(() => Number) @IsInt() @Min(1) THROTTLE_LIMIT = 100;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) DB_POOL_MAX = 10;
  @Type(() => Number) @IsInt() @Min(100) DB_STATEMENT_TIMEOUT_MS = 10_000;
  @IsString() @MinLength(32) @MaxLength(256) JWT_SECRET = DEVELOPMENT_JWT_SECRET;
  @Type(() => Number) @IsInt() @Min(1) @Max(168) SESSION_TTL_HOURS = 8;
  @IsOptional() @IsIn(['true', 'false']) SEED_DEMO_DATA?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(100_000) SEED_EMPLOYEE_COUNT = 10_000;
  @IsOptional() @IsEmail() INITIAL_HR_EMAIL?: string;
  @IsOptional() @IsString() @MinLength(12) @MaxLength(128) INITIAL_HR_PASSWORD?: string;
}

const DEVELOPMENT_HR: InitialHr = { email: 'hr@acme.test', password: 'Dev-Only-Passw0rd!' };

const PRODUCTION_REQUIRED = ['DATABASE_URL', 'WEB_ORIGIN', 'JWT_SECRET'] as const;

const resolveInitialHr = (raw: RawEnvironment): InitialHr | undefined => {
  if (raw.INITIAL_HR_EMAIL && raw.INITIAL_HR_PASSWORD) {
    return { email: raw.INITIAL_HR_EMAIL.toLowerCase(), password: raw.INITIAL_HR_PASSWORD };
  }
  return raw.NODE_ENV === 'production' ? undefined : DEVELOPMENT_HR;
};

export const loadAppConfig = (env: NodeJS.ProcessEnv): AppConfig => {
  if (env['NODE_ENV'] === 'production') {
    const missing = PRODUCTION_REQUIRED.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  if (env['NODE_ENV'] === 'production' && env['JWT_SECRET'] === DEVELOPMENT_JWT_SECRET) {
    throw new Error('JWT_SECRET must not be the development default in production');
  }

  const raw = plainToInstance(RawEnvironment, env, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(raw, { forbidUnknownValues: true });
  if (errors.length > 0) {
    const reasons = errors.flatMap((error) => Object.values(error.constraints ?? {}));
    throw new Error(`Invalid environment configuration: ${reasons.join('; ')}`);
  }

  return {
    nodeEnv: raw.NODE_ENV,
    port: raw.PORT,
    databaseUrl: raw.DATABASE_URL,
    webOrigin: raw.WEB_ORIGIN,
    trustProxyHops: raw.TRUST_PROXY_HOPS,
    bodyLimit: raw.BODY_LIMIT,
    throttleTtlMs: raw.THROTTLE_TTL_MS,
    throttleLimit: raw.THROTTLE_LIMIT,
    dbPoolMax: raw.DB_POOL_MAX,
    dbStatementTimeoutMs: raw.DB_STATEMENT_TIMEOUT_MS,
    jwtSecret: raw.JWT_SECRET,
    sessionTtlHours: raw.SESSION_TTL_HOURS,
    cookieSecure: raw.NODE_ENV === 'production',
    initialHr: resolveInitialHr(raw),
    seedDemoData:
      raw.SEED_DEMO_DATA === undefined
        ? raw.NODE_ENV === 'development'
        : raw.SEED_DEMO_DATA === 'true',
    seedEmployeeCount: raw.SEED_EMPLOYEE_COUNT,
  };
};
