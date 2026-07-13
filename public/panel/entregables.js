// ============================================================
// TAB ENTREGABLES — extraído de panel-rdo.html (antifragilidad del
// panel, 2026-07-13, sexto bloque — clúster "Bandeja Diego + Entregables").
// Script clásico sin IIFE a propósito: el HTML del tab genera onclick
// inline por nombre suelto — mismo patrón que los 5 bloques anteriores.
//
// Sin dependencias cross-módulo, sin dependencia con Diego/LLM: verificado
// con grep que ningún módulo ya extraído ni el chat de Diego llama a
// funciones de este bloque, y este bloque no llama a nada fuera de sí
// mismo (solo helpers globales preexistentes: sb, escapeHtml).
// ============================================================

// TAB ENTREGABLES (D-OP-14) — Andrea matriz negocio × tipo
// ============================================================
const ENT_TIPOS_ORDEN = [
  'alcance_metas',
  'carta',
  'diagrama_cotizacion',
  'diagrama_activacion',
  'pauta_seguimiento',
  'presentacion_corporativa',
  'presentacion_servicio',
];
const ENT_TIPO_LABEL = {
  alcance_metas: '🎯 Alcance · metas',
  carta: '✉️ Carta',
  diagrama_cotizacion: '📐 Diag. cotización',
  diagrama_activacion: '🚀 Diag. activación',
  pauta_seguimiento: '📋 Pauta seguim.',
  presentacion_corporativa: '🏢 Pres. corp.',
  presentacion_servicio: '🛠️ Pres. servicio',
};
const ENT_ESTADO_PILL = {
  listo:    'bg-green-100 text-green-800',
  enviado:  'bg-blue-100 text-blue-800',
  obsoleto: 'bg-stone-200 text-stone-500',
  borrador: 'bg-amber-100 text-amber-800',
};
let _entDrawerId = null;
let _entCacheData = null;

async function initEntregables() {
  await loadEntregables();
}

