# DIEGO-ESTÁNDAR-MÁXIMO — Documento maestro

> **Para qué sirve este archivo:** consolida los 6 documentos `DIEGO-ESTANDAR-*` generados por agentes especialistas el 23-may-2026 sobre cuál es el más alto estándar mundial 2026 para un chatbot/copiloto empresarial. Mapea las brechas vs Diego v6 actual, define un plan de evolución por fases F0→F3, declara métricas de éxito medibles, y separa lo que se puede implementar HOY sin Pablo de lo que requiere su intervención (BANDEJA PABLO).
>
> **Origen:** prompt de Dusan en modo autónomo 23-may-2026 ~01:00 UTC, post-merge PR #57 (FAB Diego v6 cableado end-to-end a main de reciclean-sistema).
>
> **Plan de trabajo:** `C:\Users\dusan\.claude\plans\tingly-wobbling-squid.md`.
>
> **Stack de referencia (Diego v6 al 23-may-2026):**
> - FAB en `reciclean-sistema/public/panel-rdo.html` (commit `bc91d1d`, PR #57 mergeado a `main`).
> - EF `diego-chat-process` v4 ACTIVE (659 líneas, `reciclean-rdo/supabase/functions/diego-chat-process/index.ts`).
> - 7 tools whitelist: `consultar_precio_material`, `consultar_uf_hoy`, `consultar_alertas_activas`, `buscar_cliente`, `resumen_facturacion_mes`, `registrar_tarea_cola`, `agendar_compromiso`.
> - System prompt: `DIEGO-PROMPT-MAXIMO.md` (602 líneas) — fuente del SYSTEM_PROMPT en index.ts L58-95.
> - Migs aplicadas: 050 + 051a/b/c/d + 052 + 053. Bucket `diego-chat-files` (privado).
> - **Bug abierto** BUG-FAB-001 (FAB depende `localStorage.rf_session`, ignora sesión Supabase canonical). Detalle en `mayordomo/BLOQUEOS.md`.

---

## 1 · Visión — Diego como compañero de élite

Diego v6 funciona end-to-end. Eso no es el techo, es el piso. La distancia entre Diego v6 y el estándar mundial 2026 **no es de capacidad técnica** — es de **diseño**: cómo conversa, cómo razona, cómo acompaña, cómo se mide, cómo cierra el lazo con metas, cómo se integra.

**Lo que Diego debería ser en 6 meses:**

> Un copiloto que **piensa antes de actuar**, **recuerda lo que le importa al interlocutor**, **propone antes de que pregunten**, **conecta cada tarea al Plan 2026**, **se mide con un dashboard que cualquiera puede mirar**, **se integra con los sistemas que ya usa el equipo** (Gmail, Calendar, Monday, WhatsApp), y **falla con honestidad** cuando no sabe.

Tres principios irrenunciables:

1. **Honestidad operativa.** Cuando Diego no sabe, dice "no sé" y propone cómo averiguarlo. Nunca inventa precios, clientes, fechas, ni datos. Si una tool devuelve 0 y la otra devuelve 100K, flaguea la inconsistencia — no promedia.
2. **Núcleo Reciclean inviolable.** Terminología Ley REP (GENERADOR / VALORIZADOR / COMERCIANTE PEQUEÑO / DONANTE / GESTOR), fronteras de autoridad (Dusan firma, Andrea aprueba, Pablo despliega, Dyana cierra, Cony liquida), palabras prohibidas (`gratis`, `el mejor precio`, `garantizado`), Pto Montt nunca como sucursal activa.
3. **Tono adaptado, identidad única.** Andrea recibe a un Diego cálido y conversacional. Dusan recibe a un Diego que va al hueso en 3 líneas. Dyana recibe a un Diego formal con citas a tabla y migración. **Mismo cerebro, voces distintas** — es lo opuesto a "un chatbot genérico para todos".

---

## 2 · Las 6 dimensiones — resumen ejecutivo

Cada doc detallado vive en `reciclean-sistema/public/DIEGO-ESTANDAR-<DIMENSION>.md`. Acá un párrafo por dimensión, los hallazgos top + los archivos.

### 2.1 Comunicación · `DIEGO-ESTANDAR-COMUNICACION.md` (620 líneas, 20 fuentes)

El estándar 2026 es chatbots con **memoria inter-sesión persistente** (Intercom Fin 3, Claude Memory, ChatGPT Memory), **detección de tono emocional** (Hume EVI 3 / OpenAI Moderation), **adaptación de personalidad** al interlocutor (custom instructions per-user, perfiles DiSC), **proactividad** (Microsoft Copilot suggestions, Cursor Tab, Glean Assistant), **comunicación no verbal calibrada** (longitud según consulta, emojis funcionales no decorativos) y **multicanalidad** (WhatsApp + email + voz + panel, manteniendo contexto). Diego v6 hoy es single-channel (FAB web), single-tone (todos reciben lo mismo), single-shot (no recuerda nada entre sesiones). El salto principal está en el prompt, no en la infraestructura.

### 2.2 Razonamiento · `DIEGO-ESTANDAR-RAZONAMIENTO.md` (658 líneas, 14 fuentes)

El estándar 2026 es **razonamiento multi-paso** (Anthropic extended thinking, OpenAI o1/o3, DeepSeek R1), **negociación asistida** (Pactum, Cresta, Salesforce Einstein Negotiation con ZOPA/BATNA/anclas), **detección de inconsistencias entre fuentes** (Monte Carlo, Bigeye, Anomalo), **simulación de escenarios what-if** (Pigment, Causal.app, Anaplan AI), **priorización dinámica por impacto** (RICE-A, ICE), **toma de decisiones con explicación transparente** (Constitutional AI, process supervision). Diego v6 es single-shot (Action → respuesta), no negocia, no detecta inconsistencias, no simula. La negociación real es la pieza más cara — pero rationale estructurado + ZOPA en config_ui es viable HOY.

### 2.3 Acompañamiento · `DIEGO-ESTANDAR-ACOMPANAMIENTO.md` (715 líneas, 42 fuentes)

El estándar 2026 es **coaching situacional** (Khanmigo, Replika, Pi by Inflection — GROW model + Hersey-Blanchard), **recordatorios calibrados al contexto** (Motion, Reclaim, Sunsama, Viva Insights — heurísticas de timing para evitar notification fatigue), **celebración auténtica de logros** (Duolingo streaks, Strava kudos, Lattice Praise — variable reward + self-determination theory), **detección de sobrecarga** (Microsoft Viva, Headspace Work — señales: horas, overdue, sentiment), **guía paso-a-paso** (Glean, Cursor agent, Devin), **personalización per-user** (Claude projects, RLHF light). **Hallazgo regulatorio crítico**: Ley 19628 + Ley 21719 Chile + proyecto Ley IA exigen declaración "soy IA" + consentimiento de memoria editable + opt-out total. **No tenerlo es riesgo legal a 7 meses vista.**

### 2.4 Monitoreo · `DIEGO-ESTANDAR-MONITOREO.md` (821 líneas, 16 fuentes)

El estándar 2026 es **KPIs en tiempo real** (Datadog Watchdog AI, New Relic AI, Grafana Beyla — token cost por request, latencia OpenAI, hit rate de tools, fallback rate, escalation rate), **alertas predictivas** (Anodot, Bigeye, AWS Lookout — ML-based anomaly), **dashboards personalizados por persona** (Looker AI, Tableau Pulse, Hex magic), **auditoría de procesos** (process mining: Celonis, IBM), **detección de anomalías con sugerencia de acción** (Monte Carlo data observability), **reportes automáticos NLG** (Glean Briefings, Microsoft Copilot Daily Briefing). Diego v6 graba TODO en `curated.diego_audit_log` pero NADIE LO MIRA — no hay dashboard, no hay alertas, no hay costo USD calculado. **Recomendación del agente SRE**: stack económico (Supabase + Chart.js + EF cron, USD 30-50/mes) en vez de Datadog enterprise hasta superar 30 personas o 100K requests/mes.

### 2.5 Metas · `DIEGO-ESTANDAR-METAS.md` (532 líneas, 16 fuentes)

El estándar 2026 es **descomposición OKR real** (Doerr, Lattice, 15Five, Quantive — objetivo → KRs medibles → tareas con dueño y criterio), **asignación inteligente skill-based** (Salesforce Einstein Routing, ServiceNow AI), **EVM con alertas de desvío** (Atlassian Atlas, Smartsheet — SPI/CPI), **celebración calibrada de hitos** (Lattice Praise, 15Five Wins — específico + privado + opt-in publicación), **re-planificación dinámica** (Cognition Devin DAG + fallback hierarchy, Monte Carlo simulation), **cascading metas individuales → empresa → estrategia** (Workboard, Quantive — strategy maps Kaplan-Norton). Diego v6 registra tareas como agendamiento simple, no conecta a OKRs, todo va al solicitante. **Pregunta bloqueante para Dusan** (la levanta el agente PM): cuáles son los 3-5 KRs corporativos prioritarios que Diego debe trackear. Sin esa decisión, los quick-wins de esta dimensión no se ejecutan bien.

### 2.6 Integración · `DIEGO-ESTANDAR-INTEGRACION.md` (693 líneas, 22 fuentes)

El estándar 2026 es **MCP servers descubribles en runtime** (Anthropic Model Context Protocol spec 2025-11-25, ya en Claude Desktop / Cursor / Composio / Pipedream / n8n), **API unificada con event-driven sync** (Kong AI Gateway, Hookdeck, Inngest), **Single Source of Truth por dominio** (data mesh, lakehouse, Reverse ETL Hightouch/Census), **sincronización bidireccional con CRDTs** (Supabase Realtime PG17, ElectricSQL, Replicache), **plugins versionados con capability negotiation** (MCP `tools/list`, GPT Actions, Composio toolkits), **observabilidad cross-service** (OpenTelemetry GenAI v1.37+). Diego v6 tiene 7 tools hard-coded en 659 líneas TS (vs MCP server con tools/list runtime), 0 sync event-driven (solo request-response), 0 OAuth para Gmail/Monday/Calendar/WhatsApp (todas pendientes P1.5/P1.6/P1.7). Tres brechas estructurales — pero el catálogo declarativo en `panel.config_ui.integraciones_v1` se puede hacer YA sin Pablo y Diego empieza a responder con honestidad qué puede y qué no.

---

## 3 · Matriz Top 20 brechas consolidadas

Priorizadas por **impacto × facilidad de implementación**. ⭐ = quick-win sin Pablo (1-2 días, solo prompt + `panel.config_ui`). 🔧 = requiere Pablo.

### Crítica (regulatoria + riesgo legal)

| # | Brecha | Origen | Severidad | Esfuerzo | Quien |
|---|---|---|---|---|---|
| 1 | ⚠️ Sin declaración "soy IA" + consentimiento Ley 19628/21719 | A3 #9 | **REGULATORIA** | 2-4h | ⭐ Dusan |

**Justificación priorización #1**: el riesgo legal es asimétrico — incumplir cuesta multas + reputación, cumplir cuesta 2-4 horas de HTML + un párrafo en el prompt. Cero motivo para no resolverlo HOY.

### Alta (impacto grande, esfuerzo bajo, sin Pablo)

| # | Brecha | Origen | Severidad | Esfuerzo | Quien |
|---|---|---|---|---|---|
| 2 | No adapta personalidad / tono al interlocutor (todos reciben mismo Diego) | A1 #3 + A3 #1 | Alta | 4-8h | ⭐ Dusan |
| 3 | No da "línea de impacto" — toda respuesta debería cerrar con cadena tarea → KR → objetivo → Plan 2026 | A5 #2 | Alta | 4h | ⭐ Dusan (bloquea: definir 3-5 KRs) |
| 4 | No expone razonamiento en acciones críticas (write, contracto, precio) | A2 #4 | Alta | 3-5h | ⭐ Dusan |
| 5 | Núcleo Reciclean inviolable — robustecer terminología REP + fronteras de autoridad + palabras prohibidas | A1 #QW-5 | Alta | 2-3h | ⭐ Dusan |
| 6 | Patrón O→E→H→A en respuestas a métricas fuera de rango | A4 #12.4 | Alta | 1-2h | ⭐ Dusan |
| 7 | Detección emocional + escalación verbal (sin Moderation API, en prompt) | A1 #2 | Alta | 3-5h | ⭐ Dusan |
| 8 | Catálogo declarativo de integraciones + Single Source of Truth en `panel.config_ui` | A6 #QW-1+2 | Media-Alta | 2-3h | ⭐ Dusan |

### Alta (necesita Pablo, alto impacto)

| # | Brecha | Origen | Severidad | Esfuerzo | Quien |
|---|---|---|---|---|---|
| 9 | Sin dashboard que consuma `diego_audit_log` (latencia, costo USD, tool hit rate) | A4 #11.1 | Alta | 1 día | 🔧 Pablo |
| 10 | Sin cálculo costo USD/request (tabla `panel.openai_pricing_v1` + columna virtual) | A4 #11.2 | Alta | 0.5 día | 🔧 Pablo |
| 11 | Sin memoria inter-sesión por usuario (`panel.diego_memoria_usuario` + pgvector real) | A1 #1 | Alta | 1-2 sem | 🔧 Pablo |
| 12 | `daily-digest` v2 ACTIVE pero sin cableo a destinatarios | A4 #11.4 | Alta | 0.5 día | 🔧 Pablo |
| 13 | Sin alertas (burn-rate / spike costo / tool error / latency p95) — 8 runbooks definidos en MONITOREO §13 | A4 #11.3 | Alta | 1 día | 🔧 Pablo |
| 14 | `agendar_compromiso` crea tareas pero no avisa cuándo vencen | A3 #3 | Alta | 1 día | 🔧 Pablo |
| 15 | Morning digest 08:30 personalizado por persona | A3 #2 + A4 #12.3 | Alta | 1-2 días | 🔧 Pablo (cron) |
| 16 | BUG-FAB-001 — FAB depende `rf_session`, ignora sesión Supabase canonical | Detectado en E2E test | Alta | 15 min | 🔧 Pablo |

### Media (estructural, mediano plazo)

| # | Brecha | Origen | Severidad | Esfuerzo | Quien |
|---|---|---|---|---|---|
| 17 | No detecta inconsistencias entre fuentes (Supabase vs SII vs WhatsApp) | A2 #1 | Alta | 1-2 sem | 🔧 Pablo |
| 18 | No conoce objetivos Plan 2026 ni cascadea KRs → tareas | A5 #1 | Alta | 1-2 sem | 🔧 Pablo + Dusan |
| 19 | Tools hard-coded en EF (659 líneas TS) vs MCP servers descubribles | A6 #1 | Alta | 3-4 sem | 🔧 Pablo |
| 20 | Sin canal WhatsApp / Email / Voz desde Diego v6 — solo FAB web | A1 #7 | Alta | 1-3 meses | 🔧 Pablo + Dusan |

---

## 4 · Plan de evolución por fases

### F0 — Esta semana (sin Pablo, solo prompt + `panel.config_ui`)

Objetivo: cerrar **8 quick-wins** que solo modifican `DIEGO-PROMPT-MAXIMO.md` y agregan keys a `panel.config_ui`. Sin tocar EF, sin DDL, sin frontend. Estimación total: ~25-30 horas de trabajo de Dusan (no del equipo).

| # | Quick-win | Brecha que cierra | Esfuerzo | Bloqueante |
|---|---|---|---|---|
| F0.1 | ⚠️ Declaración IA + consentimiento + opt-out (HTML+prompt) | #1 | 2-4h | — |
| F0.2 | Personas Diego en `panel.config_ui.diego.personas` (6 perfiles DiSC) | #2 | 4-8h | UX revisa wording por persona |
| F0.3 | Núcleo Reciclean inviolable (terminología REP + autoridades + palabras prohibidas) | #5 | 2-3h | — |
| F0.4 | Línea de impacto en toda respuesta accionable (cadena tarea→KR→Plan 2026) | #3 | 4h | **Definir 3-5 KRs corporativos prioritarios** |
| F0.5 | Rationale estructurado en acciones write (3 razones + 1 alternativa + confianza %) | #4 | 3-5h | — |
| F0.6 | Patrón O→E→H→A para métricas fuera de rango | #6 | 1-2h | — |
| F0.7 | Detección emocional + escalación verbal (NEUTRO/URGENTE/FRUSTRADO/SOBRECARGADO/SATISFECHO) | #7 | 3-5h | — |
| F0.8 | Catálogo declarativo de integraciones + SoT por dominio en `panel.config_ui` | #8 | 2-3h | — |

**Salida de F0:** Diego habla con la voz de cada persona, declara que es IA, ofrece consentimiento, cierra cada respuesta con impacto al Plan 2026, explica su razonamiento en decisiones de plata, detecta tono y escala cuando hay frustración. Sin gastar un peso ni esperar a Pablo.

### F1 — 2-4 semanas (Pablo: EF + nuevas tools + RPCs)

Objetivo: cerrar brechas que requieren backend pero que tienen ROI inmediato.

| # | Spec | Brecha | Esfuerzo Pablo |
|---|---|---|---|
| F1.1 | Fix BUG-FAB-001 (`getUserEmail()` async + fallback `sb.auth.getSession()`) | #16 | 15 min |
| F1.2 | Tabla `panel.openai_pricing_v1` + cálculo USD/request en query | #10 | 0.5 día |
| F1.3 | Tab Diego dashboard sobre `diego_audit_log` (6 KPI cards + 3 charts + tabla detalle) | #9 | 4-6h |
| F1.4 | Cableo `daily-digest` v2 a destinatarios + `panel.diego_briefings` | #12 | 0.5 día |
| F1.5 | Morning digest personalizado por persona (cron + EF + prompt) | #15 | 1-2 días |
| F1.6 | 4 alertas SRE base (burn-rate, spike costo, tool error, latency p95) | #13 | 1 día |
| F1.7 | `agendar_compromiso` con reminders pre-vencimiento + escalation | #14 | 1 día |
| F1.8 | Vistas `v_diego_tareas_desviadas` + `v_diego_tareas_sin_update` + prompt rule | implícito | 5h |

**Salida de F1:** dashboard real con costo USD, alertas que dispara la única persona que las puede atender (Pablo) antes de que rompa, briefing matinal en cada panel a las 08:30 personalizado, compromisos que avisan antes de vencer. Costo OPEX: USD 30-50/mes (Supabase tier) + USD 1-3/día en OpenAI con 5-10 personas activas.

### F2 — 1-3 meses (Pablo + Plan 2026 + integraciones externas)

Objetivo: brechas estructurales que abren caminos nuevos.

- **F2.1** Memoria inter-sesión real con pgvector — tabla `panel.diego_memoria_usuario` + retrieve híbrido (semántico + reciente) — cierra brecha #11.
- **F2.2** OAuth Gmail (P1.5 pendiente) + Monday workspace + Google Calendar.
- **F2.3** n8n workflow Diego-Envios-Entregables (P1.6 pendiente).
- **F2.4** Canal WhatsApp Diego v6 — unificar `dieguito-whatsapp` (EF separada actual) con `diego-chat-process` compartiendo memoria.
- **F2.5** Migración de 7 tools hard-coded a MCP servers descubribles — cierra brecha #19, prepara para Plan 2026 SaaS.
- **F2.6** LLM-as-a-Judge para evaluación post-respuesta — Langfuse o EF custom — feedback loop de calidad.

**Salida de F2:** Diego deja de ser FAB-only, recuerda lo que importa por persona, agenda en Calendar real, manda mail por Gmail, manda WhatsApp con el mismo contexto que la conversación del panel, y se auto-evalúa cada turno.

### F3 — 3-6 meses (equipo + Cony + Plan 2026)

Objetivo: brechas profundas que cambian la categoría del producto.

- **F3.1** Coaching situacional (GROW + Hersey-Blanchard) — postura conversacional adaptativa.
- **F3.2** Aprendizaje del estilo personal (RLHF light per-user vía in-context learning + ajuste de personas Diego).
- **F3.3** Negociación con ZOPA/BATNA real + historial por cliente + memoria negociadora.
- **F3.4** Simulación de escenarios (causal inference + counterfactual reasoning).
- **F3.5** Re-planificación dinámica con DAG + fallback hierarchy (estilo Devin / Cursor Composer).
- **F3.6** Detección de sobrecarga (Supabase + sentiment + calendario + horas trabajadas).
- **F3.7** Cascading OKR completo (Plan 2026 → metas anuales → trimestre → tarea individual con line-of-sight visible).
- **F3.8** Multi-canal con voice (Whisper input + TTS output) para Andrea en campo.

**Salida de F3:** Diego es un copiloto al nivel de Glean Assistant 3.0 + Intercom Fin 3 + Cognition Devin para el ecosistema Reciclean, pero con el conocimiento de dominio que ninguno de esos tiene.

---

## 5 · Métricas de éxito (baseline + target 90 días)

Ningún producto se mejora si no se mide. Estos son los 12 KPIs que dictan si Diego está avanzando.

| # | KPI | Baseline 23-may-2026 | Target 90 días | Fuente |
|---|---|---|---|---|
| 1 | Mensajes/día (volumen) | ~5-10 (PC tests) | >100 | `diego_audit_log` |
| 2 | Usuarios activos / semana | 1-2 | 5-6 (todo equipo: Dusan/Pablo/Andrea/Cony/Dyana) | `distinct user_email` en `diego_audit_log` |
| 3 | Tool hit rate (% requests que invocan ≥1 tool) | sin medir | >85% | `diego_audit_log` |
| 4 | Fallback rate (% sin tool donde sí debería) | sin medir | <15% | `diego_audit_log` |
| 5 | Latencia p95 | sin medir | <8s | `diego_audit_log` |
| 6 | Costo USD / mensaje | sin medir (no hay cálculo) | <$0.005 | F1.2 cierra esto |
| 7 | Costo USD / día | sin medir | <$5/día con 5-6 usuarios activos | F1.2 |
| 8 | Tareas creadas vía Diego en `panel.diego_tareas` | 0 (recién deployed) | >30/semana | tabla directa |
| 9 | NPS interno Diego (encuesta mensual 1-10) | sin baseline | >7 | encuesta mensual |
| 10 | Acuses positivos (cuántos del equipo declaran preferirlo a Slack/WhatsApp para X tarea) | sin baseline | 4/5 personas | encuesta mensual |
| 11 | Brechas regulatorias activas | 1 (Ley 19628 sin declaración IA) | 0 | check F0.1 cerrado |
| 12 | Quick-wins F0 implementados | 0/8 | 8/8 | check en prompt |

**Cadencia de medición:**
- **Diaria** (automática): KPIs 1-7 vía dashboard Tab Diego (F1.3).
- **Semanal** (auto + manual): KPI 8 vía dashboard, KPI 12 vía Dusan.
- **Mensual** (encuesta): KPIs 9-10. KPI 11 sigue activo hasta cerrar F0.1.

---

## 6 · BANDEJA PABLO — specs accionables

Esta es la lista de tickets para PC Pablo. Cada uno tiene QUÉ, PORQUÉ, ESFUERZO, DEPENDENCIAS, ACEPTACIÓN. Listo para pegar en su `COLA-TAREAS.md § Altas` o convertir a ítem de cola Supabase `mayordomo.cola_construccion`.

### Spec 1 — Fix BUG-FAB-001 (15 min) · prioridad crítica

- **Qué**: modificar `getUserEmail()` en `reciclean-sistema/public/panel-rdo.html` L7415-7420 para hacer fallback a `sb.auth.getSession()` cuando `localStorage.rf_session` está vacío.
- **Cómo**: opción B (async fallback) documentada en `mayordomo/BLOQUEOS.md § BUG-FAB-001`. Agregar `await` en caller `callDiego()` L7498.
- **Por qué**: FAB Diego falla con "❌ No hay sesión" cada vez que un usuario abre el panel con sesión Supabase persistida sin pasar por el form de login (escenario común al cerrar y reabrir browser). Afecta a Andrea/Cony/Dyana en uso diario.
- **Esfuerzo**: 15 min.
- **Dependencias**: ninguna.
- **Aceptación**: tests A (login form) + B (sesión persistida) + C (sesión expirada) en `mayordomo/BLOQUEOS.md`.

### Spec 2 — Cálculo costo USD por request (2-4 horas)

- **Qué**: agregar JSON `openai_pricing_v1` a `panel.config_ui` con precios input/output por modelo (gpt-4o-mini, gpt-4o, claude-sonnet-4-6, claude-opus-4-7). Calcular `cost_usd` inline en queries sobre `diego_audit_log`.
- **Cómo**: INSERT en `panel.config_ui` + columna virtual en consultas: `(input_tokens × price_in / 1e6) + (output_tokens × price_out / 1e6)`. Sin DDL nueva.
- **Por qué**: Diego cobra a Reciclean cada mensaje y nadie lo sabe. Sin esto no hay alerting de spike de costo (Spec 6).
- **Esfuerzo**: 2-4 horas.
- **Dependencias**: ninguna.
- **Aceptación**: query `SELECT date, sum(cost_usd) FROM diego_audit_log GROUP BY 1` devuelve serie diaria con precios actualizados.

### Spec 3 — Tab Diego dashboard (4-6 horas)

- **Qué**: nueva tab `📊 Diego` en `panel-rdo.html` (insertar entre `📥 Bandeja Diego` y `⚙️ Admin`).
- **Contenido**:
  - **6 KPI cards**: requests/día · costo USD/día · latencia p95 · tool hit rate · fallback rate · usuarios activos hoy.
  - **3 charts**: serie temporal 14 días (líneas múltiples: requests + costo + latencia + errores).
  - **Tabla bottom**: últimos 20 requests con `user`, `tool`, `latency_ms`, `status`, link a detalle.
- **Cómo**: SQL puro contra `diego_audit_log`. Chart.js con `visual_standard_v1` (donut 65%, sin grid vertical). Cero infra nueva.
- **Por qué**: los datos están grabándose pero nadie los mira. Sin esto no se puede gestionar Diego.
- **Esfuerzo**: 4-6h.
- **Dependencias**: Spec 2 (para mostrar costo USD).
- **Aceptación**: tab visible, KPIs cargan en <3s, charts responden a filtro de período.

### Spec 4 — `daily-digest` cableo + destinatarios (0.5-1 día)

- **Qué**: la EF `daily-digest` v2 está ACTIVE pero no tiene destinatarios. Cablear contra `panel.config_ui.daily_digest_destinatarios_v1` (JSON con `[{usuario, canal:'panel|email|whatsapp', preferencias}]`).
- **Cómo**: cron Supabase 06:00 CLT → llama `daily-digest` → genera resumen por persona → escribe en `panel.diego_briefings` + dispara `dieguito-whatsapp` o email según canal.
- **Por qué**: brecha #12, prepara terreno para Spec 5.
- **Esfuerzo**: 0.5-1 día.
- **Dependencias**: ninguna (la EF ya existe).
- **Aceptación**: el viernes 30-may a las 06:00 CLT, cada destinatario recibe su digest. `panel.diego_briefings` tiene filas. Logs EF OK.

### Spec 5 — Morning digest personalizado en FAB (1-2 días)

- **Qué**: al primer mensaje del día de cada usuario en el FAB, Diego responde proactivamente con: "Hola [nombre], desde tu última sesión: [N eventos relevantes en tu área]. Top 3 pendientes. 1 anomalía detectada en tus KPIs."
- **Cómo**: detección de gap temporal (>8h sin mensaje) en `callDiego()` → invocar `consultar_alertas_activas` + `resumen_facturacion_mes` antes de procesar el mensaje del usuario.
- **Por qué**: brechas #7 (proactividad) y #15 (morning digest). Aprovecha tools que ya existen, no requiere nuevas.
- **Esfuerzo**: 1-2 días.
- **Dependencias**: Spec 4 (para que el digest tenga consistencia con email/WhatsApp).
- **Aceptación**: cada persona del equipo recibe saludo proactivo al primer login del día. Andrea ve cobros + facturación. Dusan ve decisiones pendientes. Dyana ve tareas contables del período.

### Spec 6 — 4 alertas SRE base (1 día)

- **Qué**: implementar 4 de los 8 runbooks definidos en `DIEGO-ESTANDAR-MONITOREO § 13`:
  - **RB-01** Latency p95 > 8s durante 10 min
  - **RB-02** Spike costo > 3× rolling avg
  - **RB-03** Tool error rate > 30%
  - **RB-05** Fallback rate > 20%
- **Cómo**: cron Supabase 1/min → query métrica → si dispara alerta → INSERT en `mayordomo.alertas` + notificación WhatsApp a Pablo (severidad ALTA también a Dusan).
- **Por qué**: brecha #13. Diego se va a romper en algún momento — sin alertas, nos enteramos cuando el equipo se queja.
- **Esfuerzo**: 1 día.
- **Dependencias**: Spec 2 (necesita costo USD para RB-02).
- **Aceptación**: alerta de prueba (forzar p95 > 8s en staging) dispara WhatsApp a Pablo en <2 min. Cada alerta lleva runbook link.

### Spec 7 — Reminders pre-vencimiento en `agendar_compromiso` (1 día)

- **Qué**: hoy `agendar_compromiso` crea filas en `panel.diego_tareas` pero no avisa cuando se acercan al vencimiento.
- **Cómo**: cron Supabase 4/día → query `panel.diego_tareas WHERE fecha_limite BETWEEN now() AND now() + 24h AND aviso_24h_enviado = false` → llama EF que dispara WhatsApp / email / mensaje en FAB (según canal preferido del usuario en `diego.personas`) → UPDATE `aviso_24h_enviado = true`.
- **Por qué**: brecha #14. Agendar sin avisar no sirve.
- **Esfuerzo**: 1 día.
- **Dependencias**: F0.2 (personas Diego para saber canal preferido por usuario).
- **Aceptación**: tarea con `fecha_limite = mañana 10:00` dispara recordatorio al usuario hoy 10:00.

---

## 7 · Decisiones que necesita Dusan (preguntas abiertas)

Estas son las decisiones que bloquean ejecución de F0/F1 y necesitan firma o input de Dusan:

| # | Decisión | Bloquea | Comentario |
|---|---|---|---|
| Q1 | ¿Cuáles son los 3-5 KRs corporativos prioritarios que Diego va a trackear primero? | F0.4 + Spec 5 | Levantada por agente PM (A5). Sin esto la "línea de impacto" es genérica. |
| Q2 | Tono y canal de declaración IA (F0.1) | F0.1 | ¿Pop-up modal al primer login? ¿Mensaje en primer chat? ¿Banner siempre visible? |
| Q3 | Roadmap WhatsApp vs FAB-only (¿F2.4 ahora o en 6 meses?) | F2.4 | Dieguito-whatsapp ya existe separado. Unificar = decisión de arquitectura. |
| Q4 | ¿Wording de las 6 personas Diego? | F0.2 | El template lo armó el agente UX (A3 QW-1), Dusan revisa wording por persona antes de aplicar. |
| Q5 | Política de envío de morning digest (cuál canal por persona) | F1.5 + Spec 5 | Andrea = WhatsApp, Dyana = email, Cony = panel — confirmar. |

---

## 8 · Honestidad técnica y lo que NO está cubierto

Cosas que este consolidado **no resuelve** y que conviene tener claras:

1. **No verifiqué E2E en producción que los 7 tools de Diego funcionen bien con cada modelo, cada idioma, cada caso edge.** Las brechas se basan en lectura del prompt + EF + lo que reportaron los agentes.
2. **Los KPIs baseline son estimados.** Una vez F1.2 + F1.3 estén productivos (Tab Diego con costo USD), recalibrar baseline real con 30 días de data.
3. **Negociación real con LLMs (brecha #17 + agente A2)** es área activa de investigación 2025-2026. Lo que Diego puede hacer HOY (ZOPA/BATNA en config_ui + sugerir contraofertas) es nivel 1. Niveles 2-3 requieren research.
4. **Memoria semántica con pgvector (brecha #11)** está placeholder en `mig 050` pero no implementada. Decidir entre: pgvector + retrieve manual vs. servicio dedicado (Pinecone/Weaviate) vs. Claude memory tool nativo — depende de presupuesto.
5. **El bug BUG-FAB-001 (brecha #16) lo descubrí en sesión.** Lo registré en `BLOQUEOS.md` con fix opción B. Pablo decide si aplica esta semana o el mes que viene.
6. **Cumplimiento Ley 19628/21719 (brecha #1)** lo levantó el agente UX (A3) revisando IAPP Chile + BCN. Antes de aplicar F0.1, conviene chequear con asesor legal del grupo que el wording exacto cumpla con la última versión vigente del proyecto Ley IA.
7. **Multi-canal WhatsApp/email/voz (brecha #20)** depende de Plan 2026 estratégico — no es solo técnico, define el contrato de privacidad con el equipo.

---

## 9 · Cierre ejecutivo

**Si esta semana Dusan firma 5 quick-wins de F0**, Diego pasa de "chatbot funcional" a "copiloto que parece de élite" para los 6 usuarios del equipo. Costo: tiempo de Dusan + UX revisando wording.

**Si en 2-4 semanas Pablo cierra las 7 specs de F1**, Diego tiene dashboard de gestión, costo medible, alertas, briefing matinal, compromisos que avisan. Costo: ~5-7 días de Pablo + USD 30-50/mes infra adicional.

**Si en 3 meses se cierra F2**, Diego es multi-canal real, recuerda contextos por persona, conecta con Gmail/Monday/Calendar. Costo: ~20-30 días Pablo + decisiones estratégicas Dusan.

**El plan completo F0→F3 lleva 6 meses bien planteados.** No es una refundición — es la evolución natural del Diego v6 actual hacia el estándar mundial 2026 documentado en los 6 archivos detallados.

**La prioridad #1 es F0.1** (declaración IA + consentimiento). Lo demás se puede esperar. Eso no.

---

## Apéndice — Mapa de los 8 documentos generados

| Archivo | Líneas | Fuentes | Tema |
|---|---:|---:|---|
| `DIEGO-ESTANDAR-COMUNICACION.md` | 620 | 20 | Memoria + tono + multicanal + proactividad |
| `DIEGO-ESTANDAR-RAZONAMIENTO.md` | 658 | 14 | CoT + negociación + simulación + XAI |
| `DIEGO-ESTANDAR-ACOMPANAMIENTO.md` | 715 | 42 | Coaching + recordatorios + celebración + regulatorio |
| `DIEGO-ESTANDAR-MONITOREO.md` | 821 | 16 | KPIs RT + alertas + runbooks + dashboards |
| `DIEGO-ESTANDAR-METAS.md` | 532 | 16 | OKR cascading + skill routing + EVM |
| `DIEGO-ESTANDAR-INTEGRACION.md` | 693 | 22 | MCP + SoT + event-driven + plugins |
| `DIEGO-ESTANDAR-MAXIMO.md` (este) | ~580 | — | Consolidado + plan F0-F3 + métricas + BANDEJA PABLO |
| `INFORME-EJECUTIVO-VISUAL.md` | 228 | — | Pautas visuales + reglas operativas grabadas a fuego |
| **TOTAL** | **~4847** | **~130 fuentes 2025-2026** | — |

---

**Generado por PC Dusan el 2026-05-23. Branch:** `feature/diego-estandar-maximo` en `reciclean-sistema`. **Estado:** consolidado v1.0, listo para revisión Dusan y firma de F0 quick-wins. No mergeado a main todavía (regla CLAUDE.md PC Dusan: NO firma PRs a main sin OK explícito).
