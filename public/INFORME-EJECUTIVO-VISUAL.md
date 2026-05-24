# INFORME EJECUTIVO VISUAL — Grupo Reciclean-Farex-SERCOT

> **Para qué sirve este archivo:** una sola hoja donde cualquier PC (o cualquier Claude que arranque mañana) entiende en 3 minutos las pautas visuales y reglas operativas grabadas a fuego por Dusan. Es un mapa, no un manual — cada sección apunta al archivo canónico para el detalle.
>
> **Fuente canónica de cada regla** indicada explícitamente al final de cada sección. **Triple respaldo** vigente (ver §9).
>
> **Última actualización:** 2026-05-23 — PC Dusan.

---

## 1 · Pauta Visual Oro (`visual_standard_v1`)

Identidad visual del grupo. **No se discute por turno** — se aplica.

- **Paleta**: verde principal `#059669` · alternos `#2563eb` `#ea580c` `#9333ea` · alertas `#dc2626` `#d97706`
- **Fondos**: `#ffffff` / `#f8fafc` / `#f1f5f9` · **Texto**: `#0f172a` / `#475569` / `#94a3b8`
- **Tipografía**: Inter (fallback Calibri / Arial). Sin Comic Sans, sin serif decorativa.
- **KPI cards**: número 2.5rem bold `#0f172a` · etiqueta 10px mayúsculas tracking-wider `#64748b` · sparkline 40px del color de la tarjeta · variación con badge fondo al 15%.
- **Secciones**: bordes redondeados 16px · padding 24px · separación 24px · títulos 1rem semibold.
- **Animaciones**: fade-in 0.3s · hover sube 2px con sombra 0.15s. Sin rebotes ni efectos decorativos.

> **Fuente canónica:** `reciclean-sistema/public/CLAUDE-VISUAL.md` · **Supabase:** `panel.config_ui.visual_standard_v1` · **Skill:** `visual-oro`.

---

## 2 · Catálogo Visual Universal (`catalogo_visual_v1`)

Decisor por tipo de dato — qué gráfico usar sin pensarlo dos veces.

| Si el dato es… | Visualización | Librería |
|---|---|---|
| Serie temporal 1 métrica | Línea | Chart.js |
| Series temporales múltiples (2-5) | Líneas múltiples | Chart.js |
| Comparación pocos ítems (2-7) | Barras verticales | Chart.js |
| Comparación muchos (8-25) | Barras horizontales | Chart.js |
| Ranking top-N | Tarjetas Top 5/10 + barra fina 4px | HTML/CSS |
| Distribución 3-6 categorías | Donut 65% | Chart.js |
| Distribución >6 categorías | Treemap | ECharts / D3 |
| Correlación 2 variables | Scatter | Chart.js |
| Correlación 3 variables | Bubble | Chart.js |
| Flujo entre nodos | Sankey | ECharts |
| Geografía marcadores | Leaflet + CartoDB Positron | Leaflet |
| Avance vs meta | Bullet o barra progreso 4px | D3 / HTML |
| Estado actual + variación | KPI card + sparkline + badge | HTML/CSS |
| Denso temporal | Heatmap calendar | D3 |
| 1-2 valores únicos | **Texto, no gráfico** | — |

**Cuándo NO graficar**: 1-2 valores, <3 puntos en serie, ruido sin patrón, orden importa más que forma (→ tabla).

> **Fuente canónica:** `reciclean-rdo/mayordomo/skills/visual-oro/CATALOGO-VISUAL-UNIVERSAL.md` · **Espejo:** `reciclean-sistema/public/CATALOGO-VISUAL-UNIVERSAL.md` · **Supabase:** `panel.config_ui.catalogo_visual_v1`.

---

## 3 · Configuración Chart.js / Leaflet (lo que llaman "Guía de Gráficos")

**Honestidad:** no existe archivo `GUIA-GRAFICOS.md` independiente. La guía Chart.js vive distribuida en `CLAUDE-VISUAL.md § Gráficos` + el catálogo de §2. Recopilada acá:

- **Chart.js — config no negociable:**
  - Sin leyenda cuadrada. Leyenda **abajo centrada con círculos**.
  - Líneas curvas `tension: 0.4`, área sombreada debajo al **20% opacidad**.
  - Sin grid vertical. Solo líneas horizontales `#e2e8f0`.
  - Tipografía Inter 11px.
  - Barras `borderRadius: 6`.
  - Donut **agujero 65%**, sin borde entre segmentos.
- **Leaflet:**
  - Tema claro CartoDB Positron.
  - Marcadores circulares borde blanco + relleno corporativo.
  - Sin popups invasivos — solo tooltip al hover.
- **Top 5/N (HTML)**: ícono grande + nombre + valor en verde + barra progreso fina 4px. Hover sombra suave.

> **Fuente canónica:** `reciclean-sistema/public/CLAUDE-VISUAL.md § Gráficos · § Mapa · § Top 5`.

---

## 4 · Modo Autónomo Continuo v1.0

Régimen permanente firmado por Dusan 2026-05-19.

