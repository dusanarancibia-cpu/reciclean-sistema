# HANDOFF · Pablo · Seguridad post-auditoría 22-may PM

> **De:** PC1 Dusan (modo autónomo)
> **Para:** PC2 Pablo (próxima sesión)
> **Fecha:** 2026-05-22 PM CLT
> **Branch:** `audit/panel-22may` (reciclean-sistema) · cambios EF en `reciclean-rdo` rama default
> **Contexto:** auditoría Diego 4 agentes paralelos + auditoría panel-rdo + mig 047 + mig 048

---

## 0 · RESUMEN ULTRA-EJECUTIVO

| # | Vulnerabilidad detectada | Status |
|---:|---|---|
| 1 | Webhook WhatsApp sin firma | 🟡 Código v2 listo en repo, **NECESITA DEPLOY + SECRET PABLO** |
| 2 | 5 tablas sin RLS | ✅ **CERRADO** vía mig 048 |
| 3 | 105 vistas SECURITY DEFINER | ✅ 94 migradas a INVOKER (mig 047) · 11 quedan DEFINER intencional |
| 4 | 68 políticas RLS USING(true) | 🟡 Marcadas `AUDIT22MAY_*` (mig 047 b2) · **mig 049 dedicada** pendiente Pablo + Dusan |
| 5 | 11 funciones SECURITY DEFINER expuestas a anon | ✅ 9 REVOKE + re-grant explícito · 2 intencionales |
| 6 | API key Anthropic Pablo expuesta | 🔴 **PENDIENTE Pablo: rotar** |
| 7 | 9 vistas panel.* DEFINER intencional (CRM + equipo) | 🟡 **PENDIENTE Pablo:** definir grants/policies en 7 tablas base para poder migrar a INVOKER |
| 8 | 4 tablas Diego v6.0 a crear | 🟡 **PENDIENTE firma D-DIEGO-PROMPT-V6 Dusan + mig 050 Pablo** |

---

## 1 · WEBHOOK WHATSAPP — Firma HMAC-SHA256 (lo que tenés que hacer)

### Estado del código
- **Archivo modificado:** `reciclean-rdo/supabase/functions/dieguito-whatsapp/index.ts`
- **De:** v1 (155 líneas, sin firma)
- **A:** v2 (~210 líneas, con HMAC-SHA256 + modo log-only por default)
- **Commit:** próximo push a `audit/panel-22may` (reciclean-rdo)
- **NO deployado todavía** — PC1 no opera Edge Functions en prod (CLAUDE.md PC Dusan).

### Lo que vos hacés (3 pasos, ~5 min)

**Paso 1 — Obtener App Secret de Meta**
1. https://developers.facebook.com/ → tu App de WhatsApp
2. Settings → Basic
3. Copiar **App Secret** (clic en "Show", autenticar)

**Paso 2 — Agregar secret a Supabase**
```bash
# Desde la CLI con tu service_role o desde Dashboard:
# Supabase Dashboard → Project settings → Edge Functions → Secrets
WHATSAPP_APP_SECRET=<el-app-secret-de-meta>
WHATSAPP_STRICT_SIGNATURE=0   # arrancá en log-only · cambialo a 1 después de validar
```

**Paso 3 — Deploy v2**
```bash
cd reciclean-rdo
git pull
supabase functions deploy dieguito-whatsapp --project-ref eknmtsrtfkzroxnovfqn
```

### Cómo verificar que funciona

1. Esperá un mensaje real de WhatsApp (o mandate uno desde tu cuenta).
2. Logs de la EF:
   ```bash
   supabase functions logs dieguito-whatsapp --project-ref eknmtsrtfkzroxnovfqn --tail
   ```
3. Buscá línea estructurada:
   ```json
   { "event": "whatsapp_webhook_received",
     "signature_status": "valid|invalid|missing|skipped",
     "strict_mode": false,
     "has_signature_header": true,
     "ts": "2026-05-22T..." }
   ```
4. Si `signature_status: "valid"` → el secret está correcto. Activá strict: `WHATSAPP_STRICT_SIGNATURE=1` + re-deploy.
5. Si `signature_status: "invalid"` → el App Secret está mal. Revisalo en Meta.
6. Si `signature_status: "missing"` → Meta no está mandando el header (raro, validar config webhook).

### Modos de operación

