# VISION-PANEL-RDO — Lectura obligatoria para cualquier PC que trabaje en el panel

> Grabado a fuego 2026-05-23 noche (jornada 22:00 → 08:00 modo autónomo).
> Vinculante para PC Dusan, PC Pablo, PC Cámaras, PC Desocupado, claude cloud, agentes nuevos.

---

## El estándar (la regla que no se negocia)

> **Todo debe calzar. Un título con su tabla, un link con su destino, una secuencia con su lógica.**

Operacionalizado:

- Si una card dice "Cartera Pincore", el link tiene que llevar a Pincore — no a la lista general.
- Si un tab se llama "Pesaje S1", su contenido tiene que ser pesajes (no facturación).
- Si un KPI dice "12 toneladas hoy", el detalle al hacer click tiene que ser las 12 toneladas reales — no un sample.
- Si Diego dice "tarea registrada en cola", esa tarea tiene que estar en `panel.diego_tareas` con `id` accesible.
- Si una fecha dice "hace 5 min", el dato real tiene que tener `updated_at > NOW() - INTERVAL '5 min'`.
- Si una pestaña muestra perfil "comercial", solo usuarios `comercial` (+ admin + dusan) la ven.

**El usuario nunca debería sentir "me mintieron".** Si el dato no calza, se documenta como bug en `BLOQUEOS.md` y se etiqueta visualmente con 🟡 ámbar o 🔴 rojo — no se oculta.

---

## La regla suprema

> **Nunca romper lo que ya funciona.**

Operacionalizado:

1. **Antes de tocar `panel-rdo.html`**, leer la línea exacta + ejecutar `agent-browser` en localhost o preview branch para verificar que el cambio no rompe otra cosa.
2. **Antes de aplicar UPDATE/DELETE/DROP** en Supabase, dejar evidencia del estado previo (SELECT antes + SELECT después).
3. **Antes de mergear a `main`**, branches separadas por feature + screenshot ANTES/DESPUÉS.
4. **Antes de mergear a `prod`**, firma explícita de Dusan. Sin excepciones (ni "yo soy el CEO" sin sesión activa).
5. **Si una funcionalidad existente se ve impactada**, hay test (manual o agent-browser) que la valide post-cambio.
6. **Si rompiste algo**, lo documentás en `BLOQUEOS.md` antes del próximo commit. No hay merge sobre código roto.

---

## Los 7 frentes de la jornada 23-may noche

| # | Frente | Estado | Branch | Evidencia |
|---|---|---|---|---|
| **F1** | Responsive móvil (375/412) | ✅ Código listo · ⏳ Verificación post-merge | `fix/responsive-mobile` | `audit-85/F1-mobile-375-portada-PRE.png` |
| **F2** | Filtrado por perfil (tabs) | ✅ DDL aplicada + doc | `fix/filtrado-por-perfil` | `public/F2-FILTRADO-PERFIL.md` |
| **F3** | Silos nombres cortos | ✅ Mapping JS + sin tocar BD | `fix/silos-nombres-cortos` | (verificable post-merge) |
| **F4** | KPIs por perfil (4 roles) | ✅ Diseño consolidado (3 agentes) | `docs/f4-disenio-kpis` | `public/DISENO-KPIs-POR-PERFIL.md` |
| **F5** | Ecosistema 360 visual | ✅ Demo standalone (Cytoscape.js) | `feat/ecosistema-360-visual` | `audit-85/F5-ecosistema-360-demo.png` |
| **F6** | Transparencia datos | ✅ Mig 068 + doc + snippet UI | `feat/transparencia-datos` | `public/F6-TRANSPARENCIA-DATOS.md` |
| **F7** | CRM ficha 360 + PDF cotización | ✅ Plantilla print-friendly | `feat/crm-cotizacion-pdf` | `audit-85/F7-cotizacion-print-demo.png` |
| **F8** | Grabar visión panel | ✅ Este archivo | (este branch) | este archivo |