async function loadEntregables() {
  const cont = document.getElementById('entMatriz');
  cont.innerHTML = '<div class="skeleton" aria-busy="true"></div>';

  const { data, error } = await sb.schema('curated').from('vw_entregables_estado_matriz').select('*');
  if (error) { cont.innerHTML = `<div class="text-red-600 p-4">Error: ${escapeHtml(error.message)}</div>`; return; }
  _entCacheData = data || [];

  // KPIs
  const c = { listo: 0, enviado: 0, obsoleto: 0, borrador: 0 };
  _entCacheData.forEach(e => { c[e.estado] = (c[e.estado] || 0) + 1; });
  document.getElementById('entKpiTotal').textContent = _entCacheData.length.toLocaleString('es-CL');
  document.getElementById('entKpiListo').textContent = (c.listo || 0).toLocaleString('es-CL');
  document.getElementById('entKpiEnv').textContent   = (c.enviado || 0).toLocaleString('es-CL');
  document.getElementById('entKpiObs').textContent   = (c.obsoleto || 0).toLocaleString('es-CL');

  // Matriz: filas = tipos en ENT_TIPOS_ORDEN, columnas = negocios distintos
  const negocios = [...new Set(_entCacheData.map(e => e.negocio_id))].sort();
  // Buscar mejor entregable por (negocio, tipo): preferir listo > enviado > borrador > obsoleto
  const prio = { listo: 4, enviado: 3, borrador: 2, obsoleto: 1 };
  const matriz = {};
  _entCacheData.forEach(e => {
    const key = `${e.negocio_id}|${e.tipo_entregable}`;
    const prev = matriz[key];
    if (!prev || (prio[e.estado] || 0) > (prio[prev.estado] || 0)) matriz[key] = e;
  });

  let html = '<table class="w-full text-sm"><thead class="bg-stone-50 text-stone-600"><tr>';
  html += '<th class="px-3 py-2 text-left sticky left-0 bg-stone-50">Tipo</th>';
  negocios.forEach(n => {
    const corto = n.replace(/^NEG-/, '').replace(/-001$/, '');
    html += `<th class="px-3 py-2 text-center" title="${escapeHtml(n)}">${escapeHtml(corto)}</th>`;
  });
  html += '</tr></thead><tbody>';
  ENT_TIPOS_ORDEN.forEach(t => {
    html += `<tr class="border-t border-stone-100"><td class="px-3 py-2 font-medium text-stone-700 sticky left-0 bg-white">${escapeHtml(ENT_TIPO_LABEL[t] || t)}</td>`;
    negocios.forEach(n => {
      const cell = matriz[`${n}|${t}`];
      if (!cell) {
        html += '<td class="px-3 py-2 text-center text-stone-300">—</td>';
      } else {
        const pill = ENT_ESTADO_PILL[cell.estado] || 'bg-stone-100 text-stone-600';
        html += `<td class="px-3 py-2 text-center">
          <button onclick="entAbrirDrawer(${cell.entregable_id})"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded hover:opacity-80 ${pill}"
                  title="Click para ver / enviar">
            <span class="text-xs">${escapeHtml(cell.estado)}</span>
          </button>
        </td>`;
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  cont.innerHTML = html;
}

window.entAbrirDrawer = async function(entId) {
  _entDrawerId = entId;
  document.getElementById('entDrawer').classList.remove('hidden');
  document.getElementById('entDrawerMsg').classList.add('hidden');
  document.getElementById('entDrawerTitulo').textContent = 'Cargando…';
  document.getElementById('entDrawerSubtitle').textContent = '';
  document.getElementById('entDrawerTags').innerHTML = '';
  document.getElementById('entDrawerPreview').innerHTML = '<div class="text-stone-400 italic">Cargando preview…</div>';

  const { data: e, error } = await sb.schema('curated').from('entregables_negocio').select('*').eq('entregable_id', entId).maybeSingle();
  if (error || !e) {
    document.getElementById('entDrawerTitulo').textContent = 'Error cargando entregable';
    return;
  }

  document.getElementById('entDrawerTitulo').textContent = (ENT_TIPO_LABEL[e.tipo_entregable] || e.tipo_entregable) + ' · ' + e.negocio_id;
  document.getElementById('entDrawerSubtitle').textContent = `Plantilla #${e.plantilla_id} · actualizado ${e.updated_at ? new Date(e.updated_at).toLocaleDateString('es-CL') : '—'}`;

  const tags = [`<span class="text-xs px-2 py-0.5 rounded ${ENT_ESTADO_PILL[e.estado] || 'bg-stone-100 text-stone-600'}">${escapeHtml(e.estado)}</span>`];
  if (e.fecha_envio) tags.push(`<span class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">enviado ${new Date(e.fecha_envio).toLocaleDateString('es-CL')}</span>`);
  if (Array.isArray(e.enviado_a) && e.enviado_a.length > 0) tags.push(`<span class="text-xs px-2 py-0.5 rounded bg-stone-50 text-stone-600">→ ${escapeHtml(e.enviado_a.join(', '))}</span>`);
  if (e.url_storage_pdf) tags.push(`<a href="${escapeHtml(e.url_storage_pdf)}" target="_blank" class="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 hover:underline">📄 PDF</a>`);
  document.getElementById('entDrawerTags').innerHTML = tags.join('');

  // Botones según estado
  document.getElementById('entBtnMarcarEnviado').style.display  = (e.estado === 'listo') ? '' : 'none';
  document.getElementById('entBtnMarcarObsoleto').style.display = (e.estado === 'listo' || e.estado === 'enviado') ? '' : 'none';
  document.getElementById('entBtnRevivir').classList.toggle('hidden', e.estado !== 'obsoleto');

  // Preview
  const preview = document.getElementById('entDrawerPreview');
  if (e.contenido_html) {
    preview.innerHTML = e.contenido_html;
  } else if (e.contenido_md) {
    // Render md básico: paragraphs por doble newline + bold/italic minimal
    const md = e.contenido_md;
    const html = md
      .split(/\n\n+/).map(p =>
        '<p>' + escapeHtml(p)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>')
        + '</p>'
      ).join('');
    preview.innerHTML = html;
  } else if (e.diagrama_mermaid) {
    preview.innerHTML = `<pre class="text-xs bg-white p-3 border border-stone-200 rounded overflow-x-auto">${escapeHtml(e.diagrama_mermaid)}</pre><div class="text-xs text-stone-500 mt-2">Diagrama Mermaid (render visual disponible sprint 2).</div>`;
  } else {
    preview.innerHTML = '<div class="text-stone-400 italic">Sin contenido disponible. Posible: archivo solo en storage (ver botón PDF arriba).</div>';
  }
};

window.entCerrarDrawer = function() {
  document.getElementById('entDrawer').classList.add('hidden');
  _entDrawerId = null;
};

async function _entUpdateEstado(nuevoEstado, mensaje, extraPatch) {
  if (!_entDrawerId) return;
  const msg = document.getElementById('entDrawerMsg');
  msg.classList.add('hidden');
  const patch = Object.assign({ estado: nuevoEstado }, extraPatch || {});
  const { error } = await sb.schema('curated').from('entregables_negocio').update(patch).eq('entregable_id', _entDrawerId);
  if (error) {
    msg.className = 'text-xs p-2 rounded bg-red-50 text-red-700';
    msg.textContent = 'Error: ' + error.message;
    msg.classList.remove('hidden');
    return;
  }
  msg.className = 'text-xs p-2 rounded bg-green-50 text-green-700';
  msg.textContent = mensaje;
  msg.classList.remove('hidden');
  await loadEntregables();
  if (_entDrawerId) await entAbrirDrawer(_entDrawerId);
}

window.entMarcarEnviado = async function() {
  const destinatario = prompt('Destinatario (email/nombre) — opcional:');
  const patch = { fecha_envio: new Date().toISOString() };
  if (destinatario) patch.enviado_a = [destinatario.trim()];
  await _entUpdateEstado('enviado', 'Marcado como enviado manualmente.', patch);
};

window.entMarcarObsoleto = async function() {
  if (!confirm('¿Marcar como obsoleto?')) return;
  await _entUpdateEstado('obsoleto', 'Marcado obsoleto.', {});
};

window.entRevivir = async function() {
  if (!confirm('¿Revivir como listo?')) return;
  await _entUpdateEstado('listo', 'Marcado como listo.', { fecha_envio: null, enviado_a: [] });
};

