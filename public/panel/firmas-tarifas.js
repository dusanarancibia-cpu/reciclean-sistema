// ============================================================
// FIRMAS + TARIFAS — extraído de panel-rdo.html (antifragilidad panel,
// bloque 11 PR 2 de 2)
//
// Dominio propio, ya libre de Mesa de Control 99-99 (extraído en PR 1
// como public/panel/mesa-control-99-99.js — dominio distinto que
// compartía esta misma IIFE por accidente de historial de archivo).
//
// Agrupa 3 tabs (autoría PC2 Pablo, R-AUD-084 anti-fabricación):
//   - Firmas Pendientes (tabFirmasPend): solicitud + revisión de firmas
//     con archivo o link adjunto.
//   - Firmas Reglas (tabFirmasReglas, "ALT3"): consume EF firmas-pendientes
//     + RPC firmar_item_pendiente, con badge de conteo para admins.
//   - Tarifas Externas (tabTarifasExt): CRUD de tarifas de proveedores.
//
// Helpers propios de este dominio (verificado: cero uso por Mesa V3/
// Calibrador/Mesa9999 — se quedaron con el dominio correcto en este PR):
//   ready, resolveEmail, esc, fmtFecha, fmtCLP, showError, isAdmin,
//   fmtKB (tamaño de archivo adjunto).
//
// Storage: bucket 'firmas-documentos' — usado por descargarArchivoFirma()
// y subirArchivoFirma() (Firmas Pendientes). Bucket propio, sin cruce con
// 'impulsa-documentos' (Cumplimiento) ni otros buckets del panel.
//
// RPCs / Edge Function que usa:
//   - sb.rpc: firma_solicitar, firma_editar_solicitud, firma_actualizar,
//     firma_listar, tarifa_crear, tarifa_actualizar, tarifa_listar,
//     firmar_item_pendiente.
//   - fetch directo: EF firmas-pendientes (con Bearer token de sesión).
//
// Timers propios:
//   - setInterval 30s (setupFirmasReglasAutoRefresh, self-registrada vía
//     DOMContentLoaded, independiente del init() de abajo): refresca
//     Firmas Reglas si el tab está visible.
//   - setTimeout inicial 1.5s si window.PERMS?.es_admin (badge silencioso).
//   - Debounce 300ms en window.__teFiltroTimer (filtro de texto de
//     Tarifas Externas, dentro de init()).
//
// Listener delegado (dentro de init(), único de este dominio — cero clase
// de Mesa de Control pasa por acá): document.addEventListener('click', ...)
// rutea .fp-firmar/.fp-revisar/.fp-rechazar/.fp-editar/.fp-descargar
// (Firmas Pendientes) y .te-edit (Tarifas Externas).
//
// init() queda limpio y autosuficiente: bind() de firmas_pend/
// firmas_reglas/tarifas_ext + 2 form handlers (Firma, Tarifa) + el
// listener delegado. Las 2 líneas bind('mesa_control_99_99', ...) que
// vivían acá se relocaron a mesa-control-99-99.js en el PR 1 (comentario
// de referencia dejado en su lugar original).
//
// Reads estándar a globals: window.currentUser, window.PERMS?.es_admin
// (gate admin, núcleo de auth, no tocado), window.sb.
//
// Sin IIFE-splitting: se preserva la IIFE completa tal cual.
//
// Fuera de alcance (no tocado): Mesa V3 Pulso, Calibrador de Margen,
// Mesa Control 99-99 (ya extraídos en PR 1), Diego LLM, Precios, el
// núcleo, Cumplimiento, Cartero.
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
  function showError(el, msg) { el.innerHTML = '<div class="text-xs text-red-700 italic py-2 text-center bg-red-50 border border-red-200 rounded p-2">' + esc(msg) + '</div>'; }
  function isAdmin(email) { return ['dusan.arancibia@gmail.com','gerencia@gestionrepchile.cl','sistemas@gestionrepchile.cl','recepcion01@gestionrepchile.cl','soporte@gestionrepchile.cl'].includes(email); }

  // ===== FIRMAS PENDIENTES =====
  var fpColor = { pendiente: 'bg-amber-100 text-amber-800', en_revision: 'bg-blue-100 text-blue-800', firmado: 'bg-emerald-100 text-emerald-800', rechazado: 'bg-red-100 text-red-800' };
  var _firmasRows = [];
  function fmtKB(b) { if (b == null) return ''; if (b < 1024) return b + ' B'; if (b < 1048576) return Math.round(b/1024) + ' KB'; return (b/1048576).toFixed(1) + ' MB'; }

  async function descargarArchivoFirma(bucketPath, fallbackName) {
    if (!bucketPath) return;
    try {
      var r = await sb.storage.from('firmas-documentos').createSignedUrl(bucketPath, 600);
      if (r.error) throw r.error;
      var a = document.createElement('a');
      a.href = r.data.signedUrl;
      a.download = fallbackName || 'archivo';
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) { alert('No se pudo descargar: ' + (e?.message || e)); }
  }

  // Mesa V3 Pulso + Calibrador de Margen + Mesa Control 99-99 — extraída a
  // ./panel/mesa-control-99-99.js (antifragilidad panel, bloque 11 PR 1).
  // Dominio propio (D-PLAN-99-99-001), sin dependencia de los helpers de
  // Firmas/Tarifas de abajo. Ver header del modulo para detalle completo.

  // ============================================================
  // ALT3 Firmas reglas (R-AUD-084 anti-fabricación · 15-jun PC2)
  // Consume EF firmas-pendientes + RPC firmar_item_pendiente
  // ============================================================
  var __firmasReglasTimer = null;
  async function loadFirmasReglas() {
    var lista = document.getElementById('firmasReglasLista');
    var sync = document.getElementById('firmasReglasUltimaSync');
    var badge = document.getElementById('firmasReglasBadge');
    if (!lista) return;
    try {
      var token = (typeof currentUser !== 'undefined' && currentUser && (currentUser.access_token || currentUser.token))
                  || (sb && sb.auth && sb.auth.getSession ? (await sb.auth.getSession()).data.session?.access_token : null);
      if (!token) { lista.innerHTML = '<div class="text-center text-amber-700 text-sm py-8">Sin sesión activa · iniciá sesión para ver firmas pendientes.</div>'; return; }
      var SUPA = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : (typeof SUPABASE_URL_LOCAL !== 'undefined' ? SUPABASE_URL_LOCAL : 'https://eknmtsrtfkzroxnovfqn.supabase.co');
      var r = await fetch(SUPA + '/functions/v1/firmas-pendientes', { headers: { Authorization: 'Bearer ' + token } });
      var j = await r.json();
      if (!r.ok || !j || j.ok === false) { lista.innerHTML = '<div class="text-center text-red-600 text-sm py-6">No pude cargar (' + (j && j.error || r.status) + ')</div>'; return; }
      var items = j.items || [];
      if (badge) {
        if (items.length > 0) { badge.textContent = String(items.length); badge.classList.remove('hidden'); }
        else { badge.classList.add('hidden'); }
      }
      if (sync) sync.textContent = 'Última sync: ' + new Date().toLocaleTimeString('es-CL');
      if (items.length === 0) {
        lista.innerHTML = '<div class="text-center text-emerald-700 text-sm py-8">✓ Sin firmas pendientes</div>';
        return;
      }
      lista.innerHTML = items.map(function(it) {
        var pc = String(it.pc_solicitante || '').replace(/[^A-Za-z0-9_]/g, '');
        var expira = it.expira_at ? new Date(it.expira_at).toLocaleDateString('es-CL') : '—';
        var ctx = it.contexto || {};
        var ctxStr = (ctx.spec ? ('SPEC: ' + ctx.spec) : '') + (ctx.estimacion_h ? (' · ' + ctx.estimacion_h + 'h') : '');
        var texto = String(it.texto_propuesto || '');
        var textoEsc = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var titEsc = String(it.titulo || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<div class="bg-white border border-amber-300 rounded p-3" data-fr-id="' + it.id + '">'
          + '<div class="flex items-start justify-between gap-2">'
          + '<div class="flex-1 min-w-0">'
          + '<div class="text-xs text-amber-700 font-mono">#' + it.id + ' · ' + pc + ' · expira ' + expira + '</div>'
          + '<div class="font-semibold text-stone-800 text-sm mt-1">' + titEsc + '</div>'
          + (ctxStr ? '<div class="text-[11px] text-stone-500 mt-1">' + ctxStr.replace(/</g, '&lt;') + '</div>' : '')
          + '<div class="mt-2 p-2 bg-stone-50 border border-stone-200 rounded text-[12px] font-mono text-stone-700 max-h-32 overflow-y-auto whitespace-pre-wrap">' + textoEsc + '</div>'
          + '</div>'
          + '<div class="flex flex-col gap-1 shrink-0">'
          + '<button class="px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700" data-fr-action="aprobar" data-fr-id="' + it.id + '">✓ Aprobar 1-click</button>'
          + '<button class="px-2 py-1 bg-stone-200 text-stone-700 rounded text-xs hover:bg-stone-300" data-fr-action="rechazar" data-fr-id="' + it.id + '">✗ Rechazar</button>'
          + '</div>'
          + '</div>'
          + '</div>';
      }).join('');
      // Bind acciones
      lista.querySelectorAll('button[data-fr-action]').forEach(function(b) {
        b.addEventListener('click', function() {
          var id = parseInt(b.getAttribute('data-fr-id'), 10);
          var accion = b.getAttribute('data-fr-action');
          var card = b.closest('[data-fr-id]');
          var textoEl = card ? card.querySelector('.font-mono.text-stone-700') : null;
          var texto = textoEl ? textoEl.textContent : '';
          firmarItemReglas(id, accion, texto);
        });
      });
    } catch (e) {
      lista.innerHTML = '<div class="text-center text-red-600 text-sm py-6">Error: ' + (e?.message || e) + '</div>';
    }
  }

  async function firmarItemReglas(id, accion, textoLiteral) {
    try {
      if (accion === 'aprobar') {
        var ok = confirm('Vas a firmar:\n\n' + textoLiteral.slice(0, 500) + (textoLiteral.length > 500 ? '…' : '') + '\n\nEsto registra el texto literal con SHA256 en panel.firmas_textuales_dusan. ¿Confirmás?');
        if (!ok) return;
      } else {
        var motivo = prompt('Motivo de rechazo (opcional · queda registrado):', '');
      }
      var token = (typeof currentUser !== 'undefined' && currentUser && (currentUser.access_token || currentUser.token))
                  || (sb && sb.auth && sb.auth.getSession ? (await sb.auth.getSession()).data.session?.access_token : null);
      var SUPA = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : (typeof SUPABASE_URL_LOCAL !== 'undefined' ? SUPABASE_URL_LOCAL : 'https://eknmtsrtfkzroxnovfqn.supabase.co');
      var body = (accion === 'aprobar')
        ? { id: id, texto_literal: textoLiteral, aceptar: true }
        : { id: id, aceptar: false, motivo_rechazo: motivo || 'sin motivo' };
      var r = await fetch(SUPA + '/functions/v1/firmas-pendientes', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var j = await r.json();
      if (!r.ok || j.ok === false) { alert('No pude registrar: ' + (j.error || r.status)); return; }
      // Refresh inmediato
      loadFirmasReglas();
    } catch (e) {
      alert('Error: ' + (e?.message || e));
    }
  }

  // Auto-refresh 30s solo cuando el tab está activo
  function setupFirmasReglasAutoRefresh() {
    var btn = document.getElementById('firmasReglasRefresh');
    if (btn) btn.addEventListener('click', loadFirmasReglas);
    setInterval(function() {
      var sec = document.getElementById('tabFirmasReglas');
      if (sec && !sec.classList.contains('hidden')) loadFirmasReglas();
    }, 30000);
    // Badge load inicial (silencioso) si el usuario es admin (canónico via RPC)
    if (window.PERMS?.es_admin) {
      setTimeout(loadFirmasReglas, 1500);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFirmasReglasAutoRefresh);
  } else {
    setupFirmasReglasAutoRefresh();
  }

  async function loadFirmas() {
    var lista = document.getElementById('firmaLista');
    if (!ready()) { showError(lista, 'Sesión no detectada.'); return; }
    var email = resolveEmail();
    if (!email) { showError(lista, 'No detecto tu sesión.'); return; }
    try {
      var resp = await sb.rpc('firma_listar', { p_email: email, p_solo_pendientes: false });
      if (resp.error) throw resp.error;
      var rows = resp.data || [];
      _firmasRows = rows;
      if (!rows.length) { lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Sin firmas pendientes.</div>'; return; }
      var admin = isAdmin(email);
      lista.innerHTML = rows.map(function (r) {
        var puedeActuar = (r.destinatario_email === email || admin) && r.estado === 'pendiente';
        var puedeEditar = (r.solicitante_email === email || admin) && r.estado !== 'firmado';
        var linkOriginal = '';
        if (r.archivo_path) {
          linkOriginal = '<button class="fp-descargar text-blue-600 underline text-xs" data-path="' + esc(r.archivo_path) + '" data-name="' + esc(r.archivo_nombre || 'documento') + '">📄 Descargar original (' + esc(r.archivo_nombre || 'archivo') + (r.archivo_size ? ' · ' + fmtKB(r.archivo_size) : '') + ')</button>';
        } else if (r.documento_link) {
          linkOriginal = '<a href="' + esc(r.documento_link) + '" target="_blank" class="text-blue-600 underline text-xs">📄 Abrir documento original (link externo)</a>';
        }
        var linkFirmado = '';
        if (r.firmado_archivo_path) {
          linkFirmado = '<button class="fp-descargar text-emerald-700 underline font-semibold text-xs" data-path="' + esc(r.firmado_archivo_path) + '" data-name="' + esc(r.firmado_archivo_nombre || 'firmado') + '">✅ Descargar firmado (' + esc(r.firmado_archivo_nombre || 'archivo') + ')</button>';
        } else if (r.link_firmado) {
          linkFirmado = '<a href="' + esc(r.link_firmado) + '" target="_blank" class="text-emerald-700 underline font-semibold text-xs">✅ Abrir documento firmado (link externo)</a>';
        }
        // Wave 4 PR-J · seccion Analisis legal IA si esta disponible
        var analisisLegal = '';
        if (r.analisis_legal) {
          var a = r.analisis_legal;
          var rg = String(a.nivel_riesgo || '').toUpperCase();
          var rgCls = rg === 'ALTO' ? 'bg-red-100 text-red-800 border-red-300'
                    : rg === 'MEDIO' ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : rg === 'BAJO' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-stone-100 text-stone-700 border-stone-300';
          var lista = function (arr) { return Array.isArray(arr) && arr.length ? '<ul class="list-disc pl-4 text-xs space-y-0.5">' + arr.map(function (x) { return '<li>' + esc(String(x)) + '</li>'; }).join('') + '</ul>' : '<span class="text-stone-400 italic">—</span>'; };
          analisisLegal = '<details class="mt-2 border rounded p-2 ' + rgCls + '">' +
            '<summary class="text-xs font-semibold cursor-pointer">🤖 Análisis legal IA · riesgo ' + esc(rg || 'NO_DETERMINABLE') + ' · ' + esc(String(a.recomendacion || '').slice(0, 60)) + '</summary>' +
            '<div class="text-xs mt-2 space-y-2">' +
              '<div><strong>Resumen:</strong> ' + esc(a.resumen || '—') + '</div>' +
              (a.tipo_documento ? '<div><strong>Tipo:</strong> ' + esc(a.tipo_documento) + (a.contraparte ? ' · ' + esc(a.contraparte) : '') + '</div>' : '') +
              (a.vencimiento ? '<div><strong>Vence:</strong> ' + esc(a.vencimiento) + '</div>' : '') +
              '<div><strong>Compromisos:</strong> ' + lista(a.compromisos) + '</div>' +
              '<div><strong>Plazos:</strong> ' + lista(a.plazos) + '</div>' +
              '<div><strong>Penalidades:</strong> ' + lista(a.penalidades) + '</div>' +
              '<div><strong>⚠ Riesgos:</strong> ' + lista(a.riesgos_detectados) + '</div>' +
              '<div class="font-semibold mt-1">Recomendación: ' + esc(a.recomendacion || '—') + '</div>' +
              (r.analizado_en ? '<div class="text-[10px] text-stone-500">analizado ' + fmtFecha(r.analizado_en) + '</div>' : '') +
            '</div>' +
          '</details>';
        } else if (r.archivo_path) {
          analisisLegal = '<div class="mt-2 text-xs text-stone-400 italic">🤖 Análisis legal IA pendiente · se genera automático al subir archivo.</div>';
        }

        return '<div class="bg-white border border-stone-200 rounded p-3">' +
          '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
            '<span class="font-semibold text-sm">📝 ' + esc(r.documento_titulo) + '</span>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (fpColor[r.estado] || 'bg-stone-100 text-stone-700') + '">' + esc(r.estado.replace(/_/g,' ')) + '</span>' +
          '</div>' +
          '<div class="text-xs text-stone-600">' + esc(r.solicitante_email) + ' → ' + esc(r.destinatario_email) + ' · ' + esc(r.tipo.replace(/_/g,' ')) + '</div>' +
          (linkOriginal ? '<div class="text-xs mt-1">' + linkOriginal + '</div>' : '') +
          (linkFirmado ? '<div class="text-xs mt-1">' + linkFirmado + '</div>' : '') +
          (r.notas ? '<div class="text-xs text-stone-700 italic mt-1">"' + esc(r.notas) + '"</div>' : '') +
          (r.comentarios_firmante ? '<div class="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">💬 ' + esc(r.comentarios_firmante) + '</div>' : '') +
          analisisLegal +
          '<div class="text-[10px] text-stone-400 mt-1">solicitado ' + fmtFecha(r.created_at) + (r.firmado_en ? ' · firmado ' + fmtFecha(r.firmado_en) : '') + '</div>' +
          '<div class="mt-2 flex gap-1 flex-wrap">' +
            (puedeEditar ? '<button class="fp-editar text-[10px] px-2 py-0.5 bg-stone-200 text-stone-700 rounded" data-id="' + esc(r.id) + '">✏ Editar</button>' : '') +
            (puedeActuar ? '<button class="fp-firmar text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded" data-id="' + esc(r.id) + '">✓ Marcar firmado</button>' +
                           '<button class="fp-revisar text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded" data-id="' + esc(r.id) + '">📋 En revisión</button>' +
                           '<button class="fp-rechazar text-[10px] px-2 py-0.5 bg-red-600 text-white rounded" data-id="' + esc(r.id) + '">✕ Rechazar</button>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      console.error('[firmas] error:', e);
      showError(lista, 'Error: ' + (e?.message || e));
    }
  }

  function abrirEditFirma(id) {
    var r = _firmasRows.find(function (x) { return x.id === id; });
    if (!r) return;
    document.getElementById('fp_edit_id').value = id;
    document.getElementById('fp_titulo').value = r.documento_titulo || '';
    document.getElementById('fp_link').value = r.documento_link || '';
    document.getElementById('fp_tipo').value = r.tipo || 'firma_digital';
    document.getElementById('fp_destinatario').value = r.destinatario_email || '';
    document.getElementById('fp_notas').value = r.notas || '';
    document.getElementById('fp_archivo').value = '';
    var act = document.getElementById('fp_archivo_actual');
    if (r.archivo_path) {
      act.textContent = '📎 Archivo actual: ' + (r.archivo_nombre || 'archivo') + (r.archivo_size ? ' (' + fmtKB(r.archivo_size) + ')' : '') + ' · subí uno nuevo para reemplazar';
      act.classList.remove('hidden');
    } else { act.classList.add('hidden'); }
    document.getElementById('fp_enviar').textContent = 'Guardar cambios';
    document.getElementById('firmaForm').classList.remove('hidden');
    document.getElementById('firmaForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function resetFirmaForm() {
    ['fp_titulo','fp_link','fp_notas','fp_archivo','fp_edit_id'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('fp_archivo_actual')?.classList.add('hidden');
    document.getElementById('fp_destinatario').value = 'dusan.arancibia@gmail.com';
    document.getElementById('fp_tipo').value = 'firma_digital';
    document.getElementById('fp_enviar').textContent = 'Solicitar firma';
  }

  async function subirArchivoFirma(file) {
    var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    var path = 'firmas/' + Date.now() + '_' + safeName;
    var up = await sb.storage.from('firmas-documentos').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
    if (up.error) throw up.error;
    return { path: path, nombre: file.name, mime: file.type || null, size: file.size };
  }

  async function actualizarFirma(id, estado) {
    var email = resolveEmail();
    var linkFirmado = null;
    var coment = null;
    if (estado === 'firmado') {
      var modo = confirm('¿Marcar firmado con LINK externo? (Cancelar = lo seguís editando luego con archivo)');
      if (modo) {
        linkFirmado = prompt('Link al documento FIRMADO:', '');
        if (linkFirmado === null) return;
        if (!linkFirmado.trim()) { alert('Link requerido.'); return; }
      }
    } else if (estado === 'rechazado') {
      coment = prompt('Razón del rechazo:', '');
      if (coment === null) return;
    } else if (estado === 'en_revision') {
      coment = prompt('Notas / qué falta para firmar (opcional):', '');
      if (coment === null) return;
    }
    try {
      var resp = await sb.rpc('firma_actualizar', { p_id: id, p_firmante_email: email, p_nuevo_estado: estado, p_link_firmado: linkFirmado, p_comentarios: coment || null, p_firmado_archivo_path: null, p_firmado_archivo_nombre: null });
      if (resp.error) throw resp.error;
      loadFirmas();
    } catch (e) { alert('Error: ' + (e?.message || e)); }
  }

  // ===== TARIFAS EXTERNAS =====
  var _tarifasFiltro = '';
  async function loadTarifas() {
    var lista = document.getElementById('tarifaLista');
    if (!ready()) { showError(lista, 'Sesión no detectada.'); return; }
    var email = resolveEmail();
    try {
      var resp = await sb.rpc('tarifa_listar', { p_solo_activas: true, p_filtro_servicio: _tarifasFiltro || null });
      if (resp.error) throw resp.error;
      var rows = resp.data || [];
      if (!rows.length) { lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Sin tarifas cargadas.</div>'; return; }
      var admin = isAdmin(email);
      lista.innerHTML = rows.map(function (r) {
        return '<div class="bg-white border border-stone-200 rounded p-3">' +
          '<div class="flex items-center justify-between gap-2 mb-1 flex-wrap">' +
            '<span class="font-semibold text-sm">💰 ' + esc(r.servicio) + '</span>' +
            '<span class="text-sm font-bold text-emerald-700">' + fmtCLP(r.precio_clp) + (r.unidad && r.unidad !== 'unidad' ? ' / ' + esc(r.unidad.replace(/_/g,' ')) : '') + '</span>' +
          '</div>' +
          (r.proveedor ? '<div class="text-xs text-stone-600">proveedor: ' + esc(r.proveedor) + '</div>' : '') +
          (r.vigencia_desde || r.vigencia_hasta ? '<div class="text-xs text-stone-500">vigencia: ' + (r.vigencia_desde || '—') + ' a ' + (r.vigencia_hasta || '—') + '</div>' : '') +
          (r.notas ? '<div class="text-xs text-stone-700 italic mt-1">"' + esc(r.notas) + '"</div>' : '') +
          '<div class="text-[10px] text-stone-400 mt-1">actualizado ' + fmtFecha(r.ultima_actualizacion) + ' · ' + esc(r.actualizado_por) + '</div>' +
          (admin ? '<div class="mt-2"><button class="te-edit text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded" data-id="' + esc(r.id) + '" data-precio="' + esc(r.precio_clp ?? '') + '">✏ Actualizar precio</button></div>' : '') +
        '</div>';
      }).join('');
    } catch (e) {
      console.error('[tarifas] error:', e);
      showError(lista, 'Error: ' + (e?.message || e));
    }
  }
  async function editarTarifa(id, precioActual) {
    var nuevoPrecio = prompt('Nuevo precio CLP (deja vacío para no cambiar):', precioActual || '');
    if (nuevoPrecio === null) return;
    var notas = prompt('Notas / razón del cambio (opcional):', '');
    var email = resolveEmail();
    try {
      var resp = await sb.rpc('tarifa_actualizar', {
        p_id: id,
        p_actualizado_por: email,
        p_precio_clp: nuevoPrecio.trim() ? parseFloat(nuevoPrecio) : null,
        p_notas: notas || null,
        p_activo: null, p_vigencia_hasta: null
      });
      if (resp.error) throw resp.error;
      loadTarifas();
    } catch (e) { alert('Error: ' + (e?.message || e)); }
  }

  // ===== INIT =====
  function init() {
    var bind = function (tab, loader) {
      document.querySelector('button[data-tab="' + tab + '"]')?.addEventListener('click', function () { setTimeout(loader, 100); });
      document.querySelector('a[data-v4-tab="' + tab + '"]')?.addEventListener('click', function () { setTimeout(loader, 100); });
    };
    bind('firmas_pend', loadFirmas);
    bind('firmas_reglas', loadFirmasReglas);
    // bind('mesa_control_99_99', ...) x2 relocadas a
    // ./panel/mesa-control-99-99.js (antifragilidad panel, bloque 11 PR 1).
    bind('tarifas_ext', loadTarifas);

    // Form Firma
    document.getElementById('firmaNuevaBtn')?.addEventListener('click', function () {
      resetFirmaForm();
      document.getElementById('firmaForm').classList.toggle('hidden');
    });
    document.getElementById('fp_cancelar')?.addEventListener('click', function () {
      resetFirmaForm();
      document.getElementById('firmaForm').classList.add('hidden');
    });
    document.getElementById('fp_enviar')?.addEventListener('click', async function () {
      var editId = document.getElementById('fp_edit_id').value;
      var titulo = document.getElementById('fp_titulo').value.trim();
      var link = document.getElementById('fp_link').value.trim();
      var fileInput = document.getElementById('fp_archivo');
      var file = fileInput.files && fileInput.files[0];
      if (!titulo) { alert('Título requerido.'); return; }
      if (!editId && !link && !file) { alert('Subí un archivo o pegá un link.'); return; }
      var email = resolveEmail();
      if (!email) { alert('No detecto sesión'); return; }
      var btn = this;
      btn.disabled = true;
      var orig = btn.textContent;
      try {
        var archivoData = null;
        if (file) { btn.textContent = 'Subiendo archivo…'; archivoData = await subirArchivoFirma(file); }
        if (editId) {
          btn.textContent = 'Guardando cambios…';
          var resp = await sb.rpc('firma_editar_solicitud', {
            p_email: email, p_id: editId,
            p_documento_titulo: titulo,
            p_documento_link: link || null,
            p_tipo: document.getElementById('fp_tipo').value || null,
            p_destinatario_email: document.getElementById('fp_destinatario').value.trim() || null,
            p_notas: document.getElementById('fp_notas').value.trim() || null,
            p_archivo_path:   archivoData ? archivoData.path   : null,
            p_archivo_nombre: archivoData ? archivoData.nombre : null,
            p_archivo_mime:   archivoData ? archivoData.mime   : null,
            p_archivo_size:   archivoData ? archivoData.size   : null
          });
          if (resp.error) throw resp.error;
        } else {
          btn.textContent = 'Creando…';
          var resp2 = await sb.rpc('firma_solicitar', {
            p_solicitante_email: email,
            p_documento_titulo: titulo,
            p_documento_link: link || null,
            p_tipo: document.getElementById('fp_tipo').value || 'firma_digital',
            p_destinatario_email: document.getElementById('fp_destinatario').value.trim() || 'dusan.arancibia@gmail.com',
            p_notas: document.getElementById('fp_notas').value.trim() || null,
            p_archivo_path:   archivoData ? archivoData.path   : null,
            p_archivo_nombre: archivoData ? archivoData.nombre : null,
            p_archivo_mime:   archivoData ? archivoData.mime   : null,
            p_archivo_size:   archivoData ? archivoData.size   : null
          });
          if (resp2.error) throw resp2.error;
        }
        resetFirmaForm();
        document.getElementById('firmaForm').classList.add('hidden');
        loadFirmas();
      } catch (e) { alert('Error: ' + (e?.message || e)); }
      finally { btn.disabled = false; btn.textContent = orig; }
    });

    // Form Tarifa
    document.getElementById('tarifaNuevaBtn')?.addEventListener('click', function () { document.getElementById('tarifaForm').classList.toggle('hidden'); });
    document.getElementById('te_cancelar')?.addEventListener('click', function () { document.getElementById('tarifaForm').classList.add('hidden'); });
    document.getElementById('te_enviar')?.addEventListener('click', async function () {
      var servicio = document.getElementById('te_servicio').value.trim();
      if (!servicio) { alert('Servicio es requerido'); return; }
      var email = resolveEmail();
      if (!email) { alert('No detecto sesión'); return; }
      try {
        var resp = await sb.rpc('tarifa_crear', {
          p_actualizado_por: email,
          p_servicio: servicio,
          p_proveedor: document.getElementById('te_proveedor').value.trim() || null,
          p_precio_clp: parseFloat(document.getElementById('te_precio').value) || null,
          p_unidad: document.getElementById('te_unidad').value.trim() || 'unidad',
          p_vigencia_desde: document.getElementById('te_desde').value || null,
          p_vigencia_hasta: document.getElementById('te_hasta').value || null,
          p_notas: document.getElementById('te_notas').value.trim() || null
        });
        if (resp.error) throw resp.error;
        ['te_servicio','te_proveedor','te_precio','te_desde','te_hasta','te_notas'].forEach(function (id) { document.getElementById(id).value = ''; });
        document.getElementById('te_unidad').value = 'unidad';
        document.getElementById('tarifaForm').classList.add('hidden');
        loadTarifas();
      } catch (e) { alert('Error: ' + (e?.message || e)); }
    });

    // Filtro tarifas
    document.getElementById('te_filtro')?.addEventListener('input', function (e) {
      _tarifasFiltro = e.target.value.trim();
      clearTimeout(window.__teFiltroTimer);
      window.__teFiltroTimer = setTimeout(loadTarifas, 300);
    });

    // Delegated clicks
    document.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('.fp-firmar')))         actualizarFirma(b.dataset.id, 'firmado');
      else if ((b = e.target.closest('.fp-revisar')))   actualizarFirma(b.dataset.id, 'en_revision');
      else if ((b = e.target.closest('.fp-rechazar')))  actualizarFirma(b.dataset.id, 'rechazado');
      else if ((b = e.target.closest('.fp-editar')))    abrirEditFirma(b.dataset.id);
      else if ((b = e.target.closest('.fp-descargar'))) descargarArchivoFirma(b.dataset.path, b.dataset.name);
      else if ((b = e.target.closest('.te-edit')))      editarTarifa(b.dataset.id, b.dataset.precio);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
