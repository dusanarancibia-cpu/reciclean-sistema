;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});
  const listeners = new Set();

  const state = {
    version: 'v1-state',
    source: 'legacy-panel-rdo',
    mountedAt: new Date().toISOString(),
    runtime: {
      initCount: 0,
      refreshCount: 0,
      lastInitAt: null,
      lastRefreshAt: null,
      hasLegacyInit: false,
      hasLegacyRefresh: false,
    },
    roadmap: {
      activeStepId: '01_dominio',
      completed: [],
    },
    ui: {
      strategyBadge: '',
      strategyUse: '',
      pendingTotal: '',
      selectedMaterial: '',
      publicationDefault: '',
      tacticalWindow: '',
      branchException: '',
      exitVisible: '',
    },
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function notify() {
    const snapshot = clone(state);
    listeners.forEach(function (fn) {
      try {
        fn(snapshot);
      } catch (error) {
        console.warn('[panel-precios-state] listener fallo:', error);
      }
    });
  }

  function mergeInto(target, patch) {
    Object.keys(patch || {}).forEach(function (key) {
      const nextValue = patch[key];
      if (
        nextValue &&
        typeof nextValue === 'object' &&
        !Array.isArray(nextValue) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        mergeInto(target[key], nextValue);
      } else {
        target[key] = nextValue;
      }
    });
  }

  function update(patch) {
    mergeInto(state, patch || {});
    notify();
    return getState();
  }

  function getState() {
    return clone(state);
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.add(fn);
    return function unsubscribe() {
      listeners.delete(fn);
    };
  }

  function setActiveStep(stepId) {
    state.roadmap.activeStepId = stepId;
    notify();
    return getState();
  }

  function markCompleted(stepId) {
    if (state.roadmap.completed.indexOf(stepId) === -1) {
      state.roadmap.completed.push(stepId);
    }
    notify();
    return getState();
  }

  function syncRuntime(payload, phase) {
    update({
      runtime: {
        hasLegacyInit: !!payload.hasInit,
        hasLegacyRefresh: !!payload.hasRefresh,
        lastObservedAt: payload.observedAt,
      }
    });
    if (phase === 'init') {
      update({
        runtime: {
          initCount: state.runtime.initCount + 1,
          lastInitAt: payload.observedAt,
        }
      });
    }
    if (phase === 'refresh') {
      update({
        runtime: {
          refreshCount: state.runtime.refreshCount + 1,
          lastRefreshAt: payload.observedAt,
        }
      });
    }
  }

  api.store = {
    version: 'v1-state',
    getState: getState,
    update: update,
    subscribe: subscribe,
    setActiveStep: setActiveStep,
    markCompleted: markCompleted,
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', function (payload) {
      syncRuntime(payload, 'init');
    });
    api.registerHook('afterRefresh', function (payload) {
      syncRuntime(payload, 'refresh');
    });
  }
})();
