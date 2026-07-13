// ============================================================
// TAB CIERRES (D-OP-09) — extraído de panel-rdo.html (antifragilidad panel, bloque 8)
// Lectura curated.vw_cierre_mes_actual.
//
// Sin IIFE (mismo patrón que los 7 bloques anteriores): el HTML de este tab
// (que se queda en panel-rdo.html) genera onclick inline por nombre suelto.
//
// Dependencias externas (documentadas, no ocultas):
// - Entrante: dispatcher central de tabs en panel-rdo.html llama a loadCierres()
//   al cambiar de tab.
// - Saliente: ninguna hacia otros módulos, Diego LLM, el núcleo ni Mesa de Precios.
// - Usa formatters globales pre-existentes (fmtCLP/fmtPct/fmtNum) que se quedan
//   en panel-rdo.html por ser compartidos por múltiples módulos ya extraídos
//   (operaciones-dia.js, cotizador.js).
// ============================================================

async function loadCierres() {
  const div = document.getElementById('cierresTabla');
  div.innerHTML = '<div class="skeleton" aria-busy="true"></div>';

  // Cache empresas+sucursales en paralelo con la query principal
  const empresasP = sb.schema('curated').from('empresas_grupo').select('empresa_id, razon_social');
  const sucursalesP = ensureSucursalesCache();

  const { data, error } = await sb.schema('curated').from('vw_cierre_mes_actual')
    .select('empresa_id, sucursal_id, entrantes_mes, salientes_mes, flujo_neto_mes, margen_promedio_mes, proyeccion_actualizada, ultimo_cierre_diario')
    .order('empresa_id', { ascending: true })
    .order('sucursal_id', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('[D-OP-09] loadCierres error:', error);
    div.innerHTML = `<div class="p-5"><p class="text-red-600 mb-2">No se pudo cargar los cierres del mes.</p>
      <p class="text-xs text-stone-500">${escapeHtml(humanizeSupabaseError(error))}</p></div>`;
    showToast(humanizeSupabaseError(error), 'error');
    return;
  }

  const [empResp, sucArr] = await Promise.all([empresasP, sucursalesP]);
  const empMap = new Map(((empResp && empResp.data) || []).map(e => [e.empresa_id, e.razon_social || e.empresa_id]));
  const sucMap = new Map((sucArr || []).map(s => [s.sucursal_id, s.nombre || s.sucursal_id]));

  // KPIs agregados del mes (suma todas las filas visibles)
  const totales = (data || []).reduce((acc, r) => ({
    entrantes: acc.entrantes + Number(r.entrantes_mes || 0),
    salientes: acc.salientes + Number(r.salientes_mes || 0),
    flujo:     acc.flujo     + Number(r.flujo_neto_mes || 0),
    margenSum: acc.margenSum + (r.margen_promedio_mes != null ? Number(r.margen_promedio_mes) : 0),
    margenN:   acc.margenN   + (r.margen_promedio_mes != null ? 1 : 0),
  }), { entrantes: 0, salientes: 0, flujo: 0, margenSum: 0, margenN: 0 });

  document.getElementById('cierresKpiEntrantes').textContent  = fmtCLP(totales.entrantes);
  document.getElementById('cierresKpiSalientes').textContent  = fmtCLP(totales.salientes);
  const flujoEl = document.getElementById('cierresKpiFlujoNeto');
  flujoEl.textContent = fmtCLP(totales.flujo);
  flujoEl.className = 'text-xl font-bold ' + (totales.flujo >= 0 ? 'text-green-700' : 'text-red-600');
  document.getElementById('cierresKpiMargen').textContent = totales.margenN > 0
    ? fmtPct(totales.margenSum / totales.margenN)
    : '—';

  const ultActualizadoMax = (data || [])
    .map(r => r.ultimo_cierre_diario)
    .filter(Boolean)
    .sort()
    .pop();
  document.getElementById('cierresUltActualizado').textContent = ultActualizadoMax
    ? 'Último cierre diario: ' + new Date(ultActualizadoMax).toLocaleDateString('es-CL')
    : 'Sin cierres este mes';

  if (!data || data.length === 0) {
    div.innerHTML = `<div class="p-8 text-center">
      <p class="text-stone-400 text-base mb-1">No hay cierres diarios cargados este mes.</p>
      <p class="text-xs text-stone-400">Dyana arranca la planilla mensual el día 1 hábil. El ETL nocturno corre todos los días a las 23:55.</p>
    </div>`;
    return;
  }

  const rowsHtml = data.map(r => {
    const empNom = empMap.get(r.empresa_id) || r.empresa_id;
    const sucNom = r.sucursal_id ? (sucMap.get(r.sucursal_id) || r.sucursal_id) : '<span class="text-stone-400 italic">consolidado</span>';
    const flujoCls = Number(r.flujo_neto_mes || 0) >= 0 ? 'text-green-700' : 'text-red-600';
    return `<tr class="border-b border-stone-100 hover:bg-stone-50 cursor-pointer"
              onclick="verCierresDetalle('${escapeHtml(r.empresa_id)}', ${r.sucursal_id ? `'${escapeHtml(r.sucursal_id)}'` : 'null'}, '${escapeHtml(empNom)}', ${r.sucursal_id ? `'${escapeHtml(sucNom)}'` : 'null'})">
      <td class="py-2 px-3 font-semibold text-stone-700">${escapeHtml(empNom)}</td>
      <td class="py-2 px-3 text-stone-600">${sucNom}</td>
      <td class="py-2 px-3 text-right text-stone-700">${fmtCLP(r.entrantes_mes)}</td>
      <td class="py-2 px-3 text-right text-stone-700">${fmtCLP(r.salientes_mes)}</td>
      <td class="py-2 px-3 text-right font-bold ${flujoCls}">${fmtCLP(r.flujo_neto_mes)}</td>
      <td class="py-2 px-3 text-right text-stone-600">${fmtPct(r.margen_promedio_mes)}</td>
      <td class="py-2 px-3 text-right text-stone-400 text-xs">${r.ultimo_cierre_diario ? new Date(r.ultimo_cierre_diario).toLocaleDateString('es-CL') : '—'}</td>
    </tr>`;
  }).join('');

  div.innerHTML = `
    <div class="table-responsive">
    <table class="min-w-full text-sm">
      <thead class="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
        <tr>
          <th class="py-2 px-3 text-left">Empresa</th>
          <th class="py-2 px-3 text-left">Sucursal</th>
          <th class="py-2 px-3 text-right">Entrantes</th>
          <th class="py-2 px-3 text-right">Salientes</th>
          <th class="py-2 px-3 text-right">Flujo neto</th>
          <th class="py-2 px-3 text-right">Margen ø</th>
          <th class="py-2 px-3 text-right">Últ. cierre D</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    </div>
    <p class="text-xs text-stone-400 p-3">${data.length} fila(s) · mes actual · click en una fila para ver el detalle diario</p>`;
}

