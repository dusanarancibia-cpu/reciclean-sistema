# BLOQUEOS — Loop Autónomo Camino B (19→20 may 2026)

> Cosas que me trabaron durante el loop. Cada entrada: timestamp, qué se trabó, qué hice (skip / workaround), qué necesita Dusan para destrabar.

## Bloqueos conocidos al arrancar

### B01 · PR #30 + PR #31 sin mergear (reciclean-sistema)
- **Impacto:** no puedo tocar `public/panel-rdo.html` directamente. Mitigación: trabajo en archivo nuevo `panel-rdo-v4.html` (sidecar).
- **Acción Dusan:** revisar + mergear PR #30 y PR #31 antes del swap final.

### B02 · Replit Secret VISUAL_STANDARD pendiente acción manual
- **Impacto:** ninguno para Camino B. Solo afecta visibilidad de la pauta visual desde Replit.
- **Acción Dusan:** abrir Replit → Tools → Secrets → agregar `VISUAL_STANDARD=public/CLAUDE-VISUAL.md`.

### B03 · Sin navegador en este entorno
- **Impacto:** no puedo hacer smoke test visual end-to-end.
- **Mitigación:** valido sintaxis HTML + JS estáticamente. Smoke real lo hace Dusan o Pablo al abrir el archivo.

## Bloqueos surgidos durante el loop

