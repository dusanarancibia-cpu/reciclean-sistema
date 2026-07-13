// ============================================================
// MIS ENVÍOS A DIEGO — extraído de panel-rdo.html (antifragilidad panel, bloque 9 · PR 1 de 3)
// D-FEATURE-CARTERO-010 (PC2 Pablo 2026-06-01 mig 180+181 backend)
//
// Tab tabMisEnviosDiego: tareas/encargos que el usuario le mandó a Diego
// y su estado de avance.
//
// Ya venía como IIFE auto-contenida en el original — se preserva tal cual.
// Cero window.X exports (interactividad 100% vía addEventListener interno).
// Cero HTML onclick referencia funciones de este archivo.
//
// Dependencias externas: ninguna hacia otros módulos, Diego LLM, el núcleo,
// Precios, Cumplimiento ni Firmas/Tarifas.
// ============================================================

(function () {
  function ready() { return typeof sb !== 'undefined' && sb && sb.rpc; }
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
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmtFecha(ts) { if (!ts) return '—'; try { return new Date(ts).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return ts; } }
  function tareaBadge(estado) {
    var map = {
      pendiente:  { c: 'bg-amber-100 text-amber-800', l: '🟡 Pendiente' },
      en_curso:   { c: 'bg-blue-100 text-blue-800',   l: '🔵 En curso' },
      completada: { c: 'bg-emerald-100 text-emerald-800', l: '🟢 Completada' },
      cancelada:  { c: 'bg-stone-100 text-stone-700', l: '⚫ Cancelada' },
    };
    var m = map[estado] || { c: 'bg-stone-100 text-stone-600', l: estado || '?' };
    return '<span class="text-[10px] px-1.5 py-0.5 rounded ' + m.c + '">' + m.l + '</span>';
  }
  function prioBadge(p) {
    var map = { alta: 'bg-red-100 text-red-800', media: 'bg-amber-100 text-amber-800', baja: 'bg-stone-100 text-stone-600' };
    return '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (map[p] || 'bg-stone-100 text-stone-600') + '">' + esc(p || 'media') + '</span>';
  }

  async function loadMisEnviosDiego() {
    if (!ready()) return;
    var email = resolveEmail();
    var listaT = document.getElementById('misEnviosTareasLista');
    var listaA = document.getElementById('misEnviosArchivosLista');
    var countEl = document.getElementById('misEnviosCount');
    if (!email) {
      if (listaT) listaT.innerHTML = '<div class="text-xs text-stone-400 italic py-2 text-center">No detecto tu sesión. Recargá la página.</div>';
      return;
    }
    try {
      var resp = await sb.rpc('diego_mis_envios_resumen', { p_email: email });
      if (resp.error) throw resp.error;
      var data = resp.data || {};
      var stats = data.stats || {};
      var tareas = data.tareas || [];
      var archivos = data.archivos || [];

      // KPIs
      document.getElementById('misEnviosKpiTareasPend').textContent = stats.tareas_pendientes || 0;
      document.getElementById('misEnviosKpiTareasOk').textContent = stats.tareas_completadas || 0;
      document.getElementById('misEnviosKpiArchivos').textContent = stats.archivos_total || 0;
      document.getElementById('misEnviosKpiTotal').textContent = (stats.tareas_total || 0) + (stats.archivos_total || 0);
      if (countEl) countEl.textContent = ((stats.tareas_total || 0) + (stats.archivos_total || 0)) + ' envíos' + (stats.es_admin ? ' (vista admin)' : '');

      // Tareas
      if (!tareas.length) {
        listaT.innerHTML = '<div class="text-xs text-stone-400 italic py-3 text-center">Aún no le pediste tareas a Diego.</div>';
      } else {
        listaT.innerHTML = tareas.map(function (t) {
          var asignadaA = t.destinatario || t.contacto_externo || '—';
          return '<div class="bg-white border border-stone-200 rounded p-3">' +
            '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
              '<span class="font-semibold text-sm">' + esc(t.titulo || t.tipo || 'Tarea') + '</span>' +
              '<div class="flex gap-1">' + prioBadge(t.prioridad) + tareaBadge(t.estado) + '</div>' +
            '</div>' +
            (t.descripcion ? '<div class="text-stone-700 text-xs mb-1">' + esc(t.descripcion) + '</div>' : '') +
            '<div class="text-xs text-stone-500 flex flex-wrap gap-x-3">' +
              '<span>👤 Asignado a: <b>' + esc(asignadaA) + '</b></span>' +
              (t.deadline ? '<span>📅 Deadline: ' + esc(t.deadline) + '</span>' : '') +
              '<span>🕐 ' + fmtFecha(t.created_at) + '</span>' +
              (t.completada_en ? '<span class="text-emerald-700">✓ ' + fmtFecha(t.completada_en) + '</span>' : '') +
            '</div>' +
          '</div>';
        }).join('');
      }

      // Archivos
      if (!archivos.length) {
        listaA.innerHTML = '<div class="text-xs text-stone-400 italic py-3 text-center">No mandaste archivos a Diego por WhatsApp todavía.</div>';
      } else {
        listaA.innerHTML = archivos.map(function (a) {
          var estado = a.resuelto ? '🟢 Procesado' : (a.status_inferido || '🟡 Pendiente');
          return '<div class="bg-white border border-stone-200 rounded p-3">' +
            '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
              '<span class="font-semibold text-sm">📎 ' + esc(a.archivo_nombre || 'archivo') + '</span>' +
              '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (a.resuelto ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + '">' + esc(estado) + '</span>' +
            '</div>' +
            '<div class="text-xs text-stone-500 flex flex-wrap gap-x-3">' +
              (a.archivo_tipo ? '<span>tipo: ' + esc(a.archivo_tipo) + '</span>' : '') +
              '<span>🕐 ' + fmtFecha(a.created_at) + '</span>' +
              (a.archivo_url ? '<a class="text-sky-700 underline" href="' + esc(a.archivo_url) + '" target="_blank" rel="noopener">ver</a>' : '') +
            '</div>' +
            (a.decision_dusan ? '<div class="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">📝 ' + esc(a.decision_dusan) + '</div>' : '') +
          '</div>';
        }).join('');
      }
    } catch (e) {
      console.error('[MisEnviosDiego] error:', e);
      if (listaT) listaT.innerHTML = '<div class="text-xs text-red-700 italic py-2 text-center">Error: ' + esc(e?.message || String(e)) + '</div>';
    }
  }

  function init() {
    document.querySelector('button[data-tab="mis_envios_diego"]')?.addEventListener('click', function () { setTimeout(loadMisEnviosDiego, 100); });
    document.querySelector('a[data-v4-tab="mis_envios_diego"]')?.addEventListener('click', function () { setTimeout(loadMisEnviosDiego, 100); });
    var refreshBtn = document.getElementById('misEnviosRefresh');
    if (refreshBtn) refreshBtn.addEventListener('click', loadMisEnviosDiego);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
