# Diego — Listado Completo de Capacidades

> **Para:** equipo Reciclean-Farex (Andrea, Cony, Dyana, Dusan, Pablo y toda persona nueva).
> **Versión:** Diego v10.2 — D-DIEGO-CAPS-001 · Firmado por Dusan 2026-05-23.
> **Lenguaje:** simple. Una línea por ítem.

---

## Resumen en 5 puntos

1. Diego es el asistente del grupo dentro del panel. Vive como burbuja verde abajo a la derecha (FAB).
2. Sabe responder, registrar, buscar, alertar y derivar. No decide solo — siempre pide autorización para cosas grandes.
3. 14 áreas cubiertas hoy. Algunas funcionan al 100%, otras esperan algo de Dusan o Pablo (ver "LO QUE FALTA").
4. Si Diego no sabe, te dice "no sé" y deriva al humano correcto. **Nunca inventa.**
5. Cada acción importante queda anotada (cola de tareas, bandeja, audit log). Nada se pierde.

---

## 1. CHAT Y COMUNICACIÓN

1. **FAB flotante.** Burbuja verde abajo a la derecha del panel. Se abre con un click.
2. **Responder en texto.** Le hablás como por WhatsApp. Te contesta en español, claro y corto.
3. **Adjuntar archivos.** Arrastrás o pegás fotos, audios, PDFs, texto. Diego los lee.
4. **Procesar voz.** Audio → texto vía Whisper. Te entiende aunque tengas ruido.
5. **Procesar imagen.** Foto de boleta, RDO, factura → extrae los datos con GPT-4o Vision.
6. **Redactar borradores.** Mensajes para clientes, mails, notas — Diego los escribe, vos los firmás.
7. **Derivar mensajes.** Si excede su competencia, te dice a quién pasarle el tema.

---

## 2. TAREAS Y AGENDA

1. **Crear tareas.** Diego registra pendientes con título, descripción, responsable, fecha tope, prioridad.
2. **Asignar.** Andrea, Cony, Dyana, Pablo, Dusan — Diego respeta el silo correcto.
3. **Clasificar con 6W.** Cada tarea trae QUÉ / QUIÉN / DÓNDE / CUÁNDO / POR QUÉ / CÓMO.
4. **Bloqueo si faltan datos.** Si no tiene los 4 campos críticos, no crea — pregunta primero.
5. **Agenda diaria.** Ya hay sección "Tu agenda" en la Portada que muestra tus tareas del día.
6. **Alertas.** Tareas vencidas + tareas que vencen en 24h aparecen en color rojo y ámbar.
7. **Reorganizar.** Diego puede mover tareas, cambiar prioridad, reasignar (pero pide OK primero).

---

## 3. PRECIOS Y COTIZACIONES

1. **Consultar precio.** "¿A cuánto está el cartón en Maipú?" → Diego mira la vista vigente y te dice compra y venta.
2. **Cotizador `f_evaluar_retiro v6`.** Con material + sucursal + volumen, te arma cotización.
3. **Verificar márgenes.** Diego marca alerta si una venta queda fuera de tarifa.
4. **Comparar sucursales.** Tabla Cerrillos vs Maipú vs Talca por material.
5. **Pto Montt bloqueado.** Diego nunca cotiza para Pto Montt — está bloqueada por SEREMI.

---

## 4. CLIENTES Y CRM

1. **Buscar.** Por nombre, RUT, alias o contacto en CRM Impulsa (1971 clientes).
2. **Ficha 360°.** Click derecho en cualquier cliente → contexto completo (E360).
3. **Investigar nuevos.** Diego puede buscar empresas en SII (cuando Dusan provea credenciales).
4. **Detectar inactivos.** Hay alerta de "1859 clientes sin categoría" que Diego puede aterrizar como tarea.

---

## 5. RUTAS Y LOGÍSTICA

1. **Ruta más eficiente** entre dirección del cliente y nuestras sucursales.
2. **Verificar dirección** — comprobar que existe + corregir formato.
3. **Restricciones de tránsito** — camiones grandes con restricciones de horario y zona.
4. **Leyes de tránsito Chile** — Diego conoce Ley 18.290 a nivel general.

> **Bloqueado**: requiere `GOOGLE_MAPS_API_KEY` que tiene que crear Dusan en Google Cloud.

---

## 6. CONTROL DE ACTIVOS

1. **Inventario completo.** Camiones, prensas, herramientas, equipos, contenedores. 12 ítems hoy.
2. **Buscar por patente, tipo, ubicación, estado.** "¿Dónde está KXLP-22?" → "Cerrillos, operativo".
3. **Mantenciones vencidas.** Diego avisa cuando una máquina necesita servicio.
4. **Alertas próximas.** Si vence en 15 días o menos, aparece en ámbar.
5. **Actualizar ubicación.** Manual hoy (sin GPS). Diego pide confirmación antes de modificar.

