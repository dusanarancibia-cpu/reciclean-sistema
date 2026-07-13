;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  function getStrategySnapshot() {
    const strategyApi = window.DIEGO_STRATEGY;
    if (strategyApi && typeof strategyApi.getSnapshot === 'function') {
      return strategyApi.getSnapshot() || null;
    }
    return null;
  }

  function readPolicy() {
    const snapshot = getStrategySnapshot() || {};
    const active = snapshot.active || {};
    return {
      observedAt: new Date().toISOString(),
      strategyId: active.id || '',
      strategyTitle: active.title || '',
      publicationDecision: snapshot.publicationDecision || '',
      branchDirective: snapshot.branchDirective || '',
      validityDecision: snapshot.validityDecision || '',
      exitDirective: snapshot.exitDirective || '',
      publicationRule: snapshot.publicationRule || '',
      roleSummary: snapshot.roleSummary || '',
      listRoleDirective: snapshot.listRoleDirective || '',
      executiveRoleDirective: snapshot.executiveRoleDirective || '',
      maxRoleDirective: snapshot.maxRoleDirective || '',
    };
  }

  function syncPolicy() {
    const policy = readPolicy();
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({ policy: policy });
    }
    if (typeof api.emit === 'function') {
      api.emit('policy-updated', policy);
    }
    return policy;
  }

  api.policy = {
    version: 'v1-policy',
    readPolicy: readPolicy,
    syncPolicy: syncPolicy,
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', syncPolicy);
    api.registerHook('afterRefresh', syncPolicy);
  }
  window.addEventListener('diego-strategy-changed', syncPolicy);
  window.addEventListener('diego-strategy-context-changed', syncPolicy);
})();
