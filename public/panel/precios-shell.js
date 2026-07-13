;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const EVENT_PREFIX = 'panel-precios:';
  const hooks = {
    beforeInit: new Set(),
    afterInit: new Set(),
    beforeRefresh: new Set(),
    afterRefresh: new Set(),
  };

  let initWrapped = false;
  let refreshWrapped = false;
  let installTimer = null;
  let installAttempts = 0;

  function nowIso() {
    return new Date().toISOString();
  }

  function safeDispatch(name, detail) {
    try {
      window.dispatchEvent(new window.CustomEvent(EVENT_PREFIX + name, { detail: detail }));
    } catch (_) {
      // noop
    }
  }

  function runHooks(name, payload) {
    const bucket = hooks[name];
    if (!bucket) return;
    bucket.forEach(function (fn) {
      try {
        fn(payload);
      } catch (error) {
        console.warn('[panel-precios-shell] hook fallo:', name, error);
      }
    });
  }

  function getRuntimeContext() {
    return {
      version: 'v1-shell',
      mountedAt: window[ROOT_KEY] && window[ROOT_KEY].mountedAt ? window[ROOT_KEY].mountedAt : null,
      observedAt: nowIso(),
      hasInit: typeof window.initTableroPrecios === 'function',
      hasRefresh: typeof window.tapCargar === 'function',
      hasOpenTab: typeof window.mpAbrirTab === 'function',
      hasStrategyApi: !!window.DIEGO_STRATEGY,
    };
  }

  function registerHook(name, fn) {
    if (!hooks[name] || typeof fn !== 'function') return function () {};
    hooks[name].add(fn);
    return function unregister() {
      hooks[name].delete(fn);
    };
  }

  function wrapRefresh() {
    if (refreshWrapped || typeof window.tapCargar !== 'function') return false;
    const originalRefresh = window.tapCargar;
    window.tapCargar = async function wrappedTapCargar() {
      const payload = getRuntimeContext();
      safeDispatch('before-refresh', payload);
      runHooks('beforeRefresh', payload);
      const result = await originalRefresh.apply(this, arguments);
      const donePayload = getRuntimeContext();
      safeDispatch('after-refresh', donePayload);
      runHooks('afterRefresh', donePayload);
      return result;
    };
    refreshWrapped = true;
    return true;
  }

  function wrapInit() {
    if (initWrapped || typeof window.initTableroPrecios !== 'function') return false;
    const originalInit = window.initTableroPrecios;
    window.initTableroPrecios = function wrappedInitTableroPrecios() {
      const payload = getRuntimeContext();
      safeDispatch('before-init', payload);
      runHooks('beforeInit', payload);
      const result = originalInit.apply(this, arguments);
      wrapRefresh();
      const donePayload = getRuntimeContext();
      safeDispatch('after-init', donePayload);
      runHooks('afterInit', donePayload);
      return result;
    };
    initWrapped = true;
    return true;
  }

  function install() {
    const initOk = wrapInit();
    const refreshOk = wrapRefresh();
    if (initOk || refreshOk) {
      if (installTimer) {
        window.clearInterval(installTimer);
        installTimer = null;
      }
      return true;
    }
    return false;
  }

  const api = window[ROOT_KEY] || {};
  api.version = 'v1-shell';
  api.mountedAt = api.mountedAt || nowIso();
  api.getRuntimeContext = getRuntimeContext;
  api.registerHook = registerHook;
  api.install = install;
  api.emit = function emit(name, detail) {
    safeDispatch(name, detail || getRuntimeContext());
  };
  window[ROOT_KEY] = api;

  if (!install()) {
    installTimer = window.setInterval(function () {
      installAttempts += 1;
      if (install() || installAttempts > 60) {
        if (installTimer) {
          window.clearInterval(installTimer);
          installTimer = null;
        }
      }
    }, 500);
  }
})();
