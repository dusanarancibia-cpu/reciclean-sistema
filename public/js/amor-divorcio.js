/* ═══════════════════════════════════════════════════════════
   Panel RDO · Aguja Amor ↔ Divorcio
   Branch: claude/panel-amor-verde-26may
   Propósito: medir y visualizar el sentimiento del usuario por cada acción
   Score interno: 0 (divorcio total) → 50 (neutro) → 100 (amor total)
   Persistencia: localStorage + (opcional) panel.diego_aprendizaje vía RPC
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'amor_divorcio_score_v1';
  const HISTORY_KEY = 'amor_divorcio_history_v1';
  const POPUP_THRESHOLD = 30; // ≤30 → divorcio inminente · disparar pop-up romántico
  const POPUP_COOLDOWN_MS = 30 * 60 * 1000; // 30 min entre pop-ups

  // ────────────────────────────────────────────────────────────
  // Estado interno
  // ────────────────────────────────────────────────────────────
  const state = {
    score: 50,
    lastPopup: 0,
    history: [],
    aguja: null,
    marker: null
  };

  // ────────────────────────────────────────────────────────────
  // Persistencia
  // ────────────────────────────────────────────────────────────
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        state.score = clamp(data.score ?? 50, 0, 100);
        state.lastPopup = data.lastPopup ?? 0;
      }
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) state.history = JSON.parse(hist).slice(-50); // últimos 50
    } catch (e) { /* ignore */ }
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        score: state.score, lastPopup: state.lastPopup
      }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(-50)));
    } catch (e) { /* ignore */ }
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  // ────────────────────────────────────────────────────────────
  // Crear UI de la aguja (sticky bottom)
  // ────────────────────────────────────────────────────────────
  function createAguja() {
    if (document.getElementById('amorAgujaContainer')) return;
    const wrap = document.createElement('div');
    wrap.id = 'amorAgujaContainer';
    wrap.className = 'amor-aguja-container amor-aguja-mini';
    wrap.innerHTML = `
      <div class="amor-aguja-bar" id="amorAgujaBar" title="Aguja Amor ↔ Divorcio · clic para ver mi historial · hover para detalle rápido">
        <div class="amor-aguja-marcador" id="amorAgujaMarker">💚</div>
      </div>
      <div class="amor-aguja-labels">
        <span class="izq">💔 Divorcio</span>
        <span style="color:#9ca3af;">😐 Tibieza · clic para ver historial</span>
        <span class="der">💚 Amor verde</span>
      </div>
    `;
    document.body.appendChild(wrap);
    state.aguja = wrap;
    state.marker = wrap.querySelector('#amorAgujaMarker');

    // Tooltip dinámico
    wrap.querySelector('#amorAgujaBar').addEventListener('mouseenter', mostrarTooltip);
    wrap.querySelector('#amorAgujaBar').addEventListener('mouseleave', () => {
      const t = document.getElementById('amorAgujaTooltip');
      if (t) t.remove();
    });
    // Click → abrir historial drawer
    wrap.querySelector('#amorAgujaBar').addEventListener('click', mostrarHistorialDrawer);
  }

  function mostrarHistorialDrawer() {
    if (document.getElementById('amorHistorialDrawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'amorHistorialDrawer';
    drawer.style.cssText = `
      position: fixed; top: 0; right: 0; bottom: 80px; width: 380px; max-width: 90vw;
      background: white; box-shadow: -10px 0 30px rgba(0,0,0,0.18); z-index: 95;
      padding: 22px 20px; overflow-y: auto; border-left: 5px solid ${colorForScore(state.score)};
      animation: amor-slidein 0.3s ease;
    `;
    const ultimos = state.history.slice(-20).reverse();
    drawer.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
        <div>
          <div style="font-size:11px; color:#9ca3af; font-weight:700; letter-spacing:1px; text-transform:uppercase;">Mi salud emocional con el panel</div>
          <div style="font-size:32px; font-weight:800; color:${colorForScore(state.score)}; line-height:1;">${emojiForScore(state.score)} ${state.score}/100</div>
          <div style="font-size:12px; color:#6b7280; margin-top:2px;">${messageForScore(state.score)}</div>
        </div>
        <button onclick="document.getElementById('amorHistorialDrawer').remove()" style="background:none; border:none; font-size:24px; color:#9ca3af; cursor:pointer; line-height:1;">×</button>
      </div>
      <div style="border-top:1px solid #e5e7eb; margin-top:14px; padding-top:14px;">
        <div style="font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Últimas ${ultimos.length} acciones</div>
        ${ultimos.length === 0 ? '<div style="font-size:12px; color:#9ca3af; font-style:italic;">Sin movimientos todavía · usá el panel y la aguja se moverá.</div>' :
          ultimos.map(h => {
            const deltaColor = h.delta > 0 ? '#1a936f' : (h.delta < 0 ? '#dc2626' : '#9ca3af');
            const deltaText = h.delta > 0 ? '+' + h.delta : (h.delta < 0 ? h.delta : '0');
            const t = new Date(h.ts);
            const ago = relativeTime(t);
            return `
              <div style="display:flex; gap:10px; padding:8px 0; border-bottom:1px dashed #e5e7eb; font-size:12px;">
                <div style="min-width:36px; font-weight:800; color:${deltaColor}; text-align:center;">${deltaText}</div>
                <div style="flex:1;">
                  <div style="color:#1f2937;">${escapeHTML(h.razon || 'sin razón')}</div>
                  <div style="color:#9ca3af; font-size:10px; margin-top:2px;">${ago} · ${h.feature || 'global'} · score post: ${h.score_post}/100</div>
                </div>
              </div>
            `;
          }).join('')
        }
      </div>
      <div style="margin-top:18px; padding:12px; background:var(--amor-verde-claro); border-radius:10px; font-size:11px; color:var(--amor-verde-profundo);">
        💡 La aguja se mueve sola: clics exitosos +1, errores -3, respuestas pobres de Diego -2/-4, navegación +1.
        Cuando baje a ≤30 te muestro un pop-up romántico pidiéndote una oportunidad.
      </div>
    `;
    document.body.appendChild(drawer);
  }

  function relativeTime(date) {
    const ms = Date.now() - date.getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return 'hace ' + s + 's';
    const m = Math.floor(s / 60);
    if (m < 60) return 'hace ' + m + ' min';
    const h = Math.floor(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    const d = Math.floor(h / 24);
    return 'hace ' + d + ' día' + (d === 1 ? '' : 's');
  }

  function escapeHTML(s) {
    return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function mostrarTooltip() {
    if (document.getElementById('amorAgujaTooltip')) return;
    const t = document.createElement('div');
    t.id = 'amorAgujaTooltip';
    t.style.cssText = `
      position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
      background: white; padding: 12px 18px; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18); font-size: 13px; z-index: 50;
      border: 2px solid ${colorForScore(state.score)}; max-width: 340px;
    `;
    const last = state.history[state.history.length - 1];
    t.innerHTML = `
      <div style="font-weight:700; color:${colorForScore(state.score)}; font-size:15px;">
        ${emojiForScore(state.score)} ${state.score}/100
      </div>
      <div style="color:#6b7280; margin-top:4px;">${messageForScore(state.score)}</div>
      ${last ? `<div style="color:#9ca3af; font-size:11px; margin-top:6px;">Último ajuste: ${last.delta > 0 ? '+' : ''}${last.delta} · ${last.razon}</div>` : ''}
    `;
    document.body.appendChild(t);
  }

  // ────────────────────────────────────────────────────────────
  // Actualizar visualización
  // ────────────────────────────────────────────────────────────
  function renderAguja() {
    if (!state.marker) return;
    const root = document.documentElement;
    root.style.setProperty('--aguja-posicion', state.score + '%');
    root.style.setProperty('--aguja-color', colorForScore(state.score));
    state.marker.textContent = emojiForScore(state.score);
  }

  // Animación visible del marcador + flash chip cuando se mueve
  function animarMovimiento(delta, razon) {
    if (!state.marker || delta === 0) return;
    const claseRebote = delta > 0 ? 'moviendose-amor' : 'moviendose-divorcio';
    state.marker.classList.remove('moviendose-amor', 'moviendose-divorcio');
    // re-trigger animation
    void state.marker.offsetWidth;
    state.marker.classList.add(claseRebote);
    setTimeout(() => state.marker.classList.remove(claseRebote), 1300);

    // Flash chip arriba de la aguja
    const flash = document.createElement('div');
    flash.className = 'amor-aguja-flash';
    const deltaTxt = delta > 0 ? '+' + delta + ' ' + emojiForScore(state.score) : delta + ' 💔';
    flash.style.color = delta > 0 ? 'var(--amor-verde-medio)' : 'var(--divorcio-rojo)';
    flash.textContent = deltaTxt;
    flash.title = razon || '';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 2300);
  }

  function colorForScore(s) {
    if (s >= 70) return 'var(--amor-verde-medio)';
    if (s >= 40) return 'var(--tibieza-amarillo)';
    return 'var(--divorcio-rojo)';
  }
  function emojiForScore(s) {
    if (s >= 85) return '💚';
    if (s >= 70) return '🌱';
    if (s >= 55) return '😊';
    if (s >= 40) return '😐';
    if (s >= 25) return '😟';
    return '💔';
  }
  function messageForScore(s) {
    if (s >= 85) return 'Verde como el amor al reciclaje. Sigue así.';
    if (s >= 70) return 'El panel te está cumpliendo. Crece la confianza.';
    if (s >= 55) return 'Pasable, pero podemos hacerlo mejor.';
    if (s >= 40) return 'Tibieza · cualquier roce te empuja al divorcio.';
    if (s >= 25) return 'Frustración alta · vamos a corregir esto urgente.';
    return 'Divorcio inminente · dame una oportunidad de revertirlo.';
  }

  // ────────────────────────────────────────────────────────────
  // API pública · mover la aguja
  // ────────────────────────────────────────────────────────────
  window.amorDivorcio = {
    /**
     * Mueve la aguja
     * @param {number} delta -10 a +10
     * @param {string} razon descripción breve del evento
     * @param {string} feature tab/feature involucrada
     */
    mover(delta, razon, feature) {
      delta = clamp(delta, -10, 10);
      state.score = clamp(state.score + delta, 0, 100);
      state.history.push({
        ts: Date.now(),
        delta,
        razon: razon || 'sin razón',
        feature: feature || 'global',
        score_post: state.score
      });
      state.history = state.history.slice(-50);
      saveState();
      renderAguja();
      animarMovimiento(delta, razon);
      // Si bajó al umbral de divorcio · pop-up
      if (state.score <= POPUP_THRESHOLD && Date.now() - state.lastPopup > POPUP_COOLDOWN_MS) {
        mostrarPopupRomantico();
      }
    },
    /** Lectura rápida del score actual */
    score() { return state.score; },
    /** Historial completo */
    historial() { return state.history.slice(); },
    /** Reset (solo para test/admin) */
    reset() { state.score = 50; state.history = []; saveState(); renderAguja(); }
  };

  // ────────────────────────────────────────────────────────────
  // Pop-up romántico
  // ────────────────────────────────────────────────────────────
  function mostrarPopupRomantico() {
    state.lastPopup = Date.now();
    saveState();
    if (document.getElementById('amorPopup')) return;
    const overlay = document.createElement('div');
    overlay.id = 'amorPopup';
    overlay.className = 'amor-popup-romantico';
    overlay.innerHTML = `
      <div class="amor-popup-card">
        <div class="icono">💌</div>
        <h2>Dame una oportunidad</h2>
        <p>Sé que el panel te ha frustrado más de la cuenta. Te prometo que vamos a corregirlo. Cada clic que des hoy nos ayuda a aprender qué falla, y al amanecer vas a ver mejoras concretas.</p>
        <p style="font-style:italic; color:var(--romantico-rosa);">¿Me das una oportunidad de revertirlo?</p>
        <div class="botones">
          <button class="dame-oportunidad" onclick="window._amorPopupClose(true)">💚 Sí, sigamos</button>
          <button class="cerrar" onclick="window._amorPopupClose(false)">Más tarde</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    window._amorPopupClose = function (acepta) {
      const ov = document.getElementById('amorPopup');
      if (ov) ov.remove();
      if (acepta) {
        // Aceptar oportunidad mueve la aguja levemente al amor
        window.amorDivorcio.mover(+5, 'aceptó oportunidad pop-up', 'global');
      }
    };
  }

  // ────────────────────────────────────────────────────────────
  // Hooks automáticos · escuchar eventos globales del panel
  // ────────────────────────────────────────────────────────────
  function setupHooks() {
    // Clics en botones de "Resolver" o "Guardar" exitosos
    document.addEventListener('click', (ev) => {
      const t = ev.target.closest('button, a');
      if (!t) return;
      const text = (t.textContent || '').toLowerCase();
      // Clics positivos (cierre · resolución · guardar)
      if (/resolver|guardar|enviar|cerrar negocio|firmar|aprobar/.test(text)) {
        window.amorDivorcio.mover(+2, `clic positivo: ${text.slice(0,30)}`, currentTab());
      }
      // Clics negativos (cancelar repetido, error visible)
      if (/cancelar|deshacer|reintentar/.test(text)) {
        // No restamos por cancelar primer vez · solo si es repetido en 10s
        const recent = state.history.filter(h => Date.now() - h.ts < 10000 && /cancelar/.test(h.razon));
        if (recent.length >= 2) window.amorDivorcio.mover(-3, `cancelado 3+ veces: ${text.slice(0,30)}`, currentTab());
      }
    });

    // Errores JS no manejados
    window.addEventListener('error', (e) => {
      window.amorDivorcio.mover(-4, `error JS: ${(e.message||'').slice(0,40)}`, currentTab());
    });

    // Fetch fallidos (wrapper opcional sobre window.fetch)
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const start = Date.now();
      try {
        const res = await origFetch(...args);
        const ms = Date.now() - start;
        if (!res.ok && res.status >= 500) {
          window.amorDivorcio.mover(-3, `fetch ${res.status} ${args[0]?.toString?.()?.slice(0,40) || ''}`, currentTab());
        } else if (ms > 5000) {
          window.amorDivorcio.mover(-2, `fetch lento ${ms}ms`, currentTab());
        }
        return res;
      } catch (err) {
        window.amorDivorcio.mover(-4, `fetch falló: ${(err.message||'').slice(0,40)}`, currentTab());
        throw err;
      }
    };

    // Cambio de tab · pequeño bonus por uso (engagement)
    document.querySelectorAll('button.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.amorDivorcio.mover(+1, `navega a tab ${btn.dataset.tab || '?'}`, btn.dataset.tab);
      });
    });
  }

  function currentTab() {
    const active = document.querySelector('button.tab-btn.active');
    return active?.dataset.tab || 'desconocido';
  }

  // ────────────────────────────────────────────────────────────
  // Boot
  // ────────────────────────────────────────────────────────────
  function init() {
    loadState();
    createAguja();
    renderAguja();
    setupHooks();
    console.log('💚 Amor-Divorcio activado · score actual:', state.score, '/100');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
