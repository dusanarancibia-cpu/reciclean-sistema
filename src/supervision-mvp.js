import {
  signInRomanero,
  signOutRomanero,
  getRomaneroSession,
  loadRomaneroLookups,
  fetchReleaseOverviewSnapshot,
  enablePrimerReleaseDemo,
  isPrimerReleaseDemoEnabled,
  resetPrimerReleaseDemo
} from './lib/primer-release-api.js';

const app = document.querySelector('#app');
const ACTIVE_STATES = new Set([
  'agendado',
  'recepcionado',
  'en_proceso',
  'pendiente_factura',
  'pendiente_pago',
  'pagado_pendiente_conciliacion'
]);

const state = {
  session: null,
  loading: true,
  busy: false,
  demo: false,
  error: '',
  notice: '',
  lookups: { sucursales: [] },
  filters: {
    sucursal_id: '',
    estado: '',
    texto: ''
  },
  snapshot: {
    expedientes: [],
    pesajes: [],
    facturas: [],
    pagos: [],
    eventos: [],
    comprobantes: []
  },
  overview: null,
  expedientes: [],
  selected: null,
  eventos: [],
  pesaje: null,
  facturas: [],
  pagos: [],
  comprobantes: []
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value));
}

function dt(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CL');
}

function hoursSince(value) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, diff / 36e5);
}