| `WHATSAPP_APP_SECRET` | `WHATSAPP_STRICT_SIGNATURE` | Comportamiento |
|---|---|---|
| vacío | irrelevante | `skipped` — modo legacy v1, sin validación. **NO recomendado.** |
| seteado | `0` (default) | **log-only**: valida y loggea, pero acepta todo. Ideal para arranque. |
| seteado | `1` | **strict**: si firma falla → 401. Modo producción real. |

### Rollback (si algo se rompe)

```bash
# Volver a v1 (sin firma)
cd reciclean-rdo
git checkout HEAD~1 supabase/functions/dieguito-whatsapp/index.ts
supabase functions deploy dieguito-whatsapp --project-ref eknmtsrtfkzroxnovfqn
```

O directamente: `WHATSAPP_STRICT_SIGNATURE=0` (modo log-only no rechaza nunca).

---

## 2 · 5 TABLAS RLS — Lo que ya hice (no toques)

### Mig 048 aplicada (PC1, override CEO continuación D-SEC-RLS-001)

| Tabla | RLS antes | RLS ahora | Policy creada |
|---|---|---|---|
| `panel.config_ui` | ❌ | ✅ | (ninguna · denegación implícita anon/auth) |
| `mayordomo.incidentes` | ❌ | ✅ | (ninguna · denegación implícita anon/auth) |
| `curated.terminologia_rep` | ❌ | ✅ | `terminologia_rep_select_all` (SELECT anon+auth USING true) |
| `curated.contactos_clientes` | ❌ | ✅ | `contactos_clientes_select_auth_AUDIT22MAY` (SELECT auth USING true) |
| `curated.cotizaciones_historico` | ❌ | ✅ | `cotizaciones_historico_select_auth_AUDIT22MAY` (SELECT auth USING true) |

### Smoke test post-mig 048 ✅
- `curated.vw_entidades_rep`: 1975 filas ✅ (vista que depende de `terminologia_rep`)
- `curated.contactos_clientes`: 1542 filas accesibles con `authenticated` ✅
- `curated.cotizaciones_historico`: 1195 filas accesibles con `authenticated` ✅
- `curated.terminologia_rep`: 5 filas accesibles con `anon` (catálogo público) ✅

### Pendiente tuyo (mig 049 — sin urgencia)

Las 2 últimas tablas tienen policy `USING(true)` (marcadas `AUDIT22MAY_*`). Refiná con criterio real cuando puedas:
- `contactos_clientes`: probablemente debería filtrar por sucursal del usuario que consulta.
- `cotizaciones_historico`: probablemente debería filtrar por (sucursal | rol admin | dueño).

Mig 049 también debería resolver las **otras 68 policies AUDIT22MAY_*** (del mig 047 bloque 2) — una por una.

---

## 3 · OTRAS DEUDAS QUE QUEDAN ABIERTAS PARA VOS

### 3.1 Rotar API key Anthropic 🔴 ALTA
Ítem en `PENDIENTES.md` hace tiempo. Cuanto antes mejor.

### 3.2 9 vistas panel.* en DEFINER intencional (no podían migrar a INVOKER en mig 047)
Razón: las 7 tablas base no tienen grants ni policies para `authenticated`.

**Las 9 vistas:**
- `panel.v_crm_impulsa_clientes` / `_contactos` / `_cotizaciones` / `_oportunidades` / `_productos` / `_prospectos`
- `panel.v_crm_cliente_360`
- `panel.v_equipo_completo`
- `panel.v_silo08_estructura`

**Las 7 tablas base:**
- `staging.crm_impulsa_clientes` (1971 filas)
- `staging.crm_impulsa_contactos` (1516)
- `staging.crm_impulsa_cotizaciones` (1195)
- `staging.crm_impulsa_oportunidades` (10214)
- `staging.crm_impulsa_productos` (184)
- `staging.crm_impulsa_prospectos` (26)
- `panel.trabajadores_sin_email`

**Lo que tenés que decidir:**
1. ¿Cada tabla qué rol puede leer? (probablemente `authenticated` para todas, `service_role` siempre).
2. ¿Necesitan policy de filtrado real (silo, sucursal, dueño)?
3. Una vez resueltos grants + policies, las 9 vistas pueden migrar a `security_invoker = on`.

