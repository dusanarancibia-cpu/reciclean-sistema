# BANDEJA PABLO — Diego FAB v6 · 6 mejoras UX

**Firma:** `D-DIEGO-FAB-MEJORAS-001` — Dusan, 2026-05-24
**Repo objetivo:** `reciclean-sistema/public/panel-rdo.html` (fuente única)
**Estimado total:** 2-3 hr (5 CSS + 5 JS + 1 query a Diego/EF)
**Sin DDL · Sin nueva tabla · Sin nueva EF.** Solo frontend + ajuste del system prompt de `diego-chat-process` para la tabla.

---

## Resumen ejecutivo (1 párrafo)

El FAB Diego v6 está funcional pero tiene 6 fricciones UX que detectó Dusan probándolo. No son bugs, son mejoras de usabilidad y coherencia. La campana topbar y el badge del FAB hoy apuntan al mismo lugar (al chat) — eso confunde. La tabla de notificaciones que genera Diego es ruidosa y no accionable. Los íconos 🧹 y 📎 no se entienden a primera vista. No existe forma de "minimizar" sin perder la conversación visual. Esta bandeja arregla las 6 cosas en una sola pasada.

---

## Las 6 mejoras

### M1 — Minimizar a barra blanca fina

**Hoy:** solo hay ✕ Cerrar (línea 7951) que oculta todo el chat.
**Cambio:** agregar botón `−` a la izquierda del ✕. Al click, el chat colapsa a una barra blanca fina (alto ~36px) anclada abajo-derecha con texto "🤖 Diego" y un `△` para volver a expandir. La conversación queda intacta en memoria.

**CSS nuevo (~línea 7900):**
```css
.diego-chat.minimized { max-height: 36px; overflow: hidden; border-radius: 18px; background: #fff; }
.diego-chat.minimized .diego-chat-h { background: #fff; color: #0f172a; border-bottom: 1px solid #e2e8f0; }
.diego-chat.minimized .diego-chat-body,
.diego-chat.minimized .diego-attach-preview,
.diego-chat.minimized .diego-chat-form { display: none; }
.diego-chat.minimized .h-version,
.diego-chat.minimized #diegoChatLimpiar { display: none; }
```

**HTML (línea 7949-7952):**
```html
<div style="display:flex;gap:4px;align-items:center;">
  <button type="button" id="diegoChatLimpiar" aria-label="Limpiar pantalla">↻</button>
  <button type="button" id="diegoChatMinimize" aria-label="Minimizar">−</button>
  <button type="button" id="diegoChatClose" aria-label="Cerrar">✕</button>
</div>
```

**JS (cerca de línea 7979):**
```js
const minBtn = document.getElementById('diegoChatMinimize');
if (minBtn) minBtn.addEventListener('click', () => win.classList.toggle('minimized'));
// click en cabecera de barra blanca = expandir
win.querySelector('.diego-chat-h').addEventListener('click', (e) => {
  if (win.classList.contains('minimized') && e.target.tagName !== 'BUTTON') {
    win.classList.remove('minimized');
  }
});
```

---

### M2 — Reemplazar 🧹 escoba

**Hoy:** botón 🧹 ambiguo (¿borra memoria? ¿borra todo?). Tooltip aclara pero la mayoría no lo lee.
**Cambio:** ícono `↻` (reload arrow) + tooltip explícito "Limpiar pantalla (Diego sigue recordando)".

**HTML (línea 7950):**
```html
<button type="button" id="diegoChatLimpiar"
        aria-label="Limpiar pantalla"
        title="Limpiar pantalla — Diego sigue recordando todo">↻</button>
```

---

### M3 — Reemplazar 📎 adjuntar por outline moderno

