# DIEGO — Estándar Mundial 2026 de Monitoreo y Registro para Chatbot Empresarial

> **Agente SRE · Investigación de estándares 2026 aplicada a Diego v6**
> **Stack vivo referencia:** Diego v6 · `diego-chat-process` v4 ACTIVE · Supabase `eknmtsrtfkzroxnovfqn` · `panel-rdo.html` FAB (PR #57 mergeado 23-may-2026) · 7 tools whitelist · `curated.diego_audit_log` (mig 050) · `daily-digest` v2 ACTIVE pendiente de cableo · `DIEGO-PROMPT-MAXIMO.md` (602 líneas).
> **Fecha:** 2026-05-23
> **Objetivo:** Mapa exhaustivo de las prácticas, plataformas y patrones 2025-2026 que un copiloto empresarial debe cumplir en monitoreo, observabilidad, alertas predictivas, dashboards personalizados, auditoría de proceso y reporting automático. Cierra con brechas concretas vs Diego v6 y quick-wins implementables sin Pablo.

Convenciones de prioridad: **ALTA** (bloquea operación o impacto >20% sobre el equipo) · **MEDIA** (mejora calidad) · **BAJA** (nice-to-have).
Estado en v6: ✅ cubierto · 🟡 parcial · ❌ no existe · ❓ pendiente verificación con Pablo.
Cuando no hay baseline medido en `curated.diego_audit_log`, se declara **"baseline desconocido, asumir 0"** explícitamente. Si no se mide, no se mejora.

---

## 0. Filosofía SRE aplicada a un copiloto interno

Un chatbot empresarial en 2026 no es "una integración con un LLM". Es un sistema distribuido con tres dependencias críticas que un SRE clásico no monitorea: **el proveedor del modelo (OpenAI/Anthropic), el costo por petición (que varía con la longitud del prompt), y la calidad semántica de la respuesta (que no se mide con HTTP 200)**. Por eso el conjunto de Golden Signals tradicional —latencia, tráfico, errores, saturación— se amplía con **Token Cost, Tool Hit Rate, Hallucination Rate, Escalation Rate y Time-to-Resolution**.

La regla operativa: **toda métrica que no esté cableada a un SLO, a un dashboard y a una alerta es ruido**. Si Diego registra el evento en `diego_audit_log` pero nadie lo mira, no existe. El presente documento ordena las áreas que faltan cablear y propone un orden de ataque pragmático para un equipo de 14 personas y 3 sucursales.

### 0.1 SLOs propuestos para Diego v6 (línea base)

| SLO | SLI | Objetivo | Ventana | Comentario |
|---|---|---|---|---|
| Disponibilidad EF | `count(status<500)/count(total)` sobre `diego_audit_log` | 99.5% | 30 d | Diego es interno; 99.5% basta. |
| Latencia respuesta | `count(latency_ms < 4000)/count(total)` | 95% | 30 d | OpenAI gpt-4o ronda 1-3 s en buen día. |
| Tool execution success | `count(tool_status='ok')/count(tools_invoked)` | 98% | 7 d | Falla típica: timeout PG o RLS. |
| Costo por usuario activo/mes | `sum(cost_usd) / distinct(user)` | < USD 5 | mes | 14 personas × 5 = USD 70/mes techo. |
| Escalation rate (fallback a humano) | `count(escalado)/count(total)` | < 5% | 7 d | Si Diego no resuelve, Andrea responde. |

Todos los objetivos asumen `baseline desconocido, asumir 0` salvo medición real con `SELECT … FROM curated.diego_audit_log WHERE created_at > now() - interval '30 days'`.

---

## 1. Tracking de KPIs en Tiempo Real

El estándar 2026 es **streaming de métricas con cardinalidad alta** —cada request etiquetado con `user_id`, `tool_name`, `model`, `tenant`, `prompt_hash`— y dashboards que se refrescan vía SSE o WebSockets en < 5 segundos. La métrica clave que cambió en 2025 es que **el costo (USD) es un Golden Signal de primera clase, igual que latencia o errores**.

### 1.1 OpenTelemetry GenAI: el lingua franca 2026

OpenTelemetry consolidó en 2025-2026 la convención `gen_ai.*` para spans de LLM. Atributos canónicos:

- `gen_ai.request.model` — modelo invocado (`gpt-4o`, `claude-sonnet-4-7`).
- `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens` — base para cálculo de costo.
- `gen_ai.response.finish_reasons` — `stop`, `tool_use`, `length`, `content_filter`.
- `gen_ai.operation.name` — `chat`, `embeddings`, `text_completion`.
- `gen_ai.tool.name` / `gen_ai.tool.call.id` — para correlacionar invocación-resultado.

Según OpenTelemetry, "as of March 2026, most GenAI semantic conventions are in experimental status… Datadog beginning native support in OTel v1.37 and Grafana also starting to collect LLM traces in Loki". Cualquier instrumentación nueva que se haga sobre Diego debería emitir spans con estos atributos para no quedar atada a un vendor.

### 1.2 Datadog LLM Observability

Datadog calcula el costo de cada request combinando token counts y precios públicos del proveedor; expone Input/Output tokens, cache-read/write tokens, reasoning tokens, y una vista "Most Expensive LLM Calls". Según la doc oficial Datadog: "Datadog automatically calculates the cost of each request based on… token counts attached to the LLM/embedding span [and] the model provider's public pricing rates". Críticamente, Datadog **no documenta alerts nativas sobre spike de costo** —hay que armarlas con monitors clásicos sobre la métrica derivada.

Trade-off conocido: agregar workloads de IA a una cuenta Datadog existente "increased their observability bill by 40-200%". Para una empresa de 14 personas en Chile, eso es prohibitivo. Para Diego, el patrón razonable es **Datadog free tier o autohospedado (Grafana + Tempo + Prometheus) emitiendo OTel a `curated.diego_telemetry`**.

### 1.3 Honeycomb (Intelligence + BubbleUp + Anomaly Detection)

Honeycomb lanzó en septiembre 2025 "Honeycomb Intelligence", suite AI-native con anomaly detection. La doc oficial declara: "Rather than requiring teams to predict what might go wrong and configure alerts accordingly, our system learns your service patterns and proactively notifies you when behavior deviates from normal". Cubre error rate, latency, requests y eventos custom. BubbleUp resalta eventos anómalos y **aísla automáticamente la dimensión que los explica** (`user_id=X`, `tool=consultar_precio_material`, `model=gpt-4o`).

### 1.4 Grafana Beyla + Loki + Tempo

Grafana Beyla provee auto-instrumentación eBPF sin tocar código. Para Diego, la EF Supabase no es trivial de instrumentar con Beyla (corre en Deno isolates), pero **un sidecar Prometheus que scrape un endpoint `/metrics` expuesto por Diego sí es viable**. El stack libre Loki + Tempo + Prometheus es la alternativa razonable para una empresa que no quiere pagar Datadog.

### 1.5 Sentry

Sentry agregó en 2025 trazas de LLM con costos por request y dashboard de drift de calidad. Para Diego, el valor real de Sentry es **capturar excepciones del frontend `panel-rdo.html` FAB** y correlacionarlas con la EF que falló. Sentry SDK pesa ~30 KB gzip, aceptable en el FAB.

### 1.6 Métricas reales a cablear en Diego (priorizadas)

| Métrica | SLI | Origen del dato | Prioridad | Estado v6 |
|---|---|---|---|---|
| Latencia OpenAI p50/p95/p99 | percentile(`latency_ms`) | `diego_audit_log.latency_ms` | ALTA | 🟡 columna existe, sin dashboard |
| Costo USD por request | `(input_tokens·precio_in + output_tokens·precio_out)` | `diego_audit_log.tokens_*` + tabla `panel.openai_pricing` (no existe) | ALTA | ❌ |
| Tool Hit Rate por tool | `count(tool=X, status=ok)/count(tool=X)` | `diego_audit_log.tool_calls` (jsonb) | ALTA | 🟡 dato crudo sí, agregación no |
| Fallback rate (sin tool) | `count(tools_invoked=0 AND scope!='small_talk')/count(total)` | derivado | ALTA | ❌ |
| Escalation rate a humano | `count(escalado=true)/count(total)` | columna inexistente | ALTA | ❌ |
| Time-to-Resolution (TTR) | `created_at_resuelto - created_at_inicial` por hilo | requiere `thread_id` | MEDIA | 🟡 columna existe sin agrupar |
| Hallucination rate (post-hoc) | revisión sample 50 respuestas/semana | manual + LLM-judge | MEDIA | ❌ |
| Cache hit rate de prompts | `cache_read_tokens/input_tokens` | OpenAI usage | ALTA | ❌ |
| Concurrent users activos | distinct `user_id` last 5 min | `diego_audit_log` | BAJA | ❌ |
| Saturación EF | duración + cold starts Supabase | EF logs | MEDIA | 🟡 logs sí, no agregado |

Sin estos datos en un dashboard, Diego es **una caja negra que cobra dólares**.

---

## 2. Alertas Predictivas (antes de que ocurra el problema)

El estándar 2025-2026 dejó atrás los umbrales fijos. Anodot, Bigeye, Monte Carlo y AWS Lookout for Metrics convergieron en **ML-based anomaly detection con baseline aprendido por serie**. Lo nuevo de 2026 es la incorporación de **LLM-mediated anomaly detection** —el LLM no solo detecta, sino que **escribe la explicación causal en lenguaje natural**.

### 2.1 Anodot — captura del incidente antes del impacto

Anodot declara que su detección permite "capture incidents sometimes an hour or two before they actually created a customer experience impact" sobre 100% de la data. El modelo combina detección estadística + correlación entre series. Aplicable a Diego: si el `latency_p95` de la tool `consultar_precio_material` empieza a degradarse 90 minutos antes de que Andrea sufra la latencia, Diego puede avisar.

### 2.2 Bigeye / Monte Carlo / Anomalo — el ecosistema "data observability"

Según el comparativo 2026 de Thinklytics: "Three vendors lead in 2026: Monte Carlo (the incumbent, $340M+ raised), Anomalo (the ML-native challenger), and Bigeye (the SQL-native alternative)". Y el problema honesto: "both tools require 4-8 weeks of tuning before the alerts are signal-to-noise positive". Para Diego, esto significa que **un wrap de anomaly detection sin tunning va a generar fatiga de alertas durante el primer mes y medio**.

### 2.3 Burn-rate alerts multi-ventana (Google SRE)

El patrón canónico de Google SRE Workbook: dos ventanas (short + long) con factor compuesto. Para el SLO de disponibilidad 99.5% sobre 30 días:

| Severidad | Ventana corta | Ventana larga | Factor de quema | Notifica |
|---|---|---|---|---|
| Critical | 5 min | 1 h | 14.4× | despierta a Pablo + WhatsApp |
| Warning | 30 min | 6 h | 6× | mensaje bandeja Diego |
| Info | 6 h | 3 d | 1× | resumen diario `daily-digest` |

Implementable directamente sobre `diego_audit_log` con un cron de 5 min que evalúa cuántos errores hay en cada ventana y compara contra el error budget consumido.

### 2.4 Time-Series con Prophet / NeuralProphet

Para forecasting de KPIs de negocio (cierres semanales, toneladas pesadas), Prophet (Meta, 2017) y NeuralProphet (2020) siguen siendo el baseline. Para series con seasonality fuerte (cierres caen 60% sábado, 0% domingo), Prophet es robusto sin tuning. **Aplicación directa para Diego: forecast del rate de cierres por vendedor → alerta cuando observado < 2σ del forecast.**

### 2.5 Papers académicos 2025-2026 (anomalía con LLMs)

- **Xu, X. et al. (2025). "Can Multimodal LLMs Perform Time Series Anomaly Detection?" arXiv:2502.17812.** Propone el benchmark VisualTimeAnomaly: transforma series numéricas a imágenes y las pasa a MLLMs. Hallazgo: "While open-source MLLMs excel on univariate time series, proprietary MLLMs demonstrate superior effectiveness on multivariate time series". Relevante para Diego: una pregunta como "qué pasó con los cierres esta semana" puede resolverse mostrándole a Claude/GPT un PNG del chart en lugar de la tabla cruda.
- **"CALM: A Framework for Continuous, Adaptive, and LLM-Mediated Anomaly Detection in Time-Series Streams" arXiv:2508.21273 (agosto 2025).** Propone TriP-LLM con frozen pre-trained LLM procesando patch-wise tokens en tres ramas. Para Diego, no es implementable a corto plazo, pero **la idea de usar el LLM como árbitro post-detección sí lo es**: el detector estadístico señala "hay algo raro", Diego escribe "Andrea, tu rate de cierres bajó 30% en 3 días, principalmente en cobre brillante".

### 2.6 Alertas que Diego debería emitir hoy mismo

Sin esperar Anodot ni Honeycomb, sobre `diego_audit_log` se pueden activar:

1. **Spike de costo:** `sum(cost_usd 5m) > 3× rolling_avg(60m)` → notifica Pablo.
2. **Tool down:** `count(tool=X, status=error 15m) / count(tool=X 15m) > 30%` → degradación.
3. **Latency p95 > 8s sostenido 10m** → posible problema OpenAI o EF cold start crónico.
4. **Concurrencia > 12 usuarios** (saturación esperada con 14 personas) → escalar plan Supabase.
5. **Fallback rate > 20% en una hora** → prompt o tools rotos.

---

## 3. Dashboards Personalizados por Persona

El estándar 2026 es **un metric homepage por usuario, no por equipo**. Tableau Pulse, Looker (con Semantic Views), Metabase AI y Hex Magic convergieron en el mismo patrón: el usuario abre la app y ve sus 5-8 KPIs relevantes, sin filtrar nada.

### 3.1 Tableau Pulse

Salesforce documenta Pulse así: "rather than requiring users to navigate dashboards, Pulse proactively delivers personalized metrics directly into daily workflows where teams already collaborate. These insights are sent directly to users in Slack and email digests". El paradigma: **el dashboard va al usuario, no el usuario al dashboard**.

Aplicación a Diego: la pestaña "Mis Métricas" en `panel-rdo.html` debería ser distinta para Andrea (ventas), Cony (operaciones), Dyana (finanzas), Dusan (CEO). Hoy todos ven los mismos 19 tabs.

### 3.2 Looker Semantic Views + Gemini NL Query

Google anunció en Looker Summit 2025: "Semantic Views extend Looker's LookML governance model, allowing metric definitions… to be defined once in the semantic layer and surfaced consistently across every downstream tool that queries them. Additionally, Gemini-powered natural language querying is now available in Looker". El equivalente Reciclean: definir las métricas oficiales una sola vez en `panel.config_ui.metric_definitions` y que Diego las consuma sin re-derivar fórmulas.

### 3.3 Metabase AI / Hex Magic

Metabase AI Embedded (2025) permite "ask in natural language" sobre cualquier modelo definido. Hex Magic genera notebooks completos a partir de una pregunta. Ninguno es necesario para Diego en el corto plazo —Diego ya es la interfaz NL—, pero **el patrón de "una sola definición de KPI compartida por todos los consumidores" es crítico**.

### 3.4 Comparación contra OKR personal

El gap más grande de paneles tradicionales: no contextualizan el número. "37 toneladas pesadas esta semana" es bueno o malo? Depende de la meta. El estándar 2026 (Pulse + Lattice + 15Five) muestra los KPIs **siempre con la meta junto al observado**:

| Persona | KPI | Observado | Meta | Δ |
|---|---|---|---|---|
| Andrea | Cierres semana | 11 | 14 | -21% |
| Cony | Recepciones | 142 | 130 | +9% |
| Dyana | DTEs sin errores | 98.2% | 99% | -0.8 pp |
| Dusan | Margen agregado mes | 7.8% | 8.5% | -0.7 pp |

Hoy Diego puede responder esto si se lo preguntan; debería **mostrarlo proactivamente al login**.

---

## 4. Auditoría Automática de Procesos (Process Mining)

El estándar 2026 es Celonis + IBM Process Mining + ProcessGold. La diferencia con BI tradicional: process mining no analiza KPIs, **analiza la secuencia real de eventos** (event log) y descubre el grafo del proceso tal cual ocurre, no como está documentado.

### 4.1 Celonis Process Intelligence

Celonis declara: "Conformance checking enables comparison of your as-is process to your desired to-be process model for audit, compliance, or monitoring purposes. With insights derived from actual data, process mining allows you to audit, analyze, and improve your existing business processes more effectively and reliably". Y específicamente para Order-to-Cash: "process mining helps Order Management teams discover the root causes of credit holds and slow credit approval processes".

### 4.2 Aplicación a Reciclean: el proceso Cotización → Pesaje → DTE → Cobro

El proceso vivo en Reciclean tiene 7-9 pasos según el caso. Un event log podría construirse a partir de:

| Paso | Tabla origen | Timestamp |
|---|---|---|
| 1. Cotización generada | `curated.cotizaciones_v2` | `created_at` |
| 2. Cotización aceptada | `curated.cotizaciones_v2` | `aceptada_at` (no existe) |
| 3. Recepción agendada | `curated.recepciones` | `programada_at` |
| 4. Material pesado en báscula | `staging.pesajes` | `created_at` |
| 5. Liquidación calculada | `curated.liquidaciones` | `created_at` |
| 6. DTE emitido | `curated.dte_emitidos` | `emitido_at` |
| 7. Pago recibido | `curated.cobros` | `pagado_at` |

Con ese event log, una vista `curated.v_proceso_o2c_eventos` (un row por paso) habilita preguntar: ¿cuántos casos saltaron el paso 2? ¿cuál es la mediana entre paso 4 y 6? ¿qué cliente tiene más rework (loops)? Diego puede responderlo en lenguaje natural.

### 4.3 Conformance checking — el "happy path" como contrato

El proceso ideal es: 1 → 2 → 3 → 4 → 5 → 6 → 7. Cualquier desviación (orden alterado, paso saltado, loop) es un hallazgo de auditoría. Esto **no requiere Celonis** —se puede implementar con SQL window functions sobre la vista de eventos.

### 4.4 Bot-assisted RPA audit

UiPath y Automation Anywhere agregaron en 2025 capacidad de auditar sus propios bots con LLM. Para Reciclean no aplica directamente (no hay RPA), pero **el patrón sí**: Diego debería auditar sus propias acciones —cada `registrar_tarea_cola` que disparó— y reportar "de las 47 tareas que creé esta semana, 41 se cerraron, 4 quedaron en cola > 72h, 2 fueron canceladas por usuario".

---

## 5. Detección de Anomalías y Sugerencia de Acción

La diferencia entre "anomaly detection" (sección 2) y "anomaly explanation" (esta sección): la primera dice **qué cambió**, la segunda **por qué y qué hacer**.

### 5.1 Bigeye Anomaly Detection con root-cause assistant

Bigeye expone todo como metadata SQL-queryable. Su feature 2025 "Difference Detection" no solo detecta —apunta a la dimensión causal. Si las toneladas mensuales caen, Bigeye dice "85% de la caída viene del cliente Pincore, material cobre brillante, sucursal Cerrillos".

### 5.2 Anomalo — el challenger ML-native

Anomalo, según el comparativo Thinklytics 2026, "automates anomaly detection more aggressively and requires less rule configuration". El patrón de uso: 4-8 semanas de aprendizaje, después el ruido baja. Para Diego, esto significa que **la primera versión va a generar falsas alertas y hay que tolerarlo** o filtrar con un meta-clasificador.

### 5.3 Monte Carlo Data Observability

Monte Carlo se ganó la categoría con 5 pilares: freshness, volume, schema, distribution, lineage. Para Reciclean es overkill, pero **el pilar "freshness" sí es crítico**: si `precios_cliente` no se actualiza hace 5 días, Diego está cotizando con datos viejos. Una alerta sobre `max(updated_at) FROM precios_cliente < now() - interval '48 hours'` es trivial y de altísimo valor.

### 5.4 El patrón "qué bajó, por qué bajó, qué hacer"

El estándar 2026 que Pulse, Anodot e incluso ChatGPT Enterprise están adoptando:

```
[Observación]    Tus cierres bajaron 30% esta semana (11 vs media 16).
[Explicación]    El 78% de la caída es de cobre brillante en Cerrillos.
                 Andrea no registró 4 visitas a Pincore esta semana
                 (rango histórico 6-8 visitas/semana).
[Hipótesis]      Pincore podría estar comprando a la competencia
                 (precio competencia +8% según pizarra de la semana).
[Acción]         ¿Quieres que agende una visita y prepare cotización
                 con descuento 3%?
```

Diego v6 tiene los datos para construir esto (tools `consultar_precio_material`, `buscar_cliente`, `agendar_compromiso`), pero **el prompt actual no le pide ejecutar el patrón** O→E→H→A. Es un quick-win de Sección 8.

### 5.5 Causal inference vs correlation

El riesgo del patrón anterior: confundir correlación con causalidad. Diego no tiene capacidad de inferencia causal real (eso requiere DoWhy, EconML o un experimentador). La salvaguarda en el prompt: **siempre presentar la explicación como hipótesis ("podría ser X"), nunca como hecho**. La acción debe ser de verificación, no de cierre automático.

---

## 6. Reportes Automáticos (Diario, Semanal, Mensual)

El estándar 2026 es **NLG (Natural Language Generation) sobre un grafo de conocimiento corporativo, distribuido multicanal**. Glean Briefings, Microsoft Copilot Daily Briefing, Notion AI Summary y Pulse by Slack son los referentes.

### 6.1 Glean Briefings

Glean alcanzó $200M ARR en 9 meses y $7.2B valuación en junio 2025. Su Agentic Engine 2 hace "adaptive planning and parallel sub-agent orchestration" sobre un unified model hub que soporta 15+ LLMs. Para Briefings: el agente consulta toda la base federada (Slack, Drive, Confluence, Jira, GitHub, Salesforce) y arma un resumen personalizado por usuario. Para Reciclean (3 sucursales, 8 empresas, datos en Supabase + Drive + WhatsApp), el patrón es directamente aplicable —**construir un agente que consulte `curated.*` + Drive + Granola y arme el briefing**.

### 6.2 Microsoft Copilot Daily Briefing (mayo 2026)

Microsoft anunció: "Copilot can now auto-generate a daily briefing email that highlights changes to your schedule, flags double-booked slots, and recommends rescheduling based on attendee priorities. After any Teams meeting recorded in Outlook, Copilot will surface a 'Meeting Recap' right inside the calendar item that includes a summary, action items, and a sentiment analysis". El patrón clave: el briefing **no se envía como reporte estático, se inyecta en el contexto de trabajo** (Outlook, Teams).

Aplicación a Diego: el `daily-digest` v2 actual debería enviarse no solo a `diego@gestionrepchile.cl`, sino aparecer dentro del FAB de `panel-rdo.html` al primer login del día —"buenos días Andrea, ayer hubo 7 cierres, hoy tienes 3 visitas, Pincore lleva 4 días sin comprar".

### 6.3 Notion AI Summary / Pulse by Slack

Notion AI: resumen automático de páginas largas. Pulse by Slack: resumen de canales no leídos. El patrón compartido: **el resumen apunta al original**, no lo reemplaza —si Andrea quiere los detalles, el briefing tiene anchors a las queries SQL originales.

### 6.4 Distribución multicanal

Estándar 2026: el mismo briefing se entrega en email + WhatsApp + Slack/Teams + FAB de la app, con formato adaptado al canal. Para Reciclean, los canales razonables son **WhatsApp (Diego v5.1.0 ya está ahí) + email (Workspace) + FAB del panel**. Slack/Teams no aplica.

### 6.5 NLG con LLM: el patrón canónico 2026

```
Input    →  query result set (toneladas, cierres, márgenes, comparativo vs meta)
Schema   →  panel.config_ui.metric_definitions
Style    →  panel.config_ui.tono_diego (canónico: directo, sin chilenismos, máx 3 bullets)
Output   →  texto + chart embebido (Sección 1 visual-oro) + acción sugerida
```

El error a evitar: dejar al LLM "inventar" números. La regla: **todo número en el reporte viene de un row identificable en Supabase**, citado con el alias del campo. Si el LLM no tiene el dato, dice "dato no disponible" —nunca lo aproxima.

### 6.6 Cadencias propuestas

| Reporte | Cadencia | Hora | Canal | Audiencia | Estado v6 |
|---|---|---|---|---|---|
| Briefing matinal personal | diario | 08:00 CLT | FAB + WhatsApp | cada persona, sus métricas | ❌ |
| Resumen operacional sucursal | diario | 18:30 CLT | WhatsApp grupo | jefe de sucursal | ❌ |
| Reporte semanal CEO | lunes | 07:00 CLT | email + FAB | Dusan + Pablo | 🟡 `daily-digest` v2 pendiente cableo |
| Cierre mensual | día 1 mes | 09:00 CLT | email + PDF | CEO + contabilidad | ❌ |
| Incident review post-falla | gatillado | inmediato | FAB + Slack interno | Pablo | ❌ |

---

## 7. Observabilidad de Calidad (LLM-as-a-Judge y Evaluación Continua)

Una capa que las plataformas 2025-2026 separaron del resto: **la calidad semántica de la respuesta de Diego no se mide con HTTP 200**. Una respuesta puede ser exitosa (status 200, latencia 1.2 s, costo USD 0.003) y estar **completamente equivocada** ("el cobre brillante está a $9.200" cuando en realidad está a $8.200).

### 7.1 LLM-as-a-Judge

El patrón 2025: una segunda llamada LLM evalúa la primera con rúbrica fija. Métricas comunes: groundedness, relevance, completeness, harmfulness, tone. El judge corre sobre un sample (no 100% por costo) —típicamente 5-10% de los requests, escogidos por estratificación (todas las tools al menos N veces).

### 7.2 Plataformas: Confident AI, Langfuse, Phoenix Arize, Braintrust

- **Confident AI / DeepEval** — biblioteca open source + SaaS, foco en evaluación pre-deploy y CI.
- **Langfuse** — open source self-hostable, captura traces + evals + datasets.
- **Phoenix Arize** — tracing + eval + RAG metrics.
- **Braintrust** — eval-first, integra con CI.

Para Diego, **Langfuse autohospedado** es el match más cercano al stack actual (PostgreSQL + Docker), no requiere salir del perímetro y permite cargar el dataset de feedback humano que el equipo ya genera (botones 👍/👎 en el FAB).

### 7.3 Métricas de calidad a cablear

| Métrica | Definición | Frecuencia | Estado v6 |
|---|---|---|---|
| Groundedness | la respuesta cita un dato verificable de las tools | sample 10% | ❌ |
| Tool selection accuracy | la tool elegida era la correcta para la pregunta | sample 10% | ❌ |
| User satisfaction (👍/👎) | feedback explícito | 100% (opt-in) | ❌ |
| Hallucination flag | mención de entidad inexistente en BD | sample 10% | ❌ |
| Tone adherence | cumple `tono_diego` | sample 5% | ❌ |

---

## 8. Stack de Implementación Recomendado para Diego v6.x

Sin Datadog (caro) ni Honeycomb (también caro), el stack pragmático para una empresa de 14 personas:

| Capa | Herramienta | Cost/mes USD | Estado |
|---|---|---|---|
| Telemetry SDK | OpenTelemetry GenAI semantic conventions | 0 | implementable en EF |
| Storage métricas | Supabase Postgres `curated.diego_telemetry` | incluido | tabla nueva |
| Dashboards realtime | `panel-rdo.html` con Chart.js + SSE | 0 | base existe |
| Anomaly detection | SQL window functions + Prophet en Python EF | 0-15 | requiere EF nueva |
| LLM Quality Eval | Langfuse self-hosted en VPS Pablo | 5-10 | docker compose |
| Reporting/NLG | `daily-digest` v2 + tabla `panel.briefings` | incluido | EF existe sin cableo |
| Distribución | WhatsApp Business API (Diego v5.1.0) + Resend (email) | 20 | Pablo ya opera |
| Process mining | SQL puro sobre event log derivado | 0 | tabla derivada nueva |

Total estimado: **USD 30-50/mes en infra adicional**, contra USD 500+/mes que costaría Datadog LLM Observability para el mismo volumen.

---

## 9. Patrones de Operación SRE para Diego

### 9.1 Toil reduction — automatizar lo repetitivo

Tareas que hoy Pablo (o nadie) hace a mano y que deben automatizarse:

1. Revisar logs de `diego-chat-process` cuando un usuario reporta error.
2. Calcular costo mensual OpenAI desde la consola.
3. Detectar prompt rotos (el LLM responde fuera de scope).
4. Verificar que `daily-digest` corrió.
5. Auditar tool calls que devolvieron `null` cuando deberían tener datos.

Cada una es un automatismo cron + alerta. La regla: **si se hizo dos veces a mano, va a cron**.

### 9.2 Progressive rollout

Cuando se cambia el prompt de Diego o se agrega una tool, el patrón SRE 2026 es canary:

- 5% del tráfico al nuevo prompt durante 24h.
- Comparar métricas (latencia, costo, satisfacción) vs grupo control.
- Si pasa, 25% por 48h.
- Si pasa, 100%.

Implementable con un flag en `panel.config_ui.diego_prompt_canary_pct`.

### 9.3 Post-incident review (blameless)

Cada incidente (Diego cayó, dio dato erróneo, costó USD 50 en una hora) debe tener un PIR registrado en `curated.diego_incidents`. Estructura:

- Timeline (con timestamps reales del log).
- Impacto medido (no estimado).
- Causa raíz (no "el usuario hizo algo raro").
- Acción correctiva con due date.
- Métrica que detectaría el incidente la próxima vez.

### 9.4 Chaos engineering ligero

Una vez al mes, romper una tool a propósito en horario laboral y medir si Diego maneja el fallback. Ejemplo: simular que `consultar_precio_material` devuelve 500 durante 10 minutos. ¿Diego responde "no puedo consultar precios ahora, te confirmo en un momento" o se cuelga? El test no es opcional —es la única forma de saber que el fallback funciona.

---

## 10. Riesgos y Anti-patrones

### 10.1 Anti-patrones comunes 2025-2026

- **"Loggeamos todo, vemos nada"** — `diego_audit_log` con 200K filas/mes sin dashboard es ruido caro.
- **Alertas sin runbook** — una alerta que no dice qué hacer es una alerta ignorada en 6 semanas.
- **KPIs sin meta** — un número sin contexto no es información.
- **Reportes diarios que nadie lee** — si la tasa de apertura < 30%, el reporte está mal escrito o mal segmentado.
- **Cost monitoring reactivo** — descubrir el spike de USD 200 a fin de mes en la factura OpenAI. El presupuesto debe alertar al 50%, 80%, 100%.
- **LLM-as-a-judge sin calibración humana** — el juez también alucina; necesita ser auditado contra muestras humanas trimestralmente.

### 10.2 Privacidad y RGPD/ley 19.628

El registro completo de prompts en `diego_audit_log` incluye potencialmente datos personales (nombres, RUTs, montos). Estándar 2026: **PII redaction en el pipeline de telemetría**, no en el storage. Datadog, Honeycomb y Langfuse ofrecen scrubbers configurables. Para Diego, hoy es **🟡 parcial** —los datos están en Supabase con RLS, pero un dump del audit log expondría conversaciones sensibles.

### 10.3 Costo escondido del monitoreo

Según oneuptime.com (abril 2026): "AI workload monitoring [is] about to blow up your observability bill". Cuidar la cardinalidad de etiquetas (no etiquetar por `prompt_hash` único —explota), agrupar por buckets (latencia en 5 buckets, no continua).

---

## 11. Brechas vs Diego v6 actual

Las brechas se evalúan contra el stack vivo declarado al inicio (v6, EF v4 ACTIVE, `daily-digest` v2 pendiente de cableo, 7 tools, `diego_audit_log` registrando pero sin dashboards).

| # | Brecha | Severidad | Esfuerzo | Bloqueado por |
|---|---|---|---|---|
| 1 | Sin dashboard que consuma `diego_audit_log` (latencia, costo, tool hit rate) | ALTA | 1 día (Dusan en `panel-rdo.html`) | nadie |
| 2 | Sin cálculo de costo USD por request (no existe tabla `panel.openai_pricing`) | ALTA | 0.5 día | nadie |
| 3 | Sin alertas (burn-rate, spike costo, tool error, latency p95) | ALTA | 1 día (cron + EF nueva) | Pablo |
| 4 | `daily-digest` v2 sin cableo a destinatarios (mig 050 está, distribución no) | ALTA | 0.5 día | Pablo |
| 5 | Sin LLM-as-a-Judge / evaluación de calidad post-respuesta | ALTA | 2-3 días (Langfuse o EF custom) | Pablo |
| 6 | Sin briefing personalizado por persona al login | MEDIA | 1 día (prompt + vista) | nadie |
| 7 | Sin process mining O2C (event log derivado no existe) | MEDIA | 2 días (vista + Diego prompt) | Pablo (DDL) |
| 8 | Sin anomaly detection sobre KPIs negocio (cierres, toneladas, márgenes) | MEDIA | 2-3 días (Prophet en EF) | Pablo |
| 9 | Sin PII redaction en `diego_audit_log` | MEDIA | 1 día | Pablo |
| 10 | Sin canary rollout para cambios de prompt (todo va al 100% directo) | BAJA | 0.5 día (flag config_ui) | nadie |

---

## 12. Implementable sin Pablo en 1-2 días

Cinco quick-wins que solo requieren cambios en `panel.config_ui` + prompt + `panel-rdo.html`. No tocan DDL, no tocan EF.

### 12.1 Dashboard Diego sobre `diego_audit_log` (4-6 horas)

Tab nueva en `panel-rdo.html` con 6 KPI cards y 4 charts:
- Cards: requests/día, costo USD/día (calculado en query), latencia p95, tool hit rate, fallback rate, usuarios activos hoy.
- Charts: serie temporal últimos 14 días (4 series — requests, costo, latencia, errores).
- Tabla bottom: últimos 20 requests con `user`, `tool`, `latency_ms`, `status`, link a detalle.

Todo SQL puro contra `diego_audit_log`. Cero infra nueva.

### 12.2 Cálculo de costo USD inline en la query (2 horas)

Sin necesidad de tabla `panel.openai_pricing`, hardcodear precios en `panel.config_ui.openai_pricing_v1` (JSON, editable sin deploy). Query:

```
input_tokens × precio_in_por_1M / 1e6 + output_tokens × precio_out_por_1M / 1e6
```

Resultado: cada request tiene su costo computable en cualquier SELECT.

### 12.3 Briefing matinal personalizado en el FAB (4 horas)

Modificar prompt de Diego para que, al primer mensaje del día de cada usuario, devuelva proactivamente:

- "Hola [nombre], desde tu última sesión: [N eventos relevantes en TU área]."
- "Tu top 3 pendientes: [query a `mayordomo.cola_construccion`]."
- "Atención: [1 anomalía detectada en TUS KPIs]."

Sin EF nueva. Solo prompt + un par de tools que ya existen (`consultar_alertas_activas`, `resumen_facturacion_mes`).

### 12.4 Patrón O→E→H→A en el prompt (1 hora)

Agregar al `DIEGO-PROMPT-MAXIMO.md` la directiva: cuando el usuario pregunte por una métrica que está fuera de rango, **siempre responder en 4 bloques** (Observación, Explicación-hipótesis, Hipótesis, Acción sugerida). Modelado en Sección 5.4 de este documento. Cero código.

### 12.5 Self-audit semanal de Diego (3 horas)

Prompt nuevo: cada lunes 07:00, Diego ejecuta una "autoauditoría" sobre `diego_audit_log` semana anterior y publica en `mayordomo.bitacora_viva`:
- Tools más usadas / menos usadas.
- Usuarios más activos.
- 3 requests más caros.
- Lista de fallbacks (preguntas sin tool).
- Sugerencia: "considerar agregar tool X" o "deprecar tool Y".

Implementable con `agendar_compromiso` (ya existe) + una llamada cron a `diego-chat-process` con un prompt-system de auditoría.

---

## 13. Runbooks por Alerta (uno por incidente esperable)

El estándar SRE 2026 es que **toda alerta lleva su runbook** —el link al "qué hacer cuando suene esto" está en el cuerpo del aviso. Sin runbook, la alerta se ignora en 6 semanas. Para Diego v6, estos son los 8 runbooks mínimos.

### 13.1 RB-01 · Latency p95 > 8s durante 10 min

- **Indicador:** `percentile_cont(0.95) within group (order by latency_ms) FROM diego_audit_log WHERE created_at > now() - interval '10 min'`.
- **Causas conocidas:** OpenAI degradado · EF cold start crónico · query Supabase lenta dentro de una tool · prompt creció (>8K tokens input).
- **Verificación rápida:** revisar `https://status.openai.com`; revisar logs EF; medir `tool_calls[].duration_ms`.
- **Mitigación:** si OpenAI cae, conmutar a Anthropic via `panel.config_ui.diego_model_fallback`; si EF cold start, mantener warm con cron 1/min.
- **Owner:** Pablo (EF) / nadie (cuando es upstream OpenAI).

### 13.2 RB-02 · Spike de costo > 3× rolling avg

- **Indicador:** `sum(cost_usd_5m) > 3 × avg(cost_usd_5m last 60m)`.
- **Causas conocidas:** usuario nuevo abusando del chat · prompt growth (alguien metió 50 páginas en contexto) · tool en bucle (loop infinito por bug).
- **Verificación:** `SELECT user_id, count(*), sum(cost_usd) FROM diego_audit_log WHERE created_at > now()-interval '1h' GROUP BY 1 ORDER BY 3 DESC LIMIT 5`.
- **Mitigación:** rate-limit temporal al usuario top; si es bucle, kill EF.
- **Owner:** Pablo.

### 13.3 RB-03 · Tool error rate > 30%

- **Indicador:** errores agrupados por nombre de tool sobre ventana 15 min.
- **Causas conocidas:** RLS bloqueando · tabla cambió de schema · función SQL renombrada · timeout PG.
- **Verificación:** ver `tool_calls[i].error_message`; cross-check con `pg_stat_statements`.
- **Mitigación:** rollback de migración reciente; si es RLS, agregar policy o usar `service_role` en EF.
- **Owner:** Pablo.

### 13.4 RB-04 · Concurrencia > 12 usuarios simultáneos

- **Indicador:** `distinct user_id WHERE created_at > now() - interval '5 min'`.
- **Causas conocidas:** evento grupal (todos preguntando lo mismo a la vez); ataque (improbable, sistema interno).
- **Verificación:** ¿quiénes son? Si son 12 personas legítimas en una reunión, es uso real.
- **Mitigación:** aumentar plan Supabase Edge Functions tier; cachear respuesta a la pregunta repetida.
- **Owner:** Pablo.

### 13.5 RB-05 · Fallback rate > 20% en una hora

- **Indicador:** `count(tools_invoked=0 AND scope_classified NOT IN ('small_talk','meta_query')) / count(total)`.
- **Causas conocidas:** prompt roto (deploy reciente); tool ausente para una pregunta común; mala clasificación de scope.
- **Verificación:** muestra de 20 preguntas con `tools_invoked=0`; manualmente decidir si era resolvible.
- **Mitigación:** rollback prompt; agregar tool faltante a whitelist; ajustar `system_prompt` con ejemplos few-shot.
- **Owner:** Dusan (prompt) / Pablo (whitelist EF).

### 13.6 RB-06 · `daily-digest` no corrió o no llegó

- **Indicador:** `panel.briefings WHERE generated_at::date = current_date` está vacío a las 09:00 CLT.
- **Causas conocidas:** cron Supabase pausado; EF v2 sin destinatarios cableados (estado actual); error en query upstream.
- **Verificación:** `select * from supabase_functions.cron_jobs` (si existe equivalente) o logs EF `daily-digest`.
- **Mitigación:** ejecutar manualmente `select net.http_post(...)` al endpoint; revisar config destinatarios.
- **Owner:** Pablo.

### 13.7 RB-07 · `precios_cliente` desactualizado > 48h

- **Indicador:** `max(updated_at) FROM curated.precios_cliente < now() - interval '48 hours'`.
- **Causas conocidas:** Andrea/Cony no cargaron precios semana en curso; integración con widget falló; n8n workflow caído.
- **Verificación:** ver `historial_precios` últimas 50 filas; preguntar a Andrea.
- **Mitigación:** notificar al rol "precios" por WhatsApp; si es bug n8n, despertar a Pablo.
- **Owner:** Andrea (negocio) / Pablo (técnico).

### 13.8 RB-08 · Hallucination flag activado

- **Indicador:** LLM-as-a-judge detecta respuesta sin grounding en tools, sample 10%.
- **Causas conocidas:** prompt permite "rellenar" cuando no hay datos; modelo subutiliza tools.
- **Verificación:** revisar 10 muestras flagged; comparar con `tool_calls`.
- **Mitigación:** endurecer prompt — "si no tienes la tool, di 'no tengo ese dato', NUNCA estimes".
- **Owner:** Dusan (prompt).

---

## 14. Capacity Planning: cuánto va a crecer Diego

Estándar 2026: capacity planning trimestral basado en datos, no en gut feeling. Modelo simple para Diego:

- **Personas activas:** 14 hoy, proyección 18-22 en 12 meses (Plan 2026 incorpora analistas adicionales).
- **Requests/persona/día:** baseline desconocido, asumir 0; supuesto razonable 15-30 (Diego como copiloto operativo, no como buscador puntual).
- **Tokens promedio por request:** baseline desconocido, asumir 0; supuesto industria 1.5K input + 0.4K output (Diego responde corto).
- **Costo OpenAI gpt-4o (mayo 2026):** ~USD 2.5 / 1M input tokens, ~USD 10 / 1M output tokens.

### 14.1 Estimación pesimista (techo presupuestal)

22 personas × 30 requests/día × 22 días hábiles = **14.520 requests/mes**.
14.520 × (1.5K × USD 2.5/1M + 0.4K × USD 10/1M) = **USD 113/mes en OpenAI** sin cache.

### 14.2 Con prompt caching (estándar 2026)

OpenAI y Anthropic cobran 10× menos por cache reads. Si el `system_prompt` (602 líneas) se cachea, **input cost cae ~75%**. Costo estimado: **USD 50-60/mes**. Aceptable.

### 14.3 Saturación Supabase

- Edge Functions plan Pro: 2M invocaciones/mes incluidas. 14.520 requests es 0.7% del plan. Sin presión.
- Postgres: `diego_audit_log` con 14.520 filas/mes × 12 meses = 174K filas. Trivial.
- Storage de prompts adjuntos: si Diego procesa PDFs, allá sí hay cuidar. No es el caso hoy.

### 14.4 Punto de quiebre

El sistema empieza a crujir cuando: (a) Diego soporta voice notes (audio = 10× tokens equivalentes en costo Whisper); (b) Diego soporta video (gemini-2.5-pro = USD 5/min); (c) se conecta a clientes externos (multiplica audiencia ×100). Antes de cualquiera de esos cambios, **rediseñar la capa de cuotas y rate-limiting**.

---

## 15. Glosario SRE × LLM Observability

| Término | Definición | Fuente del concepto |
|---|---|---|
| SLI | Service Level Indicator. Métrica medible (ej: % requests con latencia < 4s). | Google SRE Book |
| SLO | Service Level Objective. Meta sobre el SLI (ej: 95% sobre 30 días). | Google SRE Book |
| Error budget | (1 - SLO) × tráfico total. Permiso de fallo. | Google SRE Book |
| Burn rate | Velocidad a la que se consume el error budget. > 1 es alerta. | Google SRE Workbook |
| Golden Signals | Latencia, tráfico, errores, saturación. Diego suma: cost, tool hit, escalation. | SRE Book + 2026 ext |
| MTTR | Mean Time To Resolution. Tiempo desde alerta hasta resolución. | clásico |
| MTBF | Mean Time Between Failures. Tiempo entre incidentes. | clásico |
| Toil | Trabajo manual repetitivo automatizable. SRE busca minimizarlo. | SRE Book |
| Cardinality | Número de combinaciones únicas de etiquetas. Alto = caro. | Honeycomb / Prometheus |
| Trace / Span | Trace = una request end-to-end. Span = cada paso. | OpenTelemetry |
| Cold start | Latencia adicional cuando una EF se despierta de cero. | Serverless |
| LLM-as-a-judge | Patrón de evaluar la salida de un LLM con otro LLM y rúbrica. | 2024-2025 |
| Grounding | Anclaje de la respuesta del LLM a datos verificables (tool output, RAG). | 2024 |
| Hallucination | Respuesta plausible pero falsa. Adversario principal del copiloto. | 2023-2026 |
| Drift | Cambio gradual en distribución de inputs o calidad de outputs. | ML ops |
| RAG | Retrieval-Augmented Generation. No aplica a Diego v6 (no usa vector store, usa tools). | 2023 |
| Token | Unidad de cobro y de procesamiento del LLM. ~4 caracteres en español. | OpenAI/Anthropic |
| Cache hit rate | % de tokens input servidos desde cache (más barato). | OpenAI/Anthropic 2024 |
| OTel | OpenTelemetry. Estándar abierto de instrumentación. | CNCF |
| BubbleUp | Feature de Honeycomb que aísla la dimensión que explica un outlier. | Honeycomb |
| Conformance checking | Comparar proceso real (event log) vs ideal (modelo). | Process Mining |

---

## 16. Comparativa de Stacks (decisión 2026)

Tres caminos viables para Diego, ordenados por costo total mensual y esfuerzo de implementación:

### 16.1 Stack Mínimo Viable (este documento recomienda)

- **Telemetría:** Supabase Postgres (`diego_audit_log` + `diego_telemetry`).
- **Dashboards:** `panel-rdo.html` + Chart.js + SSE custom.
- **Alertas:** EF Supabase con cron 5m + WhatsApp + email.
- **LLM Eval:** EF custom con LLM-as-judge sobre sample.
- **Reporting:** `daily-digest` v2 + tabla `briefings` + Resend.
- **Costo:** USD 30-50/mes adicional.
- **Pros:** todo dentro del perímetro, sin nuevos vendors, datos en una base.
- **Contras:** Dusan/Pablo son SRE part-time; sin paging serio (PagerDuty/Opsgenie).

### 16.2 Stack Open Source Autohospedado

- **Telemetría:** OpenTelemetry → Tempo (traces) + Loki (logs) + Prometheus (métricas).
- **Dashboards:** Grafana.
- **Alertas:** Grafana Alerting + Alertmanager → Slack/WhatsApp.
- **LLM Eval:** Langfuse self-hosted.
- **Reporting:** scripts Python + cron.
- **Costo:** USD 60-100/mes (VPS para todo el stack).
- **Pros:** estándar industria, portable, equipo aprende skills útiles.
- **Contras:** 5-7 días de set-up; Pablo se vuelve admin de Grafana.

### 16.3 Stack SaaS Premium

- **Todo en uno:** Datadog LLM Observability + Honeycomb + Glean Briefings.
- **Costo:** USD 800-2.000/mes para 14 personas.
- **Pros:** state-of-the-art listo en 2 días.
- **Contras:** caro, datos salen del país (sensible para Reciclean), vendor lock-in.

**Recomendación:** **16.1 ahora, evaluar migrar a 16.2 cuando el equipo supere 30 personas o el volumen supere 100K requests/mes**.

---

## 17. Anexo A — Mapeo de eventos Reciclean para process mining

Event log mínimo (un row por evento) para construir `curated.v_eventos_o2c`:

```
case_id     uuid                      -- 1 caso = 1 cotización trazable end-to-end
event_name  text                      -- nombre canónico del paso
actor       text                      -- quién lo ejecutó (usuario / sistema / diego)
ts          timestamptz               -- cuándo ocurrió
attrs       jsonb                     -- payload (cliente, material, monto, etc.)
```

Eventos canónicos (16):

1. `cotizacion_creada` — origen `curated.cotizaciones_v2`.
2. `cotizacion_revisada_diego` — log si Diego intervino.
3. `cotizacion_enviada_cliente` — email/whatsapp marker.
4. `cotizacion_aceptada` — campo `aceptada_at` (a crear).
5. `cotizacion_rechazada` — terminal.
6. `recepcion_agendada` — `curated.recepciones`.
7. `material_arribo_sucursal` — registro guardia o báscula.
8. `pesaje_inicial` — `staging.pesajes`.
9. `pesaje_anomalia_detectada` — `staging.v_pesajes_anomalias` (ya existe).
10. `liquidacion_calculada` — `curated.liquidaciones`.
11. `liquidacion_firmada_cliente` — RDO firmada.
12. `dte_emitido` — `curated.dte_emitidos`.
13. `dte_rechazado_sii` — terminal con rework.
14. `cobro_recibido` — `curated.cobros`.
15. `cobro_parcial` — caso degradado.
16. `caso_cerrado` — terminal feliz.

### 17.1 KPIs derivables del event log

- **Lead time end-to-end:** `caso_cerrado.ts - cotizacion_creada.ts`.
- **Conversion rate:** `count(cotizacion_aceptada) / count(cotizacion_enviada_cliente)`.
- **Pesaje anomaly rate:** `count(pesaje_anomalia_detectada) / count(pesaje_inicial)`.
- **DTE rejection rate:** `count(dte_rechazado_sii) / count(dte_emitido)`.
- **Cobro lag:** `cobro_recibido.ts - dte_emitido.ts`.
- **Rework rate:** casos con > 1 ocurrencia del mismo evento.

Todas computables en SQL puro sin Celonis. Diego puede consultarlas con una tool `consultar_proceso_o2c(case_id|cliente|rango)` (a futuro, no urgente).

---

## 18. Anexo B — Queries SLO listas para copiar

Las siguientes queries asumen `curated.diego_audit_log (created_at, user_id, latency_ms, status, tools_invoked jsonb, input_tokens, output_tokens, model)`. Si los campos no existen tal cual, adaptar.

### 18.1 Disponibilidad 30 días

```
WITH base AS (
  SELECT count(*) FILTER (WHERE status < 500) AS ok,
         count(*)                              AS total
  FROM   curated.diego_audit_log
  WHERE  created_at > now() - interval '30 days'
)
SELECT ok::numeric / NULLIF(total,0) AS availability_30d,
       0.995                          AS slo,
       (ok::numeric/NULLIF(total,0)) - 0.995 AS budget_remaining
FROM   base;
```

### 18.2 Latency p50/p95/p99 por tool, últimos 7 días

```
SELECT t.tool,
       percentile_cont(0.50) WITHIN GROUP (ORDER BY l.latency_ms) p50,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY l.latency_ms) p95,
       percentile_cont(0.99) WITHIN GROUP (ORDER BY l.latency_ms) p99,
       count(*) n
FROM   curated.diego_audit_log l,
       jsonb_array_elements_text(l.tools_invoked) t(tool)
WHERE  l.created_at > now() - interval '7 days'
GROUP  BY 1
ORDER  BY n DESC;
```

### 18.3 Costo USD diario (precios hardcodeados gpt-4o mayo 2026)

```
SELECT date_trunc('day', created_at)::date AS d,
       sum( (input_tokens::numeric * 2.5)/1e6
          + (output_tokens::numeric * 10)/1e6 ) AS cost_usd
FROM   curated.diego_audit_log
WHERE  created_at > now() - interval '30 days'
GROUP  BY 1
ORDER  BY 1 DESC;
```

### 18.4 Top 10 usuarios por costo, últimos 30 días

```
SELECT user_id,
       count(*) requests,
       sum( (input_tokens*2.5 + output_tokens*10)/1e6 ) cost_usd,
       avg(latency_ms) avg_latency_ms
FROM   curated.diego_audit_log
WHERE  created_at > now() - interval '30 days'
GROUP  BY 1
ORDER  BY 3 DESC
LIMIT  10;
```

### 18.5 Fallback rate por día

```
SELECT date_trunc('day', created_at)::date d,
       count(*) FILTER (WHERE jsonb_array_length(tools_invoked) = 0) sin_tool,
       count(*) total,
       round(100.0 * count(*) FILTER (WHERE jsonb_array_length(tools_invoked) = 0) / count(*), 1) fallback_pct
FROM   curated.diego_audit_log
WHERE  created_at > now() - interval '14 days'
GROUP  BY 1
ORDER  BY 1 DESC;
```

### 18.6 Detección naive de spike de costo (rolling 60m)

```
WITH rolling AS (
  SELECT created_at,
         sum( (input_tokens*2.5 + output_tokens*10)/1e6 )
           OVER (ORDER BY created_at RANGE BETWEEN INTERVAL '60 min' PRECEDING AND INTERVAL '5 min' PRECEDING) AS prev_60m,
         sum( (input_tokens*2.5 + output_tokens*10)/1e6 )
           OVER (ORDER BY created_at RANGE BETWEEN INTERVAL '5 min' PRECEDING AND CURRENT ROW) AS last_5m
  FROM   curated.diego_audit_log
  WHERE  created_at > now() - interval '4 hours'
)
SELECT *,
       CASE WHEN last_5m > 3 * (prev_60m/12.0) THEN 'SPIKE' END flag
FROM   rolling
WHERE  last_5m > 3 * (prev_60m/12.0)
ORDER  BY created_at DESC;
```

Estas seis queries cubren los KPIs de SLO y los runbooks RB-01, RB-02 y RB-05 sin necesidad de plataforma externa.

---

## 19. Anexo C — Checklist de implementación (orden sugerido)

Marco temporal: 4 semanas. Cero dependencia de hardware nuevo. Pablo solo entra en semanas 2-3.

### Semana 1 — Dashboard + costo (solo Dusan + prompt)

- [ ] Crear tab "Diego" en `panel-rdo.html` con 6 KPI cards (sección 12.1).
- [ ] Insertar `panel.config_ui.openai_pricing_v1` con precios actuales (sección 12.2).
- [ ] Crear 3 charts: requests/día, costo/día, latency p95 7 días.
- [ ] Agregar al `DIEGO-PROMPT-MAXIMO.md` el patrón O→E→H→A (sección 12.4).

### Semana 2 — Alertas + briefings (Pablo entra)

- [ ] EF nueva `diego-alerts` con cron 5m que evalúa runbooks RB-01, RB-02, RB-04, RB-05.
- [ ] Tabla `panel.diego_alerts_log` con histórico y estado (open/ack/closed).
- [ ] Cablear `daily-digest` v2 a destinatarios reales (RB-06).
- [ ] Migración: agregar columnas faltantes a `diego_audit_log` (`tool_calls`, `escalado`, `thread_id`).

### Semana 3 — Process mining + LLM quality (Pablo)

- [ ] Vista `curated.v_eventos_o2c` con los 16 eventos del Anexo A.
- [ ] EF `diego-quality-judge` que evalúa sample 10% con LLM-as-a-judge.
- [ ] Tabla `panel.diego_quality_evals` para guardar resultados.
- [ ] PII redaction en pipeline antes de escribir `diego_audit_log`.

### Semana 4 — Briefing personal + self-audit (Dusan + prompt)

- [ ] Briefing matinal personalizado (sección 12.3) — primer login del día.
- [ ] Self-audit semanal de Diego (sección 12.5) — lunes 07:00 a `bitacora_viva`.
- [ ] Canary flag `diego_prompt_canary_pct` para próximos cambios (sección 9.2).

---

## Fuentes

- [Datadog LLM Observability — Documentación de costo](https://docs.datadoghq.com/llm_observability/monitoring/cost/) — cómo se calcula costo por request con OTel spans + precios públicos del proveedor.
- [Honeycomb — Introducing Anomaly Detection: Your Early Warning System](https://www.honeycomb.io/blog/introducing-anomaly-detection-early-warning-system-service-health) — modelo de aprendizaje de baseline sin umbrales fijos.
- [Honeycomb BubbleUp — Identify Outliers](https://www.honeycomb.io/platform/bubbleup) — aislamiento automático de dimensiones que explican outliers.
- [OpenTelemetry GenAI Semantic Conventions (2026)](https://opentelemetry.io/blog/2026/genai-observability/) — convención `gen_ai.*` para spans LLM, tokens, costo, finish_reasons.
- [OpenTelemetry for AI Systems: LLM and Agent Observability (2026) — Uptrace](https://uptrace.dev/blog/opentelemetry-ai-systems) — estado experimental, Datadog v1.37, Grafana/Loki.
- [10 LLM Observability Tools to Evaluate & Monitor AI in 2026 — Confident AI](https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026) — comparativo de plataformas LLM obs.
- [Monte Carlo vs Anomalo vs Bigeye 2026 — Thinklytics](https://thinklytics.com/insights/monte-carlo-vs-anomalo-vs-bigeye-2026) — tres vendors líderes, 4-8 semanas de tuning para signal-to-noise positivo.
- [Anodot — Top 8 AI-Powered Anomaly Detection Tools for Time Series](https://www.anodot.com/learning-center/top-8-ai-powered-anomaly-detection-tools-for-time-series-data/) — captura de incidentes 1-2 h antes del impacto.
- [Tableau Pulse — How Tableau Pulse powered by Tableau AI is Reimagining the Data Experience](https://www.tableau.com/blog/tableau-pulse-and-tableau-ai) — dashboards personalizados por usuario, distribución Slack/email.
- [Celonis — What is AI-enhanced process mining](https://www.celonis.com/blog/ai-enhanced-process-mining) — root cause analysis sobre event logs.
- [Celonis — Order-to-Cash Process Mining (Persistent)](https://www.persistent.com/blogs/navigating-the-order-to-cash-journey-with-process-mining/) — patrones O2C, credit holds, conformance.
- [Glean — vs Microsoft Copilot 2026 (ClarityArc)](https://www.clarityarc.com/insights/glean-vs-copilot-vs-build-knowledge-platform) — $200M ARR, Agentic Engine 2, briefings federados.
- [Microsoft 365 Copilot — Mayo 2026 Outlook updates](https://windowsnews.ai/article/may-2026-outlook-updates-calendar-parity-team-views-and-copilot-insights.417336) — Daily Briefing email + Meeting Recap.
- [oneuptime — Your AI Workloads Are About to Blow Up Your Observability Bill (abril 2026)](https://oneuptime.com/blog/post/2026-04-01-ai-workload-observability-cost-crisis/view) — 40-200% incremento de la cuenta de observabilidad al añadir LLM.
- [Xu, X. et al. (2025). Can Multimodal LLMs Perform Time Series Anomaly Detection? — arXiv:2502.17812](https://arxiv.org/abs/2502.17812) — benchmark VisualTimeAnomaly, MLLMs sobre series como imagen.
- [CALM: Continuous, Adaptive, LLM-Mediated Anomaly Detection in Time-Series Streams — arXiv:2508.21273](https://arxiv.org/html/2508.21273v1) — TriP-LLM, frozen pre-trained LLM, patch-wise tokens.

---

*Documento generado por agente SRE · 2026-05-23 · estándar de citación: fuentes 2025-2026 con URL verificable + 2 papers arXiv.*
