#!/bin/bash
set -euo pipefail

PROJECT_DIR="/home/deploy/Gestion-de-stock" # chemin racine du projet à déployer
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

echo "🚀 Déploiement PROD (Docker) en cours..."

# Se place dans le dossier du projet avant toute commande
cd "$PROJECT_DIR"

echo "📦 Répertoire de déploiement : $PROJECT_DIR"

# Avertit si la branche Git active n'est pas main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Attention : tu es sur la branche '$CURRENT_BRANCH' (attendu : 'main')"
  # exit 1
fi

# Récupère les dernières modifications (merge fast-forward uniquement)
echo "⬇️  git pull --ff-only"
if ! git pull --ff-only; then
  echo "❌ ERREUR : git pull a échoué (conflit ou historique non linéaire)"
  exit 1
fi

# Vérifie la présence du fichier d'environnement requis pour le compose
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERREUR : $ENV_FILE introuvable"
  exit 1
fi

echo "✅ $ENV_FILE trouvé"

# Arrête les conteneurs en cours tout en conservant les volumes
echo "🛑 docker compose down --remove-orphans"
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  down --remove-orphans

# Reconstruit et relance les conteneurs en arrière-plan
echo "🚢 docker compose up -d --build"
docker compose \
  --env-file "$ENV_FILE" \
  -f "$COMPOSE_FILE" \
  up -d --build

echo "✅ Containers PROD à jour"

# Nettoie les images Docker non utilisées (dangling)
echo "🧹 Nettoyage des images Docker inutilisées (dangling)"
docker image prune -f

echo "🎉 Déploiement PROD terminé"
