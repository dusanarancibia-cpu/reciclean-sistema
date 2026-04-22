# Esquema de herramientas — Reciclean-Farex

> Catalogo completo de herramientas externas del sistema. Cargar cuando se va a tocar alguna.

---

## 1. Supabase (BD principal)

- **Proyecto:** `reciclean-sistema`
- **Region:** Sao Paulo
- **URL:** `https://eknmtsrtfkzroxnovfqn.supabase.co`
- **Dashboard SQL Editor:** `https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new`
- **Tablas:** ver `TABLAS.md` (17 operativas + 5 en creacion + 7 propuestas)
- **Credenciales:**
  - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` (no commitear)
  - `SUPABASE_SERVICE_KEY` para migraciones DDL (solo Dusan/Pablo)
- **RLS:** activado en tablas v4.1+. Policies `service_role only` por defecto.
- **Realtime:** `asistente_snapshot` es el canal Panel -> Asistente.

**Reglas:**
- Nunca `DROP TABLE` sin backup previo (Dashboard > Database > Backups > Create).
- Nuevas tablas: seguir convenciones de `SKILL.md` seccion "Convenciones de naming".
- Migraciones: guardar en `sql/` del repo con prefijo `AAAAMMDD_descripcion.sql`.

---

## 2. n8n (workflow Diego LIVE)

- **Instancia:** VPS 137.184.203.15 (Digital Ocean)
- **Workflow Diego:** `PWxwI2oyCRejxG82` (24 nodos)
- **Version actual:** v4.1.5.3 LIVE (v4.2 STAGING en preparacion)
- **Flujo:** WhatsApp -> Meta Cloud API -> n8n webhook -> `supabase-whitelist` -> `parsear` -> `es-mensaje-autorizado` -> `supabase-contactos-get` -> `pre-claude-lookup` -> `claude-api` -> `preparar-respuesta` -> `enviar-whatsapp` -> `log-conversacion-supabase`
- **Credenciales:**
  - `N8N_API_KEY` — para PUT/GET workflows via API (FALTANTE — bloquea P2, P5)
- **Backups:** `7_backup-prompts/incidentes/` con timestamp antes de cada patch

**Reglas:** ver `PROTOCOLOS.md` seccion "Tocar Diego LIVE".

---

## 3. Meta Cloud API (WhatsApp Business)

- **Numero Diego Alonso:** +56 9 6192 6365
- **Numero Dusan:** +56 9 6306 9065
- **Uso:** recibir y enviar mensajes via n8n (nodos `webhook` y `enviar-whatsapp`)
- **Credenciales:** token en n8n (no en repo)

**Reglas:**
- Diego **NO** envia mensajes a terceros por iniciativa propia. Solo responde al remitente.
- Para coordinar entre equipo: Diego redacta borrador + link `wa.me` (usuario envia).

---

## 4. GitHub (repo publico)

- **Repo:** `dusanarancibia-cpu/reciclean-sistema`
- **Branch produccion:** `main` (deploy auto a Vercel)
- **Branch activa actual:** `claude/unified-data-protocol-skill-yYQky`
- **PRs abiertos:** ver `mcp__github__list_pull_requests`
- **Credenciales:** `GITHUB_PAT` (vence 27-abr, renovar antes)

**MCP disponibles (prefijo `mcp__github__`):**
- Lectura: `list_pull_requests`, `get_file_contents`, `list_branches`, `list_commits`, `list_issues`, `search_code`, `pull_request_read`, `issue_read`
- Escritura: `create_pull_request`, `update_pull_request`, `add_issue_comment`, `create_or_update_file`, `push_files`, `merge_pull_request`
- Reviews: `add_comment_to_pending_review`, `pull_request_review_write`, `resolve_review_thread`

**Reglas:**
- Nunca `push --force` a `main`.
- Nunca commit directo a `main`. Siempre via PR.
- Commits con mensaje descriptivo + link sesion Claude.
- Repo publico: nunca credenciales en codigo.

---

## 5. Vercel (deploy frontend)

- **URL produccion:** `reciclean-sistema.vercel.app`
- **Trigger:** push a `main` en GitHub
- **URLs cortas (redirects en `vercel.json`):**
  - `/conoce-diego` -> `/diego-presentacion.html`
  - `/coordinar-equipo` -> `/diego-coordinar.html`
  - `/preguntas` -> `/diego-faq.html`
  - `/ejemplos` -> `/diego-ejemplos.html`
  - `/dar-feedback` -> `/diego-feedback.html`
  - `/videos-diego` -> `/diego-video-script.html`

**Reglas:**
- Cambios a `vercel.json` requieren merge a `main` para activarse.
- Para env vars de build: Vercel Dashboard > Project Settings (no `.env.local`).

---

## 6. Claude Code (este entorno)

- **Plataforma:** CLI, desktop, web, IDE extensions
- **Modelo activo:** Opus 4.7 (1M contexto)
- **Hooks disponibles:** `SessionStart`, `PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`
- **Skills del proyecto:** `.claude/skills/` (este directorio)
- **Skills user global:** `~/.claude/skills/`
- **Settings:** `.claude/settings.json` (proyecto) y `~/.claude/settings.json` (global)

**Skills relevantes:**
- `protocolo-datos-unificado` (este) — bases transversales
- `reciclean-farex-comercial` (mencionada en CLAUDE.md) — actualizacion de precios
- `session-start-hook` (global) — setup inicial

---

## 7. Claude API (Diego en n8n)

- **Modelo:** Claude Haiku (en nodo `claude-api` del workflow)
- **Skill recomendada para desarrollo:** `claude-api` (trigger por `anthropic` SDK)
- **Patches al system prompt:** GET workflow -> extraer -> diff -> OK Dusan -> PUT
- **Modelos vigentes (Abril 2026):** Opus 4.7, Sonnet 4.6, Haiku 4.5.

---

## 8. VPS (137.184.203.15)

- **Proveedor:** Digital Ocean
- **Hospeda:** n8n + posiblemente otros workers
- **Acceso:** SSH (credenciales solo Dusan/Pablo)

---

## 9. Mapa de integracion

```
Usuario WhatsApp
    |
    v