- **Horario**: 8:30 AM → 7:30 AM día siguiente (**23 horas**). Sin preguntas en ese rango.
- **Loop**: avanzar → verificar → documentar → avanzar.
- **Si algo bloquea**: registrar en `BLOQUEOS.md` + seguir con la próxima tarea.
- **Si falta dato Supabase**: placeholder visible (`—` o `pendiente`) + anotar en `PENDIENTES-DATOS.md`.
- **Si no es seguro si algo rompe**: conservar (no borrar).
- **Restricciones absolutas durante el loop**: no tocar funciones que conectan con Supabase del panel original · no modificar auth · **no hacer commit/push sin autorización explícita** · no tocar `package.json` / `vercel.json` / `vite.config.js` · no duplicar archivos críticos sin avisar.

> **Fuente canónica:** `reciclean-sistema/public/CLAUDE-VISUAL.md § Modo autónomo continuo v1.0`.

---

## 5 · Reglas de Coherencia entre PCs

**Antes de declarar "PC X inactivo" cruzar 3 fuentes:**

1. `panel.pc_heartbeat` (último latido).
2. `BITACORA-CIERRE.md` (última tarea cerrada por ese PC).
3. **Actividad GitHub** (commits / PRs abiertos o mergeados en últimas 24h).

**Solo si LAS 3 muestran inactividad**, reportar: *"PC X sin actividad detectable en las últimas X horas. Puede estar en otra sesión o tarea manual."*

**NUNCA** decir *"PC X no trabaja"* / *"PC X está parado"* si hay evidencia de actividad real. Si heartbeat está vencido pero hay commits, el heartbeat está desactualizado — anotarlo en `BLOQUEOS.md`, no bloquear ni reasignar trabajo.

> **Fuente canónica:** `reciclean-rdo/mayordomo/COMO-TRABAJAR.md § Reglas de coherencia entre PCs`.

---

## 6 · Regla de Autorización Previa (cambios UI)

Grabada por Dusan 2026-05-20 20:15. Aplica a cualquier `.html`, `.css`, `.js` de UI o assets en `public/`. **No aplica** a docs `.md`, migraciones SQL, Edge Functions sin UI.

**Flujo obligatorio:**

1. Cambio en local sobre rama feature.
2. Levantar `npm run dev` → suele ser `localhost:5173`.
3. **Mostrar URL `localhost:5173/panel-rdo.html`** a Dusan para que pruebe en su navegador.
4. **Esperar confirmación explícita** que lo vio y funciona.
5. **Recién entonces** `git push` + abrir PR contra `main`.

**Razón:** preview Vercel tarda 1-2 min y queda público; localhost es instantáneo y privado. Permite iterar 5 veces antes del primer push.

**Excepción explícita:** si Dusan dice *"pusheá directo"* o *"abrí el PR sin probar"* en el mismo turno, se respeta — pero se anota en bitácora que se saltó localhost.

> **Fuente canónica:** `reciclean-sistema/public/CLAUDE-VISUAL.md § REGLA DE AUTORIZACIÓN`.

---

## 7 · Regla de Interrupción Segura

Grabada por Dusan 2026-05-22.

Si en cualquier momento el usuario escribe **`PARAR`** o **`NUEVA TAREA`**, el PC debe:

1. **Interrumpir inmediatamente** el loop actual (cualquier loop, incluso autónomo continuo).
2. Guardar el estado en `mayordomo/AVANCE-AUTONOMO.md` (qué hacía, dónde cortó, próximo paso si retoma).
3. Quedar en **stand-by** esperando nuevas instrucciones.

**Aplica aunque esté en autónomo continuo.** Sin importar la prioridad de la tarea en curso ni si está a 30 segundos de terminar.

> **Fuente canónica:** `reciclean-rdo/mayordomo/COMO-TRABAJAR.md` + `reciclean-sistema/public/CLAUDE.md` · **Supabase:** `panel.config_ui.regla_interrupcion_segura_v1`.

---

## 8 · Sistema 6W (Bandeja Diego)

Mecanismo de mensajería entre Diego y los PCs. Cada mensaje en `panel.diego_bandeja` lleva los 6 campos: **what · who · when · where · why · how**.

**Protocolo por PC al iniciar sesión:**

1. Consultar `panel.v_diego_pendientes` filtrando por nombre de PC.
2. Para cada mensaje, ejecutar la acción declarada en el campo `how_*`.
3. Al cerrar, UPDATE en `panel.diego_bandeja`:
   ```sql
   UPDATE panel.diego_bandeja
   SET estado='resuelto', cerrado_en=now(),
       nota_resolucion='qué hice + link a commit/archivo'
   WHERE id = <ID>;
   ```
4. Si un mensaje no tiene responsable claro → asignarlo al PC adecuado según las 6W o derivarlo a PC1.

**Trazabilidad obligatoria:** `nota_resolucion` no se deja vacío — sirve para post-mortems y SLA.

