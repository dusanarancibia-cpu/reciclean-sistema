# STATUS — Reciclean-Farex Sistema

> **Snapshot de `temas_en_progreso` (Supabase).** Respuesta canónica a "status / cómo vamos / detalle".
> **Última regeneración:** 22-abr-2026 14:15 · **68 filas** (25 parents + 43 sub-tareas)

---

## Accesos rápidos

| Acción | URL |
|---|---|
| 📊 Ver status (mobile+PC) | [reciclean-sistema.vercel.app/status.html](https://reciclean-sistema.vercel.app/status.html) |
| + Agregar tema nuevo | [reciclean-sistema.vercel.app/agregar-tema.html](https://reciclean-sistema.vercel.app/agregar-tema.html) |
| GitHub rendered | [github.com/.../STATUS.md](https://github.com/dusanarancibia-cpu/reciclean-sistema/blob/main/STATUS.md) |

---

## Tareas padre (25 iniciativas) — ordenadas por fecha y prioridad

| Código | % | Depto | Responsable | Tema (≤15) | Tiempo | Fecha lím. | Ruta archivo principal | Banda · Siguiente |
|---|---|---|---|---|---|---|---|---|
| **I-08** | 10% | Tecnología | Dusan | Rotación keys | 20min | **22-abr 🔥** | — | 💡 URGENTE K3+Meta |
| **I-15** | 0% | Finanzas y A. | Dusan | Notion Plus | 30min | **25-abr** | — | 💡 Contratar workspace |
| **I-01** | 30% | Tecnología | Claude | Mapa BD + FKs | 1h | **29-abr** | — | 📋 Mapear FKs+ER+RLS |
| **I-10** | 40% | Comercial | Dusan | Sprint ventas | 2sem | **28-abr ⚠️** | — | 🔨 ATRASADO |
| **I-09** | 15% | Tecnología | Pablo | Infra VPS + hub | 2d | **28-abr** | — | 📋 Requires I-08 + DO |
| **I-12** | 30% | Gerencia General | Dusan | Diego v5.0 live | 2sem | **🚀 30-abr** | `Plan Ecosistema Digital/Observaciones para Diego Agente/` | 📋 Lanzamiento oficial |
| **I-04** | 90% | Gerencia General | Claude | Tracker temas | 30min | **30-abr** | — | 🔍 Pablo wirea n8n |
| **I-19** | 30% | Gerencia General | Dusan | Plan 2026-2030 | 2h | **30-abr** | `Plan Ecosistema Digital/Plan_Operativo_v2_FINAL_Lunes_2026-04-21.pptx` | 📋 Alinear con I-10, I-12 |
| **I-11** | 55% | Tecnología | Pablo | ACI deploy | 1sem | **5-may** | `Cesar - Order/02_Asistente_Comercial_Integrado/.../SPEC_v3_FINAL...docx` | 🔨 Panel RDO con Negocios+Cotizador portados |
| **I-18** | 0% | Comercial | Dusan | Contrato Resimple | 1h | **10-may** | `Comercial/.../Resimple/10-2025 Contrato Resimple...aspx` | 💡 Revisar vigencia 2026 |
| **I-05** | 30% | Tecnología | Claude | Panel temas | 3h | **10-may** | — | 📋 Esperando green light build |
| **I-03** | 20% | Tecnología | Dusan | Eval BI tools | 2h | **10-may** | `Cesar - Order/07_Archivo_y_Respaldos/Respaldos/admin_panel_v83.html` | 📋 Contrastar contexto |
| **I-16** | 0% | Tecnología | Pablo | Diego v5.1 | 2sem | **15-may** | — | 💡 Post v5.0 estable |
| **I-02** | 10% | Gerencia General | Dusan | Viz informes | 2sem | **15-may** | — | 💡 Decidir consumidor |
| **I-20** | 25% | Comercial | Dusan | Propuestas activas | 1sem | **15-may** | `Comercial/.../[8 PDFs de propuestas]` | 📋 Pestaña Negocios operativa, falta migrar Excel |
| **I-13** | 5% | Tecnología | Pablo | Deuda técnica | 3sem | **20-may** | — | 💡 11 subtareas post 30-abr |
| **I-06** | 15% | Gerencia General | Dusan | Ecosistema int. | 1sem | **20-may** | `Plan Ecosistema Digital/Ecosistema_Digital_Reciclean_Farex_v2.pptx` | 💡 Overlap I-02/I-03 |
| **I-07** | 10% | Tecnología | Claude | Eval diagramas | 30min | **20-may** | — | 💡 ECharts para I-05 |
| **I-21** | 20% | Operaciones | Dusan | Puerto Montt ops | 1mes | **30-jun** | `Patrimonio/Empresa Puerto Montt/` | 💡 Permisos SAG + roadmap |
| **I-14** | 10% | Tecnología | Dusan | Blindaje Diego | 1h | — | — | 💡 PUK SIM + 2FA Meta |
| **I-17** | 20% | Tecnología | Claude | Docs Mermaid+EC | 2h | — | — | 💡 Post I-05 build |
| **I-22** | 25% | Tecnología | Dusan | Guia Chatbot | 2sem | — | `Claude Code/ChatBot/produccion/Guia_Chatbot_Reciclean.pptx` | 💡 Deploy post 30-abr |
| **I-23** | 15% | Gerencia General | Dusan | Monday implement | 3h | — | `Claude Code/Documentacion/Monday_Guia_Implementacion_Reciclean_v2.pptx` | 💡 Decidir Monday vs tracker |
| **I-24** | 20% | Recursos Humanos | Dusan | Descripcion cargos | 2h | — | `equipo-procesos/.../Descripción de cargo Asistente Comercial.docx` | 💡 Consolidar 3 cargos |
| **I-25** | 30% | Legal y Compliance | Dusan | Permisos Talca | 3h | — | `Permisos y Resoluciones/Permisos de Talca/` | 💡 Revisar vigencia |

---

## Resumen del día — 12 mayo 2026

### Lo que hizo Pablo hoy

1. **Portó pestañas Negocios + Cotizador al Panel RDO de producción** (commit `ef1e19f`)
   - Trajo el código del Sprint 1 desde el repo `reciclean-rdo` (rama `replit/panel-rdo-v2`, PR #8 de ese repo) al panel que usan todos en `reciclean-sistema`
   - **Pestaña Negocios**: tabla con filtros (estado, tipo, búsqueda), lista de oportunidades desde la BD (`curated.oportunidades`), timeline expandible por negocio con etapas (`curated.negocio_etapas`), badges de color por estado (recibida → ganada/perdida)
   - **Pestaña Cotizador**: formulario para crear cotizaciones desde el panel, con tabla de líneas de material, cálculo de totales, integración con parámetros vigentes de BD
   - Visibilidad controlada: solo perfiles comercial, dusan y admin ven estas pestañas (silos 01, 10, 07)
   - **661 líneas nuevas** de HTML + JS funcional

2. **Aplicó 2 migraciones SQL en Supabase producción**
   - Migración 026: RLS anon con INSERT validado contra `panel.usuarios_autorizados`
   - Migración 027: registro de las nuevas pestañas en `panel.pestanas` + `panel.silo_pestanas`

### Lo que hizo Dusan hoy

3. **Dirigió la sesión de trabajo con Claude** para la integración de Negocios/Cotizador
   - Definió qué perfiles ven cada pestaña y la lógica de acceso por silos
   - Revisó que el port desde `reciclean-rdo` quedara coherente con el panel de producción

### Pendientes activos (PRs abiertos)

- **PR #20** — Instalador MIGRADOR-RDO para Pablo (1-click): script `.bat` que prepara el entorno para migrar el Excel "Negocios 3" a Supabase. Esperando merge.
- **PR #19** — Ignorar carpeta `.local/` en el repo. Esperando merge.

### Actividad de la semana (5-12 mayo)

| Fecha | Quién | Qué se hizo |
|---|---|---|
| 5-may | Dusan | Actualizó CLAUDE.md: doc maestro grupo v2, Ubergreen, trayectoria 31 años (PRs #16, #17, #18) |
| 7-may | Pablo | Panel RDO desplegable en Vercel + restauró index.html Admin Panel v93 |
| 8-may | Pablo | Refactor data-driven cajas (sin más hardcoded) + acceso rápido header (feedback Dusan) |
| 9-may | Dusan | Preparó system prompt agente MIGRADOR-RDO + creó PR #20 instalador |
| 11-may | Pablo | Agregó Cesar Mora al fallback bypass (ahora ve 11 silos) |
| **12-may** | **Pablo** | **Portó pestañas Negocios + Cotizador a producción + 2 migraciones SQL** |
| **12-may** | **Dusan** | **Dirigió integración, definió accesos por silo/perfil** |

---

## Directorio de tablas Supabase (conectadas al tracker)

| Tabla / Vista | Propósito | Iniciativas que la usan |
|---|---|---|
| `temas_en_progreso` | Source of truth iniciativas | Todas |
| `v_status_consolidado` | Query canónica "status" | Todas |
| `v_temas_jerarquia` | Parent-hijo visualización | I-04 |
| `v_renames_historial` | Audit de renames | Auditoría |
| `v_directorio_tablas` | Meta-tabla de tablas | I-01 |
| `v_progreso_temporal` | Evolución % por día | Gráfico avance |
| `v_progreso_diario_global` | Agregado diario | Gráfico avance |
| `temas_snapshot_diario` | Capturas % por fecha | Gráfico avance |
| `usuarios_autorizados` | Whitelist + delegación | I-04, I-11, I-12 |
| `conversaciones` | Buffer WA Diego (803 rows) | I-12 |
| `memoria_diego` | Facts + episodios Diego | I-12, I-13 |
| `precios` (246) · `materiales` (95) · `proveedores` (73) | Catálogo comercial | I-03, I-11, I-20 |
| `metas_comerciales` (116) | KPIs comercial | I-02, I-10 |
| `procesos_empresa` | SOPs validados | I-23, I-24 |

Total Supabase: **84 tablas** + **11 vistas**.

---

## Progreso diario (baseline)

| Fecha | Temas totales | % promedio | Superados | En revisión | En build | En diseño/spec |
|---|---|---|---|---|---|---|
| 22-abr-2026 (baseline) | 68 | 15.9% | 0 | 1 | 4 | 63 |
| **12-may-2026** | 68 | 17.2% | 0 | 1 | 5 | 62 |

> _I-11 sube de 50→55% (build), I-20 sube de 10→25% (spec). Pestaña Negocios+Cotizador en producción._

---

## Leyenda bandas

| Banda | Rango |
|---|---|
| 💡 Diseño | 0-19% |
| 📋 Spec | 20-39% |
| 🔨 Build | 40-59% |
| 🧪 Validado | 60-79% |
| 🔍 Revisión | 80-99% |
| ✅ Superado | 100% |

---

## Renombrar tareas (robusto)

- Desde Claude Code: "renombra I-NN a [≤15 chars]" → UPDATE con trigger que auditía
- `codigo` inmutable → referencias no se rompen
- Historial en `v_renames_historial`

---

## Departamentos (10)

1. Gerencia General · 2. Operaciones · 3. Comercial · 4. Abastecimiento · 5. Logística · 6. Finanzas y Administración · 7. Tecnología · 8. Recursos Humanos · 9. Legal y Compliance · 10. Sostenibilidad

---

## Fuente de verdad

- **Tabla:** `public.temas_en_progreso` (25 parents + 43 subs = 68 filas)
- **Vistas:** `v_status_consolidado` · `v_temas_jerarquia` · `v_directorio_tablas` · `v_progreso_temporal` · `v_progreso_diario_global` · `v_renames_historial` · `v_temas_activos` · `v_temas_bloqueados` · `v_delegaciones_propuestas`
- **Proyecto Supabase:** `eknmtsrtfkzroxnovfqn`

Si este archivo y la tabla divergen, la tabla manda.

---

_Repo público. Contenido comercial sensible va en rutas locales OneDrive, solo path referenciado aquí. Archivos nunca publicados en repo._
