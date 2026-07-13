// ============================================================
// PESTAÑA COTIZADOR — extraído de panel-rdo.html (antifragilidad del panel,
// 2026-07-13). Script clásico sin IIFE a propósito: panel-rdo.html sigue
// generando HTML con onclick/oninput que referencian estas funciones y
// variables (_cotLineas, agregarLineaCot, cotRecalcular, etc.) por nombre
// suelto — envolver esto en un IIFE las dejaría fuera del alcance global y
// rompería esos handlers. Mismo patrón de scope que tenía el código inline.
// ============================================================

let _cotizadorIniciado = false;
let _cotLineas = [];          // [{desc, qty, precioUF, descPct}]
let _cotDescuentosPisos = []; // rows de vw_descuentos_pisos_vigente
let _cotMargenMetas = [];     // rows de vw_margen_metas_vigente

async function initCotizador() {
  if (_cotizadorIniciado) return;
  _cotizadorIniciado = true;

  // SPEC V1.1 H14 · resolver permisos del usuario para mostrar/ocultar márgenes meta
  try {
    const __cotResolveEmail = () => {
      try { if (typeof currentUser !== 'undefined' && currentUser?.email) return String(currentUser.email).toLowerCase(); } catch (e) {}
      try { var s = JSON.parse(sessionStorage.getItem('rf_session') || 'null'); if (s?.email) return String(s.email).toLowerCase(); } catch (e) {}
      try { var ls = JSON.parse(localStorage.getItem('rf_session') || 'null'); if (ls?.email) return String(ls.email).toLowerCase(); } catch (e) {}
      try {
        var sbTok = JSON.parse(localStorage.getItem('sb-eknmtsrtfkzroxnovfqn-auth-token') || 'null');
        var em = sbTok?.user?.email || sbTok?.currentSession?.user?.email;
        if (em) return String(em).toLowerCase();
      } catch (e) {}
      return null;
    };
    const __email = __cotResolveEmail();
    if (__email) {
      const __permRes = await sb.rpc('cotizador_permisos', { p_email: __email });
      const __perm = __permRes?.data || { ver_margenes: false, es_admin: false };
      const __ver = !!(__perm.ver_margenes || __perm.es_admin);
      const __metaBlock = document.getElementById('cotMargenesMetaBlock');
      const __paramsBlock = document.getElementById('cotParamsVigentesBlock');
      if (__metaBlock) __metaBlock.classList.toggle('hidden', !__ver);
      if (__paramsBlock) __paramsBlock.classList.toggle('hidden', !__ver);
    }
  } catch (e) { console.warn('[H14] cotizador_permisos error (fallback hidden):', e); }

  // Cargar catálogos en paralelo
  const [sucRes, srvRes, tarRes, pisoRes, marRes] = await Promise.all([
    sb.schema('curated').from('sucursales').select('sucursal_id, nombre').eq('activa', true).order('nombre'),
    sb.schema('curated').from('servicios_catalogo').select('servicio_id, tipo, nombre, descripcion').eq('activo', true).order('tipo').order('nombre'),
    sb.schema('curated').from('vw_tarifas_uf_vigente').select('tarifa_id, nombre, monto_uf, tarifa_uf_por_km').order('nombre'),
    sb.schema('curated').from('vw_descuentos_pisos_vigente').select('nivel_autorizacion, descuento_max_pct').order('descuento_max_pct'),
    sb.schema('curated').from('vw_margen_metas_vigente').select('categoria_id, descripcion, margen_meta_pct, margen_minimo_pct').order('margen_meta_pct'),
  ]);

  // Sucursales
  const selSuc = document.getElementById('cotSucursal');
  (sucRes.data || []).forEach(s => {
    const o = document.createElement('option');
    o.value = s.sucursal_id; o.textContent = s.nombre;
    selSuc.appendChild(o);
  });

  // Servicios — hidden select (compat) + cards H05
  window._cotServiciosCatalogo = srvRes.data || [];
  const selSrv = document.getElementById('cotServicio');
  window._cotServiciosCatalogo.forEach(s => {
    const o = document.createElement('option');
    o.value = s.servicio_id;
    o.textContent = `[${escapeHtml(s.tipo)}] ${escapeHtml(s.nombre)}`;
    selSrv.appendChild(o);
  });
  renderServicioCards();

  // Tarifas — guardo el array completo para H07 (suma km)
  window._cotTarifasCatalogo = tarRes.data || [];
  const selTar = document.getElementById('cotTarifa');
  window._cotTarifasCatalogo.forEach(t => {
    const o = document.createElement('option');
    o.value = t.tarifa_id;
    const sufKm = (t.tarifa_uf_por_km != null) ? ` (+${Number(t.tarifa_uf_por_km).toFixed(4)} UF/km)` : '';
    o.textContent = `${escapeHtml(t.nombre)} — ${Number(t.monto_uf).toFixed(4)} UF${sufKm}`;
    selTar.appendChild(o);
  });

  // Pisos y márgenes en memoria
  _cotDescuentosPisos = pisoRes.data || [];
  _cotMargenMetas = marRes.data || [];

  // Mostrar parámetros en sidebar
  const paramsDiv = document.getElementById('cotParamsVigentes');
  let html = '';
  if (_cotDescuentosPisos.length) {
    html += '<p class="font-medium text-stone-600 mt-1">Pisos descuento:</p>';
    _cotDescuentosPisos.forEach(p => {
      html += `<p class="flex justify-between"><span>${escapeHtml(p.nivel_autorizacion)}</span><span class="font-mono">≤${Number(p.descuento_max_pct).toFixed(1)}%</span></p>`;
    });
  }
  if (_cotMargenMetas.length) {
    html += '<p class="font-medium text-stone-600 mt-2">Márgenes meta:</p>';
    _cotMargenMetas.forEach(m => {
      html += `<p class="flex justify-between"><span>${escapeHtml(m.categoria_id)}</span><span class="font-mono">mín ${Number(m.margen_minimo_pct).toFixed(1)}%</span></p>`;
    });
  }
  if (!html) html = '<p class="text-stone-400">Sin datos de cajas en BD todavía.</p>';
  paramsDiv.innerHTML = html;

  // Línea inicial vacía
  if (_cotLineas.length === 0) agregarLineaCot();
}

