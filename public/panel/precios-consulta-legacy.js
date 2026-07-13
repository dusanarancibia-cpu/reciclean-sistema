// ============================================================
// TAB PRECIOS — CONSULTA LEGACY (D-OP-04-v2 Ola 1.2)
// extraído de panel-rdo.html (antifragilidad panel, bloque 8)
//
// NOMBRE DELIBERADAMENTE NO AMBIGUO: este archivo es una herramienta de
// SOLO LECTURA para que Andrea consulte precios vigentes antes de negociar
// (curated.vw_materiales_sucursal_precios_vigente). NO es parte de la Mesa
// de Precios modularizada (public/panel/precios-shell.js, precios-domain.js,
// precios-state.js, precios-tenant.js, precios-read-model.js, precios-policy.js,
// precios-observability.js, precios-concurrency.js, precios-commands.js,
// precios-command-adapters.js, precios-ui-bindings.js, precios-render.js).
//
// Verificado antes de extraer (frontera explícitamente pedida por Dusan):
// - Cero overlap de tablas/RPC: este archivo lee vw_materiales_sucursal_precios_vigente
//   + v_panel_precio_inconsistencias + rpc consultar_permisos_usuario. La Mesa de
//   Precios modularizada no hace llamadas directas a Supabase en ninguno de sus
//   12 archivos (arquitectura domain/state/policy/commands, sin `sb.` ni `.rpc(`).
// - Cero overlap de DOM ids: este archivo usa prefijo `prec*`/`v4Prec*`.
//   La Mesa de Precios modularizada usa `mp*`/`bp*` (mpDetail, mpArchitectureShell,
//   bpDrawerLockWarn).
// - Cero referencias a Diego LLM ni al núcleo (v4Sync*/loadDiegoHealth/initV4Hero/_v4Top*).
//
// Sin IIFE (mismo patrón que los 7 bloques anteriores): el HTML de este tab
// (que se queda en panel-rdo.html) genera onclick/onchange/oninput inline por
// nombre suelto.
//
// Dependencias externas (documentadas, no ocultas):
// - Entrante: 2 dispatchers de tabs en panel-rdo.html llaman a initPrecios()
//   al cambiar al tab 'precios' (patrón preexistente, no introducido aquí).
// - Saliente: ninguna.
// ============================================================

// ============================================================
// PESTAÑA PRECIOS (D-OP-04-v2 Ola 1.2)
// Lectura curated.vw_materiales_sucursal_precios_vigente.
// Andrea consulta antes de negociar (qué precio defender).
// ============================================================

let _preciosIniciado = false;
let _preciosCache = [];        // resultado crudo de la vista
let _preciosBuscarTimer = null;
let _permisosUsuario = null;   // R-AUD-020 fix: cache de permisos del usuario actual

// R-AUD-020 fix (D-RAUD-020-FIX-001, Dusan 2026-05-24):
// Consulta permisos del usuario actual via RPC public.consultar_permisos_usuario.
// Default seguro: todos los flags en false si no hay fila en panel.permisos.
async function _loadPermisosUsuarioActual() {
  if (_permisosUsuario) return _permisosUsuario;
  const email = (typeof currentUser === 'string' && currentUser) ? currentUser : '';
  if (!email) {
    _permisosUsuario = { ver_precio_venta: false, ver_margenes: false, ver_finanzas: false, puede_gestionar_permisos: false };
    return _permisosUsuario;
  }
  try {
    const { data, error } = await sb.rpc('consultar_permisos_usuario', { p_email: email });
    if (error || !data || data.length === 0) {
      console.warn('[R-AUD-020] consultar_permisos_usuario fallback default seguro:', error);
      _permisosUsuario = { ver_precio_venta: false, ver_margenes: false, ver_finanzas: false, puede_gestionar_permisos: false };
    } else {
      _permisosUsuario = data[0];
    }
  } catch (e) {
    console.warn('[R-AUD-020] excepción RPC permisos, fallback default seguro:', e);
    _permisosUsuario = { ver_precio_venta: false, ver_margenes: false, ver_finanzas: false, puede_gestionar_permisos: false };
  }
  return _permisosUsuario;
}

