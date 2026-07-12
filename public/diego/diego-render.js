(function () {
  function safeEsc(esc, value) {
    return typeof esc === 'function' ? esc(value) : String(value || '');
  }

  function renderMessagesHtml(options) {
    const history = Array.isArray(options?.history) ? options.history : [];
    const esc = options?.esc;
    const cleanMsg = options?.cleanMsg;
    const inferDiegoContract = options?.inferDiegoContract;
    const inferTrace = options?.inferTrace;
    const inferNextStep = options?.inferNextStep;
    const fmtHora = options?.fmtHora;

    return history.map(entry => {
      const cls = entry.role === 'user' ? 'mine' : (entry.role === 'thinking' ? 'thinking' : 'diego');
      const attach = entry.attach ? `<div class="diego-msg-attach">📎 ${safeEsc(esc, entry.attach)}</div>` : '';
      const actionsArr = (entry.actions || []).map(action => `<span class="chip">${safeEsc(esc, action.tool || action)}</span>`).join('');
      const actions = actionsArr ? `<div class="diego-actions">${actionsArr}</div>` : '';
      const suggestionsArr = (entry.suggestions || []).slice(0, 4).map((suggestion, index) =>
        `<button type="button" data-sugg="${index}">${safeEsc(esc, suggestion.label || suggestion)}</button>`).join('');
      const suggestions = suggestionsArr ? `<div class="diego-suggestions">${suggestionsArr}</div>` : '';
      const sixW = entry.six_w && (entry.six_w.what || entry.six_w.when)
        ? `<div class="diego-msg-meta">🧠 ${safeEsc(esc, entry.six_w.what || '')}${entry.six_w.when ? ' · ⏰ ' + safeEsc(esc, entry.six_w.when) : ''}${entry.six_w.who ? ' · 👤 ' + safeEsc(esc, entry.six_w.who) : ''}</div>`
        : '';
      const thinkingHtml = 'Diego esta escribiendo<span class="diego-typing-dots"><span></span><span></span><span></span></span>';
      const msgHtml = cls === 'thinking' ? thinkingHtml : safeEsc(esc, entry.mensaje);
      const contract = cls === 'diego'
        ? (() => {
            const c = typeof inferDiegoContract === 'function'
              ? inferDiegoContract(entry)
              : { mode: 'consulta', modeLabel: 'Consulta', state: 'lectura', stateLabel: 'Lectura' };
            return `<div class="diego-contract">
              <div class="diego-contract-badges">
                <span class="diego-badge mode-${c.mode}">${safeEsc(esc, c.modeLabel)}</span>
                <span class="diego-badge state-${c.state}">${safeEsc(esc, c.stateLabel)}</span>
              </div>
              <div class="diego-kv"><strong>Resultado:</strong> ${safeEsc(esc, typeof cleanMsg === 'function' ? cleanMsg(entry.mensaje) || '(sin detalle)' : String(entry.mensaje || '(sin detalle)'))}</div>
              <div class="diego-kv"><strong>Trazabilidad:</strong> ${safeEsc(esc, typeof inferTrace === 'function' ? inferTrace(entry) : 'Sin traza')}</div>
              <div class="diego-kv"><strong>Siguiente paso:</strong> ${safeEsc(esc, typeof inferNextStep === 'function' ? inferNextStep(entry) : 'Seguir')}</div>
            </div>`;
          })()
        : '';

      return `<div class="diego-msg ${cls}">
        <div class="${cls === 'thinking' ? '' : 'diego-summary'}">${msgHtml}</div>
        ${attach}
        ${contract}
        ${actions}
        ${sixW}
        <div class="diego-msg-meta">${cls === 'mine' ? 'Vos' : 'Diego'} · ${typeof fmtHora === 'function' ? fmtHora(entry.ts) : ''}${entry.tokens ? ' · ' + entry.tokens + ' tok' : ''}${entry.cola_id ? ' · ✅ cola' : ''}</div>
        ${suggestions}
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
      const chips = typeof getOnboardingChips === 'function'
        ? getOnboardingChips().map(chip => `<button type="button" data-chip="${safeEsc(esc, chip)}">${safeEsc(esc, chip)}</button>`).join('')
        : '';
      const profile = typeof getDiegoRoleProfile === 'function' ? getDiegoRoleProfile() : {};
      body.innerHTML = `<div class="diego-shell">
          <div class="diego-conversation">
            ${typeof renderConversationHeader === 'function' ? renderConversationHeader(null) : ''}
            ${typeof renderIntelligentEmptyState === 'function' ? renderIntelligentEmptyState(profile) : ''}
            <div class="diego-empty">Probá con esto:
              <div class="diego-onboarding-chips">${chips}</div>
              <div style="margin-top:8px;font-size:11px;color:#94a3b8">o arrastrá una foto · audio · PDF</div>
            </div>
          </div>
          ${typeof renderContextPanel === 'function' ? renderContextPanel(null) : ''}
        </div>
        <div class="diego-drag-overlay" id="diegoDragOverlay">📎 Soltá el archivo acá</div>`;

      body.querySelectorAll('button[data-chip]').forEach(btn => {
        btn.addEventListener('click', () => {
          input.value = btn.getAttribute('data-chip') || '';
          input.focus();
          form.dispatchEvent(new Event('submit'));
        });
      });

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
    if (typeof bindContextPrompts === 'function') bindContextPrompts();
    if (typeof bindContextTabs === 'function') bindContextTabs();
    return true;
  }

  window.DIEGO_RENDER = {
    render,
  };
})();
