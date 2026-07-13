// ============================================================
// TAB CARTERA — extraído de panel-rdo.html (antifragilidad del panel,
// 2026-07-13, tercer bloque). Script clásico sin IIFE a propósito: el
// HTML del tab (panel-rdo.html) genera onclick inline que referencia
// estas funciones por nombre suelto — mismo patrón que cotizador.js y
// oportunidades-kanban.js.
//
// CONTRATO PÚBLICO — funciones ya llamadas desde otros módulos ya
// extraídos (verificado con grep antes de mover código):
//   - window.carAbrirEditar(clienteId)   ← llamada por public/panel/cotizador.js
//   - window.carAbrirCrear(razonSocial)  ← llamada por public/panel/cotizador.js
// Ambas siguen expuestas en window exactamente igual, sin cambio de
// firma ni de comportamiento. Origen de este contrato: R-AUD-035
// (incidente Cotizador Megapol/Green Cup) — Cartera es la fuente única
// de verdad para editar/crear cliente, no se duplica en otras pestañas.
// ============================================================

// TAB CARTERA (D-OP-11) — Andrea cliente-detalle
// ============================================================
let _cartCategorias = null;
let _cartSucursales = null;
let _cartDrawerClienteId = null;
let _cartSearchTimer = null;

function carDebouncedSearch() {
  clearTimeout(_cartSearchTimer);
  _cartSearchTimer = setTimeout(() => loadCartera(), 300);
}

// N2-3 · Cargar resumen cobertura cartera (backend Pablo)
async function _v4LoadCarteraCobertura() {
  try {
    if (typeof sb === 'undefined' || !sb?.rpc) return;
    const { data, error } = await sb.rpc('f_panel_cartera_cobertura');
    if (error || !data) return;
    const activos = data?.total_clientes_activos ?? 0;
    const cat = data?.con_categoria ?? 0;
    const sinCat = data?.sin_categoria ?? 0;
    const pct = activos > 0 ? Math.round(cat / activos * 100) : 0;
    const setIf = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
    setIf('v4CarCobActivos', activos);
    setIf('v4CarCobCat', cat);
    setIf('v4CarCobSinCat', sinCat);
    setIf('v4CarCobPct', pct + '%');
  } catch(e) { console.warn('[v4-cartera-cob] fallo:', e); }
}

async function initCartera() {
  // N2-3: cobertura cartera once por sesión
  if (!window._v4CarCobLoaded) { window._v4CarCobLoaded = true; _v4LoadCarteraCobertura(); }
  if (!_cartCategorias) {
    const { data, error } = await sb.schema('curated').from('cartera_categorias')
      .select('categoria_id, nombre, color_ui, orden, activa').order('orden');
    if (error) console.warn('[Cartera] categorías error:', error.message);
    _cartCategorias = (data || []).filter(c => c.activa);

    const selFiltro = document.getElementById('carFiltroCategoria');
    const selDrawer = document.getElementById('carDrawerCatSelect');
    selFiltro.innerHTML = '<option value="">Todas</option><option value="sin_clasificar">Sin clasificar</option>'
      + _cartCategorias.map(c => `<option value="${escapeHtml(c.categoria_id)}">${escapeHtml(c.nombre)}</option>`).join('');
    selDrawer.innerHTML = '<option value="">(sin categoría)</option>'
      + _cartCategorias.map(c => `<option value="${escapeHtml(c.categoria_id)}">${escapeHtml(c.nombre)}</option>`).join('');
  }
  if (!_cartSucursales) {
    const sucs = await ensureSucursalesCache();
    const selS = document.getElementById('carFiltroSucursal');
    selS.innerHTML = '<option value="">Todas</option>'
      + (sucs || []).map(s => `<option value="${escapeHtml(s.sucursal_id)}">${escapeHtml(s.nombre)}</option>`).join('');
    _cartSucursales = sucs;
  }
  await loadCarteraKpis();
  await loadCartera();
}