**Auto-reparación** ante inserts fallidos (401/403/timeout/RLS): registrar `mayordomo.incidentes` + diagnóstico estándar (cliente Supabase `sbAnon` vs `sb` SERVICE_ROLE_KEY + RLS + policies) + reparar + cerrar incidente. Patrón canónico: una EF crea **dos clientes** — `sbAnon` para validar usuario, `sb` (service_role) para escribir.

> **Fuente canónica:** `reciclean-rdo/mayordomo/COMO-TRABAJAR.md § Sistema 6W · § Auto-reparación` · **Supabase:** `panel.config_ui.reglas_diego_6w_v1`.

---

## 9 · Triple Respaldo

Cada regla operativa importante vive en **3 lugares redundantes** para que ninguna desaparezca si una fuente cae:

| Capa | Dónde vive | Para qué sirve |
|---|---|---|
| **Repo** (canónica) | `reciclean-rdo/mayordomo/*.md` o `reciclean-sistema/public/*.md` | Versionado, diff visible, PR review |
| **Supabase** `panel.config_ui` | Clave + valor texto breve apuntando al canónico | Lectura desde EF / SQL / panel sin clonar repo |
| **Skill local** | `~/.claude/skills/visual-oro/` (auto-activable) | El PC aplica la regla sin leer un archivo — es instinto |

**Decisiones firmadas vigentes:**

- `D-VISUAL-ORO-001` (22-may) → activación skill auto-aplicable visual_standard_v1.
- `D-VISUAL-ORO-002` (22-may) → Modo Visual Universal (catálogo + propuesta proactiva).

**Si las 3 capas divergen** → la canónica (repo) manda. Las otras 2 se re-sincronizan desde ahí.

> **Fuente canónica:** este informe + commit `5e13d2f` (skill visual-oro v2) + entrada `DECISIONES.md § D-VISUAL-ORO-001/002`.

---

## 10 · Stack mínimo del grupo

- **Visualización**: Chart.js 4 · Leaflet 1.9 · HTML/CSS Tailwind (CDN en panel productivo).
- **Tipografía**: Inter (fallback Calibri / Arial — Google Slides / Office friendly).
- **Iconos**: emoji **funcional** (`🟢 🔴 ⏰ ⚠️ ✅`) — NO emojis decorativos en docs corporativos.
- **Mapa base**: CartoDB Positron (claro, sin saturación).
- **Imagen IA** (nanobanana, Gemini): embedded paleta hex en el prompt + Inter + sin stock corny.
- **PPTX / Gamma / Canva**: traducir paleta hex + Inter + mantener "sin grid vertical".

---

## Apéndice A — Mapa de fuentes canónicas

| Regla | Archivo canónico | Espejo / Skill | Supabase clave |
|---|---|---|---|
| Pauta visual | `reciclean-sistema/public/CLAUDE-VISUAL.md` | skill `visual-oro` | `visual_standard_v1` |
| Catálogo visualizaciones | `reciclean-rdo/mayordomo/skills/visual-oro/CATALOGO-VISUAL-UNIVERSAL.md` | `reciclean-sistema/public/CATALOGO-VISUAL-UNIVERSAL.md` | `catalogo_visual_v1` |
| Skill visual oro | `~/.claude/skills/visual-oro/skill.md` | `reciclean-rdo/mayordomo/skills/visual-oro/SKILL.md` | `visual_oro_skill_v1` |
| Modo autónomo continuo | `reciclean-sistema/public/CLAUDE-VISUAL.md § Modo autónomo` | — | — |
| Coherencia PCs | `reciclean-rdo/mayordomo/COMO-TRABAJAR.md § Reglas de coherencia` | — | — |
| Autorización previa UI | `reciclean-sistema/public/CLAUDE-VISUAL.md § REGLA DE AUTORIZACIÓN` | — | — |
| Interrupción segura | `reciclean-rdo/mayordomo/COMO-TRABAJAR.md` + `reciclean-sistema/public/CLAUDE.md` | — | `regla_interrupcion_segura_v1` |
| 6W Bandeja Diego | `reciclean-rdo/mayordomo/COMO-TRABAJAR.md § 6W` | — | `reglas_diego_6w_v1` |
| Reglas firma | `reciclean-rdo/mayordomo/REGLAS-FIRMA-V02.md` (vigente) | V01 archivada | — |
| Protocolo Mayordomo | `reciclean-rdo/mayordomo/PROTOCOLO-MAYORDOMO.md` | — | — |

---

## Apéndice B — Plantilla de propuesta visual (Modo Visual Universal)

Cuando aparece un dato, número, comparación, tendencia, ranking o relación en cualquier respuesta, el PC propone proactivamente:

```
¿Querés que te muestre esto como [tipo de gráfico]? Es ideal para [razón en 1 línea].
```

Sin pedir permiso para proponer. Solo se ejecuta tras OK Dusan o si el contexto ya autoriza (panel, presentación, dashboard, etc.).

---

**Fin del informe.** · Generado por PC Dusan 2026-05-23 a pedido de Dusan en sesión. Si una de estas reglas cambia, actualizar primero el archivo canónico (columna 1 del Apéndice A), después este informe.
