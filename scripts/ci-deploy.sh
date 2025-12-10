#!/bin/bash
set -euo pipefail

# Petit wrapper pour compatibilité :
#   ./scripts/ci-deploy.sh prod    -> ./scripts/exec_prod.sh
#   ./scripts/ci-deploy.sh staging -> ./scripts/exec_staging.sh

ENVIRONMENT="${1:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$ENVIRONMENT" in
  prod|production)
    exec "${SCRIPT_DIR}/exec_prod.sh"
    ;;

  staging|preprod)
    exec "${SCRIPT_DIR}/exec_staging.sh"
    ;;

  *)
    echo "Usage: $0 <prod|staging>"
    exit 1
    ;;
esac
