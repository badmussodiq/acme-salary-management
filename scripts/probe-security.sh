#!/usr/bin/env bash
# Probes a running stack (default http://localhost:3000) for the main security controls.
set -u
BASE="${1:-http://localhost:3000}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "--- response headers on /login"
curl -sI "$BASE/login" | grep -iE '^(content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|x-powered-by)' | cut -c1-200

echo "--- 200 KB body through the web proxy (expect 413)"
head -c 200000 /dev/zero | tr '\0' 'x' > "$WORK/big.txt"
curl -s -o /dev/null -w 'status %{http_code}\n' -X POST -H 'Content-Type: application/json' \
  --data-binary @"$WORK/big.txt" "$BASE/api/v1/auth/login"

echo "--- unauthenticated business call (expect 401 envelope)"
curl -s "$BASE/api/v1/employees" | cut -c1-160
echo

echo "--- injection-style login body (expect 400, 401 or 429 when rate limited, never 500)"
curl -s -o /dev/null -w 'status %{http_code}\n' -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"a@b.co' OR 1=1--\",\"password\":\"x\"}" "$BASE/api/v1/auth/login"

echo "--- prototype-pollution body (expect 400)"
curl -s -o /dev/null -w 'status %{http_code}\n' -X POST -H 'Content-Type: application/json' \
  -d '{"__proto__":{"admin":true},"email":"a@b.co","password":"x"}' "$BASE/api/v1/auth/login"

echo "--- API port published directly? (expect no answer)"
curl -s -o /dev/null -m 3 -w 'status %{http_code}\n' http://localhost:3001/api/v1/health/live || echo "not reachable from the host"
