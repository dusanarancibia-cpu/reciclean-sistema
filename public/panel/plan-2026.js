// ============================================================
// CUESTIONARIO PLAN 2026 (R-AUD-032/033) — extraído de panel-rdo.html (antifragilidad panel,
// bloque 12, ola de tabs sueltos)
// Ya venía como IIFE auto-contenida en su propio <script>. Se
// preserva tal cual. Cero dependencia con núcleo/Diego LLM/
// Precios/Herramientas Ext/Facturación Grupo/Andrea-Comex/CRM.
// ============================================================

(function () {
  let bloquesAbiertos = new Set();
  let dataActual = [];

  function esc(s) {
    return (s ?? '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  async function cargarCuestionario() {
    try {
      const { data, error } = await sb
        .schema('panel')
        .from('cuestionario_plan_2026')
        .select('id, bloque, bloque_nombre, pregunta, por_que, opciones, recomendacion_pc1, confidence, que_se_graba, impacto_plan_2026, aclaracion_diego, asignado_a, estado, respuesta_opcion, respuesta_justificacion, pendiente_de_carga_razon, respondido_por, respondido_en')
        .order('id', { ascending: true });
      if (error) {
        document.getElementById('plan2026Bloques').innerHTML = `<div class="text-red-600 p-4">Error cargando: ${esc(error.message)}</div>`;
        document.getElementById('plan2026Resumen').textContent = 'Error';
        return;
      }
      dataActual = data || [];
      renderResumen(dataActual);
      renderBloques(dataActual);
    } catch (e) {
      document.getElementById('plan2026Bloques').innerHTML = `<div class="text-red-600 p-4">Excepción: ${esc(String(e))}</div>`;
    }
  }

  function renderResumen(rows) {
    const total = rows.length;
    const ok = rows.filter(r => r.respuesta_opcion != null).length;
    const pct = total ? Math.round(100 * ok / total) : 0;
    document.getElementById('plan2026Resumen').innerHTML =
      `<span class="p26-pct">${ok}/${total}</span> respondidas · <span class="text-emerald-700 font-semibold">${pct}%</span>`;
    document.getElementById('plan2026ProgresoTexto').innerHTML = `<span class="p26-pct">${ok}</span> / ${total} (${pct}%)`;
    document.getElementById('plan2026ProgresoBar').style.width = pct + '%';
  }

  function renderBloques(rows) {
    const grupos = new Map();
    for (const r of rows) {
      const key = r.bloque;
      if (!grupos.has(key)) grupos.set(key, { nombre: r.bloque_nombre, preguntas: [] });
      grupos.get(key).preguntas.push(r);
    }
    const html = [...grupos.entries()].map(([num, g]) => {
      const total = g.preguntas.length;
      const ok = g.preguntas.filter(r => r.respuesta_opcion != null).length;
      const pct = total ? Math.round(100 * ok / total) : 0;
      const colorPct = pct === 100 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
      const abierto = bloquesAbiertos.has(num);
      const chevron = abierto ? '▼' : '▶';
      const preguntasHtml = abierto ? `<div class="p26-preguntas">${g.preguntas.map(renderPregunta).join('')}</div>` : '';
      return `
        <div class="p26-bloque" data-bloque="${num}">
          <div class="p26-bloque-header" role="button" tabindex="0" onclick="plan2026ToggleBloque(${num})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
            <div class="flex items-center gap-2">
              <span class="text-stone-400">${chevron}</span>
              <span class="font-semibold text-stone-700">Bloque ${num}: ${esc(g.nombre)}</span>
            </div>
            <div class="text-xs">
              <span class="p26-pct ${colorPct}">${ok}/${total}</span> · ${pct}%
            </div>
          </div>
          ${preguntasHtml}
        </div>`;
    }).join('');
    document.getElementById('plan2026Bloques').innerHTML = html;
  }

  function renderPregunta(r) {
    const badge = r.respuesta_opcion != null
      ? '<span class="p26-badge-ok">RESPONDIDA</span>'
      : '<span class="p26-badge-pendiente">PENDIENTE</span>';
    const corta = (r.pregunta || '').slice(0, 90) + ((r.pregunta || '').length > 90 ? '…' : '');
    return `
      <div class="p26-pregunta" role="button" tabindex="0" onclick="plan2026AbrirModal(${r.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">
        ${badge}
        <div class="flex-1 text-sm text-stone-700">
          <div><span class="font-semibold">#${r.id}.</span> ${esc(corta)}</div>
          ${r.respuesta_opcion != null ? `<div class="text-xs text-stone-500 mt-1">→ ${esc(r.respuesta_opcion)}</div>` : ''}
        </div>
      </div>`;
  }

  window.plan2026ToggleBloque = function (num) {
    if (bloquesAbiertos.has(num)) bloquesAbiertos.delete(num);
    else bloquesAbiertos.add(num);
    renderBloques(dataActual);
  };

  window.plan2026AbrirModal = function (id) {
    const r = dataActual.find(x => x.id === id);
    if (!r) return;
    document.getElementById('plan2026ModalNum').textContent = `#${r.id} · Bloque ${r.bloque} ${esc(r.bloque_nombre || '')}`;
    const body = document.getElementById('plan2026ModalBody');
    const opciones = Array.isArray(r.opciones)
      ? r.opciones.map((o, i) => `<li class="text-sm text-stone-600">${esc(typeof o === 'string' ? o : JSON.stringify(o))}</li>`).join('')
      : '<li class="text-xs text-stone-400">Sin opciones cargadas</li>';
    body.innerHTML = `
      <div class="space-y-3 text-sm">
        <div><span class="font-semibold text-stone-700">Pregunta:</span><div class="mt-1 text-stone-800">${esc(r.pregunta)}</div></div>
        ${r.por_que ? `<div><span class="font-semibold text-stone-700">¿Por qué importa?</span><div class="mt-1 text-stone-600 text-xs">${esc(r.por_que)}</div></div>` : ''}
        <div><span class="font-semibold text-stone-700">Opciones:</span><ul class="list-disc pl-5 mt-1">${opciones}</ul></div>
        ${r.recomendacion_pc1 ? `<div><span class="font-semibold text-stone-700">Recomendación PC1:</span><div class="mt-1 text-stone-600">${esc(r.recomendacion_pc1)} ${r.confidence ? `<span class="text-xs text-stone-400">(confianza ${esc(r.confidence)})</span>` : ''}</div></div>` : ''}
        ${r.respuesta_opcion != null
          ? `<div class="bg-emerald-50 border border-emerald-200 rounded p-3">
              <div><span class="font-semibold text-emerald-800">Respuesta firmada:</span> ${esc(r.respuesta_opcion)}</div>
              ${r.respuesta_justificacion ? `<div class="text-xs text-emerald-700 mt-1">${esc(r.respuesta_justificacion)}</div>` : ''}
              ${r.respondido_por ? `<div class="text-xs text-stone-500 mt-1">Por ${esc(r.respondido_por)}${r.respondido_en ? ' · ' + new Date(r.respondido_en).toLocaleString('es-CL') : ''}</div>` : ''}
            </div>`
          : `<div class="bg-amber-50 border border-amber-200 rounded p-3">
              <div><span class="font-semibold text-amber-800">PENDIENTE de carga</span></div>
              ${r.pendiente_de_carga_razon ? `<div class="text-xs text-amber-700 mt-1">${esc(r.pendiente_de_carga_razon)}</div>` : ''}
              ${r.asignado_a ? `<div class="text-xs text-stone-500 mt-1">Asignado a: ${esc(r.asignado_a)}</div>` : ''}
            </div>`}
        ${r.impacto_plan_2026 ? `<div><span class="font-semibold text-stone-700">Impacto Plan 2026:</span><div class="mt-1 text-stone-600 text-xs">${esc(r.impacto_plan_2026)}</div></div>` : ''}
      </div>`;
    document.getElementById('plan2026Modal').classList.remove('hidden');
  };

  window.plan2026CerrarModal = function () {
    document.getElementById('plan2026Modal').classList.add('hidden');
  };

  function init() {
    document.querySelector('button[data-tab="plan_2026"]')?.addEventListener('click', () => {
      setTimeout(cargarCuestionario, 100);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
