#!/bin/bash
set -euo pipefail

ENVIRONMENT="${1:-}"
TARGET_BRANCH="${2:-}"

if [[ -z "$ENVIRONMENT" ]]; then
  echo "Usage: $0 <staging|prod> <branch>"
  exit 1
fi

if [[ "$ENVIRONMENT" == "prod" ]]; then
  ENV_FILE=".env.prod"
  COMPOSE_FILE="docker-compose.prod.yml"
  BRANCH="${TARGET_BRANCH:-main}"
else
  ENVIRONMENT="staging"
  ENV_FILE=".env.dev"
  COMPOSE_FILE="docker-compose.dev.yml"
  BRANCH="${TARGET_BRANCH:-develop}"
fi

test -f "$ENV_FILE" || { echo "Missing $ENV_FILE"; exit 1; }
test -f "$COMPOSE_FILE" || { echo "Missing $COMPOSE_FILE"; exit 1; }

echo "🚀 Deploy $ENVIRONMENT — branch $BRANCH"

git fetch --all --prune
git checkout "$BRANCH"
git pull

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down --remove-orphans
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
docker image prune -f
