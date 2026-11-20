import { plainToInstance, Type } from 'class-transformer';
import { IsIn, IsInt, IsUrl, Matches, Max, Min, validateSync } from 'class-validator';

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
}

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
}

const PRODUCTION_REQUIRED = ['DATABASE_URL', 'WEB_ORIGIN'] as const;

export const loadAppConfig = (env: NodeJS.ProcessEnv): AppConfig => {
  if (env['NODE_ENV'] === 'production') {
    const missing = PRODUCTION_REQUIRED.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
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
  };
};
