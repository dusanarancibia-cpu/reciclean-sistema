# Esquema Dusan Arancibia

> Esquema personal espejo del que armamos para **Diego Alonso** (`docs/diego-v4.2-spec.md`).
> Aqui no describimos un bot: describimos a **Dusan**. Su identidad, rol, objetivos, rutinas, reglas y metricas.
> Sirve como **brief maestro** para cualquier IA / asistente / persona nueva que entre a apoyarlo.
>
> **Autor original del contexto:** Dusan Arancibia
> **Fecha de creacion:** 2026-04-22
> **Version:** v1.1 (alineado con skill `protocolo-datos-unificado`)
>
> ⚠️ **Alineacion con la skill de datos:** Los items estructurales y repetitivos de este
> esquema (objetivos, reglas LOCK, decisiones, stakeholders, KPIs) deben vivir en tablas
> Supabase, NO embebidos en estos `.md`. Los `.md` quedan como narrativa (identidad, estilo,
> rol, rutinas). Ver `ALINEACION-SKILL.md` para el detalle del mapeo y las 5 tablas
> adicionales propuestas para la skill en `tablas/tablas-skill-adicionales.sql`.

---

## Por que existe este esquema

Diego Alonso (el bot) tiene su spec, sus tablas, sus condiciones LOCK, sus casos. Esto le permite que cualquiera (Pablo, Claude, una IA externa) entienda que es, que hace y como responder.

Dusan necesita lo mismo para si mismo. Razones:

1. **Claridad interna** — poner en papel quien es, que hace y que busca ayuda a tomar mejores decisiones diarias.
2. **Onboarding de asistentes IA** — cuando Dusan abre una sesion nueva de Claude / ChatGPT / otra IA, en vez de explicar todo de cero, comparte este esquema.
3. **Onboarding de personas nuevas** — cuando entre un nuevo desarrollador, asistente comercial o socio, este es el documento base para entender con quien trabajan.
4. **Memoria historica** — el mismo problema que tiene Diego (no tiene memoria) lo tiene cualquier IA que entre nueva. Este esquema es la memoria externa de Dusan.
5. **Auditoria personal** — revisar cada 3 meses si las rutinas, objetivos y KPIs siguen alineados.

---

## Estructura de la carpeta

```
esquema-dusan/
  README.md                        # este archivo — entrada principal
  ALINEACION-SKILL.md              # diagnostico de alineacion + plan de migracion a tablas
  01-identidad.md                  # NARRATIVA: quien soy, como me defino
  02-rol-y-responsabilidades.md    # NARRATIVA: que hago, de que me hago cargo
  03-objetivos-y-vision.md         # NARRATIVA + semillas para tabla `objetivos`
  04-rutinas.md                    # NARRATIVA: patrones diarios / semanales / mensuales
  05-condiciones-y-reglas.md       # NARRATIVA + semillas para `decisiones_lock` (reglas R.*)
  06-stakeholders.md               # NARRATIVA + semillas para `contactos` (ya existe)
  07-kpis-y-metricas.md            # NARRATIVA + semillas para tabla `kpis`
  08-decisiones-lock.md            # NARRATIVA + semillas para `decisiones_lock` (T.*, E.*, P.*)
  09-comprension-y-logros.md       # snapshot auditable Bloques A/B/C/D con %
  tablas/
    esquema-sql.sql                # DEPRECADO — apuntador a SQL de la skill
    tablas-skill-adicionales.sql   # 5 tablas nuevas para la skill (objetivos, kpis, kpi_mediciones, sesiones_trabajo, preguntas_abiertas)
  casos-dusan/                     # casos reales (cuando existan, migrar a tabla `casos_asistente`)
    .gitkeep
  rutinas/                         # checklists reutilizables (pre-vuelo, cierre de dia, etc.)
    .gitkeep
```

**Regla operativa tras la skill:** los `.md` explican *por que* y *como*; las tablas Supabase
guardan *cada fila*. Si agregas una decision nueva, va a la tabla `decisiones_lock`, no al
`.md`. El `.md` explica el sistema, no lo duplica.

---

## Orden de lectura recomendado

1. **`01-identidad.md`** — entender a Dusan como persona (valores, estilo, como se define).
2. **`02-rol-y-responsabilidades.md`** — que sombrero usa (Gerente General de Grupo Reciclean-Farex).
3. **`03-objetivos-y-vision.md`** — hacia donde va (fases 2-4 del proyecto, vision 2026-2027).
4. **`05-condiciones-y-reglas.md`** — que respetar siempre.
5. **`07-kpis-y-metricas.md`** — que tablero quiere ver.
6. El resto cuando aplique.

---

## Paralelismo con el esquema Diego

| Diego Alonso (bot)                          | Dusan (persona)                               |
|---------------------------------------------|-----------------------------------------------|
| `docs/diego-v4.2-spec.md`                   | `esquema-dusan/01-identidad.md` + `02..08`    |
| Tabla `procesos_empresa`                    | Tabla `dusan_contexto` (conocimiento base)    |
| Tabla `sesiones_entrevista`                 | Tabla `dusan_sesiones_trabajo`                |
| Tabla `entrevistas_respuestas`              | Tabla `dusan_decisiones` (historial)          |
| Tabla `procesos_borrador` (Diego-Curador)   | Tabla `dusan_pendientes_validacion`           |
| Tabla `vacios_conocimiento`                 | Tabla `dusan_preguntas_abiertas`              |
| Decisiones LOCK (C3, M2, M1.C, D1, etc.)    | `08-decisiones-lock.md`                       |
| `casos-diego/` (fallas reales del bot)      | `casos-dusan/` (casos/aprendizajes propios)   |
| Mensaje M2 al equipo                        | Ver `02-rol-y-responsabilidades.md`           |

---

## Como mantener este esquema vivo

- **Cada 3 meses:** revisar `03-objetivos`, `04-rutinas` y `07-kpis`. Si algo ya no aplica, actualizar.
- **Cuando se toma una decision importante:** agregarla a `08-decisiones-lock.md` con fecha.
- **Cuando un caso te ensena algo:** archivarlo en `casos-dusan/YYYYMMDD-titulo.md`.
- **Cuando cambia el equipo / sucursales / estado Puerto Montt:** actualizar `06-stakeholders.md` y CLAUDE.md.

---

## Uso rapido en nueva sesion de IA

Para iniciar una sesion nueva con Claude / ChatGPT / otra IA pega esto:

```
Lee todo el contenido de esquema-dusan/ en mi repo
dusanarancibia-cpu/reciclean-sistema (branch main).
Ese es mi brief personal. Comienza leyendo el README.md y luego
01-identidad.md. Responde siempre en espanol.
```
