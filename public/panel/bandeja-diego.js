// ============================================================
// TAB BANDEJA DIEGO — extraído de panel-rdo.html (antifragilidad del
// panel, 2026-07-13, sexto bloque — clúster "Bandeja Diego + Entregables").
// Script clásico sin IIFE a propósito: el HTML del tab genera onclick
// inline por nombre suelto — mismo patrón que los 5 bloques anteriores.
//
// IMPORTANTE — esto es la cola operativa de tareas (panel.diego_bandeja),
// NO el LLM de Diego. Verificado con grep: cero referencias a
// diego-chat-process/callDiego/DIEGO_STRATEGY dentro de este bloque.
//
// Dependencias cruzadas reales encontradas (documentadas, no tocadas):
//   - ENTRANTE: el rail del chat de Diego (panel-rdo.html, función
//     openBandejaCaseFromRail, ~línea 14295, código NO tocado en este PR)
//     llama a window.bdAbrirDrawer(bandejaId) con guard typeof — sigue
//     funcionando igual porque el scope es global.
//   - SALIENTE: bdIrAReferencia() llama a oppAbrirDrawer() (ya vive en
//     public/panel/oportunidades-kanban.js) con guard typeof — mismo
//     patrón ya probado en el clúster anterior (Cotizador↔Cartera).
// ============================================================

// TAB BANDEJA DIEGO (D-OP-15) — mensajes/tareas Diego
// ============================================================
let _bdDrawerId = null;
let _bdSearchTimer = null;
let _bdCargoRespCombo = false;

function bdDebouncedSearch() {
  clearTimeout(_bdSearchTimer);
  _bdSearchTimer = setTimeout(() => loadBandejaDiego(), 300);
}

async function initBandejaDiego() {
  if (!_bdCargoRespCombo) {
    const { data: resp } = await sb.schema('panel').from('diego_bandeja')
      .select('responsable').not('responsable', 'is', null).limit(500);
    const set = [...new Set((resp || []).map(r => r.responsable).filter(Boolean))].sort();
    const sel = document.getElementById('bdFiltroResponsable');
    set.forEach(r => { const opt = document.createElement('option'); opt.value = r; opt.textContent = r; sel.appendChild(opt); });
    _bdCargoRespCombo = true;
  }
  await loadBandejaDiegoKpis();
  await loadBandejaDiego();
}

async function loadBandejaDiegoKpis() {
  const { data, error } = await sb.schema('panel').rpc('diego_bandeja_kpis');
  if (error) { console.warn('[BandejaDiego] KPI error:', error.message); return; }
  let pend = 0, res = 0, sinResp = 0, venc = 0;
  (data || []).forEach(r => {
    if (r.estado === 'pendiente') { pend = Number(r.cant); sinResp = Number(r.sin_responsable); venc = Number(r.vencidos_48h); }
    if (r.estado === 'resuelto')  { res = Number(r.cant); }
  });
  document.getElementById('bdKpiPend').textContent = pend.toLocaleString('es-CL');
  document.getElementById('bdKpiRes').textContent  = res.toLocaleString('es-CL');
  document.getElementById('bdKpiSinResp').textContent = sinResp.toLocaleString('es-CL');
  document.getElementById('bdKpiVenc').textContent = venc.toLocaleString('es-CL');
}

async function loadBandejaDiego() {
  const tbody = document.getElementById('bdTbody');
  tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-stone-400">Cargando…</td></tr>';
  const est = document.getElementById('bdFiltroEstado').value;
  const resp = document.getElementById('bdFiltroResponsable').value;
  const buscar = (document.getElementById('bdFiltroBuscar').value || '').trim();

  let q = sb.schema('panel').from('vw_diego_bandeja_detalle').select('*').limit(200);
  if (est) q = q.eq('estado', est);
  if (resp) q = q.eq('responsable', resp);
  if (buscar) {
    const s = buscar.replace(/'/g, "''");
    q = q.or(`mensaje.ilike.%${s}%,remitente.ilike.%${s}%,what.ilike.%${s}%,who.ilike.%${s}%`);
  }
  const { data, error } = await q;
  if (error) { tbody.innerHTML = `<tr><td colspan="5" class="px-3 py-4 text-center text-red-600">Error: ${escapeHtml(error.message)}</td></tr>`; return; }
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-6 text-center text-stone-400">Sin mensajes para los filtros aplicados.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(b => {
    const edad = Number(b.edad_horas);
    const edadTxt = edad < 1 ? 'recién' : edad < 24 ? Math.round(edad) + 'h' : Math.round(edad / 24) + 'd';
    const colorPill = {
      pendiente: 'bg-amber-100 text-amber-800',
      resuelto:  'bg-green-100 text-green-800',
    }[b.estado] || 'bg-stone-100 text-stone-700';
    const urg = {
      rojo:  '🔴',
      ambar: '🟠',
      verde: '🟢',
      gris:  '⚪',
    }[b.urgencia_color] || '';
    const mensajeTrunc = (b.mensaje || '').length > 90 ? (b.mensaje || '').slice(0, 87) + '…' : (b.mensaje || '');
    return `
      <tr class="border-t border-stone-100 hover:bg-stone-50 cursor-pointer" onclick="bdAbrirDrawer('${b.id}')">
        <td class="px-3 py-2"><span class="mr-1">${urg}</span>${escapeHtml(mensajeTrunc)}</td>
        <td class="px-3 py-2 text-stone-600">${escapeHtml(b.remitente || '—')}</td>
        <td class="px-3 py-2 text-stone-600">${escapeHtml(b.responsable || '—')}</td>
        <td class="px-3 py-2 text-right text-stone-500">${edadTxt}</td>
        <td class="px-3 py-2"><span class="inline-block px-2 py-0.5 rounded text-xs ${colorPill}">${escapeHtml(b.estado)}</span></td>
      </tr>`;
  }).join('');
}

