# Tablas del protocolo unificado — vista consolidada

> Resumen de todas las tablas que resultan cuando se fusiona el SQL base de la skill
> `protocolo-datos-unificado` con las 7 tablas adicionales propuestas por este esquema.
>
> **Total: 14 tablas nuevas** sobre las 19 ya existentes en Supabase (materiales, precios,
> clientes_compradores, etc.) + 5 en creacion de Diego v4.2 (procesos_empresa, etc.).
>
> Fuente de verdad: Supabase `eknmtsrtfkzroxnovfqn`. Fecha de corte: 2026-04-22.
>
> **Principio de esta vista:** cada tabla tiene una columna `md_asociado` que apunta al
> archivo narrativo que la explica. A la inversa, cada `.md` es una fila en `documentos` con
> columna `tabla_espejo`. **No duplicamos contenido — nos referenciamos cruzadamente.**

---

## Tabla maestra — 14 tablas del protocolo unificado

| # | Tabla                      | Origen  | Columnas clave                                                          | Reemplaza archivo                                   | `md_asociado` (narrativa que la explica) |
|---|----------------------------|---------|-------------------------------------------------------------------------|-----------------------------------------------------|------------------------------------------|
| 1 | `tareas`                   | skill   | codigo, titulo, prioridad, estado, proxima_accion, bloqueador, branch   | `PENDIENTES.md` seccion Abiertas                    | `PENDIENTES.md`                          |
| 2 | `casos_asistente`          | skill   | fecha, contacto, duracion_min, resultado, resumen, bugs_vinculados      | `casos-diego/*.md`                                  | `casos-diego/*.md` (uno por caso)        |
| 3 | `bugs_asistente`           | skill   | numero, titulo, categoria, severidad, usuarios_confirmados, estado      | `PENDIENTES.md` P5 lista 1-28                       | `PENDIENTES.md` seccion P5               |
| 4 | `plantillas_mensajes`      | skill   | campana, destinatario, texto, estado, enviado_at                        | `mensajes-equipo/*.md`                              | `mensajes-equipo/difusion-coordinar-equipo.md` |
| 5 | `workflow_patches`         | skill   | workflow_id, version_from, version_to, backup_path, smoke_test_resultado| `7_backup-prompts/incidentes/*.json` metadata       | `docs/diego-v4.2-implementacion-21abr.md` |
| 6 | `decisiones_lock`          | skill   | codigo, tema, decision, fecha, decidida_por, revertible                 | `docs/diego-v4.2-spec.md` tabla LOCK + esquema-dusan 05/08 | `esquema-dusan/05-condiciones-y-reglas.md` + `esquema-dusan/08-decisiones-lock.md` + `docs/diego-v4.2-spec.md` |
| 7 | `credenciales_requeridas`  | skill   | nombre, desbloquea[], urgencia, obtenida, notas                         | `CONTINUAR_SESION_DIEGO.txt` seccion credenciales   | `CONTINUAR_SESION_DIEGO.txt`             |
| 8 | `objetivos`                | esquema-dusan | codigo, titulo, horizonte, fase_proyecto, deadline, estado       | `esquema-dusan/03-objetivos-y-vision.md` O1-O12     | `esquema-dusan/03-objetivos-y-vision.md` |
| 9 | `kpis`                     | esquema-dusan | nombre, fuente, query_sql, umbrales verde/amarillo/rojo, frecuencia | `esquema-dusan/07-kpis-y-metricas.md` catalogo   | `esquema-dusan/07-kpis-y-metricas.md`    |
| 10| `kpi_mediciones`           | esquema-dusan | kpi_id, fecha, valor, estado_semaforo                            | (historial diario — no existia)                     | `esquema-dusan/07-kpis-y-metricas.md`    |
| 11| `sesiones_trabajo`         | esquema-dusan | titulo, tipo, inicio, fin, usuario, objetivo, resultado, aviso_grupo_enviado | (registro sesiones — no existia)          | `esquema-dusan/04-rutinas.md`            |
| 12| `preguntas_abiertas`       | esquema-dusan | pregunta, bloqueada_por, urgencia, resuelta, decision_codigo     | (decisiones pendientes — no existia)                | `esquema-dusan/08-decisiones-lock.md` (se consolida aqui tras resolver) |
| 13| **`documentos`**           | esquema-dusan | path, titulo, categoria, proposito, tabla_espejo, ultima_revision, activo | (catalogo de .md/.txt narrativos)                 | `esquema-dusan/README.md` + este resumen |
| 14| **`estilo_respuesta_claude`** | esquema-dusan | codigo, categoria, plataforma, formato_default, longitud_default, incluye_proximo_paso/rollback | (reglas de como Claude responde)                 | `esquema-dusan/11-estilo-respuesta-claude.md` |

