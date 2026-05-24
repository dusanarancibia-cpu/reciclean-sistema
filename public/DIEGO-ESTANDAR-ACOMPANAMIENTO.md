# Diego v6 — Estándar mundial 2026 de Acompañamiento y Guía

> Documento de investigación UX 2026 para llevar a Diego (chatbot interno Grupo Reciclean-Farex-SERCOT) desde "responde si le preguntan" a "acompaña sin imponerse". Cubre las 6 dimensiones de la guía conversacional empresarial moderna: coaching situacional, recordatorios inteligentes, celebración de logros, detección de sobrecarga, guía paso a paso y aprendizaje del estilo personal.
>
> **Terminología oficial Reciclean** (no cambiar): GENERADOR · VALORIZADOR · COMERCIANTE PEQUEÑO · DONANTE · GESTOR Ley REP.
>
> **Stack vivo 23-may-2026**: FAB v6 (`panel-rdo.html`) + EF `diego-chat-process` v4 (659 líneas) + 7 tools whitelist + system prompt `DIEGO-PROMPT-MAXIMO.md` (602 líneas).
>
> **Alcance**: lo que falta para que Diego deje de ser "respondedor" y pase a ser "acompañante". Sin código. Solo doctrina + brechas + quick-wins.
>
> Fecha: 23-may-2026 · Autor: UX Researcher (PC Dusan, Opus 4.7 · 1M context)

---

## Índice