function agregarLineaCot() {
  // PR4 Fase 3: servicio_id por linea (default null = usa el del cotizador principal)
  _cotLineas.push({ desc: '', material_id: null, qty: 1, unidad: 'kg', precioUF: 0, descPct: 0, servicio_id: null });
  renderLineasCot();
}

// SPEC V1.1 H10 · autocomplete materiales por línea (usa RPC diego_buscar_material)
window._cotMatTimers = {};
window.cotMaterialBuscar = function (idx, val) {
  clearTimeout(window._cotMatTimers[idx]);
  const sug = document.getElementById('cotMaterialSug-' + idx);
  if (!sug) return;
  if (!val || val.trim().length < 2) { sug.classList.add('hidden'); sug.innerHTML = ''; return; }
  window._cotMatTimers[idx] = setTimeout(async () => {
    try {
      const { data, error } = await sb.rpc('diego_buscar_material', { p_query: val.trim(), p_limit: 6 });
      if (error) throw error;
      const rows = data || [];
      if (!rows.length) {
        sug.innerHTML = '<div class="px-2 py-1 text-[10px] text-stone-400 italic">Sin coincidencias en catálogo · podés escribir libre</div>';
        sug.classList.remove('hidden');
        return;
      }
      sug.innerHTML = rows.map(r =>
        `<div class="cot-mat-opt px-2 py-1 hover:bg-emerald-50 cursor-pointer text-xs border-b border-stone-100 last:border-0"
              data-idx="${idx}" data-id="${escapeHtml(r.material_id)}" data-nombre="${escapeHtml(r.nombre)}">
           <span class="font-medium">${escapeHtml(r.nombre)}</span>
           <span class="text-stone-400 text-[10px] ml-1">${escapeHtml(r.categoria || '')} · ${r.match_type}</span>
         </div>`
      ).join('');
      sug.classList.remove('hidden');
    } catch (e) {
      console.warn('[H10] buscar material:', e);
    }
  }, 300);
};
window.cotMaterialSeleccionar = function (idx, id, nombre) {
  if (!_cotLineas[idx]) return;
  _cotLineas[idx].desc = nombre;
  _cotLineas[idx].material_id = id;
  const sug = document.getElementById('cotMaterialSug-' + idx);
  if (sug) { sug.classList.add('hidden'); sug.innerHTML = ''; }
  renderLineasCot();
  cotRecalcular();
};
// Delegated click para opciones (sobrevive al re-render del tbody)
document.addEventListener('click', function (e) {
  const op = e.target.closest('.cot-mat-opt');
  if (op) {
    window.cotMaterialSeleccionar(parseInt(op.dataset.idx, 10), op.dataset.id, op.dataset.nombre);
  }
});

function eliminarLineaCot(idx) {
  _cotLineas.splice(idx, 1);
  renderLineasCot();
  cotRecalcular();
}

function renderLineasCot() {
  const tbody = document.getElementById('cotLineas');
  const UNIDADES = ['kg','t','u','m3','lt'];
  // PR4 Fase 3: opciones de servicio por linea (multi-servicio en una sola cotizacion)
  const servicios = window._cotServiciosCatalogo || [];
  const srvOptsFn = (selectedId) => {
    return '<option value="">— Usa servicio principal —</option>' +
      servicios.map(s => `<option value="${escapeHtml(s.servicio_id)}"${selectedId === s.servicio_id ? ' selected' : ''}>${escapeHtml(s.nombre)}</option>`).join('');
  };
  tbody.innerHTML = _cotLineas.map((l, i) => {
    if (!l.unidad) l.unidad = 'kg';
    if (l.servicio_id === undefined) l.servicio_id = null;
    const opts = UNIDADES.map(u => `<option value="${u}"${l.unidad===u?' selected':''}>${u}</option>`).join('');
    return `
    <tr class="border-b border-stone-100">
      <td class="py-1 pr-2 relative">
        <input type="text" value="${escapeHtml(l.desc)}" placeholder="Descripción / material…"
               aria-label="Descripción de la línea ${i + 1}"
               title="Escribí 2+ letras para ver sugerencias del catálogo. Si no aparece, escribilo libre."
               oninput="_cotLineas[${i}].desc = this.value; _cotLineas[${i}].material_id = null; window.cotMaterialBuscar(${i}, this.value)"
               autocomplete="off"
               class="w-full border border-stone-200 rounded px-2 py-1 text-sm focus:border-green-700 focus:outline-none">
        ${l.material_id ? '<span class="absolute right-2 top-2 text-emerald-600 text-xs" title="Vinculado a catálogo">✓</span>' : ''}
        <div id="cotMaterialSug-${i}" class="hidden absolute left-0 right-0 top-full mt-0.5 border border-stone-200 rounded bg-white shadow-lg z-30 max-h-48 overflow-y-auto"></div>
      </td>
      <td class="py-1 px-2">
        <select aria-label="Servicio de la linea ${i + 1}"
                title="Servicio especifico de esta linea. Vacio = usa el servicio principal del cotizador."
                onchange="_cotLineas[${i}].servicio_id = this.value || null; cotRecalcular()"
                class="cot-servicio border border-stone-200 rounded px-1 py-1 text-sm focus:border-green-700 focus:outline-none">
          ${srvOptsFn(l.servicio_id)}
        </select>
      </td>
      <td class="py-1 px-2">
        <input type="number" value="${l.qty}" min="0" step="any" inputmode="decimal"
               aria-label="Cantidad de la línea ${i + 1}"
               title="Cantidad numérica (sin importar la unidad)"
               oninput="_cotLineas[${i}].qty = parseFloat(this.value)||0; cotRecalcular()"
               class="cot-num border border-stone-200 rounded px-2 py-1 text-sm focus:border-green-700 focus:outline-none">
      </td>
      <td class="py-1 px-2 text-center">
        <select aria-label="Unidad de la línea ${i + 1}"
                title="Unidad de medida: kg, t (toneladas), u (unidades), m³, litros"
                onchange="_cotLineas[${i}].unidad = this.value; cotRecalcular()"
                class="cot-unidad border border-stone-200 rounded px-1 py-1 text-sm focus:border-green-700 focus:outline-none">
          ${opts}
        </select>
      </td>
      <td class="py-1 px-2">
        <input type="number" value="${l.precioUF}" min="0" step="any" inputmode="decimal"
               aria-label="Precio UF de la línea ${i + 1}"
               title="Precio en UF por unidad (la unidad elegida en la columna anterior)"
               oninput="_cotLineas[${i}].precioUF = parseFloat(this.value)||0; cotRecalcular()"
               class="cot-num border border-stone-200 rounded px-2 py-1 text-sm focus:border-green-700 focus:outline-none">
      </td>
      <td class="py-1 px-2">
        <input type="number" value="${l.descPct}" min="0" max="100" step="0.1"
               aria-label="Descuento porcentual de la línea ${i + 1}"
               title="Descuento aplicado a esta línea (0-100%)"
               oninput="_cotLineas[${i}].descPct = parseFloat(this.value)||0; cotRecalcular()"
               class="cot-num border border-stone-200 rounded px-2 py-1 text-sm focus:border-green-700 focus:outline-none">
      </td>
      <td class="py-1 px-2 text-right font-mono text-stone-700 cot-num" style="min-width: 90px;">
        ${window.fmtNum(l.qty * l.precioUF * (1 - l.descPct / 100), 'UF')}
      </td>
      <td class="py-1 px-2 text-center">
        <button onclick="eliminarLineaCot(${i})"
                aria-label="Eliminar línea ${i + 1}"
                title="Quitar esta línea de la cotización"
                class="text-slate-600 hover:text-red-500 text-base leading-none">×</button>
      </td>
    </tr>
  `;}).join('');
}

