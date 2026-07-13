;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  function safeBind(id, fn) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.onclick = function (event) {
      try {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        const result = fn();
        return result;
      } catch (error) {
        if (api.observability && typeof api.observability.record === 'function') {
          api.observability.record('ui-binding-error', { id: id, message: error && error.message ? error.message : String(error) });
        }
        throw error;
      }
    };
    return true;
  }

  function bindAll() {
    const commands = api.commands || {};
    const ok = {
      approveCurrent: safeBind('bpBtnAprobar', function () {
        return commands && typeof commands.approveCurrent === 'function'
          ? commands.approveCurrent()
          : (typeof window.bpAprobar === 'function' ? window.bpAprobar() : undefined);
      }),
      rejectCurrent: safeBind('bpBtnRechazar', function () {
        return commands && typeof commands.rejectCurrent === 'function'
          ? commands.rejectCurrent()
          : (typeof window.bpRechazar === 'function' ? window.bpRechazar() : undefined);
      }),
      approveBulk: safeBind('bpAprobarFiltrados', function () {
        return commands && typeof commands.approveBulk === 'function'
          ? commands.approveBulk()
          : (typeof window.bpBulkAprobar === 'function' ? window.bpBulkAprobar() : undefined);
      }),
      rejectBulk: safeBind('bpRechazarFiltrados', function () {
        return commands && typeof commands.rejectBulk === 'function'
          ? commands.rejectBulk()
          : (typeof window.bpBulkRechazar === 'function' ? window.bpBulkRechazar() : undefined);
      }),
      approveAll: safeBind('bpAprobarTodos', function () {
        return commands && typeof commands.approveAll === 'function'
          ? commands.approveAll()
          : (typeof window.bpAprobarTodos === 'function' ? window.bpAprobarTodos() : undefined);
      }),
    };

    if (api.store && typeof api.store.update === 'function') {
      api.store.update({
        uiBindings: {
          version: 'v1-ui-bindings',
          installedAt: new Date().toISOString(),
          ...ok,
          installedCount: Object.keys(ok).filter(function (k) { return !!ok[k]; }).length,
        }
      });
    }

    if (typeof api.emit === 'function') {
      api.emit('ui-bindings-installed', ok);
    }

    return ok;
  }

  api.uiBindings = {
    version: 'v1-ui-bindings',
    bindAll: bindAll,
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', bindAll);
  }
  bindAll();
})();
