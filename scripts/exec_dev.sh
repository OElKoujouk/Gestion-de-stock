#!/bin/bash
set -euo pipefail

# Dev deployment script (Docker) with optional DB sync

PROJECT_DIR="$(git rev-parse --show-toplevel)"
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.dev"

echo "[DEV] Starting Docker deployment..."

cd "$PROJECT_DIR"
echo "[DEV] Working directory: $PROJECT_DIR"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "[WARN] Current branch '$CURRENT_BRANCH' (expected: develop)"
fi

echo "[GIT] git pull"
git pull

if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] $ENV_FILE not found"
  exit 1
fi
echo "[OK] $ENV_FILE found"

# Load env vars (e.g., MYSQL_*) for optional DB sync
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "[DOCKER] down --remove-orphans"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down --remove-orphans

echo "[DOCKER] prune build cache (buildx/builder)"
docker buildx prune -af >/dev/null 2>&1 || docker builder prune -af -f >/dev/null 2>&1 || true

echo "[DOCKER] build --pull --no-cache"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull --no-cache

echo "[DOCKER] up -d"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

echo "[DB] Waiting for MySQL to be ready..."
for i in {1..20}; do
  if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db mysqladmin ping -uroot -p"${MYSQL_ROOT_PASSWORD:-root}" --silent; then
    break
  fi
  echo "  > retrying DB ping ($i/20)..."
  sleep 2
done

echo "[PRISMA] Applying migrations (deploy)"
set +e
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T server npx prisma migrate deploy
DEPLOY_EXIT=$?
set -e

if [ "$DEPLOY_EXIT" -ne 0 ]; then
  echo "[WARN] prisma migrate deploy failed (possible drift)."
  if [ "${DEV_RESET_ON_DRIFT:-1}" = "1" ]; then
    echo "[PRISMA] Resetting dev database (data will be dropped) ..."
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T server npx prisma migrate reset --force --skip-seed
    echo "[PRISMA] Re-applying migrations after reset"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T server npx prisma migrate deploy
  else
    echo "[ERROR] Drift detected. Set DEV_RESET_ON_DRIFT=1 to auto-reset dev DB or fix manually."
    exit 1
  fi
fi

echo "[PRISMA] Generating client"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T server npx prisma generate

echo "[SERVER] Waiting for API to listen on ${SERVER_PORT:-4000}..."
for i in {1..30}; do
  if nc -z localhost "${SERVER_PORT:-4000}"; then
    echo "[SERVER] Ready"
    break
  fi
  echo "  > retrying server port check ($i/30)..."
  sleep 2
done

echo "[OK] Dev containers up to date"

echo "[CLEAN] docker image prune -f"
docker image prune -f

# Optional DB sync from remote (staging/prod)
if [ "${SYNC_DEV_DB:-0}" = "1" ]; then
  if [ -z "${DB_SYNC_SOURCE_HOST:-}" ] || [ -z "${DB_SYNC_SOURCE_USER:-}" ] || [ -z "${DB_SYNC_SOURCE_PASSWORD:-}" ] || [ -z "${DB_SYNC_SOURCE_NAME:-}" ]; then
    echo "[WARN] DB sync skipped: missing DB_SYNC_SOURCE_HOST/USER/PASSWORD/NAME"
  else
    SRC_PORT="${DB_SYNC_SOURCE_PORT:-3306}"
    TARGET_DB="${MYSQL_DATABASE:-gestion_stock}"
    TARGET_PASS="${MYSQL_ROOT_PASSWORD:-root}"
    TMP_DUMP="$(mktemp)"
    cleanup() { [ -n "${TMP_DUMP:-}" ] && rm -f "$TMP_DUMP"; }
    trap cleanup EXIT

    echo "[DB] Dumping ${DB_SYNC_SOURCE_HOST}:${SRC_PORT}/${DB_SYNC_SOURCE_NAME}..."
    docker run --rm mysql:8.0 sh -c "mysqldump -h ${DB_SYNC_SOURCE_HOST} -P ${SRC_PORT} -u${DB_SYNC_SOURCE_USER} -p${DB_SYNC_SOURCE_PASSWORD} --single-transaction --quick ${DB_SYNC_SOURCE_NAME}" >"$TMP_DUMP"

    echo "[DB] Importing into dev database (${TARGET_DB})..."
    cat "$TMP_DUMP" | docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T db mysql -uroot -p"${TARGET_PASS}" "${TARGET_DB}"
  fi
fi

echo "[DEV] Deployment finished"