// SPEC V1.1 H13 · pizarra inteligente: llama EF diego-cotizador-parse y aplica los campos.
window.cotPizarraExtraer = async function () {
  const ta = document.getElementById('cotPizarraTexto');
  const btn = document.getElementById('cotPizarraExtraer');
  const status = document.getElementById('cotPizarraStatus');
  const resDiv = document.getElementById('cotPizarraResultado');
  const texto = (ta?.value || '').trim();
  if (!texto) { status.textContent = '⚠ Pegá algo antes de extraer.'; return; }
  if (texto.length < 15) { status.textContent = '⚠ Texto muy corto (mínimo 15 chars).'; return; }
  btn.disabled = true; btn.textContent = '🤖 Diego analizando…';
  status.textContent = '';
  resDiv.classList.add('hidden');
  try {
    const supabaseUrl = (sb?.supabaseUrl) || 'https://eknmtsrtfkzroxnovfqn.supabase.co';
    const supabaseKey = (sb?.supabaseKey) || sb?.rest?.headers?.apikey;
    const sess = await sb.auth.getSession();
    const accessToken = sess?.data?.session?.access_token;
    const resp = await fetch(`${supabaseUrl}/functions/v1/diego-cotizador-parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken || supabaseKey || ''}`,
        'apikey': supabaseKey || ''
      },
      body: JSON.stringify({ texto })
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    const p = data.parsed || {};
    const conf = Number(data.confidence || 0);
    cotPizarraAplicar(p, conf, data.usage);
    status.textContent = `✓ Aplicado · confianza ${(conf * 100).toFixed(0)}%`;
  } catch (e) {
    console.error('[H13] pizarra error:', e);
    status.textContent = '⚠ Error: ' + (e?.message || e);
  } finally {
    btn.disabled = false; btn.textContent = '🤖 Extraer con Diego';
  }
};
window.cotPizarraAplicar = function (parsed, confidence, usage) {
  const baja = confidence < 0.7;
  const resDiv = document.getElementById('cotPizarraResultado');
  // Cliente
  if (parsed.cliente_nombre) {
    const inp = document.getElementById('cotClienteBuscar');
    if (inp) { inp.value = parsed.cliente_nombre; document.getElementById('cotClienteId').value = ''; document.getElementById('cotClienteSeleccionado').textContent = 'libre: ' + parsed.cliente_nombre; }
  }
  // Sucursal
  if (parsed.sucursal_id) {
    const sel = document.getElementById('cotSucursal');
    if (sel && [...sel.options].some(o => o.value === parsed.sucursal_id)) {
      sel.value = parsed.sucursal_id;
      sel.dispatchEvent(new Event('change'));
    }
  }
  // Toggle cliente trae material
  if (typeof parsed.cliente_trae_material === 'boolean') {
    const chk = document.getElementById('cotClienteTraeMaterial');
    if (chk) { chk.checked = parsed.cliente_trae_material; if (typeof window.cotToggleClienteTraeMaterial === 'function') window.cotToggleClienteTraeMaterial(chk.checked); }
  }
  // Notas residuales
  if (parsed.notas_residuales) {
    const nt = document.getElementById('cotNotas');
    if (nt) nt.value = parsed.notas_residuales;
  }
  // Materiales: reemplaza _cotLineas
  if (Array.isArray(parsed.materiales) && parsed.materiales.length) {
    window._cotLineas = parsed.materiales.map(m => ({
      desc: m.desc || '',
      material_id: m.material_id || null,
      qty: Number(m.qty) || 1,
      unidad: ['kg','t','u','m3','lt'].includes(m.unidad) ? m.unidad : 'kg',
      precioUF: 0,
      descPct: 0
    }));
    if (typeof renderLineasCot === 'function') renderLineasCot();
  }
  // Resumen visual con razonamiento
  const cls = baja ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-emerald-400 bg-emerald-50 text-emerald-900';
  resDiv.className = 'mt-2 p-2 border-2 rounded text-xs ' + cls;
  resDiv.innerHTML =
    (baja ? '<strong>⚠ Confianza baja · verificá antes de guardar</strong><br>' : '<strong>✓ Extracción aplicada</strong><br>') +
    (parsed.razonamiento ? '<span class="italic">' + escapeHtml(String(parsed.razonamiento)) + '</span><br>' : '') +
    `<span class="text-stone-500">Confianza: ${(confidence * 100).toFixed(0)}%${usage ? ' · tokens ' + (usage.input_tokens || 0) + '→' + (usage.output_tokens || 0) : ''}</span>`;
  resDiv.classList.remove('hidden');
  if (typeof cotAutogenerarTitulo === 'function') cotAutogenerarTitulo();
  if (typeof cotRecalcular === 'function') cotRecalcular();
};
document.getElementById('cotPizarraExtraer')?.addEventListener('click', window.cotPizarraExtraer);
document.getElementById('cotPizarraToggle')?.addEventListener('click', () => {
  const body = document.getElementById('cotPizarraBody');
  const btn = document.getElementById('cotPizarraToggle');
  if (!body || !btn) return;
  const hidden = body.classList.toggle('hidden');
  btn.textContent = hidden ? 'mostrar' : 'ocultar';
});

