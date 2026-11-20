# Architecture decision records

Each record states the context, the decision, what was rejected and what it costs.

## 1. A modular monolith

- **Context:** one persona, 10,000 employees, a small team.
- **Decision:** one API, one web app, one database, with clear internal modules.
- **Rejected:** microservices (distributed transactions for a simple write, more to deploy and observe), serverless functions (cold starts, harder local parity).
- **Consequence:** simple to run, test and reason about. Modules can be split later along their existing boundaries.

## 2. NestJS and Next.js with TypeScript end to end

- **Context:** the role is Node, React and TypeScript.
- **Decision:** NestJS for the API (modules, guards, pipes, interceptors map directly to the cross-cutting needs), Next.js for server-rendered pages. Memory use is modest for this workload; the database, not the runtime, decides performance.
- **Consequence:** one language, shared types in `packages/contracts`.

## 3. Kysely instead of a full ORM

- **Context:** the queries that matter are aggregates, a shared "current compensation" join and percentile functions.
- **Decision:** a typed query builder with plain SQL migrations; no entities, no hidden queries.
- **Rejected:** TypeORM and Prisma. They are good at CRUD but make window functions, filters and constraint-driven design awkward.
- **Consequence:** more explicit SQL, fully typed results, easy to read in review.

## 4. Pay is grouped by currency and frequency, never converted

- **Context:** employees in 247 countries and territories are paid in 153 currencies, monthly, annually or hourly.
- **Decision:** every statistic covers one currency at one frequency. The UI says so.
- **Rejected:** converting to a base currency (needs a rate source, rate dates and a policy; any number would look authoritative and be wrong).
- **Consequence:** the dashboard has more rows but never lies.

## 5. Compensation is a dated history with database-enforced rules

- **Decision:** one row per pay period. Adding pay closes the open period in the same transaction. An exclusion constraint forbids overlaps. The API refuses a start date at or before the latest one.
- **Consequence:** history and audit come naturally; backdated corrections are not supported and are listed as future work.

## 6. The audit log is append-only in the database

- **Decision:** a trigger rejects updates and deletes. Audit rows are written in the same transaction as the change.
- **Consequence:** the application cannot alter its own history. Seeded records are attributed to the system.

## 7. Sessions: a signed cookie with a server-side version

- **Decision:** an HttpOnly, SameSite=Strict JWT carrying a per-user session version. Sign-out increments the version, which revokes every session of that user.
- **Rejected:** localStorage tokens (readable by scripts), pure stateless JWTs (cannot be revoked), a full session table (more machinery than one persona needs).
- **Consequence:** one database read per request and real logout. Cost: signing out ends all of a user's sessions.

## 8. The web app proxies the API at runtime

- **Decision:** a route handler forwards `/api/v1/*` to the API address read from the environment at runtime.
- **Rejected:** a build-time rewrite (bakes the address into the image) and direct cross-origin calls (cookies, CORS, CSRF surface).
- **Consequence:** one image for every environment and a single origin for the browser. The proxy caps body size and times out slow upstreams.

## 9. Strict TypeScript 7 and oxlint

- **Decision:** the newest compiler, with type-aware oxlint rules that forbid `any`, type assertions and non-null assertions. typescript-eslint does not support TypeScript 7 yet, so oxlint is used instead.
- **Consequence:** very fast checks and no escape hatches. Test files may use assertions where they build deliberately invalid input.

## 10. Migrations and seed run automatically

- **Decision:** the API migrates the database on start, creates the first HR manager from configuration and, in development or on request, seeds demo data. Nothing needs a manual step.
- **Consequence:** an empty database becomes a working system. A migration failure stops the start rather than serving a broken schema. Migrations must stay backward compatible so a rollback can run against a newer schema.

## 11. Slim images and a pull-based updater

- **Decision:** multi-stage builds ending in plain Alpine with only the Node binary; an updater on the server watches the `latest` tag, which CD moves only in a final job that can require a reviewer's approval; `deploy.sh` handles pins and health-gated rollbacks.
- **Rejected:** Kubernetes (far beyond this need), SSH-pushed deployments from CI (puts a server key in the pipeline).
- **Consequence:** CI never holds server credentials. Cost: the updater mounts the Docker socket, noted in the security review.

## 12. Offset pagination, no cache, no materialised views

- **Decision:** simple pagination and live aggregates.
- **Basis:** measured at 10,000 rows, every query takes tens of milliseconds ([performance.md](performance.md)).
- **Consequence:** the figures are always current. Keyset pagination and caching are the next steps if the data grows by orders of magnitude.

## 13. Complete, generated world reference data

- **Context:** HR may onboard someone in any country, at any time, paid in any currency. A short list would block the first hire from a country that was not anticipated.
- **Decision:** every ISO 3166 country and territory with a currency (247) and every currency they use (153) are built into the contracts package, with each country's usual currency. Choosing a country in the onboarding form fills in that currency, which can still be changed, because country and pay currency are independent. The seed covers every country, with headcount that grows with population and income.
- **How it is made:** `scripts/generate-world-data.mjs` reads the `world-countries` dataset, open exchange rates and World Bank population and income figures, and writes the typed lists and the seed profiles. Nothing is typed by hand, and a refresh is one command.
- **Rejected:** a country table edited in the database (no compile-time checking of codes, and another thing to seed) and a hand-written list (error-prone at this size).
- **Consequence:** adding or correcting a country is a data refresh and a release, not a schema change. Three uninhabited territories with no currency (Antarctica, Bouvet Island, Heard Island) are left out. The exchange rates only exist to make the synthetic salaries plausible; the application never converts currencies.