---

## Relacion bidireccional `.md` <-> tablas

Cada archivo narrativo del repo tiene representacion en la tabla `documentos`. Cada
fila de una tabla estructural puede apuntar a un archivo narrativo via `md_asociado`.
Esto permite:

- **Desde un `.md`:** "¿que tabla contiene los datos que este archivo explica?"
  → `SELECT tabla_espejo FROM documentos WHERE path = 'esquema-dusan/03-objetivos-y-vision.md';`
- **Desde una tabla:** "¿donde esta la narrativa que contextualiza esta tabla?"
  → columna `md_asociado` en la tabla maestra + `SELECT * FROM documentos WHERE tabla_espejo = 'objetivos';`
- **Para auditoria:** `SELECT path, tabla_espejo, ultima_revision FROM documentos WHERE activo = true;`
  da el inventario completo de documentos del proyecto con su tabla espejo.

**Regla de complemento (no duplicacion):**
- El `.md` explica el **por que** y el **como**. No contiene la lista de items.
- La tabla contiene **cada item** como fila. No contiene explicaciones generales.
- La columna `md_asociado` / `tabla_espejo` los liga sin copiarse.

---

## Lo que cada tabla habilita

### Tablas skill base (7)

- **`tareas`** → `SELECT` status de todos los pendientes por prioridad / estado / bloqueador. Adios `PENDIENTES.md` como fuente primaria.
- **`casos_asistente`** → query tipo "cuantos casos 'sin_resolver' esta semana / por contacto / por sucursal".
- **`bugs_asistente`** → tablero de bugs Diego con severidad, estado y usuarios que los confirmaron.
- **`plantillas_mensajes`** → trazabilidad: que mensajes se mandaron, a quien, cuando, si respondieron.
- **`workflow_patches`** → historial versionado de Diego LIVE con smoke-test y link al backup.
- **`decisiones_lock`** → una tabla para TODAS las decisiones LOCK (Diego v4.2 C3/M2/... + esquema-dusan T/E/P/R + reglas R.PUB/R.TEC/R.DIE/R.IA).
- **`credenciales_requeridas`** → tracker de que falta tener a mano (N8N_API_KEY, GITHUB_PAT, etc.) y que desbloquea cada una.

### Tablas esquema-dusan (7 propuestas)

- **`objetivos`** → query "que objetivos tengo pendientes a 30d / 3-6m / 6-12m". Fase 2/3/4 clara.
- **`kpis`** → catalogo del tablero personal con umbrales verde/amarillo/rojo.
- **`kpi_mediciones`** → Diego-Curador puede escribir aqui los numeros del dia y construir trend de semaforos.
- **`sesiones_trabajo`** → auditar cuantas sesiones de implementacion LIVE hubo, si se respeto la regla "aviso al grupo" (campo `aviso_grupo_enviado`), metrica P.03 de decisiones_lock.
- **`preguntas_abiertas`** → decisiones aun no tomadas con deadline. Cuando se resuelve, `decision_codigo` apunta a la fila de `decisiones_lock` que consolido.
- **`documentos`** → catalogo maestro de todo archivo narrativo (.md / .txt) con su tabla espejo si aplica. Es la "vista de existencia" que dice donde vive cada narrativa y que tabla la complementa.
- **`estilo_respuesta_claude`** → codifica como Dusan quiere que Claude entregue informacion en TODAS las plataformas (CLI, Web, Claude.ai, API, movil, IDE). Permite que cualquier agente lea estas reglas antes de responder. Categorias: principio, tipo_pedido, plataforma, trigger, antipatron, patron, checklist.