// SPEC V1.1 H05 · cards visuales de servicio (reemplaza select plano).
// El select #cotServicio queda como fuente de verdad (compat con cotRecalcular).
window.cotServicioFamilia = function (s) {
  const t = (s.nombre + ' ' + (s.descripcion || '')).toLowerCase();
  if (/(arriendo|contenedor|jaula|volquete)/.test(t)) return { fam: 'arriendo', icon: '🏗️', cls: 'border-sky-300 bg-sky-50 hover:bg-sky-100',     active: 'border-sky-600 bg-sky-100 ring-2 ring-sky-300' };
  if (/(retiro|cami(o|ó)n|amplirrol|transporte|km|peoneta)/.test(t)) return { fam: 'retiro',  icon: '🚛', cls: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100', active: 'border-emerald-600 bg-emerald-100 ring-2 ring-emerald-300' };
  if (/(pesaje|certif|control|seguridad|disposici)/.test(t))         return { fam: 'pesaje',  icon: '⚖️', cls: 'border-purple-300 bg-purple-50 hover:bg-purple-100', active: 'border-purple-600 bg-purple-100 ring-2 ring-purple-300' };
  if (/(notar|destruc|segregac|limpie|adicional|fin de semana)/.test(t)) return { fam: 'otro', icon: '🧹', cls: 'border-stone-300 bg-stone-50 hover:bg-stone-100', active: 'border-stone-600 bg-stone-100 ring-2 ring-stone-300' };
  return { fam: 'otro', icon: '📦', cls: 'border-stone-300 bg-stone-50 hover:bg-stone-100', active: 'border-stone-600 bg-stone-100 ring-2 ring-stone-300' };
};
window.renderServicioCards = function () {
  const cont = document.getElementById('cotServicioCards');
  const sel = document.getElementById('cotServicio');
  const items = window._cotServiciosCatalogo || [];
  if (!cont) return;
  const seleccionado = sel ? sel.value : '';
  cont.innerHTML = items.map(s => {
    const f = window.cotServicioFamilia(s);
    const isActive = seleccionado === s.servicio_id;
    const desc = (s.descripcion || '').slice(0, 90);
    return `<button type="button" class="cot-srv-card text-left border-2 rounded-lg p-2 transition ${isActive ? f.active : f.cls}"
                    data-id="${escapeHtml(s.servicio_id)}"
                    title="${escapeHtml(s.descripcion || s.nombre)}">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-base leading-none">${f.icon}</span>
                <span class="text-xs font-semibold text-stone-800">${escapeHtml(s.nombre)}</span>
              </div>
              ${desc ? `<div class="text-[10px] text-stone-600 leading-tight">${escapeHtml(desc)}</div>` : ''}
            </button>`;
  }).join('');
  cont.querySelectorAll('.cot-srv-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.id;
      const cur = sel.value;
      sel.value = (cur === v) ? '' : v; // click otra vez = deseleccionar
      sel.dispatchEvent(new Event('change'));
      renderServicioCards();
      if (typeof cotAutogenerarTitulo === 'function') cotAutogenerarTitulo();
    });
  });
};