window.bdAbrirDrawer = async function(id) {
  _bdDrawerId = id;
  document.getElementById('bdDrawer').classList.remove('hidden');
  document.getElementById('bdDrawerMsg').classList.add('hidden');
  const { data: b, error } = await sb.schema('panel').from('vw_diego_bandeja_detalle').select('*').eq('id', id).maybeSingle();
  if (error || !b) { document.getElementById('bdDrawerSubtitle').textContent = 'Error cargando'; return; }

  document.getElementById('bdDrawerSubtitle').textContent =
    `${b.remitente || '—'} · ${new Date(b.creado_en).toLocaleString('es-CL')} · ${b.estado}`;
  document.getElementById('bdDrawerMensaje').textContent = b.mensaje || '—';
  document.getElementById('bdDw_what').textContent  = b.what  || '—';
  document.getElementById('bdDw_who').textContent   = b.who   || '—';
  document.getElementById('bdDw_where').textContent = b.donde || '—';
  document.getElementById('bdDw_when').textContent  = b.cuando|| '—';
  document.getElementById('bdDw_why').textContent   = b.why   || '—';
  document.getElementById('bdDw_how').textContent   = b.how_  || '—';
  document.getElementById('bdDw_resp').value = b.responsable || '';
  document.getElementById('bdDw_nota').value = b.nota_resolucion || '';
  document.getElementById('bdDrawerTags').innerHTML = b.urgencia_color === 'rojo'
    ? '<span class="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">🔴 Vencido &gt;48h</span>'
    : '';
  document.getElementById('bdBtnResolver').style.display = (b.estado === 'pendiente') ? '' : 'none';
  document.getElementById('bdBtnReabrir').classList.toggle('hidden', b.estado !== 'resuelto');

  _bdDrawerRef = (b.referencia_tabla && b.referencia_id) ? { tabla: b.referencia_tabla, id: b.referencia_id } : null;
  document.getElementById('bdDrawerRefBox').classList.toggle('hidden', !_bdDrawerRef);
};

// Navega a la entidad de origen del item de bandeja (hoy: solo oportunidades).
// Reutiliza el tab y el drawer de Oportunidades ya existentes — cero UI nueva.
let _bdDrawerRef = null;
window.bdIrAReferencia = function() {
  if (!_bdDrawerRef || _bdDrawerRef.tabla !== 'oportunidades') return;
  const oppId = _bdDrawerRef.id;
  bdCerrarDrawer();
  const oppTabBtn = document.querySelector('[data-tab="oportunidades"]');
  if (oppTabBtn) oppTabBtn.click();
  setTimeout(() => { if (typeof oppAbrirDrawer === 'function') oppAbrirDrawer(oppId); }, 400);
};

window.bdCerrarDrawer = function() {
  document.getElementById('bdDrawer').classList.add('hidden');
  _bdDrawerId = null;
};

async function _bdUpdate(patch, mensajeOK) {
  if (!_bdDrawerId) return;
  const msg = document.getElementById('bdDrawerMsg');
  msg.classList.add('hidden');
  const { error } = await sb.schema('panel').from('diego_bandeja').update(patch).eq('id', _bdDrawerId);
  if (error) {
    msg.className = 'text-xs p-2 rounded bg-red-50 text-red-700';
    msg.textContent = 'Error: ' + error.message;
    msg.classList.remove('hidden');
    return;
  }
  msg.className = 'text-xs p-2 rounded bg-green-50 text-green-700';
  msg.textContent = mensajeOK;
  msg.classList.remove('hidden');
  await loadBandejaDiegoKpis();
  await loadBandejaDiego();
  if (_bdDrawerId) await bdAbrirDrawer(_bdDrawerId);
}

window.bdMarcarResuelto = async function() {
  const nota = document.getElementById('bdDw_nota').value.trim() || null;
  await _bdUpdate({ estado: 'resuelto', cerrado_en: new Date().toISOString(), nota_resolucion: nota }, 'Marcado resuelto.');
};

window.bdReabrir = async function() {
  if (!confirm('¿Reabrir como pendiente?')) return;
  await _bdUpdate({ estado: 'pendiente', cerrado_en: null }, 'Reabierto.');
};

window.bdReasignar = async function() {
  const nuevo = document.getElementById('bdDw_resp').value.trim() || null;
  await _bdUpdate({ responsable: nuevo }, nuevo ? `Asignado a ${nuevo}.` : 'Responsable removido.');
};
