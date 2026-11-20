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

The API applies database migrations on startup. Configuration defaults suit local development; see `.env.example` for every variable.

## Quality checks

```bash
pnpm verify
```

Runs formatting, linting, type checks, tests and builds.
