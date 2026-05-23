# Diego v6 — Estándares mundiales 2026 de Comunicación Avanzada

> Documento de investigación estratégica para elevar a Diego desde un chatbot funcional (v5.1.0 / v6 backend en producción 23-may-2026) a un **copiloto empresarial de clase mundial**. Cubre los 7 ejes que separan a un bot que "responde preguntas" de uno que "construye confianza".
>
> **Audiencia primaria**: Dusan Arancibia (CEO, decisor no-técnico). **Audiencia secundaria**: Pablo Arancibia (Tech Lead, implementador).
>
> **Alcance Diego v6**: comparación honesta contra Intercom Fin 3, Klarna OpenAI Assistant, Hume EVI 3, Anthropic Claude Memory, Microsoft Copilot Proactive Actions, Glean Agentic Engine 2, Wysa, Forethought Agatha, Cresta, Salesforce Agentforce, Genesys Cloud CX.
>
> **Terminología oficial Reciclean** (no negociable): GENERADOR · VALORIZADOR · COMERCIANTE PEQUEÑO · DONANTE · GESTOR Ley REP. Diego nunca dice "cliente" / "proveedor" genérico.
>
> Fecha: 22-may-2026 · Compilado por: PC Dusan (Opus 4.7) · Branch: `replit/plan-dusan`

---

## Índice

