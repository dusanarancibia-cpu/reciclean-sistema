# STATUS — Reciclean-Farex Sistema

> **Snapshot de `temas_en_progreso` (Supabase).** Respuesta canónica a "status / cómo vamos / detalle".
> **Última regeneración:** 22-abr-2026 12:50

---

## Uso desde otra IA (Claude.ai, Gemini, ChatGPT)

```
Fetchea https://raw.githubusercontent.com/dusanarancibia-cpu/reciclean-sistema/main/STATUS.md
y muéstrame el contenido. Cada vez que te diga "status" o "cómo vamos",
vuelve a fetchear y dame la tabla actualizada.
```

---

## Leyenda bandas (rúbrica %)

| Banda | Rango | Significa |
|---|---|---|
| 💡 Diseño | 0-19% | Idea planteada |
| 📋 Spec | 20-39% | Documento/propuesta |
| 🔨 Build | 40-59% | Implementación activa |
| 🧪 Validado | 60-79% | Pasa smoke tests |
| 🔍 Revisión | 80-99% | Peer review / QA |
| ✅ Superado | 100% | Live + revisión superada |

---

## Temas activos (11 columnas)

| Código | % | Depto | Responsable | Tema (≤15) | Tiempo | ▶️ | Depende | Delegar a | % ocup. | Banda · Siguiente |
|---|---|---|---|---|---|---|---|---|---|---|
| **I-04** | 90% | Gerencia General | Claude | Tracker temas | 30min | 🔥 Sí | — | Pablo | 0% | 🔍 Revisión · Pablo wirea n8n post 26-abr |
| **I-05** | 30% | Tecnología | Claude | Panel temas | 3h | ⏸️ | I-04 | Pablo | 0% | 📋 Spec · Esperando green light para build |
| **I-03** | 20% | Tecnología | Dusan | Eval BI tools | 2h | ⏸️ | — | Pablo | 0% | 📋 Spec · Contrastar con contexto Reciclean |
| **I-06** | 15% | Gerencia General | Dusan | Ecosistema int. | 1sem | ⏸️ | — | Pablo | 0% | 💡 Diseño · Overlap con I-02/I-03 — decidir consolidar post 30-abr |
| **I-01** | 30% | Tecnología | Claude | Mapa BD + FKs | 1h | ⏸️ | — | — | — | 📋 Spec · Mapear FKs + ER + RLS |
| **I-02** | 10% | Gerencia General | Dusan | Viz informes | 2sem | ⏸️ | I-03 | Ingrid | 0% | 💡 Diseño · Decidir consumidor/herramienta |

**Total:** 6 activos · 0 superados · 3 con bloqueadores (I-04, I-05, I-06)

---

## Explicación de columnas

| # | Columna | Contenido |
|---|---|---|
| 1 | **Código** | ID único (I-NN) |
| 2 | **%** | Grado de avance (0-100) |
| 3 | **Depto** | Departamento responsable (10 definidos) |
| 4 | **Responsable línea** | Persona que ejecuta ESTA tarea |
| 5 | **Tema (≤15)** | Nombre corto |
| 6 | **Tiempo** | Estimado para terminar |
| 7 | **▶️** | 🔥 Sí = ejecutar ahora · ⏸️ = espera · ✅ = hecha |
| 8 | **Depende** | Códigos de tareas previas requeridas |
| 9 | **Delegar a** | Candidato para aliviar al responsable |
| 10 | **% ocup.** | Ocupación actual del candidato a delegado |
| 11 | **Banda · Siguiente** | Estado visual + próxima acción o bloqueador |

---

## Temas capturados desde chats externos (regla 3A)

| Código | Chat externo | Fecha |
|---|---|---|
| I-03 | Gemini — Eval 9 herramientas BI | 22-abr 10:56 |
| I-06 | Gemini — Ecosistema integrado con Diego | 22-abr 12:40 |

Archivos respaldados en `7_backup-prompts/sesiones/`.

---

## Departamentos definidos (10)

1. Gerencia General · 2. Operaciones · 3. Comercial · 4. Abastecimiento · 5. Logística · 6. Finanzas y Administración · 7. Tecnología · 8. Recursos Humanos · 9. Legal y Compliance · 10. Sostenibilidad

---

## Cómo consultar desde cualquier superficie

| Superficie | Método |
|---|---|
| PC Claude Code | Pregunta "status" → consulta `v_status_consolidado` |
| Claude.ai web / mobile | Fetchea raw URL de este archivo |
| GitHub rendered (bookmark) | [github.com/.../blob/main/STATUS.md](https://github.com/dusanarancibia-cpu/reciclean-sistema/blob/main/STATUS.md) |
| WhatsApp Diego | Pregunta "status" — activo post 26-abr (Pablo wirea) |
| Dashboard interactivo | `reciclean-sistema.vercel.app/status.html` — **build pendiente (I-05)** |
| Supabase Studio | `SELECT * FROM v_status_consolidado;` |

---

## Fuente de verdad

**Tabla:** `public.temas_en_progreso`
**Vistas:** `v_status_consolidado` (display) · `v_delegaciones_propuestas` (para panel HTML) · `v_temas_activos` · `v_temas_bloqueados`
**Proyecto Supabase:** `eknmtsrtfkzroxnovfqn`

Si este archivo y la tabla divergen, la tabla manda.

---

_Repo público sin datos sensibles. Contenido comercial/salarios/márgenes nunca se publica aquí — se mueve a endpoint autenticado post 26-abr con edge function Vercel._
