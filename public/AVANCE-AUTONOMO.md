# AVANCE-AUTONOMO — Panel RDO v4 (loop 19-20 may 2026)

> Loop autónomo de PC1-Dusan.
> Última actualización: **2026-05-20 17:45 Chile** (merge PR #39 + estado PC3 rescate Impulsa).

---

# ITERACIÓN 7 — Merge PR #39 + Activación PC3 rescate Impulsa (PARCIAL)

> Activada por mandato Dusan 17:30 ("DOS TAREAS EN PARALELO").

## TAREA 1 — Merge PR #39 ✅

| PR | Estado | Commit merge |
|---|---|---|
| **#39** uploader CSV pesajes | ✅ **MERGED** | `553eab9c` |

Pablo hizo segundo rebase (commit `f73f7d8` en la rama feature) y mergeó él mismo en GitHub. Cuando intenté mergearlo otra vez, GitHub respondió "already merged". **Los 5 PRs de Pablo (#35-#39) están en `main`.** Vercel re-deployó automáticamente.

## TAREA 2 — Supervisar PC3 (rescate Impulsa) — ESTADO REAL

**PC3 NO está ejecutando.** Reporte honesto de la situación:

### Estado de cada artefacto esperado
| Artefacto | Estado |
|---|---|
| `public/impulsa-archivos-mapeo.txt` | ❌ NO existe (no se generó porque no hay login) |
| `public/impulsa-indice-documentos.md` | ❌ NO existe |
| `public/impulsa-mensaje-ejecutiva.txt` | ✅ creado por PC1 17:35 — listo para reenviar |
| Bucket Supabase `impulsa-documentos` | ❌ NO existe (`storage.buckets` 0 rows con LIKE '%impulsa%') |
| Archivos en Supabase Storage | 0 |
| Estructura local `C:\Users\dusan\claude-sandbox\impulsa-documentos\` | ✅ creada (carpetas vacías) |

### Bloqueo encontrado
**B11 en BLOQUEOS.md** — Login `app.sistemaimpulsa.com` con email `gerencia@gestionrepchile.cl` + password `4322` provisto por Dusan: URL sigue en `/login` post-click. Sin error visible. Sin avance posible sin password correcto o respuesta de la ejecutiva.

### Validación contra los 5 puntos del mandato (resultado: 0/5 cumplidos)
1. ❌ Archivos en Storage: 0.
2. ❌ 3+ clientes con 2+ tipos: 0 clientes cubiertos.
3. ❌ Organización CLIENTE/TIPO/FECHA: estructura existe pero vacía.
4. ❌ Índice con MD5: archivo no existe (no hay archivos a hashear).
5. ✅ Mensaje a ejecutiva existe: `public/impulsa-mensaje-ejecutiva.txt` con Opción A (extensión 48h) + Opción B (ZIP completo).

### Acción inmediata requerida de Dusan
- **Opción 1:** confirmar password completo (si "4322" era parcial/PIN).
- **Opción 2:** reenviar `impulsa-mensaje-ejecutiva.txt` a la ejecutiva Impulsa HOY (mañana 21-may vence el plan CRECE según PENDIENTES.md).
- **Opción 3:** aceptar pérdida de los adjuntos y operar solo con las 15.080 filas estructuradas que YA están en `staging.crm_impulsa_*` (Mig 042 de Pablo, 19-may).

---

# ITERACIÓN 6 — Frente A (confirmación) + Frente B (diagnóstico Diego)

> Activada por mandato Dusan 15:30 ("2 frentes simultáneos · trabajá en background, no preguntes").

## FRENTE A — Plan maestro + Puerto Montt (ya hechos, confirmados)

### A1 · Plan maestro en 3 fuentes con SHA256 idéntico ✅
- **GitHub** (`reciclean-rdo` rama `claude/spanish-greeting-h1phT`, `mayordomo/PLAN-MAESTRO-EJECUCION.md`): SHA256 `4fff83faabc1e08825a1a501ab421d694fb2c85fe01cfaae83083d09640a1097`
- **Supabase** (`mayordomo.reglas_activas` clave `plan-maestro-v1.2`): mismo SHA256 (verificado via `digest()` pgcrypto, 3.711 chars).
- **Local** (`C:\Users\dusan\.claude\memoria\plan-maestro.md`): mismo SHA256.

Las 3 fuentes confirmadas idénticas byte-a-byte.

### A2 · Puerto Montt propuestas en bandeja ✅
- Archivo: `reciclean-rdo/mayordomo/PLAN-2026/puerto-montt-propuestas.md` (11.710 bytes, 194 líneas).
- Cola: `mayordomo.cola_construccion.id = 796d9aa0-7b8b-4bb4-b692-03046c174302`, estado `built`, prioridad `critica`, `requiere_firma=true`.
- BANDEJA-DUSAN-AM actualizada con entrada al tope para firma 21-may 7 AM.
- Commits relacionados: `3f969bd` entregable + `adaf468` bandeja + `552356c` bitácora cierre.

## FRENTE B — Diagnóstico EF Diego (panel.diego_bandeja)

### B1 · Hallazgos del diagnóstico
1. **NO hay error 401 actual.** La EF `dieguito-process` (única EF Dieguito que inserta a BD) escribe en `staging.dieguito_tasks`, NO en `panel.diego_bandeja`.
2. **Patrón de dos clientes ya implementado correctamente:**
   - Línea 65 `sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` — para validar usuario en `panel.usuarios_autorizados`.
   - Línea 76 `sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` — para INSERTs en `staging.*` (bypassea RLS).
3. **`panel.diego_bandeja` tiene RLS** habilitada con 3 policies:
   - `diego_bandeja_read` SELECT → anon + authenticated.
   - `diego_bandeja_write` INSERT → solo authenticated.
   - `diego_bandeja_update` UPDATE → solo authenticated.
4. **No hay policy para `service_role`** — innecesaria porque service_role bypassea RLS por default.

### B2 · Conclusión
La EF está sana hoy. Cuando se extienda para escribir en `panel.diego_bandeja`, **debe usar el cliente `sb` (service_role)** que ya existe en la función, NO `sbAnon`. Si por error futuro usa `sbAnon`, fallará con 401/403 — y ahí entra el protocolo de auto-reparación.

### B3 · Tabla `mayordomo.incidentes` creada
Schema:
```
id          SERIAL PK
tipo        TEXT
descripcion TEXT
pc_afectado TEXT
creado_en   TIMESTAMPTZ default now()
resuelto_en TIMESTAMPTZ
sha256      TEXT
```

Primer registro (`id=1`, tipo=`diagnostico_preventivo`): análisis completo del flujo Diego + conclusión + protocolo de reparación. SHA256 referenciado al plan maestro.

### B4 · Protocolo de auto-reparación en `COMO-TRABAJAR.md`
Sección nueva "Auto-reparación de mensajes Diego que fallan":
1. Registro del incidente (template SQL).
2. Diagnóstico estándar (qué cliente usa la EF + RLS de la tabla + policies).
3. Reparación según diagnóstico (3 patrones típicos).
4. Cierre del incidente con descripción.
5. Patrón crítico: SIEMPRE dos clientes (anon para validar usuario, service_role para INSERTs reales). Referencia canónica `dieguito-process/index.ts` líneas 65 y 76.

### Commits en `reciclean-rdo` durante iteración 6
```
5858c47  diego: protocolo auto-reparacion en COMO-TRABAJAR
```

---

# ITERACIÓN 5 — Merge PRs #35-#39 de Pablo (parcial)

> Activada por mandato Dusan 14:48 ("Mergear PRs #35-#39 de Pablo en GitHub").

## Resultado: 4 mergeados, 1 con conflicto residual

| PR | Tema | Estado | Commit merge |
|---|---|---|---|
| **#35** | D-PANEL-AUTH-001 frontend (auth real + password + reset) | ✅ **MERGED** | `8e11315b` |
| **#36** | D-OP-13 Tab Reconciliación CRM↔RDO | ✅ **MERGED** | `b8637e04` |
| **#37** | D-OP-11 Tab Cartera Andrea | ✅ **MERGED** (base cambiada `feature/d-op-13` → `main`) | `1f73aec9` |
| **#38** | D-OP-12 Tab Kanban Oportunidades | ✅ **MERGED** (segundo intento, post-rebase de Pablo) | `aab5e1ce` |
| **#39** | PC1-#1B Uploader CSV pesajes | ❌ **DIRTY** otra vez (conflicto post #38) — requiere 2º rebase | — |

**Cronología:**
- 17:48 — primer intento mergea #35, #36, #37 OK. #38 y #39 quedan DIRTY.
- 18:00 — Pablo rebasea ambas ramas contra `main` con #35+#36+#37 y force-push: SHA `2065284` (#38) + `5f44529` (#39). Ambas vuelven a CLEAN MERGEABLE.
- 18:30 — segundo intento: **#38 mergea OK** (`aab5e1ce`). **#39 vuelve a DIRTY** porque el merge de #38 cambió `main` y los dos PRs tocan `public/panel-rdo.html`.

**Por qué pasa:** los PRs #38 y #39 modifican zonas próximas del mismo archivo. Cada vez que uno se mergea primero, el otro necesita un nuevo rebase. Es la última cadena que romper.

## Detalle del proceso

1. `gh pr list` confirmó los 5 en `CLEAN MERGEABLE`.
2. #35 mergeado primero (crítico, desbloqueaba #39).
3. #36 mergeado segundo (independiente).
4. #37 estaba stacked (`baseRefName=feature/d-op-13-tab-reconciliacion`). Cambié base a `main` con `gh pr edit --base main`, luego mergeé.
5. #38 y #39 fallaron con `GraphQL: Pull Request has merge conflicts`. Causa: ambos modifican `panel-rdo.html` en regiones que cambiaron tras merges previos (nav-tabs anchors compartidos + lógica auth).

## Acción pendiente para Pablo

Rebase de #38 y #39 sobre `main` actualizado, resolver conflictos en `panel-rdo.html` y force-push:

```bash
git fetch origin
git checkout feature/d-op-12-kanban-oportunidades
git rebase origin/main
# resolver conflictos en public/panel-rdo.html
git add public/panel-rdo.html && git rebase --continue
git push --force-with-lease origin feature/d-op-12-kanban-oportunidades

# Igual para feature/pc1-ingest-pesajes-csv
```

## Estado de `main` después de los 3 merges

`main` ahora contiene:
- Auth real (`#35`): login con password + reset magic-link.
- Tab Reconciliación CRM (`#36`): 471 matches por RUT.
- Tab Cartera Andrea (`#37`): cambio categoría 2-statement atomic.

Vercel re-deployó automáticamente con los 3 merges.

---

# ITERACIÓN 4 — Loop autónomo continuo post handoff Pablo (FIN)

> Activada por mandato Dusan 12:30 ("ARRANQUE AUTOMÁTICO REAL — trabajar en loop hasta PARAR").
> Cerrada: 2026-05-20 13:15 (~45 min, 3 ciclos autónomos).

## Ciclo 1 (12:30 → 12:45) · YA-1/2/3 + YA-4 + YA-5

| Tarea | Estado |
|---|---|
| **YA-1** B09 main desincronizado | ya cerrada en T1 (commit prev) |
| **YA-2** Sparklines 7 días | ya cerrada en T2 (commit 1695846) |
| **YA-3** Vista mensual KPI Facturación | ya cerrada en T3 (commit 1695846) |
| **YA-4** PC3 anomalías pesajes | ✅ Vista `staging.v_pesajes_anomalias` + resumen creadas. **264 anomalías** detectadas (225 kg≤0 críticas + 9 imposibles + 38 sin sucursal + 8 precio negativo + 1 sin monto). Asignada a PC3. |
| **YA-5** PC4 estructura tesorería | ✅ Tabla `panel.tesoreria_kpis` + vista `v_tesoreria_ultimo` + RLS + seed row vacía. Asignada a PC4. |

## Ciclo 1.5 — UF EF Pablo (12:35)

- Migrado `v4LoadUF()`: ahora consume `https://eknmtsrtfkzroxnovfqn.supabase.co/functions/v1/f-uf-hoy` (Edge Function de Pablo con cache 24h server-side + self-healing).
- Antes: cada cliente pegaba a `mindicador.cl` con cache 12h en su localStorage.
- Tooltip enriquecido: `UF $40424.99 al 2026-05-20 · fuente: mindicador.cl`.
- Commit `2a71241`.

## Ciclo 2 (13:00 → 13:10) · Mapa bubble sizing

- Ítem #9 de la cola cerrado.
- `v4InitMap()` ahora carga `staging.v_pesajes_mes_por_sucursal` (vista de Pablo) y dimensiona radius proporcional a `sqrt(toneladas_mes / max)`.
- Resultado verificado en agent-browser:
  - Talca: **r=22** (91.7 t / 54 tickets / $10.4M)
  - Maipú: **r=13** (19.8 t / 19 tickets / $3.4M)
  - Cerrillos: **r=9** (3.3 t / 1 ticket / $98K)
  - Puerto Montt: **r=6** (0 t · 🔒 bloqueada SEREMI)
- Tooltips ahora muestran toneladas + tickets + monto del mes.
- Commit `f134848`.

## Ciclo 3 (13:10 → 13:15) · Documentación

- Update COLA-TAREAS.md: items #8 + #9 marcados ✅ cerradas.
- Update BITACORA-CIERRE.md: 2 entradas nuevas (ciclos loop-1 y loop-2).
- Update AVANCE-AUTONOMO.md (este archivo) con iteración 4.
- Commit `fc9e876`.

## Objetos Supabase nuevos en esta iteración

| Schema.objeto | Tipo | Origen | Resultado |
|---|---|---|---|
| `staging.v_pesajes_anomalias` | view | PC1 ciclo 1 (YA-4) | 264 filas marcadas anómalas con detector multi-criterio |
| `staging.v_pesajes_anomalias_resumen` | view | PC1 ciclo 1 (YA-4) | Conteo por tipo de anomalía |
| `panel.tesoreria_kpis` | table | PC1 ciclo 1 (YA-5) | Estructura 4 KPIs financieros + RLS + seed vacía |
| `panel.v_tesoreria_ultimo` | view | PC1 ciclo 1 (YA-5) | Lectura del snapshot más reciente |

## Commits a `replit/plan-dusan` en iteración 4 (3)

```
f134848  v4 mapa: bubble sizing dinamico desde staging.v_pesajes_mes_por_sucursal (Pablo)
2a71241  v4 UF: migrar de mindicador.cl directo a Edge Function f-uf-hoy de Pablo
(8b92b48, 1695846, 7707178, 8881a3c, e470c6e, e997b27, 6b11d40) anteriores
```

Total commits `replit/plan-dusan` del loop 19-20 may: **10**.

## Estado mayordomo al cierre iteración 4

| PC | Estado real (3 fuentes) | Tarea actual |
|---|---|---|
| PC1-Dusan | activo (3/3) | Loop autónomo — esperando próximo trigger |
| PC2-Pablo | activo (2/3 — heartbeat stale pero commits <24h) | Espera merge Dusan de PRs #35-#39 |
| PC3-Cámaras | activo (recién asignada YA-4) | Investigar 264 anomalías pesajes |
| PC4-Desocupado | activo (recién asignada YA-5) | Documentar `tesoreria_kpis` + integrar al panel |

## Pendiente para Dusan

1. Smoke + merge de PRs #35, #36, #37, #38, #39 en `reciclean-sistema` (PR #35 crítico).
2. Firmar 2 entregables PC4 en bandeja AM 21-may (D-2026-01 leasing + D-2026-02 carta Maipú).
3. Decisión sobre Mig 044 Ley REP pausada (spec no existe).

---

# ITERACIÓN 3 — Mejoras post-deploy + DDL Supabase (FIN)

> Activada por mandato Dusan 10:50 ("Validar Mayordomo antes de arrancar + 5 tareas").
> Cerrada: 2026-05-20 11:40 (~50 min).

## Tracking iteración 3

| Hora Chile | Tarea | Estado |
|---|---|---|
| 11:00 | T1 — Resolver B09 (main desincronizado 18 commits behind) | ✅ |
| 11:10 | T2 — RPC `panel.sparkline_kpis_7d()` + 4 SVG sparklines en KPI cards | ✅ |
| 11:20 | T3 — Vista `public.v_kpi_grupo_mensual` + KPI Facturación mes vs mes | ✅ |
| 11:25 | T5 — Token Vercel regenerado (válido hasta 21-may 13:35) | ✅ |
| 11:35 | T4 — Responsive 360/768/1024/1440 (overflow horizontal eliminado) | ✅ |
| 11:40 | Bitácora + heartbeat + AVANCE actualizado | ✅ |

## Cambios técnicos iteración 3

### Supabase — 2 objetos nuevos
```sql
panel.sparkline_kpis_7d()        -- RPC STABLE SECURITY DEFINER, devuelve JSONB con 4 series 7d
public.v_kpi_grupo_mensual       -- Vista derivada de staging.pesajes_prod por mes
```
Ambos con GRANT EXECUTE/SELECT a anon + authenticated. Reversibles con DROP.

### Frontend — 3 commits a `replit/plan-dusan`
```
8b92b48 v4 responsive: fix overflow horizontal en 360/1024 + topbar wrap mobile
1695846 v4 dashboard: sparklines reales + KPI Facturación mes vs mes
7707178 PC4 outputs: 5 queries validadas para v4 dashboard
```

### Validación responsive end-to-end (agent-browser)

| Viewport | bodyW | docW | overflow-x |
|---|---|---|---|
| 360 × 640 | 345 | 345 | ✅ none |
| 768 × 800 | 753 | 753 | ✅ none |
| 1024 × 768 | 1009 | 1009 | ✅ none |
| 1440 × 900 | 1425 | 1425 | ✅ none |

CSS guards agregados: `html/body { overflow-x: hidden; max-width: 100vw }` + media query <640px que oculta UF/fecha/email en topbar.

## URL pública vigente para Pablo (válida 23h)
```
https://reciclean-sistema-git-repli-c53605-dusanarancibia-cpus-projects.vercel.app/panel-rdo-v4.html?_vercel_share=t3obMUeYdsP2AWVEQPp8i2VWI5K3rCnh
```
Expira: **2026-05-21 13:35 Chile**. Regenerar con MCP `mcp__claude_ai_Vercel__get_access_to_vercel_url` cuando caduque.

## Datos clave que el panel v4 ahora muestra reales

- **UF:** $40.425 (mindicador.cl real, cache 12h localStorage).
- **KPI Pesajes:** 386 tickets · 336 t YTD compras.
- **KPI Facturación:** $13M mayo · vs $17M abril · **▼23%** (mes vs mes ahora real, no YTD vs año previo).
- **KPI RDO mes:** $14M · 117 t mes 2026-05.
- **KPI Alertas:** 93 (82 críticas + 11 amarillas).
- **Sparklines 7d en los 4 KPI cards:** path SVG con área 20% opacidad + polyline + circle final.
  - Última serie pesajes: `[8, 0, 0, 6, 8, 5, 1]` (08-may → 14-may).
- **Charts:** Pie ventas por empresa 2026, Bar toneladas YTD por sucursal, Line compras 12m.
- **Top 5 reales:** clientes (Envases Impresos $106M, Sociedad Beto $100M…), materiales (Lata chatarra 137t…), sucursales.

## Pendientes que quedaron abiertos (para iteración 4 o PC2)

- **Finanzas (Saldo Banco / Por Cobrar / Pagos / Inventario):** sin tabla Tesorería en BD. B08 abierto.
- **`staging.pesajes_prod` lleva 6 días sin ingest** (último día 2026-05-14) — pipeline operativo bloqueado. Hand-off a PC2.
- **`staging.facturacion_s5` permission denied desde anon** — RLS a revisar. Hand-off a PC2.
- **Vista DTE mensual real** (`staging.dte_resumen_mensual`) — hoy se usa proxy desde pesajes_prod.
- **Mapa con bubble sizing dinámico** — hoy todas las burbujas tienen mismo tamaño.

## Bloqueos cerrados en esta iteración

- **B09 RESUELTO:** `main` local 18 commits behind de origin. Stash + pull --ff-only + resolución conflicto en panel-rdo.html tomando HEAD. Verificación: `git rev-list --left-right --count main...origin/main` → `0 0`.

## Reglas cumplidas en iteración 3

✅ NO toqué `panel-rdo.html` (producción, intacto).
✅ NO mergeé ramas.
✅ NO modifiqué tareas de otros PCs (PC2/PC3/PC4 quedaron en sus estados).
✅ Cada tarea cerrada → entrada en `BITACORA-CIERRE.md`.
✅ Coherencia 3 fuentes aplicada al evaluar PC2/PC3 (no falsas alarmas).

---

# ITERACIÓN 2 — Conexión inicial datos reales (FIN)

> Cerrada: 2026-05-20 ~07:30 (~30 min).

## Tracking iteración 2

| Hora | Sección | Estado |
|---|---|---|
| 07:00 | Fix `window.sb` → `sb` (bug crítico de scope) | ✅ |
| 07:10 | KPIs reales (Pesajes / Facturación / RDO / Alertas) | ✅ |
| 07:15 | Charts (Pie / Bar / Line) con vistas reales | ✅ |
| 07:20 | Top 5 (Clientes / Materiales / Sucursales) | ✅ |
| 07:25 | UF dinámica vía mindicador.cl API | ✅ |
| 07:28 | Finanzas marcadas pendiente integración Tesorería | ✅ |
| 07:30 | Verificación end-to-end + screenshot | ✅ |

## Vistas reales conectadas (iteración 2)

| Sección | Vista Supabase | Resultado |
|---|---|---|
| KPI Pesajes | `v_pesajes_kpi_sucursal` (COMPRA agregado) | 386 tickets · 336 t YTD |
| KPI Facturación | `v_kpi_grupo_anual` → reemplazado por `v_kpi_grupo_mensual` en T3 | mes vs mes |
| KPI RDO mes | `v_pesajes_por_sucursal_mes` (mes_str actual) | $14M · 117 t mes 2026-05 |
| KPI Alertas | `v_alertas_panel` filtrado `resuelto=false` | 93 (82 críticas · 11 amarillas) |
| Pie chart | `v_dte_clientes_panel` agregado por empresa | Reciclean / Farex |
| Bar chart | `v_pesajes_kpi_sucursal` COMPRA | Toneladas YTD por sucursal |
| Line chart | `v_pesajes_por_sucursal_mes` 12m | Compras M$ últimos 12 meses |
| Top Clientes | `v_dte_clientes_panel` ranking VENTA | #1 ENVASES IMPRESOS $106M |
| Top Materiales | `v_pesajes_top_materiales_sucursal` agregado | t por material YTD |
| Top Sucursales | `v_pesajes_kpi_sucursal` COMPRA | t por sucursal |
| UF | API mindicador.cl + cache 12h localStorage | $40.425 |
| Finanzas | Sin tabla — marcadas amarillo "pendiente integración" | 4 cards |

## Bug crítico de scope (iteración 2)

Bridge usaba `window.sb` pero `let sb` no se expone como propiedad de window. Todas las queries del bridge fallaban silenciosamente con "sb no inicializado". Fix: reemplacé `window.sb` → `(typeof sb !== "undefined" && sb)`.

## Deploy preview Vercel iteración 2 (09:35)

- **Push:** commit `8881a3c` a `replit/plan-dusan` (panel-rdo-v4.html +4321 líneas, panel-rdo.html INTACTO).
- **Deployment:** `dpl_4PQjDArQmqULkRKpAFm8gypD4WLQ` — `READY`.
- Token bypass inicial (expirado, regenerado en T5).

## Screenshots iteración 2

- `public/v4-FINAL-real-data.png` — dashboard completo con datos reales.
- `public/v4-dashboard-real-data.png` — versión intermedia.

---

# ITERACIÓN 1 — Camino B inicial (19-20 may noche, ~4h)

> Crear `panel-rdo-v4.html` sidecar con estética nueva sobre lógica real del panel original. Sin tocar `panel-rdo.html` para evitar conflicto con PRs #30/#31 en flight.
>
> Detalle completo en `reciclean-rdo/mayordomo/BITACORA-VIVA.md` entrada 22:30 → 02:45.

## Highlights iteración 1
- 4.236 líneas en v4 base con sidebar, topbar, KPIs, charts, mapa, top 5, finanzas.
- Bridge JS con 23 funciones (`v4SwitchTab`, `v4LoadKpi*`, `v4InitCharts`, `v4InitMap`, `v4LoadTop`...).
- A11y: skip-link + keyboard nav sidebar + aria-current dinámico.
- Banner amarillo "🚧 Vista previa" + link "↩ Volver al panel actual".
- Bug `</script>` faltante en línea 3686 corregido (sin esto, `window.login` quedaba undefined).

---

# Estado final de archivos al cierre iteración 3

- `public/panel-rdo-v4.html` — **4.381 líneas** (4.236 + 78 T2/T3 + 15 T4 + - ajustes).
- `public/panel-rdo.html` (producción) — INTACTO. main local 100% sincronizado con origin/main.
- `public/PENDIENTES-DATOS.md` — sin cambios desde iteración 1.
- `public/BLOQUEOS.md` — B09 cerrado, 8 items restantes activos.
- `public/CLAUDE-VISUAL.md` — sin cambios.
- `public/QUERIES-PC4.md` — entregable de PC4 (committed en `replit/plan-dusan`).
- `public/CONTEXTO-COMPLETO.md`, `CONTEXTO-SESION.md` — sin cambios desde creación.

## Archivos del mayordomo actualizados hoy

- `reciclean-rdo/mayordomo/TABLERO-PCs.md` — 3 fuentes cruzadas + URL Pablo actualizada.
- `reciclean-rdo/mayordomo/COLA-TAREAS.md` — 7A/7B/7C cerradas (PC4) + T1-T5 implícitas en commits.
- `reciclean-rdo/mayordomo/BITACORA-CIERRE.md` — 11 entradas acumuladas.
- `reciclean-rdo/mayordomo/COMO-TRABAJAR.md` — reglas de coherencia entre PCs creadas.

## Supabase — tabla mayordomo

```
panel.pc_heartbeat: 9 latidos acumulados (id=1..9)
panel.config_ui:    3 claves de contexto (contexto_completo_v1 + contexto_sesion_v1 + visual_standard_v1)
```
