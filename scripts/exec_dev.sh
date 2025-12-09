#!/bin/bash
set -euo pipefail

# Répertoire du projet = dossier racine Git (plus robuste que pwd)
PROJECT_DIR="$(git rev-parse --show-toplevel)"

COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.dev"

echo "🚀 Déploiement DEV (Docker) en cours..."

# Se place à la racine du projet
cd "$PROJECT_DIR"

echo "📦 Répertoire de déploiement : $PROJECT_DIR"

# Avertit si la branche n'est pas develop
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "⚠️  Attention : branche active '$CURRENT_BRANCH' (attendu : 'develop')"
fi

# Pull simple (DEV = permissif)
echo "⬇️  git pull"
git pull

# Vérifie la présence du fichier d'environnement DEV
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERREUR : $ENV_FILE introuvable"
  exit 1
fi

echo "✅ $ENV_FILE trouvé"

# Stop les containers existants
echo "🛑 docker compose down --remove-orphans"
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  down --remove-orphans

# Build + up
echo "🚢 docker compose up -d --build"
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  up -d --build

echo "✅ Containers DEV à jour"

# Nettoyage léger
echo "🧹 Nettoyage Docker (dangling images)"
docker image prune -f

echo "🎉 Déploiement DEV terminé"
