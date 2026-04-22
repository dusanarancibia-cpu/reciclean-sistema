# 04 — Rutinas

> Patrones diarios, semanales y mensuales. Que hace Dusan recurrentemente.

---

## Rutina diaria

### Manana (07:45 - 10:00 Chile)

| Hora  | Actividad                                                              |
|-------|------------------------------------------------------------------------|
| 07:45 | Revisar WA Diego-Curador (cron 02:00) — bandeja aprobaciones           |
| 08:00 | Aviso al grupo si hay mantenimiento (ej. 21-abr)                       |
| 08:10 | Revisar `PENDIENTES.md` — priorizar criticos del dia                   |
| 08:30 | Primera ronda de WA al equipo (estado sucursales)                      |
| 09:00 | Bloque foco: lo mas critico del dia (deploy, llamada cliente, etc.)    |
| 10:00 | Aviso al grupo si mantenimiento termino                                |

### Tarde (10:00 - 18:00 Chile)

- Operacion fluida: WA del equipo, clientes, proveedores.
- Si entra un caso como Ingrid/Jair/Nicolas → documentar en `casos-diego/` o `casos-dusan/`.
- Si hay decision importante → anotarla para meterla en `08-decisiones-lock.md` al cierre.

### Noche (18:00 - 22:00 Chile)

- Ventana tecnica si aplica (ej. implementacion Diego v4.2 el 21-abr 08:00-10:00, pero otras tareas tecnicas de bajo riesgo caben aqui).
- Revisar commits del dia en GitHub.
- Cierre de dia: checklist de `rutinas/cierre-dia.md`.

---

## Rutina semanal

### Lunes

- Revision de `TAREAS.md` en `Claude Code/` (directorio hermano) — comparar con `PENDIENTES.md`.
- Planificacion semanal: que hay que mover esta semana.
- Sync con Pablo (WA o llamada) — ajustar prioridades tecnicas.

### Miercoles

- Revision de despachos de la semana (Andrea Rivera → coordinacion camiones).
- Check de precios publicados vs vigentes (Tab G del Panel — Revisor).

### Viernes

- Cierre semanal con equipo (mensaje resumen al grupo).
- Revision de `casos-diego/` de la semana — patrones repetidos ?
- Backup semanal del workflow Diego LIVE desde n8n.

### Domingo

- Planificacion de implementaciones de riesgo (como se hizo con 21-abr — domingo pre-vuelo, lunes implementacion).

---

## Rutina mensual

- Release de nueva version del Panel Admin (v90 → v91 → ...).
- Revision de este esquema (`esquema-dusan/`) — actualizar lo que cambio.
- Backup mensual Supabase (Database → Backups → Create new backup).
- Auditoria `palabras prohibidas` en sitios publicos y Asistente.
- Check estado Puerto Montt (permisos → cuando cambie, actualizar CLAUDE.md y `03-objetivos`).

---

## Rutina trimestral

- Revisar fases del proyecto — ¿Fase 2/3/4 va a tiempo ?
- Revision de KPIs vs objetivos del `03-objetivos-y-vision.md`.
- Si hubo cambio de equipo, actualizar `06-stakeholders.md`.
- Re-auditar reglas en `05-condiciones-y-reglas.md` — ¿siguen vigentes ?

---

## Checklists asociados (en `rutinas/`)

Las checklists reutilizables viven en `esquema-dusan/rutinas/`:

- `rutinas/pre-vuelo.md` — pre-check antes de tocar produccion (espejo Fase 0 de la guia 21-abr).
- `rutinas/cierre-dia.md` — que revisar cada tarde antes de desconectar.
- `rutinas/backup-semanal.md` — pasos exactos del backup n8n + Supabase.
- `rutinas/validacion-contenido-publico.md` — checklist palabras prohibidas + Puerto Montt.

> Estos archivos se crean bajo demanda cuando Dusan los necesite formalizados. Por ahora la carpeta esta vacia con `.gitkeep`.

---

## Principios sobre rutinas

- **Si algo se repite 3+ veces → se convierte en checklist.**
- **Si algo falla 2+ veces → se convierte en caso documentado (`casos-dusan/`).**
- **Si una rutina no se cumple 2 semanas seguidas → revisar si sigue siendo util.**
