#!/usr/bin/env bash
# Rollback del workflow n8n Diego a un backup previo
# Uso: bash patches/rollback-workflow.sh <path-a-backup.json>
# Requiere: N8N_API_KEY exportada en el shell

set -euo pipefail

: "${N8N_API_KEY:?N8N_API_KEY must be set. export N8N_API_KEY=<tu-key>}"
N8N_URL="${N8N_URL:-https://n8n.reciclean.cl}"
WORKFLOW_ID="${WORKFLOW_ID:-PWxwI2oyCRejxG82}"

if [ $# -lt 1 ]; then
  echo "Uso: bash patches/rollback-workflow.sh <path-a-backup.json>"
  echo ""
  echo "Backups disponibles:"
  ls -lt patches/backups/workflow_*.json 2>/dev/null | head -5 || echo "  (ninguno)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: archivo $BACKUP_FILE no existe"
  exit 1
fi

echo "ATENCION: vas a restaurar el workflow $WORKFLOW_ID"
echo "Backup a restaurar: $BACKUP_FILE"
echo ""
read -p "Confirmar rollback? (escribe 'SI' para continuar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
  echo "Rollback cancelado."
  exit 0
fi

echo "Aplicando rollback..."
RESPONSE=$(mktemp)
trap "rm -f $RESPONSE" EXIT

HTTP_CODE=$(curl -sS -X PUT -o "$RESPONSE" -w "%{http_code}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @"$BACKUP_FILE" \
  "$N8N_URL/api/v1/workflows/$WORKFLOW_ID")

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR en rollback: HTTP $HTTP_CODE"
  cat "$RESPONSE"
  exit 1
fi

echo "OK. Rollback aplicado. Workflow restaurado desde $BACKUP_FILE."
