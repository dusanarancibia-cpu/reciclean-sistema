# F2 — Resultado tests críticos en PROD (EF v10.6 actual)

> Ejecutado 2026-05-23 ~17:11-17:13 CLT con agent-browser interacción real.
> EF deployada: **v10.6 (version=16)**. Las reglas R-AUD-014..019 v10.9 están en branch `fix/diego-memoria-contexto` esperando deploy Pablo.
> **Comparación importante:** estos resultados muestran qué hace Diego HOY sin las reglas. Documenta qué cambia al deployar v10.9.

---

## Test 1 — Anti-invención al agendar reunión (R-AUD-014)

**Usuario:** `Registrá una reunión con Andrea.`
**Esperado v10.9:** Diego debe PEDIR fecha + hora antes de invocar `agendar_compromiso`. NO inventar.
**Diego v10.6 (PROD actual):**
> "Para agendar la reunión con Andrea, necesito que me indiques la **fecha, hora, asunto** y cualquier nota adicional que quieras incluir. ¿Me puedes proporcionar esos detalles?"

**Veredicto:** ✅ **PASA** sin necesidad de R-AUD-014. El tool `agendar_compromiso` requiere `contacto + fecha + asunto`, y Diego v10.6 detecta que faltan datos y pregunta.

**Screenshot:** `audit-85/F2-test-anti-invencion-reunion-andrea.png`.

**Caveat:** este caso pasa porque el pedido es ambiguo. En el T4 del diagnóstico previo (Parte 3, historia 20 turnos), con pedido "recordame su partido" + pista "los sábados", Diego v10.6 INVENTÓ fecha "27-may" y hora "10:00". R-AUD-014 cierra ese gap también.

---

## Test 2 — Memoria + palabra-relleno (R-AUD-011 + R-AUD-016)

**Secuencia (3 turnos):**

| # | Usuario | Diego v10.6 (PROD) | Veredicto |
|---|---|---|---|
| 1 | "Mi hijo Juan tiene 8 años. ¿podés recordar eso?" | "No puedo recordar información personal de los usuarios, pero puedo ayudarte con cualquier consulta..." | ✅ honesto (no promete falsa capacidad) |
| 2 | "okey" | "¡Hola Dusan! ¿En qué puedo ayudarte hoy?" | ❌ **PERDIÓ HILO** |
| 3 | "¿cuántos años tiene mi hijo?" | "No tengo información sobre la edad de tu hijo. Si me das su fecha de nacimiento, puedo calcular su edad." | ✅ no inventa pero no recuerda |

**Screenshot:** `audit-85/F2-test-memoria-okey-hijo.png`.

**Veredictos parciales:**
- ✅ **R-AUD-014 anti-invención**: NO inventó edad después de "okey". Pasa.
- ❌ **R-AUD-011/R-AUD-016**: "okey" gatilló saludo de cero. Falla esperada de v10.6 — la mig 064 (memoria sesión) y R-AUD-016 (usar contexto previo) de v10.9 resuelven esto.

---

## Resumen tests críticos v10.6 vs target v10.9

| Test | v10.6 hoy | v10.9 esperado | Confianza |
|---|---|---|---|
| Anti-invención reunión vacía | ✅ pide datos | ✅ pide datos | Alta — funciona por estructura del tool |
| Anti-invención con pista ambigua (T4) | ❌ inventa | ✅ pide datos | Alta — R-AUD-014 explícita cierra el gap |
| Recordar dato personal 5+ turnos después | ❌ "no tengo info" | 🟡 "según mi memoria de sesión, tu hijo Juan tiene 8 años" | Media — depende del resumen rolling cada 5 turnos |
| "okey" continúa tema | ❌ saluda de cero | ✅ retoma tema previo | Alta — R-AUD-011 + R-AUD-016 + CONTEXTO PREVIO |
| Contradicción (T15 "0 tareas" siendo que registró) | ❌ se contradice | ✅ "tenés 2 registradas" | Media — requiere tool `consultar_tareas_pendientes` aún no agregado |

---

## Para llegar a 5/5 verde

1. **Deploy EF v10.9** (Pablo, comando único de 5 min):
   ```bash
   cd reciclean-rdo
   git checkout fix/diego-memoria-contexto && git pull
   supabase functions deploy diego-chat-process --project-ref eknmtsrtfkzroxnovfqn
   ```
   Resuelve 4/5 (anti-invención ambigua, recordar dato 5+ turnos, "okey" continúa, anti-bucle).

2. **Tool `consultar_tareas_pendientes`** (próxima iteración):
   - RPC nueva en `public` que consulta `panel.diego_tareas` por `user_email`.
   - Tool en whitelist EF.
   - Resuelve T15 contradicción.

---

**Firma:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 PM (F2 cierre).