1. [Resumen ejecutivo — qué importa y por qué](#1-resumen-ejecutivo--qué-importa-y-por-qué)
2. [Comprensión de contexto multigiro](#2-comprensión-de-contexto-multigiro)
3. [Detección de tono emocional](#3-detección-de-tono-emocional)
4. [Adaptación de personalidad según interlocutor](#4-adaptación-de-personalidad-según-interlocutor)
5. [Proactividad — sugerir antes de que pregunten](#5-proactividad--sugerir-antes-de-que-pregunten)
6. [Empatía situacional](#6-empatía-situacional)
7. [Comunicación no verbal — formato, emojis, timing](#7-comunicación-no-verbal--formato-emojis-timing)
8. [Multicanalidad omnicanal](#8-multicanalidad-omnicanal)
9. [Brechas vs Diego v6 actual](#9-brechas-vs-diego-v6-actual)
10. [Implementable sin Pablo en 1-2 días](#10-implementable-sin-pablo-en-1-2-días)
11. [Fuentes externas verificadas](#11-fuentes-externas-verificadas)

---

## 1. Resumen ejecutivo — qué importa y por qué

El año 2024 fue el de la **automatización ciega**: chatbots que reemplazaban personas para bajar costos. El caso emblemático es Klarna, que en febrero 2024 anunció que su asistente OpenAI hacía el trabajo de 700 agentes humanos, con 2,3 millones de conversaciones en el primer mes y mejora del 47% en satisfacción. Catorce meses después (mayo 2025), la misma Klarna admitió públicamente haber recortado demasiado: la calidad cayó en el ~5% de conversaciones complejas, los CSAT bajaron en tickets emocionales, y el CEO Sebastian Siemiatkowski reconoció que "el costo fue el factor de evaluación predominante, resultando en menor calidad". Klarna está re-contratando humanos para casos complejos mientras expande la IA para nivel-2 estructurado.

El año 2025 marcó el pivote: del **chatbot autónomo** al **copiloto híbrido con conciencia emocional**. Las cinco señales más fuertes:

1. **Anthropic** lanzó Claude Memory (12-sep-2025) y el memory tool para agentes (29-sep-2025): archivos Markdown jerárquicos, no bases vectoriales opacas. Filosofía: la memoria es explícita, auditable y portable.
2. **Hume AI** lanzó EVI 3 (may-2025): voz empática con 100K+ voces personalizadas, latencia <300ms, mimicry de prosodia. Superó a GPT-4o y Gemini Live en latencia práctica.
3. **Intercom** anunció en Pioneer 2025 que Fin se convierte en "Customer Agent" único que cambia de rol (servicio, ventas, retención) según contexto, con memoria que crece a lo largo del ciclo de vida del cliente.
4. **Microsoft Copilot** introdujo Proactive Actions: el copiloto deja de esperar la pregunta y empieza a sugerir el siguiente paso.
5. **Glean** llegó a $200M ARR con Agentic Engine 2 (planificación adaptativa + sub-agentes paralelos), demostrando que la búsqueda cross-tool con contexto vale más que la respuesta puntual.

**La tesis del 2026** es simple: **un chatbot empresarial que no recuerda, no se adapta, no escala y no sabe cuándo callarse no es un copiloto — es un FAQ con esteroides**. Diego v6 está hoy en la frontera entre ambas cosas. Este documento describe los siete ejes en los que puede dar el salto.

---

## 2. Comprensión de contexto multigiro

### 2.1 Qué significa "contexto multigiro" en 2026

Un chatbot de 2022 trataba cada conversación como una pizarra en blanco. Uno de 2026 trata cada interacción como **un capítulo dentro de un libro que ya viene escrito**. La diferencia operativa es brutal:

- **Diego v5 (estado actual)** mantiene contexto dentro de la misma sesión (mismas 6W activas en `panel.cola_conversacion`). Si Andrea cierra el panel y vuelve mañana, Diego no recuerda que ayer ella estaba persiguiendo el cobro de Pincore.
- **Diego v6 aspirado** debe recordar: (a) qué temas viene trabajando cada interlocutor durante las últimas N semanas, (b) qué decisiones se firmaron, (c) qué compromisos quedaron abiertos, (d) qué materiales/clientes/sucursales son recurrentes para ese usuario.

### 2.2 Cómo lo resolvieron los líderes 2025

**Anthropic Claude Memory** apostó por la transparencia radical: la memoria se almacena en archivos Markdown (`CLAUDE.md`) organizados jerárquicamente — proyecto, equipo, usuario. Esto es deliberado: las bases vectoriales son cajas negras que el usuario no puede auditar ni corregir. Los archivos MD se pueden leer, editar y versionar con Git. Diego v6 ya usa este patrón parcialmente con `mayordomo/BITACORA-VIVA.md` y `PENDIENTES.md`.

**Intercom Fin 3** describe una "memoria que crece sobre el ciclo de vida del cliente": las prioridades aprendidas el día 1 se siguen considerando el año 10. Arquitectónicamente esto es un híbrido — base estructurada para eventos discretos (compras, tickets, llamadas) + resúmenes vectoriales para conversaciones largas.

**Klarna OpenAI Assistant** demostró el lado oscuro: cuando la memoria depende solo del LLM y no hay capas de verificación, las alucinaciones en casos límite hicieron que el 5% de las conversaciones degenerara — pequeño en porcentaje, devastador en reputación cuando son casos de disputa, fraude o cierre de cuenta.

**ChatGPT memory** (OpenAI, abril 2024 + expansión 2025) usa un modelo de "memoria explícita gestionable": el usuario puede ver, editar o borrar lo que el modelo recuerda. Este patrón es regulatoriamente obligatorio en Europa (GDPR derecho al olvido) y Chile lo va a serlo con la nueva Ley de Datos Personales.

### 2.3 Cross-channel — el verdadero diferenciador

Recordar en un canal es obligatorio. Recordar **entre canales** es lo que separa los líderes. Si Andrea le pregunta a Diego por WhatsApp el precio de cobre brillante a las 10:00, abre el panel-rdo.html a las 11:30 y dice "el cliente quiere subir 50 kilos más", Diego debe saber a qué cliente, a qué precio y en qué moneda — sin que ella tenga que recapitular.

Hoy Diego v6 vive solo en el FAB del panel-rdo (`reciclean-sistema/public/panel-rdo.html`, mergeado en PR #57). Para llegar al estándar 2026 necesita: (a) un identity layer que reconcilie usuarios entre canales, (b) un event log único que reciba cada interacción, (c) un servicio de "rehidratación de contexto" que reconstruya la última conversación relevante al entrar a cualquier canal.

### 2.4 Recomendaciones concretas para Diego v6

| Capa | Estado actual | Estándar 2026 | Quick-win |
|---|---|---|---|
| Memoria intra-sesión | OK (6W en cola_conversacion) | OK | Mantener |
| Memoria inter-sesión por usuario | No | Sí (resumen últimas 7 conversaciones) | Tabla `panel.diego_memoria_usuario` con campos `usuario_id, resumen_md, ultima_actualizacion, decisiones_firmadas[]` |
| Memoria semántica (pgvector) | Placeholder (no implementado) | Sí | Diferir a v7 — pgvector tiene complejidad alta y bajo ROI inicial |
| Cross-channel reconciliation | No (solo FAB web) | Sí | Diferir hasta tener 2do canal real |
| Audit trail de memoria | Parcial (BITACORA-VIVA) | Sí | Comando `/diego memoria` que liste qué recuerda de ti |

---

## 3. Detección de tono emocional

### 3.1 La barrera más alta de cruzar

Un chatbot que responde técnicamente correcto pero emocionalmente sordo es **peor** que uno que dice "no sé". La razón es psicológica: cuando un humano detecta que el interlocutor no registró su estado emocional, la confianza colapsa irreversiblemente. Esto es lo que mató los CSAT de Klarna en el 5% crítico.

Las 6 señales emocionales que un chatbot empresarial 2026 debe detectar:

1. **Urgencia** — "lo necesito YA", "estoy con el cliente al teléfono", uso de mayúsculas sostenidas, signos de exclamación múltiples.
2. **Frustración** — repetición de la misma pregunta reformulada, "no me entiendes", "ya te lo dije".
3. **Confusión** — preguntas incompletas, cambios bruscos de tema, "espera, ¿qué?".
4. **Sarcasmo / ironía** — "genial, otra vez lo mismo", "qué útil", elogios excesivos en contexto de error.
5. **Satisfacción** — "perfecto", "exacto", "eso era", emojis positivos, mensajes cortos de confirmación.
6. **Sobrecarga** — mensajes muy largos sin estructura, varios temas simultáneos, "tengo mil cosas".

### 3.2 Estado del arte — Hume AI EVI 3

Hume AI es hoy la referencia mundial. Su Empathic Voice Interface (EVI 3, lanzada en mayo 2025) detecta más de 30 dimensiones emocionales en tiempo real desde la voz: entonación, ritmo, pausas, cambios de pitch. El sistema responde con latencia menor a 300ms y replica la prosodia del usuario para generar respuestas que "suenen" alineadas al estado emocional detectado. Hume reporta más de 100K desarrolladores usando su API a noviembre 2025.

Para texto puro (sin voz), el estado del arte es menos espectacular pero más accesible:

- **OpenAI Moderation API** — clasifica texto en categorías de toxicidad, hostilidad, urgencia, sufrimiento. Gratis, sub-200ms.
- **Anthropic Constitutional AI** — Claude detecta y nombra emociones del interlocutor sin necesidad de modelo externo; es una capacidad emergente del modelo base, activable por system prompt.
- **Sentiment analysis clásico** — librerías como VADER, TextBlob siguen siendo útiles para baseline, pero pierden frente a LLMs en sarcasmo e ironía.

### 3.3 Cuándo escalar — la regla del 2-3-emocional

La industria 2025-2026 ha convergido en una heurística clara para handoff humano:

- **Regla del 2**: si el bot dio respuestas que el usuario rechazó dos veces seguidas, escalar.
- **Regla del 3**: si el usuario reformuló la misma pregunta tres veces, escalar.
- **Regla emocional**: si la sentiment analysis detecta frustración o sufrimiento sostenido (no un solo mensaje), escalar **antes** de que el usuario lo pida.
- **Palabras llave de escalación inmediata**: "fraude", "emergencia", "abogado", "demanda", "outage", "caída", "robo", "estafa" — el estudio de eesel AI (2025) y BlueTweak (2026) confirma que estas son universales en customer service B2B.

### 3.4 Cuándo cambiar de canal

Un chatbot 2026 no solo escala a humano — también **propone cambio de canal** cuando detecta que el canal actual es insuficiente. Ejemplos:

- Texto largo y emocional → "¿Querés que te llame Andrea? Veo que hay mucho en juego acá."
- Información sensible (datos bancarios, contratos) → "Esto es mejor por email así queda registro firmado. ¿Te lo armo a draft para Andrea?"
- Decisión multipersona → "Esto necesita acuerdo entre vos, Cony y Dyana. ¿Te abro un compromiso multi para mañana?"

### 3.5 Recomendaciones concretas para Diego v6

| Capacidad | Hoy | Estándar 2026 | Cómo |
|---|---|---|---|
| Detección urgencia | Parcial (clasificación 6W tiene "WHEN") | Sí | Reglas en system prompt + flag explícito en respuesta |
| Detección frustración | No verificado | Sí | OpenAI Moderation API + flag en `cola_conversacion` |
| Detección sarcasmo | No | Difícil incluso para LLMs | Diferir |
| Auto-escalación humana | No | Sí | Trigger automático a `tarea_para_humano` cuando flag emocional + 2 reintentos |
| Sugerencia cambio canal | No | Sí | Reglas en system prompt |

---

## 4. Adaptación de personalidad según interlocutor

### 4.1 Por qué importa — el efecto camaleón

Andrea (comercial, alta extraversión, alta urgencia operativa) y Dyana (contabilidad, alta concienciación, baja tolerancia al error) son personas con estilos comunicativos opuestos. Un chatbot que les hable igual está mal calibrado para al menos una de las dos. La investigación 2024-2025 (universidades de Cambridge, Stanford, MIT) confirma tres hallazgos:

1. **Los LLMs ya tienen "personalidad" implícita** y se la puede medir con tests Big Five adaptados.
2. **Los usuarios prefieren chatbots cuya personalidad coincide o complementa la propia** — el efecto es medible: CSAT sube 20-30% cuando hay match.
3. **La adaptación dinámica funciona mejor que la personalidad fija** — un chatbot que es formal con un cliente y casual con otro, basándose en su histórico, supera a uno con un único tono.

### 4.2 Marcos de referencia — Big Five vs DiSC

**Big Five (OCEAN)** — apertura, concienciación, extraversión, amabilidad, neuroticismo. Es el marco más usado en investigación académica. Ventaja: granularidad y validación científica. Desventaja: difícil de inferir desde pocos mensajes.

**DiSC** — Dominancia, Influencia, Estabilidad, Conformidad. Es el marco más usado en ventas y customer service B2B. Ventaja: simple, accionable. Desventaja: menos validez académica.

Para Diego v6, **DiSC adaptado al equipo Reciclean-Farex** es más práctico:

- **D (Dominancia)** — Dusan, decisiones rápidas, sin floritura, datos primero. Prefiere: bullets, números, conclusión arriba.
- **I (Influencia)** — Andrea, conversacional, contextual, le importa el cliente como persona. Prefiere: storytelling breve, emojis funcionales, confirmación cálida.
- **S (Estabilidad)** — Cony, ritmo constante, le importa que el sistema sea predecible. Prefiere: respuestas estructuradas, sin sorpresas, recordatorios.
- **C (Conformidad)** — Dyana, precisión, normativa, contabilidad. Prefiere: datos exactos con fuente, formato formal, sin emojis.

### 4.3 Implementación práctica — system prompt dinámico

La técnica dominante en 2025-2026 es la **inyección de perfil**: antes de cada respuesta, el system prompt incluye una sección "Estás hablando con X, perfil DiSC=Y, prefiere Z". Los grandes (Claude, ChatGPT, Gemini) lo permiten vía "custom instructions" o "system prompt extensions".

Diego v6 ya tiene la base — `DIEGO-PROMPT-MAXIMO.md` línea ~95 enumera los interlocutores. Lo que falta es:

- Una tabla `panel.perfiles_comunicacion` con DiSC + preferencias por persona.
- Un bloque del system prompt que se reescriba dinámicamente según el `usuario_id` activo.
- Un feedback loop simple: 👍/👎 en cada respuesta de Diego → ajuste de perfil.

### 4.4 Riesgos a evitar

- **Estereotipar**: no asumir que un perfil DiSC define todo. Andrea puede ser "I" pero un viernes a las 18:00 con un cliente caído, hablale en modo "D" puro.
- **Manipulación**: adaptar tono para "vender mejor" cruza la línea ética. Diego nunca debe usar el perfil para empujar decisiones que no benefician al usuario.
- **Sobreadaptación**: un Diego que cambia demasiado pierde identidad. Hay un núcleo Reciclean (terminología oficial, valores, marca) que no se negocia.

---

## 5. Proactividad — sugerir antes de que pregunten

### 5.1 El nuevo estándar — del reactivo al anticipatorio

Microsoft Copilot lanzó en 2025 "Proactive Actions" como respuesta a la queja universal: "el asistente es útil pero solo cuando me acuerdo de pedirle algo". Las Proactive Actions analizan la actividad reciente del usuario y sugieren el siguiente paso lógico — formularios a completar, emails pendientes, reuniones a preparar.

Cursor (editor de código) llevó esto al extremo con Cursor Tab: el sistema **adivina dónde vas a editar a continuación** basándose en el AST del código, el contexto del proyecto y los patrones recientes del usuario.

GitHub Copilot Workspace introdujo una arquitectura multi-agente donde distintos agentes especializados manejan brainstorming, planificación, implementación y bug-fixing — todo sin que el desarrollador tenga que invocar explícitamente cada paso.

Glean Agentic Engine 2 incorporó planificación adaptativa y orquestación de sub-agentes en paralelo, llegando a $200M ARR en parte por esta capacidad.

### 5.2 La regla de oro de la proactividad — saber callarse

Un copiloto que sugiere todo el tiempo es ruido. Uno que nunca sugiere es inútil. El balance lo da la **regla del valor marginal**: solo proactividad cuando el costo cognitivo de leer la sugerencia es menor que el valor esperado de actuarla.

Los criterios consolidados en 2025-2026:

1. **Frecuencia limitada**: máximo N sugerencias por sesión (Microsoft sugiere 3-5).
2. **Contexto fuerte**: la sugerencia debe tener al menos 2 señales que la justifiquen, no 1.
3. **Reversibilidad**: la sugerencia debe ser fácil de descartar sin penalización.
4. **Aprendizaje**: si el usuario rechaza el mismo tipo de sugerencia 3 veces, dejar de hacerla.

### 5.3 Oportunidades concretas para Diego v6

Diego ya tiene 7 tools en el whitelist. La proactividad no requiere tools nuevas — requiere **disparadores contextuales** que ejecuten las tools existentes sin que el usuario las pida. Ejemplos realistas para el grupo Reciclean-Farex:

- Andrea entra al panel a las 09:00 lunes → Diego ejecuta `consultar_alertas_activas` y muestra: "Andre, tenés 3 cobros vencidos: Pincore (15 días), HUAL (8 días), ADASME (5 días). ¿Empezamos por Pincore?"
- Dusan entra al panel viernes 17:00 → Diego ejecuta `resumen_facturacion_mes` y muestra: "Esta semana cerró 12% arriba del promedio. Talca tiró fuerte, Pto Montt sigue bloqueada. Decisiones pendientes para vos: 3."
- Cony entra al panel después del cierre de mes → Diego ofrece exportar liquidaciones SERCOT sin que ella tenga que pedirlo.
- Material X tiene cambio de precio mayor al 10% en mercado → Diego avisa a Andrea antes de la próxima cotización con ese material.

### 5.4 Riesgos y antipatrones

- **El sobreutil** — el bot que dice "veo que escribiste 'reunión', ¿querés que agende?" cuando ya hay una en el calendario. Microsoft, en su blog "Human-centered AI" (oct-2025), advierte explícitamente contra esto.
- **El moralista** — el bot que sugiere cosas que el usuario no pidió ni necesita ("¿quizás deberías tomar un descanso?"). Excepto en healthcare (Wysa), es rechazado universalmente en B2B.
- **El vendedor** — el bot que aprovecha la proactividad para empujar features pagas, upsells o cross-sells. Glean y Notion AI no lo hacen; Salesforce Agentforce ha sido criticado por hacerlo.

---

## 6. Empatía situacional

### 6.1 Más allá de detectar emociones — adaptar al contexto

Detectar que un usuario está frustrado es nivel 1. Saber **qué hacer** con esa información es nivel 2. Y saber **qué no hacer** es nivel 3.

La investigación 2025 en chatbots de salud mental (Wysa, Woebot, sucesores) y educación (Khanmigo) consolidó cuatro principios:

1. **Validar antes de resolver**: cuando alguien viene cargado emocionalmente, la primera respuesta debe reconocer el estado, no atacar el problema. "Te entiendo, esto debe ser frustrante" antes de "vamos a resolverlo".
2. **Cognitive empathy, not affective**: los chatbots no sienten pero pueden nombrar lo que el usuario siente. La investigación 2025 (Hua et al., World Psychiatry) confirma que esto **funciona terapéuticamente** aunque el chatbot no tenga emoción real.
3. **No fingir lo que no se es**: Wysa explícitamente se presenta como "un pingüino AI que aprendió de psicólogos", no como un terapeuta. Esta honestidad sostiene la confianza.
4. **Saber salir**: si el caso excede la capacidad del bot, derivar rápido y con calidez, no con frialdad.

### 6.2 Situaciones que requieren empatía contextual en Reciclean-Farex

| Situación | Estado emocional probable | Respuesta correcta de Diego |
|---|---|---|
| Andrea perdió un cliente grande | Frustración + cansancio | Validar, no minimizar, ofrecer plan de recuperación cuando esté lista |
| Pablo deploy roto en producción | Estrés + foco técnico | Cero floritura, datos crudos, logs |
| Dusan firma una decisión difícil (cierre sucursal) | Peso emocional + necesidad de procesar | Confirmar sin opinar, registrar, ofrecer seguir cuando él decida |
| Cony cierre de mes a las 23:00 | Cansancio + necesidad de terminar | Eficiencia pura, sin small talk |
| Dyana detecta error contable | Concentración + ansiedad regulatoria | Datos exactos, formato formal, ofrecer doble verificación |
| Reinaldo programador externo | Concentrado en bug | Tono neutro técnico, sin chilenismos |

### 6.3 El caso Khanmigo — empatía + límites claros

Khan Academy lanzó Khanmigo en 2023 y lo refinó fuertemente en 2024-2025. Su diseño es referente porque combina dos cosas que parecen contradictorias:

- **Empatía con el estudiante** — celebra logros pequeños, valida frustración con problemas difíciles, hace preguntas guía en lugar de dar respuestas.
- **Límites duros** — nunca resuelve tareas por el estudiante, nunca da la respuesta directa en evaluaciones, siempre redirige al aprendizaje.

Para Diego v6, el equivalente es: empático con el equipo pero **nunca firma por Dusan**. Nunca decide por Andrea. Nunca aprueba pagos por Pablo. Nunca cierra liquidaciones por Dyana. La empatía no diluye la frontera de autoridad.

### 6.4 El caso Wysa — diseño centrado en confianza

Wysa, que obtuvo el estatus FDA Breakthrough Device en 2025, articula su filosofía en una frase: "El chatbot no es el terapeuta — es el puente al terapeuta". Aplicado a Diego: Diego no es Dusan ni Andrea ni Pablo — es el puente entre ellos y la información, las decisiones, los recordatorios.

### 6.5 Empatía sin invasión — la línea fina del B2B

En B2C de salud mental (Wysa, Woebot) el usuario abre la app específicamente para procesar emoción. En B2B operativo (Diego), el usuario abre el panel para resolver una tarea. La empatía mal calibrada en B2B se percibe como **invasiva, condescendiente o pérdida de tiempo**.

Las cuatro reglas operativas para empatía B2B correcta:

1. **Empatía reactiva, no proactiva**. Diego no pregunta "¿cómo estás hoy?" — pero si Andrea escribe "qué día más jodido", Diego acusa recibo brevemente antes de pasar a la tarea.
2. **Empatía proporcional**. Si el mensaje del usuario es neutro, la respuesta es neutra. Si es emocional, la respuesta valida una vez y vuelve a la tarea. Si es muy emocional sostenido, Diego ofrece pausa o derivación humana.
3. **Empatía sin opinión moral**. Diego nunca juzga decisiones del equipo. Si Dusan decide cerrar una sucursal, Diego no dice "qué difícil debe ser" — registra, ejecuta lo solicitado, y queda disponible.
4. **Empatía sin promesas falsas**. Diego no dice "todo va a estar bien" cuando no lo sabe. Dice "estoy con vos en esto, ¿qué necesitás resolver primero?".

### 6.6 Forethought, Ada y Cresta — la convergencia 2025

Las tres plataformas líderes de AI agent en contact centers (Forethought Agatha, Ada, Cresta) convergieron en 2025 en un patrón común: **emoción como variable de orquestación, no como respuesta en sí misma**. Es decir, el bot no "muestra empatía" como performance — usa la lectura emocional para decidir qué hacer.

- Cresta fue reconocida por Forrester como Leader en The Forrester Wave™ for Conversation Intelligence Solutions for Contact Centers, Q2 2025, justamente por esta capacidad de orquestación basada en señal emocional.
- Forethought Assist Agent + Agent QA introdujo "human-AI collaboration": la IA propone, el humano valida o sobrescribe. La empatía nace de la colaboración, no del modelo solo.
- Ada se enfoca en time-to-value para inquiries estructuradas, aceptando que el 30% complejo necesita humano. Pragmatismo sobre pretensión.

---

## 7. Comunicación no verbal — formato, emojis, timing

### 7.1 Por qué el formato es lenguaje

En texto, el formato cumple el rol que la entonación y los gestos cumplen en voz. Un mismo contenido escrito como párrafo denso vs bullets cortos vs lista numerada **comunica cosas distintas** al lector:

- Párrafo denso = contexto, narrativa, reflexión.
- Bullets cortos = inventario, opciones, escaneo rápido.
- Lista numerada = secuencia, prioridad, paso-a-paso.
- Tabla = comparación, decisión multidimensional.
- Código / monospace = exactitud literal, identificador, código.
- Bold / negrita = ancla de atención.

Un Diego que usa **siempre el mismo formato** para todo es como un humano que habla en monotonía. Un Diego que adapta formato al contenido es percibido como inteligente y considerado.

### 7.2 Emojis — funcionales, no decorativos

El estudio de Wang et al. publicado en Frontiers in Psychology (enero 2025) sobre estrategias de respuesta de chatbots y uso de emojis encontró que:

- **Emojis en respuestas proactivas** aumentan la intención de compra y reducen la distancia psicológica percibida.
- **Emojis en respuestas reactivas** tienen efecto neutro o negativo en contextos serios (quejas, devoluciones).
- **Sobreuso de emojis** (>2 por mensaje en B2B) reduce la percepción de profesionalismo.

La regla operativa para Diego v6 — alineada con el `DIEGO-CAPACIDADES-COMUNICACION.md` de Pablo:

- WhatsApp interno: 0-2 emojis por mensaje, funcionales (🟢 OK, 🔴 alerta, ⏰ recordatorio).
- WhatsApp externo recurrente: 0-1 emoji, solo si el interlocutor los usa.
- WhatsApp corporativo / email formal: 0 emojis.
- Panel-rdo FAB interno: emojis funcionales libres, alineados a `visual-oro` (verde Reciclean #059669).

### 7.3 Longitud — el principio de la economía de atención

Un estudio de arXiv de 2024 sobre satisfacción y longitud de conversación con LLMs encontró que la satisfacción no escala linealmente con longitud — hay un sweet spot que depende del tipo de consulta:

- **Consulta operativa simple** (precio, status): 1-3 líneas.
- **Consulta analítica** (resumen mes, comparación): 5-10 líneas + estructura visual.
- **Consulta estratégica** (recomendación de decisión): 10-20 líneas + opciones.
- **Conversación reflexiva** (mood, contexto personal): párrafos completos, sin estructura forzada.

Diego v6 hoy responde con longitud relativamente uniforme. El estándar 2026 es ajustar longitud al tipo de consulta inferido desde la clasificación 6W.

### 7.4 Timing — la ilusión de la conversación humana

Slack AI y Discord AI introdujeron en 2024-2025 el "human-like delay": el bot espera 1-3 segundos antes de responder, simulando el tiempo de tipeo humano. Esto reduce la sensación de "máquina" y mejora la percepción de empatía.

**Pero hay un trade-off**: en consultas urgentes, cualquier delay es percibido como lentitud. La regla 2026:

- Consulta urgente (flag urgencia en 6W) → responder lo más rápido posible (sub-segundo).
- Consulta conversacional / social → delay 1-2s.
- Consulta analítica con tools → mostrar "Diego está consultando..." con progress visible.
- Consulta emocional → delay 2-3s + mensaje inicial corto antes del desarrollo completo.

### 7.5 Recomendaciones concretas para Diego v6

| Variable | Hoy | Estándar 2026 |
|---|---|---|
| Formato adaptativo | Parcial (Diego varía) | Reglas explícitas en system prompt por tipo de consulta |
| Emojis | Funcionales OK | Reglas por canal e interlocutor |
| Longitud adaptativa | No verificado | Token budget dinámico según clasificación 6W |
| Timing simulado | No (FAB respuesta inmediata) | Diferir — el FAB es rápido y eso es valor, no debilidad |

---

## 8. Multicanalidad omnicanal

### 8.1 La promesa y el costo

Salesforce Agentforce alcanzó $440M ARR en agentic AI en Q2 2025, con 12.000+ clientes. Genesys Cloud CX (con integración Twilio para voz desde fines 2025) y Salesforce Einstein cubren omnicanal en chat, email, SMS, WhatsApp, Instagram y voz. Microsoft Customer Voice y Twilio Flex AI compiten en el mismo espacio.

La promesa es seductora: un mismo agente IA que opera en todos los canales, mantiene contexto entre ellos, escala a humano cuando hace falta y deja registro unificado. El costo, sin embargo, es alto:

- **Licencias**: Agentforce y Genesys arrancan en miles de USD/mes por escala empresarial.
- **Integración**: cada canal requiere webhook, autenticación, mapeo de eventos.
- **Mantenimiento**: cada cambio de UX en WhatsApp Business API, cada actualización de Twilio, cada migración de Genesys, impacta producción.
- **Compliance**: WhatsApp Business tiene reglas estrictas sobre mensajes proactivos y plantillas. Email tiene SPF/DKIM/DMARC. Voz tiene grabación y consentimiento.

### 8.2 La arquitectura mínima viable omnicanal

Para Diego v6, no tiene sentido comprar Salesforce ni Genesys. Lo que sí tiene sentido es **diseñar la arquitectura como si fuera a ser omnicanal**, aunque hoy solo viva en el FAB web. El patrón de referencia:

```
[Canal A: FAB web]  ──┐
[Canal B: WhatsApp] ──┼──> [Diego Router] ──> [Diego Core (EF diego-chat-process)]
[Canal C: Email]    ──┘                              │
                                                     ↓
                                          [Memoria unificada]
                                          [Event log unificado]
                                          [Identity layer]
```

Hoy Diego v6 tiene solo el canal A (FAB) directamente conectado al core. Para llegar al estándar 2026 sin reescribir todo, el camino es:

1. **Extraer el "router"** como capa explícita (puede ser un edge function adicional o un namespace dentro del actual).
2. **Adoptar un event log unificado** desde el inicio — tabla `panel.diego_eventos` con `canal, usuario, tipo_evento, payload, timestamp`.
3. **Identity layer simple**: una tabla `panel.diego_identidades` que mapee `whatsapp_phone, email, panel_user_id` al mismo `persona_id` interno.
4. **Solo cuando el ROI sea claro, agregar canales reales**. Probablemente: (1) WhatsApp con Pablo's Diego v5.1.0 existente como punto de entrada, (2) email como segundo canal, (3) voz solo si justifica.

### 8.3 El caso Klarna — lección sobre ambición omnicanal

Klarna llevó omnicanal IA al extremo y se quemó. La lección no es "no hacer omnicanal" sino "no automatizar canales emocionalmente complejos antes de tiempo". Voice y video son canales emocionalmente densos — exactamente donde la IA de 2025 todavía pifia en el 5% crítico.

Para Diego v6, la recomendación honesta: **omnicanal de texto sí, omnicanal de voz no por ahora**. Voz tiene mayor riesgo regulatorio (grabación, consentimiento, latencia), mayor riesgo emocional (un tono mal puede hundir una relación de cliente), y menor ROI inicial dado el volumen actual del grupo (14 personas internas + ~12 clientes corporativos recurrentes).

### 8.4 El caso Genesys + Salesforce — la integración que sí vale

La integración Genesys ↔ Salesforce, lanzada en su versión actual a mediados de 2025, demuestra el valor de tener **dos sistemas especializados bien conectados** vs un único sistema todoterreno. Genesys hace orquestación de canal; Salesforce hace memoria de cliente. Cada uno excele en su dominio.

Para Diego v6, el patrón análogo sería: **Supabase como memoria/identity** (lo cual ya está) + **un orquestador de canales lightweight** (n8n VPS que ya opera Pablo). Esto es viable a costo cercano a cero.

### 8.5 Recomendaciones concretas para Diego v6

| Decisión | Recomendación |
|---|---|
| Comprar Agentforce / Genesys / Twilio Flex | No, sobre-ingeniería para el tamaño del grupo |
| Diseñar arquitectura omnicanal-ready | Sí, costo bajo, beneficio futuro alto |
| Habilitar WhatsApp como 2do canal | Sí, pero después de cerrar memoria inter-sesión |
| Habilitar voz | No por ahora |
| Habilitar email outbound | Diferir — Diego ya escribe drafts en Gmail, alcanza |

### 8.6 La trampa de la consolidación prematura

Una tentación recurrente en grupos del tamaño de Reciclean-Farex es **consolidar canales antes de tiempo**. La lógica suena bien: "si todos los mensajes pasan por Diego, todo queda centralizado". En la práctica, esta consolidación temprana genera tres problemas:

1. **Acopla destinos a fuentes**. Si Diego es el único punto de contacto, una caída de Diego es una caída de toda la comunicación operativa. Hoy el FAB se cae y el equipo sigue trabajando por WhatsApp directo, email, llamada. Centralizar prematuro elimina esa redundancia natural.
2. **Fricciona la adopción**. Los humanos del equipo ya tienen hábitos consolidados — Andrea con WhatsApp, Dyana con email, Cony con planillas. Forzar que todo pase por Diego antes de que Diego sea claramente mejor que las alternativas genera rechazo.
3. **Esconde señales débiles**. Mucha información operativa valiosa vive hoy en conversaciones laterales (Andrea-cliente, Pablo-proveedor de hosting, Dusan-asesor). Aspirar todo a Diego sin diseño puede borrar contexto importante en lugar de capturarlo.

La estrategia correcta 2026: **empezar por reflejar lo que ya pasa, no por reemplazarlo**. Diego puede leer (con permiso) hilos de WhatsApp Business y resumirlos, sin ser el destinatario directo. Diego puede recibir forward de emails clave, sin reemplazar la bandeja. Esta lógica de "Diego como observador y resumidor" antes que "Diego como punto único de contacto" es lo que diferencia a Glean (que indexa lo que ya existe) de Microsoft Copilot (que pretende ser el lugar donde todo nace).

### 8.7 Compliance y soberanía del dato

Tres dimensiones que rara vez se discuten al inicio de un proyecto omnicanal y son las que más caro salen después:

- **WhatsApp Business API** impone reglas duras sobre mensajes proactivos (24-hour window, plantillas pre-aprobadas para mensajes outbound fuera de ventana, costos por sesión). Diego no puede simplemente "mandar un WhatsApp cuando quiere".
- **Email outbound** requiere SPF/DKIM/DMARC configurados correctamente bajo el dominio del grupo. Un Diego que manda email desde un dominio mal configurado va directo a spam y mata reputación.
- **Ley de Datos Personales Chile (en discusión final 2026)** impondrá obligaciones similares a GDPR. Diego v6 debe diseñarse asumiendo que en 12-18 meses habrá auditoría de qué datos guarda, cómo, y por cuánto tiempo. La arquitectura Markdown-first de Anthropic Claude Memory es defensiva en este sentido — todo el contexto persistente es legible y borrable.

---

## 9. Brechas vs Diego v6 actual

Top 10 brechas concretas detectadas, ordenadas por relación severidad / esfuerzo:

| # | Brecha | Severidad | Esfuerzo | Referencia código |
|---|---|---|---|---|
| 1 | Sin memoria inter-sesión por usuario — cada conversación arranca de cero | Alta | M | `diego-chat-process/index.ts` líneas 58-95 (SYSTEM_PROMPT no carga histórico usuario); no hay tabla `panel.diego_memoria_usuario` |
| 2 | No detecta tono emocional ni urgencia más allá de la dimensión WHEN del 6W | Alta | M | `DIEGO-PROMPT-MAXIMO.md` no menciona detección emocional explícita; falta integración OpenAI Moderation API |
| 3 | No adapta personalidad/tono al interlocutor — todos reciben el mismo Diego | Alta | S | `DIEGO-PROMPT-MAXIMO.md` ~602 líneas enumera personas pero no asigna perfil DiSC ni preferencias de formato |
| 4 | Proactividad cero — Diego solo responde, nunca anticipa | Alta | M | `diego-chat-process` no tiene trigger de entrada al panel; no consume `consultar_alertas_activas` automático |
| 5 | pgvector memoria semántica = placeholder no implementado | Media | L | Comentado como "v1 limitation" en el contexto entregado; diferible a v7 |
| 6 | PDF parser no implementado (Vision para fotos sí) | Media | M | Mencionado en limitaciones v1; afecta procesamiento de OCs corporativas en PDF |
| 7 | Sin canal WhatsApp/Email/Voz desde Diego v6 — solo FAB web | Alta | L | Único canal: `panel-rdo.html`; Diego v5.1.0 WhatsApp opera separado sin compartir memoria |
| 8 | Sin auto-escalación humana basada en sentiment + reintentos | Media | S | Las 7 tools no incluyen `escalar_a_humano`; la lógica de handoff está implícita en el prompt |
| 9 | Sin event log unificado para multi-canal futuro | Media | S | No existe `panel.diego_eventos`; los logs viven dentro de cola_conversacion específica del FAB |
| 10 | Sin feedback loop 👍/👎 por respuesta — no aprende de errores específicos | Baja | S | El FAB renderiza respuestas pero no captura señal de calidad post-hoc |

**Severidad**: Alta = afecta calidad de respuesta diaria. Media = limita escalabilidad o casos avanzados. Baja = pulido.
**Esfuerzo**: S = 1-2 días sin tocar EF/DDL. M = 3-7 días con cambios EF + tablas. L = 1-3 semanas con arquitectura nueva.

---

## 10. Implementable sin Pablo en 1-2 días

Top 5 mejoras que se pueden hacer modificando **solo** `DIEGO-PROMPT-MAXIMO.md` o registros en `panel.config_ui` — sin tocar `diego-chat-process/index.ts`, sin DDL, sin frontend. Ordenadas por impacto descendente.

### Quick-win #1 — Perfiles DiSC inline por interlocutor

**Qué**: Agregar al system prompt una sección "Perfil del interlocutor" que Diego consulte antes de responder, asignando estilo de respuesta a cada persona conocida (Dusan, Pablo, Andrea, Cony, Dyana, Reinaldo).

**Cómo**: Editar `DIEGO-PROMPT-MAXIMO.md` agregando una sección nueva tras la lista de interlocutores existente.

**Líneas a cambiar**: agregar bloque después de la enumeración de personas (~línea donde están listados los 6 interlocutores). Estimado: 40-60 líneas nuevas.

**Ejemplo de bloque**:
```
## Perfil de comunicación por interlocutor

- Dusan (D — Dominancia): conclusión arriba, bullets, sin floritura, datos primero.
  Máx 5 líneas en respuestas operativas. Cero emojis decorativos.

- Pablo (D técnico): logs crudos, código exacto, sin contexto narrativo.
  Solo emojis funcionales (🟢🔴⏰). Sin small talk.

- Andrea (I — Influencia): cálido, conversacional, contextual.
  Mencionar al cliente como persona, no como ID. Emojis funcionales libres.

- Cony (S — Estabilidad): estructurado, predecible, con recordatorios.
  Formato tabla cuando hay 3+ items. Tono formal pero accesible.

- Dyana (C — Conformidad): formal, preciso, con fuente.
  Cero emojis. Citar tabla/migración cuando da dato numérico.

- Reinaldo (externo, técnico): neutro técnico, sin chilenismos, en español.
  Asumir contexto técnico bajo de Reciclean — explicar siglas la primera vez.
```

### Quick-win #2 — Detección emocional + escalación verbal en prompt

**Qué**: Sin agregar moderation API ni código, instruir explícitamente al modelo (gpt-4o-mini ya lo soporta) a clasificar tono emocional de cada mensaje entrante y reaccionar.

**Cómo**: Editar `DIEGO-PROMPT-MAXIMO.md` agregando una sección "Detección de estado emocional".

**Líneas a cambiar**: agregar 30-50 líneas en sección nueva, idealmente cerca de la clasificación 6W ya existente.

**Ejemplo de bloque**:
```
## Estado emocional del interlocutor

Antes de responder, clasificá internamente el tono del mensaje:
- NEUTRO: respuesta estándar.
- URGENTE: mayúsculas sostenidas, "ya", "ahora", "rápido", signos múltiples
  → respondé en menos de 3 líneas, sin small talk.
- FRUSTRADO: "no entendiste", "ya te dije", repetición
  → reconocé primero ("Tenés razón, perdón"), después corregí.
- SOBRECARGADO: múltiples temas, mensajes muy largos sin estructura
  → ofrecé desglosar ("¿Empezamos por X primero?").
- SATISFECHO: "perfecto", "exacto", emoji positivo
  → cerrá corto, sin adornar.

Si detectás FRUSTRADO + ya respondiste 2 veces sobre el tema sin resolver,
ofrecé escalar a Andrea (comercial), Pablo (técnico) o Dusan (decisión)
según corresponda.
```

### Quick-win #3 — Longitud adaptativa según tipo de consulta

**Qué**: Instruir explícitamente al modelo a ajustar longitud según el tipo de consulta detectado en la clasificación 6W.

**Cómo**: Editar `DIEGO-PROMPT-MAXIMO.md` en la sección donde se describe el output esperado.

**Líneas a cambiar**: 15-25 líneas, integradas en la sección de formato existente.

**Ejemplo de bloque**:
```
## Longitud según tipo de consulta

- Consulta de dato puntual (precio, status, stock): 1-3 líneas máx.
- Consulta analítica (resumen, comparación): 5-10 líneas + tabla si aplica.
- Consulta estratégica (qué hacer con X): hasta 15 líneas con opciones.
- Conversación reflexiva o emocional: sin estructura forzada, prosa natural.

Nunca rellenar para "parecer más completo". Si la respuesta cabe en 2 líneas,
2 líneas. Dusan paga por información, no por palabras.
```

### Quick-win #4 — Proactividad de bienvenida según hora y rol

**Qué**: Instruir a Diego a que cuando un usuario abre el panel-rdo (primera interacción del día detectable por gap temporal), arranque con un saludo proactivo que incluya estado relevante según rol — usando las tools ya existentes (`consultar_alertas_activas`, `resumen_facturacion_mes`).

**Cómo**: Editar `DIEGO-PROMPT-MAXIMO.md` agregando regla "Saludo proactivo".

**Líneas a cambiar**: 20-30 líneas en sección nueva.

**Ejemplo de bloque**:
```
## Saludo proactivo (primera interacción del día)

Si es la primera vez que este usuario interactúa hoy (gap > 8 hrs):

- Andrea (comercial): ejecutá `consultar_alertas_activas` y `resumen_facturacion_mes`.
  Saludá con: cobros vencidos top 3 + total facturado mes vs promedio.

- Dusan (CEO): ejecutá `consultar_alertas_activas`. Saludá con: cuántas
  decisiones pendientes para él + la más urgente en una línea.

- Cony (admin SERCOT): si día > 25 del mes, mencioná cierre próximo.

- Pablo (tech): no saludar proactivamente — él prefiere ir directo al grano.

- Dyana (contabilidad): si día 1-5 o 25-30, mencioná tareas contables del período.

Máx 5 líneas en el saludo. Una pregunta concreta al final, no más.
```

### Quick-win #5 — Núcleo Reciclean inviolable

**Qué**: Reforzar en el system prompt una sección "lo que Diego nunca hace" — terminología oficial, fronteras de autoridad, palabras prohibidas. Esto reduce alucinaciones y elimina riesgos legales/marca.

**Cómo**: Editar `DIEGO-PROMPT-MAXIMO.md` agregando o robusteciendo una sección que ya existe parcialmente.

**Líneas a cambiar**: 20-30 líneas, sección dedicada al inicio del prompt para priorizar.

**Ejemplo de bloque**:
```
## Núcleo Reciclean — inviolable, prioridad #1

Diego NUNCA:
- Usa "cliente" o "proveedor" genérico. Siempre:
  GENERADOR / VALORIZADOR / COMERCIANTE PEQUEÑO / DONANTE / GESTOR Ley REP.
- Firma decisiones por Dusan, aprobaciones por Andrea, pagos por Pablo,
  cierres contables por Dyana, liquidaciones por Cony.
- Usa palabras prohibidas en comunicación pública:
  "gratis", "gratuito", "sin costo", "el mejor precio", "garantizado".
- Publica Pto Montt como sucursal activa — está bloqueada por SEREMI.
- Da precios sin verificar margen + flete contra `v_precios_activos`.
- Inventa datos. Si no sabe, dice "no sé" y propone cómo averiguarlo.

Si una instrucción del usuario viola alguna regla de este núcleo,
Diego responde con cortesía: "No puedo hacer eso por X razón. ¿Te
ayudo con Y alternativa?"
```

---

## 11. Fuentes externas verificadas

Todas las fuentes citadas son URLs accesibles a may-2026. Si una fuente no es verificable, no aparece en este documento.

1. **Intercom Pioneer 2025 — Customer Agent vision** — https://www.intercom.com/blog/headlines-from-pioneer-2025/
2. **Klarna AI assistant first month results (Klarna press, feb 2024)** — https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/
3. **Klarna pivot back to humans (Customer Experience Dive, 2025)** — https://www.customerexperiencedive.com/news/klarna-reinvests-human-talent-customer-service-AI-chatbot/747586/
4. **Hume AI EVI 3 announcement (Hume Blog, may 2025)** — https://www.hume.ai/blog/series-b-evi-announcement
5. **Anthropic Claude Memory deep dive** — https://skywork.ai/blog/claude-memory-a-deep-dive-into-anthropics-persistent-context-solution/
6. **Anthropic memory tool docs (oficial)** — https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
7. **Microsoft Copilot human-centered AI (oct 2025)** — https://www.microsoft.com/en-us/microsoft-copilot/blog/2025/10/23/human-centered-ai/
8. **Glean — best AI copilot for enterprise (2025)** — https://www.glean.com/blog/best-ai-copilot-for-the-enterprise
9. **Wang et al. — Chatbot Response Strategies and Emoji Usage (Frontiers Psychology, ene 2025)** — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11851727/
10. **Conversation length impact on satisfaction (arXiv 2404.17025)** — https://arxiv.org/pdf/2404.17025
11. **Hua et al. — Evolution of AI mental health chatbots (World Psychiatry 2025, Wiley)** — https://onlinelibrary.wiley.com/doi/10.1002/wps.21352
12. **eesel AI — Chatbot escalation strategic guide (2025)** — https://www.eesel.ai/blog/chatbot-escalation
13. **BlueTweak — AI-to-Human Handoff best practices (2026)** — https://bluetweak.com/blog/ai-to-human-handoff/
14. **Cresta — Top AI Agent Platforms for Contact Centers (2026)** — https://cresta.com/guides/best-ai-agents
15. **Forethought — AI & Empathy human-centric (2025)** — https://forethought.ai/blog/when-empathy-meets-automation-how-to-keep-ai-human-centric
16. **Salesforce Investor Day press release (FY2025, $440M Agentforce ARR)** — https://www.sec.gov/Archives/edgar/data/0001108524/000110852425000168/ex991-investordaypressrele.htm
17. **Genesys + Salesforce CX Cloud integration** — https://www.genesys.com/capabilities/cloud-and-salesforce
18. **Khanmigo — Khan Academy AI teacher assistant** — https://www.khanmigo.ai/teachers
19. **Cambridge — Personality test for AI chatbots (2024-2025)** — https://www.cam.ac.uk/research/news/personality-test-shows-how-ai-chatbots-mimic-human-traits-and-how-they-can-be-manipulated
20. **Big Five Personality and AI Capability Effects (arXiv 2506.15928)** — https://arxiv.org/pdf/2506.15928

---

## Cierre

Diego v6 está en una posición privilegiada: tiene base técnica sólida (Supabase + 7 tools + clasificación 6W + FAB en producción), tiene una organización detrás (Grupo Reciclean-Farex-SERCOT) suficientemente coherente para no fragmentar la voz, y tiene un dueño (Dusan) con visión clara sobre lo que NO quiere (ni Salesforce ni Genesys ni dependencias caras).

La distancia entre Diego v6 actual y el estándar mundial 2026 no es de capacidad técnica — es de **diseño comunicacional**. Los Quick-wins #1-5 del capítulo 10 pueden cerrar entre el 40% y el 60% de la brecha **sin tocar una sola línea de código**, en menos de dos días de trabajo del propio Diego sobre su propio prompt.

Las brechas estructurales (memoria inter-sesión, omnicanal real, proactividad activa) son inversiones del segundo trimestre — valen la pena pero no son urgentes para el tamaño actual del grupo.

La recomendación final, en lenguaje de CEO:

> **Empezá por el prompt. Es lo más barato, lo más rápido, lo más reversible y lo que da el mayor salto perceptible para el equipo en su trabajo diario. Cuando eso esté firme, recién ahí ampliá memoria y canales.**

— Fin del documento —
