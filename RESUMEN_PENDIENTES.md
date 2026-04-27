# Resumen de Tareas Pendientes — Reciclean-Farex

**Fecha:** 27 de abril 2026 | **Version:** v93 en produccion

---

## Tareas de Dusan

| # | Tarea | Que falta | Avance | Fecha estimada | Reasignar a |
|---|-------|-----------|--------|----------------|-------------|
| 1 | **Rotar claves K3 y Meta** — Cambiar las claves de seguridad que ya vencieron | Entrar a K3 y Meta, generar claves nuevas, guardarlas | 10% | ~~22-abr~~ ATRASADA | ___________ |
| 2 | **Entregar clave N8N** — Sin esta clave no se puede arreglar a Diego Alonso | Buscar la API key de n8n y pasarla a Pablo/Claude | 0% | 28-abr | ___________ |
| 3 | **Sprint de ventas** — Contactar prospectos, enviar 30 mensajes WA, cerrar clientes | Completar lista de 50 prospectos, hacer demos de Diego | 40% | 28-abr | ___________ |
| 4 | **Lanzar Diego v5.0** — Version estable del asistente WhatsApp para todo el equipo | Aprobar parche de nombre, dar claves, validar pruebas | 30% | 30-abr | ___________ |
| 5 | **Plan 2026-2030** — Documento de planificacion a 5 anos | Alinear con sprint ventas y lanzamiento Diego | 30% | 30-abr | ___________ |
| 6 | **Difundir pagina de coordinacion** — Enviar link `/coordinar-equipo` al equipo por WA | Decidir cuando enviar (8 mensajes ya redactados) | 70% | 2-may | ___________ |
| 7 | **Contratar Notion Plus** — Workspace para el equipo | Contratar plan y configurar espacio | 0% | 5-may | ___________ |
| 8 | **Revisar contrato Resimple** — Ver vigencia 2026 | Leer contrato, decidir si renovar | 0% | 10-may | ___________ |
| 9 | **Evaluar herramientas BI** — Elegir plataforma de reportes | Comparar opciones, decidir cual usar | 20% | 10-may | ___________ |
| 10 | **Puerto Montt** — Avanzar permisos SAG para abrir sucursal | Seguimiento de permisos pendientes | 20% | 30-jun | ___________ |

---

## Tareas de Pablo

| # | Tarea | Que falta | Avance | Fecha estimada | Reasignar a |
|---|-------|-----------|--------|----------------|-------------|
| 1 | **Montar servidor VPS** — Infraestructura para Diego y servicios | Contratar DigitalOcean, instalar, configurar hub | 15% | 28-abr | ___________ |
| 2 | **Arreglar 28 bugs de Diego** — Corregir errores graves del asistente WA | Refactorizar prompt, anti-loops, fix variables, anti-alucinacion | 10% | 30-abr | ___________ |
| 3 | **Parche Diego Alonso** — Cambiar nombre + bloque coordinacion equipo | Aplicar PATCH al workflow n8n cuando llegue la API key | 0% | 30-abr | ___________ |
| 4 | **Desplegar Asistente Comercial (ACI)** — Subir los 5 modulos al servidor | Necesita VPS listo primero, luego deploy y pruebas | 50% | 5-may | ___________ |
| 5 | **Diego v5.1** — Mejoras post-lanzamiento v5.0 | Esperar que v5.0 este estable, luego iterar | 0% | 15-may | ___________ |
| 6 | **Deuda tecnica** — Limpiar codigo, optimizar, 11 sub-tareas | Programar despues del lanzamiento 30-abr | 5% | 20-may | ___________ |

---

## Bloqueadores (cosas que frenan el avance)

| Problema | Quien lo resuelve | Que desbloquea |
|----------|-------------------|----------------|
| Falta **clave N8N** (API key) | Dusan | Parche Diego Alonso + fix 28 bugs |
| Falta **clave Supabase** (service key) | Dusan | Nueva columna para anuncio de nombre |
| **Token GitHub vence hoy 27-abr** | Dusan o Pablo | Poder subir codigo al repositorio |
| **VPS no contratado** (DigitalOcean) | Dusan aprueba, Pablo ejecuta | Servidor para Diego y ACI |

---

## Proximos 7 dias — Quien hace que

| Dia | Dusan | Pablo |
|-----|-------|-------|
| **Dom 27** | Entregar clave N8N | Sesion prompt + Google Calendar |
| **Lun 28** | Cerrar primer cliente | Deploy VPS + importar workflows |
| **Mar 29** | Preparar respuestas modelo | Curador + pruebas Diego |
| **Mie 30** | **LANZAMIENTO Diego v5.0** | **LANZAMIENTO Diego v5.0** |
| **Jue 1-may** | Feriado (evaluar avance) | Feriado (evaluar avance) |
| **Vie 2-may** | Enviar links al equipo (P3) | Monitoreo semanal Diego |
| **Sab 3-may** | — | Ajustes post-lanzamiento |

---

*Para reasignar una tarea: escribir el nombre en la columna "Reasignar a" y avisar al equipo.*
*Documento generado el 27-abr-2026. Fuente: STATUS.md + PENDIENTES.md del repositorio.*
