# Protocolos — Reciclean-Farex

> Procesos estandar. Toda accion riesgosa o repetitiva debe seguir uno de estos.

---

## 1. Tocar Diego LIVE (workflow n8n PWxwI2oyCRejxG82)

**Requisitos:** `N8N_API_KEY` presente. Horario recomendado: fuera de operacion o con aviso previo al equipo.

```
1. AVISO al grupo WhatsApp equipo (si es horario laboral):
   "Equipo, voy a estar haciendo mantenimiento a Diego entre
    las HH:MM y HH:MM. Puede que no responda durante ese rato."

2. GET workflow actual via n8n API
   -> guardar backup en 7_backup-prompts/incidentes/
      diego_workflow_backup_YYYYMMDD_HHMMSS.json

3. Extraer system prompt del nodo claude-api

4. Preparar DIFF exacto del cambio

5. Mostrar DIFF al usuario -> CHECKPOINT

6. Esperar OK explicito ("si" / "ok" / "dale")

7. PUT workflow parchado

8. SMOKE TEST: mensaje real desde WhatsApp de Dusan a +56 9 6192 6365
   - Test 1: saludo normal
   - Test 2: consulta que deberia activar nueva rama
   - Test 3: si hay tabla nueva, verificar INSERT en Supabase

9. Si algo raro -> ROLLBACK:
   - PUT del backup
   - Verificar que Diego responde de nuevo
   - Documentar incidente en workflow_patches (cuando exista la tabla)
     o en 7_backup-prompts/incidentes/YYYYMMDD_incidente.md

10. Registrar patch aplicado en tabla workflow_patches
    (cuando exista; mientras tanto, entrada en PENDIENTES.md).
```

**NUNCA:** PUT directo sin backup. PUT sin OK explicito. Trabajar sobre LIVE sin duplicar a STAGING primero (para cambios grandes).

---

## 2. Crear tabla nueva en Supabase

Disparador: se detecta informacion estructural repetitiva sin tabla destino.

```
1. Proponer al usuario el esquema (columnas, tipos, indices, RLS)
   + justificacion (que info hoy esta en archivos, cuantas filas, etc.)

2. Esperar OK con codigo (A. crear ahora / B. crear manana / C. no crear / Z. ajustar esquema)

3. Si OK-A:
   a) Escribir migracion en .claude/skills/protocolo-datos-unificado/sql/
      AAAAMMDD_<nombre>.sql
   b) Avisar: "SQL listo. Para correrlo: copia y pega en Supabase SQL Editor:
      https://supabase.com/dashboard/project/eknmtsrtfkzroxnovfqn/sql/new"
   c) En paralelo (segundo plano), actualizar TABLAS.md moviendo la
      tabla de "Propuestas" a "Existentes" marcandola "pendiente de correr"
   d) Cuando el usuario confirme que corrio el SQL, marcar como "activa"
      en TABLAS.md y migrar la info existente (ver protocolo 3).

4. Si OK-B / C / Z:
   - B: agregar al inicio de proxima sesion como tarea
   - C: guardar propuesta en TABLAS.md seccion "descartadas"
   - Z: ajustar esquema y volver al paso 1
```

**Convenciones obligatorias:**
- `BIGSERIAL PRIMARY KEY` para `id`
- `created_at TIMESTAMPTZ DEFAULT NOW()` siempre
- `updated_at TIMESTAMPTZ DEFAULT NOW()` cuando hay mutacion
- `ENABLE ROW LEVEL SECURITY` en todas
- Enum -> `CHECK (col IN ('a','b','c'))` en vez de tipo custom (mas flexible)
- FK con `ON DELETE CASCADE` o `SET NULL` segun semantica

---

## 3. Migrar archivo .md -> tabla

Disparador: tabla creada, archivo origen tiene filas a migrar.

```
1. Parsear archivo origen. Identificar cada "fila":
   - PENDIENTES.md: cada "### P<N>" es una fila de tareas
   - casos-diego/*.md: cada archivo es una fila de casos_asistente
   - mensajes-equipo/*.md: cada seccion "## <Nombre>" es una fila de plantillas_mensajes

2. Generar INSERTs SQL. Mostrar al usuario los primeros 3 como muestra.

3. Esperar OK.

4. Ejecutar INSERT (Dusan lo corre en Supabase SQL Editor).

5. Validar: SELECT COUNT(*) FROM <tabla> -- debe coincidir.

6. Deprecar archivo origen:
   - Agregar al INICIO del archivo:
     > **MIGRADO a tabla `<nombre>` el YYYY-MM-DD. Mantener solo para
     > historial. Nuevas filas -> INSERT en Supabase.**
   - NO borrar el archivo aun (evidencia de la migracion).

7. Actualizar referencias en CLAUDE.md y otros docs si existen.
```

---

## 4. Cambios en el repo (commit + push)

```
1. Mostrar diff / plan al usuario

2. Esperar OK explicito

3. Commit con mensaje descriptivo:
   - Formato: "<tipo>: <resumen corto>"
   - Tipos: feat, fix, docs, refactor, chore, style
   - Cuerpo opcional con detalles

4. NUNCA push directo a main. Siempre a branch feature activa.

5. Tras push, preguntar al usuario si abrir PR a main.
```

**Excepciones:** NUNCA `git push --force` a `main`. NUNCA `git reset --hard` si hay trabajo en curso del usuario.

---

## 5. Manejo de sesion Claude (apertura y cierre)

### Apertura