### 3.3 Workflow n8n `Diego-Envios-Entregables` (P1.6 PENDIENTES)
Ya estaba en PENDIENTES. Sin esto los entregables Storage no llegan al cliente.

### 3.4 Edge Function `daily-digest` no conectada a Diego
Existe en el inventario (EF #21) pero no está conectada al envío 18:00 CLT al equipo. Cuando firmes el prompt máximo Diego v6, hay que cablear.

### 3.5 4 tablas nuevas para Diego v6.0 (mig 050)
Bloqueado por firma `D-DIEGO-PROMPT-V6` (Dusan). Cuando él firme, vos creás:
- `panel.diego_memoria_contacto`
- `curated.diego_audit_log`
- `curated.diego_logs`
- `curated.diego_feedback`

DDL propuesto en `reciclean-sistema/public/DIEGO-PROMPT-MAXIMO.md` § 3 + § 6.5.

---

## 4 · LO QUE NECESITA FIRMA DUSAN (no es trabajo tuyo, lo agrego para que veas el panorama)

| # | Firma | Para | Status |
|---:|---|---|---|
| 1 | `D-SEC-RLS-001` | Mig 047 (94 vistas + 68 policies + 9 funciones) | ✅ Firmada 22-may PM, aplicada |
| 2 | continuación D-SEC-RLS-001 | Mig 048 (5 tablas RLS) | ✅ Aplicada como continuación auto-ejecutable |
| 3 | `D-SEC-WEBHOOK-001` | Webhook v2 con HMAC + deploy Pablo | ⏳ pendiente firma Dusan |
| 4 | `D-DIEGO-PROMPT-V6` | Promoción prompt máximo a producción | ⏳ pendiente firma Dusan |
| 5 | `D-SEC-RLS-002` | Mig 049 refinamiento 68+2 policies USING(true) | ⏳ pendiente cuando vos prepares el SQL |

---

## 5 · CHECKLIST PARA TU PRÓXIMA SESIÓN

- [ ] Leer este archivo (5 min)
- [ ] `git pull` en `reciclean-rdo` y `reciclean-sistema`
- [ ] Revisar `supabase/functions/dieguito-whatsapp/index.ts` v2 (diff vs v1)
- [ ] Generar App Secret en Meta + agregar como secret Supabase
- [ ] Deploy `dieguito-whatsapp` v2 con `WHATSAPP_STRICT_SIGNATURE=0`
- [ ] Validar logs `signature_status: valid` durante 24 hrs
- [ ] Si OK → cambiar a `WHATSAPP_STRICT_SIGNATURE=1` + re-deploy
- [ ] Rotar API key Anthropic (3.1)
- [ ] Preparar borrador mig 049 (refinar AUDIT22MAY_* policies)
- [ ] Esperar firmas Dusan para D-DIEGO-PROMPT-V6 antes de mig 050

---

## 6 · REFERENCIAS

| Documento | Path |
|---|---|
| Auditoría panel completa | `reciclean-sistema/public/AUDITORIA-PANEL-V4.md` |
| Capacidades Diego (4 archivos) | `reciclean-sistema/public/DIEGO-CAPACIDADES-*.md` |
| Prompt Diego v6.0 | `reciclean-sistema/public/DIEGO-PROMPT-MAXIMO.md` |
| Mig 047 SQL fuente | `reciclean-rdo/mayordomo/PLAN-2026/queries-propuestas/2026-05-22-mig-047-rls-security-definer-fix.sql` |
| Mig 048 (este handoff) | aplicada vía MCP como `048_rls_enable_5_tablas_expuestas` |
| MAPA Supabase actualizado | `reciclean-rdo/mayordomo/MAPA-SUPABASE.md` (sección "EDGE FUNCTIONS — INVENTARIO REAL" + "ACTUALIZACIONES DE SEGURIDAD APLICADAS") |
| Decisión D-SEC-RLS-001 | `reciclean-rdo/mayordomo/DECISIONES.md` |
| BLQ-002 agent-browser | `reciclean-rdo/mayordomo/BLOQUEOS.md` (no es seguridad, es bloqueo de auditoría visual) |

---

**Firmado:** PC1 Dusan · 2026-05-22 PM CLT · modo autónomo total.
**Cualquier duda:** dejá comentario en `BITACORA-VIVA.md` o pingame por el FAB del panel-rdo.
