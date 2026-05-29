# Diagnóstico de Herramientas por Silo — Panel RDO

**Generado:** 2026-05-28 · **Autor:** PC Dusan (diagnóstico, no reparación) · **Modo:** lectura + lectura + documentación.

> ⚠️ Este informe sólo lee, no toca código. Reparaciones sugeridas se derivan a PC1 con etiqueta `🔧` o esperan a Pablo con `⏳`.

---

## Resumen ejecutivo

| Métrica | Valor | Notas |
|---|---:|---|
| Silos definidos en `panel.silos` | **11** | El prompt menciona 8; estos cubren los 8 + 3 extra (Manifiestos, Cumplimiento, Tecnología, Personales) |
| Pestañas definidas en `panel.pestanas` | 21 | 1 está activa pero NO asignada a ningún silo: `bandeja_precios` |
| Pestañas visibles en `v_silo_pestanas_visibles` | 20 | 10 transversales + 10 asignadas |
| Edge Functions activas | **41** | Todas en estado `ACTIVE` |
| Migraciones aplicadas hoy | 10 | Más reciente: `20260528130129` |
| Documentos indexados en `panel.documentos` | **276** | 205 `mayordomo` + 71 `public` — **NINGUNO etiquetado al código de silo real (01-11)** ⬜ |
| Alertas UI abiertas (`v_alertas_ui_abiertas`) | **0** | Sistema existe; está vacío. No hay alertas por silo. |
| KPIs por silo en BD | 1 tabla (`tesoreria_kpis`) | Sólo cubre silo 07 Finanzas. No hay `kpis_por_silo` ni `widget_portada_silo`. |
| `panel.estado_proyectos` con `verificado_por=NULL` | **10 / 10** | Ningún proyecto tiene última verificación registrada |
| PRs abiertos relevantes | **#119** (Pablo) | Toca `public/panel-rdo.html` (+94/-2) |

**Lectura corta:** las pestañas existen y el control de acceso está sano. Lo que falla es la capa por silo de **KPIs**, **alertas**, **documentos** y **verificación de proyectos**. 4 silos no tienen ninguna pestaña asignada propia (sólo transversales).

---

## Mapeo silo solicitado por usuario → silo real BD

| Solicitado en prompt | Código BD | Nombre en `panel.silos` | Acceso |
|---|---|---|---|
| Gerencia | 10 | Direccion-General | restringido |
| Comercial | 01 | Comercial-Ventas | colaborativo |
| Operaciones | 02 | Operaciones-Recoleccion | colaborativo |
| Planta | 03 | Planta-Procesamiento | colaborativo |
| Finanzas | 07 | Administracion-Finanzas | colaborativo |
| RRHH | 08 | RRHH-Prevencion | colaborativo |
| Logística | (no existe directo) | mapea a **02 Operaciones** + **04 Manifiestos** | — |
| Marketing | 09 | Marketing-Comunicaciones | colaborativo |
| _(extra)_ | 04 | Manifiestos-Trazabilidad | restringido |
| _(extra)_ | 05 | Cumplimiento-Ambiental | colaborativo |
| _(extra)_ | 06 | Tecnologia-Diego | técnico |
| _(extra)_ | 11 | Temas-Personales | individual |

---

## Tabla consolidada — Cobertura por silo (✅/⚠️/❌/⬜)

Leyenda: ✅ funciona · ⚠️ parcial · ❌ roto · ⬜ no existe · 🔧 PC1 puede reparar ya · ⏳ requiere Pablo.