// SPEC V1.1 H07 · cálculo automático km sucursal → cliente vía EF google-maps-distance
window._cotKmCache = null;
window.cotKmCalcular = async function (force) {
  const sucursalId = document.getElementById('cotSucursal')?.value;
  const clienteId = document.getElementById('cotClienteId')?.value;
  const block = document.getElementById('cotKmBlock');
  const det = document.getElementById('cotKmDetalle');
  if (!sucursalId || !clienteId) { if (block) block.classList.add('hidden'); window._cotKmCache = null; return; }
  if (!force && window._cotKmCache && window._cotKmCache.k === sucursalId + '|' + clienteId) {
    cotKmRender(window._cotKmCache); return;
  }
  block.classList.remove('hidden');
  det.innerHTML = '<span class="text-stone-500">Resolviendo direcciones…</span>';
  try {
    const dirRes = await sb.rpc('cotizador_resolver_direcciones', { p_sucursal_id: sucursalId, p_cliente_id: clienteId });
    if (dirRes.error) throw dirRes.error;
    const dir = dirRes.data || {};
    const origin = dir.sucursal?.direccion_full;
    const destination = dir.cliente?.direccion_full;
    if (!destination) {
      det.innerHTML = '<span class="text-amber-700">⚠ Cliente sin dirección registrada — no se puede calcular km.</span>';
      window._cotKmCache = null;
      return;
    }
    det.innerHTML = '<span class="text-stone-500">Calculando ruta vía Google Maps…</span>';
    const supabaseUrl = (sb?.supabaseUrl) || 'https://eknmtsrtfkzroxnovfqn.supabase.co';
    const supabaseKey = (sb?.supabaseKey) || sb?.rest?.headers?.apikey || sb?.headers?.apikey;
    const sess = await sb.auth.getSession();
    const accessToken = sess?.data?.session?.access_token;
    const resp = await fetch(`${supabaseUrl}/functions/v1/google-maps-distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken || supabaseKey || ''}`,
        'apikey': supabaseKey || ''
      },
      body: JSON.stringify({ origin, destination })
    });
    if (!resp.ok) throw new Error(`google-maps-distance HTTP ${resp.status}`);
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || 'sin ruta');
    window._cotKmCache = { k: sucursalId + '|' + clienteId, km: data.distance_km, duration: data.duration_min, origin, destination };
    cotKmRender(window._cotKmCache);
  } catch (e) {
    console.warn('[H07] km calcular error:', e);
    det.innerHTML = '<span class="text-amber-700">⚠ No se pudo calcular: ' + escapeHtml(e?.message || String(e)) + '</span>';
  }
};
window.cotKmRender = function (cache) {
  const det = document.getElementById('cotKmDetalle');
  const tarifaSel = document.getElementById('cotTarifa');
  const tarifaId = tarifaSel?.value;
  const tarifas = window._cotTarifasCatalogo || [];
  const t = tarifas.find(x => x.tarifa_id === tarifaId);
  const km = cache?.km;
  let html = `<div>📍 ${escapeHtml(cache.origin || '—')} → ${escapeHtml(cache.destination || '—')}</div>` +
             `<div class="mt-1"><strong>${km} km</strong> · ${cache.duration} min</div>`;
  if (t) {
    const base = Number(t.monto_uf || 0);
    const perKm = t.tarifa_uf_por_km != null ? Number(t.tarifa_uf_por_km) : 0;
    const total = base + (perKm * km);
    if (perKm > 0) {
      html += `<div class="mt-1 font-mono text-sky-900">${window.fmtNum(base, 'UF')} UF base + ${km} km × ${window.fmtNum(perKm, 'UF')} = <strong>${window.fmtNum(total, 'UF')} UF</strong></div>`;
    } else {
      html += `<div class="mt-1 font-mono text-stone-600">tarifa elegida no cobra adicional por km (base ${window.fmtNum(base, 'UF')} UF)</div>`;
    }
  } else {
    html += `<div class="mt-1 text-stone-500">Elegí una tarifa base para ver el total con km</div>`;
  }
  det.innerHTML = html;
};

// Triggers
['cotSucursal','cotTarifa'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => { window.cotKmCalcular(); });
});
document.getElementById('cotKmRecalcular')?.addEventListener('click', () => { window.cotKmCalcular(true); });

// D-OP-04-v2 Ola 1.4 — mapeo perfil del panel → nivel_autorizacion de mig 029.
// La función f_validar_descuento espera: 'ceo' | 'jefe_comercial' | 'ejecutivo'.
function nivelAutorizacionDePerfil(perfil) {
  // Fase 4 · dual-vocab canónico {ceo,gerente}↔{dusan,admin}
  if (matchesProfile(['dusan','ceo','gerente'], perfil)) return 'ceo';
  if (perfil === 'jefe_comercial') return 'jefe_comercial';
  return 'ejecutivo';  // comercial, operaciones, operador_planta, externo, default → conservador
}

// Token incremental para descartar respuestas tardías de RPC f_validar_descuento.
let _cotValidacionToken = 0;

// === Quick wins UX cotizador 2026-05-28 ===
// H02 · toggle "cliente trae material": oculta servicio + tarifa cuando ON
window.cotToggleClienteTraeMaterial = function (checked) {
  const srv = document.getElementById('cotServicioBlock');
  const tarif = document.getElementById('cotTarifaBlock');
  const srvSel = document.getElementById('cotServicio');
  const tarSel = document.getElementById('cotTarifa');
  if (checked) {
    srv?.classList.add('hidden');
    tarif?.classList.add('hidden');
    if (srvSel) srvSel.value = '';
    if (tarSel) tarSel.value = '';
  } else {
    srv?.classList.remove('hidden');
    tarif?.classList.remove('hidden');
  }
  if (typeof cotAutogenerarTitulo === 'function') cotAutogenerarTitulo();
};

// F2 R-AUD-035 · Boton "Editar cliente" abre modal unico carAbrirEditar (reusa
// el de tab Cartera). Habilitado solo cuando hay cliente_id del catalogo.
window.cotEditarCliente = function () {
  const id = document.getElementById('cotClienteId')?.value;
  if (!id) return;
  if (typeof window.carAbrirEditar === 'function') {
    window.carAbrirEditar(id);
  } else {
    alert('Editor de cliente no disponible aun. Probar desde pestana Cartera.');
  }
};
window.cotRefrescarEditarClienteBtn = function () {
  const btn = document.getElementById('cotClienteEditarBtn');
  if (!btn) return;
  btn.disabled = !document.getElementById('cotClienteId')?.value;
};

// H04 · autogenerar título a partir de cliente + sucursal + servicio
window.cotTituloEditadoManual = false;
window.cotAutogenerarTitulo = function () {
  if (window.cotTituloEditadoManual) return;
  const cliente = document.getElementById('cotClienteBuscar')?.value?.trim() || '';
  const sucursalSel = document.getElementById('cotSucursal');
  const sucursalLabel = sucursalSel?.selectedOptions?.[0]?.textContent?.trim() || '';
  const trae = document.getElementById('cotClienteTraeMaterial')?.checked;
  const servicioSel = document.getElementById('cotServicio');
  const servicioLabel = servicioSel?.selectedOptions?.[0]?.textContent?.trim() || '';
  let titulo = '';
  if (cliente) {
    if (trae) titulo = `Compra material · ${cliente}${sucursalLabel ? ' · ' + sucursalLabel : ''}`;
    else if (servicioLabel && servicioLabel !== 'Seleccionar…') titulo = `${servicioLabel.replace(/^\[[A-Z]\]\s*/, '')} · ${cliente}${sucursalLabel ? ' · ' + sucursalLabel : ''}`;
    else titulo = `Cotización · ${cliente}${sucursalLabel ? ' · ' + sucursalLabel : ''}`;
  }
  const inp = document.getElementById('cotTitulo');
  if (inp && titulo) inp.value = titulo;
};
['cotClienteBuscar','cotSucursal','cotServicio'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', cotAutogenerarTitulo);
  if (el) el.addEventListener('input', cotAutogenerarTitulo);
});
// SPEC V1.1 H04 · botón ↻ regenera título y vuelve a modo auto
document.getElementById('cotTituloRegenerar')?.addEventListener('click', () => {
  window.cotTituloEditadoManual = false;
  cotAutogenerarTitulo();
});

