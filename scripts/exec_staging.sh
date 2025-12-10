#!/bin/bash
set -euo pipefail

# ---------- CONFIG DE BASE ----------
PROJECT_DIR="/home/deploy/Gestion-de-stock"
COMPOSE_FILE="docker-compose.prod.yml"

ENV_FILE_STAGING=".env.staging"
ENV_FILE_PROD=".env"      # utilisé juste pour démarrer la DB prod

STAGING_PROJECT_NAME="gestion-de-stock-staging"
EXPECTED_BRANCH="release"

# ---------- CONFIG BDD ----------
# ⚠️ Doit correspondre à tes .env (prod / staging)
PROD_DB_USER="root"
PROD_DB_PASS="root"
PROD_DB_NAME="gestion_stock"

STAGING_DB_USER="root"
STAGING_DB_PASS="root"
STAGING_DB_NAME="gestion_stock_staging"

echo "🚀 Déploiement STAGING (Docker) en cours..."

cd "$PROJECT_DIR"

if [ -f "$ENV_FILE_PROD" ]; then
  echo "ℹ️  Fichier d'environnement PROD détecté : $ENV_FILE_PROD (utilisé pour démarrer la DB prod)"
fi

# Vérifie la branche Git
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  echo "⚠️  Attention : tu es sur la branche '$CURRENT_BRANCH' (attendu : '$EXPECTED_BRANCH' pour STAGING)"
fi

echo "⬇️  git pull --ff-only"
if ! git pull --ff-only; then
  echo "❌ ERREUR : git pull a échoué (conflit ou historique non linéaire)"
  exit 1
fi

# Vérifie le .env.staging
if [ ! -f "$ENV_FILE_STAGING" ]; then
  echo "❌ ERREUR : fichier d'environnement '$ENV_FILE_STAGING' introuvable"
  exit 1
fi
echo "✅ Fichier d'environnement utilisé pour STAGING : $ENV_FILE_STAGING"

# ---------- STOP STAGING ----------
echo "🛑 Arrêt des conteneurs existants (STAGING)"
docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE_STAGING" \
  -p "$STAGING_PROJECT_NAME" \
  down --remove-orphans

# ---------- DB PROD ----------
if [ -f "$ENV_FILE_PROD" ]; then
  echo "🐬 Démarrage (ou vérification) de la DB PROD..."
  docker compose \
    -f "$COMPOSE_FILE" \
    --env-file "$ENV_FILE_PROD" \
    up -d db
else
  echo "⚠️  Avertissement : aucun fichier $ENV_FILE_PROD trouvé, je suppose que la DB PROD tourne déjà."
fi

# ---------- DB STAGING ----------
echo "🐬 Démarrage de la base de données STAGING seule..."
docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE_STAGING" \
  -p "$STAGING_PROJECT_NAME" \
  up -d db

# ---------- FONCTION ATTENTE HEALTH ----------
wait_healthy() {
  local cid="$1"
  local name="$2"

  echo "⏳ Attente que le container $name ($cid) soit healthy..."
  for i in {1..30}; do
    status=$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo "unknown")
    if [ "$status" = "healthy" ]; then
      echo "✅ $name est healthy"
      return 0
    fi
    sleep 2
  done
  echo "❌ $name n'est pas healthy après l'attente"
  exit 1
}

# Récupère les IDs des containers DB
PROD_DB_CONTAINER=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_PROD" ps -q db || true)
STAGING_DB_CONTAINER=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE_STAGING" -p "$STAGING_PROJECT_NAME" ps -q db || true)

if [ -z "$PROD_DB_CONTAINER" ]; then
  echo "❌ Impossible de trouver le container DB PROD (service 'db')."
  exit 1
fi

if [ -z "$STAGING_DB_CONTAINER" ]; then
  echo "❌ Impossible de trouver le container DB STAGING (service 'db')."
  exit 1
fi

wait_healthy "$PROD_DB_CONTAINER" "DB PROD"
wait_healthy "$STAGING_DB_CONTAINER" "DB STAGING"

# ---------- COPIE PROD → STAGING ----------
echo "💾 Copie de la base PROD → STAGING"
echo "    PROD    : $PROD_DB_USER@$PROD_DB_NAME"
echo "    STAGING : $STAGING_DB_USER@$STAGING_DB_NAME"

docker exec "$PROD_DB_CONTAINER" mysqldump \
  -u"$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" \
  | docker exec -i "$STAGING_DB_CONTAINER" mysql \
      -u"$STAGING_DB_USER" -p"$STAGING_DB_PASS" "$STAGING_DB_NAME"

echo "✅ Copie de la base terminée"

# ---------- MIGRATIONS PRISMA SUR STAGING ----------
echo "📜 Exécution des migrations Prisma sur STAGING (si besoin)"
docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE_STAGING" \
  -p "$STAGING_PROJECT_NAME" \
  run --rm server npx prisma migrate deploy || {
    echo "⚠️  Attention : échec des migrations Prisma STAGING (vérifie les logs)."
}

# ---------- STACK COMPLET STAGING ----------
echo "🚢 Rebuild & démarrage des conteneurs STAGING"
docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE_STAGING" \
  -p "$STAGING_PROJECT_NAME" \
  up -d --build

echo "✅ Containers STAGING à jour"

echo "🧹 Nettoyage des images Docker inutilisées (dangling)"
docker image prune -f >/dev/null || true

echo "🎉 Déploiement STAGING terminé"
