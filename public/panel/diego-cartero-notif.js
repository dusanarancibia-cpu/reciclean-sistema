// ============================================================
// DIEGO CARTERO — NOTIFICACIÓN REALTIME + REPORTE DE BUGS
// extraído de panel-rdo.html (antifragilidad panel, bloque 9 · PR 1 de 3)
// D-DIEGO-CARTERO-001 (campanita realtime) + P6 23-jun-2026 (modal reporte bugs)
//
// Es cola operativa (panel.diego_inbox), NO el LLM de Diego. Verificado:
// cero referencias a diego-chat-process/callDiego/DIEGO_STRATEGY.
//
// Ya venía como IIFE auto-contenida en el original — se preserva tal cual,
// sin cambios de wrapping. Exports explícitos a window (usados por HTML que
// se queda en panel-rdo.html): window.abrirReporteBugDiego,
// window.cerrarReporteBugDiego, window.enviarReporteBugDiego.
//
// Dependencias externas: ninguna hacia otros módulos, Diego LLM, el núcleo,
// Precios, Cumplimiento ni Firmas/Tarifas. Se suscribe a panel.diego_inbox
// vía Supabase Realtime (canal propio, no comparte estado con Bandeja Diego
// ya extraído en public/panel/bandeja-diego.js).
// ============================================================

(function () {
  // D-DIEGO-CARTERO-001 · Solo notificación realtime (modal 4 categorías removido 2026-06-25)
  function ready() { return typeof sb !== 'undefined' && sb && sb.schema; }
  function resolveEmail() {
    if (typeof currentUser !== 'undefined' && currentUser?.email) return String(currentUser.email).toLowerCase();
    try { var s = JSON.parse(sessionStorage.getItem('rf_session') || 'null'); if (s?.email) return String(s.email).toLowerCase(); } catch (e) {}
    try { var u = JSON.parse(sessionStorage.getItem('rf_usuario') || 'null'); if (u?.email) return String(u.email).toLowerCase(); } catch (e) {}
    try { var ls = JSON.parse(localStorage.getItem('rf_session') || 'null'); if (ls?.email) return String(ls.email).toLowerCase(); } catch (e) {}
    try {
      var sbKey = 'sb-eknmtsrtfkzroxnovfqn-auth-token';
      var sbTok = JSON.parse(localStorage.getItem(sbKey) || 'null');
      var em = sbTok?.user?.email || sbTok?.currentSession?.user?.email;
      if (em) return String(em).toLowerCase();
    } catch (e) {}
    return null;
  }

  // P6 23-jun-2026 · Reporte de bugs Diego → public.preguntas_pendientes
  window.abrirReporteBugDiego = function () {
    const modal = document.getElementById('diegoBugModal');
    modal.style.display = 'flex';
    document.getElementById('diegoBugDescripcion').value = '';
    document.getElementById('diegoBugMsg').textContent = '';
  };
  window.cerrarReporteBugDiego = function () {
    document.getElementById('diegoBugModal').style.display = 'none';
  };
  window.enviarReporteBugDiego = async function () {
    const desc = (document.getElementById('diegoBugDescripcion').value || '').trim();
    const msgEl = document.getElementById('diegoBugMsg');
    if (!desc) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'Describí el error antes de enviar.'; return; }
    msgEl.style.color = '#64748b'; msgEl.textContent = 'Enviando…';
    try {
      const { error } = await sb.from('preguntas_pendientes').insert({
        tema: 'Bug Diego: ' + desc.slice(0, 80),
        contexto: desc,
        solicitante: currentUser || 'desconocido',
        destinatario: 'pablo.arancibia@gmail.com',
        tipo: 'bug_diego',
        status: 'pendiente',
      });
      if (error) throw error;
      msgEl.style.color = '#059669'; msgEl.textContent = '✓ Reporte enviado. Pablo lo verá en su bandeja.';
      setTimeout(window.cerrarReporteBugDiego, 2200);
    } catch (e) {
      msgEl.style.color = '#ef4444'; msgEl.textContent = 'Error al enviar: ' + (e.message || 'intenta de nuevo');
    }
  };
  document.getElementById('diegoBugModal').addEventListener('click', function (e) {
    if (e.target === this) window.cerrarReporteBugDiego();
  });

  // Notificación naranja realtime para Dusan/Pablo
  function notifShow(titulo, preview) {
    var notif = document.getElementById('diegoCarteroNotif');
    document.getElementById('dcnTitle').textContent = titulo || '📬 Nuevo mensaje Diego';
    document.getElementById('dcnPreview').textContent = preview || '';
    notif.style.display = 'block';
    setTimeout(function () { notif.style.display = 'none'; }, 12000);
  }
  document.getElementById('dcnClose').addEventListener('click', function () {
    document.getElementById('diegoCarteroNotif').style.display = 'none';
  });

  function subscribeRealtime() {
    if (!ready()) { setTimeout(subscribeRealtime, 1000); return; }
    var email = resolveEmail();
    if (!email) { setTimeout(subscribeRealtime, 2000); return; }
    var ADMINS = ['dusan.arancibia@gmail.com', 'gerencia@gestionrepchile.cl', 'sistemas@gestionrepchile.cl', 'recepcion01@gestionrepchile.cl'];
    if (!ADMINS.includes(email)) return;
    try {
      sb.channel('diego_inbox_cartero_' + email)
        .on('postgres_changes', { event: 'INSERT', schema: 'panel', table: 'diego_inbox' }, function (payload) {
          var row = payload?.new;
          if (!row) return;
          var emojis = { algo_no_funciona: '🔴', idea: '💡', no_se_como: '❓', urgente: '🚨' };
          var emoji = emojis[row.categoria] || '📬';
          notifShow(emoji + ' ' + (row.categoria || 'feedback') + ' · ' + (row.usuario_email || 'anónimo'), (row.mensaje || '').slice(0, 120));
        })
        .subscribe();
    } catch (e) {
      console.warn('[diego-cartero] Realtime subscribe error:', e?.message || e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribeRealtime);
  else setTimeout(subscribeRealtime, 1500);
})();