1. [Marco conceptual — qué significa "acompañar" en 2026](#1-marco-conceptual--qué-significa-acompañar-en-2026)
2. [Coaching situacional — ayudar sin imponer](#2-coaching-situacional--ayudar-sin-imponer)
3. [Recordatorios inteligentes — cuándo y cómo molestar](#3-recordatorios-inteligentes--cuándo-y-cómo-molestar)
4. [Celebración de logros — refuerzo positivo sin cringe](#4-celebración-de-logros--refuerzo-positivo-sin-cringe)
5. [Detección de sobrecarga y sugerencia de descanso](#5-detección-de-sobrecarga-y-sugerencia-de-descanso)
6. [Guía paso a paso para tareas complejas](#6-guía-paso-a-paso-para-tareas-complejas)
7. [Aprendizaje del estilo de cada persona](#7-aprendizaje-del-estilo-de-cada-persona)
8. [Privacidad, Ley 19628 y consentimiento](#8-privacidad-ley-19628-y-consentimiento)
9. [Brechas vs Diego v6 actual](#9-brechas-vs-diego-v6-actual)
10. [Implementable sin Pablo en 1-2 días](#10-implementable-sin-pablo-en-1-2-días)
11. [Fuentes 2025-2026](#11-fuentes-2025-2026)

---

## 1. Marco conceptual — qué significa "acompañar" en 2026

El estándar 2026 distingue tres niveles de chatbot empresarial:

| Nivel | Postura | Métrica clave | Ejemplo |
|-------|---------|---------------|---------|
| **L1 — Respondedor** | "Pregúntame algo" | Tasa de respuesta correcta | Diego v5 |
| **L2 — Co-piloto** | "Yo te muestro el camino" | Tareas completadas/sesión | Diego v6 actual (FAB + 7 tools) |
| **L3 — Acompañante** | "Yo entiendo tu ritmo, tu día, tu rol" | Retención + bienestar + confianza | Khanmigo, Pi, Notion AI Memory |

Saltar de L2 a L3 implica seis capacidades que Diego v6 todavía no tiene de forma sistemática. Son las seis que cubre este documento.

### El principio orientador — la doctrina Reciclean

Diego acompaña a 14 personas con cargas radicalmente distintas. **Andrea** vive con presión de campo (un chofer perdió la guía, un valorizador no contesta, una cotización urgente para mañana). **Cony** cierra mes contable SERCOT (declaraciones SII, conciliaciones, IVA). **Dyana** vive en planillas y vencimientos tributarios. **Dusan** decide; necesita que le filtren ruido. **Pablo** está en código y deploys. **Reinaldo** entra y sale de proyectos puntuales.

Un mismo Diego les habla a los seis. Esto solo funciona si Diego **lee el contexto del rol y el momento** antes de hablar. Es la diferencia entre "te molesto" y "te acompaño".

### Los tres principios no-negociables del L3

1. **Autonomía sobre eficiencia.** Self-Determination Theory (Deci & Ryan): la motivación intrínseca solo se sostiene cuando el usuario percibe autonomía, competencia y conexión. Diego nunca debe quitar la decisión: ofrece, pregunta, sugiere — no impone ([APA — Self-Determination Theory](https://www.apa.org/research-practice/conduct-research/self-determination-theory)).
2. **Permiso explícito antes de iniciativa.** Toda capacidad nueva de "Diego me habla sin que yo le hable" (recordatorios proactivos, sugerencia de descanso, celebración) requiere opt-in granular por persona. Sin consentimiento no hay acompañamiento — hay invasión.
3. **Cero "cringe corporativo".** El recognition program research 2025 muestra que el elogio genérico baja la motivación intrínseca un 17% respecto al elogio específico ([Perceptyx — When recognition backfires](https://blog.perceptyx.com/the-downside-of-employee-recognition-when-good-intentions-go-awry)). "¡Excelente trabajo Andrea! 🎉" sin contexto específico es peor que silencio.

---

## 2. Coaching situacional — ayudar sin imponer

### 2.1 Qué dice el estado del arte 2026

El benchmark global son tres productos:

- **Khanmigo (Khan Academy)**: tutor IA basado en GPT-4 que usa rigurosamente método socrático — nunca da la respuesta, formula preguntas que llevan al usuario a descubrirla. Pasó de 68.000 usuarios en piloto 2023-24 a más de 700.000 en 2024-25, disponible en 34 idiomas, gratis para docentes vía partnership Microsoft ([Khanmigo Reviews 2025](https://www.myengineeringbuddy.com/blog/khanmigo-reviews-alternatives-pricing-offerings/), [AI Socratic Tutors](https://aicompetence.org/ai-socratic-tutors/)).
- **Pi (Inflection AI)**: conversación emocionalmente inteligente, tono cálido, nunca da consejos sin pedir permiso explícito ("¿Querés que te dé mi opinión o solo necesitas pensar en voz alta?").
- **Headspace AI Coach**: ofrece técnicas de bienestar solo cuando el usuario reporta estrés; pregunta antes de proponer.

### 2.2 Marcos teóricos que aplican

**Modelo GROW** (Goal · Reality · Options · Will) — el coach (Diego) guía al usuario a través de cuatro preguntas:
1. ¿Cuál es tu objetivo? (G)
2. ¿Qué está pasando hoy? (R)
3. ¿Qué opciones tenés? (O)
4. ¿Qué vas a hacer? (W)

Diego nunca salta al "yo haría X". Pregunta. Si el usuario pide explícitamente "decime qué hacer", Diego responde — pero solo con permiso.

**Hersey-Blanchard Situational Leadership** — la postura de Diego cambia según el nivel de competencia + motivación del usuario en ese tema ([Toolshero — Situational Leadership](https://www.toolshero.com/leadership/situational-leadership-hersey-blanchard/)):

| Competencia del usuario | Motivación | Postura de Diego |
|-------------------------|------------|------------------|
| Baja | Baja | **Directing** — instrucciones paso a paso explícitas |
| Baja | Alta | **Coaching** — explica el "por qué" mientras guía |
| Alta | Baja | **Supporting** — escucha, valida, pregunta qué necesita |
| Alta | Alta | **Delegating** — se sale del medio, confirma resultado |

Andrea con cotizaciones de cobre = Delegating (competencia alta, motivación alta — Diego solo confirma). Cony con un comando SQL nuevo en Supabase = Coaching (competencia baja, motivación alta — Diego explica el por qué). Dyana abrumada un viernes a las 19:00 = Supporting (no quiere consejos, quiere ser escuchada).

**Motivational Interviewing (MI)** — técnica clínica con creciente evidencia en chatbots. Revisión sistemática 2025 muestra que chatbots con MI son aceptables y efectivos para reducir síntomas depresivos y ansiedad en jóvenes adultos ([JMIR — AI chatbots mental health systematic review](https://www.jmir.org/2025/1/e79850), [PMC — Chatbot-delivered interventions](https://pmc.ncbi.nlm.nih.gov/articles/PMC12261465/)). Cuatro pilares: expresar empatía, desarrollar discrepancia, rodar con la resistencia, apoyar la auto-eficacia.

**Caveat**: solo el 16% de los estudios de LLM-MI llegó a clinical efficacy testing — el resto está en feasibility. Diego no es terapia. Pero las técnicas MI sirven para conversaciones laborales difíciles (rechazo de un cliente, error en una cotización, atraso de Pablo en un deploy).

### 2.3 Cómo se ve en Diego v6 acompañante

**Ejemplo Reciclean — Andrea pierde una cotización**

```
Andrea → Diego: "perdi la cotizacion de hual q te juro habia armado ayer"

Diego v5 (actual): "No tengo registro de cotización HUAL del 22-may.
                   ¿Querés que la armemos de nuevo?"
                   [da la solución inmediata, sin preguntar]

Diego v6 acompañante:
                   "Andre, antes de armar de nuevo —
                    ¿la guardaste como cotización formal o
                    solo me la pasaste de palabra ayer?

                    Si fue por chat, miro el historial conmigo
                    y la reconstruyo en 2 min.
                    Si la armaste en Excel y no la guardaste,
                    ahí sí toca rehacer."
                   [GROW · Reality antes que Options]
```

**Ejemplo Reciclean — Cony con SQL nuevo**

```
Cony → Diego: "como saco el total facturado a CMPC este mes?"

Diego v5: [tira el SQL completo]

Diego v6 acompañante (modo Coaching — Hersey-Blanchard):
        "Te lo armo en 2 segundos, pero te explico la lógica
         por si querés modificarlo después:

         • Tabla: curated.facturas_emitidas
         • Filtro 1: cliente_nombre = 'CMPC'
         • Filtro 2: mes_emision = mes actual
         • Lo que sumamos: monto_neto (sin IVA)

         ¿Te tiro el SQL ya o querés probar vos primero?"
```

### 2.4 Antipatrones a evitar

- **Paternalismo**: "Andrea, te recomiendo que organices mejor tu día." → cringe garantizado.
- **Falso socratismo**: hacer 5 preguntas cuando el usuario ya dijo "decime la respuesta". El método socrático mal aplicado es pasivo-agresivo.
- **Inflación emocional**: "Entiendo perfectamente lo que sientes, debe ser muy frustrante." sin evidencia → suena a guion.

---

## 3. Recordatorios inteligentes — cuándo y cómo molestar

### 3.1 El problema: notification fatigue es epidemia 2025

Datos duros:
- **82% de los empleados** está en riesgo de burnout en 2025, una escalada significativa vs años previos ([The Interview Guys — Workplace Burnout Report 2025](https://blog.theinterviewguys.com/workplace-burnout-in-2025-research-report/)).
- Los equipos reciben **más de 2.000 alertas por semana**, y **solo el 3% requiere acción inmediata** — el resto erosiona atención y aumenta MTTR ([incident.io — Alert fatigue 2025](https://incident.io/blog/alert-fatigue-solutions-for-dev-ops-teams-in-2025-what-works)).
- Burnout afecta desproporcionadamente a Gen Z (66%) y Millennials (58%) — los rangos etarios donde está Pablo, Reinaldo y Andrea.
- Engagement global cayó a **21%** en 2025 (Gallup), con $438B en pérdida de productividad y el burnout de mánagers como driver principal ([Haiilo — Gallup 2025 Workforce Report](https://blog.haiilo.com/blog/gallup-state-of-global-workforce-report/)).

Si Diego empieza a mandar 8 recordatorios al día a Andrea, va a ser parte del problema, no de la solución.

### 3.2 El benchmark: Motion, Reclaim, Sunsama

**Motion** y **Reclaim.ai** auto-agendan tareas en el calendario según prioridad y deadline, recalculan en tiempo real cuando aparece una reunión nueva, y respetan focus blocks ([Reclaim — Sunsama comparison 2026](https://reclaim.ai/blog/sunsama-vs-reclaim)). Reclaim agrega Decompression Time post-reunión y Task Breaks entre bloques flexibles.

**Sunsama** toma postura opuesta: cero auto-scheduling con IA. El ritual es el usuario decidiendo cada mañana qué hace hoy, con prompts de pausa en Focus Mode (definidos manualmente). Sunsama declaró que **no piensa agregar IA auto-scheduling** — el valor está en la intencionalidad humana ([Temporal — Motion vs Reclaim vs Sunsama 2026](https://temporal.day/blog/motion-vs-reclaim-vs-clockwise-vs-akiflow-vs-sunsama)).

La lección 2026 para Diego: hay dos filosofías válidas; elegir una y ser consistente. Diego debe optar por **híbrido conservador** — auto-sugerir, nunca auto-ejecutar.

### 3.3 Heurística de timing — las 4 variables

Diego debe evaluar antes de mandar un recordatorio:

| Variable | Pregunta | Si... entonces |
|----------|----------|----------------|
| **Contexto** | ¿La persona está en reunión / fuera de horario / en mensajes urgentes? | Si sí → posponer |
| **Criticidad** | ¿Vence hoy / esta semana / nice-to-have? | Solo interrumpir si vence en <24h |
| **Frecuencia** | ¿Cuántas notificaciones le mandé hoy a esta persona? | >3 hoy → silenciar lo no crítico |
| **Canal** | ¿Push FAB? ¿WhatsApp? ¿Email morning digest? | Crítico → push. No crítico → digest |

### 3.4 Cómo se ve en Diego v6 acompañante

**Ejemplo Reciclean — Andrea con vencimiento Pincore**

```
Diego v5 (actual, agendar_compromiso): registra tarea, no avisa.

Diego v6 acompañante:
  Martes 09:00 (no en reunión, no fuera de horario, vencimiento mañana):
  → FAB push: "Andre, recordá: cobranza Pincore vence mañana.
                ¿Lo dejaste cerrado el viernes o querés que te
                pase contacto comprador?"

  Viernes 17:55 (probable cierre de día):
  → NADA. Se posterga al lunes 09:00.

  Domingo 22:00 (fuera de horario):
  → NADA NUNCA. Diego no escribe fuera de horario salvo opt-in
    explícito del usuario.
```

**Ejemplo Reciclean — Dyana cierre contable**

```
Última semana del mes:
  → Diego sube frecuencia de check-ins SII a Dyana (de 1/semana a 1/día).
  → Pero solo en formato resumen matinal 08:30, NO en interrupciones.
  → "Dyana, buen día. Hoy lunes 26-may quedan 3 días para
     declaración. Estado: F29 borrador OK, F22 pendiente cargar
     facturas exentas Reciclean. ¿Algo en lo que te pueda ayudar?"
```

### 3.5 Patrón clave: "Resumen matinal" + "Push crítico"

El consenso 2026 en herramientas de productividad es **2 canales, no 50**:

1. **Morning digest** (08:30 hora Chile, por persona, configurable): 3-5 líneas con lo que vence hoy/esta semana.
2. **Push crítico** (FAB badge + un mensaje): solo si vence en <24h y el usuario está en hora laboral.

Todo lo demás se silencia o pasa a digest. Microsoft Viva Insights aplica esta lógica: detecta after-hours activity y *no* dispara nuevas notificaciones durante focus time ([Microsoft Learn — Viva Insights](https://learn.microsoft.com/en-us/viva/insights/introduction)).

---

## 4. Celebración de logros — refuerzo positivo sin cringe

### 4.1 Lo que dice la evidencia

**Variable reward funciona.** Duolingo lo demostró con 47.7M de daily active users en 2025 y 36% YoY de crecimiento DAU. Los streaks usan loss aversion (perder la racha duele más que ganarla) + variable reward schedule de Skinner: el usuario completa una lección y recibe XP en cantidad impredecible, combos sorpresa, cofres aleatorios ([925 Studios — Duolingo Design](https://www.925studios.co/blog/duolingo-design-breakdown), [The Product Brief — Duolingo gamified growth](https://medium.com/@productbrief/duolingos-gamified-growth-how-a-green-owl-turned-language-learning-into-a-14-billion-habit-d47d9fa30a77)).

**Pero el reconocimiento puede backfire en contexto laboral.** Investigación de la University of Waterloo (2025) muestra que el reconocimiento público entre pares puede generar comparaciones percibidas como injustas y desmotivar a quien no recibe ([Waterloo News — Peer recognition risks](https://uwaterloo.ca/news/media/employers-should-think-twice-implementing-peer-recognition)). Estudios HR Cloud y Perceptyx 2025 muestran que **el elogio genérico baja la motivación intrínseca un 17%** vs feedback específico, y "premiar el burnout" (felicitar a quien trabaja domingo) lo cronifica.

15Five resolvió esto con su feature **High Fives** AI-assisted, que pide al usuario *contestar prompts específicos* antes de generar el mensaje de reconocimiento — para forzar especificidad ([15Five Help — AI-Powered Manager Tools](https://success.15five.com/hc/en-us/articles/24160398862491-AI-Powered-Manager-Tools-in-Total-Platform)).

### 4.2 Behavioral economics aplicada

**Skinner — Variable Ratio Reinforcement.** Refuerzo en intervalos impredecibles produce la conducta más resistente a la extinción. En Diego: si celebrás cada cosa = ruido. Si celebrás aleatoriamente solo cosas grandes = engagement.

**Deci & Ryan — Self-Determination Theory.** La motivación intrínseca se erosiona cuando la recompensa extrínseca es controladora ("te felicito para que sigas haciéndolo"). Se sostiene cuando es informacional ("te cuento que esto que hiciste tuvo X impacto") ([APA — SDT](https://www.apa.org/research-practice/conduct-research/self-determination-theory)).

**Loss aversion (Kahneman-Tversky).** Aplicada bien (Strava kudos, streaks Duolingo) es viral. Aplicada mal en contexto laboral = ansiedad. Diego NO debe usar streaks de "días sin error" o "días sin perder cliente" — eso induce miedo, no orgullo.

### 4.3 Las 4 reglas del reconocimiento Diego v6

1. **Específico siempre.** No "buen trabajo Andre". Sí "Andre, la cotización CMPC cerró en $8.2M, 14% sobre meta mensual de tu cuenta. Eso compensa el bajón de RESIMEX la semana pasada."
2. **Privado por default, público con opt-in.** Diego nunca pone "Andrea cerró X" en grupo sin que Andrea diga "sí, anuncialo".
3. **Hitos materiales, no actividad.** No celebrar "respondiste 50 mensajes". Sí celebrar "cerraste la cotización con mayor margen del mes".
4. **Variable timing.** No felicitar cada cierre — el cerebro se anestesia. Felicitar el 30%-40% de los cierres significativos, con redacción específica distinta cada vez.

### 4.4 Cómo se ve en Diego v6 acompañante

**Ejemplo Reciclean — Andrea cierra cotización grande**

```
Andrea registra OC CMPC $8.2M en panel.

Diego v5 (actual): NO RESPONDE.

Diego v6 acompañante (privado, FAB Andrea):
  "Andre, esta cotización CMPC quedó en $8.2M. Tres datos
   que pensé que querrías saber:
   • Es la #2 más grande del mes para tu cuenta
   • Margen 18.4% — sobre tu promedio (15.1%)
   • Sebastián CMPC respondió en 6 horas, su tiempo
     habitual son 2-3 días

   No te diga nada Sebastián a fin de mes — esa rapidez
   es señal de que armaste la propuesta como les gusta.

   ¿Querés que avise al grupo o lo dejamos entre nosotros?"
```

**Ejemplo Reciclean — Cony termina F29 SERCOT**

```
Cony marca F29 mayo declarado.

Diego v6 acompañante:
  "Cony, F29 mayo cerrado 3 días antes que abril.
   Cierre puntual, sin observaciones SII pendientes.

   El último mes que pasó esto fue febrero. Bien hecho.
   ¿Querés que registre la marca para próximo mes
   apuntar al mismo ritmo?"
```

### 4.5 Antipatrones letales

- Emojis confeti 🎉🎊🎈 en mensajes laborales serios → cringe corporativo certificado.
- "¡Eres un crack!" / "¡Eres el mejor!" → genérico, baja motivación intrínseca.
- Celebrar trabajo fuera de horario ("¡Andrea respondiendo a las 23:00, qué compromiso!") → premia burnout. Prohibido.
- Comparaciones públicas ("Andrea cerró más que Pablo este mes") → genera ranking tóxico ([Madison PG — Recognition backfire](https://blog.madisonpg.com/is-your-employee-recognition-program-about-to-backfire)).

---

## 5. Detección de sobrecarga y sugerencia de descanso

### 5.1 La epidemia: datos 2025-2026

- **WHO** define burnout como síndrome de estrés laboral crónico no manejado, manifestado en agotamiento, cinismo y reducida eficacia ([PMC — Seeing burnout coming](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12689927/)).
- **Gallup 2025**: engagement global 21%, manager engagement cayó de 30% a 27%, mujeres reportan más burnout que hombres (gap se duplicó desde 2019).
- **WHO + Gallup**: mánagers son el driver. Si Dusan, Andrea (líder comercial) y Dyana (líder admin SERCOT) se queman, todo lo demás colapsa.
- Burnout en remoto (61%) e híbrido (57%) > presencial — Reciclean tiene equipo distribuido entre 3 ciudades, alto riesgo.

### 5.2 Señales detectables que el estado del arte usa

**Microsoft Viva Insights** monitorea:
- After-hours activity (emails/mensajes fuera de horario laboral declarado)
- Meeting overload (% del día en reuniones > umbral)
- Quiet hours violadas (focus time interrumpido)
- Falta de focus time (menos de 2h/día de bloque sin interrupciones)

Diego no tiene acceso a calendario Google Workspace todavía, pero **sí tiene señales propias**:

| Señal disponible para Diego | Cómo detectarla | Umbral propuesto |
|-----------------------------|-----------------|------------------|
| Mensajes fuera de horario | Timestamp mensaje vs horario declarado | >3 mensajes post-20:00 en una semana |
| Tareas overdue acumuladas | Tabla cola_construccion + agendar_compromiso | >5 tareas overdue activas |
| Ritmo conversacional | Mensajes por hora trending up | +50% vs baseline semanal |
| Sentiment negativo | Análisis LLM sobre últimos N mensajes | Persistencia >3 días |
| Falta de cierre tareas | Tareas tomadas vs cerradas en ventana 7d | <40% cierre |

### 5.3 La regla de oro: detectar ≠ intervenir

Detectar la sobrecarga es la parte fácil. El error 2024-2025 de muchas empresas fue *intervenir mal*: mandar push "parece que estás sobrecargada, tomate un descanso" en medio de una crisis = empeora todo.

**Patrón correcto (2026)**:
1. **Detectar en silencio.** Diego registra la señal internamente.
2. **Validar el patrón** (mínimo 3 días sostenidos, no un viernes mal).
3. **Reportar al CEO/líder primero, no al afectado.** Dusan se entera de que Andrea trabajó 4 sábados seguidos antes de que Diego le diga nada a Andrea.
4. **Si Dusan no actúa en 5 días**, Diego pregunta a la persona — *no* le dice qué hacer. "Andre, vi que esta semana respondiste hasta tarde varios días. ¿Tenés algo que destrabar o así está la cosa?"
5. **Nunca decir "descansá".** Sí decir "¿necesitás algo del equipo?".

### 5.4 Cómo se ve en Diego v6 acompañante

**Ejemplo Reciclean — Andrea trabajando sábados**

```
Diego detecta (silencioso):
  Sáb 11-may → 14 mensajes work-related, 09:00-19:00
  Sáb 18-may → 9 mensajes
  Sáb 25-may → 17 mensajes
  Tareas overdue: 7

Día 26-may 08:30, morning digest a Dusan:
  "Dusan, una observación: Andrea trabajó los últimos
   3 sábados. Tareas vencidas suben (5 → 7). ¿Querés
   que armemos prioridades con ella esta semana o
   prefieres hablarlo vos?"

Si Dusan no responde en 5 días hábiles → Diego pregunta a Andrea
en privado, sin diagnosticar, sin recomendar descanso:
  "Andre, una pregunta rápida: ¿esta semana tenés algún
   bloqueo que te esté empujando a quedarte hasta tarde?
   Si hay algo que el equipo pueda destrabar avisame."
```

**Ejemplo Reciclean — Dyana cierre mes intensivo**

```
Diego sabe que es la última semana del mes contable.
Detecta sobrecarga PERO el contexto la explica.

Acción: NO INTERVENIR. Solo silenciar notificaciones
no-críticas durante esa semana y, al cierre, reconocer:

"Dyana, F29 cerrado. Semana intensa — los próximos 3 días
quedan más livianos. Te bajo notificaciones de Diego a
mínimo (solo crítico) hasta el lunes. ¿OK?"
```

### 5.5 Riesgos a evitar

- **Surveillance perception.** Si Andrea siente que Diego "vigila", pierde confianza. Transparencia total sobre qué señales se monitorean + opt-out por usuario.
- **Diagnóstico médico.** Diego no puede decir "tenés burnout". Eso lo diagnostica un profesional.
- **Sesgo de género.** Gallup 2025 muestra que las mujeres reportan más burnout. Si Diego avisa a Dusan más sobre Andrea/Cony/Dyana que sobre Pablo/Reinaldo, refuerza estigma. Calibrar umbrales por baseline individual, no por norma del equipo.

---

## 6. Guía paso a paso para tareas complejas

### 6.1 El benchmark: cuándo desglosar vs cuándo responder directo

El consenso 2025-2026 en herramientas de onboarding y AI copilots es **progressive disclosure**: mostrar solo lo necesario en cada momento, abrir más capas si el usuario las pide ([Pendo — Onboarding, Progressive Disclosure, Memory](https://www.pendo.io/pendo-blog/onboarding-progressive-disclosure/), [Appcues — In-App Onboarding 2025](https://www.appcues.com/blog/in-app-onboarding)).

Glean Assistant (referencia enterprise 2026) desglosa tareas multi-paso en sub-tareas y delega a sub-agentes ("scouts") cuando necesita info adicional. Glean Assistant 3.0 funciona como end-to-end workflow partner, no asistente de respuestas ([Glean — Multi-step AI agents](https://www.glean.com/perspectives/7-key-benefits-of-multi-step-ai-agents-for-complex-tasks), [Glean — Multi-stage prompts](https://www.glean.com/perspectives/how-multi-stage-prompts-enhance-complex-workflows)). Devin (Cognition AI) y Cursor agent mode siguen el mismo patrón: planning explícito → ejecución paso a paso → checkpoints.

### 6.2 Heurística: cuándo desglosar

| Situación | Acción Diego |
|-----------|--------------|
| Pregunta cerrada con respuesta única (¿precio cobre Cerrillos?) | Respuesta directa, sin desglose |
| Tarea de 2-3 pasos conocidos por el usuario | Respuesta con bullets, sin walkthrough |
| Tarea nueva para esa persona (Cony con SQL) | Desglose paso a paso + opción de "ir más rápido" |
| Tarea ambigua / múltiples caminos | Pregunta 1 (clarificación) → luego decide |
| Tarea de alto riesgo (mover plata, firmar PR a prod) | Plan explícito → confirmación → ejecución por paso |

### 6.3 Patrón "Plan + Check + Execute"

Tomado de Cursor/Devin: para tareas complejas Diego primero **declara un plan**, espera OK del usuario, ejecuta paso por paso, reporta al final.

**Ejemplo Reciclean — Andrea quiere mandar cotización formal CMPC**

```
Andrea → Diego: "armame cotizacion formal CMPC para mañana,
                 son 24 ton fardo cartonado mezcla, despacho
                 desde maipu"

Diego v5 (actual): tira la cotización armada al toque.

Diego v6 acompañante (plan-first):
  "Andre, te armo. Plan:
   1. Calculo precio: 24t × precio CMPC vigente
   2. Calculo flete Maipú→Puente Alto
   3. Margen Reciclean estándar 18%
   4. Te genero PDF formal con OC tentativa

   ¿Voy con eso o agregás algo? (validez 7 días, hablamos
   con Sebastián como interlocutor anterior, formato standard CMPC)"

Andrea → "dale"

Diego ejecuta y reporta:
  "Listo:
   • Total: $X
   • Flete: $Y
   • Margen efectivo: 17.8%
   • PDF: [link]
   • Borrador WhatsApp para Sebastián: [link]

   ¿Lo firmás vos directo o querés que Dusan revise primero?"
```

### 6.4 Patrón "Salida de emergencia"

Crítico: en todo desglose paso a paso, ofrecer al usuario una **salida directa** ("tirá la respuesta ya"). Investigación Userpilot/Pendo muestra que los walkthroughs forzados son la principal causa de abandono de onboarding ([Userpilot — Pendo vs Userpilot](https://userpilot.com/blog/pendo-vs-userpilot/)).

**Plantilla**:
```
Diego: "Para que te quede bien la primera vez, lo hago en 4 pasos.
        Si querés solo el resultado, escribime 'directo'."
```

### 6.5 Antipatrones

- **Wall of text**: dar el desglose entero en un mensaje de 30 líneas. Mejor: paso 1, esperar OK, paso 2, etc.
- **Desglosar lo obvio**: explicarle a Andrea cómo armar una cotización que arma 20 por semana = condescendiente.
- **No mostrar progreso**: en tareas largas, Diego debe decir "vamos en paso 2 de 4" para reducir incertidumbre.

---

## 7. Aprendizaje del estilo de cada persona

### 7.1 El estado del arte 2026

Las cuatro grandes están en la misma trayectoria:

- **ChatGPT Memory** (OpenAI, 2025): extrae automáticamente rasgos y preferencias del usuario, los aplica en cada conversación futura. Mayo 2026 agregó "Memory sources" — visibilidad de qué memorias usó para personalizar cada respuesta ([Mindwired AI — Migrate ChatGPT memory to Claude](https://mindwiredai.com/2026/03/14/migrate-chatgpt-memory-to-claude/)).
- **Claude Memory** (Anthropic, 2025): memoria editable explícitamente desde Settings → Capabilities → Memory. Aprende job, proyectos, estilo de escritura, preferencias. Soporta import desde ChatGPT/Gemini/Copilot ([Find Articles — Claude one-click memory import](https://www.findarticles.com/claude-adds-one-click-memory-import-from-chatgpt/)).
- **Claude Projects**: workspaces persistentes con context propio, equivalente a Custom Instructions + Memory pero scoped por proyecto.
- **Gemini Personal Context** (Google, 2025): conecta a Gmail/Calendar/Drive para personalización con datos del usuario.

Research académico ICLR 2025 (PersonalLLM) y trabajos posteriores 2025-2026 muestran que la **personalización vía reward factorization** (PReF) extiende RLHF a preferencias per-user asumiendo estructura de baja dimensionalidad en el espacio de preferencias ([arXiv — Language Model Personalization via Reward Factorization](https://arxiv.org/pdf/2503.06358), [arXiv — PersonaMem v2](https://arxiv.org/pdf/2512.06688)).

### 7.2 Tres niveles de personalización aplicables a Diego

| Nivel | Qué guarda | Cómo se logra | Costo |
|-------|------------|---------------|-------|
| **L1 — Custom instructions estática** | Preferencias declaradas por el usuario | Bloque de texto en system prompt | Cero |
| **L2 — Memoria conversacional (RAG)** | Hechos extraídos de chats previos | Tabla `panel.diego_user_memory` + retrieval por usuario | Bajo |
| **L3 — Fine-tuning per-user (LoRA)** | Estilo de redacción aprendido | LoRA económico por usuario sobre gpt-4o-mini | Medio |

Para Diego v6, **L1 es alcanzable sin Pablo en 1-2 días** (ver §10). L2 requiere migración Pablo. L3 está fuera de alcance hasta 2027.

### 7.3 Qué debería aprender Diego de cada persona

| Dimensión | Andrea | Cony | Dyana | Dusan | Pablo |
|-----------|--------|------|-------|-------|-------|
| Saludo preferido | "Andre" | "Cony" | "Dyana" | "Dusan" | "Pablo" |
| Tono | Informal, voice notes OK | Formal-amigable | Formal | Directo, sin floreo | Técnico |
| Tolerancia interrupciones | Alta en mañana, baja en tarde | Baja última semana del mes | Baja en cierre tributario | Solo decisiones | Variable |
| Idioma técnico | Comercial (margen, OC, flete) | Contable (F29, IVA, retención) | Tributario (SII, F22, RAV) | CEO (decisión, riesgo, MM CLP) | DevOps (PR, EF, deploy) |
| Format preferido | Bullets cortos | Tabla | Tabla con totales | 3-5 líneas | Bloques código |
| Horario laboral declarado | L-V 08:00-19:00 (sáb on call) | L-V 09:00-18:00 | L-V 09:00-18:00 | sin límite formal (filtrar) | L-V flexible |
| Topics fuera de scope | — | nada SERCOT/Reciclean externo | nada que no sea contable | filtrar todo lo no-decisión | — |

### 7.4 Cómo se ve en Diego v6 acompañante

**Mismo mensaje, dos personas distintas:**

```
EVENTO: Cierre cotización CMPC $8.2M, margen 18.4%

A Andrea (informal, comercial, bullets):
  "Andre, cerraste CMPC en $8.2M con 18.4% de margen.
   Sobre tu promedio de cuenta. Bien jugado.
   ¿Sigo con la próxima o cortamos por hoy?"

A Dusan (CEO, 3-5 líneas, lead con decisión):
  "Dusan, Andrea cerró CMPC $8.2M (margen 18.4%, sobre promedio).
   Sin decisión necesaria. Aviso por si querés saludar a Sebastián
   CMPC, lleva 4 OCs este trimestre."

A Pablo (técnico, ningún tono comercial):
  No le manda nada. No es su scope.
```

### 7.5 La trampa: privacy + Ley 19628

Toda memoria per-user es **dato personal** bajo Ley 19628 Chile (vigente hoy, actualizada por Ley 21719 de diciembre 2024, plenamente en vigor diciembre 2026). Detalles en §8 ([Idónea — Ley protección datos personales Chile](https://idonea.cl/3181-2/), [IAPP — Entorno regulatorio Chile](https://iapp.org/news/a/el-nuevo-entorno-regulatorio-de-la-proteccion-de-datos-personales-en-chile)).

Diego debe:
1. **Informar** a cada usuario qué guarda sobre él en su memoria.
2. **Mostrarlo** (panel "lo que Diego sabe de mí").
3. **Editable + borrable** por el propio usuario.
4. **Auditable** — Dusan como CEO puede revisar, pero cualquier acceso queda logueado.

---

## 8. Privacidad, Ley 19628 y consentimiento

### 8.1 Marco legal Chile 2026

- **Ley 19628** (1999, vigente): protección de la vida privada y datos personales. Base.
- **Ley 21719** (diciembre 2024): modernización profunda, **vigor pleno 1 diciembre 2026**. Introduce derechos ARCO+ portabilidad, consentimiento granular, sanciones por infracción.
- **Proyecto IA Chile**: aprobado en Cámara de Diputados 13-oct-2025, en revisión Senado. Incluye principios de transparencia en contenido generado por IA, supervisión humana, prohibición de manipulación subliminal. Diego como "chatbot que responde a consultas sin impactar seguridad o derechos del usuario" cae en categoría de riesgo limitado, pero **debe declarar que es IA** ([IAPP — Continúa tramitación proyecto ley IA Chile](https://iapp.org/news/a/contin-a-la-tramitaci-n-del-proyecto-de-ley-sobre-ia-en-chile), [Alessandri — Bill regulating AI](https://alessandri.legal/en/bill-regulating-artificial-intelligence-introduced-to-congress/)).

### 8.2 Requisitos prácticos para Diego v6

1. **Banner inicial**: la primera vez que cada usuario abre el FAB, Diego declara "soy una IA. Guardo memoria de nuestras conversaciones para acompañarte mejor. ¿Acepto?" — con opt-out total disponible.
2. **Panel "mi memoria"**: cada usuario ve qué Diego sabe sobre él. Puede editar, borrar entradas individuales, o resetear todo.
3. **Logging de accesos**: si Dusan como CEO consulta la memoria de otra persona (auditoría), queda registrado y notificado al usuario.
4. **Retención**: memoria conversacional con TTL configurable (default: 12 meses).
5. **Datos sensibles**: Diego no debe almacenar salud, religión, política, orientación sexual — campos prohibidos por Ley 21719 sin consentimiento expreso.

### 8.3 Implicancia organizacional para Reciclean

Dusan firma como Responsable de Datos. Pablo opera técnicamente. Cony/Dyana saben qué está en el panel. Andrea/Reinaldo dan opt-in al usar Diego. No hace falta DPO (Delegado de Protección de Datos) — Reciclean no califica por volumen, pero conviene asignar el rol funcionalmente a Dyana o Cony.

---

## 9. Brechas vs Diego v6 actual

Las 10 brechas críticas, ordenadas por ratio (impacto / esfuerzo). Severidad: ALTA = impacto material en bienestar/productividad; MEDIA = mejora notable; BAJA = nice-to-have. Esfuerzo: H = horas; D = días; S = semanas (Pablo).

| # | Brecha | Severidad | Esfuerzo | Referencia |
|---|--------|-----------|----------|------------|
| 1 | Diego no adapta tono por rol — todos reciben mismo tratamiento | ALTA | 4-8 H (solo prompt + `panel.config_ui.diego_personas`) | §7 · [Khanmigo personalización 2025](https://www.myengineeringbuddy.com/blog/khanmigo-reviews-alternatives-pricing-offerings/) |
| 2 | NO existe morning digest 08:30 por persona — todas las notificaciones son reactivas | ALTA | 1-2 D (necesita cron job EF, Pablo) | §3 · [Viva Insights](https://learn.microsoft.com/en-us/viva/insights/introduction) |
| 3 | `agendar_compromiso` crea tareas pero NO avisa cuándo vencen | ALTA | 1 D (EF scheduler, Pablo) | §3 · [Reclaim 2026](https://reclaim.ai/blog/sunsama-vs-reclaim) |
| 4 | NO hay detección de sobrecarga (mensajes post-20:00, tareas overdue) | ALTA | 2-3 D (queries `curated.*`, Pablo) | §5 · [Gallup 2025](https://blog.haiilo.com/blog/gallup-state-of-global-workforce-report/) |
| 5 | Cero celebración de logros — cierre OC $8M no genera reconocimiento | MEDIA | 4-8 H (trigger en `curated.facturas_emitidas`, Pablo) | §4 · [15Five High Fives](https://www.15five.com/products/engage/high-fives) |
| 6 | NO hay método socrático ni postura de coaching — Diego salta a la respuesta | MEDIA | 4-8 H (solo prompt) | §2 · [AI Socratic Tutors](https://aicompetence.org/ai-socratic-tutors/) |
| 7 | NO hay "Plan + Check + Execute" para tareas complejas — se ejecuta sin confirmación | MEDIA | 4-8 H (solo prompt) | §6 · [Glean Multi-step agents](https://www.glean.com/perspectives/7-key-benefits-of-multi-step-ai-agents-for-complex-tasks) |
| 8 | NO existe panel "mi memoria" — usuario no ve ni edita lo que Diego sabe de él | ALTA | 3-5 D (UI nueva, Pablo) | §7-§8 · [Claude Memory editable](https://medium.com/@medialink1/claude-ais-new-memory-feature-a-game-changer-for-users-switching-from-chatgpt-and-gemini-8277fc59adaa) |
| 9 | Ley 19628 / 21719 — no hay banner de consentimiento ni declaración "soy IA" | ALTA (regulatorio) | 2-4 H (HTML + prompt) | §8 · [IAPP Chile](https://iapp.org/news/a/el-nuevo-entorno-regulatorio-de-la-proteccion-de-datos-personales-en-chile) |
| 10 | NO hay límites horarios por usuario — Diego puede escribir 23:00 domingo | MEDIA | 2-4 H (campo `horario_laboral` en `panel.config_ui`) | §3-§5 · [Viva quiet hours](https://learn.microsoft.com/en-us/viva/insights/introduction) |

### Resumen ejecutivo de brechas

- **4 brechas regulatorias o de bienestar (ALTA)**: 1, 2, 4, 8, 9 — atacarlas primero.
- **3 brechas de "humanidad conversacional" (MEDIA)**: 5, 6, 7 — golpe de imagen interna grande, esfuerzo bajo.
- **Patrón**: la mayoría del valor está en *prompt + un campo nuevo en `panel.config_ui`*. Pablo solo entra para las que requieren cron/EF/UI.

---

## 10. Implementable sin Pablo en 1-2 días

Top 5 quick-wins que **solo requieren editar `DIEGO-PROMPT-MAXIMO.md` y agregar campos a `panel.config_ui`** (Pablo NO interviene, Dusan firma):

### QW-1 · Personas Diego (1 día) — ataca brecha #1, #6

Crear en `panel.config_ui` la clave `diego.personas` con un JSON por usuario:

```
{
  "andrea_rivera": {
    "saludo": "Andre",
    "tono": "informal_comercial",
    "horario": "L-V 08:00-19:00",
    "topics_principales": ["cotizaciones","cobranzas","valorizadores"],
    "format_preferido": "bullets",
    "tolera_voice_notes": true
  },
  "dusan_arancibia": {
    "saludo": "Dusan",
    "tono": "ceo_directo",
    "horario": "filtrar_todo_no_decision",
    "format_preferido": "3-5_lineas_lead_con_decision"
  },
  ...
}
```

Diego lee este JSON al inicio de cada sesión, ajusta saludo + tono + formato. Sin código nuevo — solo prompt instruction y lookup.

### QW-2 · Postura GROW + Hersey-Blanchard (4-8 horas) — ataca brecha #6, #7

Agregar al system prompt sección "Postura conversacional":

> Antes de responder, evaluá:
> 1. ¿La persona ya sabe la respuesta y solo necesita confirmación? → respondé directo
> 2. ¿La persona está explorando opciones? → preguntá Goal/Reality/Options
> 3. ¿La tarea tiene >2 pasos no obvios? → declará plan primero, esperá OK
> 4. ¿La persona suena cansada/frustrada? → escuchá, no resuelvas

Diego v5 salta a respuesta. Diego v6 pregunta primero.

### QW-3 · Declaración IA + consentimiento (2-4 horas) — ataca brecha #9

Primer mensaje a cualquier usuario nuevo en el FAB:

> "Hola. Soy Diego, asistente del Grupo Reciclean-Farex-SERCOT. Soy una IA — guardo memoria de nuestras conversaciones para acompañarte mejor. Podés ver/editar/borrar lo que sé de vos en cualquier momento. ¿Empezamos?"

Cumple Ley 21719 + proyecto ley IA Chile. HTML + prompt, nada más.

### QW-4 · Horarios laborales + silencio (2-4 horas) — ataca brecha #10

Agregar en `panel.config_ui` campo `horario_laboral` por usuario. Diego no inicia conversaciones fuera de ese horario. Si el usuario le escribe a Diego fuera de horario, Diego responde — pero no proactiviza ni envía recordatorios.

```
Regla en prompt:
"Si hora_actual_Chile > horario_laboral[usuario]:
   - Si usuario inicia → respondé normal
   - Si Diego querría proactivar → POSPONER a próximo horario laboral"
```

### QW-5 · Celebración específica con permiso (4-8 horas) — ataca brecha #5

En el system prompt, cuando una tool retorna un evento materialmente positivo (OC > $5M, F29 cerrado, propuesta aprobada), Diego activa el patrón:

> Andre, [evento específico con número]. [Una línea de contexto comparativo].
> [Una línea sin floreo]. ¿Querés que avise al grupo o queda entre nosotros?

Sin emojis confeti. Sin "¡felicitaciones crack!". Específico + privado + opt-in publicación.

### Impacto agregado de los 5 quick-wins

- Cubre 5 de 10 brechas críticas.
- Cero código Pablo.
- 1-2 días Dusan + UX researcher.
- Cumplimiento regulatorio mínimo Ley 19628/21719.
- Salto perceptual L2 → L3 inmediato para los 6 usuarios principales.

---

## 11. Fuentes 2025-2026

### Coaching situacional y método socrático
- [Khanmigo Reviews, Alternatives, Pricing & Offerings in 2025 — My Engineering Buddy](https://www.myengineeringbuddy.com/blog/khanmigo-reviews-alternatives-pricing-offerings/)
- [AI Socratic Tutors: Teaching The World To Think — AI Competence](https://aicompetence.org/ai-socratic-tutors/)
- [Khanmigo (Khan Academy) — AI Agent Store](https://aiagentstore.ai/ai-agent/khanmigo-khan-academy)
- [Situational Leadership Model by Hersey and Blanchard — Toolshero](https://www.toolshero.com/leadership/situational-leadership-hersey-blanchard/)
- [The Effectiveness of AI Chatbots in Alleviating Mental Distress — JMIR 2025](https://www.jmir.org/2025/1/e79850)
- [New Doc on the Block: Scoping Review of AI Systems Delivering Motivational Interviewing — PMC 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12485255/)
- [Chatbot-Delivered Interventions for Improving Mental Health — PMC 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12261465/)

### Recordatorios inteligentes y notification fatigue
- [Motion vs Reclaim vs Clockwise vs Akiflow vs Sunsama: Which AI Calendar Wins in 2026 — Temporal](https://temporal.day/blog/motion-vs-reclaim-vs-clockwise-vs-akiflow-vs-sunsama)
- [Sunsama vs Reclaim.ai: feature-by-feature comparison for 2026 — Reclaim](https://reclaim.ai/blog/sunsama-vs-reclaim)
- [The State of Workplace Burnout in 2025: A Comprehensive Research Report — The Interview Guys](https://blog.theinterviewguys.com/workplace-burnout-in-2025-research-report/)
- [Alert fatigue solutions for DevOps teams in 2025 — incident.io](https://incident.io/blog/alert-fatigue-solutions-for-dev-ops-teams-in-2025-what-works)
- [Always on, always tired: why digital fatigue is an emerging OSH risk — IOSH 2025](https://www.ioshmagazine.com/2025/12/22/digital-fatigue-workplace)
- [Introduction to Viva Insights — Microsoft Learn](https://learn.microsoft.com/en-us/viva/insights/introduction)
- [AI Guide: Predict & Prevent Employee Burnout 2026 — Tech AI Mag](https://www.techaimag.com/ai-how-to/ai-predict-prevent-employee-burnout-2026-guide)

### Celebración de logros y behavioral economics
- [Duolingo Design Breakdown: How Gamification & UX Drives Retention — 925 Studios](https://www.925studios.co/blog/duolingo-design-breakdown)
- [Duolingo Case Study 2025: How Gamification Made Learning Addictive — Young Urban Project](https://www.youngurbanproject.com/duolingo-case-study/)
- [Duolingo gamification explained — StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)
- [Duolingo's Gamified Growth — The Product Brief Medium](https://medium.com/@productbrief/duolingos-gamified-growth-how-a-green-owl-turned-language-learning-into-a-14-billion-habit-d47d9fa30a77)
- [High Fives — 15Five](https://www.15five.com/products/engage/high-fives)
- [AI-Powered Manager Tools in Total Platform — 15Five Help](https://success.15five.com/hc/en-us/articles/24160398862491-AI-Powered-Manager-Tools-in-Total-Platform)
- [Employee Recognition Strategy: Common Mistakes to Avoid — Perceptyx](https://blog.perceptyx.com/the-downside-of-employee-recognition-when-good-intentions-go-awry)
- [Is Your Employee Recognition Program About to Backfire? — Madison PG](https://blog.madisonpg.com/is-your-employee-recognition-program-about-to-backfire)
- [Employers should think twice before implementing peer recognition programs — University of Waterloo](https://uwaterloo.ca/news/media/employers-should-think-twice-implementing-peer-recognition)

### Detección de sobrecarga y burnout
- [2025 Gallup State of the Global Workforce Report — Haiilo](https://blog.haiilo.com/blog/gallup-state-of-global-workforce-report/)
- [Navigating the Decline: Essential Strategies for Reviving Employee Engagement — Carey & Associates](https://capclaw.com/s6-ep-130-gallups-state-of-the-global-workplace-2025-report/)
- [Seeing burnout coming: early signs and recognition strategies in health professionals — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12689927/)
- [Microsoft Viva Insights: The Ultimate Guide — MS Cloud Explorers](https://mscloudexplorers.com/microsoft-viva-insights-guide/)
- [Wellbeing and Productivity Tools — Microsoft Viva Insights](https://www.microsoft.com/en-us/microsoft-viva/insights)
- [U.S. Work-Related Stress in 2025: Key Stats & Solutions — Wellhub](https://wellhub.com/en-us/blog/wellness-and-benefits-programs/work-related-stress-in-the-united-states/)

### Guía paso a paso y onboarding
- [Onboarding, Progressive Disclosure, Memory and Your Brain — Pendo](https://www.pendo.io/pendo-blog/onboarding-progressive-disclosure/)
- [Master In-App Onboarding: Key Steps & Strategies in 2025 — Appcues](https://www.appcues.com/blog/in-app-onboarding)
- [Pendo vs Userpilot — Userpilot](https://userpilot.com/blog/pendo-vs-userpilot/)
- [7 key benefits of multi-step AI agents for complex tasks — Glean](https://www.glean.com/perspectives/7-key-benefits-of-multi-step-ai-agents-for-complex-tasks)
- [How multi-stage prompts enhance complex workflows — Glean](https://www.glean.com/perspectives/how-multi-stage-prompts-enhance-complex-workflows)
- [Best AI copilot for the enterprise — Glean](https://www.glean.com/blog/best-ai-copilot-for-the-enterprise)
- [Glean Assistant 3.0 Turns AI Into an End-to-End Workflow Partner — The AI Economy](https://theaieconomy.substack.com/p/glean-assistant-3-agentic-ai-workflows)

### Personalización LLM y memoria
- [Language Model Personalization via Reward Factorization — arXiv 2503.06358](https://arxiv.org/pdf/2503.06358)
- [PersonalLLM (ICLR 2025)](https://proceedings.iclr.cc/paper_files/paper/2025/file/a730abbcd6cf4a371ca9545db5922442-Paper-Conference.pdf)
- [On the Way to LLM Personalization: Learning to Remember User Conversations — arXiv 2411.13405](https://arxiv.org/pdf/2411.13405)
- [PersonaMem-v2: Towards Personalized Intelligence — arXiv 2512.06688](https://arxiv.org/pdf/2512.06688)
- [AI Memory Features for Personalization — Pat McGuinness Substack](https://patmcguinness.substack.com/p/ai-memory-features-for-personalization)
- [How to Switch from ChatGPT to Claude Without Losing Your Context — MindStudio](https://www.mindstudio.ai/blog/switch-from-chatgpt-to-claude-migration-guide)
- [Claude Adds One-Click Memory Import From ChatGPT — Find Articles](https://www.findarticles.com/claude-adds-one-click-memory-import-from-chatgpt/)
- [How ChatGPT, Claude Code, and Gemini memory mechanisms differ — Knightli](https://www.knightli.com/en/2026/05/07/chatgpt-claude-code-gemini-memory-comparison/)

### Marcos teóricos: SDT, Skinner, GROW
- [Self-determination theory: A quarter century of human motivation research — APA](https://www.apa.org/research-practice/conduct-research/self-determination-theory)
- [Self-Determination Theory: All 6 Mini-Theories — Yu-kai Chou](https://yukaichou.com/gamification-analysis/self-determination-theory-guide-to-ryan-and-decis-motivation-framework/)
- [Research on generative AI learning behavior based on self-determination theory — Frontiers Psychology 2026](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1805498/full)
- [The human touch in AI: optimizing language learning through SDT and teacher scaffolding — Frontiers 2025](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1568239/full)

### Marco regulatorio Chile
- [Ley 19628 sobre Protección de la Vida Privada — BCN Chile](https://www.bcn.cl/leychile/navegar?idNorma=141599)
- [Ley sobre Protección de Datos Personales en Chile: Guía Actualizada — Idónea](https://idonea.cl/3181-2/)
- [Continúa la tramitación del Proyecto de Ley sobre IA en Chile — IAPP](https://iapp.org/news/a/contin-a-la-tramitaci-n-del-proyecto-de-ley-sobre-ia-en-chile)
- [El nuevo entorno regulatorio de la protección de datos personales en Chile — IAPP](https://iapp.org/news/a/el-nuevo-entorno-regulatorio-de-la-proteccion-de-datos-personales-en-chile)
- [Ley para regular la IA en Chile: ¿tu asistente virtual es legal? — TI Chile](https://www.tichile.cl/ley-ia-chile-asistente-virtual-legal/)
- [Bill Regulating Artificial Intelligence Introduced to Congress — Alessandri](https://alessandri.legal/en/bill-regulating-artificial-intelligence-introduced-to-congress/)
- [Cómo será la nueva ley de datos personales en Chile — WeLiveSecurity](https://www.welivesecurity.com/es/privacidad/nueva-ley-datos-personales-chile/)

---

**Fin documento** · 23-may-2026 · UX Researcher PC Dusan · Opus 4.7 1M context

**Próximo paso sugerido**: Dusan firma QW-3 (declaración IA + consentimiento) hoy mismo — cubre riesgo regulatorio con esfuerzo 2-4h. El resto entra en backlog mayordomo según prioridad CEO.
