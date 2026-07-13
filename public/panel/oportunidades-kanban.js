// ============================================================
// TAB OPORTUNIDADES KANBAN — extraído de panel-rdo.html (antifragilidad
// del panel, 2026-07-13). Script clásico sin IIFE a propósito: el HTML
// del tab (panel-rdo.html) genera onclick/ondrop/ondragstart inline que
// referencian estas funciones por nombre suelto (ej. ondrop="oppDrop(...)"
// oncick="oppAbrirDrawer(...)"). Envolver esto en un IIFE las sacaría del
// scope global y rompería esos handlers — mismo patrón que cotizador.js.
//
// NOTA: loadMiDia() (tab "Mi Día", pestaña distinta) vivía físicamente
// intercalada entre initOportunidadesKanban() y loadOportunidadesKanban()
// en el archivo original — se dejó a propósito en panel-rdo.html, no es
// parte de este bloque (extraer "sin mezclar otros tabs").
//
// Zona 2 relacionada NO incluida aquí: el panel de oportunidades dentro
// de la Ficha de Cliente (Cartera, ~línea 25995 de panel-rdo.html) es una
// feature distinta con su propio estado (window.COM.fichaCache), ya vive
// en su propio IIFE — candidato aparte para otra sesión, no el mismo
// bloque Kanban partido en dos.
// ============================================================

// ============================================================
// TAB OPORTUNIDADES KANBAN (D-OP-12) — v2 con Impulsa CRM
// ============================================================
// Capa 1 · Embudo Comercial Antifrágil · 11 estados canónicos
// Migración 12-jun-2026: nombres en español, secuenciados según el flujo real.
// La bifurcación V/C después de FACTURAR se decide por metadata.dte_codigo (33=venta, 46=compra).
const OPP_ESTADOS = [
  { id: 'prospeccion',     nombre: '🛂 Prospección',     color: 'bg-stone-100', emoji: '🛂' },
  { id: 'cotizacion',      nombre: '📋 Cotización',      color: 'bg-amber-50',  emoji: '📋' },
  { id: 'negociando',      nombre: '🤝 Negociando',      color: 'bg-cyan-50',   emoji: '🤝' },
  { id: 'coord_retiro',    nombre: '🚚 Coord. Retiro',   color: 'bg-blue-50',   emoji: '🚚' },
  { id: 'retirado',        nombre: '✅ Retirado',        color: 'bg-emerald-50', emoji: '✅' },
  { id: 'facturar',        nombre: '📄 FACTURAR',        color: 'bg-violet-50', emoji: '📄' },
  { id: 'cobranza',        nombre: '💸 Cobranza',        color: 'bg-sky-50',    emoji: '💸', rama: 'venta' },
  { id: 'ganada',          nombre: '🏆 Ganada',          color: 'bg-green-100', emoji: '🏆', rama: 'venta' },
  { id: 'esperando_pago',  nombre: '⏳ Esperando Pago',  color: 'bg-yellow-50', emoji: '⏳', rama: 'compra' },
  { id: 'pagado',          nombre: '💰 Pagado',          color: 'bg-lime-100',  emoji: '💰', rama: 'compra' },
  { id: 'perdida',         nombre: '✗ Perdida',          color: 'bg-red-50',    emoji: '✗' },
];
let _oppDrawerId   = null;
let _oppDrawerOrig = null;
let _oppSucursalesMap = null;
let _oppSearchTimer   = null;

// Motor de resolución widget (mig 370) — usado por la card (oppRenderCard)
// y por el drawer (oppAbrirDrawer) para traducir motivo_excepcion a texto
// legible. Un solo diccionario, sin duplicar entre las dos funciones.
const OPP_MOTIVO_LABELS = {
  sin_contacto: 'Sin datos de contacto',
  material_no_catalogado: 'Material no catalogado',
  requiere_cotizacion_logistica: 'Retiro — falta cotizar logística',
  requiere_certificado_rep: 'Requiere certificado REP',
  sin_precio_vigente: 'Sin precio vigente',
  seguimiento_futuro: 'Pidió seguimiento futuro',
  no_clasificado: 'Caso no clasificado',
  pre_motor_resolucion: 'Anterior al motor de resolución',
};

function oppDebouncedSearch() {
  clearTimeout(_oppSearchTimer);
  _oppSearchTimer = setTimeout(() => loadOportunidadesKanban(), 300);
}

// N2-5 · Resumen oportunidades pipeline (backend Pablo f_panel_health.crm)
async function _v4LoadOppResumen() {
  try {
    if (typeof sb === 'undefined' || !sb?.rpc) return;
    const { data, error } = await sb.rpc('f_panel_health');
    if (error || !data) return;
    const crmTotal = data?.crm?.oportunidades_total ?? 0;
    const crmMatch = data?.crm?.matcheadas_rdo ?? 0;
    const fuzzyRes = await sb.schema('staging').from('v_crm_match_sugerido').select('*', { count:'exact', head:true });
    const fuzzyTot = fuzzyRes?.count ?? 0;
    const oppAbiertasRes = await sb.schema('curated').from('oportunidades').select('*', { count:'exact', head:true }).neq('estado', 'cerrada_perdida').neq('estado', 'cerrada_ganada');
    const oppAbiertas = oppAbiertasRes?.count ?? 0;
    const setIf = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = (txt ?? 0).toLocaleString('es-CL'); };
    setIf('v4OppRdoAbiertas', oppAbiertas);
    setIf('v4OppCrmTotal', crmTotal);
    setIf('v4OppMatched', crmMatch);
    setIf('v4OppFuzzy', fuzzyTot);
  } catch(e) { console.warn('[v4-opp-resumen] fallo:', e); }
}