---

## FKs y relaciones entre las 12

```
tareas.depende_de[]              -> tareas.id
casos_asistente.bugs_vinculados[] -> bugs_asistente.id
bugs_asistente.casos_evidencia[]  -> casos_asistente.id
workflow_patches.bugs_resueltos[] -> bugs_asistente.id
workflow_patches.tareas_vinculadas[] -> tareas.id
credenciales_requeridas.desbloquea[] -> tareas.codigo (soft)

objetivos.tareas_vinculadas[]    -> tareas.id
kpi_mediciones.kpi_id            -> kpis.id  (FK dura, CASCADE)
sesiones_trabajo.tareas_vinculadas[] -> tareas.id
sesiones_trabajo.caso_id         -> casos_asistente.id  (FK, SET NULL)
preguntas_abiertas.decision_codigo -> decisiones_lock.codigo (soft)
```

---

## Tablas RELEVANTES que YA existen (no se tocan, solo se linkean)

| Tabla           | Para que sirve desde el protocolo                           |
|-----------------|-------------------------------------------------------------|
| `contactos`     | Whitelist equipo. Reemplaza `esquema-dusan/06-stakeholders.md`. Ampliar con `tipo`, `criticidad` si se quiere. |
| `conversaciones`| Log Diego <-> equipo. Fuente de `kpis` Fase 1.             |
| `usuarios_autorizados` | Login Panel Admin.                                  |
| `materiales`, `sucursales`, `precios*`, `clientes_compradores` | Core operativo, no se migra. |

---

## Orden de creacion sugerido

1. SQL base skill (7 tablas): `.claude/skills/protocolo-datos-unificado/sql/20260422_tablas_base_protocolo.sql`
2. SQL adicional esquema-dusan (6 tablas): `esquema-dusan/tablas/tablas-skill-adicionales.sql`
3. SQL Diego v4.2 (5 tablas): `docs/diego-v4.2-implementacion-21abr.md` Fase 1
4. Seed inicial de `documentos` (descomentar el bloque `INSERT INTO documentos` del archivo del paso 2). Da la fotografia del repo en el momento de activar la skill.
5. Migracion de datos: seguir `.claude/skills/protocolo-datos-unificado/MIGRAR.md`
6. Migracion de secciones `esquema-dusan/*.md` estructurales a las nuevas tablas. Actualizar `documentos.tabla_espejo` cuando cada `.md` termine su migracion.

Total tras ejecutar todo: **17 tablas existentes + 7 skill base + 6 esquema-dusan + 5 Diego v4.2 = 35 tablas**.

---

## Mantener el catalogo `documentos` al dia

Cuando se crea un archivo narrativo nuevo:

```sql
INSERT INTO documentos (path, titulo, categoria, proposito, tabla_espejo, ultima_revision)
VALUES ('docs/nueva-spec.md', 'Titulo', 'spec', '1 frase', 'nombre_tabla_si_aplica', CURRENT_DATE);
```

Cuando se deprecia un archivo:

```sql
UPDATE documentos SET activo = false, notas = 'razon del deprecado' WHERE path = '...';
```

Query de inventario:

```sql
SELECT path, titulo, categoria, tabla_espejo, ultima_revision
FROM documentos
WHERE activo = true
ORDER BY categoria, path;
```
