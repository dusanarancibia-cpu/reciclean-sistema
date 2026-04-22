---
name: protocolo-datos-unificado
description: Protocolo transversal para trabajar datos del sistema Reciclean-Farex bajo un mismo esquema. Usar SIEMPRE que el usuario (a) registre nueva informacion estructurada (tarea, bug, caso, mensaje, patch, decision, contacto, credencial, plantilla), (b) pregunte donde guardar algo, (c) pida status/listado (tareas, bugs, casos), o (d) cree un archivo .md/.txt con estructura repetitiva. La skill: 1) consulta si ya existe tabla en Supabase antes de crear archivo, 2) si no existe y es estructural, arranca proceso para crearla, 3) evita duplicar informacion en archivos sueltos, 4) centraliza catalogo de herramientas (Supabase, n8n, Vercel, GitHub, Meta WhatsApp, VPS), protocolos (Diego LIVE, repo, rollback) y convenciones del proyecto.
---

# Protocolo unificado de datos — Reciclean-Farex

Un solo esquema para todo lo estructural: tareas, bugs, casos, mensajes, patches, decisiones, contactos, credenciales, plantillas. Supabase es la fuente de verdad. Los archivos `.md` son para narrativa y especificaciones que NO se repiten.

## Cuando activar esta skill

Se activa sin que el usuario lo pida, en estos gatillos:

1. **Registro estructurado** — el usuario describe algo con forma de fila (fecha, estado, prioridad, responsable, proxima accion, bloqueador, evidencia). Ejemplos: "anota que...", "agrega caso de...", "documenta bug de...", "apunta tarea...", "guarda este mensaje para...".
2. **Consulta de estado** — "status", "que hay pendiente", "lista bugs abiertos", "casos de la semana", "que patches faltan".
3. **Creacion de archivo repetitivo** — se va a crear un nuevo `.md` dentro de `casos-diego/`, `mensajes-equipo/`, `PENDIENTES.md` (bugs, tareas). Proponer tabla ANTES de escribir.
4. **Pregunta de ubicacion** — "donde guardo X?", "existe ya Y?", "hay tabla para Z?".
5. **Menciones de herramienta** — Supabase, n8n, workflow PWxwI2oyCRejxG82, Meta Cloud API, VPS 137.184.203.15, GitHub MCP, Vercel. Cargar contexto de `HERRAMIENTAS.md`.

## Regla de oro

> Antes de crear un archivo o agregar una seccion repetitiva a un `.md`, preguntar: **¿esto son filas de una tabla?** Si la respuesta es si y la tabla no existe, iniciar el proceso de creacion (ver `PROTOCOLOS.md` seccion "Crear tabla nueva"). Mientras la tabla no exista, anotar en el `.md` correspondiente **con la estructura de la futura tabla** (columnas explicitas) para migrar despues sin perdida.

## Flujo de decision (obligatorio)

Cuando el usuario reporta algo para registrar:

```
1. ¿Es estructural y recurrente? (se va a repetir N veces con misma forma)
   SI  -> 2
   NO  -> guardar como narrativa en doc existente

2. ¿Existe tabla en Supabase que lo cubra? (ver TABLAS.md)
   SI  -> proponer INSERT, mostrar SQL, esperar OK, ejecutar
   NO  -> 3

3. ¿Esta en la lista de "tablas propuestas" de TABLAS.md?
   SI  -> arrancar proceso "Crear tabla nueva" EN SEGUNDO PLANO
          (ver PROTOCOLOS.md), mientras tanto escribir al .md espejo
          con estructura columnas-explicitas
   NO  -> proponer nueva tabla al usuario, si OK agregar a TABLAS.md
          tablas propuestas, luego aplicar paso anterior
```

El "proceso en segundo plano" = redactar migracion SQL en `.claude/skills/protocolo-datos-unificado/sql/`, avisar al usuario con un checkpoint "SQL listo para correr en Supabase cuando quieras", sin detener la conversacion principal.

## Archivos de referencia

Leer ON-DEMAND segun el caso. No cargar todos a la vez.

| Archivo | Cuando leer |
|---|---|
| `TABLAS.md` | Al activar la skill, SIEMPRE. Catalogo de tablas existentes + propuestas + mapeo archivo->tabla. |
| `HERRAMIENTAS.md` | Cuando se menciona Supabase/n8n/Vercel/GitHub/Meta/VPS o se va a tocar alguno. |
| `PROTOCOLOS.md` | Cuando se va a ejecutar algo riesgoso (Diego LIVE, push a main, DROP TABLE, PUT workflow) o crear tabla. |
| `MIGRAR.md` | Cuando se detecta que archivos existentes (PENDIENTES.md, casos-diego/*, mensajes-equipo/*) deben migrar a tablas. Contiene el plan de migracion. |
| `sql/*.sql` | Migraciones pendientes de correr. Nunca ejecutar automatico — el usuario las corre en Supabase SQL Editor. |

## Convenciones de naming

- Tablas: `snake_case`, plural (`tareas`, `casos_asistente`, `bugs_diego`).
- Columnas timestamp: `created_at`, `updated_at`, `closed_at`, `reviewed_at`.
- Columnas estado: `estado TEXT` con CHECK de valores (`abierta|bloqueada|cerrada|en_revision`).
- Claves externas: `<tabla>_id` (ej. `sesion_id`, `caso_id`).
- Flags boolean: verbo en pasado o afirmacion (`activo`, `resuelto`, `enviado`, `validado`).
- RLS por defecto: `ENABLE ROW LEVEL SECURITY` + policy service_role (mismo patron que v4.1).

## Comunicacion al usuario

- Codigos A/B/C/D + slot Z en propuestas de decision (mismo estilo global del proyecto).
- Antes de ejecutar SQL destructivo o PUT a n8n: checkpoint visible + esperar OK explicito.
- Al terminar un registro: confirmar tabla + id insertado + como consultarlo.
- Al final de sesion: si se creo info nueva, verificar que quedo en tabla o .md-espejo (no perder).

## Que NO hacer

- NO crear un `.md` nuevo para algo que tiene tabla (o puede tenerla).
- NO duplicar la misma info en PENDIENTES.md, casos-diego/ y un doc suelto. Una fila, un lugar.
- NO ejecutar SQL sin OK del usuario.
- NO tocar Diego LIVE sin seguir el protocolo en `PROTOCOLOS.md`.
- NO crear tablas que no aparezcan en `TABLAS.md` (actualizar antes).
- NO meter credenciales en SQL ni en archivos del repo (es publico).
