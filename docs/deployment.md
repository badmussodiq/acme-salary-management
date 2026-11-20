# Deployment guide

The system runs on one Linux host with Docker and the compose plugin. CI builds and scans the images, CD publishes them, and the host pulls them. The host never builds anything and CI never holds a server credential. The pipeline is described in [ci-cd.md](ci-cd.md).

## What you need

- A Linux host with Docker Engine and the compose plugin, ports 80 and 443 open.
- A DNS name pointing at the host (Caddy obtains the certificate itself).
- The container images in a registry the host can read. The pipeline pushes to `ghcr.io/<owner>/acme-salary-api` and `acme-salary-web`; make the packages public, or provide `REGISTRY_USER` and `REGISTRY_TOKEN` (a token with `read:packages`).

## One-time setup

Take the **deploy-bundle** artifact from a CD run (or the `deploy/` folder) and put these files in one directory on the host, for example `/opt/acme-salary`:

```
compose.prod.yaml  Caddyfile  deploy.sh  backup.sh  restore.sh  .env
```

Create `.env` from `.env.example`:

| Variable                                           | Meaning                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `IMAGE_REGISTRY`, `IMAGE_TAG`                      | Where the images live (`ghcr.io/<owner>`) and the tag to follow (`latest`)                     |
| `DOMAIN`, `WEB_ORIGIN`                             | The public host name and its full origin, for example `https://salary.example.com`             |
| `POSTGRES_PASSWORD`                                | `openssl rand -hex 24` (hex keeps it URL-safe)                                                 |
| `JWT_SECRET`                                       | `openssl rand -hex 32`; the API refuses to start in production with the development default    |
| `INITIAL_HR_EMAIL`, `INITIAL_HR_PASSWORD`          | The first HR manager, created on the first start if no user exists (at least 12 characters)    |
| `SEED_DEMO_DATA`                                   | `true` loads the 10,000 synthetic employees on first start (demo); leave `false` for real data |
| `BACKUP_INTERVAL_SECONDS`, `BACKUP_RETENTION_DAYS` | Daily backups kept for 14 days by default                                                      |
| `UPDATE_INTERVAL_SECONDS`                          | How often the updater checks the registry                                                      |

Then start it:

```bash
chmod +x deploy.sh restore.sh
./deploy.sh latest
```

`deploy.sh` pulls the images, starts the stack, waits for every health check and records the release in `.release`. The API migrates the database, creates the HR manager and, if enabled, seeds the demo data. There is nothing else to run.

## How updates arrive

1. A merge to `main` passes CI.
2. CD builds, scans and pushes `sha-<commit>` images, validates this bundle, and (after approval, if the `production` environment requires it) moves `latest` to that commit.
3. The updater container on the host sees the new `latest` and recreates the API and web containers. The API applies any new migrations as it starts.

No SSH, no webhook and no server secret is involved. The trade-off is that the updater has access to the Docker socket (see [security.md](security.md)).

## Pinning and rolling back

```bash
./deploy.sh sha-<commit>
```

Pulls that exact release and waits for it to be healthy. If it does not become healthy, the previous images are restored automatically and the script exits non-zero. To stop the updater from moving a pinned host forward, set `IMAGE_TAG` to the pinned tag in `.env` and stop the `updater` service.

Database migrations only move forward, so keep them backward compatible: add columns before using them, remove them only a release later.

## Backups and restore

A `backup` service dumps the database every `BACKUP_INTERVAL_SECONDS` into the `backups` volume and deletes dumps older than `BACKUP_RETENTION_DAYS`. It starts only after the API is healthy and reports healthy only while a recent dump exists, so a stalled backup shows up in `docker compose ps`.

```bash
./restore.sh list              # backups, newest first
./restore.sh latest            # asks for confirmation
./restore.sh acme-20261120T161706Z.dump --yes
```

Restore stops the API and web app, replaces the data in one transaction, and starts them again on the release recorded in `.release`. Copy the `backups` volume off the host (for example with `rclone` or `restic`) if you need protection against losing the host itself; that is not included.

## Health and monitoring

| Check                        | What it tells you                                                    |
| ---------------------------- | -------------------------------------------------------------------- |
| `GET /healthz` (web)         | The web server is up                                                 |
| `GET /api/v1/health/live`    | The API process is up (used by the container health check)           |
| `GET /api/v1/health/ready`   | The API can reach the database (503 `SERVICE_UNAVAILABLE` otherwise) |
| `docker compose ps`          | Container health for every service, including backups                |
| `docker compose logs -f api` | Structured request and error logs; each error carries a request id   |

Every error response contains a `requestId`, and the same id is in the server log, so a user's report can be traced.

## Verified locally

The following was run with this exact compose file, using locally built images and HTTPS on a non-standard port:

- Cold start from an empty volume to a healthy stack, including 10,000 seeded employees.
- A deliberately broken release was rejected and the previous release restored.
- Data loss was simulated and restored from backup: 10,000 employees, 17,473 compensation periods and 27,473 audit events came back, with the audit trigger.
- The data survived stopping and starting the stack.

## Not done here

No real host was available, so there is **no deployed URL**. Everything above is the procedure to create one, and the parts that can be proven without a server were proven. To publish a demo quickly: create a small VPS, point a DNS name at it, follow the setup above with `SEED_DEMO_DATA=true`, and put the URL in the submission email.
