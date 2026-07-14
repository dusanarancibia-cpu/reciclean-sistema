// ============================================================
// ANDREA — BANDEJAS ADMINISTRATIVAS + DECISOR + HUAL COMPRA
// extraído de panel-rdo.html (antifragilidad panel, bloque 13)
//
// UN SOLO DOMINIO ADMINISTRATIVO (no 2 mezclados por accidente — verificado
// antes de extraer, a diferencia del nudo Mesa Control/Firmas del bloque 11):
// mismo autor (PC2 Pablo), mismo lote de migraciones (292-295, 11-jun-2026),
// HTML 100% contiguo en el original, helpers genuinamente compartidos por
// los 4 grupos (no exclusivos de uno), 1 sola función init() sin
// sub-registro independiente.
//
// 4 grupos temáticos dentro del mismo dominio:
//   1. Calidad de datos Andrea: Duplicados + Drift Libre + RUTs Inválidos
//      (RPCs andrea_decidir_dup/andrea_resolver_drift/andrea_corregir_rut,
//      vistas v_andrea_dup_pendientes/v_andrea_drift_libre/
//      v_andrea_ruts_invalidos + variantes _historico)
//   2. Comex (RPCs comex_alta/comex_avanzar_estado, vista v_andrea_comex_activos)
//   3. Decisión comercial: Decisor Venta + HUAL Compra (HUAL vive físicamente
//      dentro de la sección de Decisor en el original, sin header propio —
//      probable par compra/venta construido junto)
//   4. Documentos financieros: Cobranza + Actas (RPCs f_estado_bono/
//      firmar_acta, vistas v_andrea_cobranza/v_andrea_actas)
//
// Helpers compartidos reales (usados por los 4 grupos, no exclusivos de
// ninguno — $$/esc/fmtFecha/fmtPct con 85/54/4/2 usos respectivamente;
// fmtCLP usado por Decisor+Cobranza).
//
// init() único: registra los 8 bind() de tab-switch + los listeners
// delegados de los 4 grupos. No se dividió porque no hay 2 dominios reales
// que separar (a diferencia de Mesa Control 99-99 vs Firmas/Tarifas).
//
// ⚠️ Lecturas read-only de vistas pricing-adjacentes (documentado, no
// bloqueante — cero acoplamiento de código con los tabs de Precios
// excluidos):
//   - HUAL Compra lee curated.comprador_precio_actual +
//     curated.vw_calibracion_triple (misma vista que usa el Calibrador de
//     Margen, ya extraído en bloque 11 · public/panel/mesa-control-99-99.js).
//   - Decisor Venta lee panel.v_matriz_precios_compradores.
//
// ⚠️ HALLAZGO — contrato inline HTML pre-existente (reportado antes de
// extraer, resuelto según autorización explícita de Dusan):
//   El HTML original tiene onchange="loadHualCompra()" (select
//   hualFiltroSuc) y onclick="loadHualCompra()" (botón Actualizar) — únicos
//   handlers inline de todo este bloque (los otros 7 tabs usan 100%
//   addEventListener interno). Verificado en producción ANTES de esta
//   extracción: typeof window.loadHualCompra === 'undefined' — el filtro
//   de sucursal y el botón Actualizar de HUAL YA estaban rotos en
//   producción (bug pre-existente, no introducido por este cambio). Se
//   resuelve agregando `window.loadHualCompra = loadHualCompra;` (línea
//   marcada abajo) — mismo contrato HTML preservado tal cual, sin tocar
//   panel-rdo.html.
//
// Fuera de alcance (no tocado): CRM Impulsa/Ficha-Cliente/Gestiones,
// Herramientas Externas/Facturación Grupo, Diego LLM, Precios (tabs),
// el núcleo.
// ============================================================

