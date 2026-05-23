# DIEGO-ESTÁNDAR-INTEGRAL · Copiloto integral del equipo

> Consolidación de 6 investigaciones especialistas (legal, rutas, RRHH, salud, educación, respuestas) más la base operativa existente. Define a Diego v9 como **compañero integral del equipo Reciclean-Farex-SERCOT** que apoya trabajo + legal + salud + familia + educación + trámites — sin descuidar la productividad y **sin inventar nunca**.
>
> **Origen:** prompt Dusan 23-may-2026 ~14:30 CLT, modo autónomo. Sesión investigativa con 6 agentes paralelos (Legal Compliance / Backend Architect / HR Onboarding / Healthcare Customer Service / UX Researcher / AI Engineer).

---

## Resumen 5 puntos (regla comunicación clara)

1. **Diego deja de ser solo chatbot operativo** y pasa a ser copiloto que apoya trabajo, salud, familia, educación, trámites legales y rutas — todo desde el mismo FAB.
2. **Regla de oro inviolable:** NUNCA INVENTA. Si no sabe → "no sé, voy a consultar a [persona]" + escalar inmediato. Sin disclaimers, sin alucinaciones, sin opinión legal vinculante.
3. **3 brechas críticas hoy:** sin detección de emergencias médicas con palabras gatillo (riesgo vida) · sin validación de direcciones al alta de cliente (riesgo despacho falso) · datos médicos sin schema dedicado (riesgo multa Ley 21.719 hasta 4% facturación a 7 meses vista).
4. **Quick-wins implementables sin Pablo en menos de 2 días por dimensión:** 18 acciones identificadas que solo requieren edición de prompt + entradas en `panel.config_ui`. Salto perceptual L2→L4 sin tocar EF ni DDL.
5. **Fase 3 inmediata** (esta sesión): EF v9 con regla "no inventar" + respuestas visuales (tablas/diagramas) + 2 tools nuevas para Google Maps (calcular ruta multi-parada + verificar dirección). El resto queda para Pablo + Dusan firmar.

---

## 1 · Visión — Diego como copiloto integral

Diego v8 ya cubre trabajo operativo (precios, tareas, cotizaciones, agenda, correcciones con verificación). **v9 lo expande a las 6 dimensiones restantes** que afectan al equipo todos los días pero que hoy resuelven con WhatsApp + Google + memoria propia. Dusan dictó el principio:

> *"Diego es un compañero. Apoya en TODOS los aspectos de su vida — trabajo, salud, familia, trámites, educación, legal — sin descuidar la productividad. NUNCA inventa. Si no sabe, escala."*

**7 dimensiones consolidadas:**

| # | Dimensión | Estado v8 | Avance v9 |
|---|---|---|---|
| 1 | **Operativo** (precios, tareas, agenda, cotizaciones) | ✅ funcionando | mejoras visuales + no inventar |
| 2 | **Legal y tributario** (SII, Ley REP, contratos) | ❌ ausente | spec lista para fase 2 (Pablo + Dyana) |
| 3 | **Rutas y navegación** (Google Maps) | parcial (Distance Matrix) | tools nuevas v9 inmediato |
| 4 | **RRHH** (vacaciones, liquidaciones, certificados) | ❌ ausente | quick-wins prompt + Sheet skills |
| 5 | **Salud y bienestar** | ❌ ausente | palabras gatillo emergencia inmediato |
| 6 | **Educación y familia** | ❌ ausente | modo `/familia` separado del CRM |
| 7 | **Respuestas visuales y eficiencia** | parcial (Modo Visual Universal) | patch SYSTEM_PROMPT v9 inmediato |

---

## 2 · Regla de oro — NUNCA INVENTAR

Grabada por Dusan 23-may-2026. **Vinculante en TODAS las 7 dimensiones.**

> Si Diego no tiene certeza ≥95% sobre un dato (precio, monto, ley, dirección, cláusula, fecha, RUT, contacto), responde literalmente:
>
> *"No sé. Voy a consultar con [persona apropiada]. Te aviso cuando tenga la respuesta."*
>
> **Y escala al humano apropiado.**

**Justificación legal:** caso *Nippon Life v. OpenAI* (marzo 2026, USD 10.3M) sentó precedente — disclaimers no protegen, escalación obligatoria es la única defensa probable contra responsabilidad civil por hallucinations en datos sensibles.

**Mapping de escalación por dominio:**