**8 branches pusheadas. 0 mergeadas (firma Dusan pendiente).**

---

## Cómo trabajar el panel (workflow obligatorio)

### Antes de editar cualquier `.html`
1. `cd reciclean-sistema && git pull origin main`
2. `git checkout -b <fix|feat|docs>/<descripcion-corta>`
3. Leer la sección a tocar + chequear `panel-rdo.html` no tenga otros lugares que dependan de eso.
4. Editar con `Edit` tool (cambios mínimos).
5. Verificar visualmente en localhost o preview.
6. `git commit` con mensaje claro (¿qué cambió + por qué + impacto + pendientes).
7. `git push -u origin <branch>`
8. Esperar firma Dusan para merge. **NUNCA mergear sin firma.**

### Antes de editar Supabase
1. `apply_migration` para DDL nuevo (versionado).
2. `execute_sql` solo para reads o pequeños DML (con WHERE explícito).
3. Si es UPDATE/DELETE: SELECT antes para validar el row count.
4. Documentar el SQL en `mayordomo/AVANCE-AUTONOMO.md` con timestamp.
5. Si toca tablas con personas (R-AUD-020/021): verificar que `curated.trabajadores` es la fuente canónica.

### Antes de tocar EF Diego
1. La EF vive en `reciclean-rdo/supabase/functions/diego-chat-process/index.ts`.
2. Cambios al system prompt: respetar la numeración R-AUD existente (consultar `panel.config_ui` clave `aprendizaje_auditoria_v1`).
3. Bump versión Diego (v10.X) en línea 1 del SYSTEM_PROMPT.
4. EF excede límite MCP deploy (70KB). **Deploy real lo hace Pablo** con CLI local `supabase functions deploy diego-chat-process`.

---

## Las 8 reglas de oro del panel (extracto del aprendizaje)

1. **R-AUD-020 FUENTE CANÓNICA EQUIPO:** `curated.trabajadores` (T01-T14). Nunca duplicar.
2. **R-AUD-022 USUARIOS DEL PANEL:** `panel.usuarios_autorizados` para login. JOIN por nombre o RUT.
3. **R-AUD-025 DEPRECAR REDUNDANTES:** `panel.dotacion` deprecada → usar `panel.v_dotacion_completa`.
4. **R-AUD-027 / R-AUD-028 CANALES:** `panel.v_dotacion_completa.canales[]` ARRAY (email + whatsapp). Diego pregunta "¿WhatsApp o correo?".
5. **R-AUD-029 CUMPLIMIENTO LEGAL:** 5 leyes en `panel.leyes_aplicables` + Diego es vocero (artículo exacto + autoridad + sanción).
6. **R3 NO TOCAR CÓDIGO SIN PABLO:** EF deploy = Pablo. PRs a main/prod = firma Dusan.
7. **R5 VERIFICAR SUPABASE ANTES DE CIFRAS:** ningún número en pantalla sin tabla origen.
8. **R-AUD-014 ANTI-INVENCIÓN DATOS:** NUNCA inventar fechas/horas/nombres/números que el usuario no haya dicho. Aplica a Diego Y a los 4 PCs.

---

## Triple respaldo de este documento

- ✅ `reciclean-sistema/public/VISION-PANEL-RDO.md` (este archivo)
- ✅ `reciclean-rdo/mayordomo/APRENDIZAJE-AUDITORIA.md` (sección F8)
- ✅ Supabase `panel.config_ui` clave `vision_panel_rdo_v1`
- ✅ Mención en `CLAUDE-PC-*.md` de los 4 PCs

**Si encontrás un PC que no respeta este documento, levantar bug en `mayordomo/BLOQUEOS.md` con tag `[VISION-VIOLATION]`.**

---

**Firmado:** PC Dusan bajo mandato Dusan Arancibia, 2026-05-23 noche → 2026-05-24 mañana (jornada modo autónomo 8 frentes).