| Silo | Tabs asignadas | KPI portada | Tools Diego | Docs por silo | Alertas | Quién usa | 🔧 / ⏳ |
|---|---:|---|---|---|---|---|---|
| **10 Gerencia** | 10 ✅ | ⚠️ Card Diego Health + Bóveda; no hay KPI grupo dedicado | ✅ Diego usa identidad_diego_v1 | ⬜ todos los docs caen en `mayordomo/raiz` | ⬜ 0 abiertas | gerencia@ (owner), recepcion01@ | 🔧 KPIs grupo; ⬜ etiquetar docs |
| **01 Comercial** | 7 ✅ (negocios, cotizador, cartera, oportunidades, reconciliacion, entregables, facturacion) | ⚠️ Diego sugiere · sin KPI ventas dedicado | ✅ "precio cartón X", "cotiza X tn de Y" | ⬜ docs `mayordomo/PLAN-2026` no atados al silo | ⬜ 0 | servicios@ (owner), comercial@, gestorcomercial@, Asistente@ | 🔧 KPI ventas portada |
| **02 Operaciones** | 1 ⚠️ (sólo `pesaje`) | ⬜ sin KPI propio | ⚠️ Diego responde pero sin tool específica de rutas | ⬜ docs no atados | ⬜ 0 | gestorcomercial@ (owner), apoyo@, asistente.talca@, comercial@, operaciones.pm@, servicios@ | 🔧 agregar tab `rutas` o `flota`; KPI camiones-hoy |
| **03 Planta** | 1 ⚠️ (sólo `pesaje`) | ⬜ sin KPI propio | ⚠️ sin tool inventario | ⬜ docs no atados | ⬜ 0 | gestorcomercial@ (owner), apoyo@, asistente.talca@, comercial@, operaciones.pm@, servicios@ | 🔧 agregar tab `inventario` o `materiales`; KPI stock hoy |
| **04 Manifiestos** | 2 ⚠️ (`pesaje`, `rdo`) | ⬜ sin KPI propio (restringido a Dusan) | ⚠️ sin tool trazabilidad | ⬜ docs no atados | ⬜ 0 | gerencia@ (owner), dpinto@ (read) | 🔧 tab `trazabilidad` con vista de manifiestos por mes |
| **05 Cumplimiento** | **0 ❌** sin pestañas propias | ⬜ sin KPI propio | ⚠️ sin tool SEREMI/REP | ⬜ docs no atados | ⬜ 0 | Asistente@ (owner) | 🔧 tab `cumplimiento` con `v_cumplimiento_legal` (R-AUD-029) |
| **06 Tecnología** | 2 ✅ (`rdo`, `admin`) | ✅ Diego Health Card | ✅ tools admin (gestionar_permisos) | ⬜ docs no atados (skills sí en `mayordomo/skills`) | ⬜ 0 | recepcion01@ (owner), gerencia@, Asistente@, soporte@ | — |
| **07 Finanzas** | 4 ✅ (`facturacion`, `negocios`, `rdo`, `reconciliacion`) | ✅ `panel.tesoreria_kpis` poblado | ⚠️ sin tool tesorería dedicada | ⬜ docs `analisis-facturacion-cl` no atados al silo | ⬜ 0 | dpinto@ (owner), gerencia@ (owner co), gestorcomercial@, Asistente@, recepcion01@, servicios@ | 🔧 conectar `tesoreria_kpis` a card de portada por silo |
| **08 RRHH** | **0 ❌** sin pestañas propias | ⬜ sin KPI propio | ⚠️ sin tool dotación/asistencia | ⬜ docs no atados | ⬜ 0 | Asistente@ (owner), 6 más | 🔧 tab `dotacion` con `panel.dotacion`; KPI rotación |
| **09 Marketing** | **0 ❌** sin pestañas propias | ⬜ sin KPI propio | ⚠️ sin tool campañas | ⬜ docs no atados | ⬜ 0 | gerencia@ (owner), recepcion01@ | 🔧 tab `campañas`; KPI alcance/leads |
| **11 Personales** | **0 ✅ esperado** sólo transversales | n/a (individual) | n/a | n/a | n/a | dpinto@ (owner), gerencia@ (owner) | — (diseño correcto) |

### Conteo por silo (origen pestañas)

| Silo | Asignadas | Transversales | Total |
|---|---:|---:|---:|
| 01 Comercial | 7 | 10 | 17 |
| 02 Operaciones | 1 | 10 | 11 |
| 03 Planta | 1 | 10 | 11 |
| 04 Manifiestos | 2 | 10 | 12 |
| 05 Cumplimiento | **0** | 10 | 10 |
| 06 Tecnología | 2 | 10 | 12 |
| 07 Finanzas | 4 | 10 | 14 |
| 08 RRHH | **0** | 10 | 10 |
| 09 Marketing | **0** | 10 | 10 |
| 10 Dirección | 10 | 10 | 20 |
| 11 Personales | 0 | 10 | 10 |

---

