// ============================================================
// TAB NEGOCIOS — extraído de panel-rdo.html (antifragilidad del panel,
// 2026-07-13, quinto bloque — cierra el clúster Cartera/Reconciliación/
// Negocios). Script clásico sin IIFE a propósito: el HTML del tab genera
// onclick inline por nombre suelto — mismo patrón que los 4 bloques
// anteriores.
//
// DEPENDENCIA SALIENTE (Negocios → Cotizador, no al revés): 3 funciones
// (abrirNuevoNegocio, cotizarDesdeNegocio, cotizarDesdeFilaNegocio)
// navegan al tab Cotizador vía click en el botón real y llenan campos
// del formulario por id (#cotTitulo, #cotClienteId, etc.), incluyendo
// una llamada a cotRefrescarEditarClienteBtn() (ya vive en
// public/panel/cotizador.js). Mismo patrón ya probado y seguro que
// Cotizador → Cartera (carAbrirEditar/carAbrirCrear): funciona porque
// ambos módulos comparten scope global, sin importar el archivo físico.
// Sin dependencias entrantes: verificado con grep que ningún módulo ya
// extraído llama a funciones de este bloque.
// ============================================================

// PESTAÑA NEGOCIOS
// ============================================================

let _negocioTimelienId = null;  // oportunidad_id del timeline abierto

let _negBuscarTimer = null;
function loadNegociosBuscar(val) {
  clearTimeout(_negBuscarTimer);
  _negBuscarTimer = setTimeout(() => loadNegocios(val), 350);
}

