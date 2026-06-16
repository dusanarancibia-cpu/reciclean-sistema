# STATUS — Reciclean-Farex Sistema

> **Snapshot de `temas_en_progreso` (Supabase).** Respuesta canónica a "status / cómo vamos / detalle".
> **Última regeneración:** 16-jun-2026 · **27 iniciativas padre**

---

## Accesos rápidos

| Acción | URL |
|---|---|
| 📊 Ver status (mobile+PC) | [reciclean-sistema.vercel.app/status.html](https://reciclean-sistema.vercel.app/status.html) |
| + Agregar tema nuevo | [reciclean-sistema.vercel.app/agregar-tema.html](https://reciclean-sistema.vercel.app/agregar-tema.html) |
| GitHub rendered | [github.com/.../STATUS.md](https://github.com/dusanarancibia-cpu/reciclean-sistema/blob/main/STATUS.md) |

---

## Resumen sesion 15-jun-2026 — en palabras sencillas

### Que hizo Dusan

1. **Aprobo y mergeo 8 PRs** en un solo dia — la sesion mas productiva del mes.
2. **Mesa de Control Plan 99-99** (PR #304): nuevo tab en el panel RDO que muestra de un vistazo la salud del sistema — puntaje por PC, fases del plan, sanciones activas, verificaciones 30 dias. Se refresca solo cada 60 segundos.
3. **Tab Firmas reglas** (PR #302): Dusan ahora puede aprobar o rechazar decisiones tecnicas con 1 click. Hay 3 firmas pendientes esperando su aprobacion (v13 evidencia, Diego canary 10%, cifrado clientes Ley 21.719).
4. **Sparkline SHADOW v12** (PR #306): grafico de tendencia SVG en Mesa de Control que muestra como evoluciona el % de afirmaciones verificadas hora a hora.
5. **Mensajes claros en errores Diego** (PR #300): cuando Diego se cae o hay problemas de red, ahora el panel dice en espanol que paso y que hacer (en vez de "HTTP 401" que nadie entendia).
6. **Linter automatico** (PR #301): proteccion nueva que bloquea PRs si tienen errores de JavaScript — primer guardia real del Plan 99-99.
7. **Deploy a produccion** (PR #305 + #307): todo lo anterior subido a prod con firma delegada de Pablo.

### Que hizo Pablo

1. **Widget Canarios en Mesa Control** (PR #308): nueva seccion en la Mesa de Control que muestra el estado de los canarios progresivos — el sistema que prueba cambios de Diego gradualmente (primero 1%, despues 10%, etc.) antes de activarlos para todos.
2. **Revision y firma delegada**: autorizo el deploy a produccion de los 5 commits acumulados del dia.

### En resumen

Fue un dia de **infraestructura de confianza**: se construyeron las herramientas para que Dusan vea la salud del sistema, firme decisiones importantes, y los cambios a Diego se prueben de forma gradual antes de afectar al equipo. No se tocaron precios ni datos comerciales — todo fue blindaje y visibilidad.

---

## Tareas padre (27 iniciativas) — foto Supabase 16-jun-2026

| Código | % | Banda | Depto | Responsable | Titulo | Siguiente |
|---|---|---|---|---|---|---|
| **I-26** | 100% | ✅ Superado | Comercial | Pablo | CRM Panel RDO | Completado. 3 sub-tareas cerradas. |
| **I-16** | 95% | 🔍 Revisión | Tecnología | Pablo | Diego v5.1 LIVE | Smoke final Andrea cotizador. Validar Gantt + Estado 4 PCs. |
| **I-27** | 95% | 🔍 Revisión | Legal | Pablo | Cumplimiento RDO | Verificación final pre-merge a prod. |
| **I-04** | 90% | 🔍 Revisión | Gerencia | Claude | Tracker temas | CLAUDE.md apunta a v2. Wiring n8n Pablo. |
| **I-06** | 80% | 🔍 Revisión | Gerencia | Dusan | Ecosistema int. | Integrar KPIs en panel RDO. Validar flujo material V2. |
| **I-14** | 80% | 🔍 Revisión | Tecnología | Dusan | Blindaje Diego | Activar 2FA con cuenta gerencia como piloto. |
| **I-10** | 78% | 🧪 Validado | Comercial | Dusan | Sprint ventas | Poblar kanban oportunidades reales. Drag-and-drop columnas. |
| **I-19** | 70% | 🧪 Validado | Gerencia | Dusan | Plan 2026-2030 | Gantt Viva 115 filas. Falta KPIs operativos + hitos reales. |
| **I-11** | 70% | 🧪 Validado | Tecnología | Pablo | ACI deploy | Testing Ingrid+Andrea datos reales. Bandeja precios completa. |
| **I-24** | 65% | 🧪 Validado | RRHH | Dusan | Descripcion cargos | Andrea revisa T11. Consolidar cargos Ingrid, Nicolas, Juan. |
| **I-13** | 48% | 🔨 Build | Tecnología | Pablo | Deuda técnica | Items pendientes. Monitorear headers no-cache Vercel. |
| **I-01** | 30% | 📋 Spec | Tecnología | Claude | Mapa BD + FKs | Mapear FKs + diagrama ER + decidir RLS particionadas. |
| **I-05** | 30% | 📋 Spec | Tecnología | Claude | Panel temas | Build status.html interactivo. Migrar a API live. |
| **I-02** | 30% | 📋 Spec | Gerencia | Dusan | Viz informes | Conectar informes visuales al panel. Decidir formato. |
| **I-25** | 30% | 📋 Spec | Legal | Dusan | Permisos Talca | Revisar vigencia cada permiso + fechas renovacion. |
| **I-22** | 25% | 📋 Spec | Tecnología | Dusan | Guia Chatbot | Revisar guia + decidir deploy. |
| **I-03** | 20% | 📋 Spec | Tecnología | Dusan | Eval BI tools | Contrastar con contexto real (84 tablas, Panel RDO live). |
| **I-21** | 20% | 📋 Spec | Operaciones | Dusan | Puerto Montt ops | Permisos SAG + roadmap apertura. |
| **I-17** | 20% | 📋 Spec | Tecnología | Claude | Docs Mermaid+EC | Post I-05 build. |
| **I-09** | 15% | 💡 Diseño | Tecnología | Pablo | Infra VPS + hub | Contratar DO. Pablo ejecuta scripts. |
| **I-23** | 15% | 💡 Diseño | Gerencia | Dusan | Monday implement | Decidir Monday vs tracker interno. |
| **I-08** | 10% | 💡 Diseño | Tecnología | Dusan | Rotación keys | Rotar K3 + Meta token. |
| **I-20** | 10% | 💡 Diseño | Comercial | Dusan | Propuestas activas | Revisar 8 PDFs propuestas. |
| **I-07** | 10% | 💡 Diseño | Tecnología | Claude | Eval diagramas | ECharts para I-05 cuando arranque build. |
| **I-15** | 0% | 💡 Diseño | Finanzas | Dusan | Notion Plus | Contratar + setup workspace. |
| **I-18** | 0% | 💡 Diseño | Comercial | Dusan | Contrato Resimple | Abrir PDF + decidir renovacion. |
| **I-12** | 0% | ~~Descartado~~ | Gerencia | Dusan | Diego v5.0 live | Cancelado 22-abr. Saltamos a v5.1 (I-16). |

---

## Progreso diario (evolución)

| Fecha | Iniciativas | % promedio | Superados | En revisión | Validado | Build | Spec/Diseño |
|---|---|---|---|---|---|---|---|
| 22-abr-2026 (baseline) | 25 | 15.9% | 0 | 1 | 0 | 4 | 20 |
| **16-jun-2026** (hoy) | 27 | 38.5% | 1 | 5 | 4 | 1 | 16 |

> Avance neto +22.6 puntos porcentuales en 8 semanas. 1 iniciativa cerrada (I-26 CRM). 5 en revisión final.

---

## Semana 16-20 jun — foco sugerido

| Día | Quién | Que toca |
|---|---|---|
| **Lun 16** | Dusan | Firmar 3 items pendientes en tab ALT3 (v13, Diego canary, cifrado) |
| **Lun 16** | Pablo | Smoke final Diego v5.1 con Andrea (I-16 → 100%) |
| Mar 17 | Pablo | Cerrar I-27 Cumplimiento RDO (merge final a prod) |
| Mar 17 | Dusan | Poblar kanban embudo con oportunidades reales (I-10) |
| Mie 18 | Dusan | 2FA cuenta gerencia piloto (I-14 → 100%) |
| Jue 19 | Pablo | Deuda técnica sprint (I-13) |
| Vie 20 | Ambos | Revisión semanal + snapshot progreso |

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
