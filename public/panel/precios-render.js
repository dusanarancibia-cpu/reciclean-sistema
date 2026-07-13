;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderShellCard() {
    const host = document.getElementById('mpArchitectureShell');
    if (!host) return;
    const state = api.store && typeof api.store.getState === 'function' ? api.store.getState() : {};
    const roadmapSummary = api.domain && typeof api.domain.getSummary === 'function' ? api.domain.getSummary() : {};
    const tenant = state.tenant || (api.tenant && api.tenant.getTenant ? api.tenant.getTenant() : {});
    const commands = state.commands || {};
    const commandAdapters = state.commandAdapters || {};
    const uiBindings = state.uiBindings || {};
    const concurrency = state.concurrency || {};
    const observability = state.observability || {};
    const policy = state.policy || {};
    const ui = state.ui || {};

    host.innerHTML = ''
      + '<div class="rounded-xl border border-stone-300 bg-stone-950 text-white px-4 py-4">'
      +   '<div class="flex flex-wrap items-start justify-between gap-3">'
      +     '<div>'
      +       '<div class="text-[11px] uppercase tracking-wider text-stone-400 mb-1">Shell de arquitectura</div>'
      +       '<div class="text-sm font-semibold">Precios ya no crece solo dentro del HTML gigante.</div>'
      +       '<div class="text-xs text-stone-300 mt-1">Que significa ahora: dominio, estado, politica, commands y locks ya tienen capa propia.</div>'
      +     '</div>'
      +     '<div class="rounded-lg bg-white/10 px-3 py-2 text-right">'
      +       '<div class="text-[11px] uppercase tracking-wider text-stone-300">Paso activo</div>'
      +       '<div class="text-sm font-semibold">' + esc(roadmapSummary.activeStep ? roadmapSummary.activeStep.title : 'Sin paso activo') + '</div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">'
      +     '<div class="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-3 py-3">'
      +       '<div class="uppercase tracking-wider text-emerald-200 mb-1">Tenant</div>'
      +       '<div class="text-sm font-semibold">' + esc(tenant.companyName || tenant.tenantId || 'Sin tenant') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc((tenant.plan || 'sin plan') + ' - ' + (tenant.mode || 'sin modo')) + '</div>'
      +     '</div>'
      +     '<div class="rounded-xl border border-sky-300/40 bg-sky-500/10 px-3 py-3">'
      +       '<div class="uppercase tracking-wider text-sky-200 mb-1">Commands</div>'
      +       '<div class="text-sm font-semibold">' + esc(commands.transport || 'sin transporte') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc(commands.lastCommand ? commands.lastCommand + ' - ' + commands.lastCommandAt : 'sin comando reciente') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc('Directos: ' + String(commands.directUpdates || 0) + ' - backend activos: ' + String(commands.backendReadyCommands || 0)) + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc('Adapters: ' + String(commandAdapters.total || 0) + ' - direct-like: ' + String(commandAdapters.directLike || 0) + ' - paralelos: ' + String(commandAdapters.parallelCircuit || commands.parallelCommands || 0)) + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc('UI bindings: ' + String(uiBindings.installedCount || 0) + '/5') + '</div>'
      +     '</div>'
      +     '<div class="rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-3">'
      +       '<div class="uppercase tracking-wider text-amber-200 mb-1">Concurrencia</div>'
      +       '<div class="text-sm font-semibold">' + esc(concurrency.lockVisible ? 'Lock activo' : 'Sin lock visible') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc(concurrency.lockMessage || ('Conflictos detectados: ' + (concurrency.conflictCount || 0))) + '</div>'
      +     '</div>'
      +     '<div class="rounded-xl border border-fuchsia-300/40 bg-fuchsia-500/10 px-3 py-3">'
      +       '<div class="uppercase tracking-wider text-fuchsia-200 mb-1">Observabilidad</div>'
      +       '<div class="text-sm font-semibold">' + esc(String(observability.totalEvents || 0) + ' evento(s)') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc(observability.lastEventType || 'sin evento reciente') + '</div>'
      +     '</div>'
      +   '</div>'
      +   '<div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">'
      +     '<div class="rounded-xl bg-white/5 px-3 py-3">'
      +       '<div class="uppercase tracking-wider text-stone-400 mb-1">Politica unificada</div>'
      +       '<div class="text-sm font-semibold">' + esc(policy.strategyTitle || ui.strategyBadge || 'Sin estrategia visible') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc(policy.publicationRule || ui.publicationDefault || 'Sin regla unificada') + '</div>'
      +     '</div>'
      +     '<div class="rounded-xl bg-white/5 px-3 py-3">'
      +       '<div class="uppercase tracking-wider text-stone-400 mb-1">Read model</div>'
      +       '<div class="text-sm font-semibold">' + esc(ui.selectedMaterial || 'Sin material en foco') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc((ui.pendingTotal || '0') + ' pendiente(s) - ' + (ui.strategyUse || 'sin criterio')) + '</div>'
      +     '</div>'
      +     '<div class="rounded-xl bg-white/5 px-3 py-3">'
      +       '<div class="uppercase tracking-wider text-stone-400 mb-1">Roadmap</div>'
      +       '<div class="text-sm font-semibold">' + esc(String(roadmapSummary.completed || 0) + '/' + String(roadmapSummary.totalSteps || 10) + ' pasos con base viva') + '</div>'
      +       '<div class="text-stone-300 mt-1">Ejemplo en cristiano: ya podemos seguir sacando piezas sin volver a empezar desde cero.</div>'
      +     '</div>'
      +     '<div class="rounded-xl bg-white/5 px-3 py-3 md:col-span-3">'
      +       '<div class="uppercase tracking-wider text-stone-400 mb-1">Siguiente deuda real</div>'
      +       '<div class="text-sm font-semibold">' + esc(commandAdapters.nextObjective || commands.nextObjective || 'Sin deuda declarada') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc(commandAdapters.lastAdapter ? ('Ultimo adapter: ' + commandAdapters.lastAdapter) : 'Sin adapter ejecutado aun') + '</div>'
      +       '<div class="text-stone-300 mt-1">' + esc('Backend vivo: ' + (commandAdapters.backendLocation || commands.backendLocation || 'sin ubicacion declarada') + '. Aprobar todo sigue en circuito paralelo fuera de alcance.') + '</div>'
      +     '</div>'
      +   '</div>'
      + '</div>';
  }

  function install() {
    renderShellCard();
    if (api.store && typeof api.store.subscribe === 'function' && !install.__subscribed) {
      api.store.subscribe(renderShellCard);
      install.__subscribed = true;
    }
  }

  api.render = {
    version: 'v1-render',
    renderShellCard: renderShellCard,
    install: install,
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', install);
    api.registerHook('afterRefresh', install);
  }
  window.addEventListener('panel-precios:command-finished', renderShellCard);
  window.addEventListener('panel-precios:concurrency-conflict', renderShellCard);
  install();
})();