function cotRecalcular() {
  renderLineasCot();
  const totalUF = _cotLineas.reduce((acc, l) => acc + l.qty * l.precioUF * (1 - l.descPct / 100), 0);
  const brutoUF = _cotLineas.reduce((acc, l) => acc + l.qty * l.precioUF, 0);
  const descProm = brutoUF > 0 ? (1 - totalUF / brutoUF) * 100 : 0;

  // SPEC V1.1 H09 · usar fmtNum central
  document.getElementById('cotTotalUF').textContent = window.fmtNum(totalUF, 'UF') + ' UF';
  document.getElementById('cotDescProm').textContent = window.fmtNum(descProm, 'pct');

  // D-OP-04-v2 Ola 1.4 — validación cruzada via curated.f_validar_descuento (mig 029 D-OP-06).
  // Si hay cliente seleccionado: pide veredicto real por categoría del cliente + rol del usuario.
  // Si no hay cliente: cae al cálculo global referencial (igual que antes).
  const pisoEl = document.getElementById('cotPisoStatus');
  const clienteId = document.getElementById('cotClienteId')?.value;

  if (clienteId && brutoUF > 0) {
    const myToken = ++_cotValidacionToken;
    pisoEl.textContent = '⏳';
    pisoEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-stone-100 text-stone-400';
    pisoEl.title = 'Validando descuento vs categoría cliente…';

    sb.schema('curated').rpc('f_validar_descuento', {
      p_cliente_id: clienteId,
      p_nivel_autorizacion: nivelAutorizacionDePerfil(currentProfile),
      p_descuento_propuesto: Number(descProm.toFixed(2))
    }).then(({ data, error }) => {
      if (myToken !== _cotValidacionToken) return;  // respuesta vieja, descartar
      if (error) {
        console.error('[D-OP-04-v2 1.4] f_validar_descuento error:', error);
        pisoEl.textContent = '⚠ sin validar';
        pisoEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-700';
        pisoEl.title = humanizeSupabaseError(error);
        return;
      }
      const r = data || {};
      if (r.aprobado === true) {
        pisoEl.textContent = `✅ OK · ${r.categoria || ''} ≤${(r.descuento_max_pct ?? 0)}%`;
        pisoEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700';
        pisoEl.title = r.mensaje || '';
      } else {
        pisoEl.textContent = `⚠ Excede tope ${r.descuento_max_pct ?? '?'}% · escalar a ${r.requiere_visto || 'ceo'}`;
        pisoEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-600';
        pisoEl.title = r.mensaje || 'Descuento excede tope para la categoría del cliente.';
      }
    });
  } else if (_cotDescuentosPisos.length) {
    // Sin cliente: referencial con el max global de la matriz (comportamiento previo).
    const maxDesc = Math.max(..._cotDescuentosPisos.map(p => p.descuento_max_pct));
    if (descProm <= maxDesc) {
      pisoEl.textContent = `✅ OK · referencia ≤${maxDesc.toFixed(1)}%`;
      pisoEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700';
    } else {
      pisoEl.textContent = `⚠ Excede referencia ${maxDesc.toFixed(1)}%`;
      pisoEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-600';
    }
    pisoEl.title = 'Sin cliente seleccionado: validación referencial. Seleccione cliente para validación por categoría.';
  } else {
    pisoEl.textContent = '—';
    pisoEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-stone-100 text-stone-400';
    pisoEl.title = '';
  }

  // Validar margen (solo referencial con meta mínimo si hay datos)
  const margenEl = document.getElementById('cotMargenStatus');
  if (_cotMargenMetas.length && brutoUF > 0) {
    const minMargen = Math.min(..._cotMargenMetas.map(m => m.margen_minimo_pct));
    const margenEst = ((totalUF - brutoUF * 0.6) / totalUF) * 100; // estimación simple (60% costo)
    if (margenEst >= minMargen) {
      margenEl.textContent = `~${margenEst.toFixed(1)}% ✅`;
      margenEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700';
    } else {
      margenEl.textContent = `~${margenEst.toFixed(1)}% ⚠`;
      margenEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-700';
    }
  } else {
    margenEl.textContent = '—';
    margenEl.className = 'text-xs font-semibold px-2 py-1 rounded bg-stone-100 text-stone-400';
  }
}

// Autocomplete cliente
let _cotClienteTimer = null;
async function buscarClienteCotizador(val) {
  clearTimeout(_cotClienteTimer);
  const sug = document.getElementById('cotClienteSugerencias');
  const crearBtn = document.getElementById('cotClienteCrearBtn');
  // Resetear: si el usuario edita después de seleccionar, limpiar cliente_id
  const hidden = document.getElementById('cotClienteId');
  if (hidden && hidden.value) {
    hidden.value = '';
    document.getElementById('cotClienteSeleccionado').textContent = '';
    if (typeof cotRefrescarEditarClienteBtn === 'function') cotRefrescarEditarClienteBtn();
  }
  if (val.trim().length < 2) {
    sug.classList.add('hidden');
    if (crearBtn) crearBtn.classList.add('hidden');
    return;
  }
  _cotClienteTimer = setTimeout(async () => {
    const { data } = await sb.schema('curated').from('clientes')
      .select('cliente_id, razon_social, rut')
      .or(`razon_social.ilike.%${val}%,rut.ilike.%${val}%`)
      .eq('activo', true).limit(8);
    if (!data || data.length === 0) {
      sug.classList.add('hidden');
      if (crearBtn) crearBtn.classList.remove('hidden');
      return;
    }
    if (crearBtn) crearBtn.classList.add('hidden');
    sug.innerHTML = data.map(c =>
      `<div class="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-stone-100 last:border-0"
            onclick="seleccionarClienteCot('${escapeHtml(c.cliente_id)}','${escapeHtml(c.razon_social.replace(/'/g,"&#39;"))}')">
         <span class="font-medium">${escapeHtml(c.razon_social)}</span>
         <span class="text-stone-400 text-xs ml-2">${escapeHtml(c.rut || '')}</span>
       </div>`
    ).join('');
    sug.classList.remove('hidden');
  }, 300);
}

