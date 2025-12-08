#!/bin/bash
set -e

echo "🚀 Déploiement PROD (Docker) en cours..."

# Vérification fichier env prod
if [ ! -f ".env.prod" ]; then
  echo "❌ ERREUR : .env.prod introuvable"
  exit 1
fi

echo "✅ .env.prod trouvé"

# Build + restart prod
docker compose \
  --env-file .env.prod \
  -f docker-compose.prod.yml up -d --build

echo "✅ Containers PROD à jour"

# Nettoyage images inutiles
docker image prune -f

echo "🎉 Déploiement PROD terminé"