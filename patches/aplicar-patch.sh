#!/usr/bin/env bash
# Aplica el nuevo system prompt al workflow n8n Diego
# Uso: bash patches/aplicar-patch.sh <path-a-prompt-nuevo.txt>
# Requiere: N8N_API_KEY exportada en el shell + jq instalado

set -euo pipefail

: "${N8N_API_KEY:?N8N_API_KEY must be set. export N8N_API_KEY=<tu-key>}"
N8N_URL="${N8N_URL:-https://n8n.reciclean.cl}"
WORKFLOW_ID="${WORKFLOW_ID:-PWxwI2oyCRejxG82}"

if [ $# -lt 1 ]; then
  echo "Uso: bash patches/aplicar-patch.sh <path-a-prompt-nuevo.txt>"
  exit 1
fi

NEW_PROMPT_FILE="$1"

if [ ! -f "$NEW_PROMPT_FILE" ]; then
  echo "ERROR: archivo $NEW_PROMPT_FILE no existe"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq no esta instalado. Instalar con: sudo apt install jq"
  exit 1
fi

# 1. Obtener workflow actual
echo "Obteniendo workflow actual..."
CURRENT=$(mktemp)
trap "rm -f $CURRENT" EXIT

HTTP_CODE=$(curl -sS -o "$CURRENT" -w "%{http_code}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows/$WORKFLOW_ID")

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR obteniendo workflow: HTTP $HTTP_CODE"
  cat "$CURRENT"
  exit 1
fi

# 2. Actualizar systemMessage del nodo claude-api
echo "Parchando systemMessage del nodo claude-api..."
NEW_PROMPT=$(cat "$NEW_PROMPT_FILE")

PATCHED=$(mktemp)
trap "rm -f $CURRENT $PATCHED" EXIT

jq --arg prompt "$NEW_PROMPT" '
  .nodes = (.nodes | map(
    if .name == "claude-api" then
      .parameters.systemMessage = $prompt
    else
      .
    end
  ))
' "$CURRENT" > "$PATCHED"

# 3. PUT del workflow parchado
echo "Aplicando patch al workflow (PUT)..."
RESPONSE=$(mktemp)
trap "rm -f $CURRENT $PATCHED $RESPONSE" EXIT

HTTP_CODE=$(curl -sS -X PUT -o "$RESPONSE" -w "%{http_code}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @"$PATCHED" \
  "$N8N_URL/api/v1/workflows/$WORKFLOW_ID")

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR aplicando patch: HTTP $HTTP_CODE"
  cat "$RESPONSE"
  echo ""
  echo "Para hacer rollback:"
  echo "  bash patches/rollback-workflow.sh <ultimo-backup>"
  exit 1
fi

echo "OK. PATCH aplicado al workflow $WORKFLOW_ID."
echo ""
echo "Proximo paso: smoke test"
echo "  1. Desde WhatsApp de Dusan enviar 'Diego, test v4.3' al +56 9 6192 6365"
echo "  2. Validar saludo 'Diego Alonso' + anuncio one-shot + sin loops"
echo "  3. Probar flujo coordinacion con un pedido de borrador"
echo ""
echo "Si algo falla, rollback:"
echo "  bash patches/rollback-workflow.sh <backup-previo>"
