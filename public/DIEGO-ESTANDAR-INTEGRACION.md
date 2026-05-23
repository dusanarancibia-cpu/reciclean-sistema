# DIEGO — Estándar Mundial 2026 de Integración Total (Agente B · v1.0)

> Documento de referencia: **más altos estándares mundiales 2026** en integración total para un chatbot/copiloto empresarial.
>
> **Audiencia**: Dusan Arancibia (CEO firmante) · Pablo Arancibia (tech lead) · Agente Z (consolidador).
>
> **Alcance**: 6 áreas — conectividad omni-sistema, API unificada, single source of truth, sincronización bidireccional en tiempo real, plugins/extensiones, observabilidad de integraciones.
>
> **Marco temporal**: estado del arte 23-may-2026, con citas verificables 2025-Q1 2026.
>
> **Stack vivo Diego v6** (fotografía base · 23-may-2026): `panel-rdo.html` (FAB), Edge Function `diego-chat-process` v4 (659 líneas, 7 tools whitelist), bucket `diego-chat-files`, system prompt `DIEGO-PROMPT-MAXIMO.md`. Integraciones existentes: Supabase Postgres (78 migraciones), 22 Edge Functions, OpenAI (LLM+Vision+Whisper), Vercel, GitHub. Integraciones pendientes (P1.5/P1.6): Monday.com, Gmail OAuth, n8n, Google Calendar, WhatsApp Cloud orquestada.

---

## ÍNDICE

