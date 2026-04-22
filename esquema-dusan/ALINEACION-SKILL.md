# Alineacion con skill `protocolo-datos-unificado`

> Analisis hecho 2026-04-22 tras crear esquema-dusan/ y detectar la skill en la rama
> `claude/unified-data-protocol-skill-yYQky`.
> Esta skill exige: **Supabase es la fuente de verdad para todo lo estructural repetitivo.
> Los `.md` son narrativa que no se repite.**

---

## 1. Diagnostico

El `esquema-dusan/` original violaba parcialmente la regla de oro de la skill:
> "Antes de crear un archivo o agregar una seccion repetitiva a un `.md`, preguntar:
>  ¿esto son filas de una tabla? Si la respuesta es si, usar la tabla."

### 1.1. Tablas SQL que se duplicaban con la skill

| Tabla creada                  | Duplicaba                                  | Decision |
|-------------------------------|--------------------------------------------|----------|
| `dusan_contexto`              | (no existe, pero es metadoc, no fila)      | ELIMINADA |
| `dusan_tareas`                | `tareas` (skill)                           | ELIMINADA |
| `dusan_decisiones`            | `decisiones_lock` (skill)                  | ELIMINADA |
| `dusan_casos`                 | `casos_asistente` (skill)                  | ELIMINADA |
| `dusan_stakeholders`          | `contactos` (ya en Supabase)               | ELIMINADA |
| `dusan_pendientes_validacion` | `plantillas_mensajes` (skill) + overlap    | ELIMINADA |

### 1.2. Tablas SQL que SI aportan (no existen en la skill)

Estas quedan y se proponen como **extension de la skill**, usando sus convenciones (snake_case, plural, sin prefijo `dusan_`):

| Tabla (antes)              | Tabla propuesta skill      | Proposito                                     |
|----------------------------|----------------------------|-----------------------------------------------|
| `dusan_objetivos`          | `objetivos`                | O1-O12 con horizonte, fase, deadline          |
| `dusan_kpis`               | `kpis`                     | Catalogo del tablero personal                 |
| `dusan_kpi_mediciones`     | `kpi_mediciones`           | Historial diario de cada KPI                  |
| `dusan_sesiones_trabajo`   | `sesiones_trabajo`         | Bloques de foco, llamadas, implementaciones   |
| `dusan_preguntas_abiertas` | `preguntas_abiertas`       | Decisiones pendientes aun sin LOCK            |

SQL listo en `tablas/tablas-skill-adicionales.sql` (este repo) — para merge con la skill.

### 1.3. Contenido `.md` estructural que deberia migrar a filas

| Archivo esquema-dusan/             | Seccion repetitiva                                | Tabla destino     |
|------------------------------------|---------------------------------------------------|-------------------|
| `03-objetivos-y-vision.md`         | Tabla O1-O12                                      | `objetivos`       |
| `05-condiciones-y-reglas.md`       | R.PUB.1..3, R.TEC.1..5, R.EMP.1..3, R.DIE.1..5, R.IA.1..5 | `decisiones_lock` (como reglas) |
| `06-stakeholders.md`               | Lista 14 personas + 12 clientes + partners        | `contactos` (ampliar columnas)  |
| `07-kpis-y-metricas.md`            | Tabla de KPIs con umbrales                        | `kpis`            |
| `08-decisiones-lock.md`            | Filas T.01-T.06, E.01-E.06, C3..D4.a, P.01-P.06   | `decisiones_lock` |
| `09-comprension-y-logros.md`       | Bloques A/B/C/D (filas)                           | queda como snapshot auditable; opcional migrar a `tareas` + `objetivos` si se quiere trackear |

### 1.4. `.md` que quedan como narrativa (no migran)

- `README.md` — entrada + paralelismo Diego.
- `01-identidad.md` — quien soy, valores, estilo, frase ancla.
- `02-rol-y-responsabilidades.md` — narrativa del rol (las sub-tablas son explicacion, no operativas).
- `04-rutinas.md` — narrativa de patrones (no son filas).
- `ALINEACION-SKILL.md` (este archivo).

---

## 2. Que cambio en el commit de alineacion

1. **`esquema-dusan/tablas/esquema-sql.sql`** reducido de 11 a 0 tablas (todas eliminadas por ser duplicados o innecesarias). El archivo queda como historial + apuntador a la skill.
2. **`esquema-dusan/tablas/tablas-skill-adicionales.sql`** (nuevo) — 5 tablas en formato skill para que se integren al proximo release de la skill.
3. **`esquema-dusan/README.md`** actualizado para referir a la skill como fuente de verdad.

No se modifican los `.md` 01-09 todavia — migran cuando Dusan ejecute el `MIGRAR.md` de la skill (eso requiere correr primero `sql/20260422_tablas_base_protocolo.sql` en Supabase).

---

## 3. Orden de ejecucion alineado con la skill

Cuando Dusan decida ejecutar:

1. Correr `sql/20260422_tablas_base_protocolo.sql` de la skill (7 tablas base).
2. Correr `esquema-dusan/tablas/tablas-skill-adicionales.sql` (5 tablas adicionales).
3. Seguir `MIGRAR.md` de la skill para mover `PENDIENTES.md`, `casos-diego/`, `mensajes-equipo/`.
4. Migrar seccion por seccion de los `.md` 03, 05, 06, 07, 08 de `esquema-dusan/` a las tablas correspondientes (INSERTs, dejando los `.md` como narrativa + link a la query).

Despues de eso, para agregar un objetivo / KPI / decision nueva → INSERT en la tabla, NO editar el `.md`. El `.md` queda solo para contexto narrativo.

---

## 4. Si la skill acepta las 5 tablas propuestas

Idealmente, el archivo `tablas-skill-adicionales.sql` se merge con el SQL base de la skill, quedando `sql/20260422_tablas_base_protocolo.sql` con 12 tablas en total, y `TABLAS.md` de la skill sumaria las 5 nuevas en su seccion 3 (tablas propuestas).

Hasta entonces, el SQL adicional vive aqui en `esquema-dusan/tablas/` como stage area.
