;(function () {
  const ROOT_KEY = 'PANEL_PRECIOS';
  const api = window[ROOT_KEY] || (window[ROOT_KEY] = {});
  const MAX_EVENTS = 40;
  const events = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function record(type, detail) {
    events.unshift({
      type: type,
      at: new Date().toISOString(),
      detail: detail || {},
    });
    if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
    const summary = getSummary();
    if (api.store && typeof api.store.update === 'function') {
      api.store.update({ observability: summary });
    }
    return summary;
  }

  function getEvents() {
    return clone(events);
  }

  function getSummary() {
    const last = events[0] || null;
    return {
      version: 'v1-observability',
      totalEvents: events.length,
      lastEventType: last ? last.type : '',
      lastEventAt: last ? last.at : '',
      recentErrors: events.filter(function (event) {
        return event.type.indexOf('error') >= 0 || event.type.indexOf('conflict') >= 0;
      }).length,
    };
  }

  api.observability = {
    version: 'v1-observability',
    record: record,
    getEvents: getEvents,
    getSummary: getSummary,
  };

  [
    'before-init',
    'after-init',
    'before-refresh',
    'after-refresh',
    'read-model-updated',
    'policy-updated',
    'tenant-changed',
    'ui-bindings-installed',
    'ui-binding-error',
    'command-started',
    'command-finished',
    'command-error',
    'adapter-started',
    'adapter-finished',
    'adapter-error',
    'concurrency-opened',
    'concurrency-conflict',
    'concurrency-closed',
  ].forEach(function (eventName) {
    window.addEventListener('panel-precios:' + eventName, function (event) {
      record(eventName, event && event.detail ? event.detail : {});
    });
  });
})();
