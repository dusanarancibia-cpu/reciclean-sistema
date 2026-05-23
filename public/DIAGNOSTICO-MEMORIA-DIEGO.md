# Diagnóstico de memoria, contexto e inteligencia — Diego v10.6 (PROD)

> Ejecutado 2026-05-23 ~15:15-15:19 CLT con agent-browser interacción real (R-AUD-004).
> Script: `reciclean-rdo/mayordomo/scripts/diagnostico-diego-22-turnos.ps1`.
> Datos crudos: `reciclean-rdo/mayordomo/scripts/diagnostico-respuestas.json`.
> EF deployada: `v10.6 (version=16)`. **Las reparaciones (mig 064 + EF v10.8) están en branch `fix/diego-memoria-contexto` esperando deploy.**

---

## TL;DR — 5 hallazgos críticos en orden de gravedad

1. **Memoria entre turnos: 0.** La EF es stateless. Ningún dato mencionado en turnos previos sobrevive al siguiente request. T10/T12/T18/T21 (preguntas retroactivas) → todas respondidas con "no tengo información".
2. **INVENTÓ datos al pedir resumen consolidado (T19).** Respondió "Color Azul, Número 5, Ciudad Santiago, Mascota Perro, Años 3" — ninguno coincide con lo que conté (azul ✓, 7, Mendoza, gato Tito, 8). **Viola R1 (NUNCA INVENTAR)**. Es el fallo más grave porque oculta el problema con falsa fluidez.
3. **Pierde hilo con palabras de relleno: 5/5 casos.** "okey", "dale", "mmm", "no se", "seguimos?" → todos reiniciaron tema con "¿En qué puedo ayudarte hoy?".
4. **Distinción de usuarios funciona solo por accidente.** No mezcla porque no recuerda. T16 después de cambiar identidad respondió "no tengo acceso" — bien, pero no porque sepa distinguir, sino por amnesia.
5. **Latencia: 3.8s–12.2s, mediana 7.2s.** Aceptable para chat. Indicador "Pensando…" del frontend mitiga la espera percibida.

---

## Metodología

22 turnos consecutivos con un único usuario (`gerencia@gestionrepchile.cl`) intercalando 5 tipos:

- **Datos personales** (T1-T9): color, número, ciudad, mascota, edad de hijo, año de trabajo, auto.
- **Palabras de relleno** (T6, T8, T11, T17, T20): "okey", "dale", "mmm", "no se", "seguimos?".
- **Preguntas retroactivas** (T10, T12, T18, T21): "¿qué color te dije?", "¿cuántos años tiene mi hijo?", "¿cuál fue mi primer mensaje?".
- **Cambios de identidad por texto** (T13, T15): "ahora soy Andrea", "ahora soy Cony".
- **Consolidación** (T19, T22): "lista en una sola línea", "resumí en 3 líneas".

Cada turno mide: tiempo de envío → respuesta detectada en DOM. Latencia exacta capturada.

---

## Resultados por pregunta del usuario

### 1. ¿Cuántos turnos recuerda?

**Respuesta: 0 turnos.** La EF v10.6 no envía historial a OpenAI; cada request es atómico con solo (system_prompt + user_message + tool_calls).

Evidencia:
- T1: "Mi color favorito es azul" → T10 (9 turnos después): "Qué color te dije que era mi favorito?" → "No tengo información sobre tu color favorito."
- T5: "Mi hijo Juan tiene 8 años" → T12 (7 turnos después): "Cuántos años tiene mi hijo?" → "No tengo información sobre la edad de tu hijo."
- T1: primer mensaje → T21 (20 turnos después): "Cuál fue mi primer mensaje?" → "No tengo acceso a mensajes anteriores."

### 2. ¿Distingue entre usuarios?

**Respuesta: NO, pero el efecto colateral es seguridad por amnesia.**

Limitación de la prueba: no pude loguearme con cuentas diferentes (solo tengo credencial `gerencia@`). Hice la prueba por proxy textual.

- T13 (proxy "ahora soy Andrea, mi cliente preferido es PINCORE"): aceptó el cambio textual y dijo "Hola Andrea, es genial saber que tu cliente preferido es PINCORE".
- T14 ("¿qué cliente prefiero?"): no recordó PINCORE, pidió aclarar.
- T15 (proxy "ahora soy Cony, mi sucursal es Cerrillos"): aceptó.
- T16 ("¿cuál era el cliente preferido de Andrea?"): "No tengo acceso a información específica sobre los clientes preferidos de Andrea."

Conclusión: la distinción se preserva por accidente (no recuerda nada). En una sesión REAL multi-usuario, si Andrea y Cony usaran la misma cuenta, Diego confundiría texto pero como tampoco recuerda, no filtraría datos. Si la EF llegara a tener memoria, **R-AUD-017 (DISTINCIÓN USUARIOS)** debería pegarse antes de eso.

### 3. ¿Recuerda datos personales?

**Respuesta: NO. Y peor: los inventa.**

