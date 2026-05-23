# DIEGO — Estándar Mundial 2026 de Razonamiento y Negociación

> **Agente A · Investigación coordinada para definir las brechas de razonamiento y negociación del copiloto Diego.**
> **Stack actual referencia:** Diego v6 · Edge Function `diego-chat-process` v4 ACTIVE · Supabase `eknmtsrtfkzroxnovfqn` · OpenAI `gpt-4o-mini` + `gpt-4o` con function calling · 7 tools en whitelist · clasificador 6W · system prompt `DIEGO-PROMPT-MAXIMO.md` (602 líneas) · FAB drag-and-drop mergeado en PR #57 (23-may-2026)
> **Fecha:** 2026-05-23
> **Objetivo:** Mapear las seis dimensiones que separan a un chatbot single-shot de un copiloto que **razona, negocia, detecta inconsistencias, simula escenarios, prioriza por impacto y explica sus decisiones** antes de ejecutarlas.

Leyenda de prioridad: **ALTA** (bloquea decisiones de CEO o pone en riesgo el margen) · **MEDIA** (mejora calidad de juicio) · **BAJA** (nice-to-have).
Estado en Diego v6: ✅ tiene · 🟡 parcial · ❌ no tiene · ❓ verificar con Pablo.

---

## 0. Por qué este documento existe

Diego v6 hoy resuelve **una consulta por turno**. Cony pregunta "cuánto va Pincore este mes" → Diego llama `resumen_facturacion_mes` → devuelve un número. Eso es nivel chatbot.

El estándar 2026 del que hablan Anthropic, OpenAI, Google DeepMind, DeepSeek, Pactum y Cresta es otro: el copiloto **piensa antes de responder**, **negocia condiciones**, **detecta que dos números no cierran**, **simula qué pasa si bajo el margen 2%**, **prioriza por impacto en la meta, no por orden FIFO**, y **explica por qué hizo lo que hizo, antes de hacerlo**.

Este documento describe esos seis estándares con fuentes 2025-2026 reales, y al final marca las **10 brechas concretas vs Diego v6** y las **5 cosas que se pueden cerrar sin Pablo** modificando solo el prompt o `panel.config_ui`.

El público es Dusan Arancibia (CEO, no-técnico). Cada concepto técnico va con su traducción comercial.

---

## 1. Razonamiento multi-paso: el modelo piensa antes de hablar

### 1.1 Qué cambió entre 2024 y 2026

Hasta 2024, los LLM como GPT-4 o Claude 3 Opus respondían **single-shot**: leían la pregunta y emitían tokens sin pausar. Si la pregunta requería 5 pasos de razonamiento, el modelo intentaba hacer los 5 pasos "en su cabeza" mientras escribía la respuesta. Eso producía errores en tareas de matemática, lógica encadenada, planificación y análisis financiero.

Entre fines de 2024 y mayo 2026 ocurrió la **revolución del razonamiento**:

- **OpenAI lanza la familia o** (o1 dic-2024, o3 abr-2025, o3-pro jun-2025) entrenada con **reinforcement learning de cadenas de pensamiento privadas**. El modelo "piensa" antes de hablar, en una cadena oculta al usuario, y solo emite la respuesta final cuando terminó de razonar.
- **DeepSeek libera R1** (20-ene-2025) — primer modelo open-source con razonamiento equivalente a o1, entrenado puramente con RL (sin SFT previo). Demostró que el razonamiento **emerge** de la recompensa, no se enseña token a token. Etiquetas `<think>...</think>` exponen la cadena al usuario por defecto.
- **Anthropic introduce Extended Thinking** en Claude 4 (mayo 2025) y lo reemplaza por **Adaptive Thinking** en Opus 4.6 / Sonnet 4.6 (febrero 2026) y Opus 4.7. Adaptive Thinking deja que el modelo decida cuánto pensar según la dificultad, con niveles `low / medium / high / xhigh / max` controlables por el desarrollador.
- **Google Gemini Deep Think** llega con razonamiento extendido y planificación multi-hora.

### 1.2 Las tres familias de razonamiento que un copiloto serio implementa

#### Chain of Thought (CoT) — la base

Cadena de pensamiento lineal: el modelo escribe paso 1, paso 2, paso 3 y la conclusión. Es la forma más simple. Sirve cuando el problema tiene **una sola línea correcta de razonamiento** (cálculo de margen, conversión de unidades, lectura de una tabla).

Limitación: si el primer paso es incorrecto, toda la cadena se contamina.

#### Tree of Thoughts (ToT) — exploración paralela

Publicado por Shunyu Yao (Princeton + Google DeepMind) en mayo 2023 (arXiv 2305.10601). El modelo **genera varias ramas de pensamiento en paralelo**, evalúa cada una con un valor heurístico, hace backtracking si una rama no convence y elige la mejor. Es lo que un humano hace cuando dice "déjame pensarlo de tres formas distintas".

Aplica cuando el problema requiere **lookahead** (mirar adelante) o **backtracking** (deshacer): juego de ajedrez, escritura creativa, planificación de logística, **cotización con múltiples escenarios de margen**.

Costo: 5-20x más llamadas al LLM que CoT lineal. Latencia alta. Se usa offline o en decisiones de alto impacto, no en chat conversacional.

#### ReAct (Reasoning + Acting) — pensar y actuar entrelazado

Publicado también por Yao et al. (arXiv 2210.03629, ICLR 2023). Es el patrón que sostiene casi todos los agentes 2024-2026. La estructura es:

```
Thought: necesito saber cuánto cobre brillante facturó Pincore en mayo.
Action: consultar_facturacion(cliente="Pincore", material="Cu Brillante", mes="2026-05")
Observation: 4.2 toneladas, $34.5M CLP
Thought: el precio promedio sale $8.214/kg, hoy el mercado está $8.350. Pincore está bajo mercado 1.6%.
Action: consultar_precio_mercado(material="Cu Brillante", fecha="hoy")
Observation: $8.350/kg LME ajustado
Thought: confirmo el gap. Voy a registrar una alerta para revisar precio con Andrea.
Action: registrar_tarea_cola(prioridad="alta", asignado="Andrea", contexto="...")
```

Diego v6 ya implementa una **forma básica de ReAct** vía OpenAI function calling con sus 7 tools. Lo que no implementa es **multi-paso explícito**: hoy hace típicamente Action → Observation → respuesta. No encadena 3-4 pasos con backtracking.

### 1.3 Cuándo exponer la cadena al usuario vs ocultarla

Anthropic distingue tres modos en su API:

| Modo | Cuándo usar | Ejemplo Diego |
|---|---|---|
| `display: "summarized"` | El usuario quiere entender por qué (decisiones de alto impacto, auditoría) | "Diego ¿por qué subiste el precio del aluminio?" → muestra cadena resumida |
| `display: "omitted"` | Latencia importa más que transparencia (chat fluido, atajos) | "¿cuánto pagamos por chatarra ferrosa hoy?" → respuesta directa |
| `thinking disabled` | Tarea trivial, ahorra tokens | "hola Diego" → saludo |

**Regla 2026**: por defecto ocultar (mejor UX), pero **exponer la cadena cuando**:
1. La acción tiene impacto monetario > $500.000 CLP.
2. La acción modifica datos (no solo consulta).
3. El usuario pide explícitamente "explícame", "¿por qué?", "muéstrame el razonamiento".
4. El sistema detectó inconsistencia y va a flagear una alerta.

### 1.4 Trade-off latencia ↔ calidad

| Configuración | Latencia primer token | Calidad razonamiento | Costo |
|---|---|---|---|
| Sin thinking (Sonnet 4.6 base) | 600-900 ms | Buena para 80% de queries | 1x |
| Adaptive thinking `low` | 1.5-3 s | Mejora 5-10% en problemas complejos | 1.3x |
| Adaptive thinking `high` | 8-25 s | Mejora 15-30% en problemas complejos | 3-5x |
| Adaptive thinking `xhigh` (Opus 4.7) | 25-60 s | Frontera estado del arte | 5-8x |

Para Diego, el patrón recomendado es **routing por intent**:
- Saludos, consultas de hechos puntuales → sin thinking, Sonnet 4.6 base.
- Análisis cruzados, cotizaciones, simulaciones → `high` o `xhigh`, Opus 4.7.
- Decisiones críticas (firma, contratos, alertas de margen negativo) → `xhigh` + cadena visible.

### 1.5 Process Reward Models — verificar paso a paso

Un avance clave 2025 que Diego v6 no implementa: los **PRM (Process Reward Models)**. La idea es que en vez de evaluar solo la respuesta final, un modelo crítico evalúa **cada paso del razonamiento**. Si el paso 3 está mal, se detecta antes de seguir.

OpenAI demostró en "Let's Verify Step by Step" (2023) y trabajos posteriores que esto mejora dramáticamente matemática y código. En 2025 aparecieron **BiRM** (bidireccional, inspirado en A*) y **ThinkPRM** (verificador con CoT propio).

Aplicación realista para Diego: antes de ejecutar `registrar_tarea_cola`, un segundo paso de Claude/GPT revisa "¿esta tarea tiene sentido dado el contexto?". Es un guardrail anti-alucinación.

### 1.6 Estado Diego v6

- CoT implícito vía system prompt: 🟡 parcial (depende de instrucciones, no es estructural).
- ToT: ❌ no tiene.
- ReAct: 🟡 parcial (function calling single-step, no multi-step encadenado).
- Adaptive thinking: ❌ no tiene (usa `gpt-4o-mini` sin razonamiento extendido).
- Cadena visible al usuario: ❌ no tiene.
- PRM verificación de pasos: ❌ no tiene.

**Prioridad de cierre: ALTA.**

---

## 2. Negociación asistida: del haggle-bot al negociador superhumano

### 2.1 Por qué Diego necesita negociar (no solo informar)

Reciclean es **comprador-revendedor**. El margen no es un número fijo: es un porcentaje sobre precio de mercado móvil del cobre, aluminio, chatarra, papel, plástico. Cuando un Generador (Pincore, por ejemplo) pide cotización, alguien negocia: "te pago $8.100/kg de Cu Brillante" → "el mercado está $8.350, pago $8.250 si retiras 2t mínimo y firmas pago a 7 días" → contraoferta.

Hoy esa negociación la hace Andrea Rivera por WhatsApp, sin asistente. Diego v6 puede consultar precio pero **no propone anclas, no calcula BATNA, no detecta ZOPA, no formula contraofertas**.

### 2.2 El marco de Pactum: cuatro niveles de inteligencia negociadora

Pactum (Series C, 16-may-2025; principal proveedor de AI negotiation para Global 2000) define cuatro niveles. Diego v6 está en **nivel 0** (no negocia, solo informa). El estándar 2026 es nivel 3-4:

