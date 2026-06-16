# PENDIENTES — Dusan & Pablo
**Fecha:** 16 junio 2026 · **Proyecto:** Reciclean-Farex Sistema

---

## TAREAS DE DUSAN

| # | Tarea | Avance | Fecha est. | Reasignar a |
|---|-------|--------|------------|-------------|
| D1 | **Completar lista del equipo en panel.dotacion** — Llenar emails, teléfonos y datos reales de las 14 personas (Andrea, Cony, Ingrid, Pablo, Dyana, etc.) | 30% | 20 jun 2026 | ☐ Pablo |
| D2 | **Crear clave Google Maps** — Entrar a Google Cloud y generar la API key. Sin esto no funcionan las rutas ni direcciones en Diego | 0% | 20 jun 2026 | ☐ Pablo |
| D3 | **Entregar clave N8N** — Compartir la N8N_API_KEY para poder arreglar los 27 bugs de Diego (el asistente dice mentiras, pierde contexto, se presenta mal) | 0% | 18 jun 2026 | ☐ Pablo |
| D4 | **Firmar PRs en GitHub** — Aprobar PR #15 + PR de memoria Diego. Sin tu firma Pablo no puede subir nada a produccion | 0% | 17 jun 2026 | — |
| D5 | **Conseguir credencial SII** (opcional) — Para conectar facturacion electronica al sistema | 0% | 30 jun 2026 | ☐ Pablo |
| D6 | **Agregar 5 links en panel RDO** — Despues de que Pablo fusione PR #119, conectar las 5 pestañas nuevas (cumplimiento, dotacion, campañas, rutas, inventario) | 0% | 25 jun 2026 | ☐ Pablo |

---

## TAREAS DE PABLO

| # | Tarea | Avance | Fecha est. | Reasignar a |
|---|-------|--------|------------|-------------|
| P1 | **Subir Diego v10.7 a produccion** — Instalar la version que ya esta lista en la rama. Probar que "precio carton Maipu" responda bien y que quede registro en la base de datos | 80% | 18 jun 2026 | ☐ Dusan |
| P2 | **Arreglar chat de Diego: Markdown se ve como texto plano** — Instalar libreria que convierta las tablas y negritas de Diego en formato bonito | 0% | 22 jun 2026 | ☐ Dusan |
| P3 | **Aplicar migracion 069** — Crear la vista v_cliente_360_full para que los clientes sin Impulsa tambien aparezcan con sus datos | 0% | 20 jun 2026 | ☐ Dusan |
| P4 | **Aplicar migracion 070** — Crear tablas de prefacturas y pagos emitidos (procesos 19 y 22 del manual) | 0% | 25 jun 2026 | ☐ Dusan |
| P5 | **Seguridad: Webhook WhatsApp sin firma** — Subir la version v2 con verificacion HMAC + agregar el secreto en Supabase. Vigilar 24 hrs y activar modo estricto | 50% | 22 jun 2026 | ☐ Dusan |
| P6 | **Rotar API key de Anthropic expuesta** — Generar clave nueva y reemplazar la vieja. URGENTE por seguridad | 0% | 17 jun 2026 | ☐ Dusan |
| P7 | **Arreglar 68 politicas de seguridad abiertas** — Aplicar migracion 049 para cerrar las politicas RLS marcadas como AUDIT | 30% | 30 jun 2026 | ☐ Dusan |
| P8 | **Agregar tab Manual al panel** — Meter el manual operativo (23 procesos) dentro del panel con filtros "Por mi / Todos / Por rol" y boton de comentarios | 0% | 5 jul 2026 | ☐ Dusan |
| P9 | **Cumplimiento legal Diego IA** — Poner banner de "soy inteligencia artificial" + consentimiento + pestaña "Mi memoria" para cumplir la ley chilena | 0% | 30 jun 2026 | ☐ Dusan |
| P10 | **Fusionar PR #119** — Desbloquea a Dusan para agregar las 5 pestañas del panel RDO | 0% | 18 jun 2026 | ☐ Dusan |

---

## RESUMEN GENERAL

| Area | Avance | Estado |
|------|--------|--------|
| **Panel Admin (8 tabs)** | 90% | Produccion estable v90 |
| **Asistente Comercial** | 85% | Funcionando, falta sync mobile |
| **Diego IA (chatbot)** | 40% | 27 bugs pendientes, bloqueado por clave N8N |
| **Panel RDO** | 70% | Esperando PR #119 + 5 pestañas nuevas |
| **Seguridad** | 55% | 3 temas criticos abiertos (webhook, API key, RLS) |
| **Fase 2 completa** | 35% | KPIs, CRM, PWA mejorada, Google Workspace |
| **Fase 3** | 0% | Rediseño webs + Google Maps (no iniciada) |
| **Fase 4** | 15% | RRSS automaticas + Chatbot WhatsApp en curso |

---

**Proximos pasos inmediatos (esta semana):**
1. Dusan firma los PRs pendientes → Pablo sube Diego v10.7
2. Pablo rota la API key expuesta (seguridad)
3. Dusan entrega la clave N8N → se arreglan los 27 bugs de Diego
4. Pablo fusiona PR #119 → Dusan conecta las 5 pestañas

*Para reasignar: marcar con X la casilla y avisar al otro por WhatsApp.*
