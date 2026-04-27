#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose-test.yml --env-file $ROOT/.env"

FRESH=""
for arg in "$@"; do
  case $arg in
    --fresh|-f) FRESH=1 ;;
  esac
done

if ! grep -q "^WEBHOOK_SECRET=.\+" "$ROOT/.env" 2>/dev/null; then
  GENERATED=$(openssl rand -hex 32)
  if grep -q "^WEBHOOK_SECRET=" "$ROOT/.env" 2>/dev/null; then
    sed -i "s|^WEBHOOK_SECRET=.*|WEBHOOK_SECRET=$GENERATED|" "$ROOT/.env"
  else
    printf '\nWEBHOOK_SECRET=%s\n' "$GENERATED" >> "$ROOT/.env"
  fi
  echo "==> Generated WEBHOOK_SECRET"
fi

if [ -n "$FRESH" ]; then
  echo "==> Cleaning up..."
  $COMPOSE down -v 2>/dev/null || true
fi

WEBHOOK_BASE_URL=$(grep "^WEBHOOK_BASE_URL=" "$ROOT/.env" | awk -F= '{print $2}')
BACKEND_WEBHOOK_URL="${WEBHOOK_BASE_URL}/api/webhooks/gitlab"

echo "==> Building images..."
$COMPOSE build gitlab-init

echo "==> Starting infra (webhook → ${BACKEND_WEBHOOK_URL})..."
BACKEND_WEBHOOK_URL="${BACKEND_WEBHOOK_URL}" $COMPOSE up -d postgres redis gitlab gitlab-runner gitlab-init

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

echo ""
echo "    GitLab : http://localhost:8181  (root / \$GITLAB_ROOT_PASSWORD)"
echo "    Postgres: localhost:5432"
echo "    Redis   : localhost:6379"
echo ""
echo "    Lance ton backend localement avec ces vars d'env :"
echo "    GITLAB_URL=http://localhost:8181"
echo "    GITLAB_PUBLIC_URL=http://localhost:8181"
echo "    WEBHOOK_BASE_URL=${WEBHOOK_BASE_URL}"
echo ""
