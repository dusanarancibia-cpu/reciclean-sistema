# DIEGO — ESTÁNDAR MUNDIAL 2026 EN EJECUCIÓN Y LOGRO DE METAS

> **Fuente**: investigación de estándares de clase mundial 2025-2026 aplicada al rol de Diego v6 como copiloto empresarial del Grupo Reciclean-Farex-SERCOT.
> **Fecha**: 2026-05-22
> **Autor**: Alex (Product Manager, agente investigador)
> **Alcance**: Diego v6+ debe pasar de "registrador de compromisos" a "orquestador de logro" para 14 personas × 8 empresas.
> **Audiencia**: Dusan Arancibia (CEO) — decisor final del roadmap Diego v6/v7.

---

## Convenciones de este documento

- **Estándar mundial 2026** = lo que hoy hace una empresa que ejecuta de élite (Salesforce, ServiceNow, Microsoft, Quantive, Lattice, Cognition, Atlassian).
- **Diego v6 actual** = stack vivo descrito en el contexto (7 tools, `panel.diego_tareas`, system prompt 602 líneas).
- **Brecha** = lo que el estándar hace y Diego no.
- **Quick-win** = implementable sin Pablo, en ≤ 2 días, solo con cambios de prompt + `panel.config_ui` + vistas SQL.
- **Cita** = fuente verificable 2025-2026 al final del bloque.

---

## 0. Tesis del PM (3 párrafos para Dusan)

Diego v6 hoy es un buen mayordomo y un mediocre coach. Registra lo que le pedís, contesta precio, busca cliente. Eso ya lo hacían los chatbots de 2023. La diferencia entre un copiloto que las empresas top del mundo despliegan en 2026 y un chatbot transaccional es **una sola cosa**: el copiloto entiende que detrás de cada pregunta hay una meta, y detrás de cada meta hay un objetivo de empresa. Diego v6 no tiene ese hilo.

El estándar mundial 2026 (Quantive, WorkBoard, Lattice, Atlassian Atlas, Asana AI, ServiceNow Autonomous Workforce) ya no se mide en "cuántas tareas registró el bot". Se mide en **cuántas metas cerraron los humanos gracias al bot**. La pregunta no es "¿Diego anotó el pedido?". Es "¿Andrea cerró Pincore? ¿Dyana cerró mayo contable? ¿La meta Q3 de pesajes +15% está en track o desviada?". Esa pregunta hoy Diego no la puede contestar — porque no la sabe.

Mi recomendación como PM: en lugar de meter más tools en Diego, en los próximos 30 días le metemos **un mapa de metas** y **un loop de seguimiento**. Empezamos por 3 KPIs duros (a definir con vos): pesajes mensuales, oportunidades cerradas Andrea, cierre contable Dyana. Diego deja de ser un chat-CRUD y pasa a ser un PM en miniatura. El resto del documento explica cómo lo hacen los líderes mundiales y qué de eso es realista para Reciclean en 2 días, 2 semanas y 2 meses.

---

## 1. Descomposición de metas en tareas accionables

### 1.1 Estándar mundial 2026

El framework dominante sigue siendo **OKR** (Objectives + Key Results) — pero la novedad 2026 es que **un agente IA descompone el objetivo en KRs y los KRs en tareas en menos de 3 minutos**, lo que antes tomaba un taller de planificación de un día completo.

Lo que hace un agente top en 2026:

1. **Captura un objetivo en lenguaje natural** ("vender más cartón en el sur").
2. **Pregunta 3-5 preguntas críticas** ("¿en qué horizonte? ¿desde qué base? ¿en qué sucursal? ¿con qué tipo de generador?").
3. **Propone 3-5 Key Results medibles**, no más — el estándar 2026 es 3-5 objetivos por equipo por trimestre, "más que eso usualmente lleva a dilución y confusión" (OKR Institute 2026).
4. **Descompone cada KR en 5-10 tareas** con criterios de aceptación, dueño tentativo, dependencias.
5. **Marca el riesgo** de cada KR (alta/media/baja confianza) basado en histórico.

### 1.2 Quién lo hace bien hoy

- **Quantive (ex-Gtmhub)** — usa IA generativa para sugerir KRs basados en el sector, comparándolos con benchmarks. Si decís "aumentar retención", te sugiere "retención D30 ≥ 65%" porque es la mediana de SaaS B2B según su base.
- **WorkBoard** — su "Strategy AI" toma un objetivo de empresa y propone el árbol completo de OKRs por equipo, listo para revisión humana. La promesa: "3 minutos vs 3 semanas".
- **Asana AI Goals** — vincula tasks ↔ projects ↔ goals y propone qué tasks están "huérfanas" (no aportan a ninguna meta). "Asana's Goals feature helps bridge the gap between day-to-day work and high-level strategic goals" (Asana 2026).
- **ChatGPT + Asana** — un usuario dicta el objetivo en ChatGPT, ChatGPT crea las tareas vía la integración nativa de Asana. Modelo "voz a backlog".

