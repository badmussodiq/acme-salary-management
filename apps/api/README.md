# @acme/api

NestJS REST API for the salary platform. PostgreSQL through Kysely, sessions in an HttpOnly cookie, optional S3-compatible storage for profile pictures.

## Run

```bash
pnpm db:up && pnpm dev:api   # http://localhost:3001
```

On every start the API runs its migrations, creates the first HR manager from `INITIAL_HR_EMAIL` and `INITIAL_HR_PASSWORD`, and seeds demo data only if none exists (`SEED_DEMO_DATA`). Nothing is run by hand.

## Layout

| Path                                | Purpose                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `src/auth`                          | Sessions, guards, lockout, first HR manager                     |
| `src/employees`, `src/compensation` | Directory, create and edit, pay history                         |
| `src/avatar`, `src/storage`         | Profile pictures and the S3 client (disabled when unconfigured) |
| `src/insights`                      | Aggregates and data-quality checks                              |
| `src/audit`                         | Append-only audit events                                        |
| `src/database`                      | Kysely setup and migrations                                     |
| `src/seed`                          | Deterministic demo data                                         |
| `test`                              | Integration tests against real PostgreSQL                       |

## Configuration

See [.env.example](../../.env.example). Required in production: `DATABASE_URL`, `WEB_ORIGIN`, `JWT_SECRET`. Profile pictures turn on when `S3_BUCKET`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are set (plus `S3_ENDPOINT` for non-AWS stores).

## Test

`pnpm --filter @acme/api test` for unit tests, `pnpm test:integration` for the database tests.
