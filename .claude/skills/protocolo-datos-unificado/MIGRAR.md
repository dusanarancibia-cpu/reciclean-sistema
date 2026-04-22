# Plan de migracion archivos -> tablas

> Lista ordenada de que archivos migrar, en que orden, y el impacto.
> Activar este documento cuando se decida empezar la migracion (no automatico).

---

## Resumen ejecutivo

| Archivo | Filas aprox | Tabla destino | Prioridad | Estado |
|---|---|---|---|---|
| `PENDIENTES.md` (tareas P1-P6) | 6 | `tareas` | ALTA | pendiente |
| `PENDIENTES.md` (bugs 1-28 en P5) | 28 | `bugs_asistente` | ALTA | pendiente |
| `casos-diego/20260420-*.md` | 3 | `casos_asistente` | ALTA | pendiente |
| `mensajes-equipo/difusion-coordinar-equipo.md` | 8 | `plantillas_mensajes` | MEDIA | pendiente |
| `docs/diego-v4.2-spec.md` (tabla LOCK) | 9 | `decisiones_lock` | MEDIA | pendiente |
| `CONTINUAR_SESION_DIEGO.txt` (credenciales) | 3 | `credenciales_requeridas` | BAJA | pendiente |
| `7_backup-prompts/incidentes/*.json` | 1+ | `workflow_patches` | BAJA | pendiente |

**Total filas a migrar:** ~58. Tiempo estimado: 2-3 horas si se hace en un bloque.

---

## Orden recomendado

### Bloque 1 — Tareas y bugs (ALTA, desbloquea flujo de status)

1. Correr `sql/20260422_tablas_base_protocolo.sql` (crea las 7 tablas).
2. Migrar `PENDIENTES.md` -> `tareas`.
   - Parsear cada `### P<N>.` como fila.
   - Mapeo:
     - `P1. Mergear PR ...` -> `codigo='P1'`, `titulo='Mergear PR de URLs cortas a main'`, `estado='en_revision'`, `branch='claude/continue-diego-mobile-U0cgA'`, `commit_sha='946b0d6'`.
     - Agregar `proxima_accion` y `bloqueador` literal.
3. Migrar bugs P5 -> `bugs_asistente`.
   - Cada bug numerado -> fila.
   - `usuarios_confirmados` segun "confirmado con N usuarios".
   - `casos_evidencia` FK a `casos_asistente` (migrar casos primero).
4. Despues de validar, agregar al INICIO de `PENDIENTES.md`:
   ```
   > **MIGRADO a tablas `tareas` y `bugs_asistente` el 2026-04-22.**
   > **Nuevas filas -> INSERT en Supabase, no aqui.**
   > **Este archivo queda como historial unicamente.**
   ```

### Bloque 2 — Casos (ALTA, ligados a bugs)

5. Migrar `casos-diego/20260420-ingrid.md` -> `casos_asistente`.
6. Idem `20260420-jair.md`, `20260420-nicolas.md`.
7. Linkear `casos_asistente.bugs_vinculados` con los bugs recien migrados.

### Bloque 3 — Plantillas, decisiones, credenciales (MEDIA/BAJA)

8. Migrar `mensajes-equipo/difusion-coordinar-equipo.md` -> `plantillas_mensajes`.
   - 8 filas, una por seccion `## <Nombre>`.
   - `campana='difusion-coordinar-equipo'`, `estado='aprobado'` (Dusan ya los reviso).
9. Migrar tabla LOCK de `docs/diego-v4.2-spec.md` -> `decisiones_lock`.
   - 9 filas (C3, M2, M1.C, Just-in-time, D1, P1.b, P3, R2.B, R1).
10. Migrar `CONTINUAR_SESION_DIEGO.txt` seccion CREDENCIALES -> `credenciales_requeridas`.
    - 3 filas (N8N_API_KEY, SUPABASE_SERVICE_KEY, GITHUB_PAT).

### Bloque 4 — Historial de patches (BAJA)

11. Migrar `7_backup-prompts/incidentes/diego_workflow_backup_20260420_121639.json` metadata -> `workflow_patches`.
    - `backup_path` apunta al JSON.

---

## Template de INSERT por tabla

### `tareas`

```sql
INSERT INTO tareas (codigo, titulo, descripcion, prioridad, estado, proxima_accion, bloqueador, branch, commit_sha, pr_numero)
VALUES
  ('P1', 'Mergear PR de URLs cortas a main', '6 redirects a paginas Diego', 'alta', 'en_revision',
   'Dusan aprueba merge a main desde GitHub, o pide a Claude que abra PR', NULL,
   'claude/continue-diego-mobile-U0cgA', '946b0d6', 5),
  ('P2', 'PATCH prompt Diego Alonso - flujo coordinacion equipo', 'Bloque COORDINACION + rename Diego Alonso + anuncio one-shot', 'critica', 'bloqueada',
   'Dusan entrega N8N_API_KEY -> protocolo backup -> diff -> OK -> PUT -> smoke test',
   'falta N8N_API_KEY', NULL, NULL, NULL);
-- ... P3-P6 ...
```

### `bugs_asistente`