### 1.3 La diferencia entre SMART y OKR (importante para Diego)

| Atributo | SMART | OKR |
|---|---|---|
| Foco | Una tarea bien escrita | Un sistema de metas anidadas |
| Horizonte | Variable | Trimestral o anual |
| Cascada | No define | Sí — empresa → equipo → individuo |
| Stretch | No | Sí — 0.7 de logro = éxito en cultura OKR |
| Apto Reciclean | Útil para tareas operativas | Útil para "vender 15% más cartón Q3" |

**Recomendación PM**: Diego usa OKR para los 3-5 objetivos macro del año y SMART para descomponer cada KR en tareas semanales. No mezclar.

### 1.4 Ejemplo concreto Reciclean

Andrea le dice a Diego: **"Quiero cerrar Pincore este mes"**.

**Diego v6 actual** registra: `diego_tareas('seguir Pincore', andrea, mayo)`. Punto. Andrea sigue tan sola como antes.

**Diego estándar 2026** debería responder:

> "Listo. Antes de anotarlo: ¿qué significa "cerrar" para vos? Te propongo 3 KRs medibles:
> 1. Cotización OP-2026-042 firmada (binary).
> 2. Pesaje inicial ≥ 4 ton dentro de 14 días.
> 3. Margen sobre piso ≥ 30% (hoy va abajo del piso, alerta activa).
>
> Y te propongo 5 tareas para llegar:
> a) Revisar cotización con Dyana (giro SII faltante).
> b) Visita comercial a Maipú (última fue 12-may).
> c) Validar logística retiro 2/semana con Pablo (5R disponibilidad).
> d) Cerrar precio cartón mixto ≥ piso (hoy $X menos).
> e) Confirmar día de retiro inaugural.
>
> ¿Apruebo este plan o ajustamos algo?"

Esa diferencia — entre **registrar** y **descomponer** — es la diferencia entre un bot 2023 y un copiloto 2026.

