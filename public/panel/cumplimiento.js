// ============================================================
// CUMPLIMIENTO — extraído de panel-rdo.html (antifragilidad panel, bloque 10)
// Tab Cumplimiento Legal · silo 05 · 03-jun PC2 Pablo · MVP read+edit
// panel.cumplimiento_legal. Extendido 06-jun mig 227.
//
// MINI-SISTEMA EN 4 CAPAS (no una extracción plana — documentado a propósito):
//
//   1. CRUD base + archivos: loadCumplimiento, renderCumplimiento (impl.
//      original), guardarCumplimiento, cargarArchivos/subirArchivos/
//      verArchivo/borrarArchivo (Storage bucket 'impulsa-documentos',
//      prefix cumplimiento/ — bucket COMPARTIDO con otras 2 IIFEs no
//      relacionadas de este monolito; comparten bucket, no código).
//
//   2. Mis obligaciones / bienvenida / TOP1: renderMisObligaciones (impl.
//      original) es REASIGNADA en runtime dentro de init() —
//      `var _origRenderMis = renderMisObligaciones; renderMisObligaciones =
//      function(){ _origRenderMis.apply(this,arguments); maybeShowWelcome();
//      /* restaura TOP1 vía localStorage */ }`. Patrón decorador deliberado,
//      preservado tal cual — NO se desarma en esta extracción.
//
//   3. Sidebar contextual + filtros comuna/tipo: permisologiaApplyContextualSidebar()
//      + renderCumplimiento es TAMBIÉN reasignada (mismo patrón decorador)
//      para inyectar filtro por comuna/tipo de trámite.
//
//   4. Shell de 4 sub-vistas (supervision/micola/expedientes/tramites):
//      3 de las 4 son iframes a páginas standalone YA existentes fuera del
//      monolito (/supervision-jair.html · /mi-cola.html · /expedientes/index.html,
//      confirmadas en public/) — cero lógica que extraer ahí. Solo "tramites"
//      tiene lógica inline (es la capa 1+2+3 combinada).
//
// DEPENDENCIA DE SHELL/UI DEL PANEL (real, no "cero dependencia" — precisión
// pedida explícitamente por Dusan): la capa 3 (sidebar contextual) LEE Y
// ESCRIBE elementos del shell global del panel, no solo los propios de este
// tab:
//   - document.getElementById('siloSelector') — dropdown global de silo,
//     dispara permisologiaApplyContextualSidebar() en su evento 'change'.
//   - document.querySelectorAll('a[data-v4-tab]') — TODOS los links del
//     sidebar v4 (no solo el de Cumplimiento), les agrega/quita la clase
//     'permisologia-tab-oculto' según el silo activo.
//   - document.querySelectorAll('button[data-tab]') — TODOS los botones de
//     tabs del header antiguo, mismo tratamiento (compat).
//   - document.querySelectorAll('details.v4-cat') — TODAS las categorías
//     <details> del sidebar, se ocultan si no les queda ningún tab visible.
//   - Inyecta <style id="permisologia_contextual_css"> en document.head
//     (regla `.permisologia-tab-oculto { display:none !important; }`).
//   - Se re-aplica en CADA click de cualquier `button[data-tab]` del panel,
//     porque compite en precedencia visual con applySiloTabs() (núcleo,
//     línea ~8070 de panel-rdo.html, NO tocado) — applySiloTabs gestiona
//     visibilidad base por permisos; esta capa la refina más para modo foco.
//   - button[data-tab="cumplimiento"] / a[data-v4-tab="cumplimiento"]:
//     auto-registro del propio tab (mismo patrón que los 9 bloques anteriores).
//
// GLOBALS QUE USA O EXPONE (documentado explícito, pedido por Dusan):
//   - window._permisologiaInited — guard anti-doble-init ("08-jun fix
//     freeze"). Cero lectura/escritura fuera de este archivo.
//   - window.cumpKpiFiltrar — export global, usado por 4 botones onclick
//     en el HTML que se queda en panel-rdo.html (drill-down KPIs).
//   - window.showPermisologiaToast — export global, cero referencia externa.
//   - window._cumpKpiFiltro / window._permisologiaComunaSet /
//     window._permisologiaTipoActivo — estado en window pero uso exclusivo
//     interno de este archivo.
//   - window.currentUser / window.PERMS.es_admin / window.sb — lecturas
//     estándar de globals del núcleo de autenticación, mismo patrón
//     seguro usado en todo el panel.
//   - window.openDiegoChat — guard `typeof`, mismo patrón ya probado en
//     Bandeja Diego y Cartero. Diego LLM NO tocado.
//
// Sin IIFE-splitting: se preserva la IIFE completa tal cual, sin desarmar
// los decoradores runtime de las capas 2 y 3.
//
// Fuera de alcance (no tocado): Firmas Pendientes/Reglas, Tarifas Externas,
// Mesa V3 Pulso, Calibrador de Margen, Mesa Control 99-99, Diego LLM,
// Precios, el núcleo (salvo las lecturas/escrituras de shell documentadas
// arriba, que ya eran así en el original).
// ============================================================