```sql
INSERT INTO bugs_asistente (numero, titulo, categoria, severidad, usuarios_confirmados, version_detectada, estado)
VALUES
  (1, 'Loops de bienvenida', 'loop', 'alta', ARRAY['dusan'], 'v4.1.5.3', 'abierto'),
  (2, 'No parsea opciones numericas del menu propio', 'parsing', 'critica',
   ARRAY['dusan','jair','ingrid','nicolas'], 'v4.1.5.3', 'abierto'),
  -- ... hasta 28 ...
```

### `casos_asistente`

```sql
INSERT INTO casos_asistente (fecha, contacto_phone, contacto_nombre, duracion_min, mensajes_total, resultado, resumen, bugs_vinculados)
VALUES
  ('2026-04-20', '+56961908322', 'Ingrid Cancino', 120, 35, 'sin_resolver',
   'Pidio camion para despacho Talca->Cordillera CMPC. Diego pregunto los mismos datos 10+ veces, loop de bienvenida 7 veces, mintio sobre capacidades, invento reglas de autorizacion. Terminó sin resultado.',
   ARRAY[1,2,3,16,17,18,19,20]::BIGINT[]);
-- ... Jair, Nicolas ...
```

### `plantillas_mensajes`

```sql
INSERT INTO plantillas_mensajes (campana, destinatario_phone, destinatario_nombre, contexto, texto, estado)
VALUES
  ('difusion-coordinar-equipo', '+56961596938', 'Andrea Rivera', 'caso bolsas Metecno',
   'Andrea, ayer cuando me pediste que Diego te ayudara a escalarme el analisis...',
   'aprobado'),
-- ... 7 filas mas ...
```

### `decisiones_lock`

```sql
INSERT INTO decisiones_lock (codigo, tema, decision, contexto, fecha, decidida_por)
VALUES
  ('C3', 'Curador', 'Diego-Curador IA pre-procesa respuestas crudas, Dusan valida borradores', 'diego-v4.2-spec', '2026-04-20', 'Dusan'),
  ('M2', 'Mensaje al equipo', 'Mensaje explica el problema + invita a entrevistas (combo en un solo envio)', 'diego-v4.2-spec', '2026-04-20', 'Dusan');
-- ... 7 mas ...
```

### `credenciales_requeridas`

```sql
INSERT INTO credenciales_requeridas (nombre, desbloquea, urgencia, vence, obtenida)
VALUES
  ('N8N_API_KEY', ARRAY['P2','P5'], 'critica', NULL, false),
  ('SUPABASE_SERVICE_KEY', ARRAY['anuncio_nombre_visto'], 'alta', NULL, true),
  ('GITHUB_PAT', ARRAY['push','PR'], 'media', '2026-04-27', true);
```

---

## Validaciones post-migracion

```sql
-- Verificar conteos
SELECT 'tareas' AS tabla, COUNT(*) FROM tareas
UNION ALL SELECT 'bugs_asistente', COUNT(*) FROM bugs_asistente
UNION ALL SELECT 'casos_asistente', COUNT(*) FROM casos_asistente
UNION ALL SELECT 'plantillas_mensajes', COUNT(*) FROM plantillas_mensajes
UNION ALL SELECT 'decisiones_lock', COUNT(*) FROM decisiones_lock
UNION ALL SELECT 'credenciales_requeridas', COUNT(*) FROM credenciales_requeridas
UNION ALL SELECT 'workflow_patches', COUNT(*) FROM workflow_patches;

-- Verificar FKs
SELECT c.fecha, c.contacto_nombre, cardinality(c.bugs_vinculados) AS n_bugs
FROM casos_asistente c
ORDER BY c.fecha DESC;

-- Verificar tareas abiertas (equivalente a PENDIENTES.md seccion "Abiertas")
SELECT codigo, titulo, prioridad, estado, proxima_accion, bloqueador
FROM tareas
WHERE estado <> 'cerrada'
ORDER BY
  CASE prioridad
    WHEN 'critica' THEN 1
    WHEN 'alta' THEN 2
    WHEN 'media' THEN 3
    WHEN 'baja' THEN 4
    WHEN 'diferida' THEN 5
  END,
  codigo;
```

---

## Deprecacion de archivos origen

Tras validar migracion exitosa, **NO borrar**, solo marcar:

```markdown
> **MIGRADO a tabla `<nombre>` el YYYY-MM-DD.**
> **Este archivo queda como historial. Nuevas filas -> INSERT en Supabase.**
> **Query equivalente: SELECT * FROM <tabla> WHERE estado<>'cerrada';**
```

Archivos a deprecar tras migracion exitosa:
- [ ] `PENDIENTES.md`
- [ ] `casos-diego/20260420-ingrid.md`
- [ ] `casos-diego/20260420-jair.md`
- [ ] `casos-diego/20260420-nicolas.md`
- [ ] `mensajes-equipo/difusion-coordinar-equipo.md`

Archivos que NO se deprecan (siguen siendo utiles):
- `CLAUDE.md` (instrucciones proyecto)
- `docs/diego-v4.2-spec.md` (spec, narrativa)
- `docs/diego-v4.2-implementacion-21abr.md` (guia paso a paso)
- `CONTINUAR_SESION_DIEGO.txt` (prompt de continuidad — si se migra `sesiones_claude`, entonces si se deprecara)
