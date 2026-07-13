// ============================================================
// CARTERO OPERATIVO — Material Nuevo + Despacho Coord + Incidentes Operativos
// extraído de panel-rdo.html (antifragilidad panel, bloque 9 · PR 1 de 3)
// D-FEATURE-CARTERO-005 (Material Nuevo) + D-FEATURE-CARTERO-003 (Despacho
// Coord) + D-FEATURE-CARTERO-004 (Incidentes) — PC2 Pablo 2026-06-01.
//
// 3 tabs (tabMaterialNuevo, tabDespachoCoord, tabIncidentesOp) ya venían
// combinados en UNA sola IIFE auto-contenida en el original — se preserva
// tal cual, sin cambios de wrapping ni de agrupación.
//
// Cero window.X exports (interactividad 100% vía addEventListener interno,
// bind() propio registra los 3 tabs). Cero HTML onclick referencia
// funciones de este archivo.
//
// Dependencias externas: ninguna hacia otros módulos, Diego LLM, el núcleo,
// Precios, Cumplimiento ni Firmas/Tarifas. NO comparte IIFE ni helpers con
// el bloque E (Firmas Pend/Reglas/Tarifas Ext) que sigue sin extraer.
//
// isAdmin() local con lista hardcodeada de emails — duplicación conocida
// (documentada en el mapeo fino), no bloqueante, no se toca en este PR.
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
  function fmtCLP(n) { if (n == null) return '—'; return '$' + Number(n).toLocaleString('es-CL'); }
  function badge(estado, mapColor) {
    var color = mapColor[estado] || 'bg-stone-100 text-stone-700';
    return '<span class="text-[10px] px-1.5 py-0.5 rounded ' + color + '">' + esc(estado.replace(/_/g, ' ')) + '</span>';
  }
  function showError(el, msg) {
    el.innerHTML = '<div class="text-xs text-red-700 italic py-2 text-center bg-red-50 border border-red-200 rounded p-2">' + esc(msg) + '</div>';
  }
  function isAdmin(email) {
    return ['dusan.arancibia@gmail.com','gerencia@gestionrepchile.cl','sistemas@gestionrepchile.cl','recepcion01@gestionrepchile.cl','soporte@gestionrepchile.cl'].includes(email);
  }

  // ===== FEATURE [5] MATERIAL NUEVO =====
  var mnColorMap = { pendiente: 'bg-amber-100 text-amber-800', en_busqueda_precio: 'bg-blue-100 text-blue-800', aprobada: 'bg-emerald-100 text-emerald-800', rechazada: 'bg-red-100 text-red-800' };
  async function loadMaterialNuevo() {
    var lista = document.getElementById('materialNuevoLista');
    if (!ready()) { showError(lista, 'Sesión no detectada. Recargá.'); return; }
    var email = resolveEmail();
    if (!email) { showError(lista, 'No detecto tu sesión.'); return; }
    try {
      var resp = await sb.rpc('material_nuevo_listar', { p_email: email, p_solo_pendientes: false });
      if (resp.error) throw resp.error;
      var rows = resp.data || [];
      if (!rows.length) { lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Aún no hay solicitudes.</div>'; return; }
      var admin = isAdmin(email);
      lista.innerHTML = rows.map(function (r) {
        var puedeDecidir = admin && r.estado === 'pendiente';
        return '<div class="bg-white border border-stone-200 rounded p-3">' +
          '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
            '<span class="font-semibold text-sm">🆕 ' + esc(r.material_nombre) + '</span>' +
            badge(r.estado, mnColorMap) +
          '</div>' +
          '<div class="text-xs text-stone-600">' + esc(r.solicitante_email) + ' · sucursal ' + esc(r.sucursal_codigo || '—') + (r.cliente_razon_social ? ' · cliente ' + esc(r.cliente_razon_social) : '') + '</div>' +
          '<div class="text-xs text-stone-500 mt-1">' + (r.kg_estimado ? esc(r.kg_estimado) + ' kg · ' : '') + (r.precio_propuesto_clp ? 'propuesto ' + fmtCLP(r.precio_propuesto_clp) : 'sin precio') + '</div>' +
          (r.motivo ? '<div class="text-xs text-stone-700 italic mt-1">"' + esc(r.motivo) + '"</div>' : '') +
          (r.comentarios_aprobador ? '<div class="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">💬 ' + esc(r.comentarios_aprobador) + '</div>' : '') +
          '<div class="text-[10px] text-stone-400 mt-1">' + fmtFecha(r.created_at) + (r.decided_at ? ' · decidido ' + fmtFecha(r.decided_at) : '') + '</div>' +
          (puedeDecidir ? '<div class="mt-2 flex gap-1"><button class="mn-aprobar text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded" data-id="' + esc(r.id) + '">✓ Aprobar</button>' +
                                                            '<button class="mn-buscar text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded" data-id="' + esc(r.id) + '">🔍 Buscar precio</button>' +
                                                            '<button class="mn-rechazar text-[10px] px-2 py-0.5 bg-red-600 text-white rounded" data-id="' + esc(r.id) + '">✕ Rechazar</button></div>' : '') +
        '</div>';
      }).join('');
    } catch (e) {
      console.error('[material_nuevo] error:', e);
      showError(lista, 'Error al cargar: ' + (e?.message || e));
    }
  }
  async function decidirMaterial(id, decision) {
    var email = resolveEmail();
    var coment = prompt(decision === 'rechazada' ? 'Razón del rechazo (opcional):' : decision === 'en_busqueda_precio' ? 'Notas para el solicitante (opcional):' : 'Comentarios (opcional):', '');
    try {
      var resp = await sb.rpc('material_nuevo_decidir', { p_id: id, p_aprobador_email: email, p_decision: decision, p_comentarios: coment || null });
      if (resp.error) throw resp.error;
      loadMaterialNuevo();
    } catch (e) { alert('Error: ' + (e?.message || e)); }
  }

  // ===== FEATURE [3] DESPACHO COORD =====
  var dcColorMap = { programado: 'bg-amber-100 text-amber-800', en_ejecucion: 'bg-blue-100 text-blue-800', ejecutado: 'bg-emerald-100 text-emerald-800', cancelado: 'bg-stone-100 text-stone-700' };
  async function loadDespachoCoord() {
    var lista = document.getElementById('despachoLista');
    if (!ready()) { showError(lista, 'Sesión no detectada.'); return; }
    try {
      var resp = await sb.rpc('despacho_coord_listar', { p_solo_activos: false });
      if (resp.error) throw resp.error;
      var rows = resp.data || [];
      if (!rows.length) { lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Aún no hay despachos programados.</div>'; return; }
      lista.innerHTML = rows.map(function (r) {
        return '<div class="bg-white border border-stone-200 rounded p-3">' +
          '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
            '<span class="font-semibold text-sm">🚚 ' + esc(r.material_nombre || '(sin material)') + '</span>' +
            badge(r.estado, dcColorMap) +
          '</div>' +
          '<div class="text-xs text-stone-600">' + esc(r.solicitante_email) + ' · suc ' + esc(r.sucursal_codigo || '—') + (r.cliente_razon_social ? ' · ' + esc(r.cliente_razon_social) : '') + '</div>' +
          '<div class="text-xs text-stone-500 mt-1">' + (r.kg_estimado ? esc(r.kg_estimado) + ' kg · ' : '') + (r.fecha_programada ? 'fecha ' + esc(r.fecha_programada) : 'sin fecha') + (r.transporte_tipo ? ' · ' + esc(r.transporte_tipo.replace(/_/g, ' ')) : '') + '</div>' +
          (r.destino ? '<div class="text-xs text-stone-500">destino: ' + esc(r.destino) + '</div>' : '') +
          (r.notas ? '<div class="text-xs text-stone-700 italic mt-1">"' + esc(r.notas) + '"</div>' : '') +
          '<div class="text-[10px] text-stone-400 mt-1">' + fmtFecha(r.created_at) + (r.ejecutado_at ? ' · ejecutado ' + fmtFecha(r.ejecutado_at) : '') + '</div>' +
          (r.estado === 'programado' || r.estado === 'en_ejecucion' ? '<div class="mt-2 flex gap-1">' +
            (r.estado === 'programado' ? '<button class="dc-ejec text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded" data-id="' + esc(r.id) + '">▶ En ejecución</button>' : '') +
            '<button class="dc-done text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded" data-id="' + esc(r.id) + '">✓ Ejecutado</button>' +
            '<button class="dc-cancel text-[10px] px-2 py-0.5 bg-red-600 text-white rounded" data-id="' + esc(r.id) + '">✕ Cancelar</button>' +
          '</div>' : '') +
        '</div>';
      }).join('');
    } catch (e) {
      console.error('[despacho_coord] error:', e);
      showError(lista, 'Error: ' + (e?.message || e));
    }
  }
  async function actualizarDespacho(id, nuevo) {
    var motivo = nuevo === 'cancelado' ? prompt('Motivo cancelación (opcional):', '') : null;
    try {
      var resp = await sb.rpc('despacho_coord_actualizar', { p_id: id, p_nuevo_estado: nuevo, p_motivo: motivo });
      if (resp.error) throw resp.error;
      loadDespachoCoord();
    } catch (e) { alert('Error: ' + (e?.message || e)); }
  }

  // ===== FEATURE [4] INCIDENTES =====
  var ioColorMap = { abierto: 'bg-red-100 text-red-800', en_proceso: 'bg-amber-100 text-amber-800', resuelto: 'bg-emerald-100 text-emerald-800', cerrado_sin_solucion: 'bg-stone-100 text-stone-700' };
  var ioSevMap = { critica: '🆘', alta: '🔴', media: '🟡', baja: '🟢' };
  async function loadIncidentes() {
    var lista = document.getElementById('incidenteLista');
    if (!ready()) { showError(lista, 'Sesión no detectada.'); return; }
    try {
      var resp = await sb.rpc('incidente_op_listar', { p_solo_abiertos: false });
      if (resp.error) throw resp.error;
      var rows = resp.data || [];
      if (!rows.length) { lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Sin incidentes registrados.</div>'; return; }
      lista.innerHTML = rows.map(function (r) {
        var puedeResolver = r.estado === 'abierto' || r.estado === 'en_proceso';
        return '<div class="bg-white border border-stone-200 rounded p-3">' +
          '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
            '<span class="font-semibold text-sm">' + (ioSevMap[r.severidad] || '🛠️') + ' ' + esc(r.equipo || '(sin equipo)') + '</span>' +
            badge(r.estado, ioColorMap) +
          '</div>' +
          '<div class="text-xs text-stone-700">' + esc(r.descripcion) + '</div>' +
          '<div class="text-xs text-stone-500 mt-1">' + esc(r.reportado_por) + ' · suc ' + esc(r.sucursal_codigo || '—') + (r.costo_estimado_clp ? ' · costo ' + fmtCLP(r.costo_estimado_clp) : '') + '</div>' +
          (r.solucion ? '<div class="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">✅ <strong>Solución:</strong> ' + esc(r.solucion) + (r.resuelto_por ? ' <span class="text-stone-500">(' + esc(r.resuelto_por) + ')</span>' : '') + '</div>' : '') +
          '<div class="text-[10px] text-stone-400 mt-1">ocurrió ' + fmtFecha(r.fecha_ocurrencia) + (r.fecha_resuelto ? ' · resuelto ' + fmtFecha(r.fecha_resuelto) : '') + '</div>' +
          (puedeResolver ? '<div class="mt-2"><button class="io-resolver text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded" data-id="' + esc(r.id) + '">✓ Registrar solución</button></div>' : '') +
        '</div>';
      }).join('');
    } catch (e) {
      console.error('[incidentes_op] error:', e);
      showError(lista, 'Error: ' + (e?.message || e));
    }
  }
  async function resolverIncidente(id) {
    var sol = prompt('¿Qué solución se aplicó?', '');
    if (sol === null) return;
    if (!sol.trim()) { alert('Solución no puede estar vacía.'); return; }
    var email = resolveEmail();
    try {
      var resp = await sb.rpc('incidente_op_resolver', { p_id: id, p_resuelto_por: email, p_solucion: sol.trim(), p_estado_final: 'resuelto' });
      if (resp.error) throw resp.error;
      loadIncidentes();
    } catch (e) { alert('Error: ' + (e?.message || e)); }
  }

  // ===== INIT + handlers de form =====
  function init() {
    // Tabs
    var bind = function (tab, sectionId, loader) {
      document.querySelector('button[data-tab="' + tab + '"]')?.addEventListener('click', function () { setTimeout(loader, 100); });
      document.querySelector('a[data-v4-tab="' + tab + '"]')?.addEventListener('click', function () { setTimeout(loader, 100); });
    };
    bind('material_nuevo', 'tabMaterialNuevo', loadMaterialNuevo);
    bind('despacho_coord', 'tabDespachoCoord', loadDespachoCoord);
    bind('incidentes_op',  'tabIncidentesOp',  loadIncidentes);

    // FEATURE [5] form material nuevo
    document.getElementById('materialNuevoNuevoBtn')?.addEventListener('click', function () {
      document.getElementById('materialNuevoForm').classList.toggle('hidden');
    });
    document.getElementById('mn_cancelar')?.addEventListener('click', function () {
      document.getElementById('materialNuevoForm').classList.add('hidden');
    });
    document.getElementById('mn_enviar')?.addEventListener('click', async function () {
      var material = document.getElementById('mn_material').value.trim();
      if (!material) { alert('Material es requerido'); return; }
      var email = resolveEmail();
      if (!email) { alert('No detecto sesión'); return; }
      try {
        var resp = await sb.rpc('material_nuevo_solicitar', {
          p_solicitante_email: email,
          p_material_nombre: material,
          p_sucursal_codigo: document.getElementById('mn_sucursal').value.trim() || null,
          p_cliente_razon_social: document.getElementById('mn_cliente').value.trim() || null,
          p_kg_estimado: parseFloat(document.getElementById('mn_kg').value) || null,
          p_precio_propuesto_clp: parseFloat(document.getElementById('mn_precio').value) || null,
          p_motivo: document.getElementById('mn_motivo').value.trim() || null
        });
        if (resp.error) throw resp.error;
        ['mn_material','mn_kg','mn_precio','mn_sucursal','mn_cliente','mn_motivo'].forEach(function (id) { document.getElementById(id).value = ''; });
        document.getElementById('materialNuevoForm').classList.add('hidden');
        loadMaterialNuevo();
      } catch (e) { alert('Error: ' + (e?.message || e)); }
    });
    document.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('.mn-aprobar')))  decidirMaterial(b.dataset.id, 'aprobada');
      else if ((b = e.target.closest('.mn-buscar')))   decidirMaterial(b.dataset.id, 'en_busqueda_precio');
      else if ((b = e.target.closest('.mn-rechazar'))) decidirMaterial(b.dataset.id, 'rechazada');
      else if ((b = e.target.closest('.dc-ejec')))     actualizarDespacho(b.dataset.id, 'en_ejecucion');
      else if ((b = e.target.closest('.dc-done')))     actualizarDespacho(b.dataset.id, 'ejecutado');
      else if ((b = e.target.closest('.dc-cancel')))   actualizarDespacho(b.dataset.id, 'cancelado');
      else if ((b = e.target.closest('.io-resolver'))) resolverIncidente(b.dataset.id);
    });

    // FEATURE [3] form despacho
    document.getElementById('despachoNuevoBtn')?.addEventListener('click', function () {
      document.getElementById('despachoForm').classList.toggle('hidden');
    });
    document.getElementById('dc_cancelar')?.addEventListener('click', function () {
      document.getElementById('despachoForm').classList.add('hidden');
    });
    document.getElementById('dc_enviar')?.addEventListener('click', async function () {
      var material = document.getElementById('dc_material').value.trim();
      if (!material) { alert('Material es requerido'); return; }
      var email = resolveEmail();
      if (!email) { alert('No detecto sesión'); return; }
      try {
        var resp = await sb.rpc('despacho_coord_crear', {
          p_solicitante_email: email,
          p_material_nombre: material,
          p_sucursal_codigo: document.getElementById('dc_sucursal').value.trim() || null,
          p_cliente_razon_social: document.getElementById('dc_cliente').value.trim() || null,
          p_kg_estimado: parseFloat(document.getElementById('dc_kg').value) || null,
          p_fecha_programada: document.getElementById('dc_fecha').value || null,
          p_transporte_tipo: document.getElementById('dc_transporte').value || null,
          p_destino: document.getElementById('dc_destino').value.trim() || null,
          p_notas: document.getElementById('dc_notas').value.trim() || null
        });
        if (resp.error) throw resp.error;
        ['dc_material','dc_kg','dc_fecha','dc_sucursal','dc_cliente','dc_destino','dc_notas'].forEach(function (id) { document.getElementById(id).value = ''; });
        document.getElementById('dc_transporte').value = '';
        document.getElementById('despachoForm').classList.add('hidden');
        loadDespachoCoord();
      } catch (e) { alert('Error: ' + (e?.message || e)); }
    });

    // FEATURE [4] form incidente
    document.getElementById('incidenteNuevoBtn')?.addEventListener('click', function () {
      document.getElementById('incidenteForm').classList.toggle('hidden');
    });
    document.getElementById('io_cancelar')?.addEventListener('click', function () {
      document.getElementById('incidenteForm').classList.add('hidden');
    });
    document.getElementById('io_enviar')?.addEventListener('click', async function () {
      var descr = document.getElementById('io_descripcion').value.trim();
      if (!descr) { alert('Descripción es requerida'); return; }
      var email = resolveEmail();
      if (!email) { alert('No detecto sesión'); return; }
      try {
        var resp = await sb.rpc('incidente_op_crear', {
          p_reportado_por: email,
          p_descripcion: descr,
          p_sucursal_codigo: document.getElementById('io_sucursal').value.trim() || null,
          p_equipo: document.getElementById('io_equipo').value.trim() || null,
          p_severidad: document.getElementById('io_severidad').value || 'media',
          p_costo_estimado_clp: parseFloat(document.getElementById('io_costo').value) || null
        });
        if (resp.error) throw resp.error;
        ['io_descripcion','io_equipo','io_sucursal','io_costo'].forEach(function (id) { document.getElementById(id).value = ''; });
        document.getElementById('io_severidad').value = 'media';
        document.getElementById('incidenteForm').classList.add('hidden');
        loadIncidentes();
      } catch (e) { alert('Error: ' + (e?.message || e)); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
