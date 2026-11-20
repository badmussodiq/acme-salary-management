#!/usr/bin/env bash
# Restores the database from a backup and restarts the application on the release that was running.
# Usage: restore.sh <backup-file-name | latest | list> [--yes]
# The application is stopped while the data is replaced.
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE=(docker compose --env-file .env -f compose.prod.yaml)
[[ -f .env ]] || { echo "restore: .env is missing (see deploy/README.md)" >&2; exit 1; }
[[ -f .release ]] && IMAGE_TAG="$(<.release)" && export IMAGE_TAG

in_backup_container() {
  "${COMPOSE[@]}" run --rm --no-deps -T --entrypoint sh backup -c "$1"
}

target="${1:?Usage: restore.sh <backup-file-name | latest | list> [--yes]}"

if [[ "$target" == "list" ]]; then
  in_backup_container 'ls -1t /backups/acme-*.dump 2>/dev/null || true'
  exit 0
fi

if [[ "$target" == "latest" ]]; then
  target="$(in_backup_container 'ls -1t /backups/acme-*.dump | head -n 1' | tr -d '\r')"
  target="$(basename "${target:?no backups found}")"
fi

if [[ "${2:-}" != "--yes" ]]; then
  read -r -p "Replace the current database with ${target}? Type 'restore' to continue: " answer
  [[ "$answer" == "restore" ]] || { echo "restore: cancelled" >&2; exit 1; }
fi

on_failure() {
  echo "restore: failed; the application is stopped. Fix the cause, then run deploy.sh to start it." >&2
}
trap on_failure ERR

echo "restore: stopping the application"
"${COMPOSE[@]}" stop web api

echo "restore: restoring ${target}"
in_backup_container "pg_restore --clean --if-exists --no-owner --single-transaction --dbname \"\$PGDATABASE\" \"/backups/${target}\""

echo "restore: starting the application"
"${COMPOSE[@]}" start api web
"${COMPOSE[@]}" up -d --no-recreate --wait
echo "restore: done"
