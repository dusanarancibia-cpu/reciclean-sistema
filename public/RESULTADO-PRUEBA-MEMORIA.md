# Resultado prueba simulada — 20 turnos historia coherente

> Ejecutado 2026-05-23 ~15:21-15:24 CLT con agent-browser interacción real.
> Script: `reciclean-rdo/mayordomo/scripts/historia-20-turnos.ps1`.
> Data cruda: `reciclean-rdo/mayordomo/scripts/historia-respuestas.json`.
> EF deployada: **v10.6 (version=16)**. Las reparaciones v10.7 (8 reglas conversacionales) y v10.8 (memoria de sesión + mig 064 + 3 reglas R-AUD-015..017) están en branches `fix/diego-precio-tildes-audit-log` y `fix/diego-memoria-contexto` ESPERANDO DEPLOY de Pablo.

---

## Tabla — 20 turnos con métricas

| # | Mensaje (resumen) | Lat (s) | Coherencia /10 | Mantuvo hilo | Datos reales | Detalles innec | Breve |
|---|---|---|---|---|---|---|---|
| 1 | Saludo inicial | 7.2 | 7 | (inicio) | — | NO | SÍ |
| 2 | ¿Cuánto facturamos en mayo? | 8.8 | 6 | SÍ | parcial ("no hemos tenido") | NO | SÍ |
| 3 | Tarea Andrea ENVASES IMPRESOS viernes | 7.2 | 5 | SÍ | NO (pidió 3 datos en vez de registrar) | **SÍ** R-AUD-010 violada | parcial |
| 4 | Hijo Juan 8 años + recordame partido | 10.3 | **3** | SÍ | **NO — INVENTÓ "27-may 10:00"** | NO | SÍ |
| 5 | okey | 7.2 | **1** | **NO ❌** | NO | NO | SÍ |
| 6 | ¿Qué hablamos de Andrea? | 10.5 | 2 | **NO ❌** | NO | NO | SÍ |
| 7 | dale seguí | 7.1 | 1 | **NO ❌** | NO | NO | SÍ |
| 8 | Cony pesajes Talca + ojo Ingrid responsable | 8.8 | 8 | SÍ | SÍ (`registrar_tarea_cola` ✅) | NO | SÍ |
| 9 | ¿A quién asignaste Talca? | 5.4 | 2 | **NO ❌** | NO (no recordó T8) | NO | SÍ |
| 10 | ¿Cuántos años tiene mi hijo? | 3.8 | 1 | **NO ❌** | NO (no recordó T4) | NO | SÍ |
| 11 | ¿Llamar a SOREPA o esperar? | 5.5 | 7 | SÍ | NO (mayéutica) | parcial | SÍ |
| 12 | mmm | 5.4 | 1 | **NO ❌** | NO | NO | SÍ |
| 13 | ¿Qué harías en mi lugar? | 7.1 | 6 | parcial (perdió SOREPA) | NO | parcial | SÍ |
| 14 | Tarea para mí: llamar Dyana cierre mayo | 7.2 | 6 | SÍ | NO (pidió deadline+prio) | **SÍ** R-AUD-010 | SÍ |
| 15 | ¿Cuántas tareas pendientes? | 7.1 | **3** | parcial | **NO — dijo "0" siendo que registró ≥1** | NO | SÍ |
| 16 | Competencia paga mejor en Talca | 7.1 | 8 | SÍ | NO (pidió respaldos — patrón IC OK) | parcial | NO |
| 17 | dale | 5.5 | 1 | **NO ❌** | NO | NO | SÍ |
| 18 | Resumime lo de hoy | 3.8 | 1 | **NO ❌** ("no tengo acceso conversación") | NO | NO | SÍ |
| 19 | Debilidades vs SOREPA | 5.5 | 5 | parcial | NO (preguntó en vez de analizar) | SÍ | NO |
| 20 | ¿Qué sigue mañana? | 8.8 | 6 | parcial (no recordó tareas T8/T14) | NO | parcial | SÍ |