async function verCierresDetalle(empresaId, sucursalId, empNom, sucNom) {
  const drawer = document.getElementById('cierresDetalle');
  const title  = document.getElementById('cierresDetalleTitle');
  const cont   = document.getElementById('cierresDetalleContenido');
  title.textContent = `${empNom}${sucNom ? ' · ' + sucNom : ' · consolidado'} — detalle diario`;
  cont.innerHTML = '<div class="skeleton" aria-busy="true"></div>';
  drawer.classList.remove('hidden');
  drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Cierres diarios del mes actual para esta empresa/sucursal
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const fechaDesde = firstOfMonth.toISOString().slice(0, 10);

  let q = sb.schema('curated').from('cierres')
    .select('fecha, saldo_caja_clp, saldo_banco_clp, saldo_total_clp, pagos_entrantes_clp, pagos_salientes_clp, flujo_neto_clp, margen_estimado_pct, proyeccion_mes_rolling_clp')
    .eq('granularidad', 'D')
    .eq('empresa_id', empresaId)
    .gte('fecha', fechaDesde)
    .order('fecha', { ascending: false });
  q = sucursalId ? q.eq('sucursal_id', sucursalId) : q.is('sucursal_id', null);

  const { data, error } = await q;
  if (error) {
    cont.innerHTML = `<p class="text-red-600">${escapeHtml(humanizeSupabaseError(error))}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    cont.innerHTML = '<p class="text-stone-400">Sin cierres diarios cargados para este combo este mes.</p>';
    return;
  }

  cont.innerHTML = `
    <div class="table-responsive">
    <table class="min-w-full text-sm">
      <thead class="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
        <tr>
          <th class="py-2 px-3 text-left">Fecha</th>
          <th class="py-2 px-3 text-right">Caja</th>
          <th class="py-2 px-3 text-right">Banco</th>
          <th class="py-2 px-3 text-right">Total</th>
          <th class="py-2 px-3 text-right">Entrantes D</th>
          <th class="py-2 px-3 text-right">Salientes D</th>
          <th class="py-2 px-3 text-right">Flujo D</th>
          <th class="py-2 px-3 text-right">Margen</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(d => {
          const flujoCls = Number(d.flujo_neto_clp || 0) >= 0 ? 'text-green-700' : 'text-red-600';
          return `<tr class="border-b border-stone-100">
            <td class="py-1.5 px-3 text-stone-700">${new Date(d.fecha).toLocaleDateString('es-CL')}</td>
            <td class="py-1.5 px-3 text-right text-stone-600">${fmtCLP(d.saldo_caja_clp)}</td>
            <td class="py-1.5 px-3 text-right text-stone-600">${fmtCLP(d.saldo_banco_clp)}</td>
            <td class="py-1.5 px-3 text-right text-stone-700 font-semibold">${fmtCLP(d.saldo_total_clp)}</td>
            <td class="py-1.5 px-3 text-right text-stone-600">${fmtCLP(d.pagos_entrantes_clp)}</td>
            <td class="py-1.5 px-3 text-right text-stone-600">${fmtCLP(d.pagos_salientes_clp)}</td>
            <td class="py-1.5 px-3 text-right ${flujoCls} font-semibold">${fmtCLP(d.flujo_neto_clp)}</td>
            <td class="py-1.5 px-3 text-right text-stone-600">${fmtPct(d.margen_estimado_pct)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
    <p class="text-xs text-stone-400 p-3">${data.length} día(s) cerrado(s) este mes · ordenado más reciente primero</p>`;
}

function cerrarCierresDetalle() {
  document.getElementById('cierresDetalle').classList.add('hidden');
}