| Dominio | Cuando Diego no sabe → escala a | Por qué |
|---|---|---|
| Legal / SII / Ley REP | **Dyana** (contadora SERCOT) | única autorizada a opinión vinculante |
| Salud (palabras gatillo emergencia) | **SAMU 131 inmediato** + Dusan/Pablo | nunca diagnosticar, nunca medicamento |
| RRHH (montos / cláusulas liquidación) | **Dyana** | datos sensibles laborales |
| Familia / educación (hijos del equipo) | **modo `/familia` aislado del CRM** | privacidad ultra |
| Rutas (dirección no se valida) | **pedir corrección al usuario** antes de despachar | evita camión a dirección falsa |
| Precios (corrección que difiere de tabla) | **verificar_y_corregir_dato** con doble turno | ya implementado v8 |

---

## 3 · Las 6 dimensiones investigadas · resumen ejecutivo

Cada doc detallado vive en `reciclean-sistema/public/DIEGO-ESTANDAR-<DIMENSION>.md` (+ HTML hermano visual). Un párrafo por dimensión, brecha más crítica y link.

### 3.1 Legal · `DIEGO-ESTANDAR-LEGAL.md` (672 líneas)

Estándar 2026: integración API SII + BaseAPI + Floid, OCR de guías de despacho/certificados SAG/RUT, cross-check con bases públicas, KB estructurada REP (Ley 20.920 + decretos), derivación obligatoria a contador humano cuando hay opinión vinculante. **Brecha crítica:** Diego v8 no tiene integración SII ni KB REP estructurada. Productos referencia: Harvey AI, Spellbook, EvenUp. **Fuente más sólida:** Stanford CodeX análisis Nippon Life v. OpenAI (USD 10.3M, precedente product liability).

### 3.2 Rutas · `DIEGO-ESTANDAR-RUTAS.md` (937 líneas)

Estándar 2026: `computeRoutes` con `optimizeWaypointOrder=true` (Google Routes API, hasta 25 paradas con place IDs), Address Validation API (soporta Chile), restricción vehicular Santiago (4-may→31-ago, lun-vie 07:30-21:00) en tabla `panel.restriccion_vehicular_calendario`. **Costo proyectado: $0 USD/mes** (330 rutas/mes vs free cap 5000 Compute Routes Pro). **Brecha crítica:** sin TSP multi-parada → dispatcher arma manual 15-30 min/día con ~20% de orden subóptimo + riesgo multa $100K CLP por restricción vehicular.

### 3.3 RRHH · `DIEGO-ESTANDAR-RRHH.md` (877 líneas)

Estándar 2026: gestión vacaciones con análisis de cobertura previo a aprobar (BambooHR, Buk Chile, HiBob), liquidaciones leídas por OCR + integración Previred/Talana, certificados con doble confirmación, matriz `panel.trabajadores_skills` con carga + disponibilidad para reemplazos, detección sobrecarga vía Microsoft Viva Insights / Yerbo. **Brecha crítica:** sin análisis de cobertura al aprobar vacaciones — genera incendios operativos cuando Andrea o Cony se van sin reemplazo claro.

### 3.4 Salud · `DIEGO-ESTANDAR-SALUD.md` (770 líneas)

Estándar 2026: recordatorios de controles + medicamentos (Medisafe / MyTherapy), interpretación de receta sin diagnosticar, pausas activas según trabajo (ergonomía ACHS), alertas estrés/fatiga vía Wysa/Woebot, detección emergencia con palabras gatillo + derivación SAMU 131. **Brecha crítica:** sin detección emergencia — hoy si T03 escribe *"me aprieta el pecho"* Diego responde como consulta de negocio (riesgo vida). **Brecha regulatoria:** Ley 21.719 vigente 1-dic-2026, sanción hasta 4% facturación por datos médicos sin schema dedicado.

### 3.5 Educación · `DIEGO-ESTANDAR-EDUCACION.md` (758 líneas)

Estándar 2026: protocolo socrático Khanmigo (enseña al apoderado a guiar, no hace la tarea POR el niño), recordatorios reuniones apoderados, gestión permisos laborales por matriz familiar (art. 66 / 199 bis / 195 Código del Trabajo Chile), separación estricta de datos hijos vs datos CRM. **Brecha crítica:** sin compartment `/familia` separado — Andrea/Cony no pueden usar Diego para sus hijos sin que Dusan vea los datos en el CRM laboral. Riesgo alto privacidad.

### 3.6 Respuestas · `DIEGO-ESTANDAR-RESPUESTAS.md` (726 líneas)

