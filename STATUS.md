# STATUS — Reciclean-Farex Sistema

> **Snapshot textual de la tabla `temas_en_progreso` en Supabase.**
> Este archivo es la respuesta canónica a "¿cómo vamos? / status / qué tenemos en curso".
> **Última regeneración:** 22-abr-2026 11:40

---

## Cómo usarlo desde otra IA (Claude.ai, Gemini, ChatGPT)

Pega este prompt al inicio del chat o úsalo on demand:

```
Fetchea https://raw.githubusercontent.com/dusanarancibia-cpu/reciclean-sistema/main/STATUS.md
y devuélveme el contenido formateado. Cada vez que te diga "status" o "cómo vamos",
vuelve a fetchear y muéstrame la tabla actualizada.
```

---

## Leyenda de bandas (rúbrica %)

| Banda | Rango | Significa |
|---|---|---|
| 💡 Diseño | 0-19% | Idea planteada, sin spec formal |
| 📋 Spec | 20-39% | Documento/propuesta escrito |
| 🔨 Build | 40-59% | En implementación activa |
| 🧪 Validado técnico | 60-79% | Pasa smoke tests / funciona en dev |
| 🔍 Revisión | 80-99% | Peer review / QA / aprobación Dusan |
| ✅ Superado | 100% | Live en prod, revisión y validación superada |

**Regla dura:** 100% requiere revisión y validación externa superada + 0 pendientes.

---

## Temas activos (ordenados por bloqueadores + %)

| Código | Título | % | Banda | Owner | Siguiente acción / bloqueador |
|---|---|---|---|---|---|
| **I-04** | Capa tracking iniciativas — tabla `temas_en_progreso` | **90%** | 🔍 Revisión | Claude | ⚠️ Pendiente validación cross-surface por Dusan + wireado n8n por Pablo post 26-abr |
| **I-03** | Evaluación 9 herramientas BI — chat externo Gemini | **20%** | 📋 Spec | Dusan | ⚠️ Análisis Gemini genérico, no considera restricciones proyecto |
| **I-01** | Inventario 84 tablas Supabase + mapa relaciones | **30%** | 📋 Spec | Dusan | Mapear FKs reales + diagrama ER + decidir RLS de tablas particionadas |
| **I-02** | Diseño visual de informes (capa reportería) | **10%** | 💡 Diseño | Dusan | Decidir consumidor/herramienta según matriz (CEO / supervisor / comercial) |

---

## Temas bloqueados (atención inmediata)

| Código | Bloqueador | Desbloqueo estimado |
|---|---|---|
| I-04 | Pablo wirea nodo n8n Diego para write access | 26-abr (regreso Pablo) |
| I-03 | Falta contrastar análisis externo contra contexto Reciclean | Pendiente decisión Dusan A/B/C/D/E/Z |

---

## Cómo consultar este status desde otras superficies

| Superficie | Método |
|---|---|
| **PC Claude Code** | Pregunta "status" — consulta `v_status_consolidado` automáticamente |
| **Claude.ai web / Mobile app** | Fetchea el raw URL de este archivo (arriba el prompt) |
| **WhatsApp Diego** | Escribe "status" — Diego queryea `v_status_consolidado` (activo post 26-abr) |
| **Supabase Studio** | `SELECT * FROM v_status_consolidado;` |

---

## Cómo se actualiza

- **Claude Code** (Supabase MCP): cuando Dusan trabaja un tema desde PC
- **Diego** (n8n → Supabase): vía agente WhatsApp, activo post 26-abr
- **Manual**: Dusan vía Supabase Studio si necesita corrección puntual

Cada UPDATE actualiza `fecha_ultimo_update` automáticamente (trigger `trg_temas_touch`).

---

## Fuente de verdad

**Tabla:** `public.temas_en_progreso`
**Proyecto Supabase:** `eknmtsrtfkzroxnovfqn`
**Vista canónica:** `public.v_status_consolidado`

Si este archivo y la tabla divergen, **la tabla manda**. Regenera este archivo consultando la vista.

---

_Repo público sin datos sensibles. Si un tema futuro incluye info confidencial (márgenes, clientes, salarios), NO se publica aquí — se mueve a endpoint autenticado post 26-abr cuando Pablo monte la edge function Vercel._
