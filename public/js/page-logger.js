/* page-logger.js — curated.page_logs telemetría de páginas */
(function () {
  var SUPA = 'https://eknmtsrtfkzroxnovfqn.supabase.co';
  var KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbm10c3J0Zmt6cm94bm92ZnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY2ODgsImV4cCI6MjA5MDk4MjY4OH0.8Y4N0lw3DFN3Y8-R6ID7t_LAfgHWDM5N-oa4Ji9bncg';

  function resolveUser() {
    if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
    try { var s = JSON.parse(sessionStorage.getItem('rf_session') || 'null'); if (s) return s.email || s.nombre || null; } catch (e) {}
    try { var u = JSON.parse(sessionStorage.getItem('rf_usuario') || 'null'); if (u) return u.email || u.nombre || null; } catch (e) {}
    return null;
  }

  // BUG#5 fix 11-jun PC2: si no hay user resuelto, NO disparamos el POST a curated.page_logs.
  // El insert con usuario_id=null violaba constraint NOT NULL → 400 → supabase-js degrada
  // la conexión HTTP/2 pool y aborta signinWithPassword con ERR_ABORTED.
  // Política: log solo cuando hay user. Si no hay, encolamos y reintentamos post-login.
  var _pending = [];
  function log(evento, seccion, metadata) {
    var user = resolveUser();
    if (!user) {
      // Encolar para retry post-login (max 20 items para evitar memory leak)
      if (_pending.length < 20) _pending.push({ evento: evento, seccion: seccion, metadata: metadata });
      return;
    }
    fetch(SUPA + '/rest/v1/page_logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Profile': 'curated',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        pagina: window.location.pathname,
        seccion: seccion || null,
        usuario_id: user,
        evento: evento || 'pageview',
        metadata: metadata || null
      }),
      keepalive: true
    }).catch(function () {});
  }

  function flushPending() {
    if (!resolveUser() || _pending.length === 0) return;
    var items = _pending.splice(0);
    items.forEach(function (it) { log(it.evento, it.seccion, it.metadata); });
  }

  window.pageLog = log;
  window.pageLogFlushPending = flushPending;

  // pageview en DOMContentLoaded: solo si ya hay user resuelto (sesión persistente).
  // Si es first-login, log('login') desde hydrateSessionAndEnter llamará flushPending.
  document.addEventListener('DOMContentLoaded', function () { log('pageview'); });

  window.addEventListener('error', function (e) {
    log('js_error', null, { message: e.message, source: e.filename, line: e.lineno, col: e.colno });
  });

  window.addEventListener('unhandledrejection', function (e) {
    log('promise_error', null, { reason: String(e.reason).slice(0, 500) });
  });
})();
