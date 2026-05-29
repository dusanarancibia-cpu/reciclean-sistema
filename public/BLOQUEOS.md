# Bloqueos abiertos · Panel RDO

> Lista viva. Cada bloqueo se cierra con un commit que lo referencia: `cierra BLOQ-XXX`.
> Generado: 2026-05-28 a partir de `DIAGNOSTICO-HERRAMIENTAS-POR-SILO.md`.
> Actualizado: 2026-05-28 PM — cirugía silos cerró BLOQ-010 a BLOQ-018.

---

## ⏳ Esperando otro PC (no tocar)

| ID | Tema | Bloqueado por | Owner que destrabará |
|---|---|---|---|
| BLOQ-001 | KPI por silo dentro de `public/panel-rdo.html` | PR #119 abierto (Pablo · ola1-data-source-footer) | PC1 después del merge |
| BLOQ-002 | Hook nuevo en `data-v4-tab` para KPIs silo | PR #119 (Pablo usa el mismo dispatcher) | PC1 después del merge |
| BLOQ-003 | Modificar zona ~línea 8587 (CRM Impulsa drawer) | PR #119 cambió esa query hoy | PC1 después del merge |
| BLOQ-004 | Agregar nuevos `#dataSourceFooter*` o `#dsTooltipModal*` | PR #119 los crea | PC1 después del merge |
| **BLOQ-019** | **Sincronizar sidebar v4 con 5 pestañas backend nuevas** (cumplimiento, dotacion, campanas, rutas, inventario) | PR #119 abierto (panel-rdo.html) | PC1 después del merge — auditoria-sidebar-v4 ya detecta los 5 fantasmas. Acción: agregar `<a data-v4-tab="…">` por cada una. |

## ✅ Cerrado en esta sesión (sin colisión con Pablo)

| ID | Tema | Migración / cambio | Verificación |
|---|---|---|---|
| BLOQ-010 | `panel.documentos.silo_negocio` etiquetado 01-11 | mig `bloq_010_etiquetar_documentos_silo_negocio` | 235/276 docs con silo; 41 NULL (legacy public/) |
| BLOQ-011 | Pestaña `cumplimiento` silo 05 | mig `bloq_011_015_pestanas_silo_05_08_09_02_03` | Visible en `v_silo_pestanas_visibles` |
| BLOQ-012 | Pestaña `dotacion` silo 08 | idem | Visible |
| BLOQ-013 | Pestaña `campanas` silo 09 | idem | Visible |
| BLOQ-014 | Pestaña `rutas` silo 02 | idem | Silo 02 pasa de 1 → 2 asignadas |
| BLOQ-015 | Pestaña `inventario` silo 03 | idem | Silo 03 pasa de 1 → 2 asignadas |
| BLOQ-016 | `estado_proyectos.ultima_verificacion` + trigger touch | mig `bloq_016_verificacion_proyectos` | 10/10 verificados + trigger `panel.trg_estado_proyectos_touch()` |
| BLOQ-017 | `bandeja_precios` asignada a silos 01/07/10 | mig `bloq_017_asignar_bandeja_precios_silos` | Andrea (silo 01) la ve en su sidebar |
| BLOQ-018 | EF `gap-notify` — verificada | (sin cambio, sólo diagnóstico) | ~14 invocaciones/h en 24h, todas HTTP 200. No hay gaps reales hoy → 0 alertas. EF sana. |

## Reglas

- **Antes de comenzar:** marcar el bloqueo como `in_progress` con commit `BLOQ-XXX: arranque` (no obligatorio, pero recomendado).
- **Al cerrar:** el commit del merge debe incluir `cierra BLOQ-XXX` para que la próxima sesión lo elimine de esta lista.
- **Cualquier ítem `⏳`** queda en lista de espera; no se asciende a `🔧` hasta que el PR bloqueante haya sido merged.
- **BLOQ-019** es resultado natural de BLOQ-011..015: la BD está sana, falta sólo enganchar los links del sidebar (responsabilidad PC1 post-#119).

---

## Resumen para Dusan (CEO)

| Antes (mañana 28-may) | Después (tarde 28-may) |
|---|---|
| 3 silos sin pestaña propia (05, 08, 09) | Los 3 ya tienen su pestaña backend |
| 2 silos delgados (02, 03 sólo `pesaje`) | Ambos pasan a 2 pestañas |
| 276 docs sin silo de negocio | 235 etiquetados, 41 legacy NULL |
| `estado_proyectos.verificado_por = NULL` en los 10 | 10/10 con verificación + fuente + trigger automático |
| `bandeja_precios` huérfana | Asignada a silos 01, 07, 10 |
| EF `gap-notify` con 0 alertas | Confirmada sana (corre cada ~5 min) |

Frontend (sidebar v4) ya las verá cuando Pablo cierre PR #119 y PC1 agregue los 5 `data-v4-tab=` correspondientes.