| Nivel | Capacidad | Donde está Diego |
|---|---|---|
| 1 — Standard "haggle-bot" | Negocia 1-2 variables (precio, plazo) con script fijo | Falta |
| 2 — Advanced | Captura múltiples ofertas simultáneas, aplica ciencia de negociación, trade-offs entre variables | Falta |
| 3 — Expert | Considera métricas de performance, márgenes, competencia, precios commodities; identifica oportunidades proactivamente | Falta |
| 4 — Superhuman | Monitorea WhatsApp/Telegram, identifica oportunidades en tiempo real, cierra acuerdos sin intervención humana | Lejos |

Para Reciclean lo realista 2026 es llegar a nivel 2-3.

### 2.3 Los conceptos canónicos de negociación que Diego debe manejar

Estos vienen de la escuela de Harvard (Fisher & Ury, "Getting to Yes") y son el lenguaje común de Pactum, Cresta, Salesforce Einstein, Affinity:

#### ZOPA — Zone of Possible Agreement

El rango donde ambas partes pueden cerrar. Para Cu Brillante hoy:
- Mínimo Reciclean (no quemar margen): $7.900/kg compra
- Máximo Reciclean (margen ideal): $8.250/kg compra
- ZOPA con Pincore: $7.900 – $8.250

Si Pincore pide $8.400, **está fuera de ZOPA** → Diego debe detectarlo y proponer alternativas (mayor volumen, plazo, exclusividad) en vez de aceptar.

#### BATNA — Best Alternative To a Negotiated Agreement

La mejor opción si esta negociación no se cierra. Si Pincore no acepta, ¿a quién más le vendo? ¿a qué precio? El BATNA define el piso real de Reciclean.

Diego debería poder responder: "Si Pincore rechaza $8.250, mi BATNA es vender a HUAL a $8.180 con flete 35km mayor. Punto de indiferencia: $8.230 neto."

#### Anchoring (anclaje)

Quien tira el primer número, sesga la negociación. Si Diego propone $8.100 primero, la conversación gira en torno a ese número. Si Pincore propone $8.400, gira en torno al de ellos.

Regla 2026: **anclar primero con un número defendible**, no extremo (porque pierdes credibilidad).

#### Framing

Misma propuesta, distinto envoltorio. "Pierdes $50 por kg" duele más que "ganas $200 menos por kg". Diego debe enmarcar pérdidas como oportunidades alternativas.

#### Trade-offs multi-variable

Casi ninguna negociación es de una variable. Reciclean tiene:
- Precio/kg
- Volumen mínimo
- Plazo de pago (0/7/15/30 días)
- Exclusividad
- Quién paga el flete
- Bonificación por calidad

Un negociador inteligente intercambia: "te subo el precio si me das exclusividad por 6 meses".

### 2.4 Qué dice la investigación 2024-2026 sobre LLMs negociando

El paper **NegotiationArena** (Bianchi et al., arXiv 2402.05863, feb 2024) midió cómo negocian los LLMs entre sí en tres escenarios: ultimátum, trading de recursos, compra-venta. Hallazgos clave:

1. Los LLMs exhiben **conductas irracionales humanas** (aversión a la pérdida, anclaje, sesgo de reciprocidad).
2. Una táctica conductual ("hacerse el desesperado") **mejora el payoff 20%** vs GPT-4 standard.
3. Detección de ZOPA y BATNA es **frágil**: el modelo a veces acepta acuerdos peores que su BATNA si no se le recuerda explícitamente.

El paper **"Real-Time Deadlines Reveal Temporal Awareness Failures in LLM Strategic Dialogues"** (arXiv 2601.13206, enero 2026) muestra que los LLMs son malos manejando deadlines en negociación — pierden urgencia o la inventan.

Implicación para Diego: la negociación no se delega ciegamente al LLM. Se le da:
- BATNA precomputado y explícito en el prompt o como tool.
- ZOPA precomputado (piso, techo) por material y cliente.
- Estado del deadline ("cierre cotización: 17:00 hoy").
- Función `evaluar_contraoferta(precio, volumen, plazo)` que devuelve impacto en margen.

### 2.5 El estado del arte enterprise: Pactum + Cresta + Salesforce Einstein

- **Pactum** (procurement-side, comprador): agentes autónomos que negocian con proveedores por WhatsApp/email/portal, con políticas y guardrails definidos por el equipo de compras. Mayo 2025 lanzaron el **Requisition Alignment Agent** que evalúa si una solicitud entrante vale la pena negociar antes de gastar agentes en ella — equivalente a triage automático.
- **Cresta** (sales-side, asistencia a vendedores en tiempo real): sugerencias en vivo durante llamadas, detecta objeciones, propone respuestas, identifica momentos de cierre.
- **Salesforce Einstein** integra negociación asistida en CRM con scoring de probabilidad y next-best-action.

El patrón común 2026: **agente coopera con humano, no lo reemplaza** en negociaciones complejas. El humano firma; el agente prepara, sugiere, calcula impacto.

### 2.6 Estado Diego v6

- ZOPA/BATNA computado: ❌ no tiene.
- Anchoring guidance: ❌ no tiene.
- Multi-variable trade-off: ❌ no tiene.
- Detección de objeciones (cliente dice "muy caro"): ❌ no tiene.
- Contrapropuestas automáticas: ❌ no tiene.
- Memoria del historial negociador con cada cliente: 🟡 parcial (existe `curated.diego_audit_log` pero no se usa para contexto negociador).

