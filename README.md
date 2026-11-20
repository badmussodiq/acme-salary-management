# ACME Salary Management Platform

A web application for ACME's HR manager to manage salary data for 10,000 employees across every country in the world (247 countries and territories, 153 currencies) and answer questions about how the organisation pays its people. Built for the Incubyte software craftsperson assessment.

- **Backend:** NestJS 12, PostgreSQL 18, Kysely (typed SQL), strict TypeScript 7
- **Frontend:** Next.js 16 (server-rendered), React 19, Tailwind CSS 4
- **Quality:** unit, integration and browser tests; type-aware linting with no `any` or type assertions; CI/CD with image scanning
- **Operations:** slim Docker images, automatic rollout with rollback, scheduled backups with a drilled restore

## Run it

Requirements: Node 24 or newer, pnpm 12, Docker (for PostgreSQL).

```bash
pnpm install
pnpm db:up
pnpm dev:api        # http://localhost:3001, migrates, creates the HR user and seeds 10,000 employees
pnpm dev:web        # http://localhost:3000
```

Open http://localhost:3000 and sign in with the development credentials in [.env.example](.env.example). Nothing else needs to be run: migrations, the first account and the demo data all happen on start.

## Commands

| Command                       | What it does                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm verify`                 | Build, format check, lint, type check, unit tests, integration tests (needs `pnpm db:up`) |
| `pnpm test`                   | Unit tests of every package                                                               |
| `pnpm test:integration`       | API tests against real PostgreSQL, including the 10,000-employee performance run          |
| `pnpm build && pnpm test:e2e` | Browser tests (Playwright) against local servers                                          |
| `pnpm seed`                   | Seed 10,000 synthetic employees by hand (idempotent; `--reset` rebuilds)                  |
| `pnpm demo:video`             | Record the captioned demo walkthrough ([docs/demo-script.md](docs/demo-script.md))        |

## What it does

- **Employees and pay:** search, filter, sort and paginate the directory on the server; create and edit employees; add compensation as a dated history; strict validation everywhere.
- **Insights:** headcount by country and department; pay mix; minimum, median, average and maximum **per currency and pay frequency, never mixed**; employees with no pay; unusual salaries.
- **Audit:** every change records who, when, before and after; the log is append-only in the database.
- **Security:** revocable sessions, per-user rate limits, a standard error envelope for 401, 403 and 429, nonce-based CSP, strict input validation, hardened containers.

## Where to look

| Question                              | Answer                                               |
| ------------------------------------- | ---------------------------------------------------- |
| What was built, and what was left out | [docs/requirements.md](docs/requirements.md)         |
| How it fits together                  | [docs/architecture.md](docs/architecture.md)         |
| Why these choices                     | [docs/decisions.md](docs/decisions.md)               |
| The original plan and what changed    | [docs/engineering-plan.md](docs/engineering-plan.md) |
| How AI was used and checked           | [docs/ai-workflow.md](docs/ai-workflow.md)           |
| How it is secured                     | [docs/security.md](docs/security.md)                 |
| How fast it is, measured              | [docs/performance.md](docs/performance.md)           |
| CI, CD and the Docker images          | [docs/ci-cd.md](docs/ci-cd.md)                       |
| Running it on a server, backups       | [docs/deployment.md](docs/deployment.md)             |
| The demo video                        | [docs/demo-script.md](docs/demo-script.md)           |

## Repository

| Path                 | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `apps/api`           | NestJS REST API, migrations, seed                     |
| `apps/web`           | Next.js application and the runtime API proxy         |
| `apps/e2e`           | Playwright browser tests and the demo recorder        |
| `packages/contracts` | Shared response envelope, error codes and DTO types   |
| `packages/web-utils` | Generic hooks and components shared by the web app    |
| `deploy`             | Production compose, proxy, deploy, backup and restore |
| `.github/workflows`  | CI and CD                                             |

## Honest status

Done and verified: everything above, including the Docker images passing the browser suite and a backup restore that returned exactly the 10,000 employees, their pay history and audit trail.

Not done: a **publicly deployed instance** (no server was available; [docs/deployment.md](docs/deployment.md) is the procedure), **S3 file storage** and **OpenAPI documentation** (designed in the plan, cut from scope), and the GitHub-hosted workflow runs themselves, which were linted and exercised step by step locally but not run on GitHub. [docs/engineering-plan.md](docs/engineering-plan.md) lists every difference between the plan and the result.