## Herramientas declaradas y su estado real

### A. Edge Functions activas (41 / 41) — todas ✅ deployed

Las EF que sirven al panel y silos están todas activas. Última actualizada hoy: `comite-validacion` v4, `verificador-afirmaciones` v3, `auto-calcular-inputs` v2, `generar-pdf-cotizacion` v1.

Distribución funcional declarada (no hay tabla de "EF↔silo", inferido por nombre):

| Familia | EF | Estado | Silo principal |
|---|---|---|---|
| Diego | `diego-chat-process` v54, `diego-health-check` v7, `diego-followup-cron`, `diego-scoring-cron`, `diego-embeddings-generate`, `diego-buscar-semantico` | ✅ ACTIVE | Transversal / 06 |
| RDO | `rdo-builder` v11, `serve-entregable-html`, `render-entregable-html`, `daily-digest` | ✅ ACTIVE | Transversal |
| Comercial | `precio-aplicar`, `notif-precios`, `precios-competencia-scraper`, `generar-pdf-cotizacion` | ✅ ACTIVE | 01 / 07 |
| Operaciones | `ingest-pesajes-csv`, `export-csv-pesajes`, `ocr-tablero`, `ocr-diesel`, `google-maps-distance` | ✅ ACTIVE | 02 / 03 |
| Plan 2026 | `auto-calcular-inputs` v2, `kpi-auto-calcular` | ✅ ACTIVE | 10 |
| Gobierno | `verificador-afirmaciones`, `comite-validacion`, `audit-ui-permisos`, `auditoria-sidebar-v4`, `gap-notify`, `gap-dispatch-whatsapp` | ✅ ACTIVE | 10 |
| Bóveda 2026 | `canary-deploy-test`, `deploy-proxy`, `pc-status`, `pc-watchdog` | ✅ ACTIVE | 10 |
| Auxiliares | `uf-diaria`, `f-uf-hoy`, `mockup-panel-rdo`, `upload-mockup-storage`, `binary-upload`, `upload-presentacion-handoff`, `audio-transcribe`, `dieguito-whatsapp`, `dieguito-process`, `papa-gotas` | ✅ ACTIVE | Transversales |

### B. Tools Diego (vía `panel.config_ui.identidad_diego_v1` + `diego_chat_process_anti_mitomania`)

Diego tiene tools declaradas, pero no hay tabla `panel.diego_tools_por_silo`. La herramienta es transversal: la misma identidad atiende a todos los silos.

✅ Activas conocidas (inferido de la EF y prompt): `precio_consultar`, `cotizar`, `gestionar_permisos`, `buscar_semantico`. ⚠️ Sin tool dedicada para: rutas (silo 02), inventario (silo 03), cumplimiento legal (silo 05), dotación (silo 08), campañas (silo 09).

### C. Widgets de portada

Sólo dos widgets de portada declarados como vivos (verificados vía smoke):
- `v4-diego-health` (✅ visto en panel) — silo 06
- `Diego sugiere hoy` (✅ visto en panel) — transversal

⬜ **Falta** widget por silo de: ventas (01), camiones/rutas (02), inventario (03), trazabilidad (04), cumplimiento (05), tesorería (07), dotación (08), campañas (09).

### D. Documentos indexados

| silo (literal) | proyectos | docs |
|---|---|---:|
| mayordomo | analisis-facturacion-cl, perfiles-draft, PLAN-2026, PLAN-2026-specs, PRESENTACION-SEREMI, raiz, skills | 205 |
| public | audit-85, public | 71 |

⬜ **Crítico:** Ningún documento usa `silo IN ('01','02',...,'11')`. La columna `silo` se usa como bucket de repositorio (mayordomo / public), no como silo de negocio. **El buscador por silo del panel no encuentra documentos del silo real.**

### E. Alertas UI

`panel.v_alertas_ui_abiertas` está vacío (0 filas). La vista existe (mig 067/ola sidebar). No hay alertas abiertas en ningún silo en este momento. Estado: ✅ vista funciona / ⚠️ no hay tráfico real → dudoso si la EF `gap-notify` está disparando bien.

### F. Proyectos en estado_proyectos

