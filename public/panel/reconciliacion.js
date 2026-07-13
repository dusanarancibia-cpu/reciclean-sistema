// ============================================================
// TAB RECONCILIACIÓN CRM ↔ RDO — extraído de panel-rdo.html
// (antifragilidad del panel, 2026-07-13, cuarto bloque). Script clásico
// sin IIFE a propósito: el HTML del tab genera onclick inline que
// referencia estas funciones por nombre suelto — mismo patrón que
// cotizador.js, oportunidades-kanban.js y cartera.js.
//
// Sin dependencias cross-módulo: verificado con grep que ningún otro
// módulo ya extraído (cotizador.js, oportunidades-kanban.js, cartera.js)
// llama a ninguna función de este bloque, y viceversa.
// ============================================================

// TAB RECONCILIACIÓN CRM ↔ RDO (D-OP-13)
// ============================================================
const REC_PAGE_SIZE = 50;
let recPaginaActual = 1;
let recTotalFilas = 0;
let recMatchCrmIdSel = null;
let recSearchTimer = null;

function recDebouncedSearch() {
  clearTimeout(recSearchTimer);
  recSearchTimer = setTimeout(() => loadReconciliacion(1), 350);
}

// F18 · Cargar sugerencias fuzzy backend Pablo en tab Reconciliación
async function _v4LoadFuzzySuggestions() {
  try {
    if (typeof sb === 'undefined' || !sb?.schema) return;
    const { data, error } = await sb.schema('curated').rpc('f_crm_sugerencias_match', { p_threshold: 0.8, p_limit: 100 });
    const countEl = document.getElementById('v4RecFuzzyCount');
    const listEl = document.getElementById('v4RecFuzzyList');
    if (error || !data) { if (listEl) listEl.innerHTML = '<div class="text-amber-600">Error cargando sugerencias</div>'; return; }
    // Agrupar por cliente_crm_nombre + cliente_id_rdo_sugerido (deduplica si el mismo nombre CRM aparece N veces para el mismo RDO)
    const grouped = {};
    data.forEach(r => {
      const k = (r.cliente_crm_nombre || '') + '||' + (r.cliente_id_rdo_sugerido || '');
      if (!grouped[k]) grouped[k] = { ...r, n_oportunidades: 0 };
      grouped[k].n_oportunidades++;
    });
    const matches = Object.values(grouped).sort((a, b) => Number(b.similarity_score) - Number(a.similarity_score));
    if (countEl) countEl.textContent = `${matches.length} matches únicos · ${data.length} oportunidades`;
    if (matches.length === 0) {
      if (listEl) listEl.innerHTML = '<div class="text-stone-400 text-center py-2">Sin sugerencias alta confianza</div>';
      return;
    }
    if (listEl) {
      listEl.innerHTML = matches.slice(0, 12).map(m => {
        const score = Number(m.similarity_score);
        const scoreTxt = (score * 100).toFixed(0) + '%';
        const safe = (s) => (s || '—').toString().replace(/</g, '&lt;');
        return `<div class="flex items-center gap-2 p-2 rounded bg-white border border-stone-100 hover:bg-stone-50">
          <span class="badge bg-emerald-100 text-emerald-700 text-xs">${scoreTxt}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-stone-800 truncate">${safe(m.cliente_crm_nombre)}</div>
            <div class="text-xs text-stone-500 truncate">→ ${safe(m.cliente_nombre_rdo)} (${safe(m.cliente_id_rdo_sugerido)}) · ${m.n_oportunidades} oportunidad${m.n_oportunidades===1?'':'es'}</div>
          </div>
          <button class="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700" onclick="alert('Confirmar match: ' + ${JSON.stringify(m.crm_id)} + ' → ' + ${JSON.stringify(m.cliente_id_rdo_sugerido)} + '. (POC: ejecución real pendiente integrar con tabla reconciliación)')">✓</button>
          <button class="text-xs px-2 py-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300" onclick="alert('Rechazar match. (POC: pendiente integrar)')">✗</button>
        </div>`;
      }).join('');
    }
  } catch(e) { console.warn('[v4-fuzzy] fallo:', e); }
}

async function initReconciliacion() {
  // F18: cargar sugerencias fuzzy una sola vez por sesión
  if (!window._v4FuzzyLoaded) { window._v4FuzzyLoaded = true; _v4LoadFuzzySuggestions(); }
  // Una sola vez: cargar embudos distintos al combo
  if (!document.getElementById('recFiltroEmbudo').dataset.cargado) {
    const { data: embudos } = await sb.schema('curated').from('vw_oportunidades_crm')
      .select('embudo').not('embudo', 'is', null).limit(1000);
    const set = [...new Set((embudos || []).map(e => e.embudo).filter(Boolean))].sort();
    const sel = document.getElementById('recFiltroEmbudo');
    set.forEach(e => { const opt = document.createElement('option'); opt.value = e; opt.textContent = e; sel.appendChild(opt); });
    sel.dataset.cargado = '1';
  }
  await loadReconciliacionKpis();
  await loadReconciliacion(1);
}