**Prioridad de cierre: ALTA.**

---

## 3. Detección de inconsistencias: el copiloto que dice "este número no cierra"

### 3.1 El problema concreto en Reciclean

Cony entra al sistema y ve facturación Pincore mayo: $34.5M. En paralelo, Andrea le dice por WhatsApp que Pincore confirmó $36M en mayo. Hay $1.5M de diferencia. ¿Quién tiene razón? ¿Hubo factura no registrada? ¿Hubo nota de crédito? ¿Hubo doble conteo? Diego v6 no detecta esto.

Una segunda inconsistencia clásica: el precio de Cu Brillante en `precios_cliente` está $8.350 para Pincore, pero la última cotización registrada cobró $8.100. ¿Por qué? ¿Quedó desactualizado el maestro? ¿Hubo descuento por volumen no documentado?

Un copiloto 2026 detecta esto sin que se lo pidan.

### 3.2 El paradigma data observability

Monte Carlo, Great Expectations, Bigeye, Sifflet y Datadog Data Observability dominan el espacio. La filosofía es **detection-first**: capturar anomalías temprano, mostrar impacto rápido, acelerar resolución con metadata y lineage.

Las cinco dimensiones canónicas que monitorean:

| Dimensión | Qué chequea | Ejemplo Reciclean |
|---|---|---|
| Freshness | ¿Llegaron los datos a tiempo? | RDO de Cerrillos no llegó hoy a las 18:00 |
| Volume | ¿Hay más/menos filas de lo esperado? | Mayo registró 60% menos cotizaciones que abril |
| Schema | ¿Cambió la estructura? | Apareció columna nueva en `precios_cliente` |
| Distribution | ¿Cambió el rango/promedio? | Precio Cu saltó +22% en un día |
| Lineage | ¿De dónde viene este número? | Total facturación mayo viene de 47 boletas + 3 NC |

### 3.3 Cross-source reconciliation: el patrón clave para Diego

En Reciclean hay al menos cuatro fuentes de verdad parciales:
1. Supabase `curated.*` (canónica)
2. SII (sistema fiscal Chile, externa)
3. WhatsApp/email con clientes (conversaciones)
4. Boletas físicas/RDO (papel)

Inconsistencias surgen entre fuentes. Un copiloto 2026 hace **reconciliación cruzada**: si dos fuentes dan números distintos, lo flagea con probabilidad de causa raíz.

Monte Carlo en septiembre 2025 lanzó **agentic observability** — agentes que no solo detectan, sino que proponen resolución autónoma (con humano en el loop para aprobar).

### 3.4 Anomaly flags para chatbots

Cuando un copiloto detecta inconsistencia, el patrón 2026 es:

1. **Detectar** (regla declarativa o ML de anomalía).
2. **Calcular impacto** ("$1.5M de diferencia, 4.3% del mes").
3. **Hipotetizar causa** (top 3 explicaciones probables).
4. **Proponer acción** (auditar boletas, llamar a Cony, revisar SII).
5. **Esperar firma humana** (no auto-resolver datos contables).

### 3.5 Estado Diego v6

- Detección freshness: ❌ no tiene.
- Detección volume: ❌ no tiene.
- Detección distribution / anomaly: ❌ no tiene.
- Cross-source reconciliation: ❌ no tiene.
- Flagging automático al usuario cuando ve inconsistencia: ❌ no tiene.

**Prioridad de cierre: ALTA.** Esto es lo que más dolor produce en operación diaria.

---

## 4. Simulación de escenarios "¿qué pasaría si…?"

### 4.1 La pregunta que Dusan hace y Diego no contesta

"Diego, ¿qué pasa si bajo el margen de cobre brillante 2% y subo el de aluminio 3%?"
"¿Qué pasa si Pincore se va y lo reemplazo con HUAL?"
"¿Qué pasa si el cobre LME sube 15% el próximo trimestre?"

Diego v6 no contesta nada de esto. No tiene noción de **counterfactual** (qué habría pasado si) ni de **causal inference** (qué causa qué).

### 4.2 Los dos paradigmas: causal inference y counterfactual reasoning

#### Causal inference

Judea Pearl (UCLA, premio Turing 2011) formalizó la diferencia entre correlación y causalidad. Las herramientas modernas: **DoWhy** (Microsoft, librería Python), **EconML** (Microsoft, foco econometría), **CausalML** (Uber). Permiten modelar "si subo precio, ¿el volumen cae causalmente o solo correlaciona con la estacionalidad?".

#### Counterfactual reasoning

"¿Qué habría pasado si…?". Es el modo subjuntivo del razonamiento. Los LLMs tienen una **debilidad documentada** acá. El paper "On the Eligibility of LLMs for Counterfactual Reasoning" (arXiv 2505.11839, mayo 2025) muestra que GPT-4o y Claude fallan sistemáticamente en counterfactuals complejos.

El paper "Executable Counterfactuals: Improving LLMs' Causal Reasoning Through Code" (arXiv 2510.01539, octubre 2025) propone una solución: en vez de pedirle al LLM que razone, que **genere código** que simule el counterfactual y ejecute. Esto es exactamente lo que un copiloto financiero serio debe hacer.

### 4.3 Productos enterprise que hacen lo que Diego debe hacer

