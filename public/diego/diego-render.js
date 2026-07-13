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
      const suggestionsArr = (entry.suggestions || []).slice(0, 4).map((suggestion, index) =>
        `<button type="button" data-sugg="${index}">${safeEsc(esc, suggestion.label || suggestion)}</button>`).join('');
      const suggestions = suggestionsArr ? `<div class="diego-suggestions">${suggestionsArr}</div>` : '';
      const thinkingHtml = 'Diego esta escribiendo<span class="diego-typing-dots"><span></span><span></span><span></span></span>';
      const msgHtml = cls === 'thinking' ? thinkingHtml : safeEsc(esc, entry.mensaje);

      return `<div class="diego-msg ${cls}">
        <div class="${cls === 'thinking' ? '' : 'diego-summary'}">${msgHtml}</div>
        ${attach}
        ${actions}
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