async function loadReconciliacionKpis() {
  const { data, error } = await sb.schema('curated').rpc('reconciliacion_kpis');
  if (error) { console.warn('[Reconciliación] KPI error:', error.message); return; }
  const counts = {};
  let total = 0;
  (data || []).forEach(r => { counts[r.bucket] = Number(r.cant); total += Number(r.cant); });
  document.getElementById('recKpiTotal').textContent = total.toLocaleString('es-CL');
  document.getElementById('recKpiAuto').textContent = (counts['automatico_rut'] || 0).toLocaleString('es-CL');
  document.getElementById('recKpiPend').textContent = (counts['pendiente_revisar'] || 0).toLocaleString('es-CL');
  document.getElementById('recKpiDec').textContent  = (counts['decidido_match'] || 0).toLocaleString('es-CL');
  document.getElementById('recKpiDesc').textContent = (counts['decidido_descartar'] || 0).toLocaleString('es-CL');
}

async function loadReconciliacion(pagina) {
  pagina = Math.max(1, pagina | 0);
  recPaginaActual = pagina;
  const tbody = document.getElementById('recTbody');
  tbody.innerHTML = '<tr><td colspan="9" class="px-3 py-4 text-center text-stone-400">Cargando…</td></tr>';

  const bucket = document.getElementById('recFiltroBucket').value;
  const embudo = document.getElementById('recFiltroEmbudo').value;
  const buscar = (document.getElementById('recFiltroBuscar').value || '').trim();
  const from = (pagina - 1) * REC_PAGE_SIZE;
  const to   = from + REC_PAGE_SIZE - 1;

  let q = sb.schema('curated').from('vw_reconciliacion_buckets')
    .select('*', { count: 'exact' })
    .order('fecha_ingreso', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (bucket) q = q.eq('bucket', bucket);
  if (embudo) q = q.eq('embudo', embudo);
  if (buscar) {
    const s = buscar.replace(/'/g, "''");
    q = q.or(`cliente_crm.ilike.%${s}%,rut_crm.ilike.%${s}%,cliente_nombre_rdo.ilike.%${s}%`);
  }

  const { data, error, count } = await q;
  if (error) {
    tbody.innerHTML = `<tr><td colspan="9" class="px-3 py-4 text-center text-red-600">Error: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }
  recTotalFilas = count || 0;
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="px-3 py-6 text-center text-stone-400">Sin filas para los filtros aplicados.</td></tr>';
  } else {
    tbody.innerHTML = data.map(renderRecFila).join('');
  }

  // Paginación
  const totalPag = Math.max(1, Math.ceil(recTotalFilas / REC_PAGE_SIZE));
  document.getElementById('recPagInfo').textContent = `Página ${pagina} de ${totalPag} (${recTotalFilas.toLocaleString('es-CL')} filas)`;
  document.getElementById('recRangoTexto').textContent = `${from + 1}–${Math.min(to + 1, recTotalFilas)} de ${recTotalFilas.toLocaleString('es-CL')}`;
  document.getElementById('recPagPrev').disabled = pagina <= 1;
  document.getElementById('recPagNext').disabled = pagina >= totalPag;
}

function renderRecFila(f) {
  const bucketColor = {
    'automatico_rut':       'bg-green-100 text-green-800',
    'pendiente_revisar':    'bg-amber-100 text-amber-800',
    'decidido_match':       'bg-blue-100 text-blue-800',
    'decidido_descartar':   'bg-stone-200 text-stone-600',
    'decidido_postponer':   'bg-yellow-100 text-yellow-800',
    'decidido_crear':       'bg-purple-100 text-purple-800',
  }[f.bucket] || 'bg-stone-100 text-stone-700';

  const matchTxt = f.cliente_nombre_rdo
    ? `<span class="text-stone-700">${escapeHtml(f.cliente_nombre_rdo)}</span>`
    : '<span class="text-stone-400">—</span>';

  let acciones = '';
  if (f.bucket === 'pendiente_revisar') {
    acciones = `
      <button onclick="recAbrirMatchModal('${escapeHtml(f.crm_id)}', ${JSON.stringify(f.cliente_crm || '').replace(/"/g, '&quot;')})" class="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Match</button>
      <button onclick="recDescartar('${escapeHtml(f.crm_id)}')" class="text-xs px-2 py-1 bg-stone-300 hover:bg-stone-400 text-stone-800 rounded ml-1">Descartar</button>`;
  } else if (f.bucket === 'automatico_rut') {
    acciones = '<span class="text-xs text-stone-400">auto</span>';
  } else if (f.bucket?.startsWith('decidido_')) {
    acciones = `<button onclick="recRevertirDecision('${escapeHtml(f.crm_id)}')" class="text-xs px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded">Revertir</button>`;
  }

  const montoFmt = f.monto_raw ? f.monto_raw : '—';
  // Si la oportunidad CRM está matcheada a un cliente RDO, exponer el cliente para el menú E360 (click-derecho)
  const e360Attrs = f.cliente_id_rdo
    ? `data-entity-type="cliente" data-entity-id="${escapeHtml(f.cliente_id_rdo)}" data-entity-nombre="${escapeHtml(f.cliente_nombre_rdo || '')}" title="Click-derecho: vínculos E360 del cliente RDO"`
    : '';
  return `
    <tr class="border-t border-stone-100 hover:bg-stone-50" ${e360Attrs}>
      <td class="px-3 py-2 font-mono text-xs">${escapeHtml(f.crm_id || '')}</td>
      <td class="px-3 py-2">${escapeHtml(f.cliente_crm || '')}</td>
      <td class="px-3 py-2 font-mono text-xs">${escapeHtml(f.rut_crm || '—')}</td>
      <td class="px-3 py-2">${escapeHtml(f.embudo || '—')}</td>
      <td class="px-3 py-2">${escapeHtml(f.estado || '—')}</td>
      <td class="px-3 py-2 text-right">${escapeHtml(montoFmt)}</td>
      <td class="px-3 py-2">${matchTxt}</td>
      <td class="px-3 py-2"><span class="inline-block px-2 py-0.5 rounded text-xs ${bucketColor}">${escapeHtml(f.bucket || '?')}</span></td>
      <td class="px-3 py-2 whitespace-nowrap">${acciones}</td>
    </tr>
  `;
}

window.recAbrirMatchModal = function(crmId, clienteCrm) {
  recMatchCrmIdSel = crmId;
  document.getElementById('recMatchCrmId').textContent = crmId;
  document.getElementById('recMatchCrmCliente').textContent = clienteCrm || '—';
  document.getElementById('recMatchBuscar').value = clienteCrm || '';
  document.getElementById('recMatchSugerencias').innerHTML = '<div class="text-xs text-stone-400 p-2">Escribe al menos 2 caracteres para sugerencias.</div>';
  document.getElementById('recMatchModal').classList.remove('hidden');
  // Disparar búsqueda inicial si hay nombre
  if ((clienteCrm || '').length >= 2) recBuscarClienteRdo();
};

window.recCerrarMatchModal = function() {
  document.getElementById('recMatchModal').classList.add('hidden');
  recMatchCrmIdSel = null;
};

window.recBuscarClienteRdo = async function() {
  const txt = document.getElementById('recMatchBuscar').value.trim();
  const cont = document.getElementById('recMatchSugerencias');
  if (txt.length < 2) {
    cont.innerHTML = '<div class="text-xs text-stone-400 p-2">Escribe al menos 2 caracteres para sugerencias.</div>';
    return;
  }
  const { data, error } = await sb.schema('curated').rpc('sugerir_match_cliente', { p_nombre_crm: txt });
  if (error) { cont.innerHTML = `<div class="text-xs text-red-600 p-2">Error: ${escapeHtml(error.message)}</div>`; return; }
  if (!data || data.length === 0) {
    cont.innerHTML = '<div class="text-xs text-stone-400 p-2">Sin coincidencias. Intenta otro nombre o crea el cliente desde Negocios.</div>';
    return;
  }
  cont.innerHTML = data.map(s => `
    <button onclick="recConfirmarMatch('${escapeHtml(s.cliente_id)}')"
            class="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-stone-100 flex justify-between items-center">
      <span><span class="font-medium">${escapeHtml(s.razon_social)}</span> <span class="text-xs text-stone-400 ml-2">(${escapeHtml(s.cliente_id)})</span></span>
      <span class="text-xs text-stone-500">${(s.sim * 100).toFixed(0)}%</span>
    </button>
  `).join('');
};

window.recConfirmarMatch = async function(clienteIdRdo) {
  if (!recMatchCrmIdSel) return;
  const decididoPor = currentUser || 'desconocido';
  const { error } = await sb.schema('curated').from('reconciliacion_decisiones')
    .upsert({
      crm_id: recMatchCrmIdSel,
      decision: 'match',
      cliente_id_rdo: clienteIdRdo,
      decidido_por: decididoPor
    }, { onConflict: 'crm_id' });
  if (error) { alert('Error: ' + error.message); return; }
  recCerrarMatchModal();
  await loadReconciliacionKpis();
  await loadReconciliacion(recPaginaActual);
};

window.recDescartar = async function(crmId) {
  const razon = prompt('Razón del descarte (opcional):');
  if (razon === null) return;
  const decididoPor = currentUser || 'desconocido';
  const { error } = await sb.schema('curated').from('reconciliacion_decisiones')
    .upsert({
      crm_id: crmId,
      decision: 'descartar',
      razon: razon || null,
      decidido_por: decididoPor
    }, { onConflict: 'crm_id' });
  if (error) { alert('Error: ' + error.message); return; }
  await loadReconciliacionKpis();
  await loadReconciliacion(recPaginaActual);
};

window.recRevertirDecision = async function(crmId) {
  if (!confirm('¿Revertir esta decisión? Volverá al bucket original.')) return;
  const { error } = await sb.schema('curated').from('reconciliacion_decisiones').delete().eq('crm_id', crmId);
  if (error) { alert('Error: ' + error.message); return; }
  await loadReconciliacionKpis();
  await loadReconciliacion(recPaginaActual);
};
