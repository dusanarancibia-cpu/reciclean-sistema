/* ═══════════════════════════════════════════════════════════
   Panel RDO · Semáforo de Confianza por feature
   Branch: claude/panel-amor-verde-26may
   Propósito: marcar cada sección con verde/amarillo/rojo + tooltip explicativo
   Convención: cualquier elemento con [data-confianza="verde|amarillo|rojo"] recibe badge
   El CSS se encarga del punto · este JS agrega el tooltip al hover
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ────────────────────────────────────────────────────────────
  // Mapa de features y su estado actual (editable en tiempo real)
  // ────────────────────────────────────────────────────────────
  const FEATURES = {
    // VERDE · listas para usar con confianza
    'tabPortada':        { confianza: 'verde',    msg: 'Resumen del día · datos verificados. Usalo con seguridad.' },
    'tabPesaje':         { confianza: 'verde',    msg: 'Pesaje S1 · operativa estable hace meses.' },
    'tabFacturacion':    { confianza: 'verde',    msg: 'Facturación S5 · integración SII estable.' },
    'tabComunicados':    { confianza: 'verde',    msg: 'Audio comunicados del CEO · sólo lectura.' },
    'tabRdo':            { confianza: 'verde',    msg: 'Resumen RDO consolidado · vista verificada.' },
    'tabNegocios':       { confianza: 'verde',    msg: 'Pipeline comercial · 10.250 oportunidades con 82% éxito histórico.' },
    'tabCierres':        { confianza: 'verde',    msg: 'Cierres mensuales · Dyana firma · operación validada.' },
    'tabCartera':        { confianza: 'verde',    msg: 'Cartera de 1.975 clientes · verificada en sistema curated.' },
    'tabReconciliacion': { confianza: 'verde',    msg: 'Reconciliación pesajes vs facturación · diferencias auditadas.' },

    // AMARILLO · podés usarlo pero parate si no te sentís seguro
    'tabDieguito':         { confianza: 'amarillo', msg: 'Dieguito puede equivocarse · revisá antes de aprobar. Te avisamos cuando esté verde.' },
    'tabManual':           { confianza: 'amarillo', msg: 'Manual en proceso de rediseño · contenido se está enriqueciendo esta semana.' },
    'tabMiMemoria':        { confianza: 'amarillo', msg: 'Memoria personal · respeta tu Ley 19628 pero todavía estamos puliendo la UX.' },
    'tabCotizador':        { confianza: 'amarillo', msg: 'Cotizador en validación · resultados confiables pero conviene cruzar con Andrea.' },
    'tabBandejaPrecios':   { confianza: 'amarillo', msg: 'Bandeja precios viva · Diego propone, vos decidís siempre.' },
    'tabOperativos':       { confianza: 'amarillo', msg: 'Documentos operativos · revisá vigencia antes de imprimir.' },
    'tabOportunidades':    { confianza: 'amarillo', msg: 'Kanban oportunidades · el pipeline visual estabiliza esta semana.' },
    'tabEntregables':      { confianza: 'amarillo', msg: 'Entregables · sumando integraciones · podés usar mientras testeamos.' },
    'tabBandejaDiego':     { confianza: 'amarillo', msg: 'Bandeja Diego siendo enriquecida · 6W en español + procesamiento mejorado en curso.' },
    'tabOpsDiarias':       { confianza: 'amarillo', msg: 'Operaciones día consolidado · módulo joven · feedback bienvenido.' },
    'tabComercial':        { confianza: 'amarillo', msg: 'Vista comercial · combina varios sistemas · controlá los números clave.' },

    // ROJO · esperá · te vamos a demostrar que de esto no te arrepientas
    'tabPrecios':          { confianza: 'rojo',     msg: 'Precios en transición al nuevo modelo (Plan Integral). Esperá · te avisamos cuando puedas confiar de nuevo.' },
    'tabAdmin':            { confianza: 'rojo',     msg: 'Admin restringido a CEO + Tech Lead · acá no entres si no es tu rol.' }
  };

  // ────────────────────────────────────────────────────────────
  // Aplicar atributos data-confianza
  // ────────────────────────────────────────────────────────────
  function aplicarSemaforo() {
    Object.entries(FEATURES).forEach(([id, info]) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      sec.setAttribute('data-confianza', info.confianza);
      sec.setAttribute('data-confianza-msg', info.msg);
    });

    // Tooltip al hover sobre el punto del semáforo
    document.body.addEventListener('mousemove', mostrarTooltipSemaforo);
    document.body.addEventListener('mouseleave', ocultarTooltipSemaforo);
  }

  let tooltipEl = null;

  function mostrarTooltipSemaforo(ev) {
    const sec = ev.target.closest('[data-confianza]');
    if (!sec) { ocultarTooltipSemaforo(); return; }
    // Solo si el mouse está cerca del punto (esquina sup. derecha)
    const rect = sec.getBoundingClientRect();
    const distX = rect.right - ev.clientX;
    const distY = ev.clientY - rect.top;
    if (distX > 28 || distY > 28) { ocultarTooltipSemaforo(); return; }

    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.style.cssText = `
        position: fixed; z-index: 60; padding: 10px 14px; border-radius: 10px;
        background: white; box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        font-size: 12px; max-width: 280px; line-height: 1.4;
        pointer-events: none;
      `;
      document.body.appendChild(tooltipEl);
    }
    const conf = sec.getAttribute('data-confianza');
    const msg = sec.getAttribute('data-confianza-msg');
    const color = conf === 'verde' ? '#1a936f' : conf === 'amarillo' ? '#92400e' : '#dc2626';
    const emoji = conf === 'verde' ? '🟢' : conf === 'amarillo' ? '🟡' : '🔴';
    tooltipEl.style.borderLeft = '4px solid ' + color;
    tooltipEl.innerHTML = `<div style="color:${color}; font-weight:700; margin-bottom:4px;">${emoji} ${conf.toUpperCase()}</div><div style="color:#4b5563;">${msg}</div>`;
    tooltipEl.style.left = Math.min(window.innerWidth - 300, ev.clientX + 14) + 'px';
    tooltipEl.style.top = (ev.clientY + 14) + 'px';
  }

  function ocultarTooltipSemaforo() {
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
  }

  // API pública para cambiar el estado de un feature en runtime
  window.semaforoFeatures = {
    set(id, confianza, msg) {
      const sec = document.getElementById(id);
      if (!sec) return false;
      sec.setAttribute('data-confianza', confianza);
      if (msg) sec.setAttribute('data-confianza-msg', msg);
      FEATURES[id] = { confianza, msg: msg || FEATURES[id]?.msg || '' };
      return true;
    },
    get(id) { return FEATURES[id]; },
    all() { return Object.assign({}, FEATURES); }
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarSemaforo);
  } else {
    aplicarSemaforo();
  }
  console.log('🟢🟡🔴 Semáforo de confianza activado · features:', Object.keys(FEATURES).length);
})();