// PC2 11-jun PM · cierre deuda DeepSeek post-merge #273
// Abre modal Cartera (carAbrirEditar con id=null) con razón social prellenada.
// Tras guardar exitoso, evento 'cliente:created' autoselecciona en Cotizador.
window.cotAbrirCrearCliente = function() {
  const txt = document.getElementById('cotClienteBuscar')?.value?.trim() || '';
  // Si no existe el modal en este perfil, fallback a alert
  if (typeof window.carAbrirCrear !== 'function') {
    alert('El editor de cliente no está cargado. Probá desde la pestaña Cartera y volvé.');
    return;
  }
  window._cotEsperandoClienteNuevo = true;
  window.carAbrirCrear(txt);
};

// Escucha evento emitido tras crear cliente exitoso desde el modal de Cartera
window.addEventListener('cliente:created', (e) => {
  if (!window._cotEsperandoClienteNuevo) return;
  window._cotEsperandoClienteNuevo = false;
  const { cliente_id, razon_social } = e.detail || {};
  if (!cliente_id) return;
  // Autoseleccionar en Cotizador
  if (typeof window.seleccionarClienteCot === 'function') {
    window.seleccionarClienteCot(cliente_id, razon_social || '');
  }
  // Ocultar botón crear
  document.getElementById('cotClienteCrearBtn')?.classList.add('hidden');
});

function seleccionarClienteCot(id, nombre) {
  document.getElementById('cotClienteId').value = id;
  document.getElementById('cotClienteBuscar').value = nombre;
  document.getElementById('cotClienteSeleccionado').textContent = '✔ ' + nombre;
  document.getElementById('cotClienteSugerencias').classList.add('hidden');
  if (typeof cotRefrescarEditarClienteBtn === 'function') cotRefrescarEditarClienteBtn();
  // D-OP-04-v2 Ola 1.4 — re-disparar validación con cliente recién elegido.
  if (typeof cotRecalcular === 'function') cotRecalcular();
  // SPEC V1.1 H07 · disparar cálculo km con cliente nuevo
  if (typeof window.cotKmCalcular === 'function') window.cotKmCalcular();
}