async function loadCarteraKpis() {
  const { data, error } = await sb.schema('curated').rpc('cartera_kpis');
  if (error) { console.warn('[Cartera] KPIs error:', error.message); return; }
  const bar = document.getElementById('carKpiBar');
  const colorMap = {
    verde:   { bg: 'bg-green-100',  text: 'text-green-800' },
    azul:    { bg: 'bg-blue-100',   text: 'text-blue-800' },
    ambar:   { bg: 'bg-amber-100',  text: 'text-amber-800' },
    naranja: { bg: 'bg-orange-100', text: 'text-orange-800' },
    rojo:    { bg: 'bg-red-100',    text: 'text-red-800' },
  };
  bar.innerHTML = (data || []).map(c => {
    const co = colorMap[c.color_ui] || { bg: 'bg-stone-200', text: 'text-stone-700' };
    return `
      <button onclick="document.getElementById('carFiltroCategoria').value='${escapeHtml(c.categoria_id)}'; loadCartera();"
              class="${co.bg} ${co.text} px-3 py-2 rounded shadow-sm hover:opacity-80 text-left">
        <div class="text-xs opacity-80">${escapeHtml(c.categoria_nombre)}</div>
        <div class="text-xl font-bold">${Number(c.cant).toLocaleString('es-CL')}</div>
      </button>`;
  }).join('');
}

