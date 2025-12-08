#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BUILD_IMAGES=1
RUN_PRUNE=1
SERVICES=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --env-file <path>     Fichier .env à utiliser (défaut: .env.prod)
  --compose-file <path> Fichier docker-compose (défaut: docker-compose.prod.yml)
  --no-build            Ne pas forcer la reconstruction des images
  --services "a b"      Limiter le déploiement à certains services
  --skip-prune          Ne pas lancer 'docker image prune'
  -h, --help            Affiche cette aide
EOF
}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

trap 'log "❌ Déploiement interrompu (code $?)."' ERR

while (($#)); do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --no-build)
      BUILD_IMAGES=0
      shift
      ;;
    --services)
      SERVICES="$2"
      shift 2
      ;;
    --skip-prune)
      RUN_PRUNE=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Option inconnue: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker n'est pas installé ou introuvable dans le PATH." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERREUR : $ENV_FILE introuvable"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ ERREUR : $COMPOSE_FILE introuvable"
  exit 1
fi

log "🚀 Déploiement PROD (Docker) en cours..."
log "➡️  Fichier env : $ENV_FILE"
log "➡️  Compose file : $COMPOSE_FILE"

COMPOSE_CMD=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
UP_ARGS=(up -d)
if (( BUILD_IMAGES )); then
  UP_ARGS+=(--build)
fi

if [ -n "$SERVICES" ]; then
  # Permet soit des espaces, soit des virgules
  IFS=', ' read -r -a SERVICE_LIST <<< "$SERVICES"
  UP_ARGS+=("${SERVICE_LIST[@]}")
fi

log "⚙️  Mise à jour des containers..."
"${COMPOSE_CMD[@]}" "${UP_ARGS[@]}"
log "✅ Containers PROD à jour"

log "ℹ️  État courant :"
"${COMPOSE_CMD[@]}" ps

if (( RUN_PRUNE )); then
  log "🧹 Nettoyage des images orphelines..."
  docker image prune -f
fi

log "🎉 Déploiement PROD terminé"