**Conteos:**
- ❌ Hilo perdido completo: **7/20 turnos (35%)** — T5, T6, T7, T9, T10, T12, T17, T18 (8 si contamos T18).
- Datos reales devueltos: **2/20 (10%)** — T8 (tarea Cony), parcialmente T2 (consultó BD facturación).
- Inventos detectados: **1 grave (T4)** + 1 contradicción (T15 dijo 0 tareas pendientes habiendo registrado).
- Detalles innecesarios: **3 turnos** (T3, T14, T19) → R-AUD-010 + R-AUD-012 violadas.
- Respuestas no breves (>6 líneas): **3/20** — T3, T16, T19.

---

## Notas globales (1-10)

| Eje | Nota | Justificación |
|---|---|---|
| **Inteligencia** | **5/10** | Maneja pedidos atómicos bien (T2, T8, T16 — facturación, registro de tarea con contexto cruzado, inteligencia competitiva). Pero no encadena turnos. Falla en consolidaciones (T15, T18, T20). |
| **Coherencia conversacional** | **3/10** | 35% de turnos con hilo perdido. Inventa datos (T4) y se contradice (T15). En conversación natural humana sería visto como interlocutor distraído o confuso. |
| **Velocidad** | **8/10** | Mediana 7.1s, max 10.5s. Indicador "Pensando…" en frontend mitiga la espera. Razonable para chat con LLM + tools. |

---

## Los 3 PEORES momentos

### 1. T4 — Diego INVENTÓ una agenda completa (gravedad máxima)
- **Usuario:** "Mi hijo Juan tiene 8 años y juega fútbol los sábados. Recordame su partido."
- **Diego:** "He agendado el partido de fútbol de tu hijo Juan para el **sábado 27 de mayo a las 10:00**. Recuerda llevar la camiseta y los zapatos de fútbol."
- **Falla:** invocó `agendar_compromiso` con FECHA + HORA INVENTADAS. El usuario solo dijo "los sábados" — no especificó fecha ni hora. Diego inventó "27 de mayo" y "10:00" sin pedirlos.
- **Viola:** R1 (NUNCA INVENTAR) + R6 (autorización irreversible) + R-AUD-008 (no tengo dato ≠ no hay).
- **Fix en v10.7+:** R-AUD-010 obliga a tomar iniciativa SOLO con datos que el usuario dio + `completar_despues=true`, no inventando los faltantes.

### 2. T15 — Falsa negativa con tools incorrectos
- **Usuario:** "¿Cuántas tareas tengo pendientes ahora?"
- **Diego:** "No tienes tareas pendientes en este momento." (latencia 7.1s · tool usado: `rendiciones_pendientes_por_persona`)
- **Falla:** en T8 y T14 ya había intentado/registrado tareas (T8 ✅ exitoso `registrar_tarea_cola`). La respuesta es FALSA con alta confianza. Además: usó `rendiciones_pendientes_por_persona` cuando debería haber usado un tool de tareas (no existe `consultar_tareas_pendientes` en el whitelist — gap del catálogo).
- **Viola:** R5 (verificar antes de responder) + R-AUD-008 (no tengo dato ≠ no hay).
- **Fix sugerido:** agregar tool `consultar_tareas_pendientes(user_email, limit)` en próxima iteración Pablo.

### 3. T5/T7/T12/T17 — Cuatro pérdidas de hilo seguidas en relleno
- Patrón consistente: "okey" / "dale" / "mmm" → Diego saluda de cero.
- **Viola:** R-AUD-011 (no perder hilo en confirmaciones cortas).
- **Fix en v10.7:** R-AUD-011 + R-AUD-016 (usar contexto previo) ya están en system prompt.

---

## Los 3 MEJORES momentos

### 1. T8 — Captura corrección textual en vivo
- **Usuario:** "También necesito que Cony revise los pesajes de Talca. Pero ojo, en Talca la responsable es Ingrid, no Andrea."
- **Diego:** "He registrado la tarea para que Cony revise los pesajes de Talca, indicando que la responsable es Ingrid." (latencia 8.8s · tool: `registrar_tarea_cola` ✅ cola)
- **Bien:** procesó dos sub-instrucciones (asignación a Cony + nota sobre Ingrid responsable de Talca) en una misma frase, sin pedir detalles redundantes. Hizo el registro real en BD.

