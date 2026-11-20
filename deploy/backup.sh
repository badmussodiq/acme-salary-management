#!/bin/sh
# Dumps the database on a schedule and prunes old dumps.
# Usage: backup.sh [loop|once]   Connection settings come from the standard PG* variables.
set -eu

DIR="${BACKUP_DIR:-/backups}"
KEEP_DAYS="${BACKUP_RETENTION_DAYS:-14}"
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"

backup_once() {
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  partial="$DIR/.acme-$stamp.partial"
  final="$DIR/acme-$stamp.dump"
  pg_dump --format=custom --no-owner --file="$partial"
  mv "$partial" "$final"
  find "$DIR" -name 'acme-*.dump' -mtime +"$KEEP_DAYS" -delete
  echo "backup: wrote $final"
}

case "${1:-loop}" in
  once)
    backup_once
    ;;
  loop)
    while true; do
      backup_once || echo "backup: dump failed" >&2
      sleep "$INTERVAL"
    done
    ;;
  *)
    echo "usage: backup.sh [loop|once]" >&2
    exit 2
    ;;
esac