1. [Conexión universal multi-sistema](#1-conexión-universal-multi-sistema)
2. [API unificada (single endpoint)](#2-api-unificada-single-endpoint)
3. [Single source of truth (una sola verdad)](#3-single-source-of-truth-una-sola-verdad)
4. [Sincronización bidireccional en tiempo real](#4-sincronización-bidireccional-en-tiempo-real)
5. [Plugins y extensiones (capabilities)](#5-plugins-y-extensiones-capabilities)
6. [Observabilidad de integraciones](#6-observabilidad-de-integraciones)
7. [Anti-patrones comunes 2026](#7-anti-patrones-comunes-2026)
8. [Matriz de decisión por tamaño de equipo](#8-matriz-de-decisión-por-tamaño-de-equipo)
9. [Blueprint de migración Diego v6 → v7](#9-blueprint-de-migración-diego-v6--v7)
10. [Seguridad de integraciones — checklist 2026](#10-seguridad-de-integraciones--checklist-2026)
11. [Glosario operativo](#11-glosario-operativo)
12. [Brechas vs Diego v6 actual](#brechas-vs-diego-v6-actual)
13. [Implementable sin Pablo en 1-2 días](#implementable-sin-pablo-en-1-2-días)
14. [Fuentes](#fuentes)

---

## 1. Conexión universal multi-sistema

### 1.1 El cambio de paradigma 2025-2026: MCP como ODBC de la era IA

El año 2025 cerró con un consenso de industria que en 2024 era hipótesis: **Model Context Protocol (MCP)**, publicado por Anthropic en noviembre 2024, se convirtió en el estándar de facto para que cualquier LLM hable con cualquier sistema externo. El spec `2025-11-25` introdujo `Tasks` (ejecuciones de larga duración con polling de status), `Elicitation` (el server puede pedir más input al usuario mid-flight), y output estructurado por JSON Schema — todas piezas que faltaban para uso productivo en 2024.

> "MCP será al tooling de IA lo que ODBC fue a bases de datos: la capa invisible pero esencial sobre la que nadie pelea porque simplemente funciona." — análisis 2026 sobre adopción cross-vendor ([howtoaiwith.com, 2026](https://www.howtoaiwith.com/blog/mcp-vs-openai-protocol)).

Estado de adopción a febrero 2026: **Anthropic, OpenAI, Google, Microsoft y Amazon** soportan MCP nativamente. El registro oficial supera 5.800 servers públicos, 300+ clients, 97M descargas mensuales de SDKs ([modelcontextprotocol.io, 2026](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)). Para Diego v6, que hoy depende de un whitelist de 7 tools hard-coded en Edge Function, esto no es académico: significa que la **arquitectura de tools propia es legacy técnico desde el día 1 del despliegue**.

### 1.2 Patrón canónico 2026: chatbot como MCP host, integraciones como MCP servers

Patrón de referencia (validado por Claude Desktop, Cursor, VS Code Copilot, ChatGPT Desktop a partir de Q1 2026):

| Capa | Función | En Diego v6 hoy | En estándar 2026 |
|---|---|---|---|
| **Host** | Aplicación que ejecuta el LLM | `diego-chat-process` (EF) | Igual, pero abstrayendo tools detrás de MCP clients |
| **Client** | Cliente MCP 1:1 con un server | No existe | Uno por integración (Supabase, Monday, Gmail, etc.) |
| **Server** | Expone capacidades (tools, resources, prompts) | No existe | Uno por dominio (cartera, RDO, tesorería, REP) |
| **Transport** | JSON-RPC 2.0 sobre stdio / HTTP+SSE / Streamable HTTP | N/A | Streamable HTTP es default 2026 |

Trade-off explícito: migrar a MCP **no reemplaza la lógica de Diego**, reemplaza el **acoplamiento del tool layer**. Hoy agregar la tool nº 8 implica editar 659 líneas de TypeScript en una EF productiva. En MCP, agregar el server `monday-mcp` implica zero cambios a `diego-chat-process` — el host descubre tools vía `tools/list` en runtime.

### 1.3 Plataformas de integración 2026 (build vs buy)

Reuso de 1.000+ conectores prebuilt vs. construir cada integración a mano. El comparativo 2026 publicado por Composio, Merge y Nango ([composio.dev, 2026](https://composio.dev/content/ai-agent-integration-platforms)):

| Plataforma | Modelo | Conectores | OAuth gestionado | MCP nativo | Para qué sirve a Diego |
|---|---|---|---|---|---|
| **Composio** | Toolkit-as-a-Service | 500+ | Sí (token refresh automático) | Sí (Composio MCP Gateway expone cada integración como server) | Gmail/Monday/Calendar sin tocar OAuth |
| **Pipedream Connect** | SaaS + workflows | 3.000+ apps, 10.000+ tools | Sí (managed auth) | Sí (Pipedream MCP Server) | El catálogo más amplio. Adquirido por Workday dic-2025 |
| **Zapier MCP** | Workflow + MCP endpoint | 8.000+ apps | Sí | Sí | Cobertura long-tail (apps de nicho) |
| **n8n** | Self-hosted + cloud | 400+ nativos + HTTP genérico | Parcial | Sí (cliente + server) | Diego ya tiene VPS n8n — sinergia natural |
| **Merge Agent Handler** | Unified API enterprise | HRIS/ATS/CRM/Accounting/Ticketing | Sí | Sí | Gobernanza enterprise (no aplica todavía a Diego) |
| **Arcade.dev** | Just-in-time permissions | ~100 | Sí, granular | Sí | Compliance crítico (GDPR/SOC2) |
| **Bardeen** | Browser-based RPA | Browser-first | N/A | Limitado | Scraping de sistemas sin API (no aplica a Diego) |

**Recomendación arquitectónica para Diego v6 → v7**: pipeline `n8n (auto-hospedado) → Composio o Pipedream MCP (gestionados)`. n8n para flujos donde Reciclean ya tiene IP (RDO, OCR tableros, dieguito-whatsapp); Composio/Pipedream para todo el long-tail (Gmail, Monday, Calendar) donde construir OAuth propio es deuda técnica gratuita ([composio.dev, 2026](https://composio.dev/blog/secure-ai-agent-infrastructure-guide)).

### 1.4 n8n como hub MCP bidireccional

n8n 1.x (release line activa 2026) soporta MCP en ambas direcciones: el nodo `MCP Client Tool` permite a un AI Agent dentro de n8n consumir cualquier server MCP externo, y el nodo `MCP Server Trigger` convierte cualquier workflow n8n en un server MCP descubrible por hosts externos (Claude Desktop, Cursor, Diego) ([n8n.io, 2026](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/)).

Implicancia operativa para Reciclean: el VPS n8n existente (no verificado en cuanto a versión exacta — Pablo lo opera) puede convertirse en el **bus de integración interno** sin instalar otro producto. Cada workflow n8n productivo (Diego-Envios-Entregables pendiente, ocr-tablero, daily-digest) pasa a ser una tool descubrible por Diego.

Trade-off: SSE / Streamable HTTP es lo único soportado nativamente; stdio no aplica en n8n hospedado. Esto es coherente con el spec 2025-11-25 que deprecia HTTP+SSE puro en favor de Streamable HTTP.

### 1.5 WhatsApp + voz: el caso especial

WhatsApp Cloud API (Meta) no se conecta como otros SaaS — requiere webhook signing y manejo de session windows de 24h. La EF `dieguito-whatsapp` ya existe en Reciclean pero no está orquestada con `diego-chat-process`. El patrón 2026 ([hookdeck.com, 2026](https://hookdeck.com/blog/hookdeck-review-march-2026)):

```
WhatsApp Cloud → Hookdeck (event gateway, retry+signing) → 
  diego-chat-process (sesión IA) → respuestas → 
  dieguito-whatsapp (envío) → WhatsApp Cloud
```

Hookdeck garantiza 99.999% uptime y <3s de latencia para 99% de eventos a 5.000 eventos/seg. Para volumen Reciclean actual (no verificado, estimado <100 msgs/día) es overkill, pero la arquitectura es la correcta para Plan 2026 SaaS.

---

## 2. API unificada (single endpoint)

### 2.1 Por qué un solo endpoint mata 12 SDKs

El estándar 2026 para chatbots empresariales colapsa todas las integraciones detrás de **un solo plano de control**. No es ergonomía: es la única forma de aplicar políticas (rate limits, auth, observabilidad, PII redaction) sin reescribir 12 SDKs cada vez que cambia una regla.

Patrones canónicos:

1. **AI Gateway pattern** — proxy LLM + tool routing. Referente: **Kong AI Gateway** ([konghq.com, 2026](https://konghq.com/products/kong-ai-gateway)). 60+ features AI: semantic caching, semantic routing, PII sanitization (20 categorías, 9 idiomas), agent-to-agent governance, MCP exposure.
2. **Unified API pattern** — un solo schema cubre N proveedores del mismo dominio. Referente: **Merge.dev** (HRIS/ATS/CRM/Accounting), **Nango** (3.000+ APIs unificadas para agentes).
3. **GraphQL Federation** — composición declarativa de schemas independientes en un supergraph. Referente: **Apollo Federation v2** + Hasura DDN ([apollographql.com, 2026](https://www.apollographql.com/)).
4. **MCP Gateway** — orquesta múltiples MCP servers detrás de una sola URL. Referente: **Composio MCP**, **Cloudflare Code Mode**.

### 2.2 Kong AI Gateway: el patrón empresarial 2026

Kong unifica tráfico **LLM + MCP + A2A (agent-to-agent)** detrás del mismo plano de control. Una sola URL recibe llamadas a OpenAI, Anthropic, Gemini, Bedrock, Azure AI, Databricks, Mistral o HuggingFace — el routing es transparente al cliente. Funcionalidades 2025-2026:

| Función | Qué hace | Por qué importa a Diego |
|---|---|---|
| Universal LLM API | Cambiar de OpenAI a Claude sin tocar código | Diego hoy usa OpenAI hard-coded; cambiar a Claude requiere reescribir EF |
| Semantic caching | Cache por similitud semántica de prompts | Reduce 30-60% costo LLM en workloads repetitivos |
| Semantic routing | Routea prompts simples a modelo barato, complejos a modelo top | Optimización costo-calidad por turno |
| PII sanitization | Detecta y redacta PII en 9 idiomas, 20 categorías | RUT, teléfono, email, dirección de clientes Reciclean |
| Rate limiting per-token | No solo req/s, también tokens/min por consumidor | Control real de costo OpenAI |
| MCP gateway | Expone múltiples MCP servers en un endpoint | Plano único de control |

Trade-off: Kong es **infrastructure**, no SaaS. Requiere alguien que lo opere. Para Reciclean hoy, **Composio MCP Gateway o Pipedream MCP** son alternativas SaaS equivalentes funcionalmente para los puntos 1, 4, 6.

### 2.3 GraphQL Federation: cuando hay múltiples backends de negocio

El patrón Apollo Federation v2 / Hasura DDN tiene sentido cuando hay 3+ backends de dominio distintos y los clientes (Diego, Panel RDO, futura app mobile) necesitan vistas que crucen dominios. Estructura:

```
Cliente → Gateway federado → subgraph_cartera (Supabase)
                          → subgraph_rep (Supabase + Sercot)
                          → subgraph_tesoreria (Supabase + banco)
                          → subgraph_monday (Monday GraphQL)
```

Beneficio: el cliente hace **una** query GraphQL que toca 4 sistemas; el gateway resuelve la composición. Para AI agents, el gateway expone introspección via MCP automáticamente: Diego "ve" el supergraph como un solo conjunto de tools tipados.

Trade-off: complejidad operativa alta. Para Reciclean hoy (1 Postgres + N SaaS) no se justifica. Es el patrón correcto si en Plan 2026 se materializa el SaaS multi-tenant con clientes externos.

### 2.4 Patrón realista Diego v6 → v7: tres planos

Recomendación arquitectónica explícita para los próximos 12 meses:

| Plano | Componente | Estado actual | Próximo paso |
|---|---|---|---|
| Datos | Supabase Postgres + Storage | Activo, 78 migraciones | Mantener como source of truth para datos propios |
| Integraciones | Composio MCP o Pipedream MCP | No existe | P1.5: registrar Gmail + Monday + Calendar |
| Workflows | n8n self-hosted | Existe, no orquestado | P1.6: workflow Diego-Envios-Entregables → server MCP |

Diego v7 = `diego-chat-process` (host) → 3 MCP clients (Supabase, Composio, n8n) → N capabilities. Cero hard-coding de tools en EF.

---

## 3. Single source of truth (una sola verdad)

### 3.1 La pregunta canónica: ¿quién manda cuando dos sistemas discrepan?

En 2026 el debate "data lake vs data warehouse" terminó. El consenso es **lakehouse** con arquitectura medallion (Bronze/Silver/Gold) ([databricks.com, 2026](https://www.databricks.com/blog/data-lakes-vs-data-warehouses-what-your-organization-needs-know)). Pero el **patrón organizacional** dominante para empresas con múltiples dominios es **Data Mesh** (Zhamak Dehghani) — cada dominio es dueño de su producto de datos, expone contratos versionados, y la "verdad" se define por dominio, no global.

Aplicado a Reciclean:

| Dominio | Sistema de origen (canónico) | Sistemas espejo (derivados) | Quién es dueño |
|---|---|---|---|
| Cliente | Supabase `curated.clientes_categoria` | Monday CRM, Gmail labels | Dusan / Cony |
| Precio material | Supabase `v_precios_activos` | Widgets reciclean.cl / farex.cl | Dusan / Pablo |
| Cartera operativa | Supabase `curated.vw_cartera_detalle` | Excel mensual Cony | Dusan |
| Tesorería | Supabase `panel.v_tesoreria_ultimo` | Bancos (manual) | Dusan / Dyana |
| Tareas / cola | Supabase `panel.diego_bandeja` | Monday tableros | Dusan / Pablo |
| Compromisos / calendario | Supabase (a definir) | Google Calendar | Dusan |
| Documentos | Supabase Storage `diego-chat-files` + buckets RDO | Google Drive (Dyana) | Dusan / Dyana |

Regla práctica: **si dos sistemas dicen cosas distintas, gana el dominio dueño**. Diego debe saber qué sistema es canónico para cada dato y nunca reportar el espejo como verdad.

### 3.2 Lakehouse + medallion para datos de análisis

Para análisis (no transaccional), el patrón 2026 es Databricks-style:

- **Bronze**: raw, append-only, formato Delta/Iceberg/Hudi. Para Reciclean: feeds OCR de tableros, exports de Impulsa, snapshots de Monday.
- **Silver**: limpieza, deduplicación, conformación de esquemas. Equivale al schema `staging` actual de Reciclean.
- **Gold**: agregados de negocio, optimizados para consulta. Equivale al schema `curated` actual.

Diego debe leer **únicamente Gold** para responder al usuario. Bronze/Silver son territorio de pipelines, no del agente.

### 3.3 Reverse ETL: cuando la verdad tiene que volver al SaaS

Hightouch y Census popularizaron en 2023-2025 el patrón **Reverse ETL** — la verdad vive en el warehouse, pero hay que copiarla de vuelta a Salesforce/HubSpot/Monday porque ahí trabajan los humanos. Para Diego esto se traduce:

```
Supabase (verdad) → Reverse ETL job → Monday CRM (espejo operativo del equipo)
                                    → Gmail labels (clientes activos)
                                    → Calendar (compromisos firmados)
```

Diego **lee** del SaaS cuando el humano acabó de tocar algo ahí, pero **escribe** siempre al Supabase. La sincronización Supabase → SaaS la hace el reverse ETL (puede ser n8n) o un sync engine bidireccional (sección 4).

### 3.4 Event sourcing + CDC para auditoría irrefutable

Para datos financieros, contratos, decisiones firmadas: **append-only event log**. Cada cambio es un evento inmutable; el estado se deriva. Patrón:

```
EVENTO: panel.diego_decisiones_firmadas (append-only)
  → proyección: curated.decisiones_vigentes (materializada)
  → proyección: panel.audit_decisiones (lectura)
```

Combinado con **Change Data Capture (CDC)** via PostgreSQL logical replication (PG17 nativo), cada INSERT/UPDATE/DELETE genera un evento WAL que Supabase Realtime emite, y herramientas como Debezium o Supabase ETL (Rust framework oficial) pueden streamearlo a Kafka/NATS/data lake ([supabase.com, 2026](https://supabase.com/docs/guides/database/replication), [github.com/supabase/etl, 2026](https://github.com/supabase/etl)).

---

## 4. Sincronización bidireccional en tiempo real

### 4.1 Supabase 2026: replicación lógica nativa PG17

Hasta 2025 Supabase Realtime usaba triggers + `wal2json`, lo cual agregaba ~10-15% de latencia a writes ([johal.in, 2026](https://johal.in/architecture-teardown-supabase-2026-realtime-works-using-postgresql/)). El cambio arquitectónico clave del 2026 es **logical replication nativa de PostgreSQL 17**:

- `filter_row` declarativo a nivel de publicación (no se mueve data inútil al cliente).
- `output_json` formatea los cambios como JSON estructurado directamente en el WAL reader (sin post-procesado).
- Captura de cambios **sin trigger overhead** — lectura directa del WAL.

Implicancia para Diego v6: el proyecto `eknmtsrtfkzroxnovfqn` corre PG 17.6 (verificado). La capa Realtime ya está en condiciones técnicas de hacer push real-time de cambios curados al frontend `panel-rdo.html` sin reescribir lógica de aplicación. Diego puede suscribirse a `panel.diego_bandeja` y reaccionar en milisegundos a nuevos pendientes.

### 4.2 El espectro de patrones de sync

| Patrón | Latencia | Garantía | Casos de uso Diego |
|---|---|---|---|
| Request-response (lo que hace hoy) | RTT de la query | Consistencia inmediata por lectura | Consultar precio, cartera |
| WebSocket subscribe (Supabase Realtime) | <100ms | Eventual | Bandeja, alertas activas |
| Server-Sent Events (SSE) | <500ms | Eventual | Streaming respuestas LLM |
| Kafka / NATS JetStream | <50ms en cluster | At-least-once / exactly-once | Bus inter-servicios (no aplica todavía) |
| Logical replication | <100ms | Ordering garantizado | Espejos analíticos Bronze/Silver/Gold |
| CDC con Debezium | <500ms | At-least-once | Espejo Supabase → data lake externo |

### 4.3 Conflict resolution: cuando dos lados escribieron lo mismo

El patrón 2026 reconocido para agentes que escriben en múltiples sistemas ([fordelstudios.com, 2026](https://fordelstudios.com/research/real-time-data-sync-patterns)):

| Estrategia | Cuándo aplica | Riesgo |
|---|---|---|
| **Last-Write-Wins (LWW)** | Datos no críticos, eventual consistency aceptable | Pérdida silenciosa de updates |
| **CRDTs** (Yjs, Automerge, Replicache) | Edición colaborativa, contadores, sets | Sólo aplica a estructuras CRDT-modeladas |
| **Vector clocks** | Auditoría de orden de operaciones | Overhead de metadata |
| **Manual reconciliation** | Datos financieros, contratos | Requiere UI de revisión |
| **Source-of-truth wins** | Dominios con dueño claro | Recomendado para Reciclean |

Recomendación Diego: **source-of-truth wins** para el 95% de los casos (sección 3.1 define quién es dueño) + **manual reconciliation con bandeja firma** para tesorería / decisiones / contratos.

### 4.4 Local-first y offline-first

Cuando el agente o el cliente debe operar sin red (escenario operativo Reciclean en terreno):

- **ElectricSQL**: replica Postgres → SQLite local, CRDT-based conflict resolution, Postgres como source of truth ([electric-sql.com, 2026](https://queryplane.com/docs/blog/electricsql-vs-powersync-vs-replicache)).
- **Replicache**: persistencia local + replay de mutations al recuperar conectividad.
- **PowerSync**: alternative comercial, modelo similar.

Aplicación Diego v6: hoy el panel RDO es 100% online. Para una app de terreno (asistente comercial) que opere offline en sucursales con conectividad débil (Talca, Puerto Montt cuando se habilite), ElectricSQL es el patrón canónico — sin reescribir el modelo de datos.

### 4.5 Event gateway: el componente que falta en Diego v6

Hoy `diego-chat-process` recibe input por HTTP del frontend. Cualquier evento externo (webhook de Monday, mail entrante, mensaje WhatsApp) no llega a Diego salvo que el usuario explícitamente lo dispare. Patrón 2026:

```
WhatsApp / Gmail / Monday webhook → Hookdeck (event gateway con retry + signing)
                                  → Inngest (durable task runtime con retries tipados)
                                  → diego-chat-process (procesa con contexto)
                                  → Supabase / SaaS / WhatsApp respuesta
```

Hookdeck (event gateway) + Inngest o Trigger.dev (durable workflows) es el combo recomendado para 2026 ([inngest.com, 2026](https://www.inngest.com/ai), [trigger.dev, 2026](https://trigger.dev/)). Trade-off: agrega dos vendors. Alternativa "todo n8n" es viable para volumen Reciclean actual; el split Hookdeck+Inngest empieza a justificarse arriba de 10k eventos/día.

---

## 5. Plugins y extensiones (capabilities)

### 5.1 Tres modelos de extensión: GPT Actions, MCP, Skills

A mayo 2026 conviven tres modelos para extender un asistente con capacidades nuevas ([quickchat.ai, 2026](https://quickchat.ai/post/gpt-actions-vs-mcp), [skills.vibeprospecting.ai, 2026](https://skills.vibeprospecting.ai/blog/chatgpt-plugins-vs-claude-skills-comparison)):

| Modelo | Vendor | Ámbito | Trade-off principal |
|---|---|---|---|
| **OpenAI GPT Actions** | OpenAI | Custom GPTs, OpenAPI-based | Vendor lock-in. No reutilizable con Claude/Gemini |
| **Anthropic MCP** | Open (Anthropic-driven) | Cualquier host MCP-compatible | Auth spec aún evolucionando |
| **Claude Skills** | Anthropic | Markdown + bash dentro de Claude | Más simple, menos potente que MCP |
| **ChatGPT Plugins (legacy)** | OpenAI | Descontinuado 2024 | No relevante |

Recomendación 2026: **MCP como protocolo base**, GPT Actions sólo si Diego se distribuye también como Custom GPT (no es el caso hoy), Skills para extensiones cortas de prompt/tooling sin lógica de servidor.

### 5.2 Capability negotiation: cómo Diego descubre qué puede hacer

El spec MCP 2025-11-25 formaliza:

- `tools/list` — server enumera las tools disponibles, con JSON Schema de input/output.
- `resources/list` — server enumera recursos legibles (archivos, vistas, queries pre-armadas).
- `prompts/list` — server expone templates de prompts compuestos.
- `sampling` — el server puede pedirle al host que llame al LLM (capability inversa).
- `elicitation` (nuevo 2025-11-25) — el server pide al usuario más info mid-flight.
- `tasks` (nuevo 2025-11-25) — server registra trabajos asíncronos con polling de status.

Para Diego v6 esto cambia el modelo mental: hoy un tool es un endpoint estático. En MCP, Diego al iniciar sesión hace handshake con cada server, descubre dinámicamente qué tools existen, y la respuesta del LLM se construye sobre el catálogo descubierto. Agregar funcionalidad = encender un server MCP nuevo (zero deploy de EF).

### 5.3 Sandboxing: Cloudflare Dynamic Workers y "Code Mode"

El patrón 2026 más interesante para correr plugins de terceros con seguridad ([blog.cloudflare.com, 2026](https://blog.cloudflare.com/dynamic-workers/), [blog.cloudflare.com, 2026](https://blog.cloudflare.com/code-mode/)):

- **Dynamic Workers** (GA abril 2026): isolates V8, start en ms, 100x más rápidos que containers, 10-100x más memory-efficient. Capability model: el worker arranca con **zero ambient authority** — sólo lo que el harness le expone explícitamente vía RPC Cap'n Web.
- **Code Mode**: en vez de obligar al LLM a hacer múltiples `tools/call` secuenciales, el LLM **escribe código TypeScript** contra una API tipada (generada desde el spec MCP), y el código corre en un Dynamic Worker. Resultado: 81% reducción de tokens, ejecución composable, paralelismo natural.

Implicancia Diego v7+: en vez de "Diego llama tool A, recibe, llama tool B, recibe, llama tool C", Diego escribe un bloque TS que hace las 3 cosas en orden + maneja el error caso C falla. Es estrictamente superior cuando la tarea requiere más de 3 tool calls.

Trade-off: requiere infraestructura Cloudflare (no es el stack actual). Patrón aspiracional, no inmediato.

### 5.4 Versionado y compatibilidad

MCP spec define `protocolVersion` en el handshake. Si client soporta `2025-11-25` pero server sólo `2025-06-18`, negocian a la versión común más alta. Esto es crítico para Reciclean a futuro: cada server MCP que se conecte (Composio, Pipedream, n8n, custom) puede estar en versiones distintas — el protocolo gestiona la compatibilidad.

Para tools propios: usar `name@version` semántico. Una tool `consultar_precio_material@1.2.0` rompiendo schema pasa a `@2.0.0` con coexistencia temporal. Diego elige por capacidad declarada, no por nombre.

---

## 6. Observabilidad de integraciones

### 6.1 OpenTelemetry GenAI: el estándar 2026 indiscutido

A inicios 2026 la convergencia es total: **OpenTelemetry GenAI Semantic Conventions** (v1.37+) es el estándar para instrumentar LLMs, agents, tools y sessions ([opentelemetry.io, 2026](https://opentelemetry.io/blog/2026/genai-observability/), [zylos.ai, 2026](https://zylos.ai/research/2026-02-28-opentelemetry-ai-agent-observability)). Vendors que ya soportan nativamente: **Datadog, Honeycomb, New Relic, Grafana**. Frameworks que emiten spans OTel nativamente: **LangChain, CrewAI, AutoGen, AG2**.

Atributos obligatorios por span GenAI (subset):

- `gen_ai.system` — `anthropic` / `openai` / `vertex_ai`
- `gen_ai.request.model` — `gpt-4o-mini` / `claude-opus-4-7`
- `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`
- `gen_ai.tool.name`, `gen_ai.tool.call.id`
- `gen_ai.conversation.id` — para correlacionar turns de la misma sesión
- `gen_ai.agent.id` — quién ejecutó (Diego v6, Dieguito, etc.)

### 6.2 Datadog vs Honeycomb: trade-offs reales 2026

| Dimensión | Datadog LLM Observability | Honeycomb |
|---|---|---|
| Soporte OTel GenAI | Nativo (v1.37+) | Nativo + BubbleUp para high-cardinality |
| Pricing | Por host + por GB ingesta | Por evento + por usuario |
| Fortaleza | APM full-stack (DB, HTTP, LLM en un solo pane) | Trace querying de alta cardinalidad, debugging exploratorio |
| Debilidad | Caro a escala | No tiene infra-monitoring nativo |
| Quién lo usa | Enterprise SaaS | Equipos de plataforma data-driven |
| Aplicación Diego | Si futuro multi-tenant | Hoy es overkill |

Para Reciclean hoy, **OpenTelemetry SDK + colector → Grafana Cloud Free tier** (no verificado para Pablo) cubre 100% de necesidades sin costos por encima de USD 0/mes para volumen actual.

### 6.3 Quality-of-Service por integración

Cada integración externa necesita su propio contrato de QoS ([fast.io, 2026](https://fast.io/resources/best-webhook-platforms-ai-workflows/)):

| Patrón | Implementación 2026 | Cuándo usar |
|---|---|---|
| **Rate limit per consumer** | Kong AI Gateway, Cloudflare WAF | Toda integración con SaaS |
| **Retry budget** | Inngest, Trigger.dev, Hookdeck | Operaciones idempotentes |
| **Circuit breaker** | Resilience4j, Hystrix-style en EF | Llamadas a sistemas con falla histórica |
| **Bulkhead** | Pool de conexiones separado por integración | Aislar fallas de un SaaS |
| **Timeout cascade** | Timeout por capa, más estricto hacia adentro | Toda llamada |
| **Idempotency keys** | UUID por request, dedupe server-side | Writes (registrar tarea, agendar compromiso) |

Diego v6 hoy: no hay circuit breakers, no hay retry budget, no hay idempotency keys. Una falla de OpenAI cae directo al usuario. Este es el gap operativo más urgente de cerrar.

### 6.4 Tres dashboards que un chatbot empresarial necesita

| Dashboard | Métricas | Audiencia |
|---|---|---|
| **Salud técnica** | Latencia p50/p95/p99 por tool, tasa de error, tokens/turno, costo USD/día | Pablo |
| **Calidad de respuestas** | Thumbs up/down por turno, tasa de "no sé", queries que no encontraron tool | Dusan |
| **Adopción y uso** | DAU, conversations/user/day, top intents, tools no utilizados | Dusan + Pablo |

Datadog cubre los 3 con LLM Observability. Honeycomb cubre 1 muy bien. Para Diego v6 una solución pragmática es **vista materializada en Supabase** que agregue logs de `diego-chat-process` + emitir spans OTel a Grafana Cloud para 1.

---

## 7. Anti-patrones comunes 2026

Lo que **no se debe hacer** en 2026, según los informes de fallos productivos publicados por Composio, Merge y Inngest sobre AI Agent pilots que no llegaron a producción ([composio.dev, 2026](https://composio.dev/blog/why-ai-agent-pilots-fail-2026-integration-roadmap)).

### 7.1 Anti-patrón: "Diego escribe directo al SaaS porque OAuth es fácil"

**Síntoma**: el agente tiene credenciales hard-coded o tokens de servicio con scopes amplios, escribe directo a Monday/Gmail.

**Por qué falla**:
- Cero auditoría de qué hizo el agente vs qué hizo un humano.
- Refresh token expira un domingo a las 3am, Diego cae en silencio el lunes.
- Cambio de password del usuario humano = todo el flujo se rompe.
- Compliance audit pide "¿qué leyó el LLM de Gmail?": no hay log.

**Patrón correcto**: OAuth gestionado por terceros (Composio / Pipedream / Nango / Merge), agente recibe **handle opaco**, nunca toca el token. Cada llamada queda logueada en el gateway.

### 7.2 Anti-patrón: "Le ponemos retry infinito y listo"

**Síntoma**: cada falla de tool dispara reintentos sin límite. Cuando OpenAI tiene un incidente regional, Diego inicia 47 reintentos por sesión y agota cuota.

**Patrón correcto**: **retry budget** + **circuit breaker**. Inngest y Trigger.dev implementan esto nativamente — máximo N reintentos por unidad de tiempo, después de M fallos consecutivos el circuit abre 60s y deja pasar 1 request canario.

### 7.3 Anti-patrón: "Sync bidireccional con LWW para todo"

**Síntoma**: Diego sobrescribe en Monday lo que Cony acaba de editar a mano porque su versión en Supabase es 200ms más nueva.

**Patrón correcto**: definir **source of truth por dominio** (sección 3.1), reverse ETL unidireccional para espejos, conflict UI para dominios financieros.

### 7.4 Anti-patrón: "Polling cada 30 segundos a 12 SaaS"

**Síntoma**: 12 integraciones × 1 poll cada 30s = 1.440 calls/hora a APIs externas, mayoría devuelve "nada nuevo".

**Patrón correcto**: webhooks vía Hookdeck. El estudio Fastio 2026 reporta que webhook-driven workflows reducen 90% la latencia vs polling y dejan de gastar rate limits ([fast.io, 2026](https://fast.io/resources/best-webhook-platforms-ai-workflows/)).

### 7.5 Anti-patrón: "Logs en CloudWatch porque ya lo tenemos"

**Síntoma**: imposible correlacionar un turno de conversación Diego con la tool call que falló porque están en logs separados y sin trace_id común.

**Patrón correcto**: OTel context propagation. Cada turn tiene un `gen_ai.conversation.id` y un `trace_id`; toda llamada interna (Supabase, OpenAI, tools MCP) hereda el trace_id. Un solo query en Datadog/Honeycomb/Grafana reconstruye la sesión completa.

### 7.6 Anti-patrón: "El chatbot es el frontend único de todo"

**Síntoma**: Diego responde precios, agenda compromisos, registra tareas, firma decisiones, sube fotos — todo desde el FAB. Cada agregado de funcionalidad rompe los otros.

**Patrón correcto**: el chatbot es **una superficie más** sobre el bus de integración. Panel RDO, app de terreno, widget público y Diego comparten los mismos MCP servers / unified API. Diego no es la API; Diego es **un cliente** de la API.

---

## 8. Matriz de decisión por tamaño de equipo

Patrón recomendado depende de cuántos ingenieros pueden mantener la arquitectura. Reciclean hoy: 1 Pablo + 1 Reinaldo externo + IA agents. Realista.

| Equipo backend | Recomendación 2026 | Por qué |
|---|---|---|
| **1-2 ingenieros** (caso Reciclean) | Supabase + n8n + Composio MCP + Inngest + Grafana Cloud Free | Cero infra propia. Vendors gestionan la complejidad. Costo USD <300/mes |
| **3-8 ingenieros** | + Kong AI Gateway self-hosted + Hookdeck + Datadog APM | Empieza a tener sentido controlar el plano de datos y observabilidad full-stack |
| **9-30 ingenieros** | + Lakehouse propio (Databricks/Snowflake) + Apollo Federation + custom MCP servers in-house | Multi-dominio con dueños separados, data mesh real |
| **30+ ingenieros** | + service mesh (Istio/Linkerd) + multi-region + event sourcing dedicado | Compliance enterprise, SLAs externos |

Sobre-arquitectura es el riesgo dominante para equipos chicos. Reciclean no necesita Kafka, no necesita Databricks, no necesita Datadog enterprise.

### 8.1 Indicadores para "subir de nivel"

Cuándo un equipo de 1-2 ingenieros debe pasar al siguiente nivel:

- Más de 3 integraciones SaaS productivas concurrentes.
- Volumen >10k eventos webhook/día.
- Más de 1 vez por mes "OpenAI cayó y arrastró Diego".
- Auditoría externa pide trace cross-system de una decisión.
- Costo OpenAI mensual >USD 500 sin caching.

Reciclean actualmente: 0 de 5 indicadores. **Permanecer en el nivel 1 es la decisión correcta**.

### 8.2 Indicadores para SaaS multi-tenant (Plan 2026)

Cuando el Plan 2026 materialice el SaaS para terceros, los disparadores son:

- Primer cliente externo paga (no Reciclean ni Farex ni SERCOT).
- Aparece la palabra "SLA" en un contrato.
- Aparece la palabra "DPA" o "GDPR" en un contrato.
- Cliente externo quiere "su" instancia / "sus" credenciales.

En ese momento se justifica Kong AI Gateway, Datadog, audit logging completo, RLS de tenant + organization en cada query.

---

## 9. Blueprint de migración Diego v6 → v7

Plan de ataque incremental, sin big-bang. Cada fase entrega valor independiente. Cada fase deja al sistema mejor que antes (no genera "mientras tanto no funciona").

### Fase 0 — Preparación declarativa (esta semana · sin Pablo)

Quick-wins de la sección final. Sólo prompt + `panel.config_ui`. Esfuerzo: 1-2 días de Diego trabajando solo.

- Tabla `panel.config_ui.integraciones_v1` con catálogo de integraciones (existentes y pendientes).
- Tabla `panel.config_ui.sot_v1` con dueños por dominio.
- Tabla `panel.config_ui.diego_capabilities_v1` con las 7 tools versionadas.
- Tabla `panel.config_ui.bandeja_integracion_v1` para registrar pedidos no atendibles aún.
- Bloque PII redaction en `DIEGO-PROMPT-MAXIMO.md`.

**Entrega**: Diego responde con honestidad sobre qué puede y qué no, registra promesas, reduce exposición PII básica.

### Fase 1 — Observabilidad (1-2 semanas · Pablo light)

Instrumentar `diego-chat-process` con OpenTelemetry. Sin cambiar lógica, solo agregar spans.

- Span por turn de conversación con `gen_ai.conversation.id`.
- Span por cada tool call con `gen_ai.tool.name`.
- Span por cada llamada Supabase con SQL + duración.
- Export OTLP → Grafana Cloud (free tier hasta 50GB/mes).
- Dashboard de 3 paneles: latencia por tool, errores por tool, costo USD/día.

**Entrega**: visibilidad total de qué hace Diego. Base para decisiones futuras data-driven.

### Fase 2 — Resiliencia (2-3 semanas · Pablo medio)

- Idempotency keys en writes (tarea_cola, agendar_compromiso).
- Retry budget por tool con backoff exponencial (3 reintentos máx, 1s/4s/16s).
- Circuit breaker: 5 fallos consecutivos → abrir 60s → 1 canario.
- Timeout por capa: 30s LLM, 10s tool call, 5s Supabase.

**Entrega**: caídas de OpenAI / Supabase / SaaS dejan de cascar a usuarios. Diego responde "no disponible ahora, registro tu pedido y vuelvo" en vez de pelota negra.

### Fase 3 — MCP Gateway gestionado (3-4 semanas · Pablo serio)

Migrar integraciones long-tail a Composio MCP (o Pipedream MCP, decisión Dusan).

- Composio account + workspace Reciclean.
- Conectar Gmail OAuth `sistemas@gestionrepchile.cl`.
- Conectar Monday.com (token + workspace P1.5).
- Conectar Google Calendar (cuenta corp).
- Conectar WhatsApp Cloud (orquestar con dieguito-whatsapp existente).
- Modificar `diego-chat-process` para descubrir tools vía MCP `tools/list` además del whitelist actual (coexisten 6 meses).

**Entrega**: Diego deja de mentir sobre "no puedo enviar mail" — efectivamente envía, agenda, postea en Monday. Cero código de OAuth en el repo Reciclean.

### Fase 4 — Event-driven (4-6 semanas · Pablo serio)

- Hookdeck en frente de webhooks entrantes (WhatsApp, Monday, Gmail).
- Inngest o Trigger.dev para tasks durables (envío de entregables, daily-digest pesados).
- Suscripción Realtime PG17 desde panel-rdo.html para `panel.diego_bandeja`.
- n8n MCP Server Trigger para 3-4 workflows productivos (Diego-Envios-Entregables, ocr-tablero, daily-digest).

**Entrega**: Diego reacciona a eventos externos sin que el usuario tenga que disparar nada. Bandeja se actualiza en tiempo real. Workflows n8n descubribles como tools.

### Fase 5 — Optimización LLM (cuando aplique)

Aplicar sólo si costo OpenAI mensual supera USD 500.

- Kong AI Gateway self-hosted (o Cloudflare AI Gateway managed).
- Semantic caching para queries repetitivas (precios, cartera).
- Semantic routing: queries simples a `gpt-4o-mini`, queries complejas a `claude-opus-4-7`.
- PII sanitization automática en gateway (no en prompt).

**Entrega**: reducción 30-60% costo LLM, PII redaction enterprise-grade, capacidad de cambiar modelo sin tocar código.

### Resumen de timeline

| Fase | Duración | Quién | Costo nuevo | Beneficio acumulado |
|---|---|---|---|---|
| 0 | 1-2 días | Diego solo | USD 0 | Honestidad + bandeja promesas |
| 1 | 1-2 semanas | Pablo light | USD 0 (Grafana Free) | Observabilidad total |
| 2 | 2-3 semanas | Pablo medio | USD 0 | Resiliencia |
| 3 | 3-4 semanas | Pablo serio | USD ~50-150/mes (Composio) | Integraciones reales con SaaS |
| 4 | 4-6 semanas | Pablo serio | USD ~50/mes (Hookdeck + Inngest) | Event-driven |
| 5 | Cuando aplique | Pablo serio | USD ~200/mes (Kong / Cloudflare AI) | Optimización avanzada |

**Total año 1 si se ejecuta todo**: USD 3.000-5.000/año en SaaS + tiempo Pablo. Sin contratar nadie nuevo.

---

## 10. Seguridad de integraciones — checklist 2026

Estándar mínimo aceptable para un chatbot empresarial que toca datos de clientes en 2026.

### 10.1 Autenticación

- [ ] Cero credenciales hard-coded en código fuente (verificado por scan automático en CI).
- [ ] OAuth para SaaS (Gmail, Monday, Calendar, WhatsApp) — nunca passwords ni tokens long-lived.
- [ ] Token refresh automático gestionado (Composio/Pipedream/Nango).
- [ ] RLS de Supabase activa en TODAS las tablas que toca Diego (52+ políticas ya existen).
- [ ] Service role key de Supabase usado solo en EFs, nunca en frontend.

### 10.2 Autorización

- [ ] Principle of least privilege: cada MCP server expone solo capabilities mínimas necesarias.
- [ ] Whitelist de vistas para NL→SQL (no SELECT genérico a `public.*`).
- [ ] Idempotency keys en writes para evitar duplicados por reintentos.
- [ ] Capability per-user: Diego no escribe en bandeja del CEO si lo invocó un operador.

### 10.3 Datos en tránsito

- [ ] TLS 1.3 en todas las llamadas (default en Supabase, Vercel, OpenAI).
- [ ] PII redaction antes de exponer prompt a LLM externo (regex básico Fase 0 + gateway Fase 5).
- [ ] Webhook signatures verificadas (HMAC) para entrantes (Hookdeck lo hace).

### 10.4 Datos en reposo

- [ ] Storage encryption at rest (default Supabase Storage).
- [ ] Backups automáticos diarios (default Supabase).
- [ ] Soft-delete con `deleted_at` en tablas críticas (auditoría).

### 10.5 Auditoría

- [ ] Append-only event log para decisiones firmadas (`panel.diego_decisiones_firmadas`).
- [ ] Trace OTel por turn con `gen_ai.conversation.id` (Fase 1).
- [ ] Log de qué SaaS escribió Diego y cuándo (via gateway).
- [ ] Retención de logs: 90 días mínimo para compliance básico, 7 años para tesorería.

### 10.6 Incident response

- [ ] Runbook documentado: "OpenAI cae" / "Supabase cae" / "SaaS X cae".
- [ ] Kill-switch global de Diego (config en `panel.config_ui.diego_enabled` boolean).
- [ ] Notificación a Pablo en circuit-breaker abierto (Inngest webhook).

Estado Diego v6: 8/22 ítems cumplidos. La mayoría son default Supabase/Vercel.

---

## 11. Glosario operativo

| Término | Definición operativa |
|---|---|
| **MCP** | Model Context Protocol. Estándar abierto Anthropic 2024 para que LLMs hablen con tools/data sources. JSON-RPC 2.0 sobre stdio o HTTP. |
| **MCP Server** | Proceso que expone tools, resources, prompts. Uno por dominio. |
| **MCP Client** | Conexión 1:1 con un MCP Server dentro de un host. |
| **MCP Host** | Aplicación que ejecuta el LLM y gestiona múltiples MCP Clients. Para Reciclean: `diego-chat-process`. |
| **Tool (MCP)** | Función invocable por el LLM. Tiene name, description, JSON Schema de input. |
| **Resource (MCP)** | Dato legible (archivo, vista, query). Sin side-effects. |
| **Prompt (MCP)** | Template de prompt parametrizable, expuesto por server. |
| **Capability negotiation** | Handshake inicial donde client/server acuerdan qué versión y qué features del protocolo soportan. |
| **A2A** | Agent-to-Agent. Protocolo para que agentes hablen entre sí. Apoyo creciente 2026, Kong AI Gateway lo soporta. |
| **AI Gateway** | Proxy unificado para LLMs + tools + observability. Referente: Kong AI Gateway. |
| **Unified API** | API normalizada que cubre N proveedores del mismo dominio (ej: Merge unifica HRIS de 50 proveedores en un schema). |
| **CDC** | Change Data Capture. Capturar cambios de una DB (vía WAL en Postgres) y propagarlos. Logical replication es la implementación canónica PG17. |
| **Reverse ETL** | Mover datos del warehouse (verdad) de vuelta al SaaS operativo (espejo). Hightouch, Census. |
| **CRDT** | Conflict-free Replicated Data Type. Estructura que se merge sin conflictos. Usado en local-first sync (ElectricSQL, Yjs). |
| **Last-Write-Wins (LWW)** | Estrategia de conflict resolution: gana el write más reciente. Simple pero pierde data silenciosamente. |
| **Idempotency key** | UUID único por request que permite al server dedupear reintentos del mismo request. |
| **Circuit breaker** | Patrón: tras N fallos consecutivos, "abrir" el circuito 60s para no martillar el sistema caído. |
| **Retry budget** | Límite máximo de reintentos por unidad de tiempo. Evita storms de retry. |
| **Bulkhead** | Aislar pools de conexiones por integración para que falla de una no se propague. |
| **Event sourcing** | Persistir cambios como secuencia inmutable de eventos; el estado se deriva. |
| **Data Mesh** | Patrón organizacional: cada dominio es dueño de su producto de datos. Zhamak Dehghani. |
| **Lakehouse** | Arquitectura unificada de data lake + warehouse. Databricks, Snowflake, Fabric. |
| **Medallion architecture** | Bronze (raw) / Silver (clean) / Gold (curated). Patrón Databricks. |
| **OpenTelemetry** | Estándar abierto para telemetría (traces, metrics, logs). GenAI Semantic Conventions v1.37+ cubren LLMs. |
| **Trace context propagation** | Pasar trace_id entre servicios para reconstruir flujos cross-system. |
| **Code Mode (Cloudflare)** | LLM escribe código TS contra API tipada en vez de hacer tool calls secuenciales. 81% menos tokens. |
| **Isolate** | Sandbox V8 (Cloudflare Workers). Start en ms, 100x más rápido que container. |
| **Streamable HTTP** | Transport MCP 2025-11-25, reemplaza HTTP+SSE legacy. |
| **Elicitation (MCP)** | Server pide al usuario más input mid-flight. |
| **Tasks (MCP)** | Trabajos async con polling de status, nuevo en spec 2025-11-25. |
| **PII** | Personally Identifiable Information. En Chile: RUT, dirección, teléfono, email. |

---

## Brechas vs Diego v6 actual

Las 10 brechas más importantes contra el estándar 2026. Severidad: A (estructural), B (alta), C (media).

| # | Brecha | Estado Diego v6 | Estándar 2026 | Severidad | Esfuerzo |
|---|---|---|---|---|---|
| 1 | Tools hard-coded en EF | Whitelist de 7 tools en 659 líneas TS | MCP servers descubribles en runtime | A | Alto (Pablo) |
| 2 | No hay event-driven sync | Sólo request-response | Hookdeck + Inngest o n8n MCP server trigger | A | Medio (Pablo) |
| 3 | No hay OAuth gestionado para SaaS | Cero conexión Gmail/Monday/Calendar | Composio MCP / Pipedream MCP | A | Bajo (token + workspace) |
| 4 | Sin observabilidad estandarizada | Logs en Supabase, sin spans | OpenTelemetry GenAI v1.37+ | B | Medio (Pablo) |
| 5 | Sin circuit breakers ni retry budget | Falla OpenAI = falla usuario | Resilience4j-style en EF + Inngest | B | Medio (Pablo) |
| 6 | Sin idempotency en writes | `registrar_tarea_cola` no dedupea | UUID idempotency keys | B | Bajo (prompt + EF) |
| 7 | Frontend no consume Realtime para bandeja | Polling implícito al recargar | Supabase Realtime PG17 logical | B | Medio (Pablo) |
| 8 | No hay capability discovery | Diego no sabe qué puede hacer fuera de las 7 tools | `tools/list` MCP en handshake | B | Alto (post-MCP) |
| 9 | Sin PII redaction automática | RUT, teléfonos viajan en plain a OpenAI | Kong AI Gateway o regex pre-procesador | C | Bajo (prompt + EF) |
| 10 | Sin versionado de tools | Cambios rompen retro | `name@version` semántico declarado en `panel.config_ui` | C | Bajo (config) |

**Top 3** (severidad A o más bloqueantes para Plan 2026 SaaS): brechas 1, 2 y 3.

---

## Implementable sin Pablo en 1-2 días

Cinco quick-wins ejecutables sólo con cambios al system prompt `DIEGO-PROMPT-MAXIMO.md` y al schema `panel.config_ui` (sin tocar Edge Functions, sin Pablo). Todos asumen que Diego puede leer `panel.config_ui.*` ya hoy.

| # | Quick-win | Cómo se implementa | Beneficio |
|---|---|---|---|
| 1 | **Registro declarativo de integraciones pendientes** en `panel.config_ui.integraciones_v1` | INSERT en `panel.config_ui` con JSON: `{nombre: 'monday', estado: 'pendiente_p15', endpoint_futuro: 'https://...', responsable: 'Pablo'}` para Monday, Gmail, Calendar, WhatsApp, n8n. Diego lee este catálogo en su system prompt extendido | Diego sabe que las integraciones existen aunque no las invoque. Cuando usuario pregunta "¿podés enviar mail?", Diego responde con honestidad: "Gmail OAuth pendiente P1.5, responsable Pablo" |
| 2 | **Catálogo de "single source of truth" por dominio** en `panel.config_ui.sot_v1` | INSERT con la tabla de la sección 3.1: por dominio (cliente, precio, cartera, tesorería, tareas), cuál es el sistema canónico, cuáles son espejos | Diego nunca confunde Monday con la verdad. Si usuario pregunta "¿cliente X está activo según Monday?", Diego sabe que la respuesta válida viene de Supabase `curated.vw_cartera_clientes_actual` |
| 3 | **PII redaction básica en prompt** | Agregar bloque al `DIEGO-PROMPT-MAXIMO.md`: "Antes de llamar a OpenAI, redactar de tu output cualquier RUT (regex `\\d{1,2}\\.\\d{3}\\.\\d{3}-[\\dkK]`), teléfono móvil (+56 9 XXXX XXXX), email completo. Reemplazar por `[RUT_REDACTED]` etc." | Reduce exposición de PII sin tocar EF. No es seguridad real (eso requiere gateway) pero cubre el 80% de casos comunes |
| 4 | **Tabla de capacidades declaradas** en `panel.config_ui.diego_capabilities_v1` con versionado | INSERT por tool: `{name: 'consultar_precio_material', version: '1.0.0', schema_input: {...}, schema_output: {...}, description: 'NL'}` para las 7 tools actuales | Diego puede responder "¿qué puedes hacer?" leyendo el catálogo. Si Pablo agrega tool nº 8, sólo hay que INSERT — no editar prompt |
| 5 | **Bandeja "decisión pendiente integración"** en `panel.config_ui.bandeja_integracion_v1` | Cuando usuario pide algo que requiere integración pendiente (mail, Monday, Calendar), Diego INSERT en esta tabla: `{usuario, intent, datos, fecha, estado: 'pendiente_integracion'}`. Cuando la integración se active, n8n / Pablo puede consumir backlog | Cero usuarios frustrados con "no puedo todavía". Diego promete el trabajo y la promesa queda registrada para repagar |

---

## Fuentes

1. [Model Context Protocol — Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — Anthropic, spec canónica con Tasks, Elicitation, structured output.
2. [One Year of MCP — November 2025 Spec Release](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/) — Anniversary post oficial, 5.800 servers, 300+ clients, 97M descargas SDK.
3. [Best AI Agent Integration Platforms 2026](https://composio.dev/content/ai-agent-integration-platforms) — Composio, comparativo Composio / Pipedream / Zapier / n8n / Merge.
4. [Top Unified API Platforms for AI Agents 2026](https://composio.dev/blog/best-unified-api-platforms) — Composio review de mercado.
5. [Kong AI Gateway — Producto oficial](https://konghq.com/products/kong-ai-gateway) — Kong Inc., AI Gateway con MCP + A2A.
6. [Pipedream MCP en 2026](https://generect.com/blog/pipedream-mcp/) — Pipedream MCP servers, 10.000+ tools, post-acquisition Workday dic-2025.
7. [n8n MCP Client Tool docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/) — n8n, MCP bidireccional cliente+server.
8. [Supabase 2026 Realtime con PG17 Logical Replication](https://johal.in/architecture-teardown-supabase-2026-realtime-works-using-postgresql/) — Análisis técnico del cambio arquitectónico Realtime.
9. [Supabase ETL — Rust framework para CDC](https://github.com/supabase/etl) — Supabase oficial, building blocks CDC sobre logical replication.
10. [Modern Data Lakehouse 2026 — Databricks, Snowflake, Fabric](https://vardhmanandroid2015.medium.com/modern-data-lakehouse-in-2026-from-open-source-foundations-to-databricks-snowflake-microsoft-5fd6970d35a0) — Estado del arte lakehouse + medallion.
11. [OpenTelemetry GenAI Observability](https://opentelemetry.io/blog/2026/genai-observability/) — OTel oficial, semantic conventions GenAI.
12. [Datadog LLM Observability + OTel GenAI](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) — Datadog soporte nativo v1.37+.
13. [Hookdeck Review March 2026](https://hookdeck.com/blog/hookdeck-review-march-2026) — Event gateway, 99.999% uptime, retry+signing.
14. [Inngest AI orchestration](https://www.inngest.com/ai) — Durable workflows para agentes.
15. [Trigger.dev — Long-running AI workflows](https://trigger.dev/) — TypeScript-first, retries tipados.
16. [GPT Actions vs MCP — Quickchat AI](https://quickchat.ai/post/gpt-actions-vs-mcp) — Comparativo técnico vendor lock-in.
17. [Cloudflare Dynamic Workers GA](https://blog.cloudflare.com/dynamic-workers/) — Isolate-based sandboxing 100x más rápido.
18. [Cloudflare Code Mode for MCP](https://blog.cloudflare.com/code-mode/) — LLM escribe código TS contra API tipada, 81% reducción tokens.
19. [ElectricSQL vs PowerSync vs Replicache](https://queryplane.com/docs/blog/electricsql-vs-powersync-vs-replicache) — Local-first sync, CRDTs, Postgres.
20. [MCP vs A2A — Complete Guide 2026](https://dev.to/pockit_tools/mcp-vs-a2a-the-complete-guide-to-ai-agent-protocols-in-2026-30li) — Protocolos AI agent 2026.
21. [Best Webhook Platforms for AI Workflows 2026](https://fast.io/resources/best-webhook-platforms-ai-workflows/) — Comparativo webhook platforms.
22. [Apollo GraphQL Federation v2 + Hasura DDN](https://www.apollographql.com/) — API orchestration AI agents, web, mobile.

---

**Última actualización**: 23-may-2026 · **Autor**: Agente B (Backend Architect) · **Estado**: v1.0 entregable a Agente Z.

**Nota de honestidad técnica**: integraciones específicas de Reciclean (Monday workspace, n8n VPS version, Gmail OAuth scope, Calendar API quota) **no verificadas** en esta sesión. Confirmar con Pablo antes de ejecutar quick-wins 1 y 5.