// PC2 11-jun · Trio bandejas CU Andrea + Comex
// Migs 292+293+294+295. Backend RPCs: andrea_decidir_dup,
// andrea_resolver_drift, andrea_corregir_rut, comex_alta,
// comex_avanzar_estado. Vistas: v_andrea_dup_pendientes,
// v_andrea_drift_libre, v_andrea_ruts_invalidos, v_andrea_comex_activos.
// ============================================================
(function () {
  function $$(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }
  function fmtFecha(s) { if (!s) return '—'; try { return new Date(s).toLocaleDateString('es-CL'); } catch(e) { return s; } }
  function fmtPct(n) { if (n == null) return '—'; return (Number(n) * 100).toFixed(0) + '%'; }
  let _rutsCorregidos = 0;

  // ------------------ BANDEJA 1 · Duplicados ------------------
  async function loadDup() {
    const lista = $$('adup_lista'); if (!lista) return;
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Cargando...</div>';
    try {
      const verHist = $$('adup_ver_historico')?.checked;
      const vista = verHist ? 'v_andrea_dup_pendientes_historico' : 'v_andrea_dup_pendientes';
      const { data, error } = await sb.schema('panel').from(vista).select('*');
      if (error) throw error;
      $$('adup_kpi_total').textContent = (data || []).length;
      $$('adup_kpi_alta').textContent = (data || []).filter(r => (r.similitud_nombre || 0) >= 0.7).length;
      $$('adup_kpi_baja').textContent = (data || []).filter(r => (r.similitud_nombre || 0) < 0.7).length;
      if (!data || data.length === 0) {
        lista.innerHTML = '<div class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">✓ No hay duplicados pendientes.</div>';
        return;
      }
      lista.innerHTML = data.map(r => `
        <div class="bg-white border border-stone-200 rounded p-3" data-dup-id="${esc(r.id)}">
          <div class="flex items-start justify-between mb-2">
            <div class="text-xs text-stone-500">Detectado ${fmtFecha(r.detectado_at)} · similitud ${fmtPct(r.similitud_nombre)} · RUT ${esc(r.rut || '—')}</div>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-2">
            <div class="border border-stone-200 rounded p-2 bg-stone-50">
              <div class="text-xs text-stone-500">Cliente NUEVO (${esc(r.cliente_id_nuevo)})</div>
              <div class="font-semibold text-sm">${esc(r.razon_social_nueva)}</div>
              <div class="text-xs text-stone-500">Sucursal: ${esc(r.sucursal_nueva || '—')}</div>
              <button class="adup-btn-mergear mt-1 px-2 py-0.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700" data-par-id="${esc(r.id)}" data-ganador="${esc(r.cliente_id_existente)}" data-perdedor="${esc(r.cliente_id_nuevo)}">Mergear ← (existente gana)</button>
            </div>
            <div class="border border-stone-200 rounded p-2 bg-stone-50">
              <div class="text-xs text-stone-500">Cliente EXISTENTE (${esc(r.cliente_id_existente)})</div>
              <div class="font-semibold text-sm">${esc(r.razon_social_existente)}</div>
              <div class="text-xs text-stone-500">Sucursal: ${esc(r.sucursal_existente || '—')}</div>
              <button class="adup-btn-mergear mt-1 px-2 py-0.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700" data-par-id="${esc(r.id)}" data-ganador="${esc(r.cliente_id_nuevo)}" data-perdedor="${esc(r.cliente_id_existente)}">Mergear → (nuevo gana)</button>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="adup-btn-decision px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700" data-par-id="${esc(r.id)}" data-decision="ambos_validos">Son clientes distintos</button>
            <button class="adup-btn-decision px-2 py-1 bg-stone-400 text-white rounded text-xs hover:bg-stone-500" data-par-id="${esc(r.id)}" data-decision="no_mergear">Desestimar (revisar después)</button>
          </div>
        </div>`).join('');
    } catch (e) {
      lista.innerHTML = '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">Error: ' + esc(e.message || String(e)) + '</div>';
    }
  }

  async function decidirDup(parId, decision, ganador) {
    if (!confirm('¿Confirmar decisión: ' + decision + (ganador ? ' (ganador=' + ganador + ')' : '') + '?')) return;
    try {
      const { data, error } = await sb.rpc('andrea_decidir_dup', { p_par_id: parId, p_decision: decision, p_ganador_cliente_id: ganador || null, p_notas: null });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error desconocido');
      loadDup();
    } catch (e) { alert('No se pudo registrar: ' + (e.message || e)); }
  }

  // ------------------ BANDEJA 2 · Drift libre ------------------
  async function loadDrift() {
    const lista = $$('adrift_lista'); if (!lista) return;
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Cargando...</div>';
    try {
      const verHist = $$('adrift_ver_historico')?.checked;
      const vista = verHist ? 'v_andrea_drift_libre_historico' : 'v_andrea_drift_libre';
      const { data, error } = await sb.schema('panel').from(vista).select('*').limit(50);
      if (error) throw error;
      $$('adrift_kpi_total').textContent = (data || []).length;
      $$('adrift_kpi_opps').textContent = (data || []).reduce((a, r) => a + (r.opps_count || 0), 0);
      const top = (data || []).slice().sort((a, b) => (b.opps_count || 0) - (a.opps_count || 0))[0];
      $$('adrift_kpi_top').textContent = top ? top.cliente_nombre_libre + ' (' + top.opps_count + ')' : '—';
      if (!data || data.length === 0) {
        lista.innerHTML = '<div class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">✓ No hay nombres drift pendientes.</div>';
        return;
      }
      lista.innerHTML = data.map(r => {
        const cands = Array.isArray(r.candidatos) ? r.candidatos.slice(0, 3) : [];
        const candHtml = cands.length ? cands.map(c => `
          <button class="adrift-btn-asignar block w-full text-left px-2 py-1 mt-0.5 bg-emerald-50 border border-emerald-200 rounded text-xs hover:bg-emerald-100" data-drift-id="${esc(r.id)}" data-cliente-id="${esc(c.cliente_id)}">
            → Asignar a <span class="font-semibold">${esc(c.razon_social || c.cliente_id)}</span> <span class="text-stone-500">(score ${(c.score || 0).toFixed(2)})</span>
          </button>`).join('') : '<div class="text-xs text-stone-500 italic">Sin candidatos sugeridos.</div>';
        return `
        <div class="bg-white border border-stone-200 rounded p-3">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-semibold text-sm">${esc(r.cliente_nombre_libre)}</div>
              <div class="text-xs text-stone-500">${r.opps_count || 0} oportunidades afectadas · detectado ${fmtFecha(r.detectado_at)}</div>
            </div>
          </div>
          <div class="mb-2">${candHtml}</div>
          <div class="flex gap-2 flex-wrap">
            <input type="text" placeholder="O escribí cliente_id manualmente" class="adrift-input-cid flex-1 border rounded px-2 py-1 text-xs" data-drift-id="${esc(r.id)}">
            <button class="adrift-btn-asignar-manual px-2 py-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700" data-drift-id="${esc(r.id)}">Asignar manual</button>
            <button class="adrift-btn-decision px-2 py-1 bg-stone-400 text-white rounded text-xs hover:bg-stone-500" data-drift-id="${esc(r.id)}" data-decision="sin_match">Sin match</button>
            <button class="adrift-btn-decision px-2 py-1 bg-stone-400 text-white rounded text-xs hover:bg-stone-500" data-drift-id="${esc(r.id)}" data-decision="descartar">Descartar</button>
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      lista.innerHTML = '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">Error: ' + esc(e.message || String(e)) + '</div>';
    }
  }

  async function resolverDrift(driftId, decision, clienteId) {
    if (!confirm('¿Confirmar: ' + decision + (clienteId ? ' a cliente ' + clienteId : '') + '?')) return;
    try {
      const { data, error } = await sb.rpc('andrea_resolver_drift', { p_drift_id: driftId, p_cliente_id_elegido: clienteId || null, p_decision: decision, p_notas: null });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error desconocido');
      alert('OK. Opps actualizadas: ' + (data.opps_actualizadas || 0));
      loadDrift();
    } catch (e) { alert('No se pudo registrar: ' + (e.message || e)); }
  }

  // ------------------ BANDEJA 3 · RUTs inválidos ------------------
  async function loadRuts() {
    const lista = $$('aruts_lista'); if (!lista) return;
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Cargando...</div>';
    try {
      const verHist = $$('aruts_ver_historico')?.checked;
      const vista = verHist ? 'v_andrea_ruts_invalidos_historico' : 'v_andrea_ruts_invalidos';
      const { data, error } = await sb.schema('panel').from(vista).select('*');
      if (error) throw error;
      $$('aruts_kpi_total').textContent = (data || []).length;
      $$('aruts_kpi_corregidos').textContent = _rutsCorregidos;
      if (!data || data.length === 0) {
        lista.innerHTML = '<div class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">✓ No hay RUTs inválidos.</div>';
        return;
      }
      lista.innerHTML = data.map(r => `
        <div class="bg-white border border-stone-200 rounded p-3">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-semibold text-sm">${esc(r.razon_social || '—')}</div>
              <div class="text-xs text-stone-500">cliente_id ${esc(r.cliente_id)} · RUT actual: <span class="font-mono">${esc(r.rut || '—')}</span> · motivo: ${esc(r.motivo || '—')}</div>
            </div>
          </div>
          <div class="flex gap-2 flex-wrap items-center">
            <input type="text" placeholder="RUT correcto (ej: 12345678-5)" class="aruts-input-rut flex-1 border rounded px-2 py-1 text-xs font-mono" data-cliente-id="${esc(r.cliente_id)}">
            <button class="aruts-btn-corregir px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700" data-cliente-id="${esc(r.cliente_id)}">Corregir RUT</button>
          </div>
        </div>`).join('');
    } catch (e) {
      lista.innerHTML = '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">Error: ' + esc(e.message || String(e)) + '</div>';
    }
  }

  async function corregirRut(clienteId, rutNuevo) {
    if (!rutNuevo || rutNuevo.length < 3) { alert('Ingresá un RUT válido (con guión).'); return; }
    if (!confirm('¿Aplicar RUT ' + rutNuevo + ' al cliente ' + clienteId + '?')) return;
    try {
      const { data, error } = await sb.rpc('andrea_corregir_rut', { p_cliente_id: clienteId, p_rut_nuevo: rutNuevo, p_notas: null });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error desconocido');
      _rutsCorregidos++;
      loadRuts();
    } catch (e) { alert('No se pudo corregir: ' + (e.message || e)); }
  }

  // ------------------ TAB 4 · Comex ------------------
  async function loadComex() {
    const lista = $$('acomex_lista'); if (!lista) return;
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Cargando...</div>';
    try {
      const { data, error } = await sb.schema('panel').from('v_andrea_comex_activos').select('*');
      if (error) throw error;
      $$('acomex_kpi_total').textContent = (data || []).length;
      $$('acomex_kpi_iniciado').textContent = (data || []).filter(r => r.estado === 'iniciado').length;
      $$('acomex_kpi_transito').textContent = (data || []).filter(r => r.estado === 'en_transito').length;
      $$('acomex_kpi_llegado').textContent = (data || []).filter(r => r.estado === 'llegado').length;
      if (!data || data.length === 0) {
        lista.innerHTML = '<div class="text-sm text-stone-500 bg-stone-50 border border-stone-200 rounded p-3">Sin operaciones activas. Creá una con + Nueva operación.</div>';
        return;
      }
      const badge = (e) => e === 'iniciado' ? 'bg-amber-100 text-amber-800' : e === 'en_transito' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800';
      const next = (e) => e === 'iniciado' ? 'en_transito' : e === 'en_transito' ? 'llegado' : null;
      lista.innerHTML = data.map(r => `
        <div class="bg-white border border-stone-200 rounded p-3">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-semibold text-sm">${esc(r.cliente || '—')} <span class="text-xs text-stone-500">· ${esc(r.tipo)}</span></div>
              <div class="text-xs text-stone-500">${esc(r.forwarder)} · BL ${esc(r.numero_bl || '—')} · ${esc(r.origen || '—')} → ${esc(r.destino || '—')}</div>
              <div class="text-xs text-stone-500">ETD ${fmtFecha(r.fecha_etd)} · ETA ${fmtFecha(r.fecha_eta)} ${r.dias_a_eta != null ? '(' + r.dias_a_eta + ' días)' : ''}</div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded ${badge(r.estado)}">${esc(r.estado)}</span>
          </div>
          ${next(r.estado) ? `<button class="acomex-btn-avanzar px-2 py-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700" data-id="${esc(r.id)}" data-nuevo="${next(r.estado)}">Avanzar a ${next(r.estado)}</button>` : ''}
          ${r.notas ? '<div class="mt-2 text-xs text-stone-600 whitespace-pre-line border-l-2 border-stone-300 pl-2">' + esc(r.notas) + '</div>' : ''}
        </div>`).join('');
    } catch (e) {
      lista.innerHTML = '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">Error: ' + esc(e.message || String(e)) + '</div>';
    }
  }

  async function comexAvanzar(id, nuevo) {
    const notas = prompt('Notas para este cambio (opcional):') || null;
    try {
      const { data, error } = await sb.rpc('comex_avanzar_estado', { p_id: id, p_nuevo_estado: nuevo, p_notas_adicionales: notas });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error desconocido');
      loadComex();
    } catch (e) { alert('No se pudo avanzar: ' + (e.message || e)); }
  }

  async function comexGuardar() {
    const forwarder = $$('acomex_f_forwarder').value.trim();
    const tipo = $$('acomex_f_tipo').value;
    const cliente_id = $$('acomex_f_cliente_id').value.trim() || null;
    const cliente_libre = $$('acomex_f_cliente_libre').value.trim() || null;
    if (!forwarder) { alert('Forwarder es obligatorio.'); return; }
    if (!cliente_id && !cliente_libre) { alert('Indicá cliente_id master o cliente_nombre_libre.'); return; }
    try {
      const { data, error } = await sb.rpc('comex_alta', {
        p_forwarder: forwarder, p_tipo: tipo,
        p_cliente_id: cliente_id, p_cliente_nombre_libre: cliente_libre,
        p_numero_bl: $$('acomex_f_bl').value.trim() || null,
        p_origen: $$('acomex_f_origen').value.trim() || null,
        p_destino: $$('acomex_f_destino').value.trim() || null,
        p_fecha_etd: $$('acomex_f_etd').value || null,
        p_fecha_eta: $$('acomex_f_eta').value || null,
        p_notas: $$('acomex_f_notas').value.trim() || null
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error desconocido');
      // Limpiar form + ocultar
      ['forwarder','cliente_id','cliente_libre','bl','origen','destino','etd','eta','notas'].forEach(k => { const el = $$('acomex_f_' + k); if (el) el.value = ''; });
      $$('acomex_form').classList.add('hidden');
      loadComex();
    } catch (e) { alert('No se pudo guardar: ' + (e.message || e)); }
  }

  // ------------------ TAB 5 · Decisor Venta ------------------
  let _decMatCache = null, _decSucCache = null;
  async function decBootstrap() {
    // Cargar selects una sola vez
    if (!_decMatCache) {
      const { data: mats } = await sb.schema('curated').from('materiales').select('material_id, nombre, categoria').eq('activo', true).order('nombre');
      _decMatCache = mats || [];
      const sel = $$('dec_material');
      if (sel) sel.innerHTML = '<option value="">Elegí material…</option>' + _decMatCache.map(m => `<option value="${esc(m.material_id)}">${esc(m.nombre)} <span>(${esc(m.categoria || '-')})</span></option>`).join('');
    }
    if (!_decSucCache) {
      const { data: sucs } = await sb.schema('curated').from('sucursales').select('sucursal_id, nombre').order('nombre');
      _decSucCache = sucs || [];
      const sel = $$('dec_sucursal');
      if (sel) sel.innerHTML = '<option value="">Elegí sucursal…</option>' + _decSucCache.map(s => `<option value="${esc(s.sucursal_id)}">${esc(s.nombre)}</option>`).join('');
    }
  }
  // ── HUAL vs Compra ──────────────────────────────────────────────
  let _hualSucLoaded = false;
  async function loadHualCompra() {
    const div = $$('hualCompraTabla'); if (!div) return;
    div.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Cargando…</div>';
    try {
      // 1. Precios HUAL (PV07)
      const { data: hualRows, error: e1 } = await sb.schema('curated').from('comprador_precio_actual')
        .select('material_id, precio_clp_kg, vigente_desde')
        .eq('comprador_id', 'PV07').is('vigente_hasta', null);
      if (e1) throw e1;

      // 2. Nombres de materiales
      const { data: mats } = await sb.schema('curated').from('materiales').select('material_id, nombre');
      const matMap = Object.fromEntries((mats || []).map(m => [m.material_id, m.nombre]));

      // 3. Precios de compra efectivos (real_30d si hay vales, si no catálogo)
      const sucFiltro = $$('hualFiltroSuc')?.value || '';
      let q = sb.schema('curated').from('vw_calibracion_triple')
        .select('material_id, sucursal_id, precio_compra_efectivo_clp');
      if (sucFiltro) q = q.eq('sucursal_id', sucFiltro);
      const { data: compraRows } = await q;

      // 4. Llenar filtro sucursales (1 vez)
      if (!_hualSucLoaded) {
        const { data: sucs } = await sb.schema('curated').from('sucursales').select('sucursal_id, nombre').order('nombre');
        const sel = $$('hualFiltroSuc');
        if (sel && sucs) {
          sel.innerHTML = '<option value="">Todas las sucursales</option>' + sucs.map(s => `<option value="${esc(s.sucursal_id)}">${esc(s.nombre)}</option>`).join('');
        }
        _hualSucLoaded = true;
      }

      // 5. Build map: material_id → avg precio_compra
      const compraMap = {};
      for (const r of (compraRows || [])) {
        if (!compraMap[r.material_id]) compraMap[r.material_id] = [];
        compraMap[r.material_id].push(Number(r.precio_compra_efectivo_clp || 0));
      }
      const compraAvg = {};
      for (const [mid, vals] of Object.entries(compraMap)) {
        compraAvg[mid] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      }

      // 6. Render
      if (!hualRows || hualRows.length === 0) {
        div.innerHTML = '<div class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">No hay precios HUAL cargados para PV07. Usá la función actualizar_precio_comprador desde SQL Editor.</div>';
        return;
      }
      const filas = hualRows.map(r => {
        const hual = Number(r.precio_clp_kg || 0);
        const compra = compraAvg[r.material_id] ?? null;
        const margen = (hual > 0 && compra !== null) ? Math.round(((hual - compra) / hual) * 100) : null;
        const sem = margen === null ? '⚪' : margen >= 40 ? '🟢' : margen >= 25 ? '🟡' : '🔴';
        const dia = r.vigente_desde ? r.vigente_desde.slice(0, 10) : '—';
        return { material: matMap[r.material_id] || r.material_id, hual, compra, margen, sem, dia };
      }).sort((a, b) => (a.margen ?? 999) - (b.margen ?? 999));

      div.innerHTML = `<table class="w-full text-xs border-collapse">
        <thead><tr class="bg-stone-100 text-stone-700">
          <th class="text-left px-2 py-2">Material</th>
          <th class="text-right px-2 py-2">HUAL paga</th>
          <th class="text-right px-2 py-2">Tú pagas</th>
          <th class="text-right px-2 py-2">Margen</th>
          <th class="text-center px-2 py-2">Estado</th>
          <th class="text-right px-2 py-2 text-stone-400">Precio desde</th>
        </tr></thead>
        <tbody>${filas.map(f => `<tr class="border-b border-stone-100 hover:bg-stone-50">
          <td class="px-2 py-1.5 font-medium">${esc(f.material)}</td>
          <td class="px-2 py-1.5 text-right text-emerald-700 font-semibold">$${f.hual.toLocaleString('es-CL')}</td>
          <td class="px-2 py-1.5 text-right">${f.compra !== null ? '$' + f.compra.toLocaleString('es-CL') : '<span class="text-stone-400">—</span>'}</td>
          <td class="px-2 py-1.5 text-right font-bold ${f.margen === null ? 'text-stone-400' : f.margen >= 40 ? 'text-emerald-700' : f.margen >= 25 ? 'text-amber-600' : 'text-red-600'}">${f.margen !== null ? f.margen + '%' : '—'}</td>
          <td class="px-2 py-1.5 text-center text-base">${f.sem}</td>
          <td class="px-2 py-1.5 text-right text-stone-400">${esc(f.dia)}</td>
        </tr>`).join('')}</tbody>
      </table>`;
    } catch (err) {
      div.innerHTML = `<div class="text-red-600 text-sm p-3">${esc(err.message || String(err))}</div>`;
    }
  }
  window.loadHualCompra = loadHualCompra; // fix: onclick/onchange inline en HTML requieren global (bug pre-existente, ver header)
  // ────────────────────────────────────────────────────────────────

  async function loadDecisor() {
    const lista = $$('dec_lista'); if (!lista) return;
    await decBootstrap();
    const matId = $$('dec_material').value;
    const kg = parseFloat($$('dec_kg').value);
    const suc = $$('dec_sucursal').value;
    if (!matId || !kg || kg <= 0 || !suc) {
      lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Elegí material + kg + sucursal para empezar.</div>';
      $$('dec_kpi_total').textContent = '0'; $$('dec_kpi_stale').textContent = '0'; $$('dec_kpi_top').textContent = '—';
      return;
    }
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Calculando…</div>';
    try {
      const { data, error } = await sb.schema('panel').from('v_matriz_precios_compradores')
        .select('*').eq('material_id', matId).not('precio_clp_kg', 'is', null);
      if (error) throw error;
      const filas = (data || []).map(r => ({
        ...r,
        precio: Number(r.precio_clp_kg || 0),
        total_clp: Math.round(Number(r.precio_clp_kg || 0) * kg),
        stale: (r.dias_desde_actualizacion || 0) > 7,
      })).sort((a, b) => b.total_clp - a.total_clp);

      // Bonos: una llamada por comprador top 5 (no spamear)
      const bonos = {};
      for (const f of filas.slice(0, 5)) {
        try {
          const { data: bonos_data } = await sb.rpc('f_estado_bono', { p_comprador_id: f.comprador_id, p_material_id: matId });
          if (bonos_data && bonos_data.length) bonos[f.comprador_id] = bonos_data;
        } catch (e) { /* silencioso */ }
      }

      $$('dec_kpi_total').textContent = filas.length;
      $$('dec_kpi_stale').textContent = filas.filter(f => f.stale).length;
      $$('dec_kpi_top').textContent = filas[0] ? '$' + filas[0].total_clp.toLocaleString('es-CL') : '—';

      if (filas.length === 0) {
        lista.innerHTML = '<div class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">Ningún comprador activo tiene precio cargado para este material. Cargá un precio en la Bandeja Precios o actualizá el comprador.</div>';
        return;
      }
      lista.innerHTML = filas.map((f, i) => {
        const podio = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
        const bonoList = bonos[f.comprador_id] || [];
        const bonoHtml = bonoList.length ? '<div class="mt-1 text-xs text-amber-700">' + bonoList.map(b => `🎁 ${esc(b.nombre_bono)}: ${Number(b.acumulado_kg||0).toLocaleString('es-CL')}/${Number(b.meta_kg||0).toLocaleString('es-CL')} kg (${(b.pct_avance||0).toFixed(0)}%) · faltan ${Number(b.faltante_kg||0).toLocaleString('es-CL')} kg`).join('<br>') + '</div>' : '';
        return `
        <div class="bg-white border ${i===0?'border-emerald-400':'border-stone-200'} rounded p-3">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${podio} ${esc(f.comprador)} <span class="text-xs text-stone-500">${esc(f.comuna || f.region || '')}</span></div>
              <div class="text-xs text-stone-500">$${f.precio.toLocaleString('es-CL')}/kg × ${kg.toLocaleString('es-CL')} kg ${f.stale ? '<span class="ml-1 px-1 bg-amber-100 text-amber-800 rounded">⏰ precio '+f.dias_desde_actualizacion+'d</span>' : ''} ${f.requiere_foto_previa ? '<span class="ml-1 px-1 bg-sky-100 text-sky-800 rounded">📷 foto previa</span>' : ''}</div>
              ${f.condicion_texto ? '<div class="text-xs text-stone-500 italic">'+esc(f.condicion_texto)+'</div>' : ''}
              ${bonoHtml}
            </div>
            <div class="text-right">
              <div class="text-lg font-bold ${i===0?'text-emerald-700':'text-stone-700'}">$${f.total_clp.toLocaleString('es-CL')}</div>
              <button class="dec-btn-vender mt-1 px-3 py-1 ${i===0?'bg-emerald-600 hover:bg-emerald-700':'bg-stone-500 hover:bg-stone-600'} text-white rounded text-xs"
                data-comprador="${esc(f.comprador_id)}" data-material="${esc(matId)}" data-precio="${f.precio}" data-kg="${kg}" data-suc="${esc(suc)}">
                Vender a este
              </button>
            </div>
          </div>
        </div>`;
      }).join('');
    } catch (e) {
      lista.innerHTML = '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">Error: ' + esc(e.message || String(e)) + '</div>';
    }
  }
  async function decVender(comprador, material, precio, kg, sucursal) {
    if (!confirm(`¿Registrar venta de ${kg} kg de ${material} a ${comprador} a $${precio}/kg?`)) return;
    try {
      const empresa = $$('dec_empresa').value;
      const ctx = { source: 'decisor_venta_ui', material, kg, precio_kg: precio, sucursal };
      const { data, error } = await sb.rpc('venta_material_capturar', {
        p_comprador_id: comprador, p_material_id: material,
        p_kg: kg, p_precio_clp_kg: precio,
        p_sucursal_origen: sucursal, p_empresa: empresa,
        p_fecha_venta: new Date().toISOString().slice(0,10),
        p_guia_despacho: null, p_decision_context: ctx,
        p_comentario: 'Capturada desde Decisor de Venta', p_estado: 'cotizada'
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error');
      const bonos = (data.estado_bonos || []).map(b => `${b.nombre_bono}: ${(b.pct_avance||0).toFixed(0)}%`).join(' · ');
      alert('Venta registrada (estado cotizada). Total $' + Math.round(precio*kg).toLocaleString('es-CL') + (bonos ? '. Bonos: ' + bonos : ''));
      loadDecisor();
    } catch (e) { alert('No se pudo registrar: ' + (e.message || e)); }
  }

  // ------------------ TAB 6 · Cobranza ------------------
  function fmtCLP(n) { if (n == null || isNaN(n)) return '$0'; return '$' + Number(n).toLocaleString('es-CL', { maximumFractionDigits: 0 }); }
  async function loadCobranza() {
    const lista = $$('cob_lista'); if (!lista) return;
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Cargando…</div>';
    try {
      const empresa = $$('cob_empresa').value;
      let q = sb.schema('panel').from('v_andrea_cobranza').select('*');
      if (empresa !== 'todas') q = q.eq('empresa', empresa);
      const { data, error } = await q.order('monto_pendiente_total', { ascending: false });
      if (error) throw error;
      const filas = data || [];
      const total = filas.reduce((a, f) => a + Number(f.monto_pendiente_total || 0), 0);
      const totalFac = filas.reduce((a, f) => a + Number(f.n_facturas || 0), 0);
      const total60 = filas.reduce((a, f) => a + Number(f.bucket_60_mas || 0), 0);
      const pct = total > 0 ? Math.round(total60 / total * 100) : 0;
      $$('cob_kpi_clientes').textContent = filas.length;
      $$('cob_kpi_facturas').textContent = totalFac;
      $$('cob_kpi_total').textContent = fmtCLP(total);
      $$('cob_kpi_critico').textContent = pct + '%';
      if (filas.length === 0) {
        lista.innerHTML = '<div class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">✓ Sin morosos.</div>';
        return;
      }
      lista.innerHTML = filas.slice(0, 30).map((f, i) => `
        <div class="bg-white border border-stone-200 rounded p-3">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">${i+1}. ${esc(f.razon_social || '—')} <span class="text-xs text-stone-500">${esc(f.empresa || '')}</span></div>
              <div class="text-xs text-stone-500">RUT ${esc(f.rut_proveedor || '—')} · ${f.n_facturas || 0} factura(s) · aging máx ${f.aging_mas_viejo || 0}d ${f.dias_sin_gestion != null ? '· sin gestión '+f.dias_sin_gestion+'d' : ''}</div>
              <div class="text-xs mt-1">
                <span class="bg-stone-100 px-1 rounded">0-30: ${fmtCLP(f.bucket_0_30)}</span>
                <span class="bg-amber-100 px-1 rounded ml-1">31-60: ${fmtCLP(f.bucket_31_60)}</span>
                <span class="bg-red-100 px-1 rounded ml-1">60+: ${fmtCLP(f.bucket_60_mas)}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-stone-700">${fmtCLP(f.monto_pendiente_total)}</div>
            </div>
          </div>
        </div>`).join('');
    } catch (e) {
      lista.innerHTML = '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">Error: ' + esc(e.message || String(e)) + '</div>';
    }
  }
  async function cobGenerarPdf() {
    const btn = $$('cob_pdf'); if (!btn) return;
    const empresa = $$('cob_empresa').value;
    const mes = $$('cob_mes').value || new Date().toISOString().slice(0, 7);
    const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Generando…';
    try {
      const { data, error } = await sb.functions.invoke('cobranza-pdf-reporte', { body: { empresa, mes } });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error');
      window.open(data.signed_url, '_blank');
    } catch (e) {
      alert('Error PDF: ' + (e.message || e));
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  }

  // ------------------ TAB 7 · Actas ------------------
  async function loadActas() {
    const lista = $$('act_lista'); if (!lista) return;
    lista.innerHTML = '<div class="text-xs text-stone-400 italic py-4 text-center">Cargando…</div>';
    try {
      const { data, error } = await sb.schema('panel').from('v_andrea_actas').select('*').limit(50);
      if (error) throw error;
      const filas = data || [];
      $$('act_kpi_total').textContent = filas.length;
      $$('act_kpi_pendientes').textContent = filas.filter(a => a.firma_pendiente).length;
      $$('act_kpi_con_pdf').textContent = filas.filter(a => a.tiene_pdf).length;
      if (filas.length === 0) {
        lista.innerHTML = '<div class="text-sm text-stone-500 bg-stone-50 border border-stone-200 rounded p-3">No tenés actas todavía. Las actas se crean desde otros flujos (PDI, compras).</div>';
        return;
      }
      lista.innerHTML = filas.map(a => `
        <div class="bg-white border border-stone-200 rounded p-3">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm">📝 ${esc((a.tipo||'').toUpperCase())} · ${esc(a.cliente || '—')}</div>
              <div class="text-xs text-stone-500">Fecha ${esc(a.fecha || '—')} · creada ${esc(new Date(a.created_at).toLocaleDateString('es-CL'))}</div>
              ${a.firma_pendiente ? '<span class="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">⏳ Firma pendiente</span>' : '<span class="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">✓ Firmada '+esc(a.firmado_por || '')+'</span>'}
              ${a.tiene_pdf ? '<span class="text-xs px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded ml-1">📄 PDF generado</span>' : ''}
              ${a.notas ? '<div class="text-xs text-stone-600 italic mt-1">'+esc(a.notas).slice(0,200)+'</div>' : ''}
            </div>
            <div class="flex flex-col gap-1">
              <button class="act-btn-pdf px-2 py-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700" data-id="${esc(a.id)}">📄 Generar PDF</button>
              ${a.firma_pendiente ? '<button class="act-btn-firmar px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700" data-id="'+esc(a.id)+'">✍️ Firmar</button>' : ''}
            </div>
          </div>
        </div>`).join('');
    } catch (e) {
      lista.innerHTML = '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">Error: ' + esc(e.message || String(e)) + '</div>';
    }
  }
  async function actGenerarPdf(actaId) {
    try {
      const { data, error } = await sb.functions.invoke('acta-pdf-render', { body: { acta_id: actaId } });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error');
      window.open(data.signed_url, '_blank');
      loadActas();
    } catch (e) { alert('Error PDF: ' + (e.message || e)); }
  }
  async function actFirmar(actaId) {
    const nombre = prompt('Nombre de quien firma:');
    if (!nombre || nombre.trim().length < 2) return;
    try {
      const { data, error } = await sb.rpc('firmar_acta', { p_acta_id: actaId, p_firmado_por_nombre: nombre.trim() });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Error');
      loadActas();
    } catch (e) { alert('Error firma: ' + (e.message || e)); }
  }

  // ------------------ Wiring ------------------
  function init() {
    // Loaders al click del tab (ambos navbars)
    [['andrea_dup_clientes', loadDup], ['andrea_drift_libre', loadDrift], ['andrea_ruts_invalidos', loadRuts], ['andrea_comex', loadComex], ['decisor_venta', decBootstrap], ['andrea_cobranza', loadCobranza], ['andrea_actas', loadActas], ['hual_compra', loadHualCompra]].forEach(([code, fn]) => {
      document.querySelector('button[data-tab="' + code + '"]')?.addEventListener('click', () => setTimeout(fn, 100));
      document.querySelector('a[data-v4-tab="' + code + '"]')?.addEventListener('click', () => setTimeout(fn, 100));
    });
    $$('adup_refresh')?.addEventListener('click', loadDup);
    $$('adrift_refresh')?.addEventListener('click', loadDrift);
    $$('aruts_refresh')?.addEventListener('click', loadRuts);
    $$('acomex_refresh')?.addEventListener('click', loadComex);
    $$('adrift_ver_historico')?.addEventListener('change', loadDrift);
    $$('adup_ver_historico')?.addEventListener('change', loadDup);
    $$('aruts_ver_historico')?.addEventListener('change', loadRuts);

    // Delegated handlers
    $$('adup_lista')?.addEventListener('click', e => {
      const m = e.target.closest('.adup-btn-mergear');
      if (m) return decidirDup(m.dataset.parId, 'mergear', m.dataset.ganador);
      const d = e.target.closest('.adup-btn-decision');
      if (d) return decidirDup(d.dataset.parId, d.dataset.decision, null);
    });
    $$('adrift_lista')?.addEventListener('click', e => {
      const a = e.target.closest('.adrift-btn-asignar');
      if (a) return resolverDrift(a.dataset.driftId, 'asignado', a.dataset.clienteId);
      const am = e.target.closest('.adrift-btn-asignar-manual');
      if (am) {
        const inp = $$('adrift_lista').querySelector('.adrift-input-cid[data-drift-id="' + am.dataset.driftId + '"]');
        return resolverDrift(am.dataset.driftId, 'asignado', inp?.value.trim());
      }
      const dec = e.target.closest('.adrift-btn-decision');
      if (dec) return resolverDrift(dec.dataset.driftId, dec.dataset.decision, null);
    });
    $$('aruts_lista')?.addEventListener('click', e => {
      const c = e.target.closest('.aruts-btn-corregir');
      if (c) {
        const inp = $$('aruts_lista').querySelector('.aruts-input-rut[data-cliente-id="' + c.dataset.clienteId + '"]');
        return corregirRut(c.dataset.clienteId, inp?.value.trim());
      }
    });
    $$('acomex_lista')?.addEventListener('click', e => {
      const a = e.target.closest('.acomex-btn-avanzar');
      if (a) return comexAvanzar(a.dataset.id, a.dataset.nuevo);
    });
    $$('acomex_nueva')?.addEventListener('click', () => $$('acomex_form').classList.toggle('hidden'));
    $$('acomex_f_cancelar')?.addEventListener('click', () => $$('acomex_form').classList.add('hidden'));
    $$('acomex_f_guardar')?.addEventListener('click', comexGuardar);

    // Cobranza wiring
    $$('cob_refresh')?.addEventListener('click', loadCobranza);
    $$('cob_empresa')?.addEventListener('change', loadCobranza);
    $$('cob_pdf')?.addEventListener('click', cobGenerarPdf);
    // Default mes = mes actual
    const cobMes = $$('cob_mes'); if (cobMes && !cobMes.value) cobMes.value = new Date().toISOString().slice(0, 7);

    // Actas wiring
    $$('act_refresh')?.addEventListener('click', loadActas);
    $$('act_lista')?.addEventListener('click', e => {
      const p = e.target.closest('.act-btn-pdf'); if (p) return actGenerarPdf(p.dataset.id);
      const f = e.target.closest('.act-btn-firmar'); if (f) return actFirmar(f.dataset.id);
    });

    // Decisor Venta wiring
    $$('dec_refresh')?.addEventListener('click', loadDecisor);
    ['dec_material','dec_kg','dec_sucursal'].forEach(id => $$(id)?.addEventListener('change', loadDecisor));
    $$('dec_kg')?.addEventListener('input', () => { clearTimeout(window._decT); window._decT = setTimeout(loadDecisor, 600); });
    $$('dec_lista')?.addEventListener('click', e => {
      const b = e.target.closest('.dec-btn-vender');
      if (b) return decVender(b.dataset.comprador, b.dataset.material, Number(b.dataset.precio), Number(b.dataset.kg), b.dataset.suc);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
