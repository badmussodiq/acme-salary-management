# ACME Salary Management Platform

A web application for ACME's HR manager to manage salary data for 10,000 employees across every country in the world (247 countries and territories, 153 currencies) and answer questions about how the organisation pays its people. Built for the Incubyte software craftsperson assessment.

- **Backend:** NestJS 12, PostgreSQL 18, Kysely (typed SQL), strict TypeScript 7
- **Frontend:** Next.js 16 (server-rendered), React 19, Tailwind CSS 4
- **Quality:** unit, integration and browser tests; type-aware linting with no `any` or type assertions; CI/CD with image scanning
- **Hosting:** API on Render, web on Vercel, PostgreSQL, optional S3-compatible storage for profile pictures

## Run it

Requirements: Node 24 or newer, pnpm 12, Docker (for PostgreSQL, the local S3 store and the local mail catcher).

```bash
pnpm install
pnpm db:up          # PostgreSQL, RustFS and Mailpit from docker-compose-infra.yml
pnpm dev:api        # http://localhost:3001, migrates, creates the HR user and seeds 10,000 employees
pnpm dev:web        # http://localhost:3000
```

Open http://localhost:3000 and sign in with the development credentials in [.env.example](.env.example). To run everything in containers instead, use `docker compose up --build`.

**Email in development:** nothing is really sent. Every email, such as a password reset, lands in Mailpit, a local mail catcher with an inbox at http://localhost:8025. It starts with `pnpm db:up` and `docker compose up`.

Nothing else needs to be run: migrations, the first account and the demo data all happen on start.

## Commands

| Command                       | What it does                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm verify`                 | Build, format check, lint, type check, unit tests, integration tests (needs `pnpm db:up`) |
| `pnpm test`                   | Unit tests of every package                                                               |
| `pnpm test:integration`       | API tests against real PostgreSQL, including the 10,000-employee performance run          |
| `pnpm build && pnpm test:e2e` | Browser tests (Playwright) against local servers                                          |
| `pnpm seed`                   | Seed 10,000 synthetic employees by hand (idempotent; `--reset` rebuilds)                  |
| `pnpm demo:video`             | Record the captioned demo walkthrough                                                     |

## What it does

- **Employees and pay:** search, filter, sort and paginate the directory on the server; create and edit employees; add compensation as a dated history; strict validation everywhere.
- **Insights:** headcount by country and department; pay mix; minimum, median, average and maximum **per currency and pay frequency, never mixed**; employees with no pay; unusual salaries.
- **Profile pictures:** upload a JPEG, PNG or WebP (up to 2 MB) on an employee's page when S3 storage is configured; otherwise initials are shown.
- **Passwords:** "Forgot your password?" on the sign-in page emails a signed reset link (valid 30 minutes, single use); signed-in users change their password under Settings (click your email in the header). Either way, other sessions are signed out.
- **Audit:** every change records who, when, before and after; the log is append-only in the database.
- **Security:** revocable sessions, per-user rate limits, a standard error envelope for 401, 403 and 429, nonce-based CSP, strict input validation, hardened containers.

## Where to look

| Question                              | Answer                                       |
| ------------------------------------- | -------------------------------------------- |
| What was built, and what was left out | [docs/requirements.md](docs/requirements.md) |
| How it fits together, and why         | [docs/architecture.md](docs/architecture.md) |
| How AI was used and checked           | [docs/ai-workflow.md](docs/ai-workflow.md)   |
| How it is secured                     | [docs/security.md](docs/security.md)         |
| How fast it is, measured              | [docs/performance.md](docs/performance.md)   |
| CI, CD and hosting                    | [docs/ci-cd.md](docs/ci-cd.md)               |

## Repository

| Path                 | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `apps/api`           | NestJS REST API, migrations, seed                   |
| `apps/web`           | Next.js application and the runtime API proxy       |
| `apps/e2e`           | Playwright browser tests and the demo recorder      |
| `packages/contracts` | Shared response envelope, error codes and DTO types |
| `packages/web-utils` | Generic hooks and components shared by the web app  |
| `deploy`             | Optional self-hosting: proxy, backups, restore      |
| `.github/workflows`  | CI and CD                                           |

## Email on hosted deployments

Render and Vercel cannot run Mailpit. Point the API at any SMTP inbox with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM`; a capture-only inbox such as an Ethereal or Mailtrap sandbox needs no real mailbox. Without `SMTP_HOST` the API sends nothing and logs a warning, so the reset page still answers but no email arrives.

## Hosted demo

- **Live app:** https://acme-salary-management-navy-alpha.vercel.app
- **Demo video (about 3 minutes):** https://drive.google.com/file/d/1zwmkAc6gBJcI9YGGcRPYVJevvcf3Fc0n/view?usp=drive_link

The API runs on Render's free plan, which puts an idle service to sleep. **The first request after a quiet period can take up to a minute while the backend wakes up.** Sign-in or the first page may be slow once, then it is fast.

## Honest status

Done and verified: everything above, including the Docker images passing the browser suite and a backup restore that returned exactly the 10,000 employees, their pay history and audit trail.

Not done: OpenAPI documentation, and the GitHub-hosted workflow runs themselves, which were linted and exercised step by step locally.
