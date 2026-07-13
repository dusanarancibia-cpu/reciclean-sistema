;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  function textFrom(id) {
    const node = document.getElementById(id);
    return node ? String(node.textContent || '').trim() : '';
  }

  function readMesaSnapshot() {
    const detail = document.getElementById('mpDetail');
    const detailText = detail ? String(detail.textContent || '').trim() : '';
    let selectedMaterial = '';
    if (detailText) {
      const compact = detailText.replace(/\s+/g, ' ').trim();
      const marker = 'Material seleccionado';
      const index = compact.indexOf(marker);
      if (index >= 0) {
        const slice = compact.slice(index + marker.length).trim();
        selectedMaterial = slice.split('propuesta(s) pendientes')[0].trim();
      }
    }
    return {
      observedAt: new Date().toISOString(),
      strategyBadge: textFrom('mpStrategyBadge'),
      strategyUse: textFrom('mpStrategyUse'),
      pendingTotal: textFrom('tapP1Total'),
      selectedMaterial: selectedMaterial,
      publicationDefault: textFrom('mpStrategyPublishDefault'),
      tacticalWindow: textFrom('mpStrategyTacticalWindow'),
      branchException: textFrom('mpStrategyBranchException'),
      exitVisible: textFrom('mpStrategyExitVisible'),
    };
  }

  function syncStore() {
    const snapshot = readMesaSnapshot();
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({ ui: snapshot });
    }
    if (typeof api.emit === 'function') {
      api.emit('read-model-updated', snapshot);
    }
    return snapshot;
  }

  api.readModel = {
    version: 'v1-read-model',
    readMesaSnapshot: readMesaSnapshot,
    syncStore: syncStore,
  };

  if (typeof api.registerHook === 'function') {
    api.registerHook('afterInit', syncStore);
    api.registerHook('afterRefresh', syncStore);
  }
})();