```
1. Leer CLAUDE.md (instrucciones proyecto)
2. Leer PENDIENTES.md (tareas abiertas) — o SELECT * FROM tareas WHERE estado<>'cerrada' cuando la tabla exista
3. Leer prompt de continuidad mas reciente (CONTINUAR_SESION_*.txt)
4. Preguntar a Dusan si trae credenciales pendientes (ver HERRAMIENTAS.md seccion 11)
5. Confirmar rama activa (`git branch --show-current`)
6. Preguntar objetivo de la sesion si no es obvio
```

### Cierre

```
1. Si se creo info nueva, verificar que quedo en tabla o .md-espejo
2. Commitear cambios pendientes (con OK del usuario)
3. Actualizar PENDIENTES.md con nuevas tareas abiertas
4. Cerrar tareas completadas (mover a seccion "Cerradas" o UPDATE estado='cerrada')
5. Si la sesion fue larga, generar prompt de continuidad en CONTINUAR_SESION_YYYYMMDD.txt
   (o cuando exista la tabla: INSERT en sesiones_claude)
```

---

## 6. Registro de caso (asistente falla con un usuario)

Disparador: usuario reporta que Diego fallo con alguien del equipo.

```
1. Verificar si ya existe fila similar:
   - grep en casos-diego/ por fecha + nombre
   - o SELECT * FROM casos_asistente WHERE fecha=X AND contacto_nombre=Y

2. Si existe -> UPDATE / agregar evidencia
   Si NO existe:
   a) Recopilar: fecha, contacto, duracion, mensajes_total, resultado,
      resumen, diego_hizo_mal, diego_debio_hacer, bugs_vinculados
   b) Proponer INSERT o archivo casos-diego/YYYYMMDD-<nombre>.md

3. Si hay bugs nuevos -> INSERT en bugs_asistente + linkear.
4. Si el bug ya existe pero con otro usuario -> UPDATE usuarios_confirmados.
5. Si el caso bloquea una tarea -> UPDATE tareas.bloqueador.
```

---

## 7. Aplicar patch de prompt a Diego (tipico P2, P5)

Combina protocolos 1 (tocar Diego LIVE) + 3 (migrar si hay tabla nueva) + 4 (repo).

```
1. Leer spec del patch (en docs/ o dentro de tarea).

2. Si el patch requiere columna/tabla nueva:
   a) Protocolo 2 (crear tabla nueva)
   b) Ejecutar SQL
   c) Verificar

3. Protocolo 1 (tocar Diego LIVE):
   backup -> diff -> OK -> PUT -> smoke test

4. Smoke test completo:
   - Test basico (saludo)
   - Test del feature nuevo (que active la rama nueva)
   - Test de regresion (feature viejo sigue OK)

5. Registrar en workflow_patches + cerrar tareas ligadas.

6. Si el patch requiere anuncio al equipo (ej. rename "Diego Alonso"):
   - Verificar columna de tracking (`anuncio_nombre_visto`)
   - Primer mensaje de cada contacto tras patch -> prepender anuncio
   - UPDATE `anuncio_nombre_visto=true` tras envio.
```

---

## 8. Respuesta a Dusan (formato obligatorio)

- Espanol siempre. Corto y directo.
- Codigos **A/B/C/D + slot Z abierto** en cada propuesta de decision.
- Checkpoints antes de ejecutar cambios materiales (especialmente Diego LIVE).
- No inventar. Si no se sabe, decirlo.
- No entrar en detalles tecnicos salvo que Dusan pregunte.

Ejemplo de propuesta con codigos:

```
Para este caso tengo 4 caminos:

A. Crear tabla bugs_asistente ahora (5 min, corres el SQL tu)
B. Dejar los bugs en PENDIENTES.md hasta que tengamos N8N_API_KEY
C. Crear solo la tabla, migrar manana
Z. Tu propones

Que hacemos?
```

---

## 9. Rollback rapido (Diego LIVE caido)

Criterio: Diego no responde >5 min a mensajes del equipo.

```
1. n8n -> desactivar workflow v4.2 (toggle off)
2. n8n -> activar workflow legacy v4.1.5.3 (toggle on)
3. Probar: enviar WA a +56 9 6192 6365
4. Si responde -> CRISIS RESUELTA
5. Documentar en 7_backup-prompts/incidentes/YYYYMMDD_rollback.md
   (o INSERT en workflow_patches con smoke_test_resultado='rollback')
6. Avisar a Pablo por WA (no urgente interrumpir vacaciones)
```

---

## 10. Auditoria semanal (viernes) — Diego-Curador

Cuando Diego-Curador este implementado, corre automatico 02:00 AM Chile. Mientras tanto, manual los viernes:

```
1. SELECT casos ultima semana FROM casos_asistente
2. SELECT bugs activos FROM bugs_asistente WHERE estado='abierto'
3. Revisar conversaciones Supabase tag [CALIBRAR] o [FEEDBACK]
4. Proponer ajustes al prompt -> nueva tarea en tareas
5. Enviar resumen a Dusan WA
```

---

## 11. Lo que NUNCA hacer

- `DROP TABLE` sin backup Supabase + OK Dusan.
- `git push --force` a main.
- Commit con credenciales o secretos.
- PUT a workflow n8n sin backup previo.
- Publicar Puerto Montt como sucursal activa (no opera aun).
- Usar palabras prohibidas en comunicacion publica: `gratis`, `gratuito`, `sin costo`, `el mejor precio`, `garantizado`.
- Diego enviando mensajes a terceros por iniciativa propia (solo redacta + link wa.me).
- Crear `.md` nuevo para info estructural sin evaluar tabla primero.
