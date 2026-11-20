# Self-hosting (optional)

This folder is only for running the application on your own server with Docker. It is not used by
the Render and Vercel deployment.

It contains a Caddy reverse proxy (`Caddyfile`), the production Compose file
(`compose.prod.yaml`), and scripts for deploying, backing up and restoring (`deploy.sh`,
`backup.sh`, `restore.sh`).

Create a `.env` file in this folder before running `deploy.sh`. It must define every variable that
`compose.prod.yaml` references (for example `DOMAIN`, `WEB_ORIGIN`, `POSTGRES_PASSWORD`,
`JWT_SECRET`, `INITIAL_HR_EMAIL` and `INITIAL_HR_PASSWORD`). Generate each secret yourself and
never commit the file.
