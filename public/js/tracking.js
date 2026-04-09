/**
 * Tracking de uso del Asistente Comercial
 * Cola offline-first: guarda en localStorage y sincroniza con Supabase
 * Uso: window.rfTrack.init(supabaseClient, userId) → rfTrack.track(evento, metadata)
 */
(function() {
  'use strict';
  var QUEUE_KEY = 'rf_tracking_queue';
  var MAX_QUEUE = 500;
  var _sb = null;
  var _sessionId = null;
  var _userId = null;
  var _flushing = false;
  var _timers = {};

  function genSessionId() {
    return 'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function init(supabaseClient, userId) {
    _sb = supabaseClient;
    _userId = userId;
    _sessionId = genSessionId();

    window.addEventListener('online', flushQueue);
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) flushQueue();
    });
    setInterval(flushQueue, 60000);
    flushQueue();
  }

  function track(evento, metadata) {
    if (!_userId) return;
    var entry = {
      session_id: _sessionId || genSessionId(),
      usuario_id: _userId,
      evento: evento,
      metadata: metadata || {},
      sucursal: _getSucursal(),
      client_ts: new Date().toISOString()
    };
    var queue = _readQueue();
    queue.push(entry);
    while (queue.length > MAX_QUEUE) queue.shift();
    _writeQueue(queue);
    flushQueue();
  }

  function trackDebounced(key, delay, evento, metadataFn) {
    clearTimeout(_timers[key]);
    _timers[key] = setTimeout(function() {
      track(evento, typeof metadataFn === 'function' ? metadataFn() : metadataFn);
    }, delay);
  }

  function _readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch(e) { return []; }
  }

  function _writeQueue(queue) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }
    catch(e) { /* localStorage lleno */ }
  }

  async function flushQueue() {
    if (_flushing || !navigator.onLine || !_sb) return;
    var queue = _readQueue();
    if (queue.length === 0) return;
    _flushing = true;
    try {
      var res = await _sb.from('eventos_asistente').insert(queue);
      if (!res.error) _writeQueue([]);
    } catch(e) { /* sin conexion */ }
    _flushing = false;
  }

  function _getSucursal() {
    try { var el = document.getElementById('neg-suc'); return el ? el.value || '' : ''; }
    catch(e) { return ''; }
  }

  // Exponer globalmente
  window.rfTrack = {
    init: init,
    track: track,
    trackDebounced: trackDebounced
  };
})();