---

## 7. CONTROL DE CONDUCTORES

1. **Listado completo.** Pedro Rojas, Luis Soto, Marco Díaz, Andrea, Cony — con licencia clase y vencimiento.
2. **Licencias vencidas.** Diego alerta si alguien no puede conducir legalmente.
3. **Autorizaciones.** Qué vehículos puede manejar cada uno (camión 3.5t, pesado, camioneta, auto).
4. **Restricciones.** Ej: "Lentes obligatorios" o restricciones médicas.
5. **Riesgo legal.** Si conducís con licencia vencida → Ley 18.290 + Ley 16.744 si accidente. Diego no lo permite.

---

## 8. RENDICIONES DE DINERO

1. **Registrar rendición.** Persona, monto, motivo, sucursal, fecha. Una línea.
2. **Recibir factura.** Subís foto → Diego extrae el monto (Vision) y la engancha a la rendición.
3. **Calzar automático.** Si la factura coincide → "calzado". Si es menor → "rendido_parcial".
4. **Alertar pendientes.** "¿Cuánto tiene pendiente Andrea?" → tabla con monto y días.
5. **Vencidos.** Rendiciones de más de 30 días sin cerrar → Diego deriva a Dyana para cobranza interna.

---

## 9. INTELIGENCIA COMPETITIVA

1. **Escuchar alertas.** Cuando el equipo dice "la competencia paga más", Diego no minimiza.
2. **Empatizar primero.** "Entiendo, eso es importante. Vamos a revisarlo."
3. **Pedir respaldos.** Factura, guía, foto camión, boleta — sin documento no se mueve precio.
4. **Investigar.** Diego sugiere llamar simulando ser proveedor, comparar sucursales, buscar en SII.
5. **Armar ficha.** `panel.inteligencia_competitiva` con empresa, RUT, zona, material, precio, fuente, estado.
6. **Escalar a Dusan.** Con respaldo, crea tarea prioridad alta para gerencia.
7. **Nuevo competidor.** Pregunta razón social → zona → material → precio → fuente en orden.

---

## 10. RRHH Y PERSONAS

1. **Vacaciones, liquidaciones, certificados.** Diego deriva 100% a Dyana / SERCOT (R4 absoluta).
2. **Salud.** Si alguien describe accidente o emergencia: Diego sugiere 131 + parte ACHS/IST.
3. **EPP por área.** Diego conoce el listado del DS 594 (casco, lentes, guantes, calzado, chaleco).
4. **Riesgo laboral.** Reportes de prensas, báscula, polvo, ruido → cola alta + alerta Dyana.

---

## 11. LEGAL Y NORMATIVA

1. **Ley REP.** Diego conoce las obligaciones del GESTOR (Reciclean) y del VALORIZADOR.
2. **SII.** Diego puede sugerir consultas, pero Dusan debe autorizar credenciales.
3. **Cotejar documentos.** Si subís factura/guía, Diego cruza con lo registrado y marca diferencias.
4. **Prevención.** Ley 16.744 + DS 594 a nivel general. Caso específico → Dyana siempre.

---

## 12. FAMILIA Y BIENESTAR

1. **Tareas escolares de los hijos.** Diego puede registrar como recordatorios personales (silo 11 — Temas Personales).
2. **Apoderados / reuniones colegio.** Idem — agenda + alerta el día anterior.
3. **Pausas y fatiga.** Diego no decide por el equipo, pero puede sugerir descanso si detecta picos de horas.
4. **Recordatorios de salud.** Médicos, vencimientos de certificados — Diego agenda y avisa.

---

## 13. SEGURIDAD Y REGLAS — IDENTIDAD BLINDADA

Las 8 reglas absolutas (no negociables) que cargan el sistema de Diego:

1. **R1 No inventar.** Mejor decir "no sé" que mentir.
2. **R2 No sindicatos / no contra dueños.** Si te lo pregunta, deriva a Dusan.
3. **R3 No tocar código sin Pablo.** Diagnostica, pero no ejecuta fixes sin OK.
4. **R4 No info legal sin consultar normativa.** Legal laboral → Dyana / SERCOT.
5. **R5 Verificar Supabase antes de cifras.** Sin datos, no responde con números.
6. **R6 Pedir autorización antes de irreversibles.** Modificar precios, dar de baja activos, mandar mails.
7. **R7 Responder con tablas o gráficos cuando aplica.** Modo Visual Universal.
8. **R8 Derivar al humano correcto.** Salud → 131. Legal → Dyana. Panel → Pablo. Compras → Dusan.

