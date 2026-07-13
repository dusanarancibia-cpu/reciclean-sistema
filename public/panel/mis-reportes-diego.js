// ============================================================
// MIS REPORTES DIEGO — extraído de panel-rdo.html (antifragilidad panel, bloque 9 · PR 1 de 3)
// D-DIEGO-CARTERO-001 (PC2 Pablo 2026-06-01 mig 169/170 backend)
//
// Tab tabMisReportes: mensajes que el usuario mandó a Diego (FAB modal
// 4 categorías) y su estado.
//
// Ya venía como IIFE auto-contenida en el original — se preserva tal cual.
// Cero window.X exports (interactividad 100% vía addEventListener interno).
// Cero HTML onclick referencia funciones de este archivo.
//
// Dependencias externas: ninguna hacia otros módulos, Diego LLM, el núcleo,
// Precios, Cumplimiento ni Firmas/Tarifas.
// ============================================================

(function () {
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
  function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function estadoBadge(estado) {
    var map = {
      recibido:            { color: 'bg-amber-100 text-amber-800', label: '🟡 Recibido' },
      respondida_faq_auto: { color: 'bg-emerald-100 text-emerald-800', label: '🟢 Respondida (FAQ)' },
      ruteado_pc:          { color: 'bg-amber-100 text-amber-800', label: '🟡 Esperando' },
      en_curso:            { color: 'bg-blue-100 text-blue-800', label: '🔵 En curso' },
      resuelto:            { color: 'bg-emerald-100 text-emerald-800', label: '🟢 Resuelto' },
      cerrado_sin_accion:  { color: 'bg-stone-100 text-stone-700', label: '⚫ Cerrado' },
    };
    var m = map[estado] || { color: 'bg-stone-100 text-stone-600', label: estado || '?' };
    return '<span class="text-[10px] px-1.5 py-0.5 rounded ' + m.color + '">' + m.label + '</span>';
  }
  function categoriaEmoji(c) {
    return ({ algo_no_funciona: '🔴', idea: '💡', no_se_como: '❓', urgente: '🚨' })[c] || '📬';
  }

  async function loadMisReportes() {
    if (!ready()) return;
    var email = resolveEmail();
    var lista = document.getElementById('misReportesLista');
    var countEl = document.getElementById('misReportesCount');
    if (!email) {
      if (lista) lista.innerHTML = '<div class="text-xs text-stone-400 italic py-2 text-center">No detecto tu sesión. Recargá la página.</div>';
      return;
    }
    try {
      var resp = await sb.schema('panel').from('diego_inbox')
        .select('id, categoria, mensaje, estado, creado_en, resuelto_en, resolucion_descripcion, commit_hash, payload_extra')
        .eq('usuario_email', email)
        .order('creado_en', { ascending: false })
        .limit(100);
      if (resp.error) throw resp.error;
      var rows = resp.data || [];

      // KPIs
      var kRecibido = 0, kEnCurso = 0, kResuelto = 0, kCerrado = 0;
      rows.forEach(function (r) {
        if (r.estado === 'recibido' || r.estado === 'ruteado_pc') kRecibido++;
        else if (r.estado === 'en_curso') kEnCurso++;
        else if (r.estado === 'resuelto' || r.estado === 'respondida_faq_auto') kResuelto++;
        else if (r.estado === 'cerrado_sin_accion') kCerrado++;
      });
      document.getElementById('misReportesKpiRecibido').textContent = kRecibido;
      document.getElementById('misReportesKpiEnCurso').textContent = kEnCurso;
      document.getElementById('misReportesKpiResuelto').textContent = kResuelto;
      document.getElementById('misReportesKpiCerrado').textContent = kCerrado;
      if (countEl) countEl.textContent = rows.length + ' reportes';

      if (!rows.length) {
        lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Aún no mandaste nada a Diego. Usá el botón verde abajo a la derecha para reportar algo.</div>';
        return;
      }
      lista.innerHTML = rows.map(function (r) {
        var ts = new Date(r.creado_en);
        var tsStr = ts.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
        var respAuto = r.payload_extra && r.payload_extra.respuesta_auto;
        var resolucion = r.resolucion_descripcion;
        var commit = r.commit_hash;
        return '<div class="bg-white border border-stone-200 rounded p-3">' +
          '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
            '<span class="font-semibold text-sm">' + categoriaEmoji(r.categoria) + ' ' + escapeHtml(r.categoria.replace(/_/g, ' ')) + '</span>' +
            estadoBadge(r.estado) +
          '</div>' +
          '<div class="text-stone-700 text-sm mb-1">' + escapeHtml(r.mensaje) + '</div>' +
          '<div class="text-xs text-stone-400">' + tsStr + '</div>' +
          (respAuto ? '<div class="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">💬 ' + escapeHtml(respAuto) + '</div>' : '') +
          (resolucion ? '<div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">✅ ' + escapeHtml(resolucion) + (commit ? ' <span class="text-stone-500">· commit ' + escapeHtml(commit.slice(0, 8)) + '</span>' : '') + '</div>' : '') +
        '</div>';
      }).join('');
    } catch (e) {
      console.error('[MisReportes] error:', e);
      if (lista) lista.innerHTML = '<div class="text-xs text-red-700 italic py-2 text-center">Error al cargar tus reportes: ' + escapeHtml(e?.message || String(e)) + '</div>';
    }
  }

  function init() {
    document.querySelector('button[data-tab="mis_reportes"]')?.addEventListener('click', function () { setTimeout(loadMisReportes, 100); });
    document.querySelector('a[data-v4-tab="mis_reportes"]')?.addEventListener('click', function () { setTimeout(loadMisReportes, 100); });
    var refreshBtn = document.getElementById('misReportesRefresh');
    if (refreshBtn) refreshBtn.addEventListener('click', loadMisReportes);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
