;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  const status = {
    version: 'v1-concurrency',
    activeProposalId: null,
    lastOpenedAt: '',
    lastClosedAt: '',
    lockVisible: false,
    lockMessage: '',
    conflictCount: 0,
  };

  function snapshot() {
    return { ...status };
  }

  function syncStore() {
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({ concurrency: snapshot() });
    }
    return snapshot();
  }

  function readLockMessage() {
    const el = document.getElementById('bpDrawerLockWarn');
    return el ? String(el.textContent || '').trim() : '';
  }

  function wrap(name, hooks) {
    if (typeof window[name] !== 'function') return false;
    const original = window[name];
    if (original.__panelPreciosWrapped) return true;
    const wrapped = async function () {
      if (hooks && typeof hooks.before === 'function') hooks.before.apply(this, arguments);
      const result = await original.apply(this, arguments);
      if (hooks && typeof hooks.after === 'function') hooks.after.apply(this, arguments);
      return result;
    };
    wrapped.__panelPreciosWrapped = true;
    window[name] = wrapped;
    return true;
  }

  function install() {
    wrap('bpAbrirDrawer', {
      before: function (id) {
        status.activeProposalId = id || null;
      },
      after: function (id) {
        status.activeProposalId = id || status.activeProposalId;
        status.lastOpenedAt = new Date().toISOString();
        status.lockMessage = readLockMessage();
        status.lockVisible = !!status.lockMessage;
        if (status.lockVisible) status.conflictCount += 1;
        syncStore();
        if (typeof api.emit === 'function') {
          api.emit(status.lockVisible ? 'concurrency-conflict' : 'concurrency-opened', snapshot());
        }
      }
    });
    wrap('bpCerrarDrawer', {
      after: function () {
        status.lastClosedAt = new Date().toISOString();
        status.activeProposalId = null;
        status.lockVisible = false;
        status.lockMessage = '';
        syncStore();
        if (typeof api.emit === 'function') {
          api.emit('concurrency-closed', snapshot());
        }
      }
    });
    return true;
  }

  api.concurrency = {
    version: 'v1-concurrency',
    install: install,
    getStatus: snapshot,
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', install);
    api.registerHook('afterRefresh', syncStore);
  }
  install();
})();