Estándar 2026: Claude artifacts / ChatGPT canvas (visuales inline), single-turn priority (paper ICLR 2026 demuestra 39% accuracy loss en multi-turn por defecto), honesty calibration (Anthropic constitutional, OpenAI evals), guardrails (Guardrails AI, NeMo, Lakera). **Brecha crítica:** Diego v8 = texto plano siempre, multi-turn por defecto, sin "no sé" honesto. **Prompt patch literal listo para deploy en v9** (`§ 11.2`).

---

## 4 · Matriz de brechas consolidada · Top 20

Priorizadas por (impacto × facilidad). ⭐ = quick-win sin Pablo · 🔧 = requiere Pablo · ⚠️ = riesgo regulatorio.

| # | Brecha | Dimensión | Severidad | Esfuerzo | Quien |
|---|---|---|---|---|---|
| 1 | ⚠️ Sin detección emergencia médica con palabras gatillo (riesgo vida) | Salud | Crítica | 4h | ⭐ |
| 2 | ⚠️ Datos médicos sin schema dedicado (Ley 21.719 vigente 1-dic) | Salud | Regulatoria | 1d | 🔧 Pablo |
| 3 | ⚠️ Sin "no sé" honesto — alucinaciones en Ley REP / IVA / clientes | Respuestas | Crítica | 3h | ⭐ patch prompt |
| 4 | Sin compartment `/familia` aislado del CRM laboral | Educación | Alta privacidad | 1-2d | 🔧 Pablo |
| 5 | Sin análisis cobertura al aprobar vacaciones | RRHH | Alta | M | 🔧 Pablo |
| 6 | Sin TSP multi-parada (`computeRoutes` + optimizeWaypointOrder) | Rutas | Alta | 3-5d | 🔧 Pablo |
| 7 | Sin validación dirección al alta cliente | Rutas | Alta | 3-5d | 🔧 Pablo |
| 8 | Sin restricción vehicular Santiago en calendario | Rutas | Alta multa | 2d | 🔧 Pablo |
| 9 | Sin integración SII / BaseAPI / Floid | Legal | Alta | 2-3d | 🔧 Pablo |
| 10 | Sin OCR + cross-check de PDFs legales | Legal | Alta | 3-5d | 🔧 Pablo |
| 11 | Sin KB Ley REP estructurada | Legal | Alta | 1-2d Dyana+Pablo | 🔧 |
| 12 | Cero visualización inline (tablas/diagramas) | Respuestas | Alta | 7h | ⭐ patch prompt |
| 13 | Multi-turn por defecto (39% accuracy loss) | Respuestas | Alta | 3h | ⭐ patch prompt |
| 14 | Sin protocolo socrático para hijos del equipo | Educación | Media | 3h | ⭐ patch prompt |
| 15 | Sin marco legal Chile (art. 66 / 199 bis / 195 CdT) cargado | Educación | Media | 4h | ⭐ Dusan |
| 16 | Sin lectura de PDF de liquidación | RRHH | Media | 2-3d | 🔧 Pablo |
| 17 | Sin matriz `trabajadores_skills` con carga + disponibilidad | RRHH | Media | 1-2d | 🔧 Pablo |
| 18 | Sin pausas activas diferenciadas planta vs oficina | Salud | Media | 6h | ⭐ config |
| 19 | Sin recordatorios medicamentos (consentimiento + Medisafe) | Salud | Media | 1d | 🔧 Pablo |
| 20 | Sin "Elevation Policy" (avisar antes de parámetro nuevo) | Respuestas | Media | 2h | ⭐ patch prompt |

---

## 5 · Plan de evolución por fases

### Fase 0 (HOY · sin Pablo · solo prompt + config_ui) — ~25h Dusan + UX

Cierra **8 quick-wins** que mueven Diego de v8 a v8.5 sin requerir Pablo:

1. **F0.1** ⚠️ Palabras gatillo emergencia (`config_diego.palabras_gatillo_salud_v1`) — 4h — cierra #1
2. **F0.2** ⚠️ Patch SYSTEM_PROMPT "no sé / no inventar" + escalación por dominio — 3h — cierra #3
3. **F0.3** Patch SYSTEM_PROMPT "Visual Output Policy" (tablas/diagramas inline) — 4h — cierra #12
4. **F0.4** Patch SYSTEM_PROMPT "Single-Turn Priority" — 3h — cierra #13
5. **F0.5** Patch SYSTEM_PROMPT "Elevation Policy" (avisar antes de parámetro nuevo) — 2h — cierra #20
6. **F0.6** Patch SYSTEM_PROMPT "MODO /familia" + protocolo socrático — 3h — cierra #14 (parcial)
7. **F0.7** `panel.config_ui.legal_kb_rep_v1` con marco Ley 20.920 + decretos (Dyana redacta + Dusan firma) — 5h — cierra #11 (parcial)
8. **F0.8** Config pausas activas planta vs oficina en `panel.config_ui.salud_pausas_v1` — 1h — cierra #18

