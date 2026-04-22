# Patch Diego Alonso v4.3 — Guia de aplicacion

> **Objetivo:** aplicar en el system prompt del nodo `claude-api` del
> workflow n8n `PWxwI2oyCRejxG82` los 3 alcances del P2:
> a) Bloque "COORDINACION ENTRE EL EQUIPO"
> b) Cambio de nombre "Diego" -> "Diego Alonso"
> c) Anuncio one-shot por persona
>
> Mas las reglas anti-bug de P5 (28 bugs documentados).
>
> **Bloqueador resuelto:** Dusan entrego N8N_API_KEY en sesion movil
> 20-abr tarde. Aplicar en sesion PC.

---

## Paso 0. Prerequisitos

En el terminal del PC, exportar la key una sola vez:

```bash
export N8N_API_KEY='<clave-que-Dusan-tiene>'
export N8N_URL='https://n8n.reciclean.cl'
export WORKFLOW_ID='PWxwI2oyCRejxG82'
```

Verificar acceso:

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows/$WORKFLOW_ID"
```

Debe responder **HTTP 200**. Si no: validar key y URL.

---

## Paso 1. Backup del workflow actual

```bash
bash patches/backup-workflow.sh
```

Esto genera `patches/backups/workflow_YYYYMMDD_HHMMSS.json`. Guardar en
lugar seguro (si algo sale mal, es el rollback).

---

## Paso 2. Extraer el system prompt actual del nodo claude-api

```bash
# Asumiendo que el ultimo backup se llama workflow_YYYYMMDD_HHMMSS.json
LATEST=$(ls -t patches/backups/workflow_*.json | head -1)

jq '.nodes[] | select(.name == "claude-api") | .parameters.systemMessage' \
  "$LATEST" > patches/backups/prompt_actual.txt
```

Revisar `prompt_actual.txt` para ver con que estamos trabajando.

---

## Paso 3. Construir el nuevo prompt

Pedirle a Claude Code PC que:

1. Lea `patches/backups/prompt_actual.txt`.
2. Lea este archivo y `patches/diego-alonso-v43-bloques.md`.
3. Aplique los 3 alcances + las reglas anti-bug.
4. Guarde el resultado en `patches/backups/prompt_nuevo.txt`.
5. Muestre un **diff visible** del cambio.
6. Espere OK explicito de Dusan.

---

## Paso 4. Aplicar al workflow

```bash
bash patches/aplicar-patch.sh patches/backups/prompt_nuevo.txt
```

Este script:
1. Toma el workflow backup mas reciente.
2. Reemplaza el `systemMessage` del nodo `claude-api` con el contenido
   de `prompt_nuevo.txt`.
3. Hace PUT al workflow n8n.
4. Confirma con HTTP 200.

---

## Paso 5. Smoke test

Desde el WhatsApp de Dusan (+56963069065), enviar a Diego:

```
Diego, test v4.3
```

Debe responder:
1. Con el saludo "Diego Alonso" (no "Diego").
2. Incluyendo el anuncio one-shot (primera vez tras patch).
3. Sin loops de bienvenida si ya hubo chat reciente.

Despues, probar el flujo coordinacion con un mensaje simulado:

```
Diego, necesito que Andrea coordine un camion para cartón Talca-Santiago
```

Debe responder con un borrador listo para copiar + link `wa.me/56961596938`.

Si los 2 tests pasan: **PATCH OK**. Si falla: rollback.

---

## Paso 6. Rollback (solo si falla smoke test)

```bash
bash patches/rollback-workflow.sh patches/backups/workflow_YYYYMMDD_HHMMSS.json
```

Pone el workflow tal como estaba antes del PATCH.

---

## Paso 7. Requerimiento Supabase (YA HECHO 2026-04-22)

La columna `anuncio_diego_alonso_visto` ya existe en la tabla
`contactos` (BOOLEAN DEFAULT FALSE). Creada via MCP desde sesion
movil. Los 9 contactos activos estan en `false` y listos para recibir
el anuncio.

NOTA: NO usar `anuncio_nombre_visto` (flag previo de Pablo para otro
anuncio, tiene 7/9 contactos en true).

En el workflow n8n hay que configurar:
- Un nodo que consulte `anuncio_diego_alonso_visto` antes de responder.
- Si es `false`: prepender el anuncio al mensaje y actualizar a `true`.
- Si es `true`: responder normal sin anuncio.

Esto requiere editar la estructura del workflow (no solo el prompt).
Claude Code PC puede hacerlo via PUT completo.

---

## Archivos relacionados

- `patches/diego-alonso-v43-bloques.md` — texto exacto de los bloques
  a insertar
- `patches/bugs-a-corregir.md` — reglas especificas para el prompt que
  resuelven los 28 bugs de P5
- `patches/backup-workflow.sh` — script de backup
- `patches/aplicar-patch.sh` — script de PUT
- `patches/rollback-workflow.sh` — script de rollback
