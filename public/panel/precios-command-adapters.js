;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getState() {
    return api.store && typeof api.store.getState === 'function'
      ? api.store.getState()
      : {};
  }

  function getRuntimeContext() {
    const state = getState();
    return {
      observedAt: new Date().toISOString(),
      tenant: state.tenant || null,
      selectedMaterial: state.ui && state.ui.selectedMaterial ? state.ui.selectedMaterial : '',
      pendingTotal: state.ui && state.ui.pendingTotal ? state.ui.pendingTotal : '',
      activeProposalId: state.concurrency && state.concurrency.activeProposalId
        ? state.concurrency.activeProposalId
        : null,
      lockVisible: !!(state.concurrency && state.concurrency.lockVisible),
      lockMessage: state.concurrency && state.concurrency.lockMessage
        ? state.concurrency.lockMessage
        : '',
      strategyTitle: state.policy && state.policy.strategyTitle ? state.policy.strategyTitle : '',
    };
  }

  function getLegacyHandler(name) {
    return typeof window[name] === 'function' ? window[name] : null;
  }

  const registry = {
    approve_current: {
      id: 'approve_current',
      label: 'Aprobar propuesta actual',
      transport: 'backend_authoritative',
      target: 'live_backend_authoritative',
      risk: 'medio',
      inputContract: ['activeProposalId'],
      meaningNow: 'Aprobar ya vive en un contrato unico hacia precio-aplicar.',
      handlerName: 'bpAprobar',
    },
    reject_current: {
      id: 'reject_current',
      label: 'Rechazar propuesta actual',
      transport: 'backend_authoritative',
      target: 'live_backend_authoritative',
      risk: 'medio',
      inputContract: ['activeProposalId'],
      meaningNow: 'Rechazar ya entra por precio-command y no escribe directo desde browser.',
      handlerName: 'bpRechazar',
    },
    approve_bulk: {
      id: 'approve_bulk',
      label: 'Aprobar visibles',
      transport: 'backend_authoritative',
      target: 'live_backend_authoritative',
      risk: 'medio',
      inputContract: ['visibleProposalIds'],
      meaningNow: 'El batch de aprobacion ya entra por precio-command.',
      handlerName: 'bpBulkAprobar',
    },
    reject_bulk: {
      id: 'reject_bulk',
      label: 'Rechazar visibles',
      transport: 'backend_authoritative',
      target: 'live_backend_authoritative',
      risk: 'medio',
      inputContract: ['visibleProposalIds'],
      meaningNow: 'El rechazo batch ya entra por precio-command.',
      handlerName: 'bpBulkRechazar',
    },
    approve_all: {
      id: 'approve_all',
      label: 'Aprobar todo',
      transport: 'parallel_rpc_panel',
      target: 'parallel_circuit',
      risk: 'medio',
      inputContract: ['pendingTotal'],
      meaningNow: 'Aprobar todo sigue en un circuito paralelo fuera de alcance de T3.',
      handlerName: 'bpAprobarTodos',
    },
  };

  function listAdapters() {
    return Object.keys(registry).map(function (key) {
      return clone(registry[key]);
    });
  }

  function buildSummary() {
    const adapters = listAdapters();
    return {
      version: 'v1-command-adapters',
      total: adapters.length,
      directLike: adapters.filter(function (adapter) {
        return adapter.transport.indexOf('direct') >= 0;
      }).length,
      backendTarget: adapters.filter(function (adapter) {
        return adapter.target === 'live_backend_authoritative';
      }).length,
      parallelCircuit: adapters.filter(function (adapter) {
        return adapter.target === 'parallel_circuit';
      }).length,
      backendLocation: 'reciclean-rdo',
      nextObjective: 'validar T3 en web y confirmar via libre para migracion 378',
      adapters: adapters,
    };
  }

  function preflight(adapterId) {
    const adapter = registry[adapterId];
    if (!adapter) {
      return { ok: false, message: 'Adapter desconocido: ' + adapterId };
    }
    const handler = getLegacyHandler(adapter.handlerName);
    if (!handler) {
      return { ok: false, message: 'Handler legacy no disponible: ' + adapter.handlerName };
    }
    const context = getRuntimeContext();
    if (
      adapter.inputContract.indexOf('activeProposalId') >= 0 &&
      !context.activeProposalId
    ) {
      return { ok: false, message: 'No hay propuesta activa para ejecutar ' + adapter.label };
    }
    if (adapterId === 'approve_bulk' || adapterId === 'reject_bulk') {
      const rows = Array.isArray(window.bpVisibleRows) ? window.bpVisibleRows : [];
      if (!rows.length) {
        return { ok: false, message: 'No hay propuestas visibles para ejecutar ' + adapter.label };
      }
    }
    return {
      ok: true,
      adapter: clone(adapter),
      context: context,
    };
  }

  async function execute(adapterId, payload) {
    const check = preflight(adapterId);
    if (!check.ok) {
      const failed = {
        adapterId: adapterId,
        ok: false,
        message: check.message,
        payload: payload || null,
        at: new Date().toISOString(),
      };
      if (typeof api.emit === 'function') api.emit('adapter-error', failed);
      if (api.observability && typeof api.observability.record === 'function') {
        api.observability.record('adapter-error', failed);
      }
      throw new Error(check.message);
    }

    const started = {
      adapterId: adapterId,
      payload: payload || null,
      context: check.context,
      at: new Date().toISOString(),
    };
    if (typeof api.emit === 'function') api.emit('adapter-started', started);
    if (api.observability && typeof api.observability.record === 'function') {
      api.observability.record('adapter-started', started);
    }

    const handler = getLegacyHandler(check.adapter.handlerName);
    const result = await handler(payload);
    const finished = {
      adapterId: adapterId,
      ok: true,
      payload: payload || null,
      context: getRuntimeContext(),
      at: new Date().toISOString(),
    };
    if (typeof api.emit === 'function') api.emit('adapter-finished', finished);
    if (api.observability && typeof api.observability.record === 'function') {
      api.observability.record('adapter-finished', finished);
    }
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({
        commandAdapters: {
          ...buildSummary(),
          lastAdapter: adapterId,
          lastAdapterAt: finished.at,
        }
      });
    }
    return result;
  }

  function install() {
    const summary = buildSummary();
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({ commandAdapters: summary });
    }
    return summary;
  }

  api.commandAdapters = {
    version: 'v1-command-adapters',
    install: install,
    preflight: preflight,
    execute: execute,
    list: listAdapters,
    getSummary: buildSummary,
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', install);
  }
  install();
})();
