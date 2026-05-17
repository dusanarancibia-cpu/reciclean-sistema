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

  function log(evento, seccion, metadata) {
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
        usuario_id: resolveUser(),
        evento: evento || 'pageview',
        metadata: metadata || null
      }),
      keepalive: true
    }).catch(function () {});
  }

  window.pageLog = log;

  document.addEventListener('DOMContentLoaded', function () { log('pageview'); });

  window.addEventListener('error', function (e) {
    log('js_error', null, { message: e.message, source: e.filename, line: e.lineno, col: e.colno });
  });

  window.addEventListener('unhandledrejection', function (e) {
    log('promise_error', null, { reason: String(e.reason).slice(0, 500) });
  });
})();
