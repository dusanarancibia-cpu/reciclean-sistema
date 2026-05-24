# F4 — Diseño de KPIs por perfil (Andrea / Cony / Ingrid / Dusan)

> Síntesis de investigación 23-may noche + diseño accionable. Fuente: 3 agentes (UX Researcher dashboards por rol, Psychologist carga cognitiva, UX Architect continuidad visual).

## Marco mental (resumido)

- **Working memory útil:** 4±1 chunks (Cowan 2001, no los 7±2 de Miller).
- **Regla 3 segundos:** el usuario debe identificar la acción más urgente en ese tiempo. Una sola cosa "grita" por pantalla.
- **F-pattern / Z-pattern:** lo más urgente arriba-izquierda.
- **Progressive disclosure:** nivel 1 estado + alertas; nivel 2 drill-down on demand.
- **Continuidad visual:** misma sidebar, mismo topbar, misma paleta, microanimaciones consistentes 200-300ms.

---

## Andrea — Comercial (perfil `comercial`)

**Pregunta de los 3s:** "¿Qué cliente cierro hoy?"

**5 KPIs sobre el fold (en este orden, top-left → bottom-right):**

| # | KPI | Tabla origen | Acción |
|---|---|---|---|
| 1 | **Oportunidades calientes pendientes** (count + lista top-5) | `curated.oportunidades` `estado='abierta'` | Ver detalle → ficha cliente |
| 2 | **Clientes sin contacto >30d** | `panel.v_marketing_clientes_inactivos` | Llamar |
| 3 | **Meta mes vs real** (% + delta) | `curated.cierres` | (visual) |
| 4 | **Cotizaciones pendientes de envío** | `panel.diego_tareas` filtro tipo='cotizacion' + estado='pendiente' | Enviar |
| 5 | **Precios cartón/papel/plástico Cerrillos** (chips) | `v_precios_activos` | Click → tab Precios |

**Layout:** vertical "feed de acción" — cards 1+2+4 priorizadas (acción visible). KPI 3 como tira horizontal arriba (resumen). KPI 5 chips compactos.

**Anti-patrón a evitar:** 15+ métricas; gráfico de torta para conversión por etapa.

---

## Cony — RRHH (perfil `admin` rol RRHH, sucursal Sercot)

**Pregunta de los 3s:** "¿Qué requiere mi atención hoy?"

**4 KPIs sobre el fold (4-cuadrantes):**

| Cuadrante | KPI | Tabla |
|---|---|---|
| ↖ Headcount | **Dotación activa** (14 + vencimientos contrato próximos) | `curated.trabajadores` + `panel.v_dotacion_completa` |
| ↗ Ausencias | **Vacaciones por vencer** (próximos 30d) | (pendiente tabla — usar `panel.diego_tareas` filtro tipo='vacaciones') |
| ↙ Vencimientos legales | **DT / Mutual / AFP** vencimientos | `panel.v_cumplimiento_legal` LEY-LABORAL |
| ↘ Rendiciones | **Rendiciones pendientes por persona** | `panel.v_rendiciones_pendientes_por_persona` |

**Layout:** dashboard 4-cuadrantes con semáforo (verde/ámbar/rojo) por cuadrante. Si cuadrante rojo → tamaño 2x del resto.

**Anti-patrón:** headcount total como hero (poco accionable); ocultar alertas legales bajo el fold.

---

## Ingrid — Operaciones Talca (perfil `admin` rol operaciones Talca)

**Pregunta de los 3s:** "¿Qué pasa en mi planta AHORA?"

**6-8 KPIs sobre el fold (grid denso "control room"):**