// F19 · Cargar inconsistencias precio backend Pablo en tab Precios
async function _v4LoadPrecDispersion() {
  try {
    if (typeof sb === 'undefined') return;
    const { data, error } = await sb.from('v_panel_precio_inconsistencias').select('*').order('dispersion_pct', { ascending: false }).limit(50);
    const countEl = document.getElementById('v4PrecDispCount');
    const tableEl = document.getElementById('v4PrecDispTable');
    if (error || !data) { if (tableEl) tableEl.innerHTML = '<div class="text-amber-700">Error</div>'; return; }
    if (countEl) countEl.textContent = `${data.length} alertas`;
    if (data.length === 0) { if (tableEl) tableEl.innerHTML = '<div class="text-emerald-600 text-center py-2">Sin inconsistencias</div>'; return; }
    const safe = (s) => (s || '—').toString().replace(/</g, '&lt;');
    const fmtNum = (n) => Number(n || 0).toLocaleString('es-CL', { maximumFractionDigits: 0 });
    if (tableEl) {
      tableEl.innerHTML = `<table class="w-full text-xs"><thead class="text-amber-800 border-b border-amber-200"><tr>
        <th class="text-left py-1.5">Fecha</th><th class="text-left">Sucursal</th><th class="text-left">Material</th>
        <th class="text-right">Tickets</th><th class="text-right">Min</th><th class="text-right">Max</th><th class="text-right">Dispersión</th>
      </tr></thead><tbody>` + data.slice(0, 8).map(r => `<tr class="border-b border-amber-100 hover:bg-amber-100">
        <td class="py-1.5 text-stone-700">${safe(r.fecha)}</td>
        <td>${safe(r.sucursal)}</td>
        <td class="truncate">${safe(r.material_descripcion)}</td>
        <td class="text-right">${r.n_tickets}</td>
        <td class="text-right">$${fmtNum(r.precio_min)}</td>
        <td class="text-right">$${fmtNum(r.precio_max)}</td>
        <td class="text-right text-red-600 font-semibold">${Number(r.dispersion_pct).toFixed(1)}%</td>
      </tr>`).join('') + `</tbody></table>`;
    }
  } catch(e) { console.warn('[v4-prec-disp] fallo:', e); }
}

async function initPrecios() {
  // F19: cargar dispersión una vez por sesión
  if (!window._v4PrecDispLoaded) { window._v4PrecDispLoaded = true; _v4LoadPrecDispersion(); }
  if (_preciosIniciado) {
    // re-render con cache si ya está montado
    loadPrecios();
    return;
  }
  _preciosIniciado = true;

  // Cargar catálogos de filtros en paralelo
  const [matRes, sucRes] = await Promise.all([
    sb.schema('curated').from('materiales').select('material_id, nombre').eq('activo', true).order('nombre'),
    sb.schema('curated').from('sucursales').select('sucursal_id, nombre').eq('activa', true).order('nombre'),
  ]);

  const selMat = document.getElementById('precFiltroMaterial');
  (matRes.data || []).forEach(m => {
    const o = document.createElement('option');
    o.value = m.material_id; o.textContent = m.nombre;
    selMat.appendChild(o);
  });

  const selSuc = document.getElementById('precFiltroSucursal');
  (sucRes.data || []).forEach(s => {
    const o = document.createElement('option');
    o.value = s.sucursal_id; o.textContent = s.nombre;
    selSuc.appendChild(o);
  });

  await loadPrecios();
}

function loadPreciosBuscar(val) {
  clearTimeout(_preciosBuscarTimer);
  _preciosBuscarTimer = setTimeout(() => loadPrecios(), 300);
}