Meta Cloud API
    |
    v
n8n (VPS 137.184.203.15)
    |-- workflow Diego PWxwI2oyCRejxG82
    |     |
    |     v
    |   Claude Haiku (via claude-api)
    |     ^
    |     |
    |   Supabase (contactos, conversaciones, procesos_empresa, ...)
    |
    v
Meta Cloud API (respuesta)
    |
    v
Usuario WhatsApp


Panel Admin (Vite)
    |
    v
Supabase (precios, materiales, ...)
    |
    v (Realtime)
    |
Asistente Comercial + Widgets publicos (reciclean.cl, farex.cl)


Dusan / Pablo
    |
    |-- Claude Code -> GitHub -> Vercel (auto-deploy a main)
    |-- Supabase SQL Editor (migraciones)
    |-- n8n UI (workflow Diego)
    |-- Meta WA Business Manager (numero +56 9 6192 6365)
```

---

## 10. Contactos del equipo (operativo, no tabla aun)

Referencia rapida. **Migrar a tabla `contactos` Supabase cuando se ejecute fase 2.**

| Nombre | Telefono | Nivel | Rol | Sucursal |
|---|---|---|---|---|
| Dusan Arancibia | +56963069065 | 3 | CEO | todas |
| Andrea Rivera | +56961596938 | 2 | Comercial | Remota |
| Pablo Arancibia | +56923962018 | 2 | Tech | Remoto |
| Ingrid Cancino | +56961908322 | 2 | Admin | Talca |
| Juan Mendoza | +56990552591 | 2 | Operaciones | Cerrillos |
| Nicolas Arancibia | +56923704441 | 2 | Admin | Cerrillos |
| Dyana | +56967280603 | 2 | Admin/Pagos | Cerrillos |
| Cesar Mora | +56994541662 | 2 | — | Remoto |
| Jair Sanmartin | +56986558236 | 2 | Permisologia | Transversal |

---

## 11. Credenciales requeridas (estado)

| Credencial | Estado | Desbloquea |
|---|---|---|
| `N8N_API_KEY` | FALTANTE | P2 (PATCH coordinacion equipo), P5 (bugs v4.3) |
| `SUPABASE_SERVICE_KEY` | disponible (Dusan) | nueva columna `anuncio_nombre_visto`, migraciones DDL |
| `GITHUB_PAT` | vence 27-abr | push / PR / issues |

Al arrancar sesion, la skill debe preguntar a Dusan si trae las credenciales pendientes.
