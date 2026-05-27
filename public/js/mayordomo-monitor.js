/* ═══════════════════════════════════════════════════════════
   Panel RDO · Mayordomo Monitor de Diego
   Branch: claude/panel-amor-verde-26may
   Rol: PC1 (mayordomo) vigila la calidad de Diego en tiempo real.
   Cada respuesta de Diego es evaluada · si pierde calidad, mueve la aguja
   al divorcio + dispara alerta al CEO.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_DIEGO_QUALITY = 'diego_quality_history_v1';
  const MAX_HISTORY = 50;
  const VENTANA_ANALISIS = 10; // últimas N respuestas

  const state = {
    history: [],
    alertaActiva: false
  };

  // ────────────────────────────────────────────────────────────
  // Cargar historial previo
  // ────────────────────────────────────────────────────────────
  try {
    const saved = localStorage.getItem(STORAGE_DIEGO_QUALITY);
    if (saved) state.history = JSON.parse(saved).slice(-MAX_HISTORY);
  } catch (e) { /* ignore */ }

  // ────────────────────────────────────────────────────────────
  // Evaluar calidad de una respuesta de Diego (0-100)
  // ────────────────────────────────────────────────────────────
  function evaluarRespuesta(texto) {
    if (!texto) return { score: 0, razones: ['vacía'] };
    const t = texto.trim();
    const razones = [];
    let score = 70; // baseline

    // Penalizaciones
    if (t.length < 30) { score -= 25; razones.push('muy corta'); }
    if (/no\s+s[ée]|no\s+estoy\s+seguro|no\s+tengo\s+ese\s+dato/i.test(t)) {
      score -= 10; razones.push('evasiva pero honesta');
    }
    if (/no\s+puedo\s+ayudart[ee]|consulta\s+con|pregunt[áa]\s+a/i.test(t) && t.length < 80) {
      score -= 20; razones.push('deriva sin contexto');
    }
    if (/lo siento|disculp[ae]/i.test(t) && t.length < 100) {
      score -= 8; razones.push('se disculpa pero no resuelve');
    }
    // Repetida vs últimas 3
    const ultimas = state.history.slice(-3).map(h => h.respuesta);
    if (ultimas.some(u => similarity(u, t) > 0.85)) {
      score -= 30; razones.push('respuesta repetida');
    }

    // Premios
    if (t.length > 200) { score += 10; razones.push('respuesta extensa'); }
    if (/seg[úu]n\s+(la\s+)?(ley|norma|fuente|panel|supabase)/i.test(t)) {
      score += 15; razones.push('cita fuente · alto valor');
    }
    if (/(\d+\s*(ton|kg|uf|clp|\$))|(\d{1,3}([.,]\d{3})*)/.test(t)) {
      score += 10; razones.push('incluye datos verificables');
    }
    if (/^\s*[\d•\-*]/.test(t.split('\n')[1] || '')) {
      score += 8; razones.push('estructura con lista');
    }

    return {
      score: clamp(Math.round(score), 0, 100),
      razones: razones.length ? razones : ['neutra']
    };
  }

  function similarity(a, b) {
    if (!a || !b) return 0;
    const lonA = a.length, lonB = b.length;
    if (Math.abs(lonA - lonB) / Math.max(lonA, lonB) > 0.5) return 0;
    const tokensA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const tokensB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    let inter = 0;
    tokensA.forEach(t => { if (tokensB.has(t)) inter++; });
    return inter / Math.max(tokensA.size, tokensB.size, 1);
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  // ────────────────────────────────────────────────────────────
  // Registrar respuesta de Diego
  // ────────────────────────────────────────────────────────────
  function registrar(pregunta, respuesta, meta) {
    const evaluacion = evaluarRespuesta(respuesta);
    state.history.push({
      ts: Date.now(),
      pregunta: (pregunta || '').slice(0, 200),
      respuesta: (respuesta || '').slice(0, 500),
      score: evaluacion.score,
      razones: evaluacion.razones,
      tab: currentTab(),
      meta: meta || {}
    });
    state.history = state.history.slice(-MAX_HISTORY);
    try {
      localStorage.setItem(STORAGE_DIEGO_QUALITY, JSON.stringify(state.history));
    } catch (e) { /* ignore */ }

    // Movimiento de la aguja amor-divorcio
    if (window.amorDivorcio) {
      const delta = evaluacion.score >= 75 ? +2
                   : evaluacion.score >= 50 ? 0
                   : evaluacion.score >= 30 ? -2
                   : -4;
      if (delta !== 0) {
        window.amorDivorcio.mover(delta, `Diego ${evaluacion.score}/100: ${evaluacion.razones[0]}`, 'diego_chat');
      }
    }

    // Detección de patrón de divorcio
    detectarPatronDeDivorcio();
  }

  function detectarPatronDeDivorcio() {
    const recientes = state.history.slice(-VENTANA_ANALISIS);
    if (recientes.length < 5) return;
    const promedio = recientes.reduce((a, h) => a + h.score, 0) / recientes.length;
    const malas = recientes.filter(h => h.score < 50).length;

    if (promedio < 50 && malas >= 5 && !state.alertaActiva) {
      state.alertaActiva = true;
      avisarMayordomo(promedio, malas);
    }
    if (promedio >= 60) {
      state.alertaActiva = false; // se calmó
    }
  }

  function avisarMayordomo(promedio, malas) {
    // Notificación discreta tipo toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 80px; right: 20px; z-index: 95;
      background: white; border-left: 5px solid var(--divorcio-rojo);
      padding: 14px 18px; border-radius: 12px;
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.18);
      max-width: 340px; font-size: 13px;
      animation: amor-slidein 0.3s ease;
    `;
    toast.innerHTML = `
      <div style="font-weight:700; color:var(--divorcio-rojo); margin-bottom:4px;">
        🛎️ Mayordomo aviso
      </div>
      <div style="color:#4b5563;">
        Diego viene respondiendo flojo (${Math.round(promedio)}/100 promedio · ${malas} respuestas pobres en últimas ${VENTANA_ANALISIS}). Voy a marcarlo en el panel y notificar a Dusan.
      </div>
      <button onclick="this.parentElement.remove()" style="margin-top:8px; font-size:12px; color:#dc2626; font-weight:600;">Entendido</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 15000);

    // Registrar en panel.diego_errores (intento · sin bloquear si falla)
    try {
      if (window.supabase || window.sb) {
        const sb = window.sb || window.supabase;
        const userEmail = (localStorage.getItem('rf_session') ? JSON.parse(localStorage.getItem('rf_session')).email : null) || 'anon';
        sb.from('diego_errores').insert({
          tipo: 'calidad_baja_acumulada',
          severidad: 'media',
          mensaje: `Diego ${Math.round(promedio)}/100 promedio · ${malas} respuestas pobres en últimas ${VENTANA_ANALISIS}`,
          contexto: {
            usuario: userEmail,
            ventana: VENTANA_ANALISIS,
            promedio: Math.round(promedio),
            malas,
            ultima_pregunta: state.history[state.history.length-1]?.pregunta,
            ultima_respuesta_inicio: state.history[state.history.length-1]?.respuesta?.slice(0, 100)
          }
        }).then(() => console.log('🛎️ Mayordomo: aviso registrado en diego_errores'))
          .catch(e => console.warn('Mayordomo aviso registro fallo:', e?.message));
      }
    } catch (e) { /* ignore */ }
  }

  function currentTab() {
    const active = document.querySelector('button.tab-btn.active');
    return active?.dataset.tab || 'desconocido';
  }

  // ────────────────────────────────────────────────────────────
  // Auto-hook al chat FAB de Diego (DOM observer)
  // ────────────────────────────────────────────────────────────
  function autoHookDiego() {
    // Buscar contenedor de mensajes Diego
    const candidatos = ['diegoMessages', 'fabMessages', 'dieguito-msgs', 'chat-messages'];
    let container = null;
    for (const id of candidatos) {
      container = document.getElementById(id);
      if (container) break;
    }
    if (!container) {
      // Reintentar en 3s · DOM puede tardar
      setTimeout(autoHookDiego, 3000);
      return;
    }

    const mo = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          // Heurística · si es burbuja de Diego (no usuario)
          const text = node.textContent || '';
          const isDiego = /diego|bot|assistant/i.test(node.className || '') ||
                          node.querySelector?.('[data-role="assistant"]') ||
                          (text.length > 20 && !node.classList?.contains('user-msg'));
          if (isDiego) {
            // Buscar última pregunta del usuario en el DOM
            const allMsgs = container.querySelectorAll('div');
            let lastUserMsg = '';
            for (let i = allMsgs.length - 2; i >= 0; i--) {
              if (/user|usuario|tu-msg/i.test(allMsgs[i].className || '')) {
                lastUserMsg = allMsgs[i].textContent || '';
                break;
              }
            }
            registrar(lastUserMsg, text, { hook: 'auto-dom' });
          }
        });
      });
    });
    mo.observe(container, { childList: true, subtree: true });
    console.log('🛎️ Mayordomo monitor: enganchado a', container.id);
  }

  // API pública
  window.mayordomoMonitor = {
    registrar,
    evaluar: evaluarRespuesta,
    historial: () => state.history.slice(),
    stats() {
      const ult = state.history.slice(-VENTANA_ANALISIS);
      if (!ult.length) return null;
      const promedio = ult.reduce((a, h) => a + h.score, 0) / ult.length;
      return {
        ventana: ult.length,
        promedio: Math.round(promedio),
        ultima: ult[ult.length-1]
      };
    },
    reset() { state.history = []; localStorage.removeItem(STORAGE_DIEGO_QUALITY); }
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoHookDiego);
  } else {
    setTimeout(autoHookDiego, 1500);
  }
  console.log('🛎️ Mayordomo monitor activado · vigila calidad Diego');
})();