- **Pigment** (París, Series D 2024): plataforma de business planning con AI nativa. Permite modelar escenarios "qué pasa si" sobre datos financieros corporativos. En 2025 lanzó **agentic AI** que hace que los usuarios "se sientan como mini CFOs" — sugiere escenarios proactivamente.
- **Causal.app** (adquirida por Lucanet 2024): foco en modelado financiero con escenarios encadenados.
- **Anaplan AI** (legacy enterprise): modelos de planificación con AI assist.
- **Mosaic Tech**: planning para empresas medianas, énfasis en escenarios cash-flow.

### 4.4 Cómo se aplicaría a Reciclean

Diego v6 ya tiene `f_evaluar_retiro v6` — función Supabase que calcula margen con 5 componentes y piso 30%. Eso es la base para simulación. Lo que falta es la capa conversacional:

```
Dusan: "Diego, simula si bajamos el piso de margen de 30% a 25% por 3 meses para ganar volumen"
Diego: [llama f_evaluar_retiro con piso=0.25 sobre histórico últimos 90 días]
       [calcula delta facturación vs delta margen absoluto]
       [proyecta a 90 días con escenarios pesimista/base/optimista]
       "Si el volumen crece 18% (escenario base), ganas $4.2M extra de margen absoluto
        pese al margen % menor. Si el volumen no crece (pesimista), pierdes $1.8M.
        Punto de equilibrio: necesitas +9.2% de volumen para que la jugada sea neutra.
        ¿Te muestro qué clientes son sensibles a precio según historial?"
```

Esto es nivel 3 enterprise. Requiere:
- Función simulación en Supabase (Pablo).
- Prompt que sepa cuándo llamarla.
- Visualización del resultado (cards comparativos, no solo texto).

### 4.5 Estado Diego v6

- Simulación de escenarios: ❌ no tiene.
- Counterfactual reasoning: ❌ no tiene.
- Causal inference: ❌ no tiene.
- Sensibilidad por variable: ❌ no tiene.
- Visualización comparativa de escenarios: ❌ no tiene.

**Prioridad de cierre: ALTA** (para Dusan como CEO, esto es lo que más valor agrega — decisiones estratégicas).

---

## 5. Priorización dinámica por impacto en metas (no FIFO)

### 5.1 El problema concreto

Hoy Diego procesa tareas en orden FIFO. Si entran a la cola en este orden:
1. Andrea pide cotización chatarra para Talca (impacto $400.000)
2. Cony pregunta facturación abril (informativo)
3. Pablo pide cambiar precio polietileno (impacto $5.2M trimestre)

Diego responde 1 → 2 → 3. Pero el orden por impacto debería ser **3 → 1 → 2**. El estándar 2026 prioriza dinámicamente.

### 5.2 Los frameworks canónicos

#### RICE — Reach × Impact × Confidence / Effort

Estándar product management desde Intercom (2017). Cada item recibe score numérico. Útil cuando hay múltiples decisiones con dimensiones cuantificables.

#### ICE — Impact × Confidence × Ease

Más simple, más rápido. Para triage cotidiano.

#### MoSCoW — Must / Should / Could / Won't

Categórico, no numérico. Para alinear stakeholders.

#### Kano — Satisfacción vs funcionalidad

Para priorizar features de producto, no operaciones.

#### Weighted Scoring con OKR multiplier

Variante 2025 de RICE: si la tarea está alineada con un OKR vigente, se multiplica el impacto x1.5. Esto es lo que Linear y Atlassian Atlas implementan en sus features AI 2026.

### 5.3 Cómo lo hace un copiloto 2026

El patrón "RICE-A" (RICE for AI-driven features) propone que el agente calcule el score automáticamente con tres entradas:

1. **Reach**: ¿a cuántas personas/empresas afecta? (cliente único vs cartera completa)
2. **Impact**: monto en $ o severidad operativa (cuelga proceso vs nice-to-know)
3. **Confidence**: ¿qué tan seguro estoy del impacto? (dato confirmado vs estimación)
4. **Effort**: cuánto cuesta resolver (5 min vs 2 semanas)

Para Diego, el cálculo en runtime sería:

```
score = (reach × impact × confidence × OKR_multiplier) / effort
```

Y el copiloto reordena la cola en cada turno. Linear AI Cycles, Atlassian Focus y Tability hacen esto desde 2025.

### 5.4 Cómo se conecta con OKRs corporativos

Reciclean ya tiene metas en el panel-rdo. Si la meta vigente Q2-2026 es "subir margen agregado 8% sin perder volumen >5%", entonces:
- Tareas que afectan margen reciben multiplier 1.5x.
- Tareas que afectan volumen reciben multiplier 1.5x.
- Tareas administrativas reciben multiplier 1.0x.

Diego v6 no tiene esa noción. La cola es FIFO.

### 5.5 Estado Diego v6

- Scoring por impacto: ❌ no tiene (FIFO puro).
- Reordenamiento dinámico: ❌ no tiene.
- Multiplier por OKR: ❌ no tiene.
- Visualización de prioridad al usuario: ❌ no tiene.

**Prioridad de cierre: MEDIA-ALTA.** Es relativamente barato de implementar y tiene impacto inmediato en percepción de utilidad.

---

## 6. Decisiones con explicación transparente (XAI 2026)

### 6.1 Por qué importa

Diego v6 hoy ejecuta acciones y registra el evento en `curated.diego_audit_log`. Eso es **auditoría post-facto**: "Diego hizo X". El estándar 2026 es **auditoría pre-facto**: "Diego va a hacer X porque cumple A, B, C — ¿confirmas?".