---

## 14. MONITOREO Y SALUD

1. **Smoke test diario 8:30 CLT.** Diego se prueba a sí mismo con 3 preguntas conocidas.
2. **Indicador verde / rojo / ámbar.** Card en Portada que muestra si Diego anda OK.
3. **Aprender.** Cada corrección del equipo queda en `panel.diego_aprendizaje`. ≥10 del mismo tipo → revisión del prompt.
4. **Memoria.** Diego recuerda contextos importantes vía `panel.diego_memoria_contacto` (mig 050).
5. **Audit log.** Cada request queda registrado con request_id, intent, tokens, duración.

---

# LO QUE FALTA — Dependencias externas

Esto NO depende de Diego. Depende de acciones de Dusan o Pablo.

## Bloqueado por Dusan (decisiones + credenciales)

| # | Capacidad afectada | Acción que falta | Plazo sugerido |
|---|---|---|---|
| 1 | **Rutas eficientes** (Cat. 5) | Crear `GOOGLE_MAPS_API_KEY` en Google Cloud Console y pasársela a Pablo para configurarla en EF secrets. | Esta semana |
| 2 | **Investigación SII** (Cat. 4 + 11) | Autorizar uso del SII y proveer credenciales o método de consulta seguro. | A definir |
| 3 | **Envío automático de mails** (Cat. 1) | Autorizar envío automático desde Diego (Gmail / Outlook). Mientras tanto Diego solo redacta borradores. | A definir |
| 4 | **WhatsApp Business** | OK, cuenta Meta configurada. Sin pendientes. | ✅ Listo |
| 5 | **Mapping de escalación** | Definir formalmente: ¿qué tipo de derivación va a Andrea / Cony / Dyana / Pablo / Dusan? Diego ya tiene defaults razonables, pero conviene firmarlo. | Esta semana |

## Bloqueado por Pablo (técnicas / deploy)

| # | Capacidad afectada | Acción que falta |
|---|---|---|
| 1 | **Render Markdown→HTML en FAB** | Aplicar `marked.parse()` en `panel-rdo.html callDiego()`. Hoy las tablas que devuelve Diego se ven con pipes crudos. |
| 2 | **GPS en vehículos** (Cat. 6) | Hardware/integración. Mientras tanto, ubicación se actualiza manual. |
| 3 | **Webhook WhatsApp v2 con HMAC-SHA256** | Pablo ya tiene spec, falta deploy. |
| 4 | **Rotar API key Anthropic** | Cerrar el hallazgo de seguridad pendiente. |
| 5 | **Label UI FAB "v6" → "v10.2"** | Texto en `panel-rdo.html`. |
| 6 | **BUG-FAB-001** | `rf_session` vacío rompe llamadas a Diego en algunos casos. Fix ~15 min. |

---

## Migraciones aplicadas para esta versión

| Mig | Contenido |
|---|---|
| 056 | `panel.diego_health_log` + `panel.diego_reglas_monitoreo` (D-DIEGO-MONITOREO-001) |
| 057 | `panel.inventario_activos` + `panel.mantenciones` + 2 RPCs (D-DIEGO-V10-001) |
| 058 | `panel.inteligencia_competitiva` + 2 RPCs (D-DIEGO-IC-001) |
| 059 | `panel.conductores` + `panel.rendiciones` + 4 RPCs + vista resumen (D-DIEGO-CAPS-001) |

## Edge Function

`diego-chat-process` versión 12, status ACTIVE. 16 tools en whitelist.

## Tablas de Diego en Supabase

| Tabla / Vista | Schema | Filas seed |
|---|---|---|
| `inventario_activos` | panel | 12 |
| `mantenciones` | panel | — |
| `inteligencia_competitiva` | panel | 2 |
| `conductores` | panel | 5 |
| `rendiciones` | panel | 6 |
| `diego_health_log` | panel | 3 |
| `diego_reglas_monitoreo` | panel | 9 |
| `diego_memoria_contacto` | panel | (vacío) |
| `diego_audit_log` | curated | acumulando |
| `diego_logs` | curated | acumulando |
| `diego_feedback` | curated | acumulando |
| `diego_bandeja` | panel | acumulando |
| `v_activos_resumen` | panel | vista |
| `v_rendiciones_pendientes_por_persona` | panel | vista |

---

**Firmado por:** PC Dusan (asistente del CEO) bajo mandato Dusan Arancibia, 2026-05-23.
**Branch:** `feature/diego-capacidades-completas`.
**Decisión maestra:** D-DIEGO-CAPS-001.
