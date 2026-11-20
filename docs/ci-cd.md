# CI/CD

```
pull request / push to master ──> CI ──> (master only) CD: build, scan, push images ──> Render deploy hook ──> smoke check
```

The web app is not deployed by CD: the Vercel project is connected to the repository and redeploys itself on every push to `master`.

## CI — `.github/workflows/ci.yml`

Runs on pull requests and pushes to `master`. Docs-only changes skip it.

| Job           | What it proves                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `verify`      | `pnpm audit --prod`, build, formatting, type-aware lint, type check, unit tests of every package                                    |
| `secrets`     | A full-history secret scan                                                                                                          |
| `integration` | API tests against a real Postgres service; each test file creates and drops its own database                                        |
| `e2e`         | Builds the Docker images, starts them with `docker-compose.yml` (Postgres, RustFS, API, web) and drives the HR workflow in Chromium |

`pnpm verify` runs the same checks locally.

## Images

Multi-stage builds ending in plain Alpine with only the Node binary, running as an unprivileged user with a health check. The web app proxies `/api/v1/*` to `API_ORIGIN` at runtime, so one image works everywhere.

## CD — `.github/workflows/cd.yml`

Starts only after CI succeeded for a push to `master`.

| Job          | What it does                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `publish`    | Builds each image, scans it with Trivy (fixable high or critical findings fail the run) and pushes it to GHCR as `sha-<commit>`           |
| `deploy-api` | Calls the Render deploy hook (`RENDER_DEPLOY_HOOK_URL` secret). Render auto-deploy must be off so this is the only trigger                |
| `smoke`      | Polls `API_URL/api/v1/health/ready` for up to 10 minutes (a sleeping free-plan service needs time to wake), then checks `WEB_URL/healthz` |

GitHub settings: secret `RENDER_DEPLOY_HOOK_URL`; variables `API_URL` and `WEB_URL`; an environment named `production` (optionally with a required reviewer).

## Hosting setup

- **Render:** a web service from `apps/api/Dockerfile` with the repository root as the Docker context. Environment variables are set in the Render dashboard. The API migrates and seeds itself on start.
- **Vercel:** a project with root directory `apps/web` (`apps/web/vercel.json` holds the build commands). Set `API_ORIGIN` to the Render URL.
- **Free plan:** Render sleeps an idle free service, so the first request after a pause can take about a minute.

Self-hosting on a single server is optional; see [../deploy/README.md](../deploy/README.md).