| Estado | Proyectos |
|---|---|
| vivo (✅) | Bóveda 2026 · Diego v21 · Impulsa CRM · Mayordomo v2 · Panel RDO v4 · WhatsApp Diego |
| pendiente (⏸️) | Comité IAs · E360 · Tablero Trifásico · Ventana Profunda |

⬜ Los 10 tienen `ultima_verificacion=NULL` y `verificado_por=NULL`. La tabla sirve como índice pero no hay ciclo de verificación que la mantenga viva (BÓVEDA 2026 cubre afirmaciones, no proyectos).

---

## Fase 3 — Riesgos de colisión con Pablo

### PRs abiertos

| PR | Repo | Título | Autor | Files | Actualizado |
|---|---|---|---|---|---|
| **#119** | reciclean-sistema | Ola 1 · F6 data-source-footer + switch v_cliente_360_full | dusanarancibia-cpu *(rama replit/Pablo)* | `public/panel-rdo.html` (+94/-2) | 2026-05-28 15:31 UTC |

Reciclean-rdo: sin PRs abiertos.

### Análisis del PR #119

Pablo añade:
- Línea 8587 — switch query CRM Impulsa drawer a `v_cliente_360_full` (afecta **silo 01 Comercial**)
- `#dataSourceFooter` flotante + `#dsTooltipModal` + `window.actualizarFooterFuente(tabCodigo)`
- Hooks en `data-v4-tab` y `button[data-tab]`

### ⚠️ Riesgo de conflicto con mis merges de hoy

Yo mergeé hoy (28-may) a main y prod **el mismo archivo** `public/panel-rdo.html`:
- PR #128 (15:14 UTC) — añadió 3 líneas en `initSupabase()` (`window.sb = sb`).

Pablo updateó #119 a las 15:31 UTC. `mergeable=UNKNOWN` al consultar. Sí hay riesgo de conflicto si Pablo no rebasó. **Recomendación al PC1:** antes de cualquier reparación que toque `public/panel-rdo.html`, esperar a que #119 esté merged a main. Cualquier cambio mío al mismo archivo después de hoy debe coordinarse.

### Migraciones pendientes

`supabase_migrations.schema_migrations` — 10 migraciones de hoy (28-may) aplicadas, ninguna pendiente. La más reciente: `20260528130129`. **Sin riesgo de DDL no aplicada.**

### Edge Functions con deploy pendiente

Ninguna EF marca `INACTIVE` ni `PENDING`. 41/41 ACTIVE.

---

## Fase 4 — Cola de reparaciones

### 🔧 PC1 puede tomar YA (no toca archivos de Pablo)

| # | Silo | Reparación | Tipo | Archivo / Tabla | Estimado |
|---|---|---|---|---|---|
| 1 | global | Etiquetar `panel.documentos.silo` con códigos 01–11 (hoy todos son `mayordomo`/`public`) | UPDATE | `panel.documentos` | DML reglas + 1 día revisión |
| 2 | 05 Cumplimiento | Crear asignación `silo_pestanas` ('05', 'cumplimiento') + crear pestaña base `cumplimiento` apuntando a `v_cumplimiento_legal` (mig 067) | INSERT + 1 fila JS | `panel.silo_pestanas` · `panel.pestanas` · nuevo `cumplimiento-tab.js` | 1 sesión |
| 3 | 08 RRHH | Crear pestaña `dotacion` apuntando a `panel.dotacion` | INSERT + 1 archivo JS | `panel.silo_pestanas` + nuevo `dotacion-tab.js` | 1 sesión |
| 4 | 09 Marketing | Crear pestaña `campanas` (stub vacío inicialmente) | INSERT | `panel.silo_pestanas` | <30 min |
| 5 | 02 Operaciones | Crear pestaña `rutas` apuntando a tablas `flota_*`/`recoleccion_*` | INSERT + JS | `panel.silo_pestanas` + tab nueva | 1 sesión |
| 6 | 03 Planta | Crear pestaña `inventario` apuntando a `curated.materiales*` | INSERT + JS | `panel.silo_pestanas` + tab nueva | 1 sesión |
| 7 | global | `panel.estado_proyectos` — poblar `verificado_por`/`ultima_verificacion` en los 10 registros + agregar trigger de revisión a Bóveda | DML + función | `panel.estado_proyectos` | 1 sesión |
| 8 | global | `bandeja_precios` está en `panel.pestanas` pero NO en `silo_pestanas` — asignar a silos 01, 07, 10 (o desactivar si está obsoleta) | INSERT | `panel.silo_pestanas` | <15 min |
| 9 | 06 Tecnología | Verificar que `gap-notify` esté generando alertas (hoy hay 0 abiertas — ¿la EF corre?) | Verificación logs EF | EF `gap-notify` | <30 min |

