# ACME Salary Management Platform

Salary management for an organisation of 10,000 employees. See [the engineering plan](docs/engineering-plan.md) for requirements, architecture, security and delivery.

## Stack

NestJS 12 API, Next.js 16 web app, PostgreSQL, Kysely, TypeScript 7, pnpm workspaces.

## Layout

| Path                 | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `apps/api`           | NestJS REST API                                     |
| `apps/web`           | Next.js web application                             |
| `packages/contracts` | Shared response envelope, error codes and API types |
| `packages/web-utils` | Generic hooks and components shared by the web app  |
| `docs`               | Requirements, architecture and decisions            |

## Run locally

```bash
pnpm install
pnpm db:up
pnpm dev:api
pnpm dev:web
```

The API applies database migrations, creates the first HR manager and, in development, seeds 10,000 synthetic employees on startup. Open http://localhost:3000 and sign in with the development credentials in `.env.example`. In production, set `INITIAL_HR_EMAIL` and `INITIAL_HR_PASSWORD`; no default account is created.

Configuration defaults suit local development; see `.env.example` for every variable.

## Quality checks

```bash
pnpm verify
```

Runs the build, formatting, linting, type checks, unit tests, builds and the integration tests. Integration tests create a throwaway database per test file on the local Postgres (`pnpm db:up`), or the server named by `TEST_DATABASE_ADMIN_URL`.

## Demo data

The seed is deterministic (same data every run), idempotent (a second run does nothing) and flags every record as synthetic. It runs automatically in development and when `SEED_DEMO_DATA=true`. To run it by hand or rebuild it:

```bash
pnpm seed
pnpm --filter @acme/api seed -- --reset
```

Measured query times at this size are in [docs/performance.md](docs/performance.md).

## Browser tests, images and deployment

```bash
pnpm build
pnpm test:e2e
```

See [CI/CD and deployment](docs/ci-cd.md) for the pipeline, the slim Docker images and the automatic rollout, and [the security review](docs/security.md) for the controls, the findings fixed and the accepted risks.
