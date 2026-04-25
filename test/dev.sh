#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$(dirname "$0")"

FRESH=""
for arg in "$@"; do
  case $arg in
    --fresh|-f) FRESH=1 ;;
  esac
done

if [ -n "$FRESH" ]; then
  echo "==> Cleaning up..."
  docker compose -f docker-compose-test.yml --env-file "$ROOT/.env" down -v 2>/dev/null || true
fi

echo "==> Starting containers..."
docker compose -f docker-compose-test.yml --env-file "$ROOT/.env" up -d --build

INIT_STATUS=$(docker inspect --format='{{.State.Status}}' watchenv-gitlab-init 2>/dev/null || echo "missing")

if [ "$INIT_STATUS" = "running" ]; then
  echo "==> Waiting for gitlab-init (a few minutes)..."
  while [ "$(docker inspect --format='{{.State.Status}}' watchenv-gitlab-init 2>/dev/null)" = "running" ]; do
    sleep 10
    echo "    Still initializing..."
  done
fi

EXIT_CODE=$(docker inspect --format='{{.State.ExitCode}}' watchenv-gitlab-init 2>/dev/null || echo "1")
if [ "$EXIT_CODE" != "0" ]; then
  echo "ERROR: gitlab-init failed (exit $EXIT_CODE)"
  docker logs watchenv-gitlab-init 2>&1 | tail -30
  exit 1
fi

LOGS=$(docker logs watchenv-gitlab-init 2>&1)
CLIENT_ID=$(echo "$LOGS" | grep "GITLAB_CLIENT_ID=" | tail -1 | awk -F'GITLAB_CLIENT_ID=' '{print $2}')
CLIENT_SECRET=$(echo "$LOGS" | grep "GITLAB_CLIENT_SECRET=" | tail -1 | awk -F'GITLAB_CLIENT_SECRET=' '{print $2}')

if [ -n "$CLIENT_ID" ] && [ -n "$CLIENT_SECRET" ]; then
  sed -i "s|^GITLAB_CLIENT_ID=.*|GITLAB_CLIENT_ID=$CLIENT_ID|" "$ROOT/.env"
  sed -i "s|^GITLAB_CLIENT_SECRET=.*|GITLAB_CLIENT_SECRET=$CLIENT_SECRET|" "$ROOT/.env"
  echo "==> .env updated (GITLAB_CLIENT_ID=$CLIENT_ID)"
fi

sed -i "s|^WEBHOOK_BASE_URL=.*|WEBHOOK_BASE_URL=http://host.docker.internal:3000|" "$ROOT/.env"

echo "==> Running migrations..."
(cd "$ROOT" && pnpm migrate)

echo ""
echo "==> Starting backend and frontend..."

cleanup() {
  echo ""
  echo "==> Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd "$ROOT" && pnpm --filter backend start:dev) &
BACKEND_PID=$!

(cd "$ROOT" && pnpm --filter frontend start) &
FRONTEND_PID=$!

echo ""
echo "    Frontend : http://localhost:4200"
echo "    GitLab   : http://localhost:8181  (root / \$GITLAB_ROOT_PASSWORD)"
echo ""
echo "    Ctrl+C pour arrêter"
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID"
