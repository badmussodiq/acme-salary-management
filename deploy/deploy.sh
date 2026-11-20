#!/usr/bin/env bash
# Deploys one image tag and rolls back to the previous release if the new one is not healthy.
# Usage: deploy.sh [image-tag]   (default: latest). SKIP_PULL=1 uses images already on the host.
set -euo pipefail

cd "$(dirname "$0")"

TAG="${1:-latest}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-180}"
SERVICES=(api web)
COMPOSE=(docker compose --env-file .env -f compose.prod.yaml)

[[ -f .env ]] || { echo "deploy: .env is missing (see .env.example)" >&2; exit 1; }
export IMAGE_TAG="$TAG"

snapshot_running_images() {
  local service container
  for service in "${SERVICES[@]}"; do
    container="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
    if [[ -n "$container" ]]; then
      docker tag "$(docker inspect --format '{{.Image}}' "$container")" "acme-salary-${service}:rollback" ||
        echo "deploy: could not snapshot ${service}; rollback will not be available" >&2
    fi
  done
}

pull_images() {
  local attempt
  for attempt in 1 2 3; do
    "${COMPOSE[@]}" pull "${SERVICES[@]}" && return 0
    echo "deploy: pull failed (attempt ${attempt}/3)" >&2
    sleep $((attempt * 5))
  done
  return 1
}

rollback() {
  local service
  for service in "${SERVICES[@]}"; do
    docker image inspect "acme-salary-${service}:rollback" >/dev/null 2>&1 || {
      echo "deploy: no previous image for ${service}; cannot roll back" >&2
      return 1
    }
  done
  echo "deploy: rolling back to the previous release" >&2
  API_IMAGE=acme-salary-api:rollback WEB_IMAGE=acme-salary-web:rollback \
    "${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT"
}

snapshot_running_images
[[ "${SKIP_PULL:-0}" == "1" ]] || pull_images

if "${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT"; then
  echo "$TAG" > .release
  docker image prune -f >/dev/null
  echo "deploy: ${TAG} is live"
else
  echo "deploy: ${TAG} did not become healthy" >&2
  rollback || true
  exit 1
fi