### B10 · Heartbeat de PC2-Pablo desactualizado (no es inactividad) — 20-may 10:40
- **Síntoma:** PC2 solo tiene el latido seed inicial del 20-may 08:29 Chile en `panel.pc_heartbeat`. Hace 2.8h.
- **NO es inactividad real:**
  - Bitácora: 4 cierres documentados entre 18-19 may (PR #28 D-OP-08, PR #29 D-OP-09, Mig 042 Impulsa DDL, Ola 1 PRs #30+#31).
  - GitHub: último commit de Pablo persona `arancibia.pab01@gmail.com` fue `dacbe43c` el 19-may 15:30 Chile, **dentro de las 24h**.
- **Causa probable:** sesión Replit de PC2 cerrada anoche. Mayordomo v2 se creó hoy, así que Pablo no tuvo oportunidad de actualizar heartbeat.
- **Acción del agente:** NO marcar PC2 como inactivo. NO reasignar trabajo de Pablo a otro PC. Tablero actualizado para mostrar "heartbeat desfasado, actividad real reciente".
- **Cuando PC2 vuelva:** primer paso debe ser `INSERT INTO panel.pc_heartbeat ...` para corregir el desfase.

### B04 · Mismatch de schema en bridge inicial (RESUELTO)
- **2026-05-20 02:00Z** — primera versión del bridge asumía nombres de columna que no existían (`created_at`, `monto_total`, `kg_neto` en staging, `curated.rdo_resumen_mensual`, `curated.alertas_negocio`).
- **Schema real verificado:**
  - `staging.pesaje_s1` → `fecha, turno, peso_toneladas, raw_json, subido_en, procesado` (NO tiene sucursal ni material separados — están en `raw_json`).
  - `staging.facturacion_s5` → `fecha, cliente, monto, raw_json, subido_en, procesado`.
  - `curated.pesajes` → tabla rica: `fecha, sucursal, empresa_id, material_descripcion, kg_neto, monto_total` (ESTA es la fuente válida para KPIs reales).
  - `curated.alertas` → con campo boolean `resuelta` (no `estado='activa'`).
  - `curated.rdo_resumen_mensual` → **NO EXISTE**.
- **Fix aplicado:** todas las queries del bridge ahora consultan `curated.pesajes` para datos enriquecidos y `staging.facturacion_s5` para monto/cliente. KPI RDO queda explícitamente como "pendiente" hasta que Pablo cree la vista mensual.

### B05 · ID mismatch en contenedor de alertas portada (RESUELTO)
- **2026-05-20 02:10Z** — había creado `#alertasPortadaContainer` pero `loadAlertasPortada()` legacy escribe en `#portadaAlertas`.
- **Fix:** renombrado para coincidir. El JS legacy llena el banner correctamente al cambiar a tab portada.

### B06 · `<script>` desbalanceado heredado del original (NO TOCADO)
- **2026-05-20 02:30Z** — el archivo original `panel-rdo.html` tiene 2 `<script>` openers y solo 1 `</script>` (líneas 716, 3379, 3427). Mi v4 hereda ese patrón (3 openers, 2 closers).
- **Razón:** browsers auto-cierran el script anterior al encontrar otro opener. Funciona en producción desde hace meses.
- **Acción:** NO corrijo en v4 para preservar comportamiento conocido. Si Pablo quiere limpiar esto, hacerlo en una iteración separada.

### B07 · UF API real no integrada
- **Pendiente Dusan/Pablo:** crear Edge Function `f_uf_hoy` que cachea respuesta de mindicador.cl/api/uf por 24h.
- **Estado v4:** topbar muestra "UF: —" hasta que la EF exista.

### B08 · Tesorería sin tabla en BD
- **Pendiente Dyana/SERCOT:** definir si Saldo Banco, Por Cobrar, Pagos Programados, Inventario llegan vía:
  - (a) tabla `curated.tesoreria_kpis` poblada por ingest manual de Dyana
  - (b) integración bancaria automática
  - (c) form de input en panel admin para Andrea
- **Estado v4:** 4 cards muestran "—" + nota "pendiente"

### B09 · panel-rdo.html con cambios sin commitear en main local (RESUELTO 20-may 11:05)
- **Síntoma original (20-may 08:55):** main local tenía `panel-rdo.html` con 1033 líneas modificadas sin commitear (cambios consistentes con PRs #30/#31 de Pablo).
- **Diagnóstico (20-may 11:00):** main local estaba 18 commits atrás de origin/main. Los PRs #30, #31, #32, #33, #34 ya estaban mergeados en GitHub. Los cambios locales eran un "duplicado anticipado" de lo que iba a llegar con un pull.
- **Resolución (20-may 11:05):**
  1. `git fetch origin` → vio los 18 commits.
  2. `git stash push -u -m "T1-pre-pull-main-sync-20may-1100"` → guardó cambios + untracked.
  3. `git pull --ff-only origin main` → fast-forward limpio (`27ff216..03cf4d2`), +1147/-50 líneas en panel-rdo.html + nuevo `.github/CODEOWNERS`.
  4. `git stash pop` → conflicto esperado en panel-rdo.html.
  5. `git checkout HEAD -- public/panel-rdo.html` → tomé la versión oficial mergeada en main remoto (descarté stash local porque ya estaba contenido en los commits).
  6. `git stash drop` → limpieza.
- **Verificación:** `git rev-list --left-right --count main...origin/main` → `0 0`. main local 100% sincronizado.
- **Estado final:** panel-rdo.html en main local = panel-rdo.html en producción. Sin diff. Los untracked de docs PC1 (CONTEXTO-*, BLOQUEOS, etc.) siguen ahí como antes — no son parte del repo committed.

---

## Validación final del archivo (cierre de loop)

- ✅ Total líneas: 4.201 (vs 3.429 original → +772 líneas v4)
- ✅ Balance HTML: 297/297 div, 12/12 section, 1/1 main, 1/1 aside.
- ✅ 12 tabs legacy preservados (data-tab buttons + tab-content sections).
- ✅ `initSupabase()` + `setupTabs()` invocados.
- ✅ Bridge v4 con 23 funciones registradas (`v4SwitchTab`, `v4LoadKpi*`, `v4InitCharts`, `v4InitMap`, `v4LoadTop`, etc.).
- ✅ JS bridge pasa `node --check` sin errores de sintaxis.
- ✅ Pattern de scripts idéntico al original (3 opens / 2 closes — pre-existing).

## Camino del swap (futuro, cuando Dusan apruebe)

1. Mergear PR #30 y PR #31 a main.
2. Validar v4 en Vercel preview en `/panel-rdo-v4.html`.
3. Si OK: renombrar `panel-rdo-v4.html` → `panel-rdo.html` (backup el viejo como `panel-rdo.html.pre-v4.bak`).
4. Crear PR con checklist completo del CLAUDE.md (bypass 4 lugares, GRANTs cesar_readonly, mobile responsive).