| KPI | Tabla | Semáforo |
|---|---|---|
| Pesajes del día (count + ton) | `curated.pesajes` filtro sucursal='Talca' hoy | verde si > meta diaria |
| Camiones disponibles | `panel.activos` tipo='vehiculo' estado='operativo' sucursal='Talca' | verde si ≥ 2 |
| Mantenciones vencidas | `panel.activos` `proxima_mantencion < CURRENT_DATE` | rojo si > 0 |
| Conductores con licencia próxima a vencer (30d) | `panel.conductores` `licencia_vencimiento < NOW()+30d` | ámbar si > 0 |
| RDO del día (estado envío MMA) | `curated.rdo_diario` hoy | rojo si no enviado |
| Stock material acumulado | `staging.pesajes` agg | informativo |
| Incidencias últimas 24h | `panel.diego_bandeja` filtro sucursal='Talca' estado='pendiente' | rojo si > 0 |
| Dotación presente vs esperada | placeholder | informativo |

**Layout:** grid denso 4-col × 2-rows, cards compactas con padding mínimo (12px), semáforos a la izquierda del KPI.

**Anti-patrón:** cards estilo SaaS con whitespace; animaciones lentas; mezclar KPIs estratégicos con operativos.

---

## Dusan — CEO (perfil `dusan`)

**Pregunta de los 3s:** "¿Qué decisión me toca hoy?"

**5 KPIs sobre el fold (executive briefing vertical priorizado por urgencia):**

| # | KPI | Tabla |
|---|---|---|
| 1 | **Decisiones pendientes de firma** (PRs + DECISIONES.md) | `panel.diego_bandeja` filtro who='dusan' + estado='pendiente' |
| 2 | **Facturación mes** (real vs presupuesto, +/- vs mes anterior) | `curated.cierres` |
| 3 | **Márgenes por sucursal** (top 3) | `curated.vw_cartera_clientes_actual` agg |
| 4 | **Alertas críticas** (precio, cumplimiento, dotación) | `panel.v_diego_pendientes` |
| 5 | **Cumplimiento legal** (5 leyes — % avance Dyana) | `panel.v_cumplimiento_legal` |

**Layout:** "executive briefing" tipo card-stack vertical. KPI 1 hero card (decisiones pendientes), demás cards equal-weight.

**Anti-patrón:** 20 KPIs por completitud; gráficos sin contexto (¿bueno o malo?); ausencia de "decisión pendiente" como primer bloque — Dusan no lee, decide.

---

## Reglas comunes a los 4 dashboards

1. **Una métrica por card** (Cony excepción: agrupación visual 4-cuad).
2. **Número grande + delta + contexto** (máx 3 elementos por card).
3. **Color con significado**, no decorativo: rojo=acción, ámbar=ojo, verde=OK, gris=neutral.
4. **Etiqueta en lenguaje del usuario** ("Camiones detenidos" no "vehicles_idle_count").
5. **Acción explícita si aplica** (botón "Ver detalle" / "Asignar" / "Llamar").
6. **Continuidad visual:**
   - Mismo verde Reciclean `#059669` primary en los 4.
   - Sidebar persistente (R-AUD-F3 silos cortos: Comercial, Operaciones, etc.).
   - Misma jerarquía surface-1 (fondo), surface-2 (cards), surface-3 (modales).
   - Microanimaciones 200-300ms easing `emphasized`.
   - Modales como drawer lateral derecho (no full-screen).
   - State preservation entre tabs (scroll + filtros).

## Implementación sugerida (sin romper estructura actual)

**Fase 1 (esta jornada — F4 docs):** este documento + diseño consolidado.

**Fase 2 (próxima iteración Pablo, sin firma Dusan no se mergea):**
- Crear vista `panel.v_kpis_por_perfil(p_email TEXT)` que devuelve JSON con los KPIs específicos según perfil del usuario.
- En `panel-rdo.html` Portada: agregar bloque `#kpis-perfil` que renderiza según `currentProfile`.
- Por ahora la Portada existente sirve igual para los 4 — solo cambian las pestañas visibles (F2 ya aplicado).

**Fase 3 (visión a 3 meses):** Linear-style command palette `Cmd+K` para búsqueda global, breadcrumbs en modales, deep-links `/clientes/pincore?modal=cotizador`.

---

**Firmado:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 noche (F4 KPIs por perfil — diseño consolidado, implementación Fase 2 pendiente firma).
