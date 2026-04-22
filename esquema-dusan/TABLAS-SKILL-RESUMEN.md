# Tablas del protocolo unificado — vista consolidada

> Resumen de todas las tablas que resultan cuando se fusiona el SQL base de la skill
> `protocolo-datos-unificado` con las 5 tablas adicionales propuestas por este esquema.
>
> **Total: 12 tablas nuevas** sobre las 19 ya existentes en Supabase (materiales, precios,
> clientes_compradores, etc.) + 5 en creacion de Diego v4.2 (procesos_empresa, etc.).
>
> Fuente de verdad: Supabase `eknmtsrtfkzroxnovfqn`. Fecha de corte: 2026-04-22.

---

## Tabla maestra — 12 tablas del protocolo unificado

| # | Tabla                      | Origen  | Columnas clave                                                          | Reemplaza archivo                                   |
|---|----------------------------|---------|-------------------------------------------------------------------------|-----------------------------------------------------|
| 1 | `tareas`                   | skill   | codigo, titulo, prioridad, estado, proxima_accion, bloqueador, branch   | `PENDIENTES.md` seccion Abiertas                    |
| 2 | `casos_asistente`          | skill   | fecha, contacto, duracion_min, resultado, resumen, bugs_vinculados      | `casos-diego/*.md`                                  |
| 3 | `bugs_asistente`           | skill   | numero, titulo, categoria, severidad, usuarios_confirmados, estado      | `PENDIENTES.md` P5 lista 1-28                       |
| 4 | `plantillas_mensajes`      | skill   | campana, destinatario, texto, estado, enviado_at                        | `mensajes-equipo/*.md`                              |
| 5 | `workflow_patches`         | skill   | workflow_id, version_from, version_to, backup_path, smoke_test_resultado| `7_backup-prompts/incidentes/*.json` metadata       |
| 6 | `decisiones_lock`          | skill   | codigo, tema, decision, fecha, decidida_por, revertible                 | `docs/diego-v4.2-spec.md` tabla LOCK + esquema-dusan 05/08 |
| 7 | `credenciales_requeridas`  | skill   | nombre, desbloquea[], urgencia, obtenida, notas                         | `CONTINUAR_SESION_DIEGO.txt` seccion credenciales   |
| 8 | `objetivos`                | esquema-dusan | codigo, titulo, horizonte, fase_proyecto, deadline, estado       | `esquema-dusan/03-objetivos-y-vision.md` O1-O12     |
| 9 | `kpis`                     | esquema-dusan | nombre, fuente, query_sql, umbrales verde/amarillo/rojo, frecuencia | `esquema-dusan/07-kpis-y-metricas.md` catalogo   |
| 10| `kpi_mediciones`           | esquema-dusan | kpi_id, fecha, valor, estado_semaforo                            | (historial diario — no existia)                     |
| 11| `sesiones_trabajo`         | esquema-dusan | titulo, tipo, inicio, fin, usuario, objetivo, resultado, aviso_grupo_enviado | (registro sesiones — no existia)          |
| 12| `preguntas_abiertas`       | esquema-dusan | pregunta, bloqueada_por, urgencia, resuelta, decision_codigo     | (decisiones pendientes — no existia)                |

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

### Tablas esquema-dusan (5 propuestas)

- **`objetivos`** → query "que objetivos tengo pendientes a 30d / 3-6m / 6-12m". Fase 2/3/4 clara.
- **`kpis`** → catalogo del tablero personal con umbrales verde/amarillo/rojo.
- **`kpi_mediciones`** → Diego-Curador puede escribir aqui los numeros del dia y construir trend de semaforos.
- **`sesiones_trabajo`** → auditar cuantas sesiones de implementacion LIVE hubo, si se respeto la regla "aviso al grupo" (campo `aviso_grupo_enviado`), metrica P.03 de decisiones_lock.
- **`preguntas_abiertas`** → decisiones aun no tomadas con deadline. Cuando se resuelve, `decision_codigo` apunta a la fila de `decisiones_lock` que consolido.

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
2. SQL adicional esquema-dusan (5 tablas): `esquema-dusan/tablas/tablas-skill-adicionales.sql`
3. SQL Diego v4.2 (5 tablas): `docs/diego-v4.2-implementacion-21abr.md` Fase 1
4. Migracion de datos: seguir `.claude/skills/protocolo-datos-unificado/MIGRAR.md`
5. Migracion de secciones `esquema-dusan/*.md` estructurales a las nuevas tablas.

Total tras ejecutar todo: **17 tablas existentes + 7 skill base + 5 esquema-dusan + 5 Diego v4.2 = 34 tablas**.
