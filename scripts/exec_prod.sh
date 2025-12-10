#!/bin/bash
set -euo pipefail

# Déploiement PROD uniquement

PROJECT_DIR="/home/deploy/Gestion-de-stock"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"   # Utilise .env.prod si présent

echo "🚀 Déploiement PROD (Docker) en cours..."

cd "$PROJECT_DIR"
echo "📦 Répertoire de déploiement : $PROJECT_DIR"

# Si .env.prod existe, on le préfère
if [ -f ".env.prod" ]; then
  ENV_FILE=".env.prod"
fi

# Vérif branche
EXPECTED_BRANCH="main"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  echo "⚠️  Attention : tu es sur la branche '$CURRENT_BRANCH' (attendu : '$EXPECTED_BRANCH' pour PROD)"
  # exit 1
fi

echo "⬇️  git pull --ff-only"
if ! git pull --ff-only; then
  echo "❌ ERREUR : git pull a échoué (conflit ou historique non linéaire)"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERREUR : fichier d'environnement '$ENV_FILE' introuvable"
  exit 1
fi

echo "✅ Fichier d'environnement utilisé : $ENV_FILE"

echo "🛑 Arrêt des conteneurs existants (PROD)"
docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" \
  down --remove-orphans

echo "🚢 Rebuild & démarrage des conteneurs (PROD)"
docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" \
  up -d --build

echo "✅ Containers PROD à jour"

echo "🧹 Nettoyage des images Docker inutilisées (dangling)"
docker image prune -f

echo "🎉 Déploiement PROD terminé"
