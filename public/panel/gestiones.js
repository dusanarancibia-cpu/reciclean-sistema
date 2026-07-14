// ============================================================
// GESTIONES — rehogado dentro de Oportunidades (antifragilidad panel,
// migración "Análisis de descarte CRM Impulsa" · Etapa 1)
//
// Origen: vivía dentro del modal legado "Ficha Cliente" de CRM Impulsa
// (panel-rdo.html, IIFE "D-CRM-GESTIONES" · mig 222 · Pablo 2026-06-05),
// alcanzable solo desde ahí. Verificado con SQL antes de migrar: 116 filas
// reales, 64 clientes distintos, actividad activa (última gestión el mismo
// día de este análisis) — es la ÚNICA pieza del legado CRM Impulsa con uso
// real confirmado. El resto (dashboard de clientes, sub-tabs datos/
// contactos/cotizaciones/documentos, puente de creación de oportunidades)
// es legado congelado sin uso real y queda para retirar en la Etapa 2 —
// NO se tocó en este cambio.
//
// Cero dependencia de:
//   - window.COM.fichaCache (estado interno de CRM Impulsa)
//   - el modal viejo de Ficha Cliente (crmFichaModal/crmFichaClose)
//   - CRM Impulsa en general (staging.crm_impulsa_*)
//   - el puente legado de oportunidades (crm_crear_oportunidad_v2,
//     injectarPanelOportunidades)
//
// Entrada real: siempre cliente_id (columna real de curated.clientes),
// nunca external_id_crm. Las RPCs (crm_gestiones_por_cliente,
// crm_crear_gestion) igual aceptan external_id_crm por compatibilidad con
// el modal viejo — este módulo simplemente nunca lo usa.
//
// Modal propio (oppNuevaGestionOverlay + ids oppNuevaGest*) — NO reutiliza
// el modal viejo (crmNuevaGestionOverlay) para evitar que ambos registren
// listeners sobre los mismos botones mientras CRM Impulsa siga vivo
// (colisión real: 2 handlers en el mismo click, gestión duplicada o
// _gestCtx equivocado). Misma lógica de negocio, HTML/ids independientes.
//
// Llamado desde: public/panel/oportunidades-kanban.js → oppAbrirDrawer(),
// con el cliente_id real que la vista v_oportunidades_kanban_v2 ya trae.
//
// Exports: window.oppCargarGestionesCliente(clienteId, clienteNombre),
// window.oppAbrirModalNuevaGestion().
// ============================================================

