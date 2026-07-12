(function () {
  function safeEsc(esc, value) {
    return typeof esc === 'function' ? esc(value) : String(value || '');
  }

  function safeClean(cleanMsg, value) {
    return typeof cleanMsg === 'function' ? cleanMsg(value || '') : String(value || '').trim();
  }

  function updateChatStatus(options) {
    const statusText = options?.statusText;
    const history = Array.isArray(options?.history) ? options.history : [];
    const inferDiegoContract = options?.inferDiegoContract;
    if (!statusText || typeof inferDiegoContract !== 'function') return false;

    const last = [...history].reverse().find(entry => entry.role === 'diego');
    if (!last) {
      statusText.textContent = 'Consulta, analisis y ejecucion con trazabilidad';
      return true;
    }

    const contract = inferDiegoContract(last);
    statusText.textContent = `Modo actual: ${contract.modeLabel} · Estado: ${contract.stateLabel}`;
    return true;
  }

  function renderConversationHeader(options) {
    const last = options?.last || null;
    const profile = options?.profile || { label: 'Equipo', tone: '' };
    const esc = options?.esc;
    const cleanMsg = options?.cleanMsg;
    const inferDiegoContract = options?.inferDiegoContract;
    const inferTrace = options?.inferTrace;
    const inferNextStep = options?.inferNextStep;

    if (!last) {
      return `<div class="diego-conversation-head">
        <div class="diego-turn-summary">
          <div class="diego-turn-kicker">Foco del momento</div>
          <div class="diego-turn-title">Diego listo para reclamos, oportunidades y ejecucion por rol</div>
          <div class="diego-turn-sub">${safeEsc(esc, profile.tone)} ${safeEsc(esc, profile.emptySub || '')}</div>
          <div class="diego-turn-pills">
            <span class="diego-turn-pill">Rol activo: ${safeEsc(esc, profile.label)}</span>
            <span class="diego-turn-pill">Reclamo → oportunidad</span>
            <span class="diego-turn-pill">Tareas con responsable</span>
          </div>
        </div>
      </div>`;
    }

    const contract = typeof inferDiegoContract === 'function'
      ? inferDiegoContract(last)
      : { modeLabel: 'Consulta', stateLabel: 'Lectura' };
    const trace = typeof inferTrace === 'function' ? inferTrace(last) : 'Sin traza';
    const nextStep = typeof inferNextStep === 'function' ? inferNextStep(last) : 'Seguir';

    return `<div class="diego-conversation-head">
      <div class="diego-turn-summary">
        <div class="diego-turn-kicker">Turno actual</div>
        <div class="diego-turn-title">${safeEsc(esc, contract.modeLabel)} · ${safeEsc(esc, contract.stateLabel)}</div>
        <div class="diego-turn-sub">${safeEsc(esc, safeClean(cleanMsg, last.mensaje) || 'Sin detalle')}</div>
        <div class="diego-turn-pills">
          <span class="diego-turn-pill">Traza: ${safeEsc(esc, trace)}</span>
          <span class="diego-turn-pill">Paso: ${safeEsc(esc, nextStep)}</span>
        </div>
      </div>
    </div>`;
  }

  function renderIntelligentEmptyState(options) {
    const profile = options?.profile || {};
    const esc = options?.esc;
    return `<div class="diego-empty-card">
      <div class="diego-empty-kicker">Modo operativo</div>
      <div class="diego-empty-title">${safeEsc(esc, profile.emptyTitle || 'Diego listo')}</div>
      <div class="diego-empty-sub">${safeEsc(esc, profile.emptySub || '')}</div>
      <div class="diego-empty-list">
        <div><strong>1.</strong> Recibe reclamos de panel, precios, documentos, informacion, servicios, cobros, pagos o trabas.</div>
        <div><strong>2.</strong> Los ordena como reclamo, oportunidad, bloqueo o tarea priorizada.</div>
        <div><strong>3.</strong> Baja responsable, pendiente, siguiente paso y tono de empuje cercano y firme.</div>
      </div>
    </div>`;
  }

  function getOnboardingChips(options) {
    const profile = options?.profile || { prompts: [] };
    const intake = Array.isArray(options?.intakePrompts) ? options.intakePrompts : [];
    return [...(profile.prompts || []), ...intake].slice(0, 6);
  }

  window.DIEGO_UI = {
    updateChatStatus,
    renderConversationHeader,
    renderIntelligentEmptyState,
    getOnboardingChips,
  };
})();
