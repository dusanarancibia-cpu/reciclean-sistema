(function () {
  function safeEsc(esc, value) {
    return typeof esc === 'function' ? esc(value) : String(value || '');
  }

  function renderMessagesHtml(options) {
    const history = Array.isArray(options?.history) ? options.history : [];
    const esc = options?.esc;
    const fmtHora = options?.fmtHora;

    // Nota UX 13-jul-2026: el detalle de modo/estado/trazabilidad/siguiente paso
    // vive en el header del turno (diego-turn-summary) y en el panel lateral
    // colapsado (diego-context.js). No se repite acá para que el mensaje respire.
    return history.map(entry => {
      const cls = entry.role === 'user' ? 'mine' : (entry.role === 'thinking' ? 'thinking' : 'diego');
      const attach = entry.attach ? `<div class="diego-msg-attach">📎 ${safeEsc(esc, entry.attach)}</div>` : '';
      const actionsArr = (entry.actions || []).map(action => `<span class="chip">${safeEsc(esc, action.tool || action)}</span>`).join('');
      const actions = actionsArr ? `<div class="diego-actions">${actionsArr}</div>` : '';
      const thinkingHtml = 'Diego esta escribiendo<span class="diego-typing-dots"><span></span><span></span><span></span></span>';
      const msgHtml = cls === 'thinking' ? thinkingHtml : safeEsc(esc, entry.mensaje);
      // Voz de salida (paso 2 D-DIEGO-VOZ-COMPOSER-001) · solo respuestas de Diego,
      // nunca "mine"/"thinking". Se oculta con gracia si el navegador no soporta
      // speechSynthesis. Estado inicial del botón respeta si esta misma respuesta
      // ya está sonando (ej: re-render mientras habla por un mensaje nuevo).
      const ttsAvailable = cls === 'diego' && window.DIEGO_TTS && window.DIEGO_TTS.isSupported();
      const ttsSpeakingNow = ttsAvailable && window.DIEGO_TTS.isSpeaking(entry.ts);
      const tts = ttsAvailable
        ? `<button type="button" class="diego-tts-btn${ttsSpeakingNow ? ' speaking' : ''}" data-tts-ts="${entry.ts}">${ttsSpeakingNow ? '⏹ Detener' : '🔊 Escuchar'}</button>`
        : '';

      return `<div class="diego-msg ${cls}">
        <div class="${cls === 'thinking' ? '' : 'diego-summary'}">${msgHtml}</div>
        ${attach}
        ${tts}
        ${actions}
        <div class="diego-msg-meta">${cls === 'mine' ? 'Vos' : 'Diego'} · ${typeof fmtHora === 'function' ? fmtHora(entry.ts) : ''}${entry.tokens ? ' · ' + entry.tokens + ' tok' : ''}${entry.cola_id ? ' · ✅ cola' : ''}</div>
      </div>`;
    }).join('');
  }

  function bindSuggestionButtons(options) {
    const body = options?.body;
    const input = options?.input;
    const history = Array.isArray(options?.history) ? options.history : [];
    if (!body || !input) return;

    body.querySelectorAll('button[data-sugg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const last = [...history].reverse().find(entry => entry.role === 'diego');
        const idx = parseInt(btn.getAttribute('data-sugg'), 10);
        const suggestion = last?.suggestions?.[idx];
        if (suggestion) {
          input.value = suggestion.action || suggestion.label || suggestion;
          input.focus();
        }
      });
    });
  }

  // Voz de salida (paso 2 D-DIEGO-VOZ-COMPOSER-001) · botón Escuchar/Detener por
  // respuesta de Diego. Usa entry.ts como identificador estable (sobrevive a que
  // el body.innerHTML se reconstruya entero en cada render — no depende de índices
  // de array, que sí podrían desalinearse). Actualiza el botón puntual al terminar
  // la locución en vez de forzar un re-render completo (más simple, no rompe scroll).
  function bindTtsButtons(options) {
    const body = options?.body;
    const history = Array.isArray(options?.history) ? options.history : [];
    if (!body || !window.DIEGO_TTS) return;

    function setButtonState(btn, speaking) {
      btn.textContent = speaking ? '⏹ Detener' : '🔊 Escuchar';
      btn.classList.toggle('speaking', speaking);
    }

    body.querySelectorAll('button[data-tts-ts]').forEach(btn => {
      const ts = Number(btn.getAttribute('data-tts-ts'));
      btn.addEventListener('click', () => {
        if (window.DIEGO_TTS.isSpeaking(ts)) {
          window.DIEGO_TTS.stop();
          setButtonState(btn, false);
          return;
        }
        // Arrancar una nueva corta cualquier otra que estuviera en "Detener".
        body.querySelectorAll('button[data-tts-ts].speaking').forEach(other => setButtonState(other, false));
        const entry = history.find(h => h.ts === ts);
        setButtonState(btn, true);
        window.DIEGO_TTS.speak(entry ? entry.mensaje : '', {
          id: ts,
          onEnd: () => setButtonState(btn, false),
          onError: () => setButtonState(btn, false),
        });
      });
    });
  }

  function render(options) {
    const history = Array.isArray(options?.history) ? options.history : [];
    const body = options?.body;
    const input = options?.input;
    const form = options?.form;
    const esc = options?.esc;
    const getOnboardingChips = options?.getOnboardingChips;
    const getDiegoRoleProfile = options?.getDiegoRoleProfile;
    const renderConversationHeader = options?.renderConversationHeader;
    const renderIntelligentEmptyState = options?.renderIntelligentEmptyState;
    const renderContextPanel = options?.renderContextPanel;
    const updateChatStatus = options?.updateChatStatus;
    const bindContextPrompts = options?.bindContextPrompts;
    const bindContextTabs = options?.bindContextTabs;

    if (!body || !input || !form) return false;

    if (!history.length) {
      const profile = typeof getDiegoRoleProfile === 'function' ? getDiegoRoleProfile() : {};
      body.innerHTML = `<div class="diego-shell">
          <div class="diego-conversation">
            ${typeof renderConversationHeader === 'function' ? renderConversationHeader(null) : ''}
            ${typeof renderIntelligentEmptyState === 'function' ? renderIntelligentEmptyState(profile) : ''}
            <div class="diego-empty">Escribí, adjuntá o grabá una nota de voz.</div>
          </div>
          ${typeof renderContextPanel === 'function' ? renderContextPanel(null) : ''}
        </div>
        <div class="diego-drag-overlay" id="diegoDragOverlay">📎 Soltá el archivo acá</div>`;

      if (typeof bindContextPrompts === 'function') bindContextPrompts();
      if (typeof bindContextTabs === 'function') bindContextTabs();
      if (typeof updateChatStatus === 'function') updateChatStatus();
      return true;
    }

    const html = renderMessagesHtml(options);
    const lastDiego = [...history].reverse().find(entry => entry.role === 'diego');
    body.innerHTML = `<div class="diego-shell">
        <div class="diego-conversation" id="diegoConversationPane">${typeof renderConversationHeader === 'function' ? renderConversationHeader(lastDiego) : ''}${html}</div>
        ${typeof renderContextPanel === 'function' ? renderContextPanel(lastDiego) : ''}
      </div>
      <div class="diego-drag-overlay" id="diegoDragOverlay">📎 Soltá el archivo acá</div>`;

    document.getElementById('diegoConversationPane')?.scrollTo({ top: 999999, behavior: 'auto' });
    if (typeof updateChatStatus === 'function') updateChatStatus();
    bindSuggestionButtons({ body, input, history });
    bindTtsButtons({ body, history });
    if (typeof bindContextPrompts === 'function') bindContextPrompts();
    if (typeof bindContextTabs === 'function') bindContextTabs();
    return true;
  }

  window.DIEGO_RENDER = {
    render,
  };
})();
