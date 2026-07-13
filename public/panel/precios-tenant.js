;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});

  const DEFAULT_TENANT = {
    tenantId: 'reciclean',
    companyName: 'Reciclean',
    plan: 'internal',
    region: 'cl',
    host: window.location.hostname || 'local',
    mode: 'single_tenant_seed',
  };

  function inferTenant() {
    const host = String(window.location.hostname || '').toLowerCase();
    if (host.indexOf('reciclean') >= 0) {
      return {
        tenantId: 'reciclean',
        companyName: 'Reciclean',
        plan: host.indexOf('vercel.app') >= 0 ? 'preview' : 'production',
        region: 'cl',
        host: host,
        mode: 'single_tenant_seed',
      };
    }
    return {
      tenantId: DEFAULT_TENANT.tenantId,
      companyName: DEFAULT_TENANT.companyName,
      plan: 'external_seed',
      region: DEFAULT_TENANT.region,
      host: host || DEFAULT_TENANT.host,
      mode: 'tenant_ready',
    };
  }

  let currentTenant = inferTenant();

  function getTenant() {
    return { ...currentTenant };
  }

  function setTenant(nextTenant) {
    currentTenant = { ...currentTenant, ...(nextTenant || {}) };
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({ tenant: getTenant() });
    }
    if (typeof api.emit === 'function') {
      api.emit('tenant-changed', getTenant());
    }
    return getTenant();
  }

  api.tenant = {
    version: 'v1-tenant',
    getTenant: getTenant,
    setTenant: setTenant,
  };

  setTenant(currentTenant);
})();
