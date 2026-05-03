# Resumen de Pendientes — Reciclean-Farex

> **Fecha:** 3 de mayo 2026 | **Para:** Dusan Arancibia + Pablo Arancibia
> **Regla:** Quien figura como responsable puede pedir reasignacion al otro.

---

## Lo que se hizo hoy (3 de mayo)

### Dusan
1. **Mergeo PR #14** — Panel admin de erratas Diego + tabla Supabase + spec n8n. Esto incluyo:
   - Modulo CRUD de erratas (`public/js/erratas.js`) para corregir respuestas de Diego
   - Migracion SQL para tabla `diego_correcciones` en Supabase
   - Documento de integracion erratas con n8n
   - Limpieza mayor de `index.html` (2120 lineas removidas de codigo inline)
2. **Revision de pendientes** — Solicito resumen ejecutivo de tareas con % de avance para tener claridad de donde esta cada cosa.
3. **Planificacion Monday.com** — Trabajo con Pablo para disenar la estructura completa de organizacion en Monday.com.

### Pablo (via Claude Code)
1. **Resumen ejecutivo de pendientes** — Documento de 1 pagina con las 12 tareas, responsables, % y fechas estimadas.
2. **Estructura Monday.com completa** — 4 documentos listos para implementar:
   - Diseno de 3 tableros (Maestro, Diarias, Ideas) para 37 temas
   - CSV importable con 30 iniciativas + 5 tareas
   - Guia de implementacion paso a paso (8 partes, ~3-4h)
   - Guia rapida de 1 pagina para el equipo
3. **Estructura de silos departamentales** — 10 carpetas por departamento con subcarpetas, mapeadas a Monday.com:
   - Gerencia General, Tecnologia, Comercial, Operaciones, Abastecimiento
   - Logistica, Finanzas, RRHH, Legal/Compliance, Sostenibilidad
4. **Documentacion visual** — Resumen ASCII y ejecutivo de la solucion Monday.com con mapeo bidireccional (archivos <-> Monday <-> notificaciones)

---

## Tareas Pendientes (actualizado 3 mayo)

| # | Tarea | Responsable | Estado % | Fecha est. | Que falta |
|---|-------|-------------|----------|------------|-----------|
| 1 | **Mergear PR #5** (URLs cortas) | Dusan | 90% | 5 mayo | Dar click en "Merge" en GitHub. 1 minuto. |
| 2 | **Parchar Diego Alonso** (que no mienta) | Pablo | 15% | 12 mayo | Dusan entrega clave N8N. Pablo aplica cambio. |
| 3 | **Difundir /coordinar-equipo** (8 mensajes) | Dusan | 20% | 7 mayo | Copiar y enviar por WhatsApp al equipo. |
| 4 | **Monitoreo semanal Diego** | Pablo | 0% | 9 mayo | Revisar tabla de conversaciones. |
| 5 | **Corregir 28 bugs de Diego** (v4.3) | Pablo | 10% | 18 mayo | Reescribir partes del prompt. Necesita clave N8N. |
| 6 | **Humanizar Diego** (v4.4, tono calido) | Pablo | 0% | 30 mayo | Solo cuando bugs esten resueltos (depende de 5). |
| 7 | **Rotar keys** (seguridad K3 + Meta) | Dusan | 10% | 5 mayo | Cambiar claves de API viejas. 20 minutos. |
| 8 | **Sprint ventas** (30 msgs + demos) | Dusan | 40% | 10 mayo | Seguir contactando prospectos y mostrar Diego. |
| 9 | **Infra VPS + hub** (servidor propio) | Pablo | 15% | 15 mayo | Contratar servidor, migrar n8n, instalar servicios. |
| 10 | **ACI deploy** (Asistente Comercial nuevo) | Pablo | 50% | 20 mayo | Subir al VPS nuevo. Depende de tarea 9. |
| 11 | **Plan 2026-2030** (planificacion estrategica) | Dusan | 30% | 10 mayo | Cerrar documento con I-10 e I-12 alineados. |
| 12 | **Puerto Montt** (abrir sucursal) | Dusan | 20% | 30 junio | Permisos SAG pendientes. No publicar como activa. |
| 13 | **Panel erratas Diego** (NUEVO - completado hoy) | Dusan | **100%** | 3 mayo | LISTO. PR #14 mergeado a main. |
| 14 | **Organizar Monday.com** (37 temas) | Dusan+Pablo | **70%** | 9 mayo | Docs listos. Falta crear tableros en Monday y cargar CSV. |

---

## Resumen rapido

| Indicador | Valor |
|-----------|-------|
| Total tareas abiertas | 14 |
| Completadas hoy | 1 (tarea 13) |
| Avance significativo hoy | 1 (tarea 14: 0% -> 70%) |
| Promedio cumplimiento | **30%** (sube de 25%) |
| Bloqueadas (esperan clave N8N) | 3 (tareas 2, 5, 6) |
| Criticas esta semana | Tarea 1 y 7 |

---

## Quien hace que

**Dusan (6 tareas):** Mergear PR #5, difundir mensajes, rotar keys, sprint ventas, plan estrategico, Puerto Montt.

**Pablo (5 tareas):** Parchar Diego, monitoreo, corregir bugs, humanizar, VPS, ACI deploy.

**Ambos (1 tarea):** Cargar Monday.com (docs listos, falta ejecutar en la plataforma).

---

## Bloqueos que resolver YA

1. **Clave N8N** — Dusan se la pasa a Pablo y se desbloquean 3 tareas de golpe.
2. **Merge PR #5** — Dusan da click y las URLs cortas quedan vivas.

---

## Lo que viene manana (4-5 mayo)

- **Dusan**: Mergear PR #5, rotar keys (tarea 7), avanzar sprint ventas
- **Pablo**: Si llega clave N8N, empezar parche Diego + bugs
- **Ambos**: Crear tableros Monday.com con los documentos ya preparados

---

*Este documento se actualiza cada vez que cambie el estado de una tarea.*