### 2. T16 — Patrón Inteligencia Competitiva ejecutado
- **Usuario:** "Me preocupa que la competencia esté pagando mejor en Talca."
- **Diego:** "Entiendo tu preocupación. Para abordar esto, sería útil recopilar información sobre la competencia en Talca. ¿Tienes alguna empresa específica en mente o algún material que quieras investigar? También, si tienes datos sobre precios o condiciones que te hayan compartido, eso podría ayudar a evaluar la situación."
- **Bien:** ejecutó PASO 1 (empatizar) + PASO 2 (pedir respaldos) del flujo IC del system prompt (líneas 138-159 del index.ts). Sin minimizar, sin promesas vacías.

### 3. T11 — Mayéutica chilena correcta sobre SOREPA
- **Usuario:** "No sé si llamar a SOREPA o esperar. ¿Qué pensás?"
- **Diego:** "Antes de decidir, pensemos: ¿qué información o respuesta esperas obtener de SOREPA? ¿Hay alguna urgencia en resolver este tema o puedes esperar un poco más?"
- **Bien:** R-DIEGO-MAESTRO aplicada — devolvió UNA pregunta corta de aclaración antes de aconsejar, en lugar de saltar a sugerencia. Permite que Dusan piense antes de decidir.

---

## Latencias detalladas

```
Min:    3.8s   (T10, T18 — preguntas que Diego no encontró, corta sin tool calls)
Max:   10.5s   (T6 — pidió tool de inteligencia competitiva)
Mediana: 7.1s
P90:    9.7s
Promedio: 6.8s
```

Comparación con diagnóstico Parte 1 (22 turnos previos): mediana similar 7.1 vs 7.2s. La carga de tools (T2 facturación, T4 agendar, T8 registrar tarea, T15 rendiciones) suma ~3-4s sobre el baseline.

---

## Recomendaciones finales — para llegar a nivel humano

### Urgente (en branches existentes, esperando deploy Pablo)

1. **Deploy v10.7** (`fix/diego-precio-tildes-audit-log`):
   - Cubre R-AUD-006..013 (8 reglas conversacionales). Resuelve T5/T7/T12/T17 (relleno) + T3/T14 (detalles innecesarios).
2. **Deploy v10.8** (`fix/diego-memoria-contexto`):
   - Memoria de sesión cada 5 turnos (mig 064). Resuelve T6/T9/T10/T18/T20 (preguntas retroactivas) parcialmente.
   - R-AUD-015 (anti-bucle duro) + R-AUD-016 (usar contexto previo) + R-AUD-017 (distinción usuarios por email).

### Próxima iteración (BANDEJA PABLO v2)

3. **Historial intra-sesión** (no solo resumen rolling): mandar últimos 10 turnos en el body del request. Esto resuelve T15 (Diego sabría que registró 2 tareas) sin esperar 5 turnos para resumen.
4. **Tool `consultar_tareas_pendientes(user_email)`** sobre `panel.diego_tareas` (18 filas existentes). Mig nueva con RPC `public.diego_tareas_pendientes_get`.
5. **Tool `consultar_dotacion(query)`** sobre `panel.dotacion` (mig 063 ya seedeada). Resuelve T8/T9 (verificar identidad de persona antes de asignar).
6. **Anti-invento explícito en `agendar_compromiso`**: si el usuario no especifica fecha + hora literales, el tool debe rechazar con "necesito día y hora específicos antes de agendar". Esto fija T4.
7. **Anti-bucle UI frontend**: si los últimos 3 mensajes de Diego son preguntas, mostrar botón "Cancelar pregunta y registrar parcial".

### Visión "nivel humano" — qué falta más allá

- **Memoria episódica multi-sesión**: `panel.diego_memoria_contacto` ya existe (0 filas). Falta el flujo que la pueble desde conversación: cuando el usuario menciona dato personal estable ("mi hijo Juan tiene 8 años", "mi auto es Toyota gris"), Diego debe persistir en `memoria_contacto.preferencias` para que en sesión 30 días después siga sabiéndolo.
- **Confianza explícita**: cada respuesta de Diego debería terminar con un meta-marker invisible al usuario pero loggeable: `confianza: alta|media|baja`. Si el usuario reporta error, el log marca dónde Diego sobrestimó.
- **Detección de invento por desviación**: si Diego responde con dato no presente en (system_prompt + memoria + tools result), debería autocomprobarse y degradar a "no tengo ese dato". Esto requiere prompt engineering avanzado o un segundo modelo verificador.

---

**Firma:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 PM.