**Hoy:** emoji 📎 se ve viejo, no escala bien retina, distinto en cada OS.
**Cambio:** SVG inline tipo Lucide (paperclip outline 18px, stroke 2, color #475569).

**HTML (línea 7964):**
```html
<button type="button" class="attach-btn" id="diegoAttachBtn" aria-label="Adjuntar" title="Foto, audio o PDF">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.98 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
</button>
```

**CSS ajuste:** quitar `padding: 8px 10px` heredado, usar `padding: 8px; display: inline-flex; align-items: center;`.

---

### M4 — Badge FAB clickeable → tab destino tareas

**Hoy:** `#diegoFabBadge` muestra número pero el click va siempre al chat (línea 7940-7943, el badge es hijo del button `.diego-fab`).
**Cambio:** detener propagación en el badge. Click en badge → ir al tab donde están las tareas reales (a definir: tab "🔔 Notificaciones" nuevo o tab "Bandeja Precios" si las tareas son precios).

**HTML (línea 7943):**
```html
<span class="diego-fab-badge hidden" id="diegoFabBadge" role="button" tabindex="0">0</span>
```

**JS (agregar cerca de línea 7976):**
```js
if (fabBadge) {
  fabBadge.addEventListener('click', (e) => {
    e.stopPropagation();  // evita abrir el chat
    // ir al tab de notificaciones
    const tabBtn = document.querySelector('[data-tab="notificaciones"]')
                || document.querySelector('[data-tab="bandeja-precios"]');
    if (tabBtn) tabBtn.click();
  });
}
```

**Pendiente Dusan:** confirmar a qué tab apunta exactamente. Default propuesto: tab "🔔 Notificaciones" nuevo (M6 lo justifica).

---

### M5 — Desacoplar campana topbar del FAB

**Hoy** (línea 8264-8269):
```js
const bell = document.getElementById('v4-bellNotificaciones');
if (bell) bell.addEventListener('click', () => {
  const fab = document.querySelector('.diego-fab');
  if (fab) fab.click();  // ← MAL: abre el chat en vez de notificaciones
});
```

**Cambio:** la campana debe llevar a notificaciones generales, NO al chat. El indicador visual también cambia: en vez de número, un punto rojo binario (hay/no hay).

**CSS:**
```css
#v4-bellNotificaciones .bell-dot {
  position: absolute; top: 4px; right: 4px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #ef4444; display: none;
}
#v4-bellNotificaciones.has-alerts .bell-dot { display: block; }
```

**HTML topbar:** asegurar que el botón tenga un `<span class="bell-dot"></span>` dentro.

**JS reemplazo (línea 8264-8269):**
```js
const bell = document.getElementById('v4-bellNotificaciones');
if (bell) bell.addEventListener('click', () => {
  const tabBtn = document.querySelector('[data-tab="notificaciones"]');
  if (tabBtn) tabBtn.click();
});

// actualizar punto rojo según conteo
async function updateBellDot() {
  try {
    const { count } = await sb.from('panel.diego_bandeja')
      .select('id', { count: 'exact', head: true })
      .eq('resuelto', false);
    bell.classList.toggle('has-alerts', (count || 0) > 0);
  } catch {}
}
updateBellDot();
setInterval(updateBellDot, 60000);  // refresca cada 60s
```

**Arquitectura definitiva:**
| Elemento | Indicador | Destino |
|---|---|---|
| 🔔 Campana topbar | Punto rojo binario (hay/no hay) | Tab Notificaciones generales |
| 🤖 FAB Diego | Número de tareas pendientes | Tab donde están esas tareas |

Cero coherencia falsa entre los dos canales.

---

### M6 — Perfeccionar tabla notificaciones que genera Diego

**Hoy** (output crudo del LLM cuando se le pide "notificaciones activas"):
```
| Razón Social | Tipo | Etapa | Días | Alerta | Riesgo Legal |
| Agrosepia | Híbrido | Recurrente | 143 | ESTANCADO 143d > 45d | A |
| Nestlé    | B2B     | Recurrente | 143 | ESTANCADO 143d > 45d | V |
| ... 4 filas más ...
```

Problemas: (a) "ESTANCADO 143d > 45d" repetido 6 veces es ruido, (b) "A/V" sin leyenda, (c) ninguna acción.

**Cambio doble:**

**(a) Ajustar system prompt de `diego-chat-process`** — cuando Diego liste notificaciones, debe agrupar por alerta, traducir A/V y agregar enlace de acción. Pseudo-prompt a sumar:

```
Cuando listes notificaciones:
1. Agrupar por tipo de alerta (no repetir el mismo motivo en cada fila).
2. Header del grupo: "🔴 N negocios <motivo>" (ej: "🔴 6 negocios estancados >45d, todos llevan 143d").
3. Cada fila: razón social · tipo · riesgo legal traducido (A=Alto / V=OK) · acción.
4. Acción: link markdown `[Resolver →](panel-rdo.html?tab=oportunidades&op_id=<uuid>)`.
5. Footer: "[Ver todas en tab Oportunidades →]" con link al tab.
6. Nunca repetir el mismo motivo en columna — sacarlo al header.
```

**(b) En el renderer de la respuesta de Diego (panel-rdo.html función que pinta tablas markdown)** — detectar tablas con columna "Razón Social" y agregar botones `[Resolver →]` por fila si hay `op_id` en la metadata.

**Output esperado tras el cambio:**
```
🔴 6 negocios estancados >45d (todos llevan 143d en Recurrente)

  Agrosepia · Híbrido retiro+compra · Riesgo Alto    [Resolver →]
  Nestlé · Cuenta estratégica B2B · Riesgo OK        [Resolver →]
  Constructora Nuevos Aires · Pago puro · OK         [Resolver →]
  Sotex · Spot · OK                                  [Resolver →]
  Fashion Park · Pago puro · OK                      [Resolver →]
  Casas Patronales · Pago puro · OK                  [Resolver →]

[Ver todas en tab Oportunidades →]
```

---

## Mock visual de los 3 estados del chat

```
EXPANDIDO (default)              MINIMIZADO (nuevo M1)         CERRADO (FAB)
┌──────────────────────┐         ┌──────────────────────┐      ●
│ 🤖 Diego v6  ↻ − ✕  │         │ 🤖 Diego          △ │      🤖³ ← FAB+badge
├──────────────────────┤         └──────────────────────┘      ↑ click badge → M4
│ (mensajes)           │         barra blanca anclada           ↑ click body → abre
│                      │         abajo-derecha
├──────────────────────┤
│ [📎] [escribir] [▶] │
└──────────────────────┘
```

---

## DoD (Definition of Done)

- [ ] M1 implementado: `.diego-chat.minimized` aparece al click `−`, vuelve a expandir al click cabecera.
- [ ] M2 implementado: `🧹` reemplazado por `↻` + tooltip actualizado.
- [ ] M3 implementado: SVG paperclip outline reemplaza emoji.
- [ ] M4 implementado: click en badge ≠ click en FAB (verificado en DevTools).
- [ ] M5 implementado: bell topbar abre tab Notificaciones, NO el chat; punto rojo binario.
- [ ] M6 implementado: system prompt EF `diego-chat-process` actualizado + renderer panel agrega botón Resolver por fila.
- [ ] Tab "Notificaciones" existe (si no, crear sketch mínimo o reusar tab existente — coordinar con Dusan).
- [ ] Preview Vercel validado mobile + desktop.
- [ ] PR a `main` con cuerpo apuntando a esta bandeja.
- [ ] Tras merge a `main`, esperar firma Dusan para `main → prod`.

---

## Rollback

Localizado: revertir el commit del PR. Sin DDL ni EF nueva, sin riesgo de schema drift. El cambio M6 al system prompt sí necesita re-deploy de `diego-chat-process` (revertir versión EF previa via Supabase Dashboard si rompe).

---

## Coordinación

- **PC2 Pablo:** ejecuta los 6 cambios, mergea a `main`, avisa para que Dusan firme promoción a `prod`.
- **PC1 Dusan (este PC):** consolida feedback Andrea/Cony post-deploy, registra D-DIEGO-FAB-MEJORAS-001 cerrado en `DECISIONES.md`.
- **Diego v10.13:** no se toca el cumplimiento legal — solo el comportamiento de listar notificaciones (M6).

---

**Firmado** D-DIEGO-FAB-MEJORAS-001 · Dusan Arancibia · 2026-05-24
