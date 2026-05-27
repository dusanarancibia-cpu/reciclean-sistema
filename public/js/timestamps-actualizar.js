/* ═══════════════════════════════════════════════════════════
   Panel RDO · Timestamps "Actualizado hace X · 🔄 refrescar"
   Branch: claude/panel-amor-verde-26may
   Propósito: cada tabla y gráfico del panel debe decir cuándo es esa info
              + invitar de un clic a actualizar.
   Mecanismo: a cualquier <table>, <canvas>, .chart-container ó [data-fuente]
              se le agrega un badge superior con timestamp + botón refrescar.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const ATTR = 'data-amor-stamp';
  const TS_KEY_PREFIX = 'amor_lastfetch_';

  function relativo(ts) {
    const ms = Date.now() - ts;
    const s = Math.floor(ms / 1000);
    if (s < 30) return 'hace un instante';
    if (s < 90) return 'hace ' + s + ' s';
    const m = Math.floor(s / 60);
    if (m < 60) return 'hace ' + m + ' min';
    const h = Math.floor(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    const d = Math.floor(h / 24);
    return 'hace ' + d + ' día' + (d === 1 ? '' : 's');
  }

  function colorStamp(ts) {
    const m = (Date.now() - ts) / 60000;
    if (m < 5) return '#1a936f';   // verde fresco
    if (m < 60) return '#f59e0b';  // ámbar tibio
    return '#dc2626';              // rojo frío
  }

  function agregarStamp(el, ts, refreshFnName) {
    if (el.querySelector('.amor-stamp-badge')) return;
    const tsReal = ts || (el.dataset.fuenteTs ? Number(el.dataset.fuenteTs) : Date.now());
    const badge = document.createElement('div');
    badge.className = 'amor-stamp-badge';
    badge.style.cssText = `
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11px; padding: 3px 10px;
      background: white; border: 1px solid #e5e7eb; border-radius: 999px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      margin: 0 0 8px 0;
      color: ${colorStamp(tsReal)};
      font-weight: 600;
    `;
    badge.innerHTML = `
      <span title="${new Date(tsReal).toLocaleString('es-CL')}">🕒 Actualizado ${relativo(tsReal)}</span>
      <button type="button" data-amor-stamp-refresh="${refreshFnName || ''}" style="background:none; border:none; padding:0 0 0 4px; cursor:pointer; color:#3b82f6; font-weight:700;">
        🔄 refrescar
      </button>
    `;
    el.setAttribute(ATTR, 'ok');
    el.dataset.fuenteTs = String(tsReal);
    el.parentNode.insertBefore(badge, el);
    badge.querySelector('button').addEventListener('click', (ev) => {
      ev.stopPropagation();
      const fn = ev.currentTarget.dataset.amorStampRefresh;
      if (fn && typeof window[fn] === 'function') {
        window[fn]();
      } else {
        // Heurística: buscar botón refresh cercano
        const refBtn = el.parentNode.querySelector('button[onclick*="load"], button[id*="Reload"], button[id*="reload"], button[onclick*="refresh"]');
        if (refBtn) refBtn.click();
      }
      // Actualizar timestamp local
      el.dataset.fuenteTs = String(Date.now());
      // Re-renderizar el badge
      badge.remove();
      el.removeAttribute(ATTR);
      setTimeout(() => agregarStamp(el, Date.now(), fn), 300);
      if (window.amorDivorcio) window.amorDivorcio.mover(+1, 'refresca dato fresco', detectarTab());
    });
  }

  function detectarTab() {
    const btn = document.querySelector('button.tab-btn.active');
    return btn?.dataset.tab || 'global';
  }

  // ────────────────────────────────────────────────────────────
  // Aplicar a todo lo que sea visible
  // ────────────────────────────────────────────────────────────
  function aplicar() {
    // 1) Cada tabla con datos
    document.querySelectorAll('section.tab-content table').forEach(t => {
      const filas = t.querySelectorAll('tbody tr');
      if (filas.length === 0) return;
      // Saltar tablas vacías o de "Cargando…"
      const primera = filas[0]?.textContent || '';
      if (/cargando|todav[íi]a no/i.test(primera) && filas.length <= 1) return;
      // Excluir tablas dentro de drawers/modales/headers
      if (t.closest('.drawer, .modal, thead, .amor-popup-card')) return;
      agregarStamp(t);
    });
    // 2) Cada canvas Chart.js
    document.querySelectorAll('section.tab-content canvas').forEach(c => {
      if (c.closest('.drawer, .modal')) return;
      agregarStamp(c);
    });
    // 3) Elementos con data-fuente explícito
    document.querySelectorAll('section.tab-content [data-fuente]').forEach(el => {
      const ts = el.dataset.fuenteTs ? Number(el.dataset.fuenteTs) : Date.now();
      agregarStamp(el, ts, el.dataset.fuenteRefresh);
    });
  }

  // Re-aplicar cuando cambia el tab activo (porque hay tabs ocultos)
  function bindTabs() {
    document.querySelectorAll('button.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(aplicar, 600));
    });
  }

  // Auto-refresh visual del badge cada 60s (sin recargar datos · solo cambia el "hace X")
  function tickear() {
    document.querySelectorAll(`[${ATTR}="ok"]`).forEach(el => {
      const ts = Number(el.dataset.fuenteTs || Date.now());
      const badge = el.previousElementSibling?.classList?.contains('amor-stamp-badge') ? el.previousElementSibling : null;
      if (!badge) return;
      const span = badge.querySelector('span');
      if (span) {
        span.textContent = '🕒 Actualizado ' + relativo(ts);
        span.style.color = '';
        badge.style.color = colorStamp(ts);
      }
    });
  }

  function init() {
    aplicar();
    bindTabs();
    setInterval(tickear, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1500);
  }
  console.log('🕒 Timestamps + refrescar activados');
})();