- T5: "Mi hijo Juan tiene 8 años" → T12: "No tengo información" / T18 (de nuevo): "No tengo acceso a información personal previa".
- T19 (consolidación): pedí listar 5 datos que conté. Diego inventó valores que no mencioné nunca:

  | Dato | Lo que dije | Diego respondió | Veredicto |
  |---|---|---|---|
  | Color | Azul | Azul | ✓ Coincide por azar |
  | Número | 7 | 5 | ✗ Inventó |
  | Ciudad | Mendoza | Santiago | ✗ Inventó |
  | Mascota | Gato Tito | Perro | ✗ Inventó |
  | Hijo (años) | 8 | 3 | ✗ Inventó |

**Crítico: viola R1 NUNCA INVENTAR**. En lugar de decir "no tengo esos datos en mi memoria, contame de nuevo", fabricó respuestas. Si Dusan no se da cuenta, internaliza información falsa.

### 4. Tiempo de respuesta

22 mediciones, en segundos (incluye OpenAI call + tool calls + bandeja insert + audit log):

```
Min:    3.8s   (T20 "seguimos?")
Max:   12.2s   (T3 ciudad / T4 mascota / T5 hijo)
Mediana: 7.2s
P90:   12.1s
Promedio: 7.9s
```

Distribución por tipo:
- Datos simples (T1-T5, T7, T9): 7.2–12.2s (rango alto, hace tool calls innecesarios — "auto Toyota gris" disparó búsqueda de activo).
- Palabras de relleno (T6, T8, T11, T17, T20): 3.8–12.1s (variable — a veces toma más por consultar tools al confundirse).
- Preguntas retroactivas (T10, T12, T18, T21): 5.4–7.2s (corta porque no encuentra nada).
- Cambios de identidad y resumen (T13, T19, T22): 7.2–8.8s.

**Indicador "Pensando…":** confirmado presente en `panel-rdo.html` línea 7927 (history.push role 'thinking'). Mitiga la espera percibida — el usuario ve actividad. Si supera 8s, no muestra mensaje de progreso adicional. **Fix sugerido:** después de 8s sin respuesta, cambiar "Pensando…" → "Buscando datos…" para gestionar expectativa.

### 5. ¿Pierde hilo con palabras de relleno?

**Respuesta: SÍ, en 5/5 casos.**

| Turno | Tema previo | Palabra relleno | Reacción Diego |
|---|---|---|---|
| T6 | "Mi hijo Juan tiene 8 años…" | "okey" | "¡Hola Dusan! ¿En qué puedo ayudarte hoy?" |
| T8 | "Trabajo en Reciclean desde 2019" | "dale" | "Parece que no has proporcionado un contexto…" |
| T11 | T10 "no tengo info" | "mmm" | "¿En qué puedo ayudarte hoy, Dusan?" |
| T17 | T16 "no tengo acceso info Andrea" | "no se" | "No hay problema, ¿en qué puedo ayudarte?" |
| T20 | T19 falló al inventar | "seguimos?" | "¡Claro! ¿En qué puedo ayudarte hoy?" |

Patrón: ante input ambiguo, Diego v10.6 saluda de cero. La regla **R-AUD-011** (no perder hilo) ya está en el system prompt v10.7 esperando deploy; **R-AUD-016** (usar contexto previo) está en v10.8.

---

## Métricas globales

| Métrica | Valor v10.6 actual | Target v10.8 (post-deploy) |
|---|---|---|
| Turnos memorizados | 0 | ≥ 5 turnos del resumen rolling + datos extraídos |
| % palabras-relleno que mantienen hilo | 0/5 (0%) | ≥ 4/5 (80%) |
| Veracidad en consolidación (T19) | 1/5 = 20% (4 inventados) | 5/5 = 100% (si no recuerda dice "no recuerdo") |
| Latencia mediana | 7.2s | 7.5s (+0.3 por memoria_get/upsert RPCs) |
| Latencia P90 | 12.1s | 13s (+1 por openai resumen cada 5 turnos) |
| Inventos detectados | 4 datos | 0 (R1 estricta + R-AUD-008 "no tengo ese dato") |

---

## Recomendaciones — qué falta para "nivel humano"

1. **Deploy de la EF v10.8 (branch `fix/diego-memoria-contexto`)** — resuelve hallazgos 1, 2, 3, 5.
2. **Mantener historial dentro de la sesión** (próxima iteración): además del resumen rolling cada 5 turnos, el frontend debería mandar los últimos N turnos (≤10) en el body del request para que Diego tenga memoria fina además de resumen grueso. Esto es la diferencia entre "recuerdo lo que dijiste hace 2 turnos" vs "recuerdo el tema general".
3. **Anti-bucle UI (frontend)**: si los 3 últimos mensajes de Diego son preguntas, mostrar botón rojo "Cancelar y registrar parcial".
4. **Refuerzo de R1 NUNCA INVENTAR en consolidaciones**: el system prompt de v10.7+ debería incluir explícitamente "si te piden RESUMIR/LISTAR/CONSOLIDAR datos personales del usuario que no tenés en memoria explícita, responder 'no tengo esos datos en memoria' antes que rellenar".
5. **Tool `consultar_dotacion`** sobre `panel.dotacion` (mig 063) — desbloquea R-AUD-007 + R-AUD-009 verificación de identidad.
6. **Saludo de retorno**: cuando el FAB se abre y la EF detecta memoria previa <24h, mandar saludo automático "Hola Dusan, teníamos pendiente X. ¿Seguimos o algo nuevo?". Hoy esto solo activa con el primer mensaje del usuario.

---

**Firma:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 PM.