(function () {
  function ready() { return typeof sb !== 'undefined' && sb && sb.rpc && sb.storage; }
  function resolveEmail() {
    if (typeof currentUser !== 'undefined' && currentUser?.email) return String(currentUser.email).toLowerCase();
    try { var s = JSON.parse(sessionStorage.getItem('rf_session') || 'null'); if (s?.email) return String(s.email).toLowerCase(); } catch (e) {}
    try { var u = JSON.parse(sessionStorage.getItem('rf_usuario') || 'null'); if (u?.email) return String(u.email).toLowerCase(); } catch (e) {}
    try { var ls = JSON.parse(localStorage.getItem('rf_session') || 'null'); if (ls?.email) return String(ls.email).toLowerCase(); } catch (e) {}
    try {
      var sbTok = JSON.parse(localStorage.getItem('sb-eknmtsrtfkzroxnovfqn-auth-token') || 'null');
      var em = sbTok?.user?.email || sbTok?.currentSession?.user?.email;
      if (em) return String(em).toLowerCase();
    } catch (e) {}
    return null;
  }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; }); }
  function fmtFecha(ts) { if (!ts) return '—'; try { return new Date(ts).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return ts; } }
  function fmtKB(b) { if (!b) return ''; return Math.round(b/1024) + ' KB'; }
  function toDatetimeLocal(d) { var x = new Date(d); var off = x.getTimezoneOffset()*60000; return new Date(x - off).toISOString().slice(0,16); }

  // Contexto del cliente actualmente abierto en el drawer de Oportunidades.
  // Siempre cliente_id real — nunca external_id_crm.
  var _gestCtx = { cliente_id: null, cliente_nombre: '' };

  window.oppCargarGestionesCliente = async function (clienteId, clienteNombre) {
    _gestCtx = { cliente_id: clienteId || null, cliente_nombre: clienteNombre || '' };
    var cont = document.getElementById('oppDrawerGestiones');
    if (!cont) return;
    if (!_gestCtx.cliente_id) {
      cont.innerHTML = '<div class="text-stone-400 italic">Sin cliente vinculado — no hay gestiones.</div>';
      return;
    }
    if (!ready()) { cont.innerHTML = '<div class="text-xs text-amber-700 italic">Sesión no detectada.</div>'; return; }
    cont.innerHTML = '<div class="text-xs text-stone-400 italic py-2 text-center">Cargando…</div>';
    try {
      var resp = await sb.rpc('crm_gestiones_por_cliente', {
        p_cliente_id: _gestCtx.cliente_id,
        p_limit: 50
      });
      if (resp.error) throw resp.error;
      renderTimeline(cont, resp.data?.gestiones || [], resp.data?.next_cursor || null);
    } catch (e) {
      console.warn('[opp-gest] error cargar:', e);
      cont.innerHTML = '<div class="text-xs text-red-700 py-3">Error cargando gestiones: ' + esc(e?.message || String(e)) + '</div>';
    }
  };

  function renderTimeline(cont, gestiones, nextCursor) {
    if (!gestiones.length) {
      cont.innerHTML = '<div class="text-center py-4 text-stone-400 text-xs">Sin gestiones todavía. Hacé click en + Agregar gestión.</div>';
      return;
    }
    var ICONOS = { llamada:'📞', email:'✉️', reunion:'🤝', whatsapp:'💬', nota:'📝', otra:'🔖' };
    var html = gestiones.map(function (g) {
      var ico = ICONOS[g.tipo] || '🔖';
      var followBadge = '';
      if (g.follow_up_at) {
        var venc = new Date(g.follow_up_at) < new Date();
        followBadge = '<span class="ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded ' +
          (venc ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700') +
          '">📅 ' + (venc ? 'Seguimiento vencido' : 'Seguir') + ' ' + esc(fmtFecha(g.follow_up_at)) + '</span>';
      }
      var autoTag = (g.metadata && g.metadata.auto_generated) ? '<span class="ml-2 text-[10px] text-stone-400">auto</span>' : '';
      var adjuntosTag = g.adjuntos_count > 0 ? '<span class="ml-2 text-[10px] text-stone-500">📎 ' + g.adjuntos_count + '</span>' : '';
      return '<div class="bg-white border border-stone-200 rounded p-2 shadow-sm" data-gest-id="' + esc(g.id) + '">' +
        '<div class="flex items-start gap-2 flex-wrap">' +
          '<span class="text-base">' + ico + '</span>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="font-medium text-stone-800">' + esc(g.titulo) + autoTag + adjuntosTag + followBadge + '</div>' +
            '<div class="text-[10px] text-stone-500 mt-0.5">' +
              esc(g.tipo) + ' · ' + esc(fmtFecha(g.fecha_gestion)) + ' · ' + esc(g.responsable) +
            '</div>' +
            (g.descripcion ? '<div class="text-[11px] text-stone-600 mt-1 whitespace-pre-wrap">' + esc(g.descripcion) + '</div>' : '') +
            (g.resultado ? '<div class="text-[11px] text-emerald-700 mt-1">→ ' + esc(g.resultado) + '</div>' : '') +
          '</div>' +
        '</div>' +
        (g.adjuntos_count > 0 ? '<div class="mt-1 pl-6" data-adj-of="' + esc(g.id) + '"></div>' : '') +
      '</div>';
    }).join('');
    if (nextCursor) {
      html += '<button id="oppGestVerMas" data-cursor="' + esc(nextCursor) + '" class="w-full py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded">Ver más antiguas →</button>';
    }
    cont.innerHTML = html;
    cont.querySelectorAll('[data-adj-of]').forEach(function (slot) {
      cargarAdjuntosDeGestion(slot.getAttribute('data-adj-of'), slot);
    });
    var verMas = document.getElementById('oppGestVerMas');
    if (verMas) verMas.addEventListener('click', async function () {
      var cursor = verMas.dataset.cursor;
      verMas.disabled = true; verMas.textContent = 'Cargando…';
      try {
        var resp = await sb.rpc('crm_gestiones_por_cliente', {
          p_cliente_id: _gestCtx.cliente_id,
          p_cursor_ts: cursor,
          p_limit: 50
        });
        if (resp.error) throw resp.error;
        verMas.remove();
        var nuevas = resp.data?.gestiones || [];
        var append = document.createElement('div');
        append.className = 'space-y-2';
        cont.appendChild(append);
        renderTimeline(append, nuevas, resp.data?.next_cursor || null);
      } catch (e) {
        verMas.disabled = false; verMas.textContent = 'Reintentar';
        console.warn('[opp-gest] ver más error:', e);
      }
    });
  }

  async function cargarAdjuntosDeGestion(gestionId, slotEl) {
    try {
      var r = await sb.rpc('gest_adjuntos_listar', { p_gestion_id: gestionId });
      if (r.error || !Array.isArray(r.data)) return;
      slotEl.innerHTML = r.data.map(function (a) {
        return '<div class="flex items-center gap-2 text-[10px] bg-stone-50 px-2 py-1 rounded mt-1">' +
          '<span class="truncate flex-1">📄 ' + esc(a.nombre) + ' <span class="text-stone-400">' + fmtKB(a.tamano_bytes) + '</span></span>' +
          '<button class="opp-gest-adj-ver text-sky-700 hover:underline" data-path="' + esc(a.bucket_path) + '">ver</button>' +
        '</div>';
      }).join('');
    } catch (e) { /* silenciar */ }
  }

  window.oppAbrirModalNuevaGestion = function () {
    var overlay = document.getElementById('oppNuevaGestionOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    document.getElementById('oppNuevaGestCliente').textContent = _gestCtx.cliente_nombre || _gestCtx.cliente_id || '—';
    document.getElementById('oppNuevaGestTitulo').value = '';
    document.getElementById('oppNuevaGestDescripcion').value = '';
    document.getElementById('oppNuevaGestResultado').value = '';
    document.getElementById('oppNuevaGestFecha').value = toDatetimeLocal(new Date());
    document.getElementById('oppNuevaGestFollow').value = '';
    document.getElementById('oppNuevaGestFiles').value = '';
    document.getElementById('oppNuevaGestResponsable').value = resolveEmail() || '';
    document.getElementById('oppNuevaGestMsg').classList.add('hidden');
  };
  function cerrarModalGest() {
    var overlay = document.getElementById('oppNuevaGestionOverlay');
    if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); }
  }

  async function crearGestion() {
    var btn = document.getElementById('oppNuevaGestCrear');
    var msg = document.getElementById('oppNuevaGestMsg');
    if (!_gestCtx.cliente_id) { msg.className='text-xs text-red-700'; msg.textContent='Sin cliente vinculado a esta oportunidad.'; msg.classList.remove('hidden'); return; }
    var email = resolveEmail();
    if (!email) { msg.className='text-xs text-red-700'; msg.textContent='No detecto tu sesión.'; msg.classList.remove('hidden'); return; }
    var titulo = document.getElementById('oppNuevaGestTitulo').value.trim();
    if (!titulo) { msg.className='text-xs text-red-700'; msg.textContent='Título requerido.'; msg.classList.remove('hidden'); return; }
    var tipo = document.getElementById('oppNuevaGestTipo').value;
    var descripcion = document.getElementById('oppNuevaGestDescripcion').value.trim() || null;
    var resultado = document.getElementById('oppNuevaGestResultado').value.trim() || null;
    var fechaInp = document.getElementById('oppNuevaGestFecha').value;
    var fecha = fechaInp ? new Date(fechaInp).toISOString() : null;
    var followInp = document.getElementById('oppNuevaGestFollow').value;
    var follow = followInp ? new Date(followInp).toISOString() : null;
    var responsable = (document.getElementById('oppNuevaGestResponsable').value.trim() || email).toLowerCase();
    var files = document.getElementById('oppNuevaGestFiles').files;
    btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      var r = await sb.rpc('crm_crear_gestion', {
        p_email: email, p_tipo: tipo, p_titulo: titulo,
        p_descripcion: descripcion, p_fecha_gestion: fecha,
        p_resultado: resultado, p_follow_up_at: follow,
        p_responsable: responsable,
        p_cliente_id: _gestCtx.cliente_id,
        p_metadata: {}
      });
      if (r.error) throw r.error;
      var gestionId = r.data;
      for (var i = 0; i < files.length; i++) {
        await subirAdjuntoGestion(gestionId, files[i], email);
      }
      cerrarModalGest();
      window.oppCargarGestionesCliente(_gestCtx.cliente_id, _gestCtx.cliente_nombre);
    } catch (e) {
      msg.className='text-xs text-red-700'; msg.textContent='Error: ' + (e?.message || String(e));
      msg.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar gestión';
    }
  }

  async function subirAdjuntoGestion(gestionId, file, email) {
    try {
      var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var path = 'gestiones/' + gestionId + '/' + Date.now() + '_' + safeName;
      var up = await sb.storage.from('impulsa-documentos').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
      if (up.error) throw up.error;
      var reg = await sb.rpc('gest_adjunto_registrar', {
        p_email: email, p_gestion_id: gestionId, p_bucket_path: path,
        p_nombre: file.name, p_mime: file.type || null, p_size: file.size
      });
      if (reg.error) throw reg.error;
    } catch (e) {
      console.warn('[opp-gest-adj] upload error:', e);
      alert('Error subiendo "' + file.name + '": ' + (e?.message || String(e)));
    }
  }

  async function verAdjuntoGestion(path) {
    try {
      var s = await sb.storage.from('impulsa-documentos').createSignedUrl(path, 300);
      if (s.error) throw s.error;
      window.open(s.data.signedUrl, '_blank');
    } catch (e) { alert('No se pudo abrir: ' + (e?.message || String(e))); }
  }

  function init() {
    document.getElementById('oppNuevaGestCerrar')?.addEventListener('click', cerrarModalGest);
    document.getElementById('oppNuevaGestCancelar')?.addEventListener('click', cerrarModalGest);
    document.getElementById('oppNuevaGestCrear')?.addEventListener('click', crearGestion);
    document.getElementById('oppGestionesNuevaBtn')?.addEventListener('click', window.oppAbrirModalNuevaGestion);
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.opp-gest-adj-ver');
      if (btn) { verAdjuntoGestion(btn.dataset.path); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
