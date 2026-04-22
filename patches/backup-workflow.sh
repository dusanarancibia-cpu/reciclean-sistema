#!/usr/bin/env bash
# Backup del workflow n8n Diego antes de aplicar PATCH
# Uso: bash patches/backup-workflow.sh
# Requiere: N8N_API_KEY exportada en el shell

set -euo pipefail

: "${N8N_API_KEY:?N8N_API_KEY must be set. export N8N_API_KEY=<tu-key>}"
N8N_URL="${N8N_URL:-https://n8n.reciclean.cl}"
WORKFLOW_ID="${WORKFLOW_ID:-PWxwI2oyCRejxG82}"

BACKUP_DIR="patches/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="$BACKUP_DIR/workflow_${TIMESTAMP}.json"

echo "Backup del workflow $WORKFLOW_ID..."

HTTP_CODE=$(curl -sS -o "$OUTPUT" -w "%{http_code}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows/$WORKFLOW_ID")

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: HTTP $HTTP_CODE"
  echo "Respuesta:"
  cat "$OUTPUT"
  rm "$OUTPUT"
  exit 1
fi

SIZE=$(wc -c < "$OUTPUT")
echo "OK. Backup guardado en: $OUTPUT ($SIZE bytes)"
echo ""
echo "Proximo paso: extraer el system prompt actual"
echo "  jq '.nodes[] | select(.name == \"claude-api\") | .parameters.systemMessage' \\"
echo "    $OUTPUT > $BACKUP_DIR/prompt_actual.txt"
