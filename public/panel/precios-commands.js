;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  const commandInventory = {
    approve_current: {
      source: 'window.bpAprobar',
      currentTransport: 'backend_authoritative',
      currentPath: 'POST /functions/v1/precio-aplicar',
      targetTransport: 'backend_authoritative',
      targetPath: 'edge function autoritativa de aprobacion',
      risk: 'medio',
      meaningNow: 'Aprobar ya manda precio ajustado y override al backend autoritativo.',
    },
    reject_current: {
      source: 'window.bpRechazar',
      currentTransport: 'backend_authoritative',
      currentPath: 'POST /functions/v1/precio-command (rechazar)',
      targetTransport: 'backend_authoritative',
      targetPath: 'command de rechazo con auditoria y unlock',
      risk: 'medio',
      meaningNow: 'Rechazar ya no escribe directo desde browser; entra por comando autoritativo.',
    },
    approve_bulk: {
      source: 'window.bpBulkAprobar',
      currentTransport: 'backend_authoritative',
      currentPath: 'POST /functions/v1/precio-command (bulk_aprobar)',
      targetTransport: 'backend_authoritative',
      targetPath: 'command batch con validacion, auditoria y resultado resumido',
      risk: 'medio',
      meaningNow: 'El batch de aprobacion ya entra por un comando autoritativo unico.',
    },
    reject_bulk: {
      source: 'window.bpBulkRechazar',
      currentTransport: 'backend_authoritative',
      currentPath: 'POST /functions/v1/precio-command (bulk_rechazar)',
      targetTransport: 'backend_authoritative',
      targetPath: 'command batch de rechazo con trazabilidad',
      risk: 'medio',
      meaningNow: 'El batch de rechazo ya entra por un comando autoritativo unico.',
    },
    approve_all: {
      source: 'window.bpAprobarTodos',
      currentTransport: 'parallel_rpc_panel',
      currentPath: 'panel.f_aprobar_todos_pendientes',
      targetTransport: 'parallel_circuit',
      targetPath: 'circuito paralelo fuera de alcance de T3',
      risk: 'medio',
      meaningNow: 'Aprobar todo sigue en su circuito paralelo y no se movio en este frente.',
    },
  };

  const mode = {
    version: 'v1-commands',
    transport: 'backend_authoritative_wrapped',
    approveApplyEndpoint: '/functions/v1/precio-aplicar',
    commandEndpoint: '/functions/v1/precio-command',
    backendLocation: 'reciclean-rdo',
    approveCurrent: 'backend_authoritative',
    rejectCurrent: 'backend_authoritative',
    approveBulk: 'backend_authoritative',
    rejectBulk: 'backend_authoritative',
    approveAll: 'parallel_rpc_panel',
  };

  function buildSummary() {
    const items = Object.keys(commandInventory).map(function (key) {
      return { id: key, ...commandInventory[key] };
    });
    return {
      ...mode,
      inventory: items,
      totalCommands: items.length,
      directUpdates: items.filter(function (item) { return item.currentTransport === 'direct_update'; }).length,
      mixedCommands: items.filter(function (item) { return item.currentTransport === 'mixed'; }).length,
      backendReadyCommands: items.filter(function (item) { return item.currentTransport === 'backend_authoritative'; }).length,
      parallelCommands: items.filter(function (item) { return item.currentTransport === 'parallel_rpc_panel'; }).length,
      backendWorkspacePath: 'backend desplegado en reciclean-rdo',
      nextObjective: 'validar T3 en web real y dejar via libre para la migracion 378',
    };
  }

  function wrapCommand(name, label) {
    if (typeof window[name] !== 'function') return false;
    const original = window[name];
    if (original.__panelPreciosCommandWrapped) return true;
    const wrapped = async function () {
      const payload = {
        command: label,
        args: Array.prototype.slice.call(arguments),
        startedAt: new Date().toISOString(),
      };
      if (typeof api.emit === 'function') api.emit('command-started', payload);
      if (api.observability && typeof api.observability.record === 'function') {
        api.observability.record('command-started', payload);
      }
      try {
        const result = await original.apply(this, arguments);
        const donePayload = { ...payload, finishedAt: new Date().toISOString(), ok: true };
        if (typeof api.emit === 'function') api.emit('command-finished', donePayload);
        if (api.store && typeof api.store.update === 'function') {
          api.store.update({ commands: { ...buildSummary(), lastCommand: label, lastCommandAt: donePayload.finishedAt } });
        }
        return result;
      } catch (error) {
        const errPayload = { ...payload, finishedAt: new Date().toISOString(), ok: false, message: error && error.message ? error.message : String(error) };
        if (typeof api.emit === 'function') api.emit('command-error', errPayload);
        if (api.observability && typeof api.observability.record === 'function') {
          api.observability.record('command-error', errPayload);
        }
        throw error;
      }
    };
    wrapped.__panelPreciosCommandWrapped = true;
    window[name] = wrapped;
    return true;
  }

  function install() {
    wrapCommand('bpAprobar', 'approve_current');
    wrapCommand('bpRechazar', 'reject_current');
    wrapCommand('bpBulkAprobar', 'approve_bulk');
    wrapCommand('bpBulkRechazar', 'reject_bulk');
    wrapCommand('bpAprobarTodos', 'approve_all');
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({ commands: buildSummary() });
    }
    return buildSummary();
  }

  api.commands = {
    version: 'v1-commands',
    install: install,
    getMode: function () { return buildSummary(); },
    getInventory: function () {
      return buildSummary().inventory;
    },
    approveCurrent: function (payload) {
      if (api.commandAdapters && typeof api.commandAdapters.execute === 'function') {
        return api.commandAdapters.execute('approve_current', payload);
      }
      return typeof window.bpAprobar === 'function' ? window.bpAprobar(payload) : Promise.resolve();
    },
    rejectCurrent: function (payload) {
      if (api.commandAdapters && typeof api.commandAdapters.execute === 'function') {
        return api.commandAdapters.execute('reject_current', payload);
      }
      return typeof window.bpRechazar === 'function' ? window.bpRechazar(payload) : Promise.resolve();
    },
    approveBulk: function (payload) {
      if (api.commandAdapters && typeof api.commandAdapters.execute === 'function') {
        return api.commandAdapters.execute('approve_bulk', payload);
      }
      return typeof window.bpBulkAprobar === 'function' ? window.bpBulkAprobar(payload) : Promise.resolve();
    },
    rejectBulk: function (payload) {
      if (api.commandAdapters && typeof api.commandAdapters.execute === 'function') {
        return api.commandAdapters.execute('reject_bulk', payload);
      }
      return typeof window.bpBulkRechazar === 'function' ? window.bpBulkRechazar(payload) : Promise.resolve();
    },
    approveAll: function (payload) {
      if (api.commandAdapters && typeof api.commandAdapters.execute === 'function') {
        return api.commandAdapters.execute('approve_all', payload);
      }
      return typeof window.bpAprobarTodos === 'function' ? window.bpAprobarTodos(payload) : Promise.resolve();
    },
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', install);
  }
  install();
})();