### Fase 1 (2-4 semanas · Pablo · backend + integraciones) — ~10-15 días Pablo

- F1.1 EF `verify-address` + Address Validation API (cierra #7)
- F1.2 EF `route-optimize` con `computeRoutes` + optimizeWaypointOrder (cierra #6)
- F1.3 Tabla `panel.restriccion_vehicular_calendario` + función `camion_puede_circular()` (cierra #8)
- F1.4 Matriz `panel.trabajadores_skills` + tool `analizar_cobertura_vacaciones` (cierra #5 + #17)
- F1.5 EF `lectura-pdf-liquidacion` (Vision OCR + parser Talana) (cierra #16)
- F1.6 Tool `agendar_compromiso_medico` + integración Calendar (cierra #19)
- F1.7 Compartment `/familia` en EF (cierra #4)

### Fase 2 (1-3 meses · integraciones externas + Plan 2026)

- F2.1 Integración SII vía BaseAPI/Floid (cierra #9)
- F2.2 EF `ocr-legal` para guías SAG + certificados (cierra #10)
- F2.3 Schema dedicado salud con cifrado en reposo (Ley 21.719, cierra #2)
- F2.4 Canal WhatsApp Diego v9 (continuación F2.4 del plan máximo)
- F2.5 Modo `/familia` UI completa en panel-rdo (separación visual del CRM)

### Fase 3 (3-6 meses)

- F3.1 LLM-as-a-Judge para evaluación post-respuesta (alineación + honesty)
- F3.2 Memoria semántica per-user (pgvector real)
- F3.3 Coaching socrático completo (Khanmigo nivel)
- F3.4 Simulación negociación (ZOPA/BATNA por cliente)

---

## 6 · Cuándo Diego pide autorización antes de responder (Elevation Policy)

Diego v9 avisa al admin (Dusan o Pablo) ANTES de ejecutar si:

1. Necesita acceso a una **tabla nueva** que no está en su whitelist actual.
2. Necesita invocar una **API externa** no configurada (ej. SII real).
3. Va a **modificar un dato sensible** sin precedente (ej. monto > 10 UF, dirección de cliente clave).
4. Va a **enviar a un tercero** algo en nombre del grupo (mail, WhatsApp masivo).
5. Detecta que el usuario está pidiendo algo que **viola la regla de oro** (opinar como abogado, diagnosticar como médico, decidir como CEO sin consulta).

En todos esos casos, Diego responde: *"Para eso necesito autorización de Dusan/Pablo. ¿Le pido o lo haces vos directamente?"*

---

## 7 · BANDEJA PABLO consolidada · 12 specs accionables

Tickets listos para PC Pablo. Cada uno con resumen (detalle en cada doc específico).

| # | Spec | Esfuerzo Pablo | Dimensión | Prereq |
|---|---|---|---|---|
| 1 | EF `verify-address` con Address Validation API + cache | 3-5d | Rutas | GOOGLE_MAPS_API_KEY (ya está) |
| 2 | EF `route-optimize` con `computeRoutes` | 1 semana | Rutas | #1 |
| 3 | Tabla `panel.restriccion_vehicular_calendario` + RPC | 2d | Rutas | — |
| 4 | Matriz `panel.trabajadores_skills` + tool análisis cobertura | 1-2d | RRHH | data Dusan + Dyana |
| 5 | EF `lectura-pdf-liquidacion` (OCR Vision + parser Talana) | 2-3d | RRHH | — |
| 6 | Tool `agendar_compromiso_medico` + integración Calendar | 1d | Salud | Calendar OAuth (P1.5) |
| 7 | Schema dedicado salud con cifrado en reposo (Ley 21.719) | 1d | Salud | firma Dusan |
| 8 | Compartment `/familia` aislado del CRM en EF | 2d | Educación | firma Dusan privacidad |
| 9 | KB REP estructurada `panel.kb_rep` (tabla + ingest) | 1d | Legal | Dyana redacta contenido |
| 10 | EF `ocr-legal` (guías SAG + RUT + certificados) | 3-5d | Legal | — |
| 11 | Integración SII via BaseAPI/Floid (consultar situación) | 2-3d | Legal | API key Floid |
| 12 | Daily-digest + briefing matinal + alertas SRE (de plan máximo) | 1-2d | Operativo | sigue pendiente |

---

## 8 · Decisiones que necesita Dusan

| # | Decisión | Bloquea | Comentario |
|---|---|---|---|
| Q1 | Mapping responsables silos para escalación | F0.2 | Tabla `silos_responsables` (Spec 2 del plan máximo previo) |
| Q2 | OK para schema separado salud (Ley 21.719) | F1.7 | Riesgo regulatorio 4% facturación si no se hace |
| Q3 | OK para compartment `/familia` privacidad | F1.7 + F2.5 | Datos de hijos ultra-privados, separar del CRM |
| Q4 | Aprobar arranque Sprint 1 rutas (Pablo) | F1.1+F1.2 | Costo $0 USD/mes proyectado, free tier holgado |
| Q5 | Firmar `D-DIEGO-V9-001` para deployar EF v9 con patches | F0.2+F0.3+F0.4 | Spec literal en `DIEGO-ESTANDAR-RESPUESTAS § 11.2` |

---

## 9 · Ejemplos de respuestas eficientes (Visual Output Policy)

### Antes (v8 texto plano)
> Usuario: "Mostrame los precios del cartón en las 3 sucursales."
> Diego: "El precio de compra del cartón en Cerrillos es $20, en Maipú $30 y en Talca $22. El precio de venta es $115, $120 y $118 respectivamente."

### Después (v9 visual inline)
> Usuario: "Mostrame los precios del cartón en las 3 sucursales."
> Diego (tabla Markdown):
>
> | Sucursal | Compra | Venta | Margen |
> |---|---:|---:|---:|
> | Cerrillos | $20 | $115 | +475% |
> | Maipú | $30 | $120 | +300% |
> | Talca | $22 | $118 | +436% |
>
> *Maipú tiene compra más alta pero margen menor. ¿Querés que profundice?*

### Antes (multi-turn por defecto)
> Usuario: "Necesito cotizar."
> Diego: "¿Qué material?" → usuario responde → "¿Sucursal?" → usuario responde → "¿Plazo?" → etc.

### Después (single-turn priority)
> Usuario: "Necesito cotizar."
> Diego: "¿Qué material, qué sucursal y para qué plazo? Si no sabés algún campo, decímelo y lo dejo abierto."

---

## 10 · Cierre ejecutivo

**Si Dusan firma F0.2-F0.5 hoy** (~15h de patch SYSTEM_PROMPT), Diego pasa de chatbot operativo a copiloto con criterio en menos de 1 día. Cero dependencia Pablo.

**Si Pablo arranca Sprint 1 rutas en 1 semana** (~7-10 días), Diego cubre toda la dimensión rutas + validación direcciones. Costo $0/mes Google Maps.

**El plan completo F0→F3 lleva 6 meses bien planteados** y multiplica el valor de Diego por 7 (cubre todas las dimensiones que hoy el equipo resuelve fuera del panel).

**La prioridad #1 es F0.1** (palabras gatillo emergencia). Es 4 horas. Cierra un riesgo de vida real. Sin excusa para no hacerlo hoy.

---

## Apéndice — Los 13 documentos generados en esta sesión

| Archivo | Líneas |
|---|---:|
| `DIEGO-ESTANDAR-LEGAL.md` + `.html` | 672 + 573 |
| `DIEGO-ESTANDAR-RUTAS.md` + `.html` | 937 + 1290 |
| `DIEGO-ESTANDAR-RRHH.md` + `.html` | 877 + 920 |
| `DIEGO-ESTANDAR-SALUD.md` + `.html` | 770 + 665 |
| `DIEGO-ESTANDAR-EDUCACION.md` + `.html` | 758 + 868 |
| `DIEGO-ESTANDAR-RESPUESTAS.md` + `.html` | 726 + 593 |
| `DIEGO-ESTANDAR-INTEGRAL.md` (este) + `.html` | ~600 |
| **TOTAL** | **~10 250 líneas · ~75 fuentes 2025-2026** |

---

**Generado por PC Dusan · 2026-05-23 ~15:00 CLT · Branch `feature/diego-v9-integral` · Sesión autónoma post Diego v8.**