La diferencia es enorme para acciones críticas:
- Modificar precio maestro
- Firmar cotización > $1M
- Enviar mensaje a cliente
- Crear tarea con asignado humano

### 6.2 Los dos enfoques XAI

#### Post-hoc explanation (SHAP, LIME)

Modelos como XGBoost o redes neuronales son cajas negras. Se entrena un explicador encima que retroactivamente intenta explicar por qué el modelo decidió eso. SHAP (Lundberg & Lee 2017) y LIME (Ribeiro 2016) son los clásicos.

Problema: las explicaciones son **aproximadas**. No son la razón real, son una racionalización plausible.

#### Inherently interpretable models / Mechanistic Interpretability

La frontera 2025-2026. Anthropic publica investigación de **circuit-tracing en Claude 3.5 Haiku** (mayo 2025): mapean qué neuronas se activan para qué concepto, descubren que el modelo planifica adelante en poesía con rima, comparten conceptos entre idiomas. MIT Technology Review nombró mechanistic interpretability como **breakthrough technology 2026**.

OpenAI tiene **chain-of-thought monitoring** — un segundo modelo lee la cadena de razonamiento del primero y detecta si está mintiendo, haciendo trampa o desviándose. Lo usaron para descubrir que un modelo de razonamiento estaba haciendo trampa en tests de código.

#### Constitutional AI (Anthropic)

El modelo se auto-critica contra un conjunto fijo de principios ("constitución") y revisa su respuesta antes de emitirla. Es una forma de auto-explicación: el modelo justifica por qué su respuesta cumple los principios.

### 6.3 Aplicación práctica a Diego

Lo realista para Diego v6 no es mechanistic interpretability (eso es research). Lo realista es:

#### Nivel A — Decision card pre-ejecución (acción crítica)

Antes de ejecutar una acción crítica, Diego emite una **decision card** estructurada:

```
ACCIÓN PROPUESTA: actualizar precio Cu Brillante de $8.250 a $8.350
JUSTIFICACIÓN:
  • LME cobre subió 1.8% en 24h (fuente: API LME timestamp 14:32)
  • 4 de 5 competidores monitoreados ajustaron (fuente: scraping fuentes_publicas)
  • Margen actual cae 0.4 puntos si no se ajusta (cálculo f_evaluar_retiro)
  • Cliente Pincore tiene contrato indexado (revisar antes de aplicar)
RIESGOS: si Pincore reclama, BATNA es HUAL a $8.180
CONFIANZA: 87%
¿Aprobar? [Sí, aplicar] [No, mantener] [Esperar a Andrea]
```

#### Nivel B — Auditable rationale post-ejecución

Para acciones rutinarias, Diego ejecuta y registra el rationale en `diego_audit_log` con campo nuevo `rationale_json`:

```json
{
  "action": "registrar_tarea_cola",
  "rationale": [
    "Cliente preguntó por precio Cu Brillante",
    "Detecté que es la 3ra consulta del mes — patrón de cotización inminente",
    "Creé tarea para Andrea con prioridad alta y contexto histórico"
  ],
  "confidence": 0.78,
  "alternatives_considered": ["responder solo precio", "agendar reunión", "esperar más info"]
}
```

### 6.4 Cuándo justificar antes vs después

Regla 2026:

| Tipo de acción | Justificación |
|---|---|
| Consulta read-only | Post-facto, solo logging |
| Acción write reversible (crear tarea, agendar) | Post-facto con rationale |
| Acción write irreversible o > $500K impacto | **Pre-facto con confirmación humana** |
| Acción que toca cliente (mensaje, firma) | **Pre-facto siempre** |
| Acción cuando detectó inconsistencia | **Pre-facto con flag** |

### 6.5 Estado Diego v6

- Logging post-facto en `diego_audit_log`: ✅ tiene.
- Rationale estructurado por acción: ❌ no tiene (solo registra qué hizo, no por qué).
- Decision card pre-ejecución para acciones críticas: ❌ no tiene.
- Confianza explícita (probabilidad/score): ❌ no tiene.
- Alternativas consideradas: ❌ no tiene.
- Constitutional self-critique: ❌ no tiene.

**Prioridad de cierre: ALTA** para acciones write críticas. Es lo que separa "asistente sofisticado" de "copiloto auditable" en regulación enterprise 2026.

---

## 7. Cómo se integran las seis dimensiones en un loop

El copiloto 2026 corre cada turno aproximadamente así:

```
1. CLASIFICAR intent (Diego v6 ya hace esto con clasificador 6W).
2. PRIORIZAR según score impacto × confianza × OKR / esfuerzo.
3. RAZONAR multi-paso con CoT/ReAct adaptado a complejidad.
4. SIMULAR escenarios si la pregunta lo requiere (qué-pasa-si).
5. NEGOCIAR si hay contraparte (cliente/proveedor) con ZOPA y BATNA precomputados.
6. VERIFICAR contra inconsistencias cruzando fuentes (data observability).
7. EXPLICAR la decisión con rationale antes de actuar (XAI pre-ejecución).
8. EJECUTAR action vía tool.
9. AUDITAR en log con rationale estructurado.
10. APRENDER del resultado (feedback loop, fuera de scope corto plazo).
```

Diego v6 hace 1, 8 y 9 parcial. Falta el resto.

---

## 8. Lo que NO es estándar 2026 (anti-patrones)

Para evitar sobre-engineering, marcar lo que ya no se considera buena práctica:

- **Cadenas ToT siempre encendidas**: caro, lento, mata UX. Solo en decisiones críticas.
- **Mostrar toda la cadena de razonamiento al usuario por default**: produce ruido. Mostrar bajo demanda o en decisión crítica.
- **Reemplazar al humano en negociaciones complejas**: ningún proveedor enterprise serio lo recomienda. Cooperación, no reemplazo.
- **Confianza ciega en counterfactuals del LLM**: fallan sistemáticamente. Usar código ejecutable.
- **SHAP/LIME para LLMs**: se diseñaron para modelos clásicos. En LLMs son ruido. Usar mechanistic interp o constitutional self-critique.
- **Re-ranking de prioridad agresivo cada segundo**: confunde al usuario. Re-rank en intervalos significativos (cada nueva entrada, cada 5 min).

---

## 9. Stack recomendado 2026 para Diego v7

| Capa | Tecnología recomendada | Comentario |
|---|---|---|
| Modelo base orquestador | Claude Sonnet 4.6 (default), Opus 4.7 para razonamiento pesado | Mejor en español, mejor function calling 2026 |
| Razonamiento extendido | Anthropic Adaptive Thinking `low/high/xhigh` | Routing por intent |
| Modelo verificador (PRM) | Claude Haiku 4.6 o GPT-4o-mini como crítico | Barato, rápido |
| Tool calling | OpenAI function calling (ya implementado) o Anthropic tool use | Mantener compatibilidad |
| Memoria conversacional | Supabase Postgres + pgvector | Aprovechar stack actual |
| Data observability | Reglas declarativas en SQL + Edge Function periódica | No comprar Monte Carlo aún — overkill |
| Simulación | Funciones SQL parametrizadas (`f_evaluar_retiro`) + capa LLM que las llama | Pablo extiende lo que ya hay |
| Visualización pauta oro | Chart.js + Inter + verde #059669 (skill `visual-oro` ya activa) | Ya está |
| Logging XAI | Extender `curated.diego_audit_log` con `rationale_json` + `confidence` + `alternatives` | DDL pequeña |

---

## 10. Fuentes externas verificadas