function relativeAge(value) {
  const hours = hoursSince(value);
  if (hours === null) return 'sin dato';
  if (hours < 1) return '< 1 h';
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

function pendingOldestLabel(hours) {
  if (!hours) return 'sin cola';
  if (hours < 24) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}

function clearFlash() {
  state.error = '';
  state.notice = '';
}

function setNotice(message) {
  state.notice = message;
  state.error = '';
}

function setError(message) {
  state.error = message;
  state.notice = '';
}

function buildIndex(items, key, multiple = false) {
  const map = new Map();
  for (const item of items || []) {
    const mapKey = item?.[key];
    if (!mapKey) continue;
    if (multiple) {
      const bucket = map.get(mapKey) || [];
      bucket.push(item);
      map.set(mapKey, bucket);
    } else if (!map.has(mapKey)) {
      map.set(mapKey, item);
    }
  }
  return map;
}

function maxDate(...values) {
  const valid = values.filter(Boolean).map((value) => new Date(value).getTime()).filter((value) => !Number.isNaN(value));
  if (!valid.length) return null;
  return new Date(Math.max(...valid)).toISOString();
}

function severityRank(severity) {
  return severity === 'critical' ? 3 : severity === 'warning' ? 2 : 1;
}

function severityLabel(severity) {
  if (severity === 'critical') return 'Crítica';
  if (severity === 'warning') return 'Atención';
  return 'Info';
}

function healthTone(overview) {
  if (!overview) return 'ok';
  if (overview.alertCounts.critical > 0) return 'critical';
  if (overview.alertCounts.warning > 0) return 'warning';
  return 'ok';
}

function healthLabel(overview) {
  const tone = healthTone(overview);
  if (tone === 'critical') return 'Riesgo operativo';
  if (tone === 'warning') return 'Vigilancia activa';
  return 'Release estable';
}

function filteredExpedientes() {
  const needle = state.filters.texto.trim().toLowerCase();
  return state.expedientes.filter((item) => {
    if (state.filters.sucursal_id && item.sucursal_id !== state.filters.sucursal_id) return false;
    if (state.filters.estado && item.estado !== state.filters.estado) return false;
    if (!needle) return true;
    return [
      item.expediente_codigo,
      item.cliente_id,
      item.sucursal_id,
      item.material_id,
      item.servicio_clase,
      item.estado
    ].filter(Boolean).some((part) => String(part).toLowerCase().includes(needle));
  });
}

function deriveOverview(snapshot) {
  const expedientes = snapshot.expedientes || [];
  const pesajes = snapshot.pesajes || [];
  const facturas = snapshot.facturas || [];
  const pagos = snapshot.pagos || [];
  const eventos = snapshot.eventos || [];
  const comprobantes = snapshot.comprobantes || [];

  const pesajeByExpediente = buildIndex(pesajes, 'expediente_id');
  const facturasByExpediente = buildIndex(facturas, 'expediente_id', true);
  const pagosByExpediente = buildIndex(pagos, 'expediente_id', true);
  const eventosByExpediente = buildIndex(eventos, 'expediente_id', true);
  const comprobantesByFactura = buildIndex(comprobantes, 'factura_raw_id', true);
  const expedienteById = new Map(expedientes.map((item) => [item.expediente_id, item]));

  const byState = {
    total: expedientes.length,
    en_proceso: 0,
    pendiente_factura: 0,
    pendiente_pago: 0,
    pagado_pendiente_conciliacion: 0,
    cerrado: 0
  };

  let montoPendiente = 0;
  let montoPagado = 0;
  let pagosSinComprobante = 0;
  let expedientesSinPesaje = 0;
  let staleActive = 0;
  let oldestPendingHours = 0;

  const alerts = [];
  const sucursalMap = new Map();

  for (const expediente of expedientes) {
    if (expediente.estado in byState) {
      byState[expediente.estado] += 1;
    }

    const pesaje = pesajeByExpediente.get(expediente.expediente_id) || null;
    const expFacturas = facturasByExpediente.get(expediente.expediente_id) || [];
    const expPagos = pagosByExpediente.get(expediente.expediente_id) || [];
    const expEventos = eventosByExpediente.get(expediente.expediente_id) || [];
    const facturaMonto = expFacturas.reduce((sum, item) => sum + Number(item.monto_total || 0), 0);
    const pagoMonto = expPagos.reduce((sum, item) => sum + Number(item.monto_pagado || 0), 0);

    montoPagado += pagoMonto;
    if (expediente.estado === 'pendiente_pago') {
      montoPendiente += Math.max(facturaMonto - pagoMonto, facturaMonto || 0);
      const pendingAge = hoursSince(expediente.updated_at || expediente.created_at || expediente.fecha_operacion);
      oldestPendingHours = Math.max(oldestPendingHours, pendingAge || 0);
    }

    if (!pesaje && ACTIVE_STATES.has(expediente.estado) && expediente.estado !== 'agendado') {
      expedientesSinPesaje += 1;
    }

    const lastEventAt = expEventos[0]?.created_at || null;
    const lastFacturaAt = expFacturas[0]?.updated_at || expFacturas[0]?.created_at || null;
    const lastPagoAt = expPagos[0]?.created_at || null;
    const lastActivityAt = maxDate(expediente.updated_at, expediente.created_at, lastEventAt, lastFacturaAt, lastPagoAt, pesaje?.fecha_captura, pesaje?.created_at);
    const staleHours = hoursSince(lastActivityAt);
    if (ACTIVE_STATES.has(expediente.estado) && staleHours !== null && staleHours >= 48) {
      staleActive += 1;
    }

    const comprobantesExp = expFacturas.flatMap((factura) =>
      comprobantesByFactura.get(factura.factura_raw_id ?? factura.id) || []
    );
    if (expPagos.length > 0 && comprobantesExp.length === 0) {
      pagosSinComprobante += 1;
    }

    const sucursal = sucursalMap.get(expediente.sucursal_id || 'sin_sucursal') || {
      sucursal_id: expediente.sucursal_id || 'sin_sucursal',
      total: 0,
      pendiente_pago: 0,
      pagado_pendiente_conciliacion: 0,
      montoPendiente: 0
    };
    sucursal.total += 1;
    if (expediente.estado === 'pendiente_pago') {
      sucursal.pendiente_pago += 1;
      sucursal.montoPendiente += Math.max(facturaMonto - pagoMonto, facturaMonto || 0);
    }
    if (expediente.estado === 'pagado_pendiente_conciliacion') {
      sucursal.pagado_pendiente_conciliacion += 1;
    }
    sucursalMap.set(sucursal.sucursal_id, sucursal);
  }

  if (byState.pendiente_pago > 0) {
    alerts.push({
      severity: oldestPendingHours >= 48 ? 'critical' : 'warning',
      title: `${byState.pendiente_pago} expedientes en cola de pago`,
      detail: `Monto expuesto ${money(montoPendiente)} · más antiguo ${pendingOldestLabel(oldestPendingHours)}`,
      state: 'pendiente_pago'
    });
  }

  if (byState.pagado_pendiente_conciliacion > 0) {
    alerts.push({
      severity: 'warning',
      title: `${byState.pagado_pendiente_conciliacion} pagos pendientes de conciliación`,
      detail: 'Conviene cerrar conciliación y validar documentación asociada.',
      state: 'pagado_pendiente_conciliacion'
    });
  }

  if (pagosSinComprobante > 0) {
    alerts.push({
      severity: pagosSinComprobante >= 2 ? 'critical' : 'warning',
      title: `${pagosSinComprobante} expedientes con pago sin comprobante`,
      detail: 'Hay pagos registrados que todavía no tienen respaldo documental en el release.',
      state: ''
    });
  }

  if (expedientesSinPesaje > 0) {
    alerts.push({
      severity: 'warning',
      title: `${expedientesSinPesaje} expedientes activos sin pesaje visible`,
      detail: 'Revisar consistencia entre captura operativa y expediente.',
      state: ''
    });
  }

  if (staleActive > 0) {
    alerts.push({
      severity: staleActive >= 3 ? 'critical' : 'warning',
      title: `${staleActive} expedientes activos sin movimiento reciente`,
      detail: 'No muestran actividad relevante en las últimas 48 horas.',
      state: ''
    });
  }

  const recentActivity = eventos
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((evento) => ({
      ...evento,
      expediente_codigo: expedienteById.get(evento.expediente_id)?.expediente_codigo || evento.expediente_id
    }));

  const sucursales = Array.from(sucursalMap.values())
    .sort((a, b) => (b.pendiente_pago - a.pendiente_pago) || (b.total - a.total))
    .slice(0, 6);

  const alertCounts = {
    critical: alerts.filter((item) => item.severity === 'critical').length,
    warning: alerts.filter((item) => item.severity === 'warning').length
  };

  return {
    byState,
    montoPendiente,
    montoPagado,
    pagosSinComprobante,
    expedientesSinPesaje,
    staleActive,
    oldestPendingHours,
    alerts: alerts.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    alertCounts,
    recentActivity,
    sucursales
  };
}

function syncSelectedFromSnapshot() {
  if (!state.selected || !state.expedientes.some((item) => item.expediente_id === state.selected.expediente_id)) {
    state.selected = state.expedientes[0] || null;
  } else {
    state.selected = state.expedientes.find((item) => item.expediente_id === state.selected.expediente_id) || null;
  }

  if (!state.selected) {
    state.eventos = [];
    state.pesaje = null;
    state.facturas = [];
    state.pagos = [];
    state.comprobantes = [];
    return;
  }

  const expedienteId = state.selected.expediente_id;
  state.eventos = (state.snapshot.eventos || []).filter((item) => item.expediente_id === expedienteId);
  state.pesaje = (state.snapshot.pesajes || []).find((item) => item.expediente_id === expedienteId) || null;
  state.facturas = (state.snapshot.facturas || []).filter((item) => item.expediente_id === expedienteId);
  state.pagos = (state.snapshot.pagos || []).filter((item) => item.expediente_id === expedienteId);
  const facturaIds = new Set(state.facturas.map((item) => String(item.factura_raw_id ?? item.id)));
  state.comprobantes = (state.snapshot.comprobantes || []).filter((item) => facturaIds.has(String(item.factura_raw_id)));
}

function renderLogin() {
  app.innerHTML = `
    <section class="shell shell-center">
      <div class="card auth-card">
        <div class="eyebrow">Primer Release · Supervisión</div>
        <h1>Centro de Control</h1>
        <p class="subtle">Ingreso con Supabase Auth para revisar el release completo. Si todavía no tienes acceso, puedes abrir un modo demo operativo.</p>
        <form id="login-form" class="stack">
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="operaciones@reciclean.cl" required />
          </label>
          <label class="field">
            <span>Contrasena</span>
            <input type="password" name="password" placeholder="Tu clave" required />
          </label>
          <button class="btn btn-primary" type="submit"${state.busy ? ' disabled' : ''}>
            ${state.busy ? 'Ingresando...' : 'Entrar'}
          </button>
          <button class="btn" type="button" data-action="demo"${state.busy ? ' disabled' : ''}>
            Ver demo operativa
          </button>
        </form>
        ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}
      </div>
    </section>
  `;
}

function renderAlertItem(alert) {
  return `
    <article class="mini-card alert-card alert-${alert.severity}">
      <div class="card-head">
        <strong>${escapeHtml(alert.title)}</strong>
        <span class="badge badge-${alert.severity}">${severityLabel(alert.severity)}</span>
      </div>
      <span>${escapeHtml(alert.detail)}</span>
      ${alert.state ? `<button class="btn btn-small" type="button" data-action="filter-state" data-state="${escapeHtml(alert.state)}">Filtrar ${escapeHtml(alert.state)}</button>` : ''}
    </article>
  `;
}

function renderApp() {
  const items = filteredExpedientes();
  const overview = state.overview || deriveOverview(state.snapshot);
  const selected = state.selected;
  const health = healthTone(overview);
  const pendingOldestLabel = overview.oldestPendingHours ? `${Math.round(overview.oldestPendingHours)} h` : 'sin cola';

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">Primer Release · Supervisión</div>
          <h1>Centro de Control</h1>
          <p class="subtle">Lectura ejecutiva del flujo vivo: expedientes, cola financiera, alertas y trazabilidad reciente.</p>
        </div>
        <div class="topbar-actions">
          <a class="btn" href="/romanero.html" target="_blank" rel="noopener">Romanero</a>
          <a class="btn" href="/pagos.html" target="_blank" rel="noopener">Pagos</a>
          ${state.demo ? '<div class="session-pill">Modo demo</div>' : ''}
          <button class="btn" data-action="refresh"${state.busy ? ' disabled' : ''}>Actualizar</button>
          ${state.demo ? '<button class="btn" data-action="reset-demo">Reiniciar demo</button>' : ''}
          <button class="btn" data-action="clear-filters"${state.busy ? ' disabled' : ''}>Limpiar filtros</button>
          <button class="btn" data-action="logout"${state.busy ? ' disabled' : ''}>Salir</button>
        </div>
      </header>

      ${state.demo ? '<div class="flash flash-ok">Modo demo activo. Aquí puedes revisar el release completo con datos compartidos entre Romanero, Pagos y Supervisión sin credenciales reales.</div>' : ''}
      ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
      ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}

      <section class="card hero hero-${health}">
        <div class="card-head">
          <div>
            <h2>Salud operativa del release</h2>
            <p class="subtle">${healthLabel(overview)} · ${overview.alertCounts.critical} alertas críticas, ${overview.alertCounts.warning} en observación.</p>
          </div>
          <span class="status">${escapeHtml(state.session?.user?.email || 'sesion activa')}</span>
        </div>
        <div class="metric-grid">
          <div class="metric"><span>Total expedientes</span><strong>${overview.byState.total}</strong></div>
          <div class="metric"><span>Cola de pago</span><strong>${overview.byState.pendiente_pago}</strong></div>
          <div class="metric"><span>Pagos por conciliar</span><strong>${overview.byState.pagado_pendiente_conciliacion}</strong></div>
          <div class="metric"><span>Monto pendiente</span><strong>${money(overview.montoPendiente)}</strong></div>
        </div>
      </section>

      <section class="stats">
        <article class="stat-card"><span>Total</span><strong>${overview.byState.total}</strong></article>
        <article class="stat-card"><span>En proceso</span><strong>${overview.byState.en_proceso}</strong></article>
        <article class="stat-card"><span>Pendiente factura</span><strong>${overview.byState.pendiente_factura}</strong></article>
        <article class="stat-card"><span>Cola pago</span><strong>${overview.byState.pendiente_pago}</strong></article>
        <article class="stat-card"><span>Pago más antiguo</span><strong>${pendingOldestLabel}</strong></article>
        <article class="stat-card"><span>Pagado</span><strong>${money(overview.montoPagado)}</strong></article>
      </section>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Alertas y focos</h2>
              <p class="subtle">Lectura accionable para no perder la cola operativa.</p>
            </div>
          </div>
          <div class="stack-list">
            ${overview.alerts.length ? overview.alerts.map(renderAlertItem).join('') : '<div class="empty">No hay alertas activas en este momento.</div>'}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Radar por sucursal</h2>
              <p class="subtle">Dónde está hoy la mayor presión operativa del release.</p>
            </div>
          </div>
          <div class="stack-list">
            ${overview.sucursales.length ? overview.sucursales.map((item) => `
              <article class="mini-card">
                <div class="card-head">
                  <strong>${escapeHtml(item.sucursal_id)}</strong>
                  <button class="btn btn-small" type="button" data-action="filter-sucursal" data-sucursal-id="${escapeHtml(item.sucursal_id)}">Filtrar</button>
                </div>
                <span>${item.total} expedientes · ${item.pendiente_pago} en cola · ${item.pagado_pendiente_conciliacion} por conciliar</span>
                <small>Monto pendiente ${money(item.montoPendiente)}</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay sucursales con movimiento.</div>'}
          </div>
        </section>
      </div>

      <div class="layout">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Expedientes</h2>
              <p class="subtle">Filtro rápido para bajar del tablero al caso operativo.</p>
            </div>
            <span class="status">${items.length} visibles / ${state.expedientes.length}</span>
          </div>
          <div class="grid compact-grid">
            <label class="field">
              <span>Sucursal</span>
              <select name="sucursal_id">
                <option value="">Todas</option>
                ${state.lookups.sucursales.map((item) => `
                  <option value="${escapeHtml(item.sucursal_id)}"${item.sucursal_id === state.filters.sucursal_id ? ' selected' : ''}>
                    ${escapeHtml(item.nombre)}
                  </option>
                `).join('')}
              </select>
            </label>
            <label class="field">
              <span>Estado</span>
              <select name="estado">
                <option value="">Todos</option>
                ${['borrador', 'agendado', 'recepcionado', 'en_proceso', 'pendiente_factura', 'pendiente_pago', 'pagado_pendiente_conciliacion', 'cerrado', 'cancelado'].map((estado) => `
                  <option value="${estado}"${estado === state.filters.estado ? ' selected' : ''}>${estado}</option>
                `).join('')}
              </select>
            </label>
            <label class="field">
              <span>Buscar</span>
              <input type="search" name="texto" value="${escapeHtml(state.filters.texto)}" placeholder="Codigo, cliente, material, sucursal" />
            </label>
          </div>
          <div class="list">
            ${items.length ? items.map((item) => `
              <button class="list-item${selected?.expediente_id === item.expediente_id ? ' active' : ''}" type="button" data-expediente-id="${item.expediente_id}">
                <div class="list-main">
                  <strong>${escapeHtml(item.expediente_codigo || item.expediente_id)}</strong>
                  <span>${escapeHtml(item.cliente_id || 'sin cliente')} · ${escapeHtml(item.sucursal_id || 'sin sucursal')}</span>
                </div>
                <div class="list-side">
                  <span class="badge">${escapeHtml(item.estado || '—')}</span>
                  <small>${escapeHtml(relativeAge(item.updated_at || item.created_at || item.fecha_operacion))}</small>
                </div>
              </button>
            `).join('') : '<div class="empty">No hay expedientes con este filtro.</div>'}
          </div>
        </section>

        <aside class="stack">
          <section class="card">
            <div class="card-head">
              <div>
                <h2>Detalle</h2>
                <p class="subtle">${escapeHtml(selected?.expediente_codigo || 'Selecciona un expediente')}</p>
              </div>
            </div>
            ${selected ? `
              <div class="metric-grid">
                <div class="metric"><span>Estado</span><strong>${escapeHtml(selected.estado || '—')}</strong></div>
                <div class="metric"><span>Servicio</span><strong>${escapeHtml(selected.servicio_clase || '—')}</strong></div>
                <div class="metric"><span>Cliente</span><strong>${escapeHtml(selected.cliente_id || '—')}</strong></div>
                <div class="metric"><span>Material</span><strong>${escapeHtml(selected.material_id || '—')}</strong></div>
                <div class="metric"><span>Sucursal</span><strong>${escapeHtml(selected.sucursal_id || '—')}</strong></div>
                <div class="metric"><span>Último movimiento</span><strong>${escapeHtml(relativeAge(state.eventos[0]?.created_at || selected.updated_at || selected.created_at))}</strong></div>
              </div>
            ` : '<div class="empty">Elige un expediente para revisar el flujo.</div>'}
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Puntos críticos</h2>
                <p class="subtle">Resumen operacional y financiero del expediente seleccionado.</p>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric"><span>Pesaje</span><strong>${state.pesaje ? `${Number(state.pesaje.peso_neto_kg || 0).toFixed(2)} kg` : '—'}</strong></div>
              <div class="metric"><span>Monto estimado</span><strong>${state.pesaje ? money(state.pesaje.monto_total) : '—'}</strong></div>
              <div class="metric"><span>Facturas</span><strong>${state.facturas.length}</strong></div>
              <div class="metric"><span>Pagos</span><strong>${state.pagos.length}</strong></div>
              <div class="metric"><span>Comprobantes</span><strong>${state.comprobantes.length}</strong></div>
              <div class="metric"><span>Eventos</span><strong>${state.eventos.length}</strong></div>
            </div>
          </section>
        </aside>
      </div>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Tramo financiero</h2>
              <p class="subtle">Facturas, pagos y respaldos del expediente seleccionado.</p>
            </div>
          </div>
          <div class="subgrid">
            <div>
              <h3 class="subsection-title">Facturas</h3>
              ${state.facturas.length ? state.facturas.map((factura) => `
                <article class="mini-card">
                  <strong>${escapeHtml(factura.folio || `Factura ${factura.id}`)}</strong>
                  <span>${escapeHtml(factura.estado_pago_release || '—')}</span>
                  <small>${money(factura.monto_total)} · ${escapeHtml(dt(factura.updated_at || factura.created_at))}</small>
                </article>
              `).join('') : '<div class="empty">Sin facturas ligadas al expediente.</div>'}
            </div>
            <div>
              <h3 class="subsection-title">Pagos y comprobantes</h3>
              ${state.pagos.length ? state.pagos.map((pago) => `
                <article class="mini-card">
                  <strong>${money(pago.monto_pagado)}</strong>
                  <span>${escapeHtml(pago.medio_pago || '—')} · ${escapeHtml(pago.estado || '—')}</span>
                  <small>${escapeHtml(dt(pago.created_at))}</small>
                </article>
              `).join('') : '<div class="empty">Sin pagos registrados en este expediente.</div>'}
              ${state.comprobantes.length ? state.comprobantes.map((comp) => `
                <article class="mini-card">
                  <strong>${escapeHtml(comp.nombre_archivo || comp.storage_path || 'Comprobante')}</strong>
                  <span>${escapeHtml(comp.mime_type || 'archivo')}</span>
                  <small>${escapeHtml(dt(comp.created_at))}</small>
                </article>
              `).join('') : ''}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Actividad reciente</h2>
              <p class="subtle">Eventos más nuevos del release para detectar deriva y bloqueos.</p>
            </div>
          </div>
          ${overview.recentActivity.length ? `
            <div class="timeline">
              ${overview.recentActivity.map((evento) => `
                <button class="timeline-item timeline-button" type="button" data-expediente-id="${escapeHtml(evento.expediente_id)}">
                  <div class="timeline-meta">
                    <strong>${escapeHtml(evento.tipo_evento)}</strong>
                    <span>${escapeHtml(evento.expediente_codigo)} · ${escapeHtml(evento.actor || 'sistema')}</span>
                  </div>
                  <div class="timeline-date">${escapeHtml(dt(evento.created_at))}</div>
                </button>
              `).join('')}
            </div>
          ` : '<div class="empty">Todavía no hay actividad para mostrar.</div>'}
        </section>
      </div>
    </section>
  `;
}

function render() {
  if (state.loading) {
    app.innerHTML = `
      <section class="shell shell-center">
        <div class="card loading-card">
          <div class="loader"></div>
          <p>Cargando Centro de Control...</p>
        </div>
      </section>
    `;
    return;
  }
  if (!state.session) {
    renderLogin();
    return;
  }
  renderApp();
}

async function loadOverview() {
  state.snapshot = await fetchReleaseOverviewSnapshot(null, 220);
  state.expedientes = state.snapshot.expedientes || [];
  state.overview = deriveOverview(state.snapshot);
  syncSelectedFromSnapshot();
}

async function refreshAll(notice = 'Supervisión actualizada') {
  state.busy = true;
  clearFlash();
  render();
  try {
    await loadOverview();
    if (notice) setNotice(notice);
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.busy = true;
  clearFlash();
  render();
  try {
    await signInRomanero(form.get('email'), form.get('password'));
    await boot();
    setNotice('Sesion iniciada');
    render();
  } catch (error) {
    state.loading = false;
    state.busy = false;
    setError(error.message);
    render();
  }
}

async function handleLogout() {
  state.busy = true;
  clearFlash();
  render();
  try {
    await signOutRomanero();
    state.session = null;
    state.demo = false;
    state.snapshot = { expedientes: [], pesajes: [], facturas: [], pagos: [], eventos: [], comprobantes: [] };
    state.overview = null;
    state.selected = null;
    state.expedientes = [];
    state.eventos = [];
    state.pesaje = null;
    state.facturas = [];
    state.pagos = [];
    state.comprobantes = [];
    setNotice('Sesion cerrada');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleDemoMode() {
  state.busy = true;
  clearFlash();
  render();
  try {
    enablePrimerReleaseDemo();
    await boot();
    setNotice('Modo demo activado');
  } catch (error) {
    state.loading = false;
    state.busy = false;
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleResetDemo() {
  state.busy = true;
  clearFlash();
  render();
  try {
    resetPrimerReleaseDemo();
    await boot();
    setNotice('Demo reiniciada con datos base');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

function applyFilters(nextFilters) {
  state.filters = {
    ...state.filters,
    ...nextFilters
  };
  const items = filteredExpedientes();
  if (!items.length) {
    state.selected = null;
    syncSelectedFromSnapshot();
  } else if (!items.some((item) => item.expediente_id === state.selected?.expediente_id)) {
    state.selected = items[0];
    syncSelectedFromSnapshot();
  }
  render();
}

async function handleSelectExpediente(expedienteId) {
  const found = state.expedientes.find((item) => String(item.expediente_id) === String(expedienteId));
  if (!found) return;
  state.selected = found;
  syncSelectedFromSnapshot();
  render();
}

async function boot() {
  state.loading = true;
  render();
  try {
    state.demo = isPrimerReleaseDemoEnabled();
    state.session = await getRomaneroSession();
    if (state.session) {
      const lookups = await loadRomaneroLookups();
      state.lookups.sucursales = lookups.sucursales || [];
      await loadOverview();
    }
    state.loading = false;
    state.busy = false;
    render();
  } catch (error) {
    state.loading = false;
    state.busy = false;
    setError(error.message);
    render();
  }
}

app.addEventListener('submit', async (event) => {
  if (event.target.id === 'login-form') {
    await handleLogin(event);
  }
});

app.addEventListener('input', (event) => {
  const { name, value } = event.target;
  if (name in state.filters) {
    applyFilters({ [name]: value });
  }
});

app.addEventListener('change', (event) => {
  const { name, value } = event.target;
  if (name in state.filters) {
    applyFilters({ [name]: value });
  }
});

app.addEventListener('click', async (event) => {
  const actionable = event.target.closest('[data-action], [data-expediente-id]');
  const action = actionable?.dataset.action;
  const expedienteId = actionable?.dataset.expedienteId;

  if (expedienteId && !state.busy) {
    await handleSelectExpediente(expedienteId);
    return;
  }

  if (!action || state.busy) return;
  if (action === 'demo') {
    await handleDemoMode();
    return;
  }
  if (action === 'reset-demo') {
    await handleResetDemo();
    return;
  }
  if (action === 'logout') {
    await handleLogout();
    return;
  }
  if (action === 'refresh') {
    await refreshAll();
    return;
  }
  if (action === 'clear-filters') {
    applyFilters({ sucursal_id: '', estado: '', texto: '' });
    return;
  }
  if (action === 'filter-state') {
    applyFilters({ estado: actionable.dataset.state || '' });
    return;
  }
  if (action === 'filter-sucursal') {
    applyFilters({ sucursal_id: actionable.dataset.sucursalId || '' });
  }
});

boot();
