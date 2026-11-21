# @acme/api

NestJS REST API for the salary platform. PostgreSQL through Kysely, sessions in an HttpOnly cookie, optional S3-compatible storage for profile pictures, SMTP mail for password resets.

## Run

```bash
pnpm db:up && pnpm dev:api   # http://localhost:3001
```

On every start the API runs its migrations, creates the first HR manager from `INITIAL_HR_EMAIL` and `INITIAL_HR_PASSWORD`, and seeds demo data only if none exists (`SEED_DEMO_DATA`). Nothing is run by hand.

## Layout

| Path                                | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `src/auth`                          | Sessions, guards, lockout, first HR manager, password reset and change |
| `src/mail`                          | Mailer over SMTP (Mailpit locally); disabled when unconfigured         |
| `src/employees`, `src/compensation` | Directory, create and edit, pay history                                |
| `src/avatar`, `src/storage`         | Profile pictures and the S3 client (disabled when unconfigured)        |
| `src/insights`                      | Aggregates and data-quality checks                                     |
| `src/audit`                         | Append-only audit events                                               |
| `src/database`                      | Kysely setup and migrations                                            |
| `src/seed`                          | Deterministic demo data                                                |
| `test`                              | Integration tests against real PostgreSQL                              |

## Configuration

See [.env.example](../../.env.example). Required in production: `DATABASE_URL`, `WEB_ORIGIN`, `JWT_SECRET`. Profile pictures turn on when `S3_BUCKET`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are set (plus `S3_ENDPOINT` for non-AWS stores).

Mail turns on when `SMTP_HOST` is set (with `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`). In development it defaults to Mailpit on `localhost:1025`; the inbox is http://localhost:8025. Without SMTP outside development the API sends nothing and logs a warning.

## Auth endpoints

| Endpoint                     | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `POST /auth/login`, `logout` | Start and revoke a session                                            |
| `POST /auth/forgot-password` | Always answers 202; mails a 30-minute, single-use link to known users |
| `POST /auth/reset-password`  | Sets a new password from the link; revokes all sessions               |
| `POST /auth/change-password` | Needs the current password; keeps this session, revokes the others    |

The forgot and reset endpoints are public and limited to 5 per minute per address.

## Test

`pnpm --filter @acme/api test` for unit tests, `pnpm test:integration` for the database tests.