1. [Anthropic — Building with Extended Thinking (Claude API Docs)](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) — referencia oficial Adaptive Thinking, modos summarized/omitted, trade-off latencia.
2. [Anthropic — Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7) — descripción del nivel xhigh, capacidades agentic, razonamiento sostenido multi-hora.
3. [Yao et al. — Tree of Thoughts: Deliberate Problem Solving (arXiv 2305.10601)](https://arxiv.org/abs/2305.10601) — paper canónico ToT, NeurIPS 2023.
4. [Yao et al. — ReAct: Synergizing Reasoning and Acting (arXiv 2210.03629)](https://arxiv.org/abs/2210.03629) — paper canónico ReAct, ICLR 2023.
5. [Pactum — Transforming Deal Making: The Four Levels of AI Negotiation Intelligence](https://pactum.com/blog/transforming-deal-making-a-look-into-the-four-levels-of-ai-negotiation-intelligence) — framework canónico niveles 1-4 AI negotiation.
6. [Pactum — Requisition Alignment Agent launch (AIThority, 2026)](https://aithority.com/machine-learning/pactum-launches-requisition-alignment-agent-to-advance-ai-driven-procurement-workflows/) — triage automático de oportunidades de negociación.
7. [Bianchi et al. — How Well Can LLMs Negotiate? NegotiationArena (arXiv 2402.05863)](https://arxiv.org/abs/2402.05863) — benchmarks negociación LLM, conductas irracionales, táctica "desesperado".
8. [DeepSeek-R1 Model Card en HuggingFace](https://huggingface.co/deepseek-ai/DeepSeek-R1) — primer modelo open-source con razonamiento RL, etiquetas `<think>`, distilados.
9. [OpenAI — Introducing o3 and o4-mini](https://openai.com/index/introducing-o3-and-o4-mini/) — familia de razonamiento OpenAI.
10. [MIT Technology Review — Mechanistic Interpretability: 10 Breakthrough Technologies 2026](https://www.technologyreview.com/2026/01/12/1130003/mechanistic-interpretability-ai-research-models-2026-breakthrough-technologies/) — estado del arte XAI 2026.
11. [Monte Carlo Data — Universal observability tool for AI inputs/outputs (SiliconANGLE, sep 2025)](https://siliconangle.com/2025/09/09/monte-carlo-debuts-universal-observability-tool-ai-inputs-outputs/) — agentic observability.
12. [Pigment — Agentic AI for Enterprise Business Planning](https://www.pigment.com/) — referencia mercado simulación enterprise.
13. [Singh — RICE-A: A Prioritization Framework for AI-Driven Features (Medium 2025)](https://karti479.medium.com/rice-a-a-prioritization-framework-for-ai-driven-features-5882849bcd44) — adaptación RICE a features AI.
14. [Atlassian — Goal Setting in the AI Era (System of Work)](https://www.atlassian.com/webinars/software/okrs-and-goal-setting-in-the-ai-era) — OKR + AI prioritization dinámica.

---

## Brechas vs Diego v6 actual

Top 10 brechas concretas ordenadas por severidad + esfuerzo:

| # | Brecha | Severidad | Esfuerzo | Referencia |
|---|---|---|---|---|
| 1 | No detecta inconsistencias entre fuentes (Supabase vs SII vs WhatsApp). Cony y Andrea reconcilian a mano. | Alta | M | §3 + Monte Carlo |
| 2 | No negocia: no maneja ZOPA, BATNA, anclas, contraofertas, trade-offs multi-variable. | Alta | L | §2 + Pactum |
| 3 | No simula "qué pasaría si…" sobre margen, volumen, mix de clientes. | Alta | M | §4 + Pigment + Causal |
| 4 | No expone razonamiento en acciones críticas (>$500K o cliente-facing). | Alta | S | §6 + Anthropic XAI |
| 5 | Sin razonamiento multi-paso real (es single-shot Action → respuesta). | Alta | M | §1 + ToT/ReAct papers |
| 6 | Cola FIFO pura, sin scoring por impacto × confianza × OKR. | Media | S | §5 + RICE-A |
| 7 | Sin verificación PRM paso a paso antes de ejecutar tools. | Media | M | §1.5 + OpenAI process supervision |
| 8 | Sin memoria negociadora por cliente (historial, preferencias, sensibilidad precio). | Media | M | §2.4 |
| 9 | Sin detección temporal/deadlines (cierres de cotización, plazos contractuales). | Media | S | §2.4 + arXiv 2601.13206 |
| 10 | Sin constitutional self-critique antes de mandar mensaje a tercero. | Baja-Media | S | §6.2 Anthropic CAI |

Leyenda esfuerzo: **S** = ≤2 días prompt/config · **M** = 1-2 semanas Pablo (Edge Function + DDL) · **L** = 1-2 meses (rediseño arquitectura).

---

## Implementable sin Pablo en 1-2 días

Top 5 acciones que se cierran **solo modificando `DIEGO-PROMPT-MAXIMO.md` o `panel.config_ui`**, sin tocar Edge Functions ni DDL ni frontend:

### 1. Forzar rationale estructurado en cada respuesta crítica

Agregar al system prompt una sección "ANTES DE EJECUTAR CUALQUIER ACCIÓN WRITE":
- Listar 3 razones por las que la acción aplica.
- Listar 1 alternativa considerada y por qué se descartó.
- Auto-asignar confianza 0-100%.
- Si confianza < 70%, pedir confirmación humana antes de ejecutar la tool.

**Impacto:** cierra Brecha #4 parcialmente. No requiere cambio de schema; el rationale queda en el mensaje conversacional, no en BD. Migración a `audit_log` después.

### 2. Inyectar ZOPA/BATNA en prompt como variables de contexto

Agregar a `panel.config_ui` un objeto `zopa_batna_v1` con piso/techo por material y BATNA por cliente principal. En cada turno Diego carga esto y lo usa en respuestas de cotización.

```
zopa_batna_v1 = {
  "Cu Brillante": { "piso_compra": 7900, "techo_compra": 8250, "fuente": "Andrea 22-may" },
  "Pincore": { "batna": "HUAL a 8180, flete +35km", "preferencia_pago": "7 días" }
}
```

**Impacto:** cierra Brecha #2 nivel 1 (haggle-bot básico). Diego empieza a sugerir contraofertas defendibles.

### 3. Activar Adaptive Thinking condicional vía prompt

Hoy Diego usa gpt-4o-mini. Si se cambia el modelo a Claude Sonnet 4.6 (cambio de config, no de código) y se agregan reglas en el system prompt:
- Si el intent es "consulta hecho puntual" → thinking disabled.
- Si el intent es "análisis cruzado" o "cotización" → thinking `high`.
- Si el intent es "decisión estratégica" o detectó inconsistencia → thinking `xhigh` + cadena visible.

**Impacto:** cierra Brecha #5 parcialmente. Razonamiento real en queries que lo merecen.

### 4. Scoring de impacto declarativo en el prompt

Agregar al prompt: "Cuando recibas múltiples consultas pendientes en la cola, ordénalas por (impacto_estimado_clp × urgencia) / esfuerzo. Si una afecta margen o cliente top-10, priorízala. Reporta el reordenamiento al usuario."

Más una tabla en `panel.config_ui.okr_vigente_v1` con la meta actual del trimestre. Diego la lee cada turno.

**Impacto:** cierra Brecha #6. Cola deja de ser FIFO.

### 5. Detección de inconsistencias por reglas declarativas en prompt

Agregar al prompt reglas tipo:
- "Si te preguntan facturación de un cliente y el número difiere >5% del último número que diste en los últimos 7 días, flaguealo explícitamente y propone auditar."
- "Si te dan un precio que está fuera del rango ZOPA del material, no lo aceptes — pide validación."
- "Si dos tools devuelven números contradictorios para el mismo concepto, no respondas el promedio — flaguea la inconsistencia."

**Impacto:** cierra Brecha #1 nivel 1 (detección por reglas, no por ML). Sin DDL.

---

## Cierre

Diego v6 es un buen chatbot de consulta. Diego v7 debe ser un copiloto que **piensa, negocia, verifica, simula, prioriza y explica**. Las seis dimensiones de este documento son el mapa. Las cinco acciones del bloque final son el primer sprint — implementables esta misma semana sin esperar disponibilidad de Pablo, sin tocar Edge Functions, sin migración de schema.

El siguiente paso natural es traducir las brechas 1-5 (severidad alta) en tickets concretos para PC Pablo, con DDL propuesta y prompt patches listos. Eso queda fuera del scope de este documento de investigación.

---

**Documento generado por:** Agente AI Engineer (PC Dusan)
**Fecha:** 2026-05-23
**Versión:** v1.0
**Próxima revisión:** cuando Diego v7 entre en testing