async function loadPrecios() {
  const div = document.getElementById('preciosTabla');
  div.innerHTML = '<div class="skeleton" aria-busy="true"></div>';

  // R-AUD-020 fix: cargar permisos ANTES de la query. Default seguro.
  const perm = await _loadPermisosUsuarioActual();
  const verVenta    = perm.ver_precio_venta === true;
  const verMargenes = perm.ver_margenes === true;

  const fmat = document.getElementById('precFiltroMaterial')?.value || '';
  const fsuc = document.getElementById('precFiltroSucursal')?.value || '';
  const buscar = (document.getElementById('precBuscar')?.value || '').trim().toLowerCase();
  const margenBajoOnly = document.getElementById('precMargenBajo')?.checked === true;

  // Cache de nombres material+sucursal en paralelo con la query principal
  const matCacheP = sb.schema('curated').from('materiales').select('material_id, nombre');
  const sucCacheP = sb.schema('curated').from('sucursales').select('sucursal_id, nombre');

  // R-AUD-020: defensa en profundidad — si no ve venta, NO solicitar precio_venta_clp.
  const selectCols = verVenta
    ? 'material_id, sucursal_id, vigencia_desde, vigencia_hasta, precio_compra_clp, precio_venta_clp, moneda, notas'
    : 'material_id, sucursal_id, vigencia_desde, vigencia_hasta, precio_compra_clp, moneda, notas';

  let q = sb.schema('curated').from('vw_materiales_sucursal_precios_vigente')
    .select(selectCols)
    .is('vigencia_hasta', null);   // solo vigentes (sin cierre de vigencia)
  if (fmat) q = q.eq('material_id', fmat);
  if (fsuc) q = q.eq('sucursal_id', fsuc);

  const { data, error } = await q.order('material_id').order('sucursal_id');

  if (error) {
    console.error('[D-OP-04-v2 1.2] loadPrecios error:', error);
    div.innerHTML = `<div class="p-5"><p class="text-red-600 mb-2">No se pudo cargar los precios vigentes.</p>
      <p class="text-xs text-stone-500">${escapeHtml(humanizeSupabaseError(error))}</p></div>`;
    if (typeof showToast === 'function') showToast(humanizeSupabaseError(error), 'error');
    return;
  }

  const [matCacheRes, sucCacheRes] = await Promise.all([matCacheP, sucCacheP]);
  const matMap = new Map(((matCacheRes && matCacheRes.data) || []).map(m => [m.material_id, m.nombre || m.material_id]));
  const sucMap = new Map(((sucCacheRes && sucCacheRes.data) || []).map(s => [s.sucursal_id, s.nombre || s.sucursal_id]));

  // Enriquecer con nombre + margen calculado, aplicar filtros frontend.
  // R-AUD-020: margen requiere ver_margenes (no solo ver_venta).
  let rows = (data || []).map(r => {
    const matNom = matMap.get(r.material_id) || r.material_id;
    const sucNom = sucMap.get(r.sucursal_id) || r.sucursal_id;
    const compra = Number(r.precio_compra_clp);
    const venta  = verVenta ? Number(r.precio_venta_clp) : null;
    const margenPct = (verMargenes && Number.isFinite(venta) && venta > 0)
      ? ((venta - compra) / venta) * 100
      : null;
    return { ...r, matNom, sucNom, margenPct };
  });

  if (buscar) rows = rows.filter(r => r.matNom.toLowerCase().includes(buscar));
  if (margenBajoOnly && verMargenes) rows = rows.filter(r => r.margenPct !== null && r.margenPct < 30);

  _preciosCache = rows;

  // KPIs (R-AUD-020: margen oculto si no tiene ver_margenes)
  document.getElementById('precKpiTotal').textContent = rows.length.toLocaleString('es-CL');
  document.getElementById('precKpiMateriales').textContent = new Set(rows.map(r => r.material_id)).size.toLocaleString('es-CL');
  if (verMargenes) {
    const margenes = rows.map(r => r.margenPct).filter(m => m !== null);
    document.getElementById('precKpiMargenProm').textContent = margenes.length
      ? (margenes.reduce((a, b) => a + b, 0) / margenes.length).toFixed(1) + '%'
      : '—';
    document.getElementById('precKpiMargenBajo').textContent = rows.filter(r => r.margenPct !== null && r.margenPct < 30).length.toLocaleString('es-CL');
  } else {
    const elProm = document.getElementById('precKpiMargenProm'); if (elProm) elProm.textContent = '🔒';
    const elBajo = document.getElementById('precKpiMargenBajo'); if (elBajo) elBajo.textContent = '🔒';
  }

  if (rows.length === 0) {
    div.innerHTML = `<div class="p-8 text-center">
      <p class="text-stone-400 text-base mb-1">Sin precios para este filtro.</p>
      <p class="text-xs text-stone-400">Probá quitar filtros o revisá que la vista <code>vw_materiales_sucursal_precios_vigente</code> tenga datos vigentes.</p>
    </div>`;
    return;
  }

  const fmtCLP_n = n => (n === null || n === undefined || Number.isNaN(Number(n)))
    ? '—'
    : '$' + Math.round(Number(n)).toLocaleString('es-CL');

  // R-AUD-020: render condicional según permisos.
  const rowsHtml = rows.map(r => {
    const margenCls = r.margenPct === null
      ? 'text-stone-400'
      : r.margenPct < 30
        ? 'text-red-600 font-bold'
        : r.margenPct < 50
          ? 'text-amber-700 font-semibold'
          : 'text-green-700 font-semibold';
    const ventaCell = verVenta
      ? `<td class="py-2 px-3 text-right text-stone-700">${fmtCLP_n(r.precio_venta_clp)}</td>`
      : '';
    const margenCell = verMargenes
      ? `<td class="py-2 px-3 text-right ${margenCls}">${r.margenPct !== null ? r.margenPct.toFixed(1) + '%' : '—'}</td>`
      : '';
    return `<tr class="border-b border-stone-100 hover:bg-stone-50"
        data-entity-type="material" data-entity-id="${escapeHtml(r.material_id)}" data-entity-nombre="${escapeHtml(r.matNom)}"
        title="Click-derecho: vínculos E360">
      <td class="py-2 px-3 font-medium text-stone-700">${escapeHtml(r.matNom)}</td>
      <td class="py-2 px-3 text-stone-600">${escapeHtml(r.sucNom)}</td>
      <td class="py-2 px-3 text-right text-stone-700">${fmtCLP_n(r.precio_compra_clp)}</td>
      ${ventaCell}
      ${margenCell}
      <td class="py-2 px-3 text-right text-stone-400 text-xs">${r.vigencia_desde ? new Date(r.vigencia_desde).toLocaleDateString('es-CL') : '—'}</td>
      <td class="py-2 px-3 text-stone-500 text-xs">${escapeHtml(r.notas || '')}</td>
    </tr>`;
  }).join('');

  const ventaTh   = verVenta    ? '<th class="py-2 px-3 text-right">Venta (CLP)</th>' : '';
  const margenTh  = verMargenes ? '<th class="py-2 px-3 text-right">Margen</th>' : '';
  const lockNote  = (!verVenta || !verMargenes)
    ? `<p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 m-3">🔒 Estás viendo solo precios de compra. Si necesitás ver venta o márgenes, pedile a Dusan que te active el permiso (panel.permisos).</p>`
    : '';

  div.innerHTML = `
    ${lockNote}
    <div class="table-responsive">
    <table class="min-w-full text-sm">
      <thead class="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
        <tr>
          <th class="py-2 px-3 text-left">Material</th>
          <th class="py-2 px-3 text-left">Sucursal</th>
          <th class="py-2 px-3 text-right">Compra (CLP)</th>
          ${ventaTh}
          ${margenTh}
          <th class="py-2 px-3 text-right">Vigencia desde</th>
          <th class="py-2 px-3 text-left">Notas</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    </div>
    <p class="text-xs text-stone-400 p-3">${rows.length} fila(s)${verMargenes ? ' · margen rojo &lt;30% · ámbar 30-50% · verde ≥50%' : ''}</p>`;
}
