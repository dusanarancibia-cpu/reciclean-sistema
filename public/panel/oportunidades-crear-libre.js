// public/panel/oportunidades-crear-libre.js
// Modal "➕ Nueva oportunidad" (modo libre) del tab Oportunidades Kanban.
//
// Rescatado del IIFE D-CRM-IMPULSA-OPORT-NUEVA-001 ("Zone B"), que además
// servía un "modo ficha" acoplado a CRM Impulsa/window.COM.fichaCache. Ese
// modo murió junto con CRM Impulsa + Ficha Cliente + el puente legado de
// oportunidades (antifragilidad panel, retiro legado Etapa 2).
//
// Este archivo ES el "puente mínimo necesario": el botón ➕ Nueva oportunidad
// del tab Oportunidades (panel-rdo.html #tabOportunidades) sigue llamando a
// window.abrirModalNuevaOportunidadGlobal. Cero dependencia de CRM Impulsa —
// busca clientes directo en curated.clientes vía autocomplete propio.
(function () {
  function ready() { return typeof sb !== 'undefined' && sb && sb.rpc && sb.storage; }
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

  window.abrirModalNuevaOportunidadGlobal = function () {
    var overlay = document.getElementById('crmNuevaOppOverlay');
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    document.getElementById('crmNuevaOppCliente').classList.add('hidden');
    document.getElementById('crmNuevaOppClienteWrap').classList.remove('hidden');
    document.getElementById('crmNuevaOppClienteWrap').classList.add('block');
    document.getElementById('crmNuevaOppClienteVinculado').classList.add('hidden');
    document.getElementById('crmNuevaOppClienteVinculado').classList.remove('flex');
    var lib = document.getElementById('crmNuevaOppClienteLibre');
    lib.value = '';
    document.getElementById('crmNuevaOppClienteDropdown').classList.add('hidden');
    document.getElementById('crmNuevaOppClienteLibreHint').classList.remove('hidden');
    document.getElementById('crmNuevaOppClienteReq').classList.remove('hidden');
    document.getElementById('crmNuevaOppTitulo').value = '';
    document.getElementById('crmNuevaOppSucursal').value = '';
    document.getElementById('crmNuevaOppValorUF').value = '';
    document.getElementById('crmNuevaOppDescripcion').value = '';
    document.getElementById('crmNuevaOppFiles').value = '';
    document.getElementById('crmNuevaOppMsg').classList.add('hidden');
    var btn = document.getElementById('crmNuevaOppCrear');
    btn.dataset.externalCrm = '';
    btn.dataset.clienteIdVinculado = '';
    setTimeout(function () { lib.focus(); }, 50);
  };

  // ── Autocomplete cliente (curated.clientes directo) ────────────────────
  var _ocSearchTimer = null;
  var _ocLastResults = [];
  async function ocBuscar(q) {
    if (!ready()) return [];
    var clean = (q || '').trim();
    if (clean.length < 3) return [];
    try {
      var resp = await sb
        .schema('curated').from('clientes')
        .select('cliente_id, razon_social, external_id_crm, rut')
        .or('razon_social.ilike.%' + clean + '%,rut.ilike.' + clean + '%')
        .order('razon_social', { ascending: true })
        .limit(10);
      if (resp.error) throw resp.error;
      return resp.data || [];
    } catch (e) {
      console.warn('[oc] buscar error:', e);
      return [];
    }
  }
  function ocRenderDropdown(items) {
    var dd = document.getElementById('crmNuevaOppClienteDropdown');
    if (!items.length) { dd.classList.add('hidden'); dd.innerHTML = ''; return; }
    dd.innerHTML = items.map(function (c, i) {
      return '<div class="oc-item px-3 py-2 cursor-pointer hover:bg-emerald-50 border-b border-stone-100 last:border-0" data-idx="' + i + '">' +
        '<div class="text-sm text-stone-800 truncate">' + esc(c.razon_social || '(sin razón social)') + '</div>' +
        '<div class="text-[10px] text-stone-400">' + esc(c.rut || 'sin RUT') + (c.external_id_crm ? ' · CRM ' + esc(c.external_id_crm) : '') + '</div>' +
      '</div>';
    }).join('');
    dd.classList.remove('hidden');
    _ocLastResults = items;
  }
  function ocVincular(cliente) {
    var btn = document.getElementById('crmNuevaOppCrear');
    btn.dataset.externalCrm = cliente.external_id_crm || '';
    btn.dataset.clienteIdVinculado = cliente.cliente_id || '';
    document.getElementById('crmNuevaOppClienteVinculadoNombre').textContent = cliente.razon_social || '(sin nombre)';
    document.getElementById('crmNuevaOppClienteWrap').classList.add('hidden');
    document.getElementById('crmNuevaOppClienteWrap').classList.remove('block');
    document.getElementById('crmNuevaOppClienteDropdown').classList.add('hidden');
    document.getElementById('crmNuevaOppClienteVinculado').classList.remove('hidden');
    document.getElementById('crmNuevaOppClienteVinculado').classList.add('flex');
    document.getElementById('crmNuevaOppClienteLibreHint').classList.add('hidden');
  }
  function ocDesvincular() {
    var btn = document.getElementById('crmNuevaOppCrear');
    btn.dataset.externalCrm = '';
    btn.dataset.clienteIdVinculado = '';
    document.getElementById('crmNuevaOppClienteVinculado').classList.add('hidden');
    document.getElementById('crmNuevaOppClienteVinculado').classList.remove('flex');
    document.getElementById('crmNuevaOppClienteWrap').classList.remove('hidden');
    document.getElementById('crmNuevaOppClienteWrap').classList.add('block');
    document.getElementById('crmNuevaOppClienteLibreHint').classList.remove('hidden');
    var lib = document.getElementById('crmNuevaOppClienteLibre');
    lib.value = '';
    setTimeout(function () { lib.focus(); }, 50);
  }
  function ocBlurAutoMatch() {
    var libVal = document.getElementById('crmNuevaOppClienteLibre').value.trim().toLowerCase();
    if (!libVal) return;
    var exactos = _ocLastResults.filter(function (c) {
      return (c.razon_social || '').trim().toLowerCase() === libVal;
    });
    if (exactos.length === 1) {
      ocVincular(exactos[0]);
    }
  }

  function cerrarModal() {
    var overlay = document.getElementById('crmNuevaOppOverlay');
    overlay.classList.add('hidden'); overlay.classList.remove('flex');
  }

  async function subirArchivo(oportunidadId, file) {
    if (!ready() || !file) return;
    var email = resolveEmail();
    if (!email) { alert('No detecto tu sesión.'); return; }
    try {
      var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var path = oportunidadId + '/' + Date.now() + '_' + safeName;
      var up = await sb.storage.from('impulsa-documentos').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
      if (up.error) throw up.error;
      var reg = await sb.rpc('opp_adjunto_registrar', {
        p_email: email, p_oportunidad_id: oportunidadId, p_bucket_path: path,
        p_nombre: file.name, p_mime: file.type || null, p_size: file.size
      });
      if (reg.error) throw reg.error;
    } catch (e) {
      console.error('[opp-nueva-libre] upload error:', e);
      alert('Error subiendo: ' + (e?.message || String(e)));
    }
  }

  async function crearOportunidad() {
    var btn = document.getElementById('crmNuevaOppCrear');
    var msg = document.getElementById('crmNuevaOppMsg');
    var vinculadoVisible = document.getElementById('crmNuevaOppClienteVinculado').classList.contains('flex');
    var clienteLibre = !vinculadoVisible
      ? document.getElementById('crmNuevaOppClienteLibre').value.trim()
      : null;
    var titulo = document.getElementById('crmNuevaOppTitulo').value.trim();
    var tipo = document.getElementById('crmNuevaOppTipo').value;
    var sucursal = document.getElementById('crmNuevaOppSucursal').value.trim() || null;
    var valor = parseFloat(document.getElementById('crmNuevaOppValorUF').value) || null;
    var descripcion = document.getElementById('crmNuevaOppDescripcion').value.trim() || null;
    var files = document.getElementById('crmNuevaOppFiles').files;
    var externalCrm = btn.dataset.externalCrm || null;
    if (!vinculadoVisible && !clienteLibre) {
      msg.className = 'text-xs text-red-700'; msg.textContent = 'Cliente requerido.'; msg.classList.remove('hidden'); return;
    }
    if (!titulo) { msg.className = 'text-xs text-red-700'; msg.textContent = 'Título requerido.'; msg.classList.remove('hidden'); return; }
    var email = resolveEmail();
    if (!email) { msg.className = 'text-xs text-red-700'; msg.textContent = 'No detecto tu sesión.'; msg.classList.remove('hidden'); return; }
    btn.disabled = true; btn.textContent = 'Creando…';
    try {
      var r = await sb.rpc('crm_crear_oportunidad_v2', {
        p_email: email,
        p_tipo: tipo,
        p_titulo: titulo,
        p_descripcion: descripcion,
        p_sucursal_id: sucursal,
        p_valor_estimado_uf: valor,
        p_metadata: {},
        p_external_id_crm: externalCrm || null,
        p_cliente_nombre_libre: clienteLibre
      });
      if (r.error) throw r.error;
      var oportId = r.data;
      for (var i = 0; i < files.length; i++) { await subirArchivo(oportId, files[i]); }
      cerrarModal();
      if (typeof window.loadOportunidadesKanban === 'function') {
        window.loadOportunidadesKanban();
      }
    } catch (e) {
      msg.className = 'text-xs text-red-700'; msg.textContent = 'Error: ' + (e?.message || String(e));
      msg.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Crear oportunidad';
    }
  }

  function init() {
    document.getElementById('crmNuevaOppCerrar')?.addEventListener('click', cerrarModal);
    document.getElementById('crmNuevaOppCancelar')?.addEventListener('click', cerrarModal);
    document.getElementById('crmNuevaOppCrear')?.addEventListener('click', crearOportunidad);

    var lib = document.getElementById('crmNuevaOppClienteLibre');
    if (lib) {
      lib.addEventListener('input', function () {
        clearTimeout(_ocSearchTimer);
        var q = lib.value.trim();
        if (q.length < 3) {
          document.getElementById('crmNuevaOppClienteDropdown').classList.add('hidden');
          return;
        }
        _ocSearchTimer = setTimeout(async function () {
          var items = await ocBuscar(q);
          ocRenderDropdown(items);
        }, 300);
      });
      lib.addEventListener('blur', function () {
        setTimeout(function () {
          document.getElementById('crmNuevaOppClienteDropdown').classList.add('hidden');
          ocBlurAutoMatch();
        }, 200);
      });
    }
    document.getElementById('crmNuevaOppClienteDropdown')?.addEventListener('mousedown', function (e) {
      var item = e.target.closest('.oc-item');
      if (!item) return;
      e.preventDefault();
      var idx = parseInt(item.dataset.idx, 10);
      var c = _ocLastResults[idx];
      if (c) ocVincular(c);
    });
    document.getElementById('crmNuevaOppClienteDesvincular')?.addEventListener('click', ocDesvincular);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
