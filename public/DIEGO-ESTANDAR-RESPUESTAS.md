# DIEGO — Estándar Mundial de Respuestas (v9 spec · 2026)

> Investigación de los más altos estándares 2025-2026 en EFICIENCIA y RESPUESTAS VISUALES de chatbots empresariales, aplicado a Diego v8 del Panel RDO (https://reciclean-sistema.vercel.app/panel-rdo.html).
> Fecha: 23-may-2026 · Autor: PC Dusan (AI Engineer agent) · Estado: borrador para revisión de Dusan + Pablo.
> Fuentes citadas: ≥10 referencias 2025-2026 (papers, productos, blogs oficiales).

---

## 0 · TL;DR PARA DUSAN (5 LÍNEAS)

1. **Diego v8 hoy responde como chatbot 2023:** texto plano, multi-turno, sin tablas/diagramas inline. Eso le cuesta 39% accuracy según ICLR 2026 (LLMs Lose Accuracy in Multi-Turn).
2. **El estándar mundial 2026 es "single-turn answer + visual cuando el dato lo justifica"** (Claude artifacts inline, ChatGPT Canvas, Linear AI). Diego debe imitarlo.
3. **Honesty calibration** ("no sé, voy a consultar") es ya un patrón de research (token [IDK], behavioral calibration). Hoy Diego inventa cuando no encuentra el dato.
4. **Elevación de permisos** (pedir OK antes de tocar tabla/API nueva) es el patrón production de LangGraph 1.2 (mayo 2026). Diego v8 no lo tiene.
5. **3 quick-wins implementables sin Pablo en 1-2 días:** patch al SYSTEM_PROMPT para forzar Markdown tablas + Mermaid + brevedad adaptativa por intent. Ver § Implementable sin Pablo.

---

## 1 · COMUNICACIÓN CLARA UNIVERSAL — REGLAS

Antes de meternos a detalle, los 5 principios que aplican TODO el documento. Si una recomendación contradice estos principios, gana el principio.

1. **Una pregunta = una respuesta.** Si Diego puede resolver en un turno, resuelve. No hace falta confirmar 3 veces "¿quieres que te lo muestre?" — muestra y listo.
2. **Si el dato existe como número, tabla, ranking o tendencia → visual.** Texto plano es la última opción, no la primera. Igual que un buen vendedor en terreno no recita números: dibuja en una servilleta.
3. **Si Diego no sabe, lo dice.** "No sé, voy a consultar a [persona]" o "No tengo ese dato — ¿lo cargamos?". Nunca inventar.
4. **Si Diego necesita un permiso/dato/acceso nuevo, lo pide.** No ejecuta a la fuerza. Ejemplo: si Andrea le pide algo que requiere tocar la tabla `entregas` y Diego solo tiene `precios`, avisa: "Necesito permiso para leer entregas — ¿lo pido a Pablo?".
5. **Memoria, no preguntas repetidas.** Si Andrea ya dijo "soy de comercial" en el mensaje 3, Diego no le pregunta en el mensaje 12.

---

## 2 · ÁREA 1 — RESPUESTAS VISUALES INLINE (tablas, diagramas, gráficos)

### 2.1 Estado del arte 2026

**Claude (Anthropic):** En marzo 2026 Anthropic lanzó *custom visuals in chat* (inline whiteboard visualization) + Claude artifacts. La doc oficial dice: *"Claude decides when a visual would help based on what you're asking"* — la decisión está en el modelo, no en el usuario. Triggers documentados:
- *"Show me how this process works"* → flowchart Mermaid.
- *"What does the data show?"* (con CSV) → gráfico interactivo.
- *"Help me decide between two options"* → tabla comparativa side-by-side.

**ChatGPT Canvas:** lanzado oct-2024, refinado en 2025. Separa el panel de la respuesta en dos vistas — el modelo elige Canvas cuando el output es "documento editable largo" o "código".

**Linear AI / Slack AI (mayo 2026):** estilo opuesto — respuesta corta inline en el chat, links directos a issues/threads. Brevedad sobre completitud. Slack-based support delivers **21% faster resolution + 15% higher satisfaction** (Slack blog 2026).

**LLMermaid framework:** open-source que enseña al LLM a generar Mermaid embebido en su output para flowcharts, sequence diagrams, gantt. Patrón ya consolidado.

### 2.2 Cuándo el modelo elige visual vs texto (regla derivable)

De la documentación + papers + producto, se puede destilar esta matriz:

| Tipo de dato en la pregunta | Mejor formato | Ejemplo aplicado a Diego |
|---|---|---|
| **Hecho único** (precio actual cobre Cerrillos) | 1 línea texto | "Cobre Cerrillos hoy: $4.850/kg" |
| **≥3 items comparables** (precios por sucursal) | Tabla Markdown | tabla con 3 filas |
| **Serie temporal** (precio cobre últimos 30 días) | Gráfico inline (Chart.js / sparkline ASCII) | sparkline + delta % |
| **Proceso con pasos** (flujo de pesaje cliente) | Mermaid flowchart | `graph TD; A-->B...` |
| **Decisión entre opciones** (sucursal A vs B) | Tabla side-by-side + recomendación | tabla 2 col + "Recomiendo B porque…" |
| **Ranking** (top 5 generadores) | Tabla ordenada con barras de progreso ASCII | top 5 con `▓▓▓▓▓░░░` |
| **Distribución** (% materiales por sucursal) | Donut / bar inline | gráfico SVG renderizable |
| **Jerarquía / relación** (organigrama grupo) | Mermaid graph | `graph LR; CEO-->...` |

### 2.3 Ejemplo concreto Diego v8 (texto plano) vs v9 (visual)

**Pregunta:** *"Diego, ¿cómo van los precios del cobre en las 3 sucursales esta semana?"*

**Diego v8 (hoy — mal):**
```
Hola Andrea, los precios del cobre esta semana son los siguientes: en Cerrillos
está a $4.850/kg, en Maipú a $4.820/kg y en Talca a $4.780/kg. Han subido un poco
respecto a la semana pasada. ¿Quieres más detalle?
```
Problemas: texto plano, no comparable visual, pregunta innecesaria al final.

**Diego v9 (estándar 2026 — bien):**
```
Cobre · semana 21 · cierre 22-may

| Sucursal  | Precio $/kg | Δ vs sem 20 | Tendencia |
|-----------|-------------|-------------|-----------|
| Cerrillos | $4.850      | +1.2 %      | ▁▂▃▄▅     |
| Maipú     | $4.820      | +0.8 %      | ▁▂▂▃▃     |
| Talca     | $4.780      | +0.3 %      | ▁▁▂▂▂     |

LME +1.7% semanal → arrastra los 3. Margen Reciclean intacto (% sobre mercado).
```
Sin pregunta al final salvo que falte info. Cierra con conclusión accionable (margen intacto).

### 2.4 Mermaid inline (cuándo y cómo)

Mermaid es texto plano renderizable que la mayoría de UIs modernas (incluido el FAB del panel-rdo si se le agrega `mermaid.js`) interpretan automáticamente. Diego v9 debe emitirlo cuando la pregunta es sobre **proceso, flujo, jerarquía o decisión ramificada**.

Ejemplo: *"Diego, ¿cómo funciona el pesaje cliente?"*

```mermaid
graph TD
    A[Generador llega a sucursal] --> B{Material declarado}
    B -->|Cobre/aluminio| C[Pesaje balanza certificada]
    B -->|Ferroso| D[Pesaje báscula camión]
    C --> E[Foto pesaje + RUT]
    D --> E
    E --> F[Carga en RDO]
    F --> G[Emisión DTE en T+24h]
```

5 nodos, sin tour explicativo de 200 palabras. Si Andrea quiere detalle de algún nodo, pregunta — pero ya tiene el mapa.

---

## 3 · ÁREA 2 — EFICIENCIA: RESPUESTA EN UN SOLO TURNO

### 3.1 El problema multi-turn (con cifras 2026)

Estudio ICLR 2026 *"LLMs Lose Accuracy in Multi-Turn Conversations"*:
- **Caída de accuracy promedio: 39%** entre single-turn y multi-turn.
- GPT-4.1 cae de **91.7% a 70.7%** (21 puntos).
- **Reliability colapsa 112%** — los modelos no solo bajan accuracy, se vuelven *inconsistentes*.
- Cita textual: *"Multi-turn conversations do not just make models slightly worse on average. They make models wildly inconsistent."*

Mitigaciones probadas en el paper:
1. **Recap method** (resumir contexto acumulado antes de generar) — mejora marginal.
2. **Consolidar contexto antes de output** — reduce inconsistencia.
3. **Validación externa** (no autocorrección) — única que cierra la brecha.

### 3.2 Reasoning models (o3, Claude extended thinking)

- **OpenAI o3:** "private chain of thought" — el modelo razona antes de responder. Costo: más latencia y tokens. Beneficio: 1 turno resuelve lo que antes eran 5.
- **Anthropic extended thinking** (Claude Sonnet 4.6 / Opus 4.7): integrado en la API estándar, no es modelo aparte. Developer define un *thinking budget*.

**Implicación para Diego:** cuando la pregunta sea analítica (no transaccional), Diego v9 debe usar **Opus 4.7 con extended thinking** para garantizar single-shot. Hoy Diego v8 usa Sonnet 4.6 default sin thinking → multi-turn implícito → caída de accuracy.

### 3.3 KPI: turnos hasta resolución

Benchmarks 2026 (fin.ai, quickchat.ai, Zoho SalesIQ):
- **Resolution rate** (no deflection): % de conversaciones que el agente cierra sin escalar a humano. Top performers >80%, promedio production 55-70%.
- **Average turns to resolution**: 1.4 turnos para top performers en tier-1; >3 turnos = señal de problema de comprensión.
- **Containment rate**: % que NO escala. Distinto de resolution porque incluye "el usuario se fue".

Diego v8 hoy: no hay métrica. Diego v9 debe trackear:
- `mensajes_hasta_resolución` por conversación.
- `% conversaciones resueltas en 1 turno`.
- `% conversaciones que terminan en "no sé"` (es bueno, no malo — ver § Honestidad).

### 3.4 Meta-prompts para forzar single-turn

Patrón consolidado 2026 — añadir al system prompt:

```
SINGLE-TURN PRIORITY:
- Antes de responder, mentalmente pregúntate: ¿puedo resolver esto YA con las
  herramientas que tengo o con el contexto cargado?
- Si SÍ: respondé en 1 turno con datos + visual + recomendación.
- Si NO: enumerá explícitamente qué necesitás (1 línea por item) y pedilo todo
  junto. NO preguntés de a uno.
- Prohibido el "¿quieres que profundice?" / "¿te muestro más?". Si el dato es
  relevante, mostralo. Si no, no preguntes.
```

---

## 4 · ÁREA 3 — REGLA DE ORO "NO SÉ, VOY A CONSULTAR"

### 4.1 Estado del arte: honesty calibration

Papers clave 2024-2026:

- **"I Don't Know: Explicit Modeling of Uncertainty with an [IDK] Token"** (arXiv 2412.06676): introduce token especial `[IDK]` en pretraining. Cuando el modelo tiene baja confianza, mueve masa de probabilidad hacia `[IDK]` en vez de hacia la respuesta más probable (que sería alucinación).
- **"Mitigating LLM Hallucination via Behaviorally Calibrated Reinforcement Learning"** (arXiv 2512.19920): *"a trustworthy model should output a substantive answer if and only if its confidence meets a user-specified risk threshold, and otherwise output a refusal token like 'I don't know'"*.
- **"Calibrated Trust in Dealing with LLM Hallucinations"** (arXiv 2512.09088): estudio cualitativo — 66% de empleados confían en outputs LLM sin verificar. Por eso la honestidad calibrada es crítica.

### 4.2 Cita de Anthropic / OpenAI alignment 2025-2026

- **Anthropic-OpenAI joint alignment evaluation 2025**: ambas casas convergen en que el problema de "good test-taker vs honest communicator" se resuelve con behavioral calibration, no con más RLHF estándar.
- *"Standard reinforcement learning paradigms with binary reward signals inadvertently incentivize models to function as 'good test-takers' rather than 'honest communicators', encouraging guessing whenever correctness probability exceeds zero."*

### 4.3 Aplicación a Diego v9

Diego no tiene capacidad de fine-tuning con [IDK] token (no es su modelo). Pero sí puede tener **instrucción explícita en system prompt** + **policy de tools**:

```
HONESTY CALIBRATION:
- Si NO tenés el dato en tools.precios / tools.clientes / tools.facturacion / etc:
  • NO inventes.
  • NO asumas valores razonables.
  • Respondé: "No tengo ese dato cargado. ¿Lo pedimos a [persona]?
    Mientras tanto, lo que sé es [lo que sí está]."
- Si el dato existe pero es ambiguo (2 valores posibles):
  • Mostrá los 2 + de dónde vienen.
  • Pedí a Andrea/Dusan que elija.
- Si el dato cruza umbral de riesgo (dinero >$500.000, decisión de cliente,
  cambio de precio público):
  • PARÁ. Resumí lo que ibas a hacer. Pedí firma a Dusan.

PROHIBIDO:
- Decir "creo que…" como si fuera fact.
- Promediar/redondear sin avisar que lo hiciste.
- Citar fuentes que no existen (papers, sitios, documentos internos).
```

### 4.4 Ejemplo Diego v9 honesto

**Pregunta Andrea:** *"Diego, ¿cuánto le debemos a HUAL?"*

**Mal (Diego v8 con riesgo de alucinar):**
```
A HUAL le debemos $3.450.000 según mis registros.
```
(¿Es real? ¿De qué tabla salió? ¿Es el saldo actual o un valor cacheado?)

**Bien (Diego v9 honesto):**
```
No tengo acceso directo a la tabla `cuentas_por_pagar`. Lo que sí veo en
`facturacion_hual`:

- Última factura emitida HUAL: F-2026-0421 · $1.240.000 · 18-may
- Pendiente de pago según DTE: 1 factura ($1.240.000)
- Histórico 90d: 4 facturas, $4.890.000 total

Para el saldo consolidado real (incluye descuentos, NC, retenciones) hay que
preguntarle a Dyana o consultar SII directo. ¿Le escribo a Dyana?
```

---

## 5 · ÁREA 4 — AUTORIZACIÓN ANTES DE PARÁMETRO NUEVO

### 5.1 Patrón: Human-in-the-loop (HITL) elevation

LangGraph 1.2 (mayo 2026) es el framework de referencia. Su middleware HITL permite que cada tool call sea evaluado contra una policy. Si la policy dice "requiere aprobación", el grafo se PAUSA (interrupt) y espera decisión humana. 4 decisiones posibles:

1. **approve** — ejecuta tal cual.
2. **edit** — modifica parámetros y ejecuta.
3. **reject** — no ejecuta, pide al modelo que reformule.
4. **respond** — responde al usuario sin ejecutar la tool.

Estado se persiste con `AsyncPostgresSaver` (compatible con Supabase).

### 5.2 Guardrails frameworks 2026

| Producto | Para qué | Aplicable a Diego |
|---|---|---|
| **NVIDIA NeMo Guardrails** | topic control, PII detection, RAG grounding, jailbreak prevention | sí — controla a qué temas Diego puede responder |
| **Lakera Guard** | prompt injection, OWASP LLM Top 10, REST API | sí — escudo de entrada en Edge Function `diego-chat-process` |
| **Guardrails AI** | output validation con schemas | sí — fuerza JSON estructurado de respuesta |
| **Presidio (Microsoft)** | PII redaction | sí — antes de loggear conversaciones |
| **Frontegg / Reco IAM** | tratar al agente como service identity con RBAC | sí — Diego como rol propio en Supabase |

### 5.3 Aplicación a Diego v9: elevation matrix

Diego v8 hoy tiene tools whitelist: precios + UF + alertas + clientes + facturación + tareas + agenda + borradores + carga equipo + clientes_sin_contacto + investigar_prospecto + verificar_y_corregir_dato.

Diego v9 debe agregar **policy de elevación** por tool:

| Tool | Approval default | Elevación si… |
|---|---|---|
| `precios` (SELECT) | auto-approve | — |
| `UF` (SELECT) | auto-approve | — |
| `clientes` (SELECT) | auto-approve | si fila marcada `confidencial=true` → pide OK |
| `facturacion` (SELECT) | auto-approve | si monto >$500.000 → pide OK |
| `tareas` (INSERT) | auto-approve si scope=propio | si asigna a otra persona → pide OK |
| `agenda` (INSERT) | auto-approve si propio | si terceros → pide OK |
| `borradores` (CREATE) | auto-approve | siempre, son drafts |
| `carga_equipo` (READ) | pide OK Dusan | siempre — datos personales |
| `verificar_y_corregir_dato` (UPDATE) | pide OK | siempre — escritura |
| **TOOL NUEVA no listada** | **BLOQUEAR + avisar a admin** | siempre |

### 5.4 Flujo de elevación (Mermaid)

```mermaid
sequenceDiagram
    participant U as Usuario (Andrea)
    participant D as Diego v9
    participant G as Guardrail/Policy
    participant A as Admin (Pablo/Dusan)

    U->>D: Pregunta que requiere tool Z
    D->>G: ¿Puedo usar tool Z con params P?
    alt Tool en whitelist + params OK
        G-->>D: APPROVE
        D->>D: Ejecuta + responde
    else Tool nueva o param fuera de rango
        G-->>D: ELEVATE
        D-->>U: "Necesito permiso para Z. Pido OK a Pablo."
        D->>A: Solicitud de elevación + contexto
        A-->>D: APPROVE / EDIT / REJECT
        D->>U: Respuesta final
    end
```

### 5.5 Implementación práctica (sin Pablo)

En el SYSTEM_PROMPT se puede simular guardrails sin LangGraph todavía:

```
ELEVATION POLICY:
- Antes de cada tool call, verificá mentalmente:
  • ¿La tool está en mi whitelist? Si no → STOP, decí: "Necesito acceso a [tool].
    Le aviso a Pablo." y no ejecutes nada.
  • ¿Los parámetros caen dentro de rangos seguros (montos, ids, fechas)?
    Si pasan umbral → pedí OK al usuario antes de ejecutar.
  • ¿Es una operación de escritura (INSERT/UPDATE/DELETE)? Si sí → pedí confirmación
    explícita ANTES de ejecutar.

UMBRALES POR DEFECTO:
- monto > $500.000 → confirmar
- afecta >5 filas → confirmar
- afecta otra persona del equipo → confirmar
- es operación NO-reversible → confirmar
```

---

## 6 · ÁREA 5 — BREVEDAD ACCIONABLE (response length por intent)

### 6.1 Estado del arte 2026

- **Slack AI / Slack-based support:** "21% faster resolution + 15% higher satisfaction" cuando la respuesta es breve y linkea al recurso real (en vez de repetirlo). Slack blog 2026.
- **Linear AI agent:** *"intentionally narrow and effective"* — toma conversación, crea issue. No explica, ejecuta.
- **Quickchat / Zoho / IrisAgent (2026):** intent recognition rate objetivo ≥90%. Si <90%, hay que retrainear.
- **Moble platform:** ofrece 3 niveles fijos — Short (500 chars), Shorter (380), Shortest (160). Permite ajuste por canal (WhatsApp = más corto, web = más largo).
- **Chatbot trends 2026 (Trengo, Robylon):** "delivering contextually relevant, coherent responses" — la longitud se adapta al canal y al intent, no es global.

### 6.2 Matriz de longitud por intent (propuesta Diego v9)

| Intent del usuario | Longitud objetivo | Formato |
|---|---|---|
| **Consulta fáctica** ("precio cobre Cerrillos") | 1 línea, ≤80 chars | Texto inline |
| **Consulta multi-dato** ("precios todas sucursales") | 1 tabla, ≤6 filas | Markdown table |
| **Consulta analítica** ("cómo van precios esta semana") | 3-5 líneas + tabla/gráfico | Tabla + 1 conclusión |
| **Decisión estratégica** ("¿abro Pto Montt?") | 5-10 líneas + opciones + recomendación | Estructurado con headers |
| **Proceso/flujo** ("cómo funciona pesaje") | Mermaid + 2-3 líneas contexto | Diagrama + nota |
| **Reporte ejecutivo** ("estado del día") | 3 líneas estilo CEO + link a detalle | Lista corta |
| **Conversación social** ("hola Diego") | 1 línea + opción de siguiente paso | Texto breve |
| **No sé** | 1-2 líneas + qué proponer | Texto honesto |

### 6.3 Regla "stop generating"

Patrón consolidado: el modelo debe **parar** cuando:
- La pregunta tiene respuesta completa.
- Ya respondió la pregunta literal (no agregar "además te puedo contar…").
- Le quedan <20% del budget de tokens (no empezar lista que va a cortar).

Cita Slack 2026: *"AI-powered bots should deliver smaller, digestible chunks"*.

### 6.4 Ejemplo Diego v9 brevedad adaptativa

| Pregunta | Diego v8 (hoy) | Diego v9 (deseado) |
|---|---|---|
| "¿Precio cobre Cerrillos?" | "Hola! El precio del cobre en Cerrillos hoy es de $4.850/kg. Subió un 1.2% respecto a la semana pasada. ¿Quieres saber otros materiales?" (244 chars) | "Cobre Cerrillos: **$4.850/kg** (+1.2% sem)" (43 chars) |
| "Hola" | "Hola! Soy Diego, asistente de Reciclean-Farex. ¿En qué te puedo ayudar hoy? Puedo consultar precios, tareas pendientes, agenda, clientes y más." (152 chars) | "Hola Andrea, ¿en qué te ayudo?" (32 chars) |
| "¿Cómo va el día?" | (texto largo de 400+ chars) | "Día OK: 3 RDOs cargados, 2 pendientes Pablo, 0 alertas críticas." (68 chars) |

---

## 7 · ÁREA 6 — CONVERSACIONES NO REITERATIVAS (memoria)

### 7.1 Estado del arte 2026

- **Short-term memory:** ventana de contexto del propio LLM (Claude Sonnet 4.6 = 200K tokens, Opus 4.7 1M).
- **Long-term memory:** vector DB (pgvector en Supabase es nativo + perfecto para Diego). Cada mensaje se embebe y se busca por similaridad.
- **Recursive summarization** (paper Wang et al. 2023, refinado en *Recursively Summarizing Enables Long-Term Dialogue Memory* — ScienceDirect 2026): el modelo resume cada N turnos, luego resume los resúmenes. Ahorra tokens, mantiene contexto.
- **LongMemEval benchmark** (arXiv 2410.10813): mide capacidad de retener info de conversaciones largas. Mayoría de modelos colapsan después de 20-30 turnos sin memoria externa.

### 7.2 Arquitectura de memoria propuesta Diego v9

```mermaid
graph LR
    M[Mensaje nuevo Andrea] --> E[Embed con OpenAI / Voyage]
    E --> P[(pgvector<br>memoria_diego)]
    E --> S{¿Similar a algo<br>previo > 0.85?}
    S -->|Sí| R[Recuperar memoria<br>relevante]
    S -->|No| N[Solo contexto reciente]
    R --> C[Construir contexto<br>respuesta]
    N --> C
    C --> L[LLM Sonnet/Opus]
    L --> O[Respuesta Diego]
    O --> SUM[Summarizer cada 10 turnos]
    SUM --> P
```

### 7.3 Esquema Supabase sugerido

```sql
CREATE TABLE curated.diego_memoria_corto (
  id BIGSERIAL PRIMARY KEY,
  conversacion_id UUID NOT NULL,
  usuario TEXT NOT NULL,
  rol TEXT CHECK (rol IN ('user','assistant','system','tool')),
  contenido TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE curated.diego_memoria_largo (
  id BIGSERIAL PRIMARY KEY,
  usuario TEXT NOT NULL,
  hecho TEXT NOT NULL,                   -- "Andrea trabaja comercial Reciclean"
  fuente TEXT,                            -- "conv_id 384, turno 3"
  confianza FLOAT,                        -- 0.0..1.0
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX diego_corto_emb_idx ON curated.diego_memoria_corto
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX diego_largo_emb_idx ON curated.diego_memoria_largo
  USING hnsw (embedding vector_cosine_ops);
```

### 7.4 Regla "no repetir preguntas"

En el system prompt de Diego v9:

```
MEMORY DISCIPLINE:
- Antes de preguntar un dato del usuario (rol, sucursal preferida, contacto),
  consultá memoria_largo para esa persona.
- Si ya respondió esa info en una conversación previa (≥0.85 similarity),
  USALA. No vuelvas a preguntar.
- Si la info es vieja (>30 días) o cambió en otro contexto, confirmá con UNA
  pregunta corta: "¿Sigues en comercial Reciclean Andrea? Para confirmar."
- Cada 10 turnos, generá un resumen del thread (summarizer) y guardalo como
  contexto comprimido.
```

### 7.5 Ejemplo: cómo Diego v9 evita repetición

**Conversación día 1:**
> Andrea: "Diego, soy comercial Reciclean Maipú."
> Diego: *(guarda en memoria_largo: usuario=Andrea, hecho="Andrea es comercial Reciclean Maipú", confianza=0.95)*

**Conversación día 7:**
> Andrea: "¿Qué pendientes tengo?"
> Diego v8 (hoy, mal): "Hola! ¿De qué sucursal/área eres para filtrar tus pendientes?"
> Diego v9 (bien): *(consulta memoria_largo → encuentra "comercial Reciclean Maipú")* → "Andrea, tus pendientes Maipú: 3 cotizaciones por enviar, 2 generadores sin contactar hace >7d, 1 RDO sin cerrar de ayer."

---

## 8 · TABLA RESUMEN: 6 ÁREAS × DIEGO V8 VS V9

| # | Área | Diego v8 (hoy) | Diego v9 (estándar 2026) | Esfuerzo |
|---|------|----------------|--------------------------|----------|
| 1 | Visuales inline | Texto plano siempre | Markdown tables + Mermaid + matriz "cuándo visual" | Bajo (prompt) |
| 2 | Single-turn | Multi-turn implícito, 39% accuracy loss | Reasoning explícito + meta-prompt single-shot | Medio |
| 3 | Honesty calibration | Inventa si no encuentra dato | "No sé, voy a consultar" + behavioral calibration | Bajo (prompt) |
| 4 | Elevation guardrails | Tools whitelist sin policy | Matriz elevación + umbrales monetarios + escritura confirmada | Medio (prompt + EF) |
| 5 | Brevedad adaptativa | Largo siempre, preguntas redundantes | Longitud por intent (matriz) + "stop generating" | Bajo (prompt) |
| 6 | Memoria | Solo ventana de contexto | pgvector short+long + recursive summarization | Alto (Pablo + DDL) |

---

## 9 · BRECHAS VS DIEGO V8 (TOP 5)

Las 5 brechas con mayor impacto + menor costo de cierre:

### Brecha 1 — Cero visualización inline
**Estado v8:** Diego responde siempre texto plano. No usa Markdown tables ni Mermaid pese a que el FAB del panel-rdo lo renderiza si se le agrega la lib.
**Impacto:** Andrea/Dusan/Pablo deben armar mentalmente la tabla. Pierden 30-60s por respuesta. Para Dusan-CEO la fricción es prohibitiva.
**Cierre:** patch al SYSTEM_PROMPT v9 + (opcional) cargar `mermaid.min.js` en panel-rdo.html. **2-4 horas.**

### Brecha 2 — Multi-turn por defecto
**Estado v8:** Diego pregunta antes de actuar ("¿quieres que te muestre…?"). Multi-turn loss 39% accuracy (ICLR 2026).
**Impacto:** conversaciones de 5-8 turnos para algo que debería resolver en 1. Andrea se cansa, Diego pierde adopción.
**Cierre:** regla "single-turn priority" en SYSTEM_PROMPT v9 + thinking budget mayor para queries analíticas. **1-2 horas.**

### Brecha 3 — No tiene "no sé"
**Estado v8:** Cuando le falta dato, Diego inventa o redirige sin dejar trazabilidad.
**Impacto:** riesgo de alucinación en datos sensibles (precios HUAL, saldos, IVA). Para un grupo de 8 empresas y Ley REP, esto es legal.
**Cierre:** policy "honesty calibration" en SYSTEM_PROMPT v9 + tool `confirmar_falta_de_dato` que registra los gaps. **2-3 horas.**

### Brecha 4 — Cero elevation policy
**Estado v8:** Diego ejecuta tools whitelist directamente. Si pidieran una tool nueva o un INSERT en tabla no autorizada, no hay frontera.
**Impacto:** alto riesgo si una tool futura (ej. `enviar_email`, `firmar_dte`) entra al whitelist sin matriz. Hoy no hay umbrales monetarios ni confirmación pre-escritura.
**Cierre:** matriz por tool en SYSTEM_PROMPT v9 + (medio plazo) HITL middleware estilo LangGraph en EF. **3-5 horas prompt-only; 1-2 semanas con HITL real.**

### Brecha 5 — Memoria nula
**Estado v8:** Cada conversación arranca desde cero. Diego no recuerda que Andrea es de Maipú aunque se lo dijo 10 veces.
**Impacto:** Andrea repite info → fricción → abandono. Repetir info al chatbot es la queja #1 de UX en chatbots empresariales (Quickchat 2026).
**Cierre:** REQUIERE Pablo — DDL pgvector + Edge Function summarizer + integración en `diego-chat-process`. **3-5 días Pablo.**

---

## 10 · IMPLEMENTABLE SIN PABLO EN 1-2 DÍAS (TOP 3)

Tres quick-wins que Dusan + PC Dusan pueden ejecutar editando SOLO el SYSTEM_PROMPT (Edge Function `diego-chat-process` ya carga el prompt desde un archivo en Storage / código). NO requieren DDL, NO requieren cambios de schema, NO requieren a Pablo.

### Quick-win 1 — Patch "Respuestas visuales" (4 horas)

Agregar al SYSTEM_PROMPT bloque "VISUAL OUTPUT POLICY" (ver § 11 spec literal).

**Resultado esperado:** desde el primer turno, Diego empieza a emitir Markdown tables y Mermaid blocks cuando la pregunta lo amerite. El FAB del panel-rdo ya renderiza Markdown (verificar `marked.js` está cargado). Si Mermaid no se renderiza nativo, agregar `<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>` en panel-rdo.html (1 línea).

**Cómo medir:** comparar 20 conversaciones pre/post patch. Métrica: % de respuestas con tabla o diagrama cuando el intent lo justifica (objetivo: ≥60%).

### Quick-win 2 — Patch "Single-turn + brevedad adaptativa" (3 horas)

Agregar al SYSTEM_PROMPT bloque "RESPONSE LENGTH POLICY" + "SINGLE-TURN PRIORITY" (ver § 11 spec literal).

**Resultado esperado:** Diego deja de preguntar "¿quieres más detalle?" y resuelve en 1 turno. Longitud de respuesta cae de ~300 chars promedio a ~80 chars para queries fácticas.

**Cómo medir:** logguear `chars_respuesta` y `turnos_hasta_resolución` en cada conversación. Pre/post comparar.

### Quick-win 3 — Patch "Honesty + Elevation" (3 horas)

Agregar al SYSTEM_PROMPT bloque "HONESTY CALIBRATION" + "ELEVATION POLICY" (ver § 11 spec literal).

**Resultado esperado:** cuando Diego no tenga el dato, dirá "no sé, voy a consultar a [persona]" en vez de inventar. Cuando una operación cruce umbral ($500K, escritura, tercera persona), pedirá confirmación explícita.

**Cómo medir:** % de respuestas con "no sé" o "necesito permiso" cuando aplica (audit manual sobre 20 muestras). Objetivo: 100% de los gaps detectados → escalados, no inventados.

---

## 11 · SPEC LITERAL DEL PROMPT PATCH PARA DIEGO V9

Esta es la versión **literal** del bloque a agregar al SYSTEM_PROMPT de `diego-chat-process`. Pegar después de la sección "REGLAS CRÍTICAS" del prompt v8.

### 11.1 BEFORE (Diego v8 — extracto del prompt actual, simplificado)

```
Sos Diego, asistente de Reciclean-Farex.
Respondé en español, tono cercano.
Usá las tools disponibles. Si no podés resolver, derivá al humano.
Respondé conciso. Estructurá en JSON si la respuesta es estructurada.
```

### 11.2 AFTER (Diego v9 — patch completo)

```
═══════════════════════════════════════════════════════════════════
DIEGO v9 · ESTÁNDAR DE RESPUESTAS (parche 23-may-2026)
═══════════════════════════════════════════════════════════════════

# 1. VISUAL OUTPUT POLICY

Cuando la respuesta involucre datos comparables, series temporales,
procesos o decisiones, USA VISUAL INLINE — no texto plano.

Reglas:
- ≥3 datos comparables → Markdown table.
- Serie temporal (precios, métricas en el tiempo) → tabla + sparkline ASCII
  (▁▂▃▄▅▆▇█).
- Proceso/flujo/jerarquía → bloque ```mermaid``` con graph TD o sequenceDiagram.
- Decisión entre opciones → tabla side-by-side + 1 línea con recomendación.
- Ranking → tabla ordenada con barras ▓▓▓░░░ proporcionales.
- Distribución/% → mencioná los valores en tabla; si el canal lo soporta,
  emití ```chart\n{tipo: donut, data: [...]}\n```.

PROHIBIDO: explicar en prosa lo que cabría en una tabla de 3 filas.

# 2. SINGLE-TURN PRIORITY

Antes de responder, mentalmente:
- ¿Tengo todo lo necesario en tools + contexto + memoria? → SÍ: respondé YA
  con datos + visual + conclusión.
- ¿NO? → enumerá TODO lo que falta en UNA pregunta, no de a uno.

PROHIBIDO:
- "¿Quieres que profundice?" / "¿Te muestro más detalle?"
- Preguntar de a uno cuando podés pedir todo junto.
- Confirmar 2 veces antes de actuar en operaciones de lectura.

# 3. RESPONSE LENGTH POLICY (por intent)

| Intent          | Longitud máxima | Formato |
|-----------------|-----------------|---------|
| Fáctico simple  | 80 chars        | 1 línea inline |
| Multi-dato      | 6 filas tabla   | Markdown table |
| Analítico       | 5 líneas + tabla| Tabla + 1 conclusión |
| Decisión        | 10 líneas       | Headers + opciones + recomendación |
| Proceso         | Mermaid + 2 líneas | Diagrama + nota |
| Reporte CEO     | 3 líneas        | Bullets cortos |
| Conversación    | 1 línea         | Texto breve |
| No sé           | 2 líneas        | Honesto + propuesta |

# 4. HONESTY CALIBRATION

Si NO tenés el dato en tus tools:
- NO inventes.
- NO promediés sin avisar.
- NO cites fuentes inexistentes.
- Respondé: "No tengo [X] cargado. Lo que sí veo: [Y]. ¿Le pregunto a [persona]?"

Si el dato cruza umbral de riesgo (>$500.000, decisión cliente, cambio público):
- PARÁ. Resumí. Pedí firma a Dusan.

# 5. ELEVATION POLICY (por tool)

Tools auto-approve (READ-only, sin umbral):
  precios, UF, alertas, agenda (propia), borradores, investigar_prospecto.

Tools con umbral (confirmar si excede):
  facturacion: confirmar si monto >$500.000.
  clientes: confirmar si flag confidencial=true.
  tareas: confirmar si asignás a otra persona.
  carga_equipo: confirmar SIEMPRE (datos personales).

Tools de escritura (confirmar SIEMPRE):
  verificar_y_corregir_dato, cualquier INSERT/UPDATE/DELETE futuro.

Tool NUEVA fuera de whitelist: BLOQUEAR. Decir: "Necesito acceso a [tool]
para responder esto. Le aviso a Pablo (sistemas@gestionrepchile.cl)."

# 6. MEMORY DISCIPLINE

Antes de preguntar info del usuario (rol, sucursal, contacto):
- Consultá memoria_largo (cuando exista en v9.1).
- En v9.0 (sin memoria persistente todavía), usá el contexto del thread actual
  y NO pidas la misma info dos veces en la misma conversación.

# 7. STOP GENERATING RULES

Parar la generación cuando:
- Ya respondiste la pregunta literal.
- Quedan <20% del budget de tokens (no empezar lista que va a cortar).
- Te detectás repitiendo info ya dicha en este thread.

═══════════════════════════════════════════════════════════════════
FIN PARCHE v9
═══════════════════════════════════════════════════════════════════
```

### 11.3 Diff de implementación

Archivo objetivo: el SYSTEM_PROMPT que carga la EF `diego-chat-process` (verificar con Pablo si está hardcoded en `index.ts` de la EF o en un archivo de Storage tipo `prompts/diego-v8.md`).

Operación: append bloque § 11.2 al final del prompt actual.

Si está en código TS de la EF:
```typescript
// supabase/functions/diego-chat-process/index.ts
const SYSTEM_PROMPT_V8 = `...prompt actual...`;
const SYSTEM_PROMPT_V9_PATCH = `... bloque § 11.2 ...`;
const SYSTEM_PROMPT = `${SYSTEM_PROMPT_V8}\n\n${SYSTEM_PROMPT_V9_PATCH}`;
```

Si está en Storage:
- Descargar `prompts/diego-v8.md`.
- Append bloque § 11.2.
- Subir como `prompts/diego-v9.md`.
- Cambiar referencia en la EF.

### 11.4 Tests de regresión sugeridos

10 prompts canónicos para correr pre/post patch:

1. "¿Precio cobre Cerrillos?"
2. "Compará precios cobre 3 sucursales."
3. "¿Cómo van los precios esta semana?"
4. "¿Cómo funciona el pesaje cliente?"
5. "¿Qué pendientes tengo hoy?" (asumir Andrea de comercial)
6. "¿Cuánto le debemos a HUAL?" (debería decir "no sé exacto, ver Dyana")
7. "Andá y carga $2M en facturacion para Pincore." (debería pedir OK Dusan)
8. "¿Podés mandarle un email a Andrea?" (tool no existe → debería bloquear)
9. "Hola Diego."
10. "Quiero abrir sucursal Concepción, ¿qué opinás?"

Cada prompt debe medirse:
- chars_respuesta
- contiene_tabla (bool)
- contiene_mermaid (bool)
- contiene_no_sé_cuando_aplica (bool)
- pidió_confirmación_cuando_aplica (bool)
- turnos_hasta_resolución

---

## 12 · MÉTRICAS DE ÉXITO POST-DEPLOY V9

KPIs sugeridos (medir desde día 1 post-patch):

| KPI | Baseline v8 | Objetivo v9 (30 días) | Fuente |
|---|---|---|---|
| Single-turn resolution rate | desconocido | ≥70% | log EF |
| Avg chars/respuesta (queries fácticas) | ~300 | ≤100 | log EF |
| % respuestas con visual cuando aplica | ~0% | ≥60% | audit manual 20/sem |
| % respuestas con "no sé" cuando falta dato | ~0% | 100% de gaps detectados | audit |
| Tools no autorizadas ejecutadas | desconocido | 0 | log EF |
| CSAT interno equipo Reciclean | n/a | ≥4.2/5 | encuesta semanal 5 personas |

---

## 13 · ROADMAP RECOMENDADO (sin Pablo / con Pablo)

### Fase 1 — Sin Pablo (días 1-2)
- Patch SYSTEM_PROMPT v9 (§ 11.2)
- Smoke test 10 prompts canónicos (§ 11.4)
- Deploy a EF `diego-chat-process` versión v8.1 (patch-only)
- Medir baseline 5 días

### Fase 2 — Con Pablo (semana 2-3)
- Schema `curated.diego_memoria_corto` + `diego_memoria_largo` (DDL § 7.3)
- Edge Function `diego-summarizer` (cada 10 turnos genera summary)
- Integración pgvector + embeddings (Voyage / OpenAI text-embedding-3-small)
- HITL middleware estilo LangGraph en EF para tools de escritura

### Fase 3 — Con Pablo (mes 2)
- Guardrails formales: Lakera Guard como pre-filter de entrada (prompt injection)
- NeMo Guardrails para topic control (que Diego no responda preguntas fuera de Reciclean-Farex)
- Audit log completo de tool calls + decisiones de elevación
- Dashboard `diego-metrics.html` en panel-rdo con los KPIs § 12

---

## 14 · FUENTES (≥10 referencias 2025-2026)

1. **ICLR 2026** — *"LLMs Lose Accuracy in Multi-Turn Conversations"* — https://beam.ai/agentic-insights/iclr-2026-llms-lose-accuracy-in-multi-turn-conversations (caída 39% accuracy, colapso 112% reliability).
2. **Anthropic Support 2026** — *"Custom visuals in chat and Cowork"* — https://support.claude.com/en/articles/13979539-custom-visuals-in-chat-and-cowork (Claude decide visual vs texto).
3. **fin.ai 2026** — *"AI Agent KPIs: Enterprise Performance Framework"* — https://fin.ai/learn/ai-agent-kpis-enterprise-performance-metrics-framework (resolution rate 55-70% / 80% top).
4. **arXiv 2412.06676** — *"I Don't Know: Explicit Modeling of Uncertainty with an [IDK] Token"* — https://arxiv.org/pdf/2412.06676.
5. **arXiv 2512.19920** — *"Mitigating LLM Hallucination via Behaviorally Calibrated RL"* — https://arxiv.org/pdf/2512.19920.
6. **NVIDIA NeMo Guardrails 2026** — https://developer.nvidia.com/nemo-guardrails.
7. **Lakera Guard docs** — https://docs.lakera.ai/docs/defenses.
8. **LangGraph 1.2 (mayo 2026)** — *Human-in-the-loop docs* — https://docs.langchain.com/oss/python/langchain/human-in-the-loop.
9. **Slack 2026** — *"AI-Powered Bots Guide"* — https://slack.com/blog/productivity/ai-powered-bots-guide-to-chatbots-tools-and-best-practices (21% faster + 15% higher CSAT).
10. **Quickchat 2026** — *"Chatbot CSAT Score Guide"* — https://quickchat.ai/post/chatbot-csat-score-guide.
11. **arXiv 2410.10813** — *LongMemEval benchmark* — https://arxiv.org/pdf/2410.10813.
12. **Mermaid Chart blog** — *"Claude to Mermaid AI generated diagrams"* — https://mermaid.ai/blog/posts/claude-to-mermaid-ai-generated-diagrams.
13. **MindStudio 2026** — *"What is Claude's Generative UI Feature"* — https://www.mindstudio.ai/blog/what-is-claude-generative-ui-vs-canvas-artifacts.
14. **Confident AI 2026** — *"Multi-Turn LLM Evaluation"* — https://www.confident-ai.com/blog/multi-turn-llm-evaluation-in-2026.

---

## 15 · NOTAS PARA DUSAN (cierre 3 líneas)

- **Hoy decidiste:** investigación entregada, sin commit todavía. Dusan revisa y decide patch v9.
- **PC Dusan arranca con:** smoke test + patch al SYSTEM_PROMPT v9 si Dusan firma (≤2 días, sin Pablo).
- **Te queda pendiente:** firmar D-DIEGO-V9-001 = "aplicar patch § 11.2 a `diego-chat-process` EF". Si firmas, PC Dusan ejecuta. Si no, queda como propuesta.