async function loadCartera() {
  const tbody = document.getElementById('carTbody');
  tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-4 text-center text-stone-400">Cargando…</td></tr>';
  const cat = document.getElementById('carFiltroCategoria').value;
  const suc = document.getElementById('carFiltroSucursal').value;
  const buscar = (document.getElementById('carFiltroBuscar').value || '').trim();

  const fuente = document.getElementById('carFiltroFuente')?.value ?? '';
  let q = sb.schema('curated').from('vw_cartera_detalle').select('*').order('razon_social');
  if (cat === 'sin_clasificar') q = q.is('categoria_id', null);
  else if (cat) q = q.eq('categoria_id', cat);
  if (suc) q = q.eq('sucursal_principal', suc);
  if (fuente === 'crm') q = q.not('external_id_crm', 'is', null);
  else if (fuente === 'rdo') q = q.is('external_id_crm', null);
  if (buscar) {
    const s = buscar.replace(/'/g, "''");
    q = q.or(`razon_social.ilike.%${s}%,rut.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-3 py-4 text-center text-red-600">Error: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-6 text-center text-stone-400">Sin clientes para los filtros aplicados.</td></tr>';
    return;
  }

  const sucMap = new Map((_cartSucursales || []).map(s => [s.sucursal_id, s.nombre]));
  tbody.innerHTML = data.map(c => {
    const sucNombre = c.sucursal_principal ? (sucMap.get(c.sucursal_principal) || c.sucursal_principal) : '—';
    const catPill = c.categoria_id
      ? `<span class="inline-block px-2 py-0.5 rounded text-xs ${carColorClass(c.categoria_color)}">${escapeHtml(c.categoria_nombre)}</span>`
      : '<span class="inline-block px-2 py-0.5 rounded text-xs bg-stone-200 text-stone-600">Sin clasificar</span>';
    const flags = [];
    if (c.tiene_grua_horquilla) flags.push('<span title="Grúa horquilla">🚜</span>');
    if (c.tiene_personal_carga) flags.push('<span title="Personal de carga">👷</span>');
    if (c.external_id_crm) flags.push('<span title="Cruzado con CRM Impulsa">🔗</span>');
    if (!c.activo) flags.push('<span title="Inactivo" class="text-red-600">⛔</span>');
    return `
      <tr class="border-t border-stone-100 hover:bg-stone-50 cursor-pointer"
          data-entity-type="cliente" data-entity-id="${escapeHtml(c.cliente_id)}" data-entity-nombre="${escapeHtml(c.razon_social || '')}"
          title="Click: detalle · Click-derecho: vínculos E360"
          onclick="carAbrirDrawer('${escapeHtml(c.cliente_id)}')">
        <td class="px-3 py-2"><span class="font-medium text-stone-800">${escapeHtml(c.razon_social || '—')}</span></td>
        <td class="px-3 py-2 font-mono text-xs">${escapeHtml(c.rut || '—')}</td>
        <td class="px-3 py-2">${escapeHtml(sucNombre)}</td>
        <td class="px-3 py-2">${catPill}</td>
        <td class="px-3 py-2 text-right">${c.opor_rdo_abiertas}/${c.opor_rdo_total}</td>
        <td class="px-3 py-2 text-right">${c.opor_crm_matcheadas}</td>
        <td class="px-3 py-2">${flags.join(' ') || ''}</td>
      </tr>`;
  }).join('');
}

function carColorClass(colorTag) {
  const m = {
    verde:   'bg-green-100 text-green-800',
    azul:    'bg-blue-100 text-blue-800',
    ambar:   'bg-amber-100 text-amber-800',
    naranja: 'bg-orange-100 text-orange-800',
    rojo:    'bg-red-100 text-red-800',
  };
  return m[colorTag] || 'bg-stone-200 text-stone-700';
}

window.carAbrirDrawer = async function(clienteId) {
  _cartDrawerClienteId = clienteId;
  document.getElementById('carDrawer').classList.remove('hidden');
  document.getElementById('carDrawerCatMsg').classList.add('hidden');
  document.getElementById('carDrawerTitulo').textContent = 'Cargando…';
  document.getElementById('carDrawerRut').textContent = '—';
  document.getElementById('carDrawerTags').innerHTML = '';
  document.getElementById('carDrawerCatActual').textContent = '—';
  document.getElementById('carDrawerCatMotivo').textContent = '';
  document.getElementById('carDrawerOpRdo').textContent = 'Cargando…';
  document.getElementById('carDrawerOpCrm').textContent = 'Cargando…';

  const { data: c, error } = await sb.schema('curated').from('vw_cartera_detalle').select('*').eq('cliente_id', clienteId).maybeSingle();
  if (error || !c) {
    document.getElementById('carDrawerTitulo').textContent = 'Error cargando cliente';
    return;
  }

  document.getElementById('carDrawerTitulo').textContent = c.razon_social || '—';
  document.getElementById('carDrawerRut').textContent = c.rut || '(sin RUT)';

  const tags = [];
  if (c.tiene_grua_horquilla) tags.push('<span class="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded">🚜 Grúa horquilla</span>');
  if (c.tiene_personal_carga) tags.push('<span class="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded">👷 Personal carga</span>');
  if (c.external_id_crm) tags.push(`<span class="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">🔗 CRM ${escapeHtml(c.external_id_crm)}</span>`);
  if (!c.activo) tags.push('<span class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">⛔ Inactivo</span>');
  document.getElementById('carDrawerTags').innerHTML = tags.join('');

  if (c.categoria_id) {
    document.getElementById('carDrawerCatActual').innerHTML = `<span class="inline-block px-2 py-0.5 rounded text-xs ${carColorClass(c.categoria_color)}">${escapeHtml(c.categoria_nombre)}</span> <span class="text-xs text-stone-500 ml-1">desde ${c.categoria_desde ? c.categoria_desde.slice(0,10) : '—'}</span>`;
    document.getElementById('carDrawerCatMotivo').textContent = c.categoria_motivo || '';
    document.getElementById('carDrawerCatSelect').value = c.categoria_id;
  } else {
    document.getElementById('carDrawerCatActual').innerHTML = '<span class="text-stone-500 text-sm">Sin clasificar</span>';
    document.getElementById('carDrawerCatMotivo').textContent = '';
    document.getElementById('carDrawerCatSelect').value = '';
  }
  document.getElementById('carDrawerCatMotivoInput').value = '';

  // Oportunidades RDO
  const { data: opRdo } = await sb.schema('curated').from('oportunidades')
    .select('oportunidad_id, titulo, estado, valor_estimado_uf, fecha_recepcion')
    .eq('cliente_id', clienteId).order('fecha_recepcion', { ascending: false }).limit(10);
  document.getElementById('carDrawerOpRdo').innerHTML = (opRdo && opRdo.length)
    ? opRdo.map(o => `<div class="border-b border-stone-100 py-1">
        <span class="font-medium">${escapeHtml(o.titulo || o.oportunidad_id)}</span>
        <span class="text-stone-400 ml-1">${escapeHtml(o.estado || '')}</span>
        <span class="text-stone-500 float-right">${o.valor_estimado_uf ? Number(o.valor_estimado_uf).toLocaleString('es-CL') + ' UF' : ''}</span>
      </div>`).join('')
    : '<span class="text-stone-400">Sin oportunidades RDO.</span>';

  // Oportunidades CRM
  const { data: opCrm } = await sb.schema('curated').from('vw_oportunidades_crm')
    .select('crm_id, cliente_nombre, estado, embudo, monto_raw, fecha_ingreso')
    .eq('cliente_id_rdo', clienteId).order('fecha_ingreso', { ascending: false }).limit(5);
  document.getElementById('carDrawerOpCrm').innerHTML = (opCrm && opCrm.length)
    ? opCrm.map(o => `<div class="border-b border-stone-100 py-1">
        <span class="font-mono text-xs text-stone-500">${escapeHtml(o.crm_id)}</span>
        <span class="ml-2">${escapeHtml(o.embudo || '')}</span>
        <span class="text-stone-400 ml-1">${escapeHtml(o.estado || '')}</span>
        <span class="text-stone-500 float-right">${escapeHtml(o.monto_raw || '')}</span>
      </div>`).join('')
    : '<span class="text-stone-400">Sin oportunidades CRM cruzadas.</span>';
};

window.carCerrarDrawer = function() {
  document.getElementById('carDrawer').classList.add('hidden');
  _cartDrawerClienteId = null;
};

// ── Crear / Editar cliente ────────────────────────────────────────────────────

let _cliEditando = null; // cliente_id si edición, null si creación

window.carNuevoCliente = function() {
  _cliEditando = null;
  document.getElementById('clienteEditModalTitulo').textContent = 'Nuevo cliente';
  ['cliRazonSocial','cliRut','cliTelefono','cliEmail','cliDireccion','cliCiudad','cliRegion',
   'cliSitioWeb','cliComentarios','cliResponsable','cliTags','cliServRetiro','cliServRetiroGratis',
   'cliServContenedor','cliServCert','cliServCertFecha','cliServSegregacion','cliCobroMaterial',
   'cliCondicionesPago','cliCompraDonacion','cliDetalleEnvio','cliBanco','cliNroCuenta']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['cliSucursal','cliActivo','cliClientePara','cliSegmento','cliFormaPago','cliCobroFrecuencia','cliTipoCuenta']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('cliActivo').value = 'true';
  const msg = document.getElementById('clienteEditMsg');
  msg.classList.add('hidden');
  document.getElementById('clienteEditModal').classList.remove('hidden');
};

window.carAbrirEditar = async function(clienteId) {
  if (!clienteId) return;
  _cliEditando = clienteId;
  document.getElementById('clienteEditModalTitulo').textContent = 'Editar cliente';
  const msg = document.getElementById('clienteEditMsg');
  msg.classList.add('hidden');

  const { data: c, error } = await sb.schema('curated').from('clientes').select('*').eq('cliente_id', clienteId).maybeSingle();
  if (error || !c) {
    alert('Error cargando datos del cliente');
    return;
  }

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('cliRazonSocial', c.razon_social);
  set('cliRut', c.rut);
  set('cliSucursal', c.sucursal_principal);
  document.getElementById('cliActivo').value = c.activo ? 'true' : 'false';
  set('cliClientePara', c.cliente_para);
  set('cliSegmento', c.segmento);
  set('cliResponsable', c.responsable_cliente);
  set('cliTags', c.tags);
  set('cliTelefono', c.telefono);
  set('cliEmail', c.email);
  set('cliDireccion', c.direccion);
  set('cliCiudad', c.ciudad);
  set('cliRegion', c.region);
  set('cliSitioWeb', c.sitio_web);
  set('cliComentarios', c.comentarios);
  set('cliFormaPago', c.forma_pago);
  set('cliServRetiro', c.serv_retiro);
  set('cliServRetiroGratis', c.serv_retiro_gratis);
  set('cliServContenedor', c.serv_contenedor);
  set('cliServCert', c.serv_certificacion);
  set('cliServCertFecha', c.serv_certificado_fecha);
  set('cliServSegregacion', c.serv_segregacion);
  set('cliCobroFrecuencia', c.cobro_frecuencia);
  set('cliCobroMaterial', c.cobro_material);
  set('cliCondicionesPago', c.condiciones_pago);
  set('cliCompraDonacion', c.compra_donacion_venta);
  set('cliDetalleEnvio', c.detalle_envio);
  set('cliBanco', c.banco);
  set('cliTipoCuenta', c.tipo_cuenta_bancaria);
  set('cliNroCuenta', c.nro_cuenta_bancaria);

  document.getElementById('clienteEditModal').classList.remove('hidden');
};

window.carCerrarEditar = function() {
  document.getElementById('clienteEditModal').classList.add('hidden');
  _cliEditando = null;
};

// PC2 11-jun PM · entry point para crear cliente desde otras pestañas (Cotizador)
// Abre el modal vacío, con razón social opcionalmente prellenada.
// El modal vive originalmente dentro de tabCartera (que está hidden cuando estamos en Cotizador).
// Lo movemos al body para que el `position:fixed` no quede ocluido por parent display:none.
window.carAbrirCrear = function(razonSocialPrefill) {
  _cliEditando = null;
  document.getElementById('clienteEditModalTitulo').textContent = 'Crear nuevo cliente';
  document.getElementById('clienteEditMsg').classList.add('hidden');
  // Limpiar todos los campos
  ['cliRazonSocial','cliRut','cliSucursal','cliClientePara','cliSegmento','cliResponsable','cliTags',
   'cliTelefono','cliEmail','cliDireccion','cliCiudad','cliRegion','cliSitioWeb','cliComentarios',
   'cliFormaPago','cliServRetiro','cliServRetiroGratis','cliServContenedor','cliServCert',
   'cliServCertFecha','cliServSegregacion','cliCobroFrecuencia','cliCobroMaterial','cliCondicionesPago',
   'cliCompraDonacion','cliDetalleEnvio','cliBanco','cliTipoCuenta','cliNroCuenta'
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const activo = document.getElementById('cliActivo'); if (activo) activo.value = 'true';
  if (razonSocialPrefill) {
    const rs = document.getElementById('cliRazonSocial');
    if (rs) rs.value = razonSocialPrefill;
  }
  const modal = document.getElementById('clienteEditModal');
  // Mover al body si todavía está dentro de tabCartera u otro container hidden
  if (modal && modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
};

window.carGuardarCliente = async function() {
  const razonSocial = document.getElementById('cliRazonSocial').value.trim();
  if (!razonSocial) {
    const msg = document.getElementById('clienteEditMsg');
    msg.textContent = 'La razón social es obligatoria.';
    msg.className = 'text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded';
    msg.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('clienteEditGuardarBtn');
  btn.disabled = true; btn.textContent = 'Guardando…';

  const val = id => { const el = document.getElementById(id); return el ? (el.value.trim() || null) : null; };

  const payload = {
    razon_social:          razonSocial,
    rut:                   val('cliRut'),
    sucursal_principal:    val('cliSucursal'),
    activo:                document.getElementById('cliActivo').value === 'true',
    cliente_para:          val('cliClientePara'),
    segmento:              val('cliSegmento'),
    responsable_cliente:   val('cliResponsable'),
    tags:                  val('cliTags'),
    telefono:              val('cliTelefono'),
    email:                 val('cliEmail'),
    direccion:             val('cliDireccion'),
    ciudad:                val('cliCiudad'),
    region:                val('cliRegion'),
    sitio_web:             val('cliSitioWeb'),
    comentarios:           val('cliComentarios'),
    forma_pago:            val('cliFormaPago'),
    serv_retiro:           val('cliServRetiro'),
    serv_retiro_gratis:    val('cliServRetiroGratis'),
    serv_contenedor:       val('cliServContenedor'),
    serv_certificacion:    val('cliServCert'),
    serv_certificado_fecha:val('cliServCertFecha'),
    serv_segregacion:      val('cliServSegregacion'),
    cobro_frecuencia:      val('cliCobroFrecuencia'),
    cobro_material:        val('cliCobroMaterial'),
    condiciones_pago:      val('cliCondicionesPago'),
    compra_donacion_venta: val('cliCompraDonacion'),
    detalle_envio:         val('cliDetalleEnvio'),
    banco:                 val('cliBanco'),
    tipo_cuenta_bancaria:  val('cliTipoCuenta'),
    nro_cuenta_bancaria:   val('cliNroCuenta'),
    updated_by:            currentUser || 'panel-rdo',
    updated_at:            new Date().toISOString(),
  };

  let error;
  if (_cliEditando) {
    // Edición
    ({ error } = await sb.schema('curated').from('clientes').update(payload).eq('cliente_id', _cliEditando));
  } else {
    // Creación — generar ID tipo 'cli_<timestamp>'
    payload.cliente_id = 'cli_' + Date.now();
    payload.created_by = currentUser || 'panel-rdo';
    ({ error } = await sb.schema('curated').from('clientes').insert(payload));
  }

  btn.disabled = false; btn.textContent = 'Guardar';

  const msg = document.getElementById('clienteEditMsg');
  if (error) {
    msg.textContent = 'Error: ' + error.message;
    msg.className = 'text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded';
    msg.classList.remove('hidden');
    return;
  }

  msg.textContent = _cliEditando ? '✓ Cliente actualizado.' : '✓ Cliente creado.';
  msg.className = 'text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded';
  msg.classList.remove('hidden');

  // PC2 11-jun PM · evento para otros consumidores (Cotizador autoselecciona)
  const wasCreating = !_cliEditando;
  const savedId = _cliEditando || payload.cliente_id;
  const savedRazon = payload.razon_social;
  if (wasCreating) {
    window.dispatchEvent(new CustomEvent('cliente:created', { detail: { cliente_id: savedId, razon_social: savedRazon } }));
  }

  setTimeout(() => {
    carCerrarEditar();
    if (typeof loadCartera === 'function') loadCartera();
  }, 1200);
};

window.carAplicarCategoria = async function() {
  if (!_cartDrawerClienteId) return;
  const nuevaCat = document.getElementById('carDrawerCatSelect').value;
  const motivo = document.getElementById('carDrawerCatMotivoInput').value.trim();
  const decididoPor = currentUser || 'desconocido';
  const msg = document.getElementById('carDrawerCatMsg');
  const btn = document.getElementById('carDrawerCatApplyBtn');
  msg.classList.add('hidden');
  btn.disabled = true; btn.textContent = 'Guardando…';

  // 1. Cerrar vigente anterior (si existía)
  const { error: e1 } = await sb.schema('curated').from('cartera_clientes_categoria')
    .update({ vigente: false }).eq('cliente_id', _cartDrawerClienteId).eq('vigente', true);
  if (e1) {
    msg.className = 'mt-2 text-xs p-2 rounded bg-red-50 text-red-700';
    msg.textContent = 'Error cerrando categoría previa: ' + e1.message;
    msg.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Aplicar';
    return;
  }
  // 2. Insertar nueva si nuevaCat no vacío
  if (nuevaCat) {
    const { error: e2 } = await sb.schema('curated').from('cartera_clientes_categoria').insert({
      cliente_id: _cartDrawerClienteId,
      categoria_id: nuevaCat,
      vigente: true,
      motivo_asignacion: motivo || null,
      asignado_por: decididoPor,
      created_by: decididoPor,
      updated_by: decididoPor
    });
    if (e2) {
      msg.className = 'mt-2 text-xs p-2 rounded bg-red-50 text-red-700';
      msg.textContent = 'Error asignando nueva categoría: ' + e2.message;
      msg.classList.remove('hidden');
      btn.disabled = false; btn.textContent = 'Aplicar';
      return;
    }
  }

  msg.className = 'mt-2 text-xs p-2 rounded bg-green-50 text-green-700';
  msg.textContent = nuevaCat ? 'Categoría aplicada.' : 'Categoría removida.';
  msg.classList.remove('hidden');
  btn.disabled = false; btn.textContent = 'Aplicar';

  await loadCarteraKpis();
  await loadCartera();
  // Refrescar drawer
  if (_cartDrawerClienteId) await carAbrirDrawer(_cartDrawerClienteId);
};