async function loadNegocios(buscarOverride) {
  const div = document.getElementById('negociosTabla');
  div.innerHTML = '<div class="skeleton" aria-busy="true"></div>';

  const estado        = document.getElementById('negEstado')?.value  || '';
  const tipo          = document.getElementById('negTipo')?.value    || '';
  const sinSucursal   = document.getElementById('negSinSucursal')?.checked === true;
  const buscar  = buscarOverride !== undefined
    ? buscarOverride
    : (document.getElementById('negBuscar')?.value || '');

  // Cargar cache sucursales en paralelo con la query principal
  const sucursalesP = ensureSucursalesCache();

  let q = sb.schema('curated').from('oportunidades')
    .select('oportunidad_id, tipo, titulo, estado, valor_estimado_uf, fecha_recepcion, fecha_cierre, responsable, cliente_id, cliente_nombre_libre, sucursal_id')
    .order('fecha_recepcion', { ascending: false })
    .limit(100);

  if (estado) q = q.eq('estado', estado);
  if (tipo)   q = q.eq('tipo', tipo);
  if (sinSucursal) q = q.is('sucursal_id', null);
  if (buscar) q = q.or(`titulo.ilike.%${buscar}%,cliente_nombre_libre.ilike.%${buscar}%`);

  const [{ data, error }, sucursales] = await Promise.all([q, sucursalesP]);

  if (error) {
    div.innerHTML = `<p class="text-red-600 p-4">Error cargando negocios: ${escapeHtml(error.message)}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    div.innerHTML = '<p class="text-stone-400 p-4">No hay negocios con esos filtros.</p>';
    return;
  }

  const estadoBadge = {
    recibida: 'bg-stone-100 text-stone-600',
    en_evaluacion: 'bg-yellow-100 text-yellow-700',
    respondida: 'bg-blue-100 text-blue-700',
    activada: 'bg-indigo-100 text-indigo-700',
    monitoreo: 'bg-purple-100 text-purple-700',
    ganada: 'bg-green-100 text-green-700',
    perdida: 'bg-red-100 text-red-600',
    estandarizada: 'bg-teal-100 text-teal-700',
    descartada: 'bg-stone-100 text-stone-400',
  };
  const tipoBadge = {
    accion: '⚡',
    idea: '💡',
    necesidad: '🔔',
    cotizacion: '📋',
  };

  const sucursalOpts = (sucursales || []).map(s =>
    `<option value="${escapeHtml(s.sucursal_id)}">${escapeHtml(s.nombre)}</option>`
  ).join('');

  div.innerHTML = `
    <div class="table-responsive">
    <table class="w-full text-sm min-w-max">
      <thead>
        <tr class="border-b text-stone-500 text-xs">
          <th class="text-left py-2 px-3">Negocio</th>
          <th class="py-2 px-2">Tipo</th>
          <th class="text-left py-2 px-2">Cliente</th>
          <th class="text-right py-2 px-2">UF est.</th>
          <th class="py-2 px-2">Estado</th>
          <th class="py-2 px-2">Sucursal</th>
          <th class="text-right py-2 px-2">Fecha</th>
          <th class="py-2 px-2"></th>
        </tr>
      </thead>
      <tbody>
        ${data.map(n => {
          const sucActual = n.sucursal_id || '';
          const sinSuc = !sucActual;
          const selectId = `selSuc_${n.oportunidad_id}`;
          const optionsHtml = (sucursales || []).map(s =>
            `<option value="${escapeHtml(s.sucursal_id)}" ${s.sucursal_id===sucActual?'selected':''}>${escapeHtml(s.nombre)}</option>`
          ).join('');
          return `
          <tr class="border-b hover:bg-stone-50 cursor-pointer"
              data-entity-type="oportunidad" data-entity-id="${escapeHtml(n.oportunidad_id)}" data-entity-nombre="${escapeHtml(n.titulo || '')}"
              title="Click: timeline · Click-derecho: vínculos E360"
              onclick="verTimeline('${escapeHtml(n.oportunidad_id)}', '${escapeHtml(n.titulo.replace(/'/g,"&#39;"))}')">
            <td class="py-2 px-3 font-medium text-stone-800 max-w-xs truncate">${escapeHtml(n.titulo)}</td>
            <td class="py-2 px-2 text-center">${escapeHtml(tipoBadge[n.tipo] || n.tipo)}</td>
            <td class="py-2 px-2 text-stone-600 max-w-[140px] truncate">${escapeHtml(n.cliente_nombre_libre || n.cliente_id || '—')}</td>
            <td class="py-2 px-2 text-right font-mono">${n.valor_estimado_uf != null ? Number(n.valor_estimado_uf).toFixed(2) + ' UF' : '—'}</td>
            <td class="py-2 px-2 text-center">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[n.estado] || 'bg-stone-100 text-stone-500'}">
                ${escapeHtml(n.estado)}
              </span>
            </td>
            <td class="py-2 px-2 text-center" onclick="event.stopPropagation()">
              <select id="${selectId}"
                      onchange="actualizarSucursalOportunidad('${escapeHtml(n.oportunidad_id)}', this.value, '${selectId}')"
                      aria-label="Sucursal del negocio ${escapeHtml(n.titulo || n.oportunidad_id)}"
                      class="text-xs border rounded px-1.5 py-0.5 ${sinSuc ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-300 bg-white text-stone-700'} focus:border-green-700 focus:outline-none">
                <option value="" ${sinSuc?'selected':''} ${sinSuc?'':'disabled'}>${sinSuc ? '⚠ Asignar…' : '— (seleccionada)'}</option>
                ${optionsHtml}
              </select>
              <span id="${selectId}_msg" class="text-sm ml-1"></span>
            </td>
            <td class="py-2 px-2 text-right text-stone-400 text-xs">${new Date(n.fecha_recepcion).toLocaleDateString('es-CL')}</td>
            <td class="py-2 px-2 text-center">
              <button class="text-xs text-green-700 hover:underline"
                      onclick="event.stopPropagation(); cotizarDesdeFilaNegocio('${escapeHtml(n.oportunidad_id)}', '${escapeHtml(n.titulo.replace(/'/g,"&#39;"))}', '${escapeHtml(n.cliente_id||'')}', '${escapeHtml(n.cliente_nombre_libre||'')}')">
                📋
              </button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
    <p class="text-xs text-stone-400 p-3">${data.length} negocio(s) encontrado(s)${sinSucursal ? ' · filtro: sin sucursal' : ''}</p>`;
}

// D-DAT-04 — UPDATE inline de sucursal_id en oportunidades.
// Requiere policy `anon_update_oportunidades_sucursal_validado` (mig 030).
async function actualizarSucursalOportunidad(opId, sucursalId, selectId) {
  const msgEl = document.getElementById(selectId + '_msg');
  if (msgEl) { msgEl.textContent = '⏳'; msgEl.className = 'text-sm ml-1 text-stone-400'; }
  const sel = document.getElementById(selectId);
  if (sel) sel.disabled = true;

  const payload = {
    sucursal_id: sucursalId || null,
    updated_by: currentUser,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.schema('curated').from('oportunidades')
    .update(payload).eq('oportunidad_id', opId);

  if (sel) sel.disabled = false;
  if (error) {
    // D-OP-08 #6 — log técnico a consola, mensaje humano al usuario.
    console.error('[D-DAT-04] update sucursal failed:', error);
    if (msgEl) { msgEl.textContent = '✗'; msgEl.className = 'text-sm ml-1 text-red-600 font-bold'; }
    showToast(humanizeSupabaseError(error), 'error');
    return;
  }
  if (msgEl) {
    msgEl.textContent = '✓';
    msgEl.className = 'text-sm ml-1 text-green-600 font-bold';
    setTimeout(() => { if (msgEl) msgEl.textContent = ''; }, 1500);
  }
  showToast('Sucursal guardada', 'ok');
  // Re-pintar el select según el nuevo estado (con/sin sucursal)
  if (sel) {
    const sinSuc = !sucursalId;
    sel.className = 'text-xs border rounded px-1.5 py-0.5 ' +
      (sinSuc ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-300 bg-white text-stone-700') +
      ' focus:border-green-700 focus:outline-none';
    const opt0 = sel.querySelector('option[value=""]');
    if (opt0) {
      opt0.textContent = sinSuc ? '⚠ Asignar…' : '— (seleccionada)';
      // a11y: la opción "—" deja de ser clickeable cuando ya hay sucursal asignada
      // (evita desasignación accidental por click).
      if (sinSuc) opt0.removeAttribute('disabled');
      else opt0.setAttribute('disabled', '');
    }
  }

  // D-OP-08 #2 — si el filtro "Solo sin sucursal" está activo y la fila ahora SÍ tiene sucursal,
  // la fila debe desaparecer de la vista. Re-render la tabla con un pequeño delay para que
  // Andrea vea el ✓ antes del refresco.
  if (sucursalId && document.getElementById('negSinSucursal')?.checked === true) {
    setTimeout(() => loadNegocios(), 600);
  }
}

async function verTimeline(opId, titulo) {
  _negocioTimelienId = opId;
  const tl = document.getElementById('negocioTimeline');
  const title = document.getElementById('negocioTimelineTitle');
  const cont = document.getElementById('negocioTimelineContenido');
  title.textContent = titulo;
  cont.innerHTML = '<p class="text-stone-400">Cargando timeline…</p>';
  tl.classList.remove('hidden');
  tl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const { data, error } = await sb.schema('curated').from('negocio_etapas')
    .select('etapa, fecha, actor, observaciones')
    .eq('oportunidad_id', opId)
    .order('fecha', { ascending: true });

  if (error) {
    cont.innerHTML = `<p class="text-red-600">Error: ${escapeHtml(error.message)}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    cont.innerHTML = '<p class="text-stone-400">Sin etapas registradas aún.</p>';
    return;
  }
  cont.innerHTML = `
    <ol class="relative border-l-2 border-green-200 pl-5 space-y-4">
      ${data.map(e => `
        <li class="relative">
          <span class="absolute -left-[1.4rem] top-0.5 w-3 h-3 bg-green-600 rounded-full border-2 border-white"></span>
          <p class="text-xs text-stone-400">${new Date(e.fecha).toLocaleString('es-CL')} · ${escapeHtml(e.actor || '—')}</p>
          <p class="font-semibold text-stone-700 capitalize">${escapeHtml(e.etapa.replace(/_/g,' '))}</p>
          ${e.observaciones ? `<p class="text-stone-500 text-xs">${escapeHtml(e.observaciones)}</p>` : ''}
        </li>
      `).join('')}
    </ol>`;
}

function cerrarTimeline() {
  document.getElementById('negocioTimeline').classList.add('hidden');
  _negocioTimelienId = null;
}

function abrirNuevoNegocio() {
  document.querySelector('button[data-tab="cotizador"]').click();
  setTimeout(() => {
    document.getElementById('cotTitulo').focus();
  }, 200);
}

function cotizarDesdeNegocio() {
  if (!_negocioTimelienId) return;
  const titulo = document.getElementById('negocioTimelineTitle').textContent;
  document.querySelector('button[data-tab="cotizador"]').click();
  setTimeout(() => {
    document.getElementById('cotTitulo').value = titulo;
    document.getElementById('cotTitulo').focus();
  }, 200);
}

function cotizarDesdeFilaNegocio(opId, titulo, clienteId, clienteNombre) {
  document.querySelector('button[data-tab="cotizador"]').click();
  setTimeout(() => {
    document.getElementById('cotTitulo').value = titulo;
    if (clienteId) {
      document.getElementById('cotClienteId').value = clienteId;
      document.getElementById('cotClienteSeleccionado').textContent = '✔ ' + (clienteNombre || clienteId);
      document.getElementById('cotClienteBuscar').value = clienteNombre || clienteId;
    }
    if (typeof cotRefrescarEditarClienteBtn === 'function') cotRefrescarEditarClienteBtn();
  }, 300);
}