**Fuentes**:
- [Worxmate — OKRs for AI-Driven Teams 2026](https://worxmate.ai/product/product-comparison/okrs-for-ai-driven-teams/)
- [OKR Institute — How to Set OKRs in 2026](https://okrinstitute.org/how-to-set-okrs-for-your-team-in-2026-a-practical-future-ready-guide/)
- [Krezzo — Mastering OKR Goal-Setting Frameworks 2026](https://ai.krezzo.com/resources/okr-goal-setting-frameworks)
- [Asana AI — Product page 2026](https://asana.com/product/ai)

---

## 2. Asignación inteligente según skills y carga

### 2.1 Estándar mundial 2026

El estado del arte es **skill-based routing + workload balancing automático**. El agente conoce:

1. **Qué skills tiene cada persona** (mantenido en un grafo o tabla de competencias).
2. **Qué carga real tiene cada uno hoy** (tareas abiertas, deadlines).
3. **Qué prioridad de negocio tiene cada tarea nueva**.
4. **Quién prefiere qué tipo de trabajo** (basado en histórico de aceptación/rechazo).

El agente recomienda el dueño óptimo y, si el humano discrepa, aprende del override.

### 2.2 Quién lo hace bien hoy

- **ServiceNow Autonomous Workforce (FY2026)** — lanzó "AI specialists that execute enterprise jobs end-to-end with built-in governance". El primer modelo es Level 1 Service Desk AI Specialist; el patrón es: el agente recibe el ticket, decide si lo resuelve solo o lo rutea al humano correcto según skill + carga. Reporta que en sus propias operaciones, **agentes IA manejan el 90% del request intake, routing y resolution**.
- **Salesforce Einstein Omni-Channel Skill-Based Routing** — desde 2024 rutea cases según attributes/skills del agente humano. Lo que es nuevo en 2026 es el **agente IA que decide la skill requerida** automáticamente leyendo la descripción del caso, sin reglas manuales.
- **Microsoft Project AI Resource Leveling** — usa constraint satisfaction sobre el grafo de dependencias del proyecto + disponibilidad real del equipo. Cuando se infla la duración de una tarea, recalcula el plan completo.
- **Atlassian Goals** — su backbone es "owner, success measure, status". El agente sugiere owner cuando el creador no lo define.

### 2.3 La trampa que hay que evitar

El error clásico de chatbots empresariales: **routing por defecto al usuario que pregunta**. Si Andrea pregunta por una factura impaga, Diego v6 actual le anota la tarea a Andrea — pero esa tarea es de Dyana. El estándar 2026 detecta el dominio ("factura impaga" → contabilidad) y rutea a Dyana, notificando a Andrea con "te respondí pero anoté la acción para Dyana, ya la avisé".

### 2.4 Ejemplo concreto Reciclean

Pregunta: *"Diego, hay que cambiar el contrato de Pincore por la nueva dirección."*

**Diego v6 actual**: registra tarea al usuario que preguntó (puede ser Pablo, un chofer, Dusan — no importa, todos terminan con tareas que no son suyas).

**Diego estándar 2026** debería:

1. Clasificar tarea: dominio = **contratos** + skill = **legal/admin**.
2. Consultar tabla skills: Cony (admin) tiene skill `contratos:nivel_2`.
3. Consultar carga: Cony hoy tiene 3 tareas abiertas, ninguna P0.
4. Asignar a Cony, notificar al solicitante con "asignado a Cony, ETA viernes".
5. Si Cony rechaza, aprende y ajusta el grafo de skills.

### 2.5 Mínimo viable para Reciclean (14 personas)

No hace falta un sistema de competencias enterprise. Basta una tabla `panel.persona_skills` con 3 columnas (`persona_id`, `dominio`, `nivel`) y ~50 filas. Diego rutea con esa tabla y aprende vía overrides.

**Fuentes**:
- [ServiceNow Form 8-K FY2026 — Autonomous Workforce launch](https://www.sec.gov/Archives/edgar/data/0001373715/000137371526000054/erq1fy26.htm)
- [Atlassian — Goals platform docs](https://www.atlassian.com/platform/platform-apps/goals)

---

## 3. Seguimiento de progreso con alertas de desvío

### 3.1 Estándar mundial 2026

Tres mecanismos coexisten en el top tier:

**Mecanismo 1 — Status semáforo (Atlassian Atlas)**. Cada goal tiene status `on_track / off_track / at_risk / done` actualizado en cadencia semanal. El agente persigue al owner si no actualizó en X días.

**Mecanismo 2 — Earned Value Management (EVM)**. Para proyectos con plan de valor temporal. Calcula SPI (Schedule Performance Index = EV/PV) y CPI (Cost Performance Index = EV/AC). Si SPI < 0.9 o CPI < 0.9, alerta. La novedad 2026 es que **un agente detecta patrones anómalos** antes de que el SPI cante: "end-of-month cliffs in earned value, flat EV with rising actual costs, repeated 50% EV on milestones" son señales tempranas (Routine 2026).

**Mecanismo 3 — Flow metrics + Monte Carlo**. Para backlogs ágiles. El agente corre simulaciones Monte Carlo sobre el throughput histórico del equipo y proyecta "probabilidad 85% de cerrar este KR antes del 30-jun". Si la probabilidad cae bajo el umbral, alerta.

### 3.2 Quién lo hace bien hoy

- **Atlassian Atlas / Atlassian Goals** — semáforo + comentarios + integración con Jira. "Track progress and drive action without manual rollups" (Atlassian 2026).
- **Notion AI Goals 2026** — templates de goal tracker con cálculo automático de % progreso y múltiples vistas.
- **Routine / Cleopatra Enterprise** — automatización EVM con detección de patrones IA.
- **Smartsheet Resource Management** — workload + flow.

### 3.3 La diferencia entre alerta útil y alerta cringe

Una alerta útil dice: *"Andrea, Pincore está en track pero el pesaje inicial (KR 2) tiene 60% probabilidad de slip — la disponibilidad de 5R esta semana cayó. ¿Coordinás con Pablo o lo elevamos a Dusan?"*. Nombra qué se desvía, por qué, y qué hacer.

Una alerta cringe dice: *"Tu tarea está atrasada"*. No agrega información. Ya lo sabe quien la tiene.

El estándar 2026 es: **alertas con contexto, alternativas y dueño claro**, no recordatorios.

### 3.4 Cadencia recomendada para Reciclean

| Tipo de meta | Cadencia check-in | Trigger alerta |
|---|---|---|
| Meta trimestral (ej: pesajes +15%) | Semanal | Si SPI < 0.85 dos semanas seguidas |
| Meta mensual (ej: cierre contable mayo) | 2× semana | Si quedan ≤ 3 días y < 70% completado |
| Compromiso individual (ej: visitar Pincore) | Día previo | Si vence en 24h y status = no_iniciada |

### 3.5 Ejemplo concreto Reciclean

Dyana cierra mes contable cada 5 del mes siguiente. KR: "cierre mayo entregado antes del 5-jun, sin observaciones SII".

**Diego v6 actual** no sabe que existe el KR. Si Dyana no menciona el tema, Diego está mudo.

**Diego estándar 2026** monitorea:
- 25-may: "Dyana, faltan 11 días para cierre mayo. Hoy van 6/10 hitos parciales (60%). Histórico: a esta altura ibas en 7/10. Vas levemente atrasada. ¿Qué te falta?"
- 1-jun: "Dyana, faltan 4 días. Status 8/10. Andrea tiene 2 cotizaciones pendientes de DTE que afectan tu cierre — ya le avisé."
- 4-jun: "Dyana, cierre mayo al 95%. Solo falta conciliación Banco Santander. Si necesitás horas extra de Pablo para el script, decímelo ahora."

Eso es seguimiento. No es vigilancia: es coordinación.

**Fuentes**:
- [Routine — Automating EVM With AI for CPI and SPI](https://routine.co/blog/posts/automating-earned-value-ai)
- [Atlassian — Goal Status docs](https://support.atlassian.com/platform-experiences/docs/use-goal-status-to-track-objectives-and-key-results/)
- [Cleopatra Enterprise — SPI guide](https://cleopatraenterprise.com/blog/schedule-performance-index-spi/)
- [Devoteam — Monte Carlo in Agile](https://www.devoteam.com/expert-view/embracing-uncertainty-with-monte-carlo-simulations-in-agile/)

---

## 4. Celebración de hitos intermedios

### 4.1 Estándar mundial 2026

El principio fundacional viene de **Teresa Amabile (Harvard Business School)** y su "Progress Principle": *de todos los factores que aumentan motivación intrínseca en el trabajo, el más fuerte es la sensación de progreso en trabajo significativo*. No es el bonus de fin de año. Es el "pequeño paso adelante de hoy".

El estándar 2026 traduce esto en producto:

1. **Micro-recompensas inmediatas**, no anuales. Cada hito intermedio dispara un acuse positivo.
2. **Visibilidad social**, no privada. La celebración pública (canal Slack, post Lattice) refuerza mucho más que la silenciosa.
3. **Calibración**: la celebración debe ser proporcional. Cerrar un cliente menor ≠ cerrar Pincore. Si Diego celebra todo con el mismo entusiasmo, pierde credibilidad y se vuelve "corporate cringe".
4. **Personalización**: algunas personas odian la celebración pública. El sistema aprende y respeta.

### 4.2 Quién lo hace bien hoy

- **Duolingo 2026** — 36% YoY DAU growth, 28% churn slashed en Western markets, 116% jump in referrals — todo atribuido a "rewarding milestones with visual flair". Badges, animaciones, streaks, leagues. Cada acción tiene un micro-reward visual + dopamina inmediata.
- **Lattice Praise** — "praise a colleague in any Slack channel, in an email, or in Lattice. Praise is celebrated in Lattice, Slack, Microsoft Teams, and in your offices". Lo crítico: integrado al flow del trabajo, no en una pantalla aparte.
- **15Five High Fives** — "publicly recognizing teammates and consistently boosting morale". Patrón: micro-mensajes asíncronos, no ceremonias.

### 4.3 La diferencia entre celebración auténtica y cringe

| Auténtica | Cringe |
|---|---|
| Específica: "cerraste 3 visitas en Maipú esta semana, +50% vs prom" | Genérica: "¡buen trabajo equipo!" |
| Vinculada a meta: "+2pp hacia KR pesajes Q3" | Suelta: "¡así se hace!" |
| Tempo correcto: inmediata, < 24h del hito | Tardía: "felicitaciones por lo del mes pasado" |
| Visibilidad calibrada: privado vs grupo según preferencia | Spam masivo a todos |
| Lenguaje humano | Emoji-bomba sin contexto |

### 4.4 Ejemplo concreto Reciclean

Andrea cierra cotización OP-2026-042 con Pincore al 32% margen (sobre piso 30%).

**Diego v6 actual**: no se entera (no hay trigger).

**Diego estándar 2026**:

1. Detecta el evento (status oportunidad = cerrada).
2. Mensaje privado a Andrea: *"Cerraste Pincore al 32% — 2pp sobre piso. Esto te deja al 67% del KR mensual de margen promedio. Bien jugada la negociación del cartón mixto."*
3. Si Andrea opt-in al modo público: post en canal grupo *"Andrea cerró Pincore — +4 ton/mes recurrentes hacia meta Q3 pesajes."*
4. Registra el hito en `panel.diego_hitos` para que en el resumen semanal de Dusan aparezca.

### 4.5 Calibración para Reciclean (14 personas, cultura PyME chilena)

La cultura chilena de empresa familiar premia el reconocimiento honesto y específico, no el corporate gringo. **Recomendación PM**: que Diego celebre con texto, no con emojis-bomba. Frases cortas, datos concretos, vínculo a la meta. Una vez por semana, un resumen "esta semana Andrea cerró 3 oportunidades, Dyana cerró cierre abril, Pablo deployeó 2 EFs sin caídas". Eso vale más que 100 stickers.

**Fuentes**:
- [Trophy — Duolingo Gamification Case Study 2026](https://trophy.so/blog/duolingo-gamification-case-study)
- [Lattice — Praise platform page](https://lattice.com/platform/performance/praise)
- [SelectHub — Lattice vs 15Five 2026](https://www.selecthub.com/performance-management-software/lattice-vs-15five/)

---

## 5. Replanificación dinámica ante obstáculos

### 5.1 Estándar mundial 2026

El estado del arte en agentes IA es **dynamic re-planning sin pedir permiso**. El agente no se cuelga ni dispara al humano apenas un step falla. Razona sobre el contexto, prueba un fallback, y solo escala si los fallbacks también fallan.

Componentes:

1. **DAG de ejecución** (Directed Acyclic Graph): el plan es un grafo, no una lista lineal. Si un nodo falla, hay rutas alternativas precomputadas.
2. **Context preservation**: el agente recuerda qué intentó, qué falló, por qué.
3. **Fallback hierarchy**: cada step crítico tiene un Plan B y un Plan C predefinidos.
4. **Escalation criteria**: cuándo dejar de intentar y avisar al humano (umbral de intentos, severidad, tiempo).

### 5.2 Quién lo hace bien hoy

- **Cognition Devin 2.0** — "Devin doesn't stop and ask for help — it adapts. Devin reasons about the situation using its full context — what the task is, what the test failures say, what it has done so far — and chooses the most appropriate path forward". El patrón es: planear → ejecutar → detectar fallo → re-planear → re-intentar → escalar solo si N intentos fallan.
- **Cognition Auto-Triage (2026)** — agente persistente en Slack que monitorea reportes de bugs, decide si los puede resolver solo y solo escala los relevantes. "Parent Devin to filter noise before spinning up focused sub-sessions".
- **Cursor Composer 2.5 (2026)** — similar approach pero con foco en developer-in-the-loop.
- **Monte Carlo en proyectos** — frente a un slip, recalcula la probabilidad de cierre y propone nuevo plan con buffer ajustado.

### 5.3 La regla de oro del re-planning

> No avises al humano "fallé". Avisá "fallé, probé X, probé Y, no funcionó, mi mejor hipótesis es Z, ¿continúo con Z o tomás vos?".

Eso convierte al agente en un colaborador que piensa, no en un alarm system.

### 5.4 Ejemplo concreto Reciclean

Andrea programó retiro Pincore para martes 27-may. Lunes 26 a las 18:00, Pablo informa que el camión 5R está en taller, no sale hasta jueves.

**Diego v6 actual**: no se entera. Andrea descubre el martes a las 8am que no hay camión, llama a Pincore para reprogramar, queda mal con el cliente.

**Diego estándar 2026**:

1. Detecta evento (Pablo cambió status camión 5R = taller).
2. Cross-referencia: ¿qué compromisos dependen del camión?
3. Encuentra retiro Pincore martes 27.
4. Re-planifica: ¿hay otro camión disponible? Consulta tabla flota → camión Transportes Diego libre martes mañana.
5. Propone a Andrea (Slack/WhatsApp, 18:05): *"Camión 5R inactivo hasta jueves. Retiro Pincore martes 27 reasignado a Transportes Diego — confirmación del chofer en 15min. ¿OK o lo movés vos?"*
6. Si Andrea no contesta en 30min y el caso es no-bloqueante, ejecuta y deja log. Si es crítico (cliente VIP, monto alto), escala a Dusan.

### 5.5 Trade-off: autonomía vs. supervisión

El espectro 2026 va de:

- **Nivel 0**: solo pregunta al humano (Diego v6 actual).
- **Nivel 1**: propone, espera OK explícito.
- **Nivel 2**: propone, ejecuta si no hay objeción en X tiempo.
- **Nivel 3**: ejecuta, avisa después (modo "wake-on-failure").

Para Reciclean en 2026, **Nivel 1 con migración gradual a Nivel 2 en dominios seguros** (reasignar camión, mover hora de visita). Nivel 3 solo cuando haya 6+ meses de track record sin sorpresas.

**Fuentes**:
- [Medium — How Devin AI Actually Thinks: Autonomous Planning, DAG Execution, Dynamic Re-Planning](https://medium.com/@nitinmatani22/how-devin-ai-actually-thinks-autonomous-planning-dag-execution-and-dynamic-re-planning-explained-997be175a475)
- [Code Newsletter — Cursor Composer 2.5, Devin Auto-Triage](https://codenewsletter.ai/p/cursor-drops-composer-2-5-cognition-unveils-devin-auto-triage)
- [Builder.io — Devin vs Cursor 2026](https://www.builder.io/blog/devin-vs-cursor)

---

## 6. Conexión metas individuales → metas empresa → Plan 2026

### 6.1 Estándar mundial 2026

La pieza maestra. Aquí es donde Diego puede generar **valor 10× del que da hoy**.

El framework: **OKR cascading sobre un Strategy Map (Kaplan-Norton)**.

1. **Plan 2026 (top)** define 5-7 themes estratégicas (ejemplo: "crecimiento sur", "eficiencia operativa", "consolidación SaaS").
2. Cada theme tiene **objetivos de empresa** (corporate OKRs).
3. Cada empresa del grupo tiene **objetivos de empresa-unidad** que aportan a corporate.
4. Cada equipo (comercial, contable, ops, IT) tiene **OKRs de equipo** alineados.
5. Cada persona tiene **2-3 OKRs individuales** que mueven el de equipo.
6. Cada tarea diaria está vinculada a uno de esos OKRs individuales.

El estándar 2026 es que **cada tarea sabe a qué KR sube, y cada KR sabe a qué objetivo de empresa sube**. Eso permite que el agente conteste: *"Andrea, esta visita a Pincore mañana mueve el KR pesajes Q3 = +15%, que es la línea principal del theme 'crecimiento sur' del Plan 2026"*.

### 6.2 Quién lo hace bien hoy

- **WorkBoard** — "enterprise OKR management platform that combines goal-setting with built-in OKR coaching and strategic alignment tools" (2026). Específicamente diseñado para cascading multi-nivel.
- **Quantive** — IA que sugiere la cascada completa desde objective hasta task.
- **Microsoft Viva Goals** — basado en Ally.io. **NOTA CRÍTICA**: Viva Goals retira a fin de 2025. Microsoft no lo reemplaza con producto propio.
- **Lattice Goals** — fuerte en cascading + check-ins.
- **Strategy Maps Kaplan-Norton** — el framework conceptual original (1996, vigente). "Use the BSC as the strategic backbone and OKRs as the execution rhythm".

### 6.3 El truco que cambia la conversación

La fórmula que convierte a Diego en irreemplazable: **cada respuesta de Diego termina con la línea de impacto**.

Sin la línea de impacto: *"Listo, te agendé visita a Pincore mañana 10am."*
Con la línea de impacto: *"Listo, te agendé visita a Pincore mañana 10am. Esto aporta al KR2 tuyo (3 visitas/semana en Maipú) y al objetivo Q3 de pesajes +15% del Plan 2026 — vas 7/12 visitas del mes."*

Esa línea cuesta cero. Cambia todo. El humano deja de sentirse en un to-do list y empieza a sentirse en una misión.

### 6.4 Ejemplo concreto Reciclean (Andrea)

Estructura propuesta (a definir con Dusan):

```
Plan 2026 (Theme: Crecimiento Sur)
  ↓
Objetivo Reciclean 2026: +15% pesajes Q3 vs Q3 2025
  ↓
Objetivo Comercial Andrea 2026: cerrar 12 generadores nuevos en Maipú+Cerrillos
  ↓
KR Andrea mayo: cerrar 3 generadores nuevos (1 ya: Pincore)
  ↓
Tarea diaria: visita Pincore 27-may 10am
```

Diego conoce las 5 capas. Cuando Andrea pregunta cualquier cosa, Diego puede contestar la pregunta y dar el contexto de impacto.

### 6.5 Ejemplo concreto Reciclean (Dyana)

```
Plan 2026 (Theme: Eficiencia Operativa)
  ↓
Objetivo Grupo 2026: cierre contable mensual ≤ 5 días post-mes, cero observaciones SII 12 meses corridos
  ↓
KR Dyana mayo: cerrar mes mayo antes del 5-jun, 0 observaciones SII
  ↓
Hitos parciales: conciliación banco, DTEs Andrea, prov pagados, F29 borrador
  ↓
Tareas diarias: revisar DTE OP-2026-042, conciliar Santander 30-may
```

Dyana le pregunta a Diego "¿qué me falta para cerrar mayo?" → Diego responde con el status de los 4 hitos parciales + tareas concretas, ranked por bloqueante para SII.

### 6.6 Mínimo viable para arrancar

Reciclean no necesita un sistema OKR enterprise. Para empezar:

| Tabla | Filas estimadas |
|---|---|
| `panel.plan_2026_themes` | 5-7 |
| `panel.objetivos_empresa` | 10-15 |
| `panel.okrs_persona` | 30-40 (2-3 × 14 personas) |
| `panel.okr_tarea_link` | vincula `diego_tareas.id` ↔ `okr_id` |

Con esas 4 tablas, Diego puede dar la línea de impacto en toda respuesta.

**Fuentes**:
- [WorkBoard — Top Viva Goals Alternatives 2026](https://www.workboard.com/resources/blog/top-viva-goals-alternatives)
- [LinkedIn — Balanced Scorecard, Strategy Maps and OKRs](https://www.linkedin.com/pulse/balanced-scorecard-strategy-maps-okrs-bo-pedersen)
- [Umbrex — Balanced Scorecard Kaplan-Norton](https://umbrex.com/resources/frameworks/organization-frameworks/balanced-scorecard-kaplan-norton/)
- [Josh Bersin — Microsoft Releases Viva Goals](https://jbc.joshbersin.com/microsoft-releases-viva-goals-performance-management-is-sexy-again/)
- [Tability — Viva Goals Retiring](https://www.tability.io/odt/articles/microsoft-viva-goals-is-retiring---what-are-okr-software-alternatives)

---

## 7. Anti-patrones que destruyen valor (lo que NO hay que copiar)

El estándar 2026 también enseña qué evitar. Diego no debe replicar:

1. **Burocracia OKR**: si actualizar el goal toma más tiempo que ejecutar el trabajo, se abandona en 2 semanas.
2. **Métricas vanidosas**: "mensajes enviados", "tareas registradas". No mueven el negocio. Diego debe priorizar **outcome metrics** (pesajes, margen, días-cierre) sobre **activity metrics**.
3. **Recordatorios sin valor**: pings sin contexto generan ruido y se silencian. Cada alerta debe traer **información + alternativa**.
4. **Celebración inflacionaria**: si todo es celebrado, nada se celebra. Calibrar.
5. **Overreach de autonomía**: agente que ejecuta sin checkpoint en dominio nuevo. Migrar gradual.
6. **Castle dashboards**: tableros que nadie mira. Diego debe **empujar** la info en el flow (chat), no esperar que la pidan.

---

## 8. Modelo operativo Diego v7 (propuesto)

### 8.1 Capas

| Capa | Función | Frecuencia |
|---|---|---|
| L1 — Captura | Recibir input humano (chat) | Real-time |
| L2 — Descomposición | Partir objetivo en KRs + tareas | On-demand |
| L3 — Asignación | Routing por skill + carga | Por tarea |
| L4 — Seguimiento | Status semáforo + alertas desvío | Daily/weekly |
| L5 — Replanificación | Detectar bloqueo + proponer Plan B | Event-driven |
| L6 — Celebración | Detectar hito + acuse calibrado | Event-driven |
| L7 — Línea de impacto | Vincular toda respuesta al Plan 2026 | Toda respuesta |

### 8.2 Tools nuevas que Diego necesita (orientativo, validar con Pablo)

1. `descomponer_objetivo(texto, dueño, horizonte) → KRs + tareas`
2. `consultar_skills_carga(persona_id) → skills + tareas_abiertas`
3. `consultar_status_okr(okr_id) → SPI + alertas`
4. `proponer_replan(tarea_id, motivo_bloqueo) → planB`
5. `registrar_hito(persona_id, descripcion, kr_id) → log + acuse`
6. `linea_impacto(tarea_id) → cadena OKR → objetivo → Plan 2026`

---

## 9. Roadmap recomendado (90 días)

### Semanas 1-2 (quick wins, sin Pablo)
- Definir con Dusan los 5-7 themes del Plan 2026.
- Definir 3 KPIs duros que Diego va a trackear primero (pesajes, oportunidades, días-cierre).
- Cargar tabla skills básica vía `panel.config_ui`.
- Actualizar prompt para incluir "línea de impacto" en toda respuesta.

### Semanas 3-6 (necesita Pablo)
- Tablas OKR (`panel.plan_2026_themes`, `objetivos_empresa`, `okrs_persona`, `okr_tarea_link`).
- Tool nueva `linea_impacto`.
- Vistas SQL `v_okr_status` con cálculo SPI básico.
- Alertas Diego semanales status semáforo.

### Semanas 7-12 (sistema maduro)
- Re-planificación event-driven.
- Celebración calibrada con opt-in/opt-out por persona.
- Dashboard CEO con cascada visual del Plan 2026.
- Migración de algunos dominios a Nivel 2 de autonomía.

---

## 10. Métricas de éxito para Diego v7

| Métrica | Target 90 días | Target 180 días |
|---|---|---|
| % KRs corporativos con status semaforizado en Diego | 100% | 100% |
| % personas que reciben "línea de impacto" en respuestas | 80% | 100% |
| Tareas Diego que disparan re-planificación automática | 5/mes | 20/mes |
| Hitos celebrados / mes | 10 | 30 |
| % alertas Diego que llevan a acción humana en ≤24h | 60% | 80% |
| Reducción en compromisos olvidados vs baseline pre-Diego v7 | -30% | -50% |
| NPS interno Diego (1-10) | ≥ 7 | ≥ 8 |

---

## Brechas vs Diego v6 actual

Top 10 brechas, ranked por impacto-esfuerzo:

| # | Brecha | Estándar 2026 | Diego v6 actual | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 1 | No conoce objetivos corporativos del Plan 2026 | OKR cascading visible al agente | No tiene tabla OKR ni link a tareas | ALTO | M |
| 2 | No da "línea de impacto" en respuestas | Toda respuesta cierra con cadena KR→objetivo | Confirma acción y corta | ALTO | S (prompt) |
| 3 | Descomposición superficial | Parte objetivo en 3-5 KRs + 5-10 tareas con criterio | Registra una sola tarea agendada | ALTO | M |
| 4 | Routing por defecto al solicitante | Skill-based routing + workload balance | Todo va al usuario que pregunta | ALTO | M |
| 5 | No detecta desvío sin ser preguntado | EVM/Monte Carlo + alertas proactivas | Mudo si no le preguntan | ALTO | L |
| 6 | No celebra hitos intermedios | Acuse calibrado + visibilidad social opt-in | Cero feedback positivo | MEDIO | S |
| 7 | No re-planifica ante bloqueo | DAG + fallback hierarchy + propuesta Plan B | Espera que humano lo resuelva | ALTO | L |
| 8 | Tareas a `cola_construccion` solo aceptan PR/mig/deploy | Cola heterogénea con clasificador | Tipos rígidos, rechaza comercial/contable | MEDIO | M |
| 9 | No diferencia outcome vs activity metrics | Métricas outcome primarias, activity secundarias | Registra todo como agendamiento simple | MEDIO | S |
| 10 | No aprende de overrides humanos | Loop de feedback que ajusta routing y celebración | Cada interacción es stateless en términos de aprendizaje | MEDIO | L |

---

## Implementable sin Pablo en 1-2 días

Top 5 quick-wins solo con cambios de **prompt + `panel.config_ui` + vistas SQL no-disruptivas**:

### Quick-win 1 — Línea de impacto en toda respuesta (4h)
**Qué**: agregar al system prompt una sección "Reglas de cierre" que obligue a Diego a terminar respuestas accionables con la cadena `tarea → KR → objetivo → Plan 2026`.
**Cómo**: editar `DIEGO-PROMPT-MAXIMO.md` con 1 bloque de ~20 líneas + 3 ejemplos few-shot.
**Pre-requisito**: definir con Dusan los 3-5 KRs prioritarios y los 1-2 themes del Plan 2026 que Diego puede citar. Si no están definidos, decir "definir con Dusan".
**Impacto**: cualitativo enorme — Diego pasa de bot a copiloto en un día.

### Quick-win 2 — Acuse calibrado de hitos (3h)
**Qué**: agregar al prompt regla "Si detectás un cierre de oportunidad, pago de cliente, o cierre de hito mensual, respondé con frase específica + dato + vínculo a KR. Nunca emoji-bomba." + 5 ejemplos.
**Cómo**: editar prompt. Sin tools nuevas. Diego ya tiene contexto cuando le mencionan el evento.
**Impacto**: cambia el tono. La gente se siente vista.

### Quick-win 3 — Reglas de routing por dominio en prompt (6h)
**Qué**: tabla en prompt con 15-20 reglas tipo "tema=factura → owner=Dyana, tema=contrato → owner=Cony, tema=deploy → owner=Pablo". Diego rutea sugiriendo dueño correcto al registrar tarea.
**Cómo**: editar prompt + agregar campo `dueño_sugerido` cuando Diego registra en `panel.diego_tareas`.
**Limitación**: sin tabla skills no es perfecto, pero cubre 80% de casos.
**Impacto**: Andrea deja de quedarse con tareas que son de Dyana.

### Quick-win 4 — Resumen semanal automático a Dusan (4h)
**Qué**: una vista SQL `v_diego_resumen_semana` que cuente: hitos cerrados, compromisos cumplidos, compromisos atrasados, alertas no resueltas. Diego lo entrega los viernes 18h en chat de Dusan vía prompt + cron desde el FAB.
**Cómo**: solo vista SQL `SELECT` (sin DDL), cron via `panel.config_ui`.
**Impacto**: Dusan ve el pulso semanal sin pedirlo.

### Quick-win 5 — Detección de desvío en `diego_tareas` (5h)
**Qué**: vista `v_diego_tareas_desviadas` que marca tareas con `due_date < now() AND status != 'done'` y tareas que llevan > 7 días sin update. Diego revisa esa vista cada vez que el usuario consulta su backlog y alerta.
**Cómo**: vista SQL + prompt rule "si usuario consulta su agenda, primero consultá `v_diego_tareas_desviadas` y alertá si hay items".
**Impacto**: cierra el loop de seguimiento sin tool nueva.

---

## Cierre del PM

Diego v6 ya tiene los músculos. Le falta el cerebro estratégico. Las brechas 1, 2 y 3 son las que cambian la categoría del producto — descomposición real, línea de impacto, conexión al Plan 2026. Los 5 quick-wins arriba son ~22 horas de trabajo solo de prompt + SQL. Mi recomendación es ejecutarlos esta misma semana, validar con Andrea y Dyana como early adopters, y entonces decidir si invertimos las 6-8 semanas que requiere el resto (tablas OKR, re-planificación, skill-based routing).

La pregunta que tenés que contestar vos, Dusan: **¿cuáles son los 3 KRs corporativos que Diego va a trackear primero?** Sin esa decisión, ninguno de estos quick-wins se puede ejecutar bien. Si no los tenés definidos, agendamos 45 min y los definimos. Es la única pregunta bloqueante.
