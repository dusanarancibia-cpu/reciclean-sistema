// ============================================================
// PILOTO PWA (mig 195) — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
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
  function estadoBadge(estado) {
    var map = {
      invitacion_pendiente: { c: 'bg-amber-100 text-amber-800', l: '🟡 Pendiente invitar' },
      invitado: { c: 'bg-blue-100 text-blue-800', l: '📤 Invitado' },
      activado: { c: 'bg-emerald-100 text-emerald-800', l: '✅ Activado' },
      rechazado: { c: 'bg-red-100 text-red-700', l: '⚫ Rechazado' },
      inactivo: { c: 'bg-stone-100 text-stone-600', l: '💤 Inactivo' },
    };
    var m = map[estado] || { c: 'bg-stone-100 text-stone-600', l: estado || '?' };
    return '<span class="text-[10px] px-2 py-0.5 rounded ' + m.c + '">' + m.l + '</span>';
  }

  async function loadPiloto() {
    var lista = document.getElementById('ppwa_lista');
    if (!ready() || !lista) return;
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-3 text-center">Cargando…</div>';
    try {
      var resp = await sb.rpc('app_pwa_piloto_listar');
      if (resp.error) throw resp.error;
      var data = resp.data || {};
      var stats = data.stats || {};
      var filas = data.filas || [];
      document.getElementById('ppwa_kpi_total').textContent = stats.total || 0;
      document.getElementById('ppwa_kpi_pendientes').textContent = stats.pendientes || 0;
      document.getElementById('ppwa_kpi_invitados').textContent = stats.invitados || 0;
      document.getElementById('ppwa_kpi_activados').textContent = stats.activados || 0;
      document.getElementById('ppwa_kpi_con_uso').textContent = stats.con_uso_7d || 0;
      document.getElementById('ppwa_kpi_rechazados').textContent = stats.rechazados || 0;

      if (!filas.length) {
        lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Sin clientes piloto cargados.</div>';
        return;
      }
      lista.innerHTML = filas.map(function (r) {
        return '<div class="bg-white border border-stone-200 rounded p-3" data-id="' + esc(r.id) + '">' +
          '<div class="flex items-center justify-between gap-2 mb-2 flex-wrap">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
              '<span class="font-semibold text-sm">' + esc(r.razon_social) + '</span>' +
              estadoBadge(r.estado) +
            '</div>' +
            '<span class="text-[10px] text-stone-400">' + esc(r.cliente_id || '—') + '</span>' +
          '</div>' +
          '<div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">' +
            '<div>👤 ' + esc(r.contacto_nombre || '<sin contacto>') + '</div>' +
            '<div>📧 ' + esc(r.contacto_email || '—') + '</div>' +
            '<div>📱 ' + esc(r.contacto_telefono || '—') + '</div>' +
          '</div>' +
          (r.notas ? '<div class="text-xs text-stone-500 italic mt-1">📝 ' + esc(r.notas) + '</div>' : '') +
          '<div class="text-[10px] text-stone-400 mt-2 flex flex-wrap gap-x-3">' +
            (r.invitado_at ? '<span>📤 invitado ' + fmtFecha(r.invitado_at) + (r.invitado_por ? ' · ' + esc(r.invitado_por) : '') + '</span>' : '') +
            (r.activado_at ? '<span>✅ activado ' + fmtFecha(r.activado_at) + '</span>' : '') +
            (r.cred_ultimo_login ? '<span>🔑 último login ' + fmtFecha(r.cred_ultimo_login) + '</span>' : '') +
            (r.mensajes_total ? '<span>💬 ' + r.mensajes_total + ' mensajes</span>' : '') +
          '</div>' +
          '<div class="mt-2 flex gap-1 flex-wrap">' +
            '<button class="ppwa-editar text-[10px] px-2 py-0.5 bg-stone-200 text-stone-700 rounded" data-id="' + esc(r.id) + '">✏ Editar contacto</button>' +
            (r.estado === 'invitacion_pendiente' && (r.contacto_email || r.contacto_telefono) ? '<button class="ppwa-marcar-invitado text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded" data-id="' + esc(r.id) + '">📤 Marcar invitado</button>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      console.error('[piloto-pwa] error:', e);
      lista.innerHTML = '<div class="text-xs text-red-700 italic py-2 text-center">Error: ' + esc(e?.message || e) + '</div>';
    }
  }
  window.loadPilotoPwa = loadPiloto;

  async function editarFila(id) {
    var nombre = prompt('Nombre del contacto comercial:', '') ?? '';
    if (nombre === null) return;
    var email = prompt('Email del contacto:', '') ?? '';
    var telefono = prompt('Teléfono celular del contacto (formato +56 9 XXXX XXXX):', '') ?? '';
    var notas = prompt('Notas adicionales (opcional):', '') ?? '';
    if (!nombre && !email && !telefono && !notas) return;
    var userEmail = resolveEmail();
    if (!userEmail) { alert('No detecto sesión'); return; }
    try {
      var r = await sb.rpc('app_pwa_piloto_actualizar_contacto', {
        p_id: id, p_email_solicitante: userEmail,
        p_contacto_nombre: nombre.trim() || null,
        p_contacto_email: email.trim() || null,
        p_contacto_telefono: telefono.trim() || null,
        p_notas: notas.trim() || null,
      });
      if (r.error) throw r.error;
      if (r.data && r.data.ok) { loadPiloto(); } else { alert('Error: ' + (r.data?.error || 'no autorizado')); }
    } catch (e) { alert('Error: ' + (e?.message || e)); }
  }
  async function marcarInvitado(id) {
    if (!confirm('¿Confirmás que ya le mandaste la invitación al cliente?')) return;
    var userEmail = resolveEmail();
    if (!userEmail) { alert('No detecto sesión'); return; }
    try {
      var r = await sb.rpc('app_pwa_piloto_marcar_invitado', { p_id: id, p_email_solicitante: userEmail });
      if (r.error) throw r.error;
      if (r.data && r.data.ok) { loadPiloto(); } else { alert('Error: ' + (r.data?.error || 'no autorizado')); }
    } catch (e) { alert('Error: ' + (e?.message || e)); }
  }

  function init() {
    document.querySelector('button[data-tab="piloto_pwa"]')?.addEventListener('click', function () { setTimeout(loadPiloto, 100); });
    document.querySelector('a[data-v4-tab="piloto_pwa"]')?.addEventListener('click', function () { setTimeout(loadPiloto, 100); });
    document.getElementById('ppwa_refresh')?.addEventListener('click', loadPiloto);
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.ppwa-editar');
      if (b) { editarFila(b.dataset.id); return; }
      b = e.target.closest('.ppwa-marcar-invitado');
      if (b) { marcarInvitado(b.dataset.id); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