async function initOportunidadesKanban() {
  if (!window._v4OppResumenLoaded) { window._v4OppResumenLoaded = true; _v4LoadOppResumen(); }
  if (!_oppSucursalesMap) {
    const sucs = await ensureSucursalesCache();
    _oppSucursalesMap = new Map((sucs || []).map(s => [s.sucursal_id, s.nombre]));
  }
  await loadOportunidadesKanban();
}



async function loadOportunidadesKanban() {
  const cont = document.getElementById('oppKanban');
  cont.innerHTML = '<div class="skeleton" aria-busy="true"></div>';

  const origenFiltro    = document.getElementById('oppFiltroOrigen')?.value ?? 'rdo';
  const embudoFiltro    = document.getElementById('oppFiltroEmbudo')?.value ?? '';
  const mostrarCerrados = document.getElementById('oppMostrarCerrados')?.checked ?? false;
  const buscar = (document.getElementById('oppFiltroBuscar')?.value || '').trim();
  // Capa 2b · filtro alcance owner (mias / sucursal / todo)
  const alcanceFiltro = document.getElementById('oppFiltroAlcance')?.value ?? 'todo';

  // Capa 1 · usa la vista v2 (11 estados nuevos + flags metadata + rama V/C inferida)
  let q = sb.schema('panel').from('v_oportunidades_kanban_v2').select('*').order('fecha_recepcion', { ascending: false });
  if (origenFiltro === 'rdo') q = q.neq('origen', 'crm_impulsa');
  else if (origenFiltro === 'crm') q = q.eq('origen', 'crm_impulsa');
  else if (origenFiltro === 'widget_excepciones') {
    // Motor de resolución (mig 370): solo lo que Andrea debe mirar de verdad
    // — casos del widget que el bot NO pudo resolver solo.
    q = q.eq('origen', 'widget_web').in('nivel_autonomia', ['semi_auto', 'excepcion']);
  }
  if (!mostrarCerrados) q = q.not('estado', 'in', '("ganada","perdida","pagado")');

  // Capa 2b · filtro por responsable o por sucursal del usuario logueado
  if (alcanceFiltro === 'mias' && typeof currentUser === 'string' && currentUser) {
    q = q.eq('responsable', currentUser);
  } else if (alcanceFiltro === 'sucursal') {
    const miSuc = window._miSucursalId;
    if (miSuc) q = q.eq('sucursal_id', miSuc);
  }
  if (buscar) {
    const s = buscar.replace(/'/g, "''");
    q = q.or(`titulo.ilike.%${s}%,cliente_nombre.ilike.%${s}%`);
  }

  const [{ data: opps, error }, { data: kpis, error: e2 }] = await Promise.all([
    q,
    sb.schema('curated').rpc('oportunidades_kanban_kpis')
  ]);
  if (error) { cont.innerHTML = `<div class="text-red-600 col-span-full">Error: ${escapeHtml(error.message)}</div>`; return; }

  // Filtro embudo en JS (RDO no tiene embudo, siempre pasa)
  const allOpps = (opps || []);
  const filteredOpps = embudoFiltro
    ? allOpps.filter(o => o.origen !== 'crm_impulsa' || o.embudo === embudoFiltro)
    : allOpps;

  // Barra resumen ganadas/perdidas
  const totalGanadas = (kpis || []).reduce((s, k) => k.estado === 'ganada'  ? s + Number(k.cant) : s, 0);
  const totalPerdidas = (kpis || []).reduce((s, k) => k.estado === 'perdida' ? s + Number(k.cant) : s, 0);
  const barEl = document.getElementById('oppCerradosBar');
  if (barEl) {
    if (!mostrarCerrados && (totalGanadas > 0 || totalPerdidas > 0)) {
      barEl.classList.remove('hidden');
      const gEl = document.getElementById('oppBarGanadas');
      const pEl = document.getElementById('oppBarPerdidas');
      if (gEl) gEl.textContent = `✓ ${totalGanadas.toLocaleString('es-CL')} ganadas`;
      if (pEl) pEl.textContent = `✗ ${totalPerdidas.toLocaleString('es-CL')} perdidas`;
    } else {
      barEl.classList.add('hidden');
    }
  }

  const LIMIT_PER_COL = 30;
  const porEstado = {};
  OPP_ESTADOS.forEach(e => porEstado[e.id] = []);
  filteredOpps.forEach(o => {
    if (!porEstado[o.estado]) porEstado[o.estado] = [];
    porEstado[o.estado].push(o);
  });

  // Capa 2 v6 · siempre mostrar las 11 columnas (incluyendo ganada, perdida, pagado)
  // El usuario filtra por scroll horizontal, no escondiéndolas.
  const estadosVisibles = OPP_ESTADOS;
  const kpisMap = new Map((kpis || []).map(k => [k.estado, k]));
  // Capa 2 v4 · layout flex con scrollbar horizontal visible + botones de navegación
  // Columnas a 200px sin compresión. El usuario navega con scroll o botones ← →.
  cont.className = 'kanban-scroll flex gap-2 overflow-x-auto pt-3 snap-x';

  // Cajón espera factura: tarjetas con metadata.cajon_espera_factura=true se separan dentro de FACTURAR
  const opsFacturar = porEstado['facturar'] || [];
  const facturarCajon = opsFacturar.filter(o => o.cajon_espera_factura === true);
  const facturarMain  = opsFacturar.filter(o => !o.cajon_espera_factura);
  porEstado['facturar'] = facturarMain;

  cont.innerHTML = estadosVisibles.map(e => {
    const k = kpisMap.get(e.id);
    const cant = k ? Number(k.cant) : 0;
    const uf   = k ? Number(k.uf_total) : 0;
    const todos = porEstado[e.id] || [];
    const visible = todos.slice(0, LIMIT_PER_COL);
    const resto = todos.length - visible.length;
    const cards = visible.map(oppRenderCard).join('');
    const masBtn = resto > 0 ? `<div class="text-xs text-stone-400 italic py-2 text-center">+${resto.toLocaleString('es-CL')} más — usa búsqueda</div>` : '';
    const emptyMsg = todos.length === 0 ? '<div class="text-xs text-stone-400 italic py-3 text-center">Sin oportunidades</div>' : '';

    // Sub-zona cajón espera solo en columna FACTURAR
    const cajonZone = (e.id === 'facturar' && facturarCajon.length > 0) ? `
      <div class="mt-2 p-2 rounded border border-dashed border-amber-400 bg-amber-50">
        <div class="text-[10px] font-bold uppercase text-amber-800 mb-1">⏳ Espera factura proveedor (${facturarCajon.length})</div>
        <div class="space-y-1">${facturarCajon.map(oppRenderCard).join('')}</div>
      </div>` : '';

    const ramaBorder = e.rama === 'venta' ? 'border-l-4 border-l-sky-400'
                     : e.rama === 'compra' ? 'border-l-4 border-l-amber-400' : '';

    return `
      <div class="${e.color} ${ramaBorder} rounded-lg p-2 snap-start"
           style="flex:0 0 200px;width:200px"
           ondragover="event.preventDefault()" ondrop="oppDrop(event,'${e.id}')">
        <div class="flex justify-between items-baseline mb-2 pb-1.5 border-b border-stone-200">
          <h3 class="font-semibold text-sm text-stone-800 truncate" title="${escapeHtml(e.nombre)}">${escapeHtml(e.nombre)}</h3>
          <div class="text-[10px] text-stone-500 whitespace-nowrap ml-1">${cant.toLocaleString('es-CL')}${uf>0?' · '+uf.toLocaleString('es-CL',{maximumFractionDigits:1})+' UF':''}</div>
        </div>
        <div class="space-y-1.5">${cards}${masBtn}${emptyMsg}</div>
        ${cajonZone}
      </div>`;
  }).join('');
}

function oppRenderCard(o) {
  const esCrm  = o.origen === 'crm_impulsa';
  const monto  = o.valor_estimado_uf
    ? Number(o.valor_estimado_uf).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' UF'
    : (o.total_crm ? Number(o.total_crm).toLocaleString('es-CL', { maximumFractionDigits: 0 }) + ' ' + (o.divisa_crm || '') : '');
  const fechaRec = o.fecha_recepcion ? new Date(o.fecha_recepcion).toLocaleDateString('es-CL') : '';
  const embudoBadge = o.embudo ? `<span class="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded">${escapeHtml(o.embudo)}</span>` : '';
  const crmDot = esCrm ? '<span title="CRM Impulsa" class="inline-block w-2 h-2 rounded-full bg-purple-400 mr-1"></span>' : '';
  // Motor de resolución widget (mig 370) — resumen clicable de por qué este
  // caso necesita ojo humano, sin obligar a abrir el drawer para saberlo.
  const excepcionBadge = o.nivel_autonomia && o.nivel_autonomia !== 'auto'
    ? `<div class="mt-1"><span class="text-xs px-1 py-0.5 ${o.nivel_autonomia === 'excepcion' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} rounded">🔔 ${escapeHtml(OPP_MOTIVO_LABELS[o.motivo_excepcion] || o.nivel_autonomia)}</span></div>`
    : '';
  return `
    <div onclick="oppAbrirDrawer('${escapeHtml(o.oportunidad_id)}')"
         role="button" tabindex="0"
         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}"
         ontouchstart="this._tX=event.touches[0].clientX;this._tY=event.touches[0].clientY"
         ontouchend="if(Math.abs(event.changedTouches[0].clientX-(this._tX||0))<10&&Math.abs(event.changedTouches[0].clientY-(this._tY||0))<10){event.preventDefault();oppAbrirDrawer('${escapeHtml(o.oportunidad_id)}');}"
         draggable="true"
         ondragstart="oppDragStart(event,'${escapeHtml(o.oportunidad_id)}','${escapeHtml(o.origen || '')}')"
         data-entity-type="oportunidad" data-entity-id="${escapeHtml(o.oportunidad_id)}" data-entity-nombre="${escapeHtml(o.titulo || '')}"
         title="${esCrm ? 'CRM Impulsa · ' : ''}Click: detalle · Arrastrar: mover columna"
         class="bg-white rounded shadow-sm p-2 cursor-pointer hover:shadow-md transition select-none">
      <div class="font-medium text-sm text-stone-800 mb-1">${crmDot}${escapeHtml(o.titulo || '(sin título)')}</div>
      <div class="text-xs text-stone-600 mb-1 truncate">${escapeHtml(o.cliente_nombre || '')}</div>
      <div class="flex justify-between text-xs text-stone-500">
        <span>${escapeHtml(monto)}</span>
        <span>${escapeHtml(fechaRec)}</span>
      </div>
      ${embudoBadge ? `<div class="mt-1">${embudoBadge}</div>` : ''}
      ${excepcionBadge}
      ${o.responsable ? `<div class="text-xs text-stone-400 mt-1">👤 ${escapeHtml(o.responsable)}</div>` : ''}
    </div>`;
}

// ── Drag and drop ────────────────────────────────────────────
let _oppDragId     = null;
let _oppDragOrigen = null;

window.oppDragStart = function(event, oppId, origen) {
  _oppDragId     = oppId;
  _oppDragOrigen = origen;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', oppId);
};

// Helper · selector DTE para columna FACTURAR (33 venta · 46 compra · SII Chile Res 86/2016)
function _oppPickDte() {
  return new Promise(resolve => {
    const back = document.createElement('div');
    back.className = 'fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center';
    back.innerHTML = `
      <div class="bg-white rounded-xl p-5 max-w-md w-full mx-4 shadow-2xl">
        <h3 class="text-lg font-bold text-stone-800 mb-1">📄 Tipo de factura SII</h3>
        <p class="text-sm text-stone-600 mb-4">Esta oportunidad pasa a FACTURAR. ¿Qué DTE corresponde emitir?</p>
        <div class="space-y-2">
          <button data-dte="33" class="w-full text-left p-3 rounded-lg border-2 border-sky-200 hover:bg-sky-50 hover:border-sky-400 transition">
            <div class="font-bold text-sky-700">33 · Factura de Venta</div>
            <div class="text-xs text-stone-600 mt-0.5">Cliente compra a Reciclean (rama Venta → Cobranza → Ganada)</div>
          </button>
          <button data-dte="46" class="w-full text-left p-3 rounded-lg border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400 transition">
            <div class="font-bold text-amber-700">46 · Factura de Compra</div>
            <div class="text-xs text-stone-600 mt-0.5">Reciclean compra a proveedor sin DTE (rama Compra → Esperando Pago → Pagado)</div>
          </button>
        </div>
        <button data-cancel class="mt-4 w-full py-2 text-sm text-stone-500 hover:text-stone-800">Cancelar</button>
      </div>`;
    document.body.appendChild(back);
    back.querySelectorAll('button[data-dte]').forEach(b => {
      b.addEventListener('click', () => { back.remove(); resolve(b.dataset.dte); });
    });
    back.querySelector('button[data-cancel]').addEventListener('click', () => { back.remove(); resolve(null); });
    back.addEventListener('click', e => { if (e.target === back) { back.remove(); resolve(null); } });
  });
}

// Helper para mostrar toast
function _oppToast(msg, type = 'info') {
  const colors = { ok: 'bg-green-100 text-green-800', err: 'bg-red-100 text-red-800', info: 'bg-blue-100 text-blue-800', warn: 'bg-amber-100 text-amber-900' };
  const tmp = document.createElement('div');
  tmp.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-sm px-4 py-2 rounded shadow-lg z-50 max-w-sm`;
  tmp.textContent = msg;
  document.body.appendChild(tmp);
  setTimeout(() => tmp.remove(), 4000);
}

window.oppDrop = async function(event, estadoDestino) {
  event.preventDefault();
  const oppId = _oppDragId;
  const origen = _oppDragOrigen;
  _oppDragId = null; _oppDragOrigen = null;
  if (!oppId) return;

  if (origen === 'crm_impulsa') {
    _oppToast('CRM Impulsa — solo lectura. El estado no se puede cambiar desde el panel.', 'warn');
    return;
  }

  // Capa 2 · si destino es FACTURAR, pedir DTE (33 venta o 46 compra) antes de mover
  let dte = null;
  if (estadoDestino === 'facturar') {
    dte = await _oppPickDte();
    if (!dte) return; // canceló
  }

  // Capa 1 · usa RPC canónica con validaciones de permisos, salto, bifurcación V/C, audit
  const { data, error } = await sb.rpc('mover_oportunidad', {
    p_opp_id: oppId,
    p_nuevo_estado: estadoDestino,
    p_motivo: 'drag&drop kanban',
    p_dte_codigo: dte
  });

  if (error) {
    _oppToast('Error: ' + error.message, 'err');
    return;
  }
  if (data && data.ok === false) {
    _oppToast('No se pudo mover: ' + (data.error || 'razón desconocida'), 'err');
    return;
  }
  _oppToast(`Movida a ${estadoDestino}` + (dte ? ` · DTE ${dte}` : ''), 'ok');
  await loadOportunidadesKanban();
};

// Autoasignación mínima — rompe el candado circular de mover_oportunidad
// (exige owner/admin/responsable, pero responsable nace NULL en widget_web).
window.oppTomarCaso = async function() {
  if (!_oppDrawerId) return;
  const btn = document.getElementById('oppTomarCasoBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Tomando…'; }
  const { data, error } = await sb.rpc('tomar_oportunidad', { p_opp_id: _oppDrawerId });
  if (error || (data && data.ok === false)) {
    _oppToast('No se pudo tomar: ' + (error ? error.message : data.error), 'err');
    if (btn) { btn.disabled = false; btn.textContent = '🙋 Tomar este caso'; }
    return;
  }
  _oppToast('Caso tomado — ya sos responsable.', 'ok');
  await oppAbrirDrawer(_oppDrawerId);
  await loadOportunidadesKanban();
};

// ── Drawer ───────────────────────────────────────────────────
window.oppAbrirDrawer = async function(oppId) {
  _oppDrawerId = oppId;
  document.getElementById('oppDrawer').classList.remove('hidden');
  document.getElementById('oppDrawerMsg').classList.add('hidden');

  const resetIds = ['oppDrawerTitulo','oppDrawerCliente','oppDrawerEstadoActual',
    'oppDrawerMonto','oppDrawerProb','oppDrawerTipo','oppDrawerResp','oppDrawerSucursal',
    'oppDrawerFechaRec','oppDrawerFechaCierre','oppDrawerViabilidad','oppDrawerDesc',
    'oppDrawerEmbudo','oppDrawerRazonPerdida','oppDrawerTagsCrm','oppDrawerUnidadNeg',
    'oppDrawerCrmId','oppDrawerTotalCrm',
    'oppDrawerWidgetTelefono','oppDrawerWidgetIntent','oppDrawerWidgetEntrega','oppDrawerWidgetPrecio','oppDrawerWidgetRep'];
  resetIds.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '—'; });
  { const el = document.getElementById('oppDrawerWidgetBadge'); if (el) el.innerHTML = ''; }
  document.getElementById('oppDrawerTags').innerHTML = '';

  const { data: o, error } = await sb.schema('panel').from('v_oportunidades_kanban_v2').select('*').eq('oportunidad_id', oppId).maybeSingle();
  if (error || !o) {
    document.getElementById('oppDrawerTitulo').textContent = 'Error cargando oportunidad';
    return;
  }

  const esCrm = o.origen === 'crm_impulsa';
  _oppDrawerOrig = o.origen;

  document.getElementById('oppDrawerEstadoPanel').classList.toggle('hidden', esCrm);
  document.getElementById('oppDrawerCrmBadge').classList.toggle('hidden', !esCrm);

  document.getElementById('oppDrawerTitulo').textContent = o.titulo || '(sin título)';
  document.getElementById('oppDrawerCliente').textContent = o.cliente_nombre + (o.cliente_rut ? ' · ' + o.cliente_rut : '');
  if (!esCrm) {
    document.getElementById('oppDrawerEstadoActual').textContent = (OPP_ESTADOS.find(e => e.id === o.estado) || {}).nombre || o.estado;
    document.getElementById('oppDrawerEstadoSelect').value = o.estado;
  }

  if (o.valor_estimado_uf) {
    document.getElementById('oppDrawerMonto').textContent = Number(o.valor_estimado_uf).toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' UF';
  }
  const totalCrmRow = document.getElementById('oppDrawerTotalCrmRow');
  if (o.total_crm && totalCrmRow) {
    totalCrmRow.classList.remove('hidden');
    document.getElementById('oppDrawerTotalCrm').textContent =
      Number(o.total_crm).toLocaleString('es-CL', { maximumFractionDigits: 0 }) + ' ' + (o.divisa_crm || '');
  } else if (totalCrmRow) { totalCrmRow.classList.add('hidden'); }

  document.getElementById('oppDrawerProb').textContent = o.probabilidad_pct != null ? o.probabilidad_pct + '%' : '—';
  document.getElementById('oppDrawerTipo').textContent = [o.tipo, o.origen].filter(Boolean).join(' / ') || '—';
  document.getElementById('oppDrawerResp').textContent = o.responsable || '—';
  const tomarCasoBox = document.getElementById('oppTomarCasoBox');
  if (tomarCasoBox) tomarCasoBox.classList.toggle('hidden', !!o.responsable || esCrm);
  document.getElementById('oppDrawerSucursal').textContent = o.sucursal_id ? (_oppSucursalesMap.get(o.sucursal_id) || o.sucursal_id) : '—';
  document.getElementById('oppDrawerFechaRec').textContent = o.fecha_recepcion ? new Date(o.fecha_recepcion).toLocaleDateString('es-CL') : '—';
  document.getElementById('oppDrawerFechaCierre').textContent = o.fecha_cierre ? new Date(o.fecha_cierre).toLocaleDateString('es-CL') : '—';
  document.getElementById('oppDrawerViabilidad').textContent = o.viabilidad_resultado || '—';
  document.getElementById('oppDrawerDesc').textContent = o.descripcion || '—';

  const tags = [];
  if (o.viabilidad_resultado === 'viable') tags.push('<span class="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">✓ viable</span>');
  if (o.viabilidad_resultado === 'no_viable') tags.push('<span class="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">✗ no viable</span>');
  if (esCrm) tags.push('<span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">CRM Impulsa</span>');
  document.getElementById('oppDrawerTags').innerHTML = tags.join('');

  const impulsaSection = document.getElementById('oppDrawerImpulsaSection');
  if (esCrm && impulsaSection) {
    impulsaSection.classList.remove('hidden');
    document.getElementById('oppDrawerEmbudo').textContent = o.embudo || '—';
    document.getElementById('oppDrawerTagsCrm').textContent = o.tags_crm || '—';
    document.getElementById('oppDrawerUnidadNeg').textContent = o.unidad_negocio || '—';
    document.getElementById('oppDrawerCrmId').textContent = o.external_crm_id || '—';
    const razonRow = document.getElementById('oppDrawerRazonRow');
    if (o.razon_perdida) {
      razonRow.classList.remove('hidden');
      document.getElementById('oppDrawerRazonPerdida').textContent = o.razon_perdida;
    } else { razonRow.classList.add('hidden'); }
  } else if (impulsaSection) { impulsaSection.classList.add('hidden'); }

  // Datos del chatbot (widget_web) — mig 374. Antes solo vivían en
  // metadata.payload (jsonb), invisibles para Andrea sin consultar la BD.
  const widgetSection = document.getElementById('oppDrawerWidgetSection');
  const tieneDatosWidget = !!(o.widget_telefono || o.widget_intent || o.widget_modo_entrega || o.widget_precio_referencia);
  if (widgetSection) {
    widgetSection.classList.toggle('hidden', !tieneDatosWidget);
    if (tieneDatosWidget) {
      document.getElementById('oppDrawerWidgetTelefono').textContent = o.widget_telefono || '—';
      document.getElementById('oppDrawerWidgetIntent').textContent = o.widget_intent_label || o.widget_intent || '—';
      document.getElementById('oppDrawerWidgetEntrega').textContent =
        o.widget_modo_entrega === 'retiro' ? 'Con retiro (costo)' :
        o.widget_modo_entrega === 'entrega_propia' ? 'Entrega propia' : '—';
      document.getElementById('oppDrawerWidgetPrecio').textContent = o.widget_precio_referencia
        ? '$' + Number(o.widget_precio_referencia).toLocaleString('es-CL') + '/kg'
        : 'No se le informó precio (sin precio vigente en el chat)';
      const repRow = document.getElementById('oppDrawerWidgetRepRow');
      if (repRow) {
        repRow.classList.toggle('hidden', !o.widget_requiere_cert_rep);
        if (o.widget_requiere_cert_rep) document.getElementById('oppDrawerWidgetRep').textContent = 'Sí, solicitado (2,7 UF anuales)';
      }
      const badgeDiv = document.getElementById('oppDrawerWidgetBadge');
      if (badgeDiv) {
        badgeDiv.innerHTML = (o.nivel_autonomia && o.nivel_autonomia !== 'auto')
          ? `<span class="text-xs px-2 py-1 rounded ${o.nivel_autonomia === 'excepcion' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} font-semibold">🔔 ${escapeHtml(OPP_MOTIVO_LABELS[o.motivo_excepcion] || o.nivel_autonomia)}</span>`
          : '<span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-semibold">✅ Resuelto solo por el bot</span>';
      }
    }
  }

  // Capa 2b · Badge DTE bifurcación V/C
  const dteBadge = document.getElementById('oppDrawerDteBadge');
  if (dteBadge) {
    if (o.dte_codigo === '33') {
      dteBadge.className = 'mb-2 text-xs px-2 py-1 rounded bg-sky-100 text-sky-800 font-semibold';
      dteBadge.textContent = '🌊 Rama VENTA · DTE 33 emitido';
      dteBadge.classList.remove('hidden');
    } else if (o.dte_codigo === '46') {
      dteBadge.className = 'mb-2 text-xs px-2 py-1 rounded bg-amber-100 text-amber-900 font-semibold';
      dteBadge.textContent = '🏭 Rama COMPRA · DTE 46 emitido (cambio de sujeto IVA)';
      dteBadge.classList.remove('hidden');
    } else {
      dteBadge.classList.add('hidden');
    }
  }

  // Capa 2b · Adjuntos canónicos (panel.opp_archivos) — histórico Impulsa + nuevos
  const adjDiv = document.getElementById('oppDrawerAdjuntos');
  if (adjDiv) {
    let q = sb.schema('panel').from('opp_archivos').select('*');
    if (o.cliente_id) {
      q = q.or(`oportunidad_id.eq.${oppId},cliente_id.eq.${escapeHtml(o.cliente_id)}`);
    } else {
      q = q.eq('oportunidad_id', oppId);
    }
    const { data: adjs } = await q.order('fecha_subida', { ascending: false }).limit(50);
    if (adjs && adjs.length > 0) {
      adjDiv.innerHTML = adjs.map(a => {
        const ts = a.fecha_subida ? new Date(a.fecha_subida).toLocaleDateString('es-CL') : '';
        const badge = a.origen === 'impulsa'
          ? '<span class="text-[10px] px-1 bg-purple-100 text-purple-700 rounded">Impulsa</span>'
          : '<span class="text-[10px] px-1 bg-green-100 text-green-700 rounded">Nuevo</span>';
        return `<div class="flex items-center justify-between gap-2 py-1 border-b border-stone-100">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span>📄</span>
            <span class="truncate" title="${escapeHtml(a.nombre)}">${escapeHtml(a.nombre || a.archivo_path)}</span>
          </div>
          <div class="flex items-center gap-1 whitespace-nowrap">
            ${badge}
            <span class="text-[10px] text-stone-400">${ts}</span>
          </div>
        </div>`;
      }).join('');
    } else {
      adjDiv.innerHTML = '<div class="text-stone-400 italic">Sin archivos aún</div>';
    }
  }

  // Capa 2b · Historial de movimientos (panel.opp_seguimiento)
  const auditDiv = document.getElementById('oppDrawerAudit');
  if (auditDiv && !esCrm) {
    const { data: hist } = await sb.schema('panel').from('opp_seguimiento')
      .select('*').eq('oportunidad_id', oppId).order('creado_en', { ascending: false }).limit(20);
    if (hist && hist.length > 0) {
      auditDiv.innerHTML = hist.map(h => {
        const ts = h.creado_en ? new Date(h.creado_en).toLocaleString('es-CL') : '';
        const okIcon = h.resultado === 'ok' ? '✓' : '✗';
        const okColor = h.resultado === 'ok' ? 'text-green-700' : 'text-red-600';
        const dte = h.dte_codigo ? ` · DTE ${h.dte_codigo}` : '';
        return `<div class="flex items-start gap-2 py-1 border-b border-stone-100">
          <span class="${okColor} font-mono">${okIcon}</span>
          <div class="flex-1 min-w-0">
            <div><strong>${escapeHtml(h.estado_anterior || '—')}</strong> → <strong>${escapeHtml(h.estado_nuevo)}</strong>${dte}</div>
            <div class="text-[10px] text-stone-500">${ts} · ${escapeHtml(h.actor || '')}</div>
            ${h.motivo ? `<div class="text-[10px] text-stone-600 italic">${escapeHtml(h.motivo)}</div>` : ''}
          </div>
        </div>`;
      }).join('');
    } else {
      auditDiv.innerHTML = '<div class="text-stone-400 italic">Sin movimientos registrados aún</div>';
    }
  } else if (auditDiv) {
    auditDiv.innerHTML = '<div class="text-stone-400 italic">CRM Impulsa · sin audit local</div>';
  }
};

// Capa 2b · Subida real al bucket opp-files
window.oppSubirArchivo = async function(event) {
  const file = event.target.files?.[0];
  if (!file || !_oppDrawerId) return;
  const msg = document.getElementById('oppDrawerSubirMsg');
  msg.className = 'mt-1 text-xs text-blue-700';
  msg.textContent = `Subiendo ${file.name}…`;
  msg.classList.remove('hidden');

  const path = `${_oppDrawerId}/${Date.now()}_${file.name}`;
  const up = await sb.storage.from('opp-files').upload(path, file, { upsert: false });
  if (up.error) {
    msg.className = 'mt-1 text-xs text-red-700';
    msg.textContent = 'Error: ' + up.error.message;
    return;
  }

  // Registrar en panel.opp_archivos
  const cli = document.getElementById('oppDrawerCliente')?.dataset?.cliId || null;
  const ins = await sb.schema('panel').from('opp_archivos').insert({
    oportunidad_id: _oppDrawerId,
    cliente_id: cli,
    archivo_path: path,
    nombre: file.name,
    tipo: file.type || (file.name.split('.').pop() || ''),
    tamano_bytes: file.size,
    origen: 'nuevo',
    bucket: 'opp-files',
    subido_por: (typeof currentUser === 'string' ? currentUser : null)
  });
  if (ins.error) {
    msg.className = 'mt-1 text-xs text-amber-700';
    msg.textContent = 'Subido al bucket pero error al registrar: ' + ins.error.message;
    return;
  }
  msg.className = 'mt-1 text-xs text-green-700';
  msg.textContent = `✓ ${file.name} subido`;
  event.target.value = '';
  // Recargar adjuntos
  if (_oppDrawerId) await oppAbrirDrawer(_oppDrawerId);
};

window.oppCerrarDrawer = function() {
  document.getElementById('oppDrawer').classList.add('hidden');
  _oppDrawerId   = null;
  _oppDrawerOrig = null;
};

// ════════════════════════════════════════════════════════════════════
// Capa 2 v7 · Guía del Embudo Comercial Antifrágil
// Documento vivo: explica las 11 columnas, quién mueve qué, y qué requisitos
// tiene cada transición. Sin edición — solo lectura.
// Cuando llegue un pedido real de cambio (renombrar columna, etc.), recién
// ahí evaluar admin editable.
// ════════════════════════════════════════════════════════════════════
const _GUIA_COLUMNAS = [
  { e: '🛂', n: 'Prospección', desc: 'Primer contacto con el cliente. Lo crea el recepcionista en sucursal, una llamada, WhatsApp de Diego o el trigger automático de pesaje (cuando llega material sin opp abierta).', mueve: 'Cualquiera del silo Comercial · Recepcionista', requisito: 'Solo cliente + material. Lo mínimo.', siguiente: '📋 Cotización' },
  { e: '📋', n: 'Cotización', desc: 'Andrea o Ingrid generan la cotización con precio + flete + condiciones. PDF para enviar al cliente.', mueve: 'Comercial · admin', requisito: '—', siguiente: '🤝 Negociando o 🚚 Coord. Retiro si ya está cerrado' },
  { e: '🤝', n: 'Negociando', desc: 'El cliente discute precio o condiciones. Hay back-and-forth de propuestas.', mueve: 'Comercial · admin', requisito: '—', siguiente: '🚚 Coord. Retiro o ✗ Perdida' },
  { e: '🚚', n: 'Coord. Retiro', desc: 'Se acordó la operación. Se agenda fecha, chofer, ruta. La ficha pasa al equipo de Servicio.', mueve: 'Comercial · admin (recepcionista NO puede mover desde aquí)', requisito: 'Cliente confirmó', siguiente: '✅ Retirado' },
  { e: '✅', n: 'Retirado', desc: 'Material físicamente movido. Guía + acta firmadas. Listo para facturar.', mueve: 'Comercial · admin', requisito: 'Operación física completada', siguiente: '📄 FACTURAR' },
  { e: '📄', n: 'FACTURAR', desc: '<strong>Punto de bifurcación según SII Chile (Res. 86/2016).</strong> Se emite DTE 33 (Factura Venta) si el cliente compra a Reciclean, o DTE 46 (Factura Compra) si Reciclean compra al proveedor (cambio de sujeto IVA).', mueve: 'Comercial · admin · Jair (cumplimiento)', requisito: '<strong>Elegir DTE 33 o 46 en el modal</strong>', siguiente: '💸 Cobranza (rama Venta) o ⏳ Esperando Pago (rama Compra)', rama: 'BIFURCA' },
  { e: '💸', n: 'Cobranza', desc: '<span class="text-sky-700 font-semibold">[RAMA VENTA]</span> El cliente recibió la factura 33 y debe pagarnos. Dyana gestiona el cobro.', mueve: 'Comercial · admin · Dyana', requisito: 'DTE 33 emitido (factura venta)', siguiente: '🏆 Ganada', rama: 'VENTA' },
  { e: '🏆', n: 'Ganada', desc: '<span class="text-sky-700 font-semibold">[RAMA VENTA]</span> El cliente pagó. Venta cerrada con éxito. Se contabiliza como ingreso.', mueve: 'admin · Comercial', requisito: 'Cobro confirmado', siguiente: '— (estado final)', rama: 'VENTA' },
  { e: '⏳', n: 'Esperando Pago', desc: '<span class="text-amber-800 font-semibold">[RAMA COMPRA]</span> Reciclean emitió factura 46 al proveedor (cambio sujeto IVA). El proveedor espera que le paguemos.', mueve: 'Comercial · admin · Dyana', requisito: 'DTE 46 emitido (factura compra)', siguiente: '💰 Pagado', rama: 'COMPRA' },
  { e: '💰', n: 'Pagado', desc: '<span class="text-amber-800 font-semibold">[RAMA COMPRA]</span> Reciclean pagó al proveedor. Compra cerrada. Se contabiliza como egreso.', mueve: 'admin · Comercial', requisito: 'Pago al proveedor ejecutado', siguiente: '— (estado final)', rama: 'COMPRA' },
  { e: '✗', n: 'Perdida', desc: 'El cliente desistió, no respondió, o la operación cayó. La opp queda archivada con motivo.', mueve: 'Cualquiera (sin saltos)', requisito: 'Motivo recomendado (en el campo motivo de la RPC)', siguiente: '— (estado final)' }
];

window.abrirGuiaEmbudo = function() {
  let html = '';
  for (const c of _GUIA_COLUMNAS) {
    const ramaBadge = c.rama === 'BIFURCA' ? '<span class="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded ml-2">bifurca</span>'
                     : c.rama === 'VENTA' ? '<span class="text-xs bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded ml-2">rama Venta</span>'
                     : c.rama === 'COMPRA' ? '<span class="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded ml-2">rama Compra</span>' : '';
    html += `
      <div class="border-b border-stone-200 py-3">
        <div class="flex items-baseline gap-2 mb-1">
          <span class="text-2xl">${c.e}</span>
          <span class="font-bold text-stone-800 text-lg">${c.n}</span>
          ${ramaBadge}
        </div>
        <div class="text-sm text-stone-600 mb-2">${c.desc}</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div><span class="font-semibold text-stone-700">👤 Quién mueve:</span> ${c.mueve}</div>
          <div><span class="font-semibold text-stone-700">📋 Requisito:</span> ${c.requisito}</div>
          <div><span class="font-semibold text-stone-700">➡ Siguiente:</span> ${c.siguiente}</div>
        </div>
      </div>`;
  }
  const backdrop = document.createElement('div');
  backdrop.id = 'guiaEmbudoBackdrop';
  backdrop.className = 'fixed inset-0 bg-black/60 z-[10000] flex items-start justify-center overflow-y-auto p-4';
  backdrop.innerHTML = `
    <div class="bg-white rounded-xl max-w-4xl w-full my-8 shadow-2xl">
      <div class="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 rounded-t-xl flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">📖 Guía del Embudo Comercial</h2>
          <p class="text-xs opacity-90 mt-0.5">11 columnas · 5 cinturones · bifurcación SII 33/46 después de FACTURAR</p>
        </div>
        <button onclick="document.getElementById('guiaEmbudoBackdrop').remove()" class="text-white hover:bg-emerald-800 rounded-full w-8 h-8 flex items-center justify-center text-xl">×</button>
      </div>
      <div class="p-5">
        <div class="bg-stone-50 rounded-lg p-3 mb-4 text-sm text-stone-700">
          <strong>Reglas generales:</strong>
          <ul class="list-disc list-inside mt-1 space-y-0.5">
            <li>Cada movimiento queda <strong>auditado</strong> en panel.opp_seguimiento (quién, cuándo, motivo, DTE)</li>
            <li>Recepcionistas: solo pueden mover entre las <strong>3 primeras columnas</strong></li>
            <li>Salto máximo permitido: <strong>3 columnas</strong> (excepto Perdida, que se puede mover desde cualquier lado)</li>
            <li>Admin (Dusan/Pablo) y Owner del silo: libres de todas las restricciones de salto</li>
            <li>Perfil "read" (ej. Jair Cumplimiento): solo lectura, no mueve</li>
          </ul>
        </div>
        ${html}
        <div class="mt-4 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900">
          <strong>⚠ ¿Querés cambiar una columna, agregar otra o reordenar?</strong><br>
          Hoy las 11 columnas están definidas en el código + BD (CHECK constraint). Cualquier cambio requiere firma de Dusan + deploy. Cuando aparezca el primer pedido real, evaluamos si construir un admin editable.
        </div>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
};

window.oppMoverEstado = async function() {
  if (!_oppDrawerId) return;
  if (_oppDrawerOrig === 'crm_impulsa') return;

  const nuevoEstado = document.getElementById('oppDrawerEstadoSelect').value;
  const msg = document.getElementById('oppDrawerMsg');
  const btn = document.getElementById('oppDrawerMoverBtn');
  msg.classList.add('hidden');

  // Capa 2b · pasar por RPC canónica con DTE selector en FACTURAR
  let dte = null;
  if (nuevoEstado === 'facturar' && typeof _oppPickDte === 'function') {
    dte = await _oppPickDte();
    if (!dte) return;
  }

  btn.disabled = true; btn.textContent = 'Moviendo…';
  const { data, error } = await sb.rpc('mover_oportunidad', {
    p_opp_id: _oppDrawerId,
    p_nuevo_estado: nuevoEstado,
    p_motivo: 'drawer manual',
    p_dte_codigo: dte
  });
  btn.disabled = false; btn.textContent = 'Mover';

  if (error) {
    msg.className = 'mt-2 text-xs p-2 rounded bg-red-50 text-red-700';
    msg.textContent = 'Error: ' + error.message;
    msg.classList.remove('hidden');
    return;
  }
  if (data && data.ok === false) {
    msg.className = 'mt-2 text-xs p-2 rounded bg-red-50 text-red-700';
    msg.textContent = 'Rechazado: ' + (data.error || '');
    msg.classList.remove('hidden');
    return;
  }
  msg.className = 'mt-2 text-xs p-2 rounded bg-green-50 text-green-700';
  msg.textContent = `Estado actualizado a ${nuevoEstado}` + (dte ? ` · DTE ${dte}` : '');
  msg.classList.remove('hidden');
  await loadOportunidadesKanban();
  if (_oppDrawerId) await oppAbrirDrawer(_oppDrawerId);
};
