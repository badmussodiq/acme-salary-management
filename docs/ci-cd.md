# CI/CD and deployment

```
pull request / push to main ──> CI ──> (main only) CD: build + scan + push sha tag ──> validate bundle ──> approval ──> promote `latest` ──> server updater pulls and restarts
```

## CI — `.github/workflows/ci.yml`

Runs on every pull request and every push to `main`. Docs-only changes skip it.

| Job           | What it proves                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `verify`      | `pnpm audit --prod` (a known high or critical advisory fails the build), build, formatting, type-aware lint, type check, unit tests of every package                                                   |
| `integration` | API tests against a real Postgres service. Each test file creates and drops its own database, so the suite needs nothing prepared                                                                      |
| `e2e`         | Builds the real Docker images, starts them with a throwaway Postgres (`deploy/compose.e2e.yaml`) and drives the HR workflow in Chromium with Playwright. Failures upload the report and container logs |

`pnpm verify` runs the same checks locally. `pnpm test:e2e` runs the browser tests against local servers (build first with `pnpm build`, and start Postgres with `pnpm db:up`).

## Images

Multi-stage builds that keep the runtime small:

- **deps** stage: manifests and lockfile only, with the pnpm store as a BuildKit cache mount, so source edits do not reinstall.
- **build** stage: compiles the shared contracts and the app. The API ships production dependencies only (`pnpm deploy --prod`); the web app ships Next's `standalone` output.
- **runtime** stage: plain `alpine` plus `libstdc++` and the single `node` binary copied from the official image (no npm, yarn or corepack), running as an unprivileged user with a `HEALTHCHECK`.

Uncompressed, each image is about 200 MB, of which 133 MB is the Node binary itself.

The web app proxies `/api/v1/*` to `API_ORIGIN` at runtime (a route handler, not a build-time rewrite), so one image works in every environment.

## CD — `.github/workflows/cd.yml`

Starts only after CI succeeded for a push to `main`.

| Job              | What it does                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `publish`        | Builds each image, scans it with Trivy (fixable high or critical findings fail the run) and pushes it to GHCR as `sha-<commit>`. Nothing moves `latest` yet |
| `release-bundle` | Lints `deploy.sh` with shellcheck, validates `compose.prod.yaml`, and uploads the deployment bundle with a `release.json` naming the exact images           |
| `deploy`         | Runs in the `production` GitHub environment, so a required reviewer can gate it. It re-points `latest` at the release. No server is contacted               |

## Automatic rollout on the server

`deploy/compose.prod.yaml` runs Postgres, the API, the web app, Caddy (automatic HTTPS) and an **updater** (Watchtower). The updater watches the `latest` tag of the API and web images and, when CD moves it, pulls the new image and recreates the container. The API migrates the database itself on start, so nothing is run by hand.

For an explicit deploy, pin or rollback, run on the server:

```bash
deploy/deploy.sh sha-<commit>
```

`deploy.sh` records the running images, pulls the requested tag (with retries), starts it with `--wait`, and if the new release does not become healthy it restores the previous images and exits non-zero. `SKIP_PULL=1` uses images already on the host.

Server setup is one directory: copy `compose.prod.yaml`, `Caddyfile`, `deploy.sh` and a `.env` filled from `.env.example` (the bundle artifact contains them). Point the domain's DNS at the server; Caddy obtains the certificate. Private registries use `REGISTRY_USER` and `REGISTRY_TOKEN`.

## Verified locally

- The two images build and pass all 10 Playwright tests in production mode.
- `deploy.sh` brings the full stack (proxy, updater, database) up healthy over HTTPS, and a deliberately broken release is rejected and rolled back automatically.
- Workflows pass `actionlint`; `deploy.sh` passes shellcheck.

Not exercised here: the GitHub-hosted runs themselves, GHCR pushes and a real server.
