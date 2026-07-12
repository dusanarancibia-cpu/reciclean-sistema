(function () {
  function safeEsc(esc, value) {
    return typeof esc === 'function' ? esc(value) : String(value || '');
  }

  function renderSection(esc, title, body, options) {
    const open = options?.open ? ' open' : '';
    const hint = options?.hint ? `<span class="diego-side-section-hint">${safeEsc(esc, options.hint)}</span>` : '';
    return `<details class="diego-side-section"${open}>
      <summary>
        <span>${safeEsc(esc, title)}</span>
        ${hint}
      </summary>
      <div class="diego-side-section-body">
        ${body}
      </div>
    </details>`;
  }

  function renderContextPanel(options) {
    const last = options?.last || null;
    const profile = options?.profile || { label: 'Equipo', tone: '' };
    const esc = options?.esc;
    const cleanMsg = options?.cleanMsg;
    const inferDiegoContract = options?.inferDiegoContract;
    const inferTrace = options?.inferTrace;
    const inferNextStep = options?.inferNextStep;
    const renderRolePromptGrid = options?.renderRolePromptGrid;
    const renderComplaintPromptGrid = options?.renderComplaintPromptGrid;
    const renderExecutivePriceCard = options?.renderExecutivePriceCard;
    const renderDiegoStrategicCards = options?.renderDiegoStrategicCards;
    const renderCaseBoard = options?.renderCaseBoard;
    const renderTeamPromptGrid = options?.renderTeamPromptGrid;
    const renderTurnMemory = options?.renderTurnMemory;
    const renderCaseMemory = options?.renderCaseMemory;
    const renderTeamMemory = options?.renderTeamMemory;
    const strategicCards = `${typeof renderExecutivePriceCard === 'function' ? renderExecutivePriceCard(profile) : ''}${typeof renderDiegoStrategicCards === 'function' ? renderDiegoStrategicCards() : ''}`;

    if (!last) {
      const sections = [
        renderSection(esc, 'Arranque por rol', `
          <div class="diego-role-grid">
            ${typeof renderRolePromptGrid === 'function' ? renderRolePromptGrid(profile) : ''}
          </div>
        `, { open: true, hint: 'prompts utiles' }),
        renderSection(esc, 'Intake de reclamos', `
          <div class="diego-role-grid">
            ${typeof renderComplaintPromptGrid === 'function' ? renderComplaintPromptGrid() : ''}
          </div>
        `, { hint: 'panel y terreno' }),
        renderSection(esc, 'Modelo de trabajo', `
          <div class="diego-flow-list">
            <div><strong>1.</strong> Registrar reclamo o ruido real</div>
            <div><strong>2.</strong> Decidir si va a oportunidad, incidente o pendiente</div>
            <div><strong>3.</strong> Bajar dueño, prioridad y siguiente control</div>
          </div>
        `, { hint: 'como opera Diego' }),
        strategicCards
          ? renderSection(esc, 'Decision y estrategia', strategicCards, { hint: 'precio y criterio' })
          : '',
        renderSection(esc, 'Memoria del turno', `${typeof renderTurnMemory === 'function' ? renderTurnMemory(profile) : ''}`, { hint: 'continuidad' }),
        renderSection(esc, 'Casos Diego', `${typeof renderCaseBoard === 'function' ? renderCaseBoard(profile) : ''}`, { open: true, hint: 'seguimiento vivo' }),
        renderSection(esc, 'Memoria por caso', `${typeof renderCaseMemory === 'function' ? renderCaseMemory(profile) : ''}`, { hint: 'seguimiento retenido' }),
        renderSection(esc, 'Empuje del equipo', `
          <div class="diego-side-actions">
            ${typeof renderTeamPromptGrid === 'function' ? renderTeamPromptGrid(profile) : ''}
          </div>
        `, { hint: 'pendientes y foco' }),
        renderSection(esc, 'Memoria del equipo', `${typeof renderTeamMemory === 'function' ? renderTeamMemory(profile) : ''}`, { hint: 'carga compartida' }),
        renderSection(esc, 'Ir directo', `
          <div class="diego-side-nav">
            <button type="button" data-ctx-tab="bandeja_dieg">📥 Bandeja Diego</button>
            <button type="button" data-ctx-tab="mi_dia">📅 Mi Dia</button>
            <button type="button" data-ctx-tab="oportunidades">🎯 Oportunidades</button>
            <button type="button" data-ctx-tab="tablero_precios">🎯 Mesa de Precios</button>
          </div>
        `, { hint: 'saltos rapidos' }),
      ].filter(Boolean).join('');

      return `<aside class="diego-context">
        <div class="diego-side-card diego-side-card-key">
          <div class="diego-side-label">Rol activo</div>
          <div class="diego-side-main">${safeEsc(esc, profile.label)}</div>
          <div class="diego-side-sub">${safeEsc(esc, profile.tone)}</div>
        </div>
        ${sections}
      </aside>`;
    }

    const contract = typeof inferDiegoContract === 'function'
      ? inferDiegoContract(last)
      : { modeLabel: 'Consulta', stateLabel: 'Lectura' };
    const actions = (last.actions || []).slice(0, 4).map(action => `<div>${safeEsc(esc, action.tool || action)}</div>`).join('');
    const suggestions = (last.suggestions || []).slice(0, 3).map(suggestion => {
      const label = suggestion.label || suggestion.action || suggestion;
      const prompt = suggestion.action || suggestion.label || suggestion;
      return `<button type="button" data-ctx-prompt="${safeEsc(esc, prompt)}">${safeEsc(esc, label)}</button>`;
    }).join('');
    const sixW = last.six_w && (last.six_w.what || last.six_w.when || last.six_w.who)
      ? `<div class="diego-side-list">
          ${last.six_w.what ? `<div><strong>Que:</strong> ${safeEsc(esc, last.six_w.what)}</div>` : ''}
          ${last.six_w.when ? `<div><strong>Cuando:</strong> ${safeEsc(esc, last.six_w.when)}</div>` : ''}
          ${last.six_w.who ? `<div><strong>Quien:</strong> ${safeEsc(esc, last.six_w.who)}</div>` : ''}
        </div>`
      : `<div class="diego-side-sub">Sin contexto adicional visible en este turno.</div>`;

    const sections = [
      renderSection(esc, 'Siguiente movimiento', `
        <div class="diego-side-actions">
          ${suggestions || `<button type="button" data-ctx-prompt="${safeEsc(esc, typeof inferNextStep === 'function' ? inferNextStep(last) : 'Seguir')}">${safeEsc(esc, typeof inferNextStep === 'function' ? inferNextStep(last) : 'Seguir')}</button>`}
        </div>
      `, { open: true, hint: 'accion inmediata' }),
      renderSection(esc, 'Memoria del turno', `${typeof renderTurnMemory === 'function' ? renderTurnMemory(profile) : ''}`, { open: true, hint: 'continuidad' }),
      renderSection(esc, 'Casos Diego', `${typeof renderCaseBoard === 'function' ? renderCaseBoard(profile) : ''}`, { open: true, hint: 'seguimiento vivo' }),
      renderSection(esc, 'Memoria por caso', `${typeof renderCaseMemory === 'function' ? renderCaseMemory(profile) : ''}`, { hint: 'seguimiento retenido' }),
      renderSection(esc, 'Contexto del turno', `${sixW}`, { hint: 'que cuando quien' }),
      renderSection(esc, 'Acciones detectadas', actions
        ? `<div class="diego-side-list">${actions}</div>`
        : `<div class="diego-side-sub">Sin acciones registradas en este turno.</div>`, { hint: 'lectura actual' }),
      renderSection(esc, 'Reclamos y oportunidades', `
        <div class="diego-flow-list">
          <div><strong>Entrada:</strong> panel, precios, documentos, informacion, servicios, cobros, pagos o trabas.</div>
          <div><strong>Decision:</strong> reclamo gestionable, oportunidad real o bloqueo que escalar.</div>
          <div><strong>Salida:</strong> responsable, prioridad, seguimiento y cierre.</div>
        </div>
      `, { hint: 'marco operativo' }),
      strategicCards
        ? renderSection(esc, 'Decision y estrategia', strategicCards, { hint: 'precio y criterio' })
        : '',
      renderSection(esc, 'Empuje del equipo', `
        <div class="diego-side-actions">
          ${typeof renderTeamPromptGrid === 'function' ? renderTeamPromptGrid(profile) : ''}
        </div>
      `, { hint: 'pendientes y foco' }),
      renderSection(esc, 'Memoria del equipo', `${typeof renderTeamMemory === 'function' ? renderTeamMemory(profile) : ''}`, { hint: 'carga compartida' }),
      renderSection(esc, 'Vistas relacionadas', `
        <div class="diego-side-nav">
          <button type="button" data-ctx-tab="bandeja_dieg">📥 Bandeja Diego</button>
          <button type="button" data-ctx-tab="mi_dia">📅 Mi Dia</button>
          <button type="button" data-ctx-tab="oportunidades">🎯 Oportunidades</button>
          <button type="button" data-ctx-tab="tablero_precios">🎯 Mesa de Precios</button>
        </div>
      `, { hint: 'saltos rapidos' }),
    ].filter(Boolean).join('');

    return `<aside class="diego-context">
      <div class="diego-side-card diego-side-card-key">
        <div class="diego-side-label">Estado actual</div>
        <div class="diego-side-main">${safeEsc(esc, contract.modeLabel)} · ${safeEsc(esc, contract.stateLabel)}</div>
        <div class="diego-side-sub">${safeEsc(esc, typeof cleanMsg === 'function' ? cleanMsg(last.mensaje) || 'Sin detalle' : String(last.mensaje || 'Sin detalle'))}</div>
      </div>
      <div class="diego-side-card">
        <div class="diego-side-label">Rol que conduce</div>
        <div class="diego-side-main">${safeEsc(esc, profile.label)}</div>
        <div class="diego-side-sub">${safeEsc(esc, profile.tone)}</div>
      </div>
      <div class="diego-side-card">
        <div class="diego-side-label">Trazabilidad</div>
        <div class="diego-side-main">${safeEsc(esc, typeof inferTrace === 'function' ? inferTrace(last) : 'Sin traza')}</div>
        <div class="diego-side-sub">Siguiente paso: ${safeEsc(esc, typeof inferNextStep === 'function' ? inferNextStep(last) : 'Seguir')}</div>
      </div>
      ${sections}
    </aside>`;
  }

  function bindContextPrompts(options) {
    const body = options?.body;
    const input = options?.input;
    if (!body || !input) return;
    body.querySelectorAll('button[data-ctx-prompt]').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-ctx-prompt') || '';
        input.focus();
      });
    });
  }

  function bindContextTabs(options) {
    const body = options?.body;
    const win = options?.win;
    if (!body) return;
    body.querySelectorAll('button[data-ctx-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-ctx-tab');
        if (!tabId) return;
        const target = document.querySelector(`[data-v4-tab="${tabId}"]`) || document.querySelector(`[data-tab="${tabId}"]`);
        if (target) {
          if (win) win.classList.remove('open');
          target.click();
        }
      });
    });
  }

  function askText(options) {
    if (window.showModalInput) return window.showModalInput(options);
    const message = options?.message || options?.title || 'Ingresar valor';
    const value = window.prompt(message, options?.initialValue || '');
    return Promise.resolve(value);
  }

  function bindCaseActions(options) {
    const body = options?.body;
    const profile = options?.profile || { key: 'general' };
    const onCasesChanged = options?.onCasesChanged;
    const onCaseMutated = options?.onCaseMutated;
    const onOpenBandejaCase = options?.onOpenBandejaCase;
    const store = window.DIEGO_CASE_STORE;
    if (!body || !store) return;

    body.querySelectorAll('button[data-case-open-bandeja-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bandejaId = btn.getAttribute('data-case-open-bandeja-id');
        if (!bandejaId) return;
        if (typeof onOpenBandejaCase === 'function') onOpenBandejaCase(bandejaId);
      });
    });

    body.querySelectorAll('button[data-case-status-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = store.cycleStatus(btn.getAttribute('data-case-status-id'));
        if (typeof onCaseMutated === 'function' && updated) onCaseMutated(updated);
        if (typeof onCasesChanged === 'function') onCasesChanged();
      });
    });

    body.querySelectorAll('button[data-case-priority-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = store.cyclePriority(btn.getAttribute('data-case-priority-id'));
        if (typeof onCaseMutated === 'function' && updated) onCaseMutated(updated);
        if (typeof onCasesChanged === 'function') onCasesChanged();
      });
    });

    body.querySelectorAll('button[data-case-owner-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const caseId = btn.getAttribute('data-case-owner-id');
        const suggestions = store.getOwnerSuggestions(profile.key);
        const initialOwner = btn.getAttribute('data-case-owner') || '';
        const nextOwner = await askText({
          title: 'Asignar dueño',
          message: `Sugerencias: ${suggestions.join(' · ')}`,
          placeholder: 'Nombre o area responsable',
          initialValue: initialOwner,
          required: true,
          okLabel: 'Guardar',
        });
        if (!nextOwner || !String(nextOwner).trim()) return;
        const updated = store.updateCase(caseId, { owner: nextOwner });
        if (typeof onCaseMutated === 'function' && updated) onCaseMutated(updated);
        if (typeof onCasesChanged === 'function') onCasesChanged();
      });
    });

    body.querySelectorAll('button[data-case-step-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const caseId = btn.getAttribute('data-case-step-id');
        const currentStep = btn.getAttribute('data-case-step') || '';
        const nextStep = await askText({
          title: 'Siguiente paso',
          message: 'Define el siguiente movimiento concreto para este caso.',
          placeholder: 'Ej: llamar a cliente y validar precio antes de las 15:00',
          initialValue: currentStep,
          required: true,
          okLabel: 'Guardar',
        });
        if (!nextStep || !String(nextStep).trim()) return;
        const updated = store.updateCase(caseId, { step: nextStep });
        if (typeof onCaseMutated === 'function' && updated) onCaseMutated(updated);
        if (typeof onCasesChanged === 'function') onCasesChanged();
      });
    });
  }

  window.DIEGO_CONTEXT = {
    renderContextPanel,
    bindContextPrompts,
    bindContextTabs,
    bindCaseActions,
  };
})();