Todas estas reparaciones requieren **DML/DDL en BD o crear scripts nuevos** — **no tocan `public/panel-rdo.html`**, por lo que no chocan con Pablo.

### ⏳ Esperando a Pablo (NO tocar mientras #119 esté abierto)

| # | Reparación | Razón |
|---|---|---|
| A | Cualquier KPI nuevo embebido directo en `public/panel-rdo.html` | Pablo está agregando footer + tooltip en ese archivo |
| B | Cualquier hook nuevo a `data-v4-tab` o `button[data-tab]` | Pablo está usando esos dispatchers |
| C | Modificar línea cercana a 8587 (CRM Impulsa drawer) | Pablo cambió esa query hoy |
| D | Agregar nuevo `#dataSourceFooter*` o `#dsTooltipModal*` | Pablo lo está creando |

Estos ítems se cargan en `BLOQUEOS.md` con dependencia "merge de #119".

---

## Acciones recomendadas (no ejecutadas)

1. **Cargar BLOQUEOS.md** con los 4 ítems ⏳ esperando a Pablo (PR #119).
2. **Cola PC1** con los 9 ítems 🔧 listos para reparar sin colisión.
3. **Aviso a Dusan:** los silos 05, 08, 09 hoy son sólo "fachada" — sus usuarios ven pestañas transversales pero ninguna herramienta propia. Decisión necesaria: ¿priorizar uno?
4. **R-AUD-007 + R-AUD-009** se reafirman: si Diego es preguntado por dotación / cumplimiento / marketing, **debe responder "no tengo herramienta dedicada para este silo"** antes de inventar.

---

## Anexo — Acceso por silo (`panel.silo_acceso`)

| Silo | Owners | Editors | Readers |
|---|---|---|---|
| 01 Comercial | servicios@ | Asistente@, comercial@, gestorcomercial@ | — |
| 02 Operaciones | gestorcomercial@ | apoyo@, asistente.talca@, comercial@, operaciones.pm@, servicios@ | — |
| 03 Planta | gestorcomercial@ | apoyo@, asistente.talca@, comercial@, operaciones.pm@, servicios@ | — |
| 04 Manifiestos | gerencia@ | — | dpinto@ |
| 05 Cumplimiento | Asistente@ | — | — |
| 06 Tecnología | recepcion01@ | Asistente@, gerencia@, soporte@ | — |
| 07 Finanzas | dpinto@, gerencia@ | Asistente@, gestorcomercial@, recepcion01@, servicios@ | — |
| 08 RRHH | Asistente@ | comercial@, gerencia@, gestorcomercial@, recepcion01@ | contador4@, dpinto@ |
| 09 Marketing | gerencia@ | recepcion01@ | — |
| 10 Gerencia | gerencia@ | recepcion01@ | — |
| 11 Personales | dpinto@, gerencia@ | — | — |

---

## Bloqueos abiertos (referencia BLOQUEOS.md)

```
[2026-05-28]
- BLOQ-001 — Reparar KPI silo en panel-rdo.html · Esperando PR #119 merge · Owner: PC1.
- BLOQ-002 — Hook nuevo en data-v4-tab para KPIs silo · Esperando PR #119 merge · Owner: PC1.
- BLOQ-003 — `panel.documentos.silo` etiquetado por silo real · Listo para PC1 ya · Owner: PC1.
- BLOQ-004 — Tab `cumplimiento` silo 05 · Listo para PC1 ya · Owner: PC1.
- BLOQ-005 — Tab `dotacion` silo 08 · Listo para PC1 ya · Owner: PC1.
- BLOQ-006 — Pestaña `campanas` silo 09 · Listo para PC1 ya · Owner: PC1.
- BLOQ-007 — Verificar EF `gap-notify` (0 alertas hoy) · Diagnóstico previo a fix · Owner: PC1.
```