async function guardarCotizacion() {
  const titulo   = document.getElementById('cotTitulo').value.trim();
  const clienteId = document.getElementById('cotClienteId').value;
  const clienteNombreLibre = document.getElementById('cotClienteBuscar').value.trim();
  const sucursalId = document.getElementById('cotSucursal').value;
  const servicioId = document.getElementById('cotServicio').value;
  const notas    = document.getElementById('cotNotas').value.trim();
  const resDiv   = document.getElementById('cotResultado');

  if (!titulo) {
    resDiv.className = 'text-sm p-3 rounded bg-red-50 text-red-700';
    resDiv.textContent = '❌ El título es obligatorio.';
    resDiv.classList.remove('hidden');
    return;
  }
  if (!clienteId && !clienteNombreLibre) {
    resDiv.className = 'text-sm p-3 rounded bg-red-50 text-red-700';
    resDiv.textContent = '❌ Selecciona o escribe un cliente.';
    resDiv.classList.remove('hidden');
    return;
  }
  if (!sucursalId) {
    resDiv.className = 'text-sm p-3 rounded bg-red-50 text-red-700';
    resDiv.textContent = '❌ Selecciona una sucursal.';
    resDiv.classList.remove('hidden');
    return;
  }
  if (_cotLineas.length === 0 || _cotLineas.every(l => l.precioUF === 0)) {
    resDiv.className = 'text-sm p-3 rounded bg-red-50 text-red-700';
    resDiv.textContent = '❌ Agrega al menos una línea con precio > 0.';
    resDiv.classList.remove('hidden');
    return;
  }

  const totalUF = _cotLineas.reduce((acc, l) => acc + l.qty * l.precioUF * (1 - l.descPct / 100), 0);

  const btn = document.getElementById('cotGuardarBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Guardando…';

  // F4 mig 169 · RPC cotizador_guardar_v1 SECURITY DEFINER.
  // Atomico: INSERT curated.oportunidades + encola sync Impulsa async +
  // registra afirmacion R-AUD-024. Reemplaza INSERT directo (R-AUD-032).
  const traeMaterial = !!document.getElementById('cotClienteTraeMaterial')?.checked;
  const rpcRes = await sb.rpc('cotizador_guardar_v1', {
    p_titulo: titulo,
    p_cliente_id: clienteId || null,
    p_cliente_nombre_libre: clienteId ? null : (clienteNombreLibre || null),
    p_sucursal_id: sucursalId,
    p_servicio_id: servicioId || null,
    p_notas: notas || null,
    p_cliente_trae_material: traeMaterial,
    p_lineas: _cotLineas,
    p_valor_estimado_uf: totalUF
  });
  const data = rpcRes.data;
  const error = rpcRes.error || ((data && data.ok === false) ? { message: String(data.error || 'desconocido') } : null);

  btn.disabled = false;
  btn.textContent = '✅ Guardar cotización';

  if (error) {
    // Quick win H15 · mensaje de error legible + sugerencia accionable
    const msgTec = String(error.message || '');
    let humano = msgTec;
    let sugerencia = '';
    if (/titulo_requerido/i.test(msgTec)) {
      humano = 'Falta completar el título de la cotización';
    } else if (/sucursal_requerida/i.test(msgTec)) {
      humano = 'Falta elegir una sucursal';
    } else if (/cliente_requerido/i.test(msgTec)) {
      humano = 'Falta elegir o escribir el cliente';
    } else if (/lineas_requeridas/i.test(msgTec)) {
      humano = 'Agregá al menos una línea de cotización';
    } else if (/permission denied/i.test(msgTec)) {
      humano = 'No tenés permiso para guardar cotizaciones todavía';
      sugerencia = 'Avisale a Pablo o pedile a Diego: "no puedo guardar cotizaciones".';
    } else if (/foreign key|violates foreign/i.test(msgTec)) {
      humano = 'Algún dato no existe en el catálogo (cliente, sucursal o material)';
      sugerencia = 'Verificá los desplegables · si falta, Diego te lo da de alta.';
    } else if (/duplicate key|already exists/i.test(msgTec)) {
      humano = 'Ya existe una cotización igual';
      sugerencia = 'Revisá la pestaña Negocios — quizás ya la guardaste.';
    } else if (/network|timeout|fetch/i.test(msgTec)) {
      humano = 'Sin conexión o el servidor tardó demasiado';
      sugerencia = 'Probá refrescar la página y guardar de nuevo en 30 seg.';
    }
    resDiv.className = 'text-sm p-3 rounded bg-red-50 text-red-700';
    resDiv.innerHTML = `❌ No se pudo guardar: <strong>${humano}</strong>.${sugerencia ? '<br>👉 ' + sugerencia : ''}<br><span class="text-xs text-stone-400">(detalle técnico: ${msgTec.slice(0,150)})</span>`;
    resDiv.classList.remove('hidden');
    return;
  }

  // ============================================================
  // Quick win PDF 2026-05-28 · genera PDF + signed URL post-INSERT
  // ============================================================
  resDiv.className = 'text-sm p-3 rounded bg-green-50 text-green-800';
  const opId = data.oportunidad_id;
  resDiv.innerHTML = `✅ <strong>Cotización guardada</strong> (ID: ${opId.slice(0,8)}…). Visible en pestaña Negocios.<br><span id="cotPdfStatus" class="text-xs inline-flex items-center gap-2 mt-2"><span class="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span> Generando PDF…</span>`;
  resDiv.classList.remove('hidden');

  // NO reseteo el formulario inmediatamente para que Andrea pueda ver el botón "Descargar PDF"
  // hasta que aprete descargar o cierre el mensaje.
  generarPdfCotizacion(opId).then((pdfRes) => {
    const statusEl = document.getElementById('cotPdfStatus');
    if (!statusEl) return;
    if (pdfRes && pdfRes.ok && pdfRes.signed_url) {
      statusEl.outerHTML = `<a id="cotPdfBtn" href="${pdfRes.signed_url}" target="_blank" rel="noopener" download="cotizacion-${opId.slice(0,8)}.pdf" class="inline-block mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded px-4 py-2 text-sm shadow">📄 Descargar PDF (${(pdfRes.size_bytes/1024).toFixed(1)} KB)</a>`;
    } else {
      const errMsg = pdfRes?.error ? String(pdfRes.error).slice(0, 100) : 'desconocido';
      statusEl.outerHTML = `<span class="mt-2 inline-block text-amber-700 text-xs">⚠️ No se pudo generar el PDF. Pedile a Diego que lo intente. <span class="text-stone-400">(${errMsg})</span></span>`;
    }
  }).catch((e) => {
    const statusEl = document.getElementById('cotPdfStatus');
    if (statusEl) statusEl.outerHTML = `<span class="mt-2 inline-block text-amber-700 text-xs">⚠️ No se pudo generar el PDF. Pedile a Diego que lo intente. <span class="text-stone-400">(${String(e?.message || e).slice(0,80)})</span></span>`;
  });

  // Reset formulario
  document.getElementById('cotTitulo').value = '';
  document.getElementById('cotClienteId').value = '';
  document.getElementById('cotClienteBuscar').value = '';
  document.getElementById('cotClienteSeleccionado').textContent = '';
  if (typeof cotRefrescarEditarClienteBtn === 'function') cotRefrescarEditarClienteBtn();
  document.getElementById('cotSucursal').value = '';
  document.getElementById('cotServicio').value = '';
  document.getElementById('cotNotas').value = '';
  if (typeof cotTituloEditadoManual !== 'undefined') window.cotTituloEditadoManual = false;
  const traeMat = document.getElementById('cotClienteTraeMaterial');
  if (traeMat && traeMat.checked) { traeMat.checked = false; if (typeof cotToggleClienteTraeMaterial === 'function') cotToggleClienteTraeMaterial(false); }
  _cotLineas = [];
  agregarLineaCot();
  cotRecalcular();
}

// Llama a la EF generar-pdf-cotizacion y devuelve { ok, signed_url, size_bytes, error? }
async function generarPdfCotizacion(oportunidad_id) {
  try {
    const SUPA_URL = 'https://eknmtsrtfkzroxnovfqn.supabase.co';
    const ANON = (window.sb?.supabaseKey) || (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : null);
    const headers = { 'Content-Type': 'application/json' };
    if (ANON) { headers['apikey'] = ANON; headers['Authorization'] = `Bearer ${ANON}`; }
    const sess = await (window.sb?.auth?.getSession?.() ?? Promise.resolve({ data: { session: null } }));
    const tok = sess?.data?.session?.access_token;
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
    const r = await fetch(`${SUPA_URL}/functions/v1/generar-pdf-cotizacion`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ oportunidad_id })
    });
    if (!r.ok) {
      let bodyTxt = '';
      try { bodyTxt = await r.text(); } catch {}
      return { ok: false, error: `HTTP ${r.status}: ${bodyTxt.slice(0,120)}` };
    }
    return await r.json();
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}