// Tab Cumplimiento Legal · silo 05 · 03-jun PC2 Pablo · MVP read+edit panel.cumplimiento_legal
// Extendido 06-jun mig 227: drag&drop archivos + "mis obligaciones" + Diego ctx
(function () {
  let _cumpRows = [];
  let _sessionEmail = '';
  let _archivosCache = {};
  let _currentEditId = null;
  function $$(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function humanSize(b) { if (!b) return ''; if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(1) + ' MB'; }
  async function resolveSessionEmail() {
    try {
      if (window.currentUser && window.currentUser.email) return String(window.currentUser.email).toLowerCase();
    } catch (_) {}
    try {
      var rf = JSON.parse(localStorage.getItem('rf_session') || 'null');
      if (rf && rf.email) return String(rf.email).toLowerCase();
    } catch (_) {}
    try {
      if (window.sb && sb.auth) {
        var s = await sb.auth.getSession();
        var em = s && s.data && s.data.session && s.data.session.user && s.data.session.user.email;
        if (em) return String(em).toLowerCase();
      }
    } catch (_) {}
    return '';
  }
  // Vista CEO · 08-jun · si admin → ve todas las obligaciones del equipo (no solo las suyas).
  // Cubre el caso: Jair ve sus 40 obligaciones pero Dusan (gerencia@) veía vacío.
  function _esAdminCEO() {
    // Fase 4 · fuente única PERMS.es_admin (canónico via RPC get_effective_permissions)
    if (window.PERMS && window.PERMS.es_admin) return true;
    // Fallback defensivo: si PERMS no cargó, mantener chequeo por email canónico Dusan.
    return String(_sessionEmail || '').toLowerCase() === 'gerencia@gestionrepchile.cl';
  }
  function _esMia(r) {
    if (_esAdminCEO()) return true;
    return !!(r.responsable_email && String(r.responsable_email).toLowerCase() === _sessionEmail);
  }
  function badgeEstado(estado) {
    var map = {
      pendiente: { cls: 'bg-amber-100 text-amber-800', emoji: '🟡' },
      en_proceso: { cls: 'bg-sky-100 text-sky-800', emoji: '🔵' },
      cumplida: { cls: 'bg-emerald-100 text-emerald-800', emoji: '✅' },
      atrasada: { cls: 'bg-red-100 text-red-800', emoji: '🔴' },
      no_aplica: { cls: 'bg-stone-100 text-stone-600', emoji: '⚫' }
    };
    var m = map[estado] || map.pendiente;
    return '<span class="inline-block ' + m.cls + ' px-2 py-0.5 rounded text-xs">' + m.emoji + ' ' + esc(estado || 'pendiente') + '</span>';
  }
  async function loadCumplimiento() {
    var lista = $$('cump_lista');
    if (!lista || !window.sb) return;
    try {
      if (!_sessionEmail) _sessionEmail = await resolveSessionEmail();
      var resp = await sb.schema('panel').from('cumplimiento_legal').select('*').order('ley_id').order('articulo_id');
      // Enrich con títulos amigables desde articulos_ley · 08-jun MVP
      try {
        var titRes = await sb.schema('panel').from('articulos_ley').select('ley_id,articulo,titulo');
        if (titRes.data) {
          var titMap = {};
          titRes.data.forEach(function (t) { titMap[t.ley_id + '|' + t.articulo] = t.titulo; });
          (resp.data || []).forEach(function (r) { r.titulo = titMap[r.ley_id + '|' + r.articulo_id] || null; });
        }
      } catch (_) {}
      if (resp.error) throw resp.error;
      _cumpRows = resp.data || [];
      poblarFiltroLey();
      renderMisObligaciones();
      renderCumplimiento();
    } catch (e) {
      lista.innerHTML = '<div class="text-xs text-red-600 py-4 text-center">Error: ' + esc(e && e.message ? e.message : e) + '</div>';
    }
  }
  function renderMisObligaciones() {
    var box = $$('cump_mis_obligaciones');
    var listaMis = $$('cump_mis_lista');
    var cnt = $$('cump_mis_count');
    if (!box || !listaMis) return;
    if (!_sessionEmail) { box.classList.add('hidden'); return; }
    var mias = _cumpRows.filter(function (r) {
      return _esMia(r)
             && r.estado !== 'cumplida' && r.estado !== 'no_aplica';
    });
    if (!mias.length) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    if (cnt) cnt.textContent = mias.length;
    listaMis.innerHTML = mias.map(function (r) {
      var nArchivos = (_archivosCache[r.id] || []).length;
      var iconAdj = nArchivos > 0 ? '📎 ' + nArchivos : '⬜ sin adj';
      return '<button class="cump-mis-item w-full text-left bg-white border border-emerald-200 hover:border-emerald-400 rounded px-2 py-1.5 text-xs flex items-center justify-between gap-2" data-id="' + r.id + '">'
        + '<span class="truncate">' + badgeEstado(r.estado) + ' <strong>' + esc(r.ley_id) + '</strong> Art. ' + esc(r.articulo_id)
        + (r.sucursal_id ? ' · ' + esc(r.sucursal_id) : '') + '</span>'
        + '<span class="text-stone-500 whitespace-nowrap">' + iconAdj + ' · editar →</span>'
        + '</button>';
    }).join('');
  }
  function poblarFiltroLey() {
    var sel = $$('cump_filtro_ley');
    if (!sel) return;
    var leyes = Array.from(new Set(_cumpRows.map(function (r) { return r.ley_id; }))).sort();
    var prev = sel.value;
    sel.innerHTML = '<option value="">Todas las leyes</option>' + leyes.map(function (l) { return '<option value="' + esc(l) + '">' + esc(l) + '</option>'; }).join('');
    if (prev && leyes.indexOf(prev) >= 0) sel.value = prev;
  }
  function renderCumplimiento() {
    var lista = $$('cump_lista');
    if (!lista) return;
    var fLey = $$('cump_filtro_ley') ? $$('cump_filtro_ley').value : '';
    var fEst = $$('cump_filtro_estado') ? $$('cump_filtro_estado').value : '';
    var fSuc = $$('cump_filtro_sucursal') ? $$('cump_filtro_sucursal').value : '';
    var fTxt = ($$('cump_filtro_texto') ? $$('cump_filtro_texto').value : '').toLowerCase().trim();
    var fKpi = window._cumpKpiFiltro || '';
    var rows = _cumpRows;
    if (fLey) rows = rows.filter(function (r) { return r.ley_id === fLey; });
    if (fEst) rows = rows.filter(function (r) { return r.estado === fEst; });
    if (fSuc === '__transversal__') rows = rows.filter(function (r) { return !r.sucursal_id; });
    else if (fSuc) rows = rows.filter(function (r) { return r.sucursal_id === fSuc; });
    if (fTxt) rows = rows.filter(function (r) { return (String(r.notas || '').toLowerCase().indexOf(fTxt) >= 0) || (String(r.responsable || '').toLowerCase().indexOf(fTxt) >= 0); });
    // KPI drill-down · 09-jun
    if (fKpi === 'ok') {
      rows = rows.filter(function (r) { return r.estado === 'cumplido' && (_archivosCache[r.id] || []).length > 0; });
    } else if (fKpi === 'vencidos') {
      var hoy = new Date(); hoy.setHours(0,0,0,0);
      rows = rows.filter(function (r) { return r.fecha_verificacion && new Date(r.fecha_verificacion) < hoy && r.estado !== 'cumplido'; });
    } else if (fKpi === '7d') {
      var ahora = new Date(), lim = new Date(Date.now() + 7*86400000);
      rows = rows.filter(function (r) { return r.fecha_verificacion && new Date(r.fecha_verificacion) >= ahora && new Date(r.fecha_verificacion) <= lim; });
    } else if (fKpi === 'sinfoto') {
      rows = rows.filter(function (r) { return !((_archivosCache[r.id] || []).length); });
    }
    if ($$('cump_kpi_total')) $$('cump_kpi_total').textContent = _cumpRows.length;
    if ($$('cump_kpi_pendientes')) $$('cump_kpi_pendientes').textContent = _cumpRows.filter(function (r) { return r.estado === 'pendiente'; }).length;
    if ($$('cump_kpi_ok')) $$('cump_kpi_ok').textContent = _cumpRows.filter(function (r) { return r.estado === 'cumplida'; }).length;
    if ($$('cump_kpi_atrasadas')) $$('cump_kpi_atrasadas').textContent = _cumpRows.filter(function (r) { return r.estado === 'atrasada'; }).length;
    if (!rows.length) {
      lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Sin obligaciones con esos filtros.</div>';
      return;
    }
    lista.innerHTML = rows.map(function (r) {
      var fechaVer = r.fecha_verificacion ? new Date(r.fecha_verificacion).toLocaleDateString('es-CL') : '—';
      var evidencia = r.evidencia_url
        ? '<a href="' + esc(r.evidencia_url) + '" target="_blank" rel="noopener" class="text-blue-600 underline text-xs">📄 Ver documento</a>'
        : '<span class="text-xs text-stone-400 italic">sin evidencia</span>';
      var badgeSuc = r.sucursal_id
        ? '<span class="inline-block bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-[10px] uppercase">' + esc(r.sucursal_id) + '</span>'
        : '<span class="inline-block bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px]">transversal</span>';
      var badgeAprob = r.requiere_aprobacion_gerencia
        ? '<span class="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]" title="Requiere aprobacion gerencia antes de marcar cumplida">requiere gerencia</span>'
        : '';
      var tituloAmigable = r.titulo || (esc(r.ley_id) + ' · Art. ' + esc(r.articulo_id));
      return '<div class="bg-white border border-stone-200 rounded p-3" data-id="' + r.id + '">'
        + '<div class="flex items-start justify-between gap-2 flex-wrap">'
        + '<div class="flex-1 min-w-0">'
        + '<div class="font-semibold text-sm text-stone-800">' + esc(tituloAmigable) + '</div>'
        + '<div class="text-[10px] text-stone-400 mt-0.5">' + esc(r.ley_id) + ' · Art. ' + esc(r.articulo_id) + '</div>'
        + '<div class="text-xs text-stone-500 mt-0.5">Responsable: ' + esc(r.responsable || '—') + ' · Verificado: ' + esc(fechaVer) + '</div>'
        + '<div class="flex gap-1 mt-1 flex-wrap">' + badgeSuc + badgeAprob + '</div>'
        + '</div>'
        + '<div class="flex items-center gap-2">' + badgeEstado(r.estado)
        + '<button class="cump-editar px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-xs" data-id="' + r.id + '">✏️ Editar</button>'
        + '</div>'
        + '</div>'
        + '<div class="text-xs text-stone-600 mt-2">' + esc(r.notas || '') + '</div>'
        + '<div class="mt-1">' + evidencia + '</div>'
        + '</div>';
    }).join('');
  }
  function abrirFormEditar(id) {
    var row = _cumpRows.find(function (r) { return String(r.id) === String(id); });
    if (!row) return;
    _currentEditId = row.id;
    $$('cump_form_titulo').textContent = 'Editar ' + row.ley_id + ' Art. ' + row.articulo_id;
    $$('cump_edit_id').value = row.id;
    $$('cump_estado').value = row.estado || 'pendiente';
    $$('cump_responsable').value = row.responsable || '';
    $$('cump_evidencia_url').value = row.evidencia_url || '';
    if ($$('cump_sucursal')) $$('cump_sucursal').value = row.sucursal_id || '';
    if ($$('cump_requiere_aprob')) $$('cump_requiere_aprob').checked = !!row.requiere_aprobacion_gerencia;
    $$('cump_fecha_verificacion').value = row.fecha_verificacion || '';
    $$('cump_notas').value = row.notas || '';
    $$('cump_form').classList.remove('hidden');
    cargarArchivos(row.id);
    $$('cump_form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function cargarArchivos(obligacionId) {
    var cont = $$('cump_archivos_lista');
    if (!cont) return;
    cont.innerHTML = '<div class="text-xs text-stone-400 italic">Cargando...</div>';
    try {
      var resp = await sb.rpc('cump_archivo_listar', { p_obligacion_id: Number(obligacionId) });
      if (resp.error) throw resp.error;
      _archivosCache[obligacionId] = resp.data || [];
      renderArchivos(obligacionId);
    } catch (e) {
      cont.innerHTML = '<div class="text-xs text-red-600">No se pudieron cargar archivos: ' + esc(e.message || e) + '</div>';
    }
  }
  function renderArchivos(obligacionId) {
    var cont = $$('cump_archivos_lista');
    if (!cont) return;
    var arr = _archivosCache[obligacionId] || [];
    if (!arr.length) {
      cont.innerHTML = '<div class="text-xs text-stone-400 italic">Sin archivos cargados todavía.</div>';
      return;
    }
    cont.innerHTML = arr.map(function (a) {
      var fecha = new Date(a.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
      var puedoBorrar = String(a.subido_por || '').toLowerCase() === _sessionEmail;
      return '<div class="bg-stone-50 border border-stone-200 rounded px-2 py-1 flex items-center justify-between gap-2 text-xs" data-archivo-id="' + a.id + '">'
        + '<div class="flex-1 min-w-0 truncate"><span class="font-medium">' + esc(a.filename) + '</span>'
        + ' <span class="text-stone-400">' + humanSize(a.size_bytes) + ' · ' + esc(fecha) + ' · ' + esc(a.subido_por || '') + '</span></div>'
        + '<div class="flex gap-1 whitespace-nowrap">'
        + '<button class="cump-archivo-ver px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded" data-storage-path="' + esc(a.storage_path) + '" data-bucket="' + esc(a.bucket) + '">👁 Ver</button>'
        + (puedoBorrar ? '<button class="cump-archivo-borrar px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded" data-archivo-id="' + a.id + '">🗑</button>' : '')
        + '</div></div>';
    }).join('');
  }
  async function subirArchivos(files, obligacionId) {
    if (!files || !files.length || !obligacionId) return;
    var prog = $$('cump_upload_progress');
    if (prog) { prog.classList.remove('hidden'); prog.textContent = ''; }
    var ok = 0, fail = 0;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.size > 25 * 1024 * 1024) { fail++; if (prog) prog.textContent = '❌ ' + file.name + ' supera 25 MB'; continue; }
      var safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
      var path = 'cumplimiento/' + obligacionId + '/' + Date.now() + '_' + safe;
      if (prog) prog.textContent = '⏳ Subiendo ' + (i+1) + '/' + files.length + ': ' + file.name;
      try {
        var up = await sb.storage.from('impulsa-documentos').upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });
        if (up.error) throw up.error;
        var reg = await sb.rpc('cump_archivo_registrar', {
          p_obligacion_id: Number(obligacionId),
          p_storage_path: path,
          p_filename: file.name,
          p_mime_type: file.type || null,
          p_size_bytes: file.size,
          p_bucket: 'impulsa-documentos'
        });
        if (reg.error) throw reg.error;
        ok++;
      } catch (e) {
        fail++;
        if (prog) prog.textContent = '❌ Falló ' + file.name + ': ' + (e.message || e);
        console.warn('Upload fail', file.name, e);
      }
    }
    if (prog) {
      prog.textContent = '✅ ' + ok + ' archivo(s) cargado(s)' + (fail ? ' · ❌ ' + fail + ' fallaron' : '');
      setTimeout(function () { prog.classList.add('hidden'); }, 4000);
    }
    await cargarArchivos(obligacionId);
    renderMisObligaciones();
    // EAG-08 · refuerzo positivo
    if (ok > 0 && window.showPermisologiaToast) {
      try {
        var rowDone = (_cumpRows || []).find(function (r) { return String(r.id) === String(obligacionId); }) || {};
        var nTotal = (_cumpRows || []).filter(function (r) {
          return _esMia(r);
        }).length;
        var nConArchivos = (_cumpRows || []).filter(function (r) {
          return _esMia(r)
                 && (_archivosCache[r.id] || []).length > 0;
        }).length;
        var faltan = Math.max(0, nTotal - nConArchivos);
        window.showPermisologiaToast(
          'Listo · evidencia subida',
          (rowDone.ley_id ? rowDone.ley_id + ' Art ' + rowDone.articulo_id : 'Archivo') + ' guardado. Quedan ' + faltan + ' permisos sin evidencia.'
        );
      } catch (_) {}
    }
  }
  async function verArchivo(storagePath, bucket) {
    try {
      var s = await sb.storage.from(bucket || 'impulsa-documentos').createSignedUrl(storagePath, 300);
      if (s.error) throw s.error;
      window.open(s.data.signedUrl, '_blank', 'noopener');
    } catch (e) {
      alert('No se pudo abrir: ' + (e.message || e));
    }
  }
  async function borrarArchivo(archivoId) {
    if (!confirm('¿Borrar este archivo? No se puede deshacer.')) return;
    try {
      var arr = (_currentEditId && _archivosCache[_currentEditId]) || [];
      var meta = arr.find(function (a) { return String(a.id) === String(archivoId); });
      var resp = await sb.rpc('cump_archivo_borrar', { p_id: Number(archivoId) });
      if (resp.error) throw resp.error;
      // Borrar también el objeto del bucket (el RPC solo borra la fila)
      if (meta && meta.storage_path && meta.bucket) {
        try { await sb.storage.from(meta.bucket).remove([meta.storage_path]); } catch (_) {}
      }
      if (_currentEditId) await cargarArchivos(_currentEditId);
      renderMisObligaciones();
    } catch (e) {
      alert('No se pudo borrar: ' + (e.message || e));
    }
  }
  function abrirDiegoContexto() {
    if (!_currentEditId) return;
    var row = _cumpRows.find(function (r) { return r.id === _currentEditId; });
    if (!row) return;
    var ctx = 'Estoy en el silo Cumplimiento Legal trabajando sobre ' + row.ley_id + ' Art. ' + row.articulo_id
      + '. Estado actual: ' + (row.estado || 'pendiente')
      + (row.sucursal_id ? ' · Sucursal: ' + row.sucursal_id : '')
      + (row.notas ? ' · Notas: ' + row.notas : '')
      + '. ¿Qué documento o evidencia debería cargar para cumplir con esta obligación?';
    if (typeof window.openDiegoChat === 'function') {
      window.openDiegoChat({ prefill: ctx, modulo: 'cumplimiento_silo_05', obligacion_id: row.id });
    } else if (typeof window.fabDiegoOpen === 'function') {
      window.fabDiegoOpen(ctx);
    } else {
      var pref = encodeURIComponent(ctx);
      window.open('/chat-diego.html?prefill=' + pref, '_blank', 'noopener');
    }
  }
  async function guardarCumplimiento() {
    var id = $$('cump_edit_id').value;
    if (!id) return;
    var patch = {
      estado: $$('cump_estado').value,
      responsable: $$('cump_responsable').value.trim() || null,
      evidencia_url: $$('cump_evidencia_url').value.trim() || null,
      sucursal_id: ($$('cump_sucursal') ? $$('cump_sucursal').value : '') || null,
      requiere_aprobacion_gerencia: !!($$('cump_requiere_aprob') && $$('cump_requiere_aprob').checked),
      fecha_verificacion: $$('cump_fecha_verificacion').value || null,
      notas: $$('cump_notas').value.trim() || null,
      updated_at: new Date().toISOString()
    };
    try {
      var resp = await sb.schema('panel').from('cumplimiento_legal').update(patch).eq('id', id);
      if (resp.error) throw resp.error;
      $$('cump_form').classList.add('hidden');
      loadCumplimiento();
    } catch (e) {
      alert('No se pudo guardar: ' + (e && e.message ? e.message : e));
    }
  }
  function init() {
    document.querySelector('button[data-tab="cumplimiento"]')?.addEventListener('click', function () { setTimeout(loadCumplimiento, 100); });
    document.querySelector('a[data-v4-tab="cumplimiento"]')?.addEventListener('click', function () { setTimeout(loadCumplimiento, 100); });
    $$('cump_refresh')?.addEventListener('click', loadCumplimiento);
    $$('cump_cancelar')?.addEventListener('click', function () { $$('cump_form').classList.add('hidden'); _currentEditId = null; });
    $$('cump_guardar')?.addEventListener('click', guardarCumplimiento);
    $$('cump_filtro_ley')?.addEventListener('change', renderCumplimiento);
    $$('cump_filtro_estado')?.addEventListener('change', renderCumplimiento);
    $$('cump_filtro_sucursal')?.addEventListener('change', renderCumplimiento);
    $$('cump_filtro_texto')?.addEventListener('input', renderCumplimiento);
    $$('cump_lista')?.addEventListener('click', function (e) {
      var btn = e.target.closest('.cump-editar');
      if (btn) abrirFormEditar(btn.dataset.id);
    });
    // Mis obligaciones · click → editar
    $$('cump_mis_lista')?.addEventListener('click', function (e) {
      var btn = e.target.closest('.cump-mis-item');
      if (btn) abrirFormEditar(btn.dataset.id);
    });
    $$('cump_mis_ver_todas')?.addEventListener('click', function () {
      $$('cump_lista')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // Diego contexto
    $$('cump_diego_ctx')?.addEventListener('click', abrirDiegoContexto);

    // GUARDA · todo lo de Permisología MVP se ejecuta UNA sola vez · 08-jun fix freeze
    if (window._permisologiaInited) { console.log('[Permisología] init ya ejecutado · skip'); return; }
    window._permisologiaInited = true;

    // Drill-down KPIs · click en Al día/7d/Vencidos/Falta foto filtra la lista cruda
    window.cumpKpiFiltrar = function (k) {
      if (window._cumpKpiFiltro === k) window._cumpKpiFiltro = '';
      else window._cumpKpiFiltro = k;
      renderCumplimiento();
      var lista = $$('cump_lista');
      if (lista) lista.scrollIntoView({behavior:'smooth', block:'start'});
    };

    // Sub-vistas 09-jun · nada por fuera del panel · default por rol
    function _permisologiaActivarSubvista(k) {
      document.querySelectorAll('.permisologia-subv-btn').forEach(function (x) {
        x.classList.remove('active','bg-emerald-600','text-white','border-emerald-700');
        x.classList.add('bg-white','text-stone-700','border-stone-200');
      });
      var btnActivo = document.querySelector('.permisologia-subv-btn[data-subv="'+k+'"]');
      if (btnActivo) {
        btnActivo.classList.add('active','bg-emerald-600','text-white','border-emerald-700');
        btnActivo.classList.remove('bg-white','text-stone-700','border-stone-200');
      }
      var paneTramites = $$('permisologia_subv_tramites');
      if (paneTramites) paneTramites.style.display = (k === 'tramites') ? '' : 'none';
      ['micola','expedientes','supervision'].forEach(function (kk) {
        var pane = $$('permisologia_subv_' + kk);
        if (!pane) return;
        if (k === kk) {
          pane.classList.remove('hidden');
          var ifr = pane.querySelector('iframe');
          if (ifr && ifr.src === 'about:blank' && ifr.dataset.src) ifr.src = ifr.dataset.src;
        } else {
          pane.classList.add('hidden');
        }
      });
    }
    document.querySelectorAll('.permisologia-subv-btn').forEach(function (b) {
      b.addEventListener('click', function () { _permisologiaActivarSubvista(b.dataset.subv); });
    });
    // Default por rol al cargar el silo Permisología
    var _defaultSubv = 'expedientes';
    try {
      // Fase 4 · gate admin via PERMS.es_admin (canónico); fallback email para asistente@ (Jair)
      var email = String(_sessionEmail || '').toLowerCase();
      if (window.PERMS?.es_admin) {
        _defaultSubv = 'supervision';
      } else if (email === 'asistente@gestionrepchile.cl') {
        _defaultSubv = 'micola';
      }
    } catch (_) {}
    _permisologiaActivarSubvista(_defaultSubv);

    // Helpers · MVP visual 08-jun
    function _permisologiaNombreCorto() {
      var nombre = (window._sessionUserNombre || (_sessionEmail || '').split('@')[0] || '').split(' ')[0];
      return nombre || 'Usuario';
    }
    function _permisologiaSucursalColor(suc) {
      var map = { maipu:'bg-blue-600', cerrillos:'bg-emerald-600', talca:'bg-amber-600', puerto_montt:'bg-indigo-600' };
      return map[String(suc || '').toLowerCase()] || 'bg-stone-500';
    }
    function _permisologiaSucursalLabel(suc) {
      var map = { maipu:'MAIPÚ', cerrillos:'CERRILLOS', talca:'TALCA', puerto_montt:'PTO MONTT' };
      return map[String(suc || '').toLowerCase()] || String(suc || 'TRANSV.').toUpperCase();
    }

    // EAG-01 · Saludo + avatar header + KPIs avanzados + progreso · MVP 08-jun
    function maybeShowWelcome() {
      try {
        if (!_sessionEmail) return;
        // Avatar header (siempre, no dismissible)
        var avEl = $$('permisologia_avatar_nombre');
        if (avEl) avEl.textContent = _permisologiaNombreCorto();

        var mias = (_cumpRows || []).filter(function (r) {
          return _esMia(r)
                 && r.estado !== 'cumplida' && r.estado !== 'no_aplica';
        });

        // KPIs avanzados
        var hoy = new Date();
        var ms7d = 7 * 24 * 3600 * 1000;
        var nVencen7d = 0, nSinFoto = 0;
        mias.forEach(function (r) {
          if (r.fecha_verificacion) {
            var diff = new Date(r.fecha_verificacion).getTime() - hoy.getTime();
            if (diff >= 0 && diff <= ms7d) nVencen7d++;
          }
          if (!(_archivosCache[r.id] || []).length) nSinFoto++;
        });
        if ($$('permisologia_kpi_7d')) $$('permisologia_kpi_7d').textContent = nVencen7d;
        if ($$('permisologia_kpi_sinfoto')) $$('permisologia_kpi_sinfoto').textContent = nSinFoto;

        // Barra progreso
        var total = mias.length + (_cumpRows || []).filter(function (r) {
          return _esMia(r) && r.estado === 'cumplida';
        }).length;
        var hechas = total - mias.length;
        if (total > 0) {
          var pct = Math.round((hechas / total) * 100);
          var box = $$('permisologia_progress');
          if (box) box.classList.remove('hidden');
          if ($$('permisologia_progress_done')) $$('permisologia_progress_done').textContent = hechas;
          if ($$('permisologia_progress_total')) $$('permisologia_progress_total').textContent = total;
          if ($$('permisologia_progress_pct')) $$('permisologia_progress_pct').textContent = pct;
          if ($$('permisologia_progress_eta')) $$('permisologia_progress_eta').textContent = mias.length * 2;
          if ($$('permisologia_progress_bar')) $$('permisologia_progress_bar').style.width = pct + '%';
        }

        // Saludo bienvenida primera vez
        var dismissed = localStorage.getItem('permisologia_welcome_dismissed_' + _sessionEmail);
        if (!dismissed && mias.length) {
          var welcome = $$('permisologia_welcome'); if (welcome) welcome.classList.remove('hidden');
          if ($$('permisologia_welcome_nombre')) $$('permisologia_welcome_nombre').textContent = _permisologiaNombreCorto();
          if ($$('permisologia_welcome_count')) $$('permisologia_welcome_count').textContent = mias.length;
        }
      } catch (_) {}
    }
    $$('permisologia_welcome_close')?.addEventListener('click', function () {
      var box = $$('permisologia_welcome'); if (box) box.classList.add('hidden');
      try { if (_sessionEmail) localStorage.setItem('permisologia_welcome_dismissed_' + _sessionEmail, '1'); } catch (_) {}
    });

    // EAG-02 · TOP 1 card · se llena cuando Jair clickea un permiso de la lista
    function showPermisologiaTop1(rowId) {
      try {
        var row = (_cumpRows || []).find(function (r) { return String(r.id) === String(rowId); });
        if (!row) return;
        localStorage.setItem('permisologia_top1_' + (_sessionEmail || 'anon'), String(rowId));
        var box = $$('permisologia_top1'); if (!box) return;
        var pill = $$('permisologia_top1_pill');
        var titulo = $$('permisologia_top1_titulo');
        var plazo = $$('permisologia_top1_plazo');
        if (pill) {
          pill.textContent = _permisologiaSucursalLabel(row.sucursal_id);
          pill.className = 'px-3 py-1 text-white rounded-full text-[10px] font-bold uppercase tracking-wide ' + _permisologiaSucursalColor(row.sucursal_id);
        }
        if (titulo) titulo.textContent = (row.ley_id || 'Permiso') + ' · Art. ' + (row.articulo_id || '?');
        if (plazo) {
          var p = row.fecha_verificacion
            ? 'Vence ' + new Date(row.fecha_verificacion).toLocaleDateString('es-CL')
            : 'Plazo sin definir aún · Dyana lo está confirmando';
          plazo.textContent = p;
        }
        box.classList.remove('hidden');
        // Botones contextuales
        var btnSubir = $$('permisologia_top1_subir');
        var btnDiego = $$('permisologia_top1_diego');
        if (btnSubir) btnSubir.onclick = function () { abrirFormEditar(rowId); setTimeout(function () { $$('cump_dropzone')?.click(); }, 200); };
        if (btnDiego) btnDiego.onclick = function () { abrirFormEditar(rowId); setTimeout(function () { $$('cump_diego_ctx')?.click(); }, 200); };
      } catch (_) {}
    }
    // Hook click en lista "mis obligaciones" → además de abrir form, marcar como TOP 1
    $$('cump_mis_lista')?.addEventListener('click', function (e) {
      var btn = e.target.closest('.cump-mis-item');
      if (btn) showPermisologiaTop1(btn.dataset.id);
    }, true);

    // Re-render trigger: cuando se cargan obligaciones, intentar mostrar saludo + KPIs + restore TOP 1
    var _origRenderMis = renderMisObligaciones;
    renderMisObligaciones = function () {
      _origRenderMis.apply(this, arguments);
      maybeShowWelcome();
      // Restore TOP 1 anterior si existe
      try {
        var saved = localStorage.getItem('permisologia_top1_' + (_sessionEmail || 'anon'));
        if (saved) showPermisologiaTop1(saved);
      } catch (_) {}
    };

    // EAG-22 · Escalado SIN FILTROS a los 3 (Cesar/Dyana/Dusan) · MVP 08-jun
    $$('cump_escalar_3')?.addEventListener('click', async function () {
      if (!_currentEditId) { alert('Primero elegí un permiso de la lista de arriba.'); return; }
      var row = _cumpRows.find(function (r) { return String(r.id) === String(_currentEditId); }) || {};
      var motivo = prompt('¿Qué necesitás? (1-2 líneas)\nVamos a notificar a Cesar (Soporte), Dyana (Contabilidad) y Dusan (CEO) los 3 al mismo tiempo.');
      if (!motivo) return;
      var mensaje = '[Escalado Permisología · ' + (window._sessionUserNombre || _sessionEmail) + '] '
        + (row.ley_id || '?') + ' Art ' + (row.articulo_id || '?')
        + (row.sucursal_id ? ' · ' + row.sucursal_id : '')
        + ' · Motivo: ' + motivo;
      try {
        var destinos = [
          { email: 'soporte@gestionrepchile.cl', nombre: 'Cesar Mora' },
          { email: 'dpinto@sercotspa.cl', nombre: 'Dyana' },
          { email: 'gerencia@gestionrepchile.cl', nombre: 'Dusan' }
        ];
        var ok = 0;
        for (var i = 0; i < destinos.length; i++) {
          try {
            await sb.schema('panel').from('diego_inbox').insert({
              destinatario_email: destinos[i].email,
              categoria: 'escalado_permisologia',
              titulo: 'Escalado Permisología · obligación #' + _currentEditId,
              mensaje: mensaje,
              origen_email: _sessionEmail || 'panel',
              prioridad: 'alta'
            });
            ok++;
          } catch (e) { console.warn('Escalado fail ' + destinos[i].email, e); }
        }
        if (ok === 3) showPermisologiaToast('Escalado enviado ✓', 'Cesar, Dyana y Dusan reciben el mensaje. Sigue trabajando en otra cosa mientras responden.');
        else alert('Escalado parcial: ' + ok + '/3. Avisá a Dusan por WhatsApp si urge.');
      } catch (e) {
        alert('No pude escalar: ' + (e.message || e));
      }
    });

    // Scroll-to-top al activar pestaña Permisología · 08-jun
    document.querySelector('button[data-tab="cumplimiento"]')?.addEventListener('click', function () {
      setTimeout(function () {
        var section = document.getElementById('tabCumplimiento');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    });

    // Chips COMUNAS · multi-select · 08-jun
    (function setupComunaChips() {
      var cont = document.getElementById('permisologia_comunas_chips');
      if (!cont) return;
      var seleccionadas = new Set(); // vacío = todas
      function paintChips() {
        cont.querySelectorAll('.permisologia-chip').forEach(function (b) {
          var c = b.dataset.comuna || '';
          var sel = (c === '' && seleccionadas.size === 0) || seleccionadas.has(c);
          if (sel) {
            b.className = 'permisologia-chip px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-bold hover:bg-emerald-700 transition';
            if (!b.textContent.startsWith('✓')) b.textContent = '✓ ' + b.textContent.replace(/^✓ /,'');
          } else {
            b.className = 'permisologia-chip px-3 py-1.5 bg-white border-2 border-stone-300 text-stone-700 rounded-full text-xs font-semibold hover:bg-stone-50 transition';
            b.textContent = b.textContent.replace(/^✓ /,'');
          }
        });
        // Aplicar filtro al select existente (compatibilidad con renderCumplimiento)
        var sel = document.getElementById('cump_filtro_sucursal');
        if (sel) {
          if (seleccionadas.size === 0) sel.value = '';
          else if (seleccionadas.size === 1) sel.value = Array.from(seleccionadas)[0];
          else sel.value = ''; // multi-select no soportado por el filtro original · fallback "todas"
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Filtro multi-comuna real
        window._permisologiaComunaSet = seleccionadas;
        if (typeof renderCumplimiento === 'function') renderCumplimiento();
      }
      cont.addEventListener('click', function (e) {
        var btn = e.target.closest('.permisologia-chip');
        if (!btn) return;
        var c = btn.dataset.comuna || '';
        if (c === '') { seleccionadas.clear(); }
        else {
          if (seleccionadas.has(c)) seleccionadas.delete(c);
          else seleccionadas.add(c);
        }
        paintChips();
      });
      paintChips();
    })();

    // Chips TIPO TRÁMITE · filtro frontend provisorio · 08-jun
    (function setupTipoChips() {
      var cont = document.getElementById('permisologia_tipos_chips');
      if (!cont) return;
      var tipoActivo = '';
      function paint() {
        cont.querySelectorAll('.permisologia-tipo-chip').forEach(function (b) {
          var t = b.dataset.tipo || '';
          var sel = (t === tipoActivo);
          if (sel) b.className = 'permisologia-tipo-chip px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-bold';
          else b.className = 'permisologia-tipo-chip px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-full text-xs hover:bg-stone-50';
        });
        window._permisologiaTipoActivo = tipoActivo;
        if (typeof renderCumplimiento === 'function') renderCumplimiento();
      }
      cont.addEventListener('click', function (e) {
        var btn = e.target.closest('.permisologia-tipo-chip');
        if (!btn) return;
        tipoActivo = btn.dataset.tipo || '';
        paint();
      });
      document.getElementById('permisologia_tipo_nuevo')?.addEventListener('click', function () {
        var nuevo = prompt('Nombre del nuevo tipo de trámite (ej: "Permiso Bombero"):');
        if (!nuevo) return;
        var slug = nuevo.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'permisologia-tipo-chip px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-full text-xs';
        btn.dataset.tipo = slug;
        btn.textContent = nuevo;
        cont.insertBefore(btn, document.getElementById('permisologia_tipo_nuevo'));
        alert('Tipo "' + nuevo + '" agregado solo en esta pantalla. Para que se guarde permanente y se auto-asigne a obligaciones, Pablo lo conecta a BD post-freeze 15-jun.');
      });
      paint();
    })();

    // Sidebar contextual: cuando silo Permisología activo, ocultar pestañas no-Trámites · 08-jun · fix v2 [data-v4-tab]
    function permisologiaApplyContextualSidebar() {
      try {
        var sel = document.getElementById('siloSelector');
        var siloValue = sel ? sel.value : '';
        var enPermisologia = (siloValue === '05');
        var keep = ['cumplimiento', 'portada', 'admin', 'manual', 'inicio'];

        // 1. Sidebar lateral v4 (los `<a data-v4-tab>` agrupados en <details>)
        document.querySelectorAll('a[data-v4-tab]').forEach(function (a) {
          var tab = a.dataset.v4Tab;
          if (enPermisologia && keep.indexOf(tab) === -1) a.classList.add('permisologia-tab-oculto');
          else a.classList.remove('permisologia-tab-oculto');
        });

        // 2. Header tabs antiguos (por compat)
        document.querySelectorAll('button[data-tab]').forEach(function (b) {
          var tab = b.dataset.tab;
          if (enPermisologia && keep.indexOf(tab) === -1) b.classList.add('permisologia-tab-oculto');
          else b.classList.remove('permisologia-tab-oculto');
        });

        // 3. Categorías <details> en sidebar v4 · si la categoría no contiene ningún tab visible, ocultarla
        document.querySelectorAll('details.v4-cat').forEach(function (det) {
          if (!enPermisologia) {
            det.classList.remove('permisologia-tab-oculto');
            return;
          }
          var visibles = det.querySelectorAll('a[data-v4-tab]:not(.permisologia-tab-oculto)');
          if (visibles.length === 0) det.classList.add('permisologia-tab-oculto');
          else det.classList.remove('permisologia-tab-oculto');
        });
      } catch (_) {}
    }
    // Inyectar CSS para que !important triunfe sobre cualquier reaparición de applySiloTabs
    (function injectContextualCSS() {
      if (document.getElementById('permisologia_contextual_css')) return;
      var st = document.createElement('style');
      st.id = 'permisologia_contextual_css';
      st.textContent = '.permisologia-tab-oculto { display: none !important; }';
      document.head.appendChild(st);
    })();
    document.getElementById('siloSelector')?.addEventListener('change', function () {
      setTimeout(permisologiaApplyContextualSidebar, 50);
      setTimeout(permisologiaApplyContextualSidebar, 300);
    });
    // Re-aplicar después de cualquier click en sidebar (applySiloTabs interno revierte la visibility)
    document.querySelectorAll('button[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { setTimeout(permisologiaApplyContextualSidebar, 30); });
    });
    // MutationObserver REMOVIDO 08-jun 15:00 · causaba loop infinito (page freeze)
    // En su lugar: re-aplicar solo en eventos discretos (click tab + cambio silo + carga inicial)
    // Carga inicial
    setTimeout(permisologiaApplyContextualSidebar, 1500);
    setTimeout(permisologiaApplyContextualSidebar, 3500);

    // Hook al filtro real: filtrar por multi-comuna y por tipo_tramite (BD viva)
    var _origRenderCumplimiento = renderCumplimiento;
    var TIPOS_TRAMITE_NOMBRES = {
      calificacion_tecnica: 'Calificación Técnica',
      patente_provisoria: 'Patente Provisoria',
      patente_definitiva: 'Patente Definitiva',
      resolucion_sanitaria: 'Resolución Sanitaria',
      resolucion_transporte_rnp: 'Resolución Transporte RNP'
    };
    renderCumplimiento = function () {
      _origRenderCumplimiento.apply(this, arguments);
      try {
        var comunaSet = window._permisologiaComunaSet;
        var tipo = window._permisologiaTipoActivo;
        var lista = document.getElementById('cump_lista');
        if (!lista) return;
        // Selector real: cada item de la lista tiene data-id (línea 15202 del HTML original)
        var items = lista.querySelectorAll('div[data-id]');
        items.forEach(function (it) {
          var row = (_cumpRows || []).find(function (r) { return String(r.id) === String(it.dataset.id); });
          if (!row) return;
          // Inyectar badge tipo si falta
          if (row.tipo_tramite && !it.querySelector('.permisologia-tipo-badge')) {
            var badge = document.createElement('span');
            badge.className = 'permisologia-tipo-badge inline-block ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold';
            badge.textContent = '📑 ' + (TIPOS_TRAMITE_NOMBRES[row.tipo_tramite] || row.tipo_tramite);
            var hdr = it.querySelector('.font-semibold, h3, h4, strong, .text-sm') || it;
            hdr.appendChild(badge);
          }
          // Filtros
          var matchComuna = !comunaSet || comunaSet.size === 0 || comunaSet.has(String(row.sucursal_id || ''));
          var matchTipo = !tipo || (row.tipo_tramite === tipo);
          if (!(matchComuna && matchTipo)) it.style.display = 'none';
          else it.style.display = '';
        });
      } catch (_) {}
    };

    // Modal flotante guía · drag + maximize + open/close · 08-jun
    (function setupGuiaModal() {
      var modal = $$('permisologia_guia_modal');
      var btn = $$('permisologia_guia_btn');
      var hdr = $$('permisologia_guia_header');
      var btnClose = $$('permisologia_guia_close');
      var btnMax = $$('permisologia_guia_max');
      if (!modal || !btn) return;
      var maximized = false, savedRect = null;
      btn.addEventListener('click', function () { modal.classList.remove('hidden'); });
      btnClose?.addEventListener('click', function () { modal.classList.add('hidden'); });
      btnMax?.addEventListener('click', function () {
        if (!maximized) {
          savedRect = { t: modal.style.top, l: modal.style.left, w: modal.style.width, h: modal.style.height };
          Object.assign(modal.style, { top:'10px', left:'10px', width:'calc(100vw - 20px)', height:'calc(100vh - 20px)' });
          maximized = true;
        } else if (savedRect) {
          Object.assign(modal.style, { top: savedRect.t, left: savedRect.l, width: savedRect.w, height: savedRect.h });
          maximized = false;
        }
      });
      // Drag por header
      var dragging = false, offX = 0, offY = 0;
      hdr?.addEventListener('mousedown', function (e) {
        if (maximized) return;
        dragging = true;
        var rect = modal.getBoundingClientRect();
        offX = e.clientX - rect.left;
        offY = e.clientY - rect.top;
        e.preventDefault();
      });
      document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        var x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - offX));
        var y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - offY));
        modal.style.left = x + 'px';
        modal.style.top = y + 'px';
      });
      document.addEventListener('mouseup', function () { dragging = false; });
    })();

    // EAG-08 · Toast refuerzo positivo · MVP 08-jun
    window.showPermisologiaToast = function (title, msg) {
      var t = $$('permisologia_toast'); if (!t) return;
      var ttl = $$('permisologia_toast_title'); var ms = $$('permisologia_toast_msg');
      if (ttl) ttl.textContent = title || 'Listo';
      if (ms) ms.textContent = msg || '';
      t.classList.remove('hidden');
      clearTimeout(window._permisologiaToastTimer);
      window._permisologiaToastTimer = setTimeout(function () { t.classList.add('hidden'); }, 6000);
    };
    $$('permisologia_toast_close')?.addEventListener('click', function () {
      $$('permisologia_toast')?.classList.add('hidden');
    });
    // Drag & drop + file picker
    var dz = $$('cump_dropzone');
    var picker = $$('cump_file_picker');
    if (dz && picker) {
      dz.addEventListener('click', function () { picker.click(); });
      picker.addEventListener('change', function (e) {
        if (_currentEditId && e.target.files && e.target.files.length) {
          subirArchivos(e.target.files, _currentEditId);
          picker.value = '';
        }
      });
      ['dragenter','dragover'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); dz.classList.add('border-emerald-500','bg-emerald-50'); });
      });
      ['dragleave','drop'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); dz.classList.remove('border-emerald-500','bg-emerald-50'); });
      });
      dz.addEventListener('drop', function (e) {
        var files = e.dataTransfer && e.dataTransfer.files;
        if (_currentEditId && files && files.length) subirArchivos(files, _currentEditId);
      });
    }
    // Lista archivos · ver / borrar
    $$('cump_archivos_lista')?.addEventListener('click', function (e) {
      var vb = e.target.closest('.cump-archivo-ver');
      var db = e.target.closest('.cump-archivo-borrar');
      if (vb) verArchivo(vb.dataset.storagePath, vb.dataset.bucket);
      else if (db) borrarArchivo(db.dataset.archivoId);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
