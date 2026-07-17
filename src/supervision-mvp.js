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
import {
  deriveReleaseOverview,
  formatKg,
  formatMoney,
  healthLabel,
  healthTone,
  relativeAge,
  severityLabel
} from './lib/primer-release-overview.js';

const app = document.querySelector('#app');

const state = {
  session: null,
  loading: true,
  busy: false,
  demo: false,
  error: '',
  notice: '',
  lookups: {
    sucursales: [],
    materiales: []
  },
  filters: {
    sucursal_id: '',
    estado: '',
    material_id: '',
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

function dt(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CL');
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

function sucursalName(sucursalId) {
  return state.lookups.sucursales.find((item) => item.sucursal_id === sucursalId)?.nombre || sucursalId || 'sin sucursal';
}

function materialName(materialId) {
  return state.lookups.materiales.find((item) => item.material_id === materialId)?.nombre || materialId || 'sin material';
}

function serviceLabel(servicioClase) {
  return String(servicioClase || 'sin_servicio').replaceAll('_', ' ');
}

function filteredExpedientes() {
  const needle = state.filters.texto.trim().toLowerCase();
  return state.expedientes.filter((item) => {
    if (state.filters.sucursal_id && item.sucursal_id !== state.filters.sucursal_id) return false;
    if (state.filters.estado && item.estado !== state.filters.estado) return false;
    if (state.filters.material_id && item.material_id !== state.filters.material_id) return false;
    if (!needle) return true;
    return [
      item.expediente_codigo,
      item.cliente_id,
      item.sucursal_id,
      sucursalName(item.sucursal_id),
      item.material_id,
      materialName(item.material_id),
      item.servicio_clase,
      item.estado
    ].filter(Boolean).some((part) => String(part).toLowerCase().includes(needle));
  });
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
        <p class="subtle">Ingreso para revisar compra, captura y continuidad del release. Si todavía no tienes acceso, puedes abrir un modo demo operativo.</p>
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

function renderCaptureItem(capture) {
  return `
    <button class="timeline-item timeline-button" type="button" data-expediente-id="${escapeHtml(capture.expediente_id)}">
      <div class="timeline-meta">
        <strong>${escapeHtml(capture.expediente_codigo)}</strong>
        <span>${escapeHtml(materialName(capture.material_id))} · ${escapeHtml(sucursalName(capture.sucursal_id))}</span>
      </div>
      <div class="timeline-date">${escapeHtml(formatKg(capture.peso_neto_kg))} · ${escapeHtml(dt(capture.fecha_captura || capture.created_at))}</div>
    </button>
  `;
}

function renderApp() {
  const items = filteredExpedientes();
  const overview = state.overview || deriveReleaseOverview(state.snapshot);
  const selected = state.selected;
  const health = healthTone(overview);
  const operationalAlerts = overview.operationalAlerts || [];
  const financialAlerts = overview.financialAlerts || [];
  const plantPulse = overview.plantPulse || {};
  const bottleneck = plantPulse.cuelloPrincipal || null;
  const materialPulse = overview.materialPulse || {};
  const materialBottleneck = materialPulse.cuelloPrincipal || null;
  const hotMaterial = materialPulse.materialCaliente || null;

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">Primer Release · Supervisión</div>
          <h1>Centro de Control</h1>
          <p class="subtle">Mando local de planta después de Terreno y Sucursal: rendimiento, continuidad, cuellos por sucursal y backlog visible. El tramo financiero queda visible, pero en segunda capa.</p>
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

      ${state.demo ? '<div class="flash flash-ok">Modo demo activo. Aquí puedes revisar compra, kilos y continuidad del release con datos compartidos entre Romanero, Pagos y Supervisión.</div>' : ''}
      ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
      ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}

      <section class="card hero hero-${health}">
        <div class="card-head">
          <div>
            <h2>Mando local de planta</h2>
            <p class="subtle">${healthLabel(overview)} · ${overview.alertCounts.critical} alertas críticas, ${overview.alertCounts.warning} en observación. La prioridad es sostener recepción, proceso y continuidad local sin perder kilos.</p>
          </div>
          <span class="status">${escapeHtml(state.session?.user?.email || 'sesion activa')}</span>
        </div>
        <div class="metric-grid">
          <div class="metric"><span>Kilos hoy</span><strong>${formatKg(overview.kilosHoy)}</strong></div>
          <div class="metric"><span>Sucursales activas</span><strong>${plantPulse.sucursalesActivas || 0}</strong></div>
          <div class="metric"><span>Recepcionados</span><strong>${plantPulse.recepcionados || 0}</strong></div>
          <div class="metric"><span>En proceso</span><strong>${plantPulse.enProceso || 0}</strong></div>
        </div>
        <div class="flash flash-ok">
          Telemetría disponible hoy: ${escapeHtml((plantPulse.telemetriaDisponible || ['sin telemetría suficiente']).join(' · '))}.
        </div>
      </section>

      <section class="stats">
        <article class="stat-card"><span>Backlog visible</span><strong>${plantPulse.backlogVisible || 0}</strong></article>
        <article class="stat-card"><span>Cobertura de pesaje</span><strong>${overview.coberturaPesajePct}%</strong></article>
        <article class="stat-card"><span>Promedio captura</span><strong>${formatKg(overview.kilosPromedioCaptura)}</strong></article>
        <article class="stat-card"><span>Expedientes activos</span><strong>${overview.expedientesActivos}</strong></article>
        <article class="stat-card"><span>Materiales activos</span><strong>${overview.materialesConCaptura}</strong></article>
        <article class="stat-card"><span>Material caliente</span><strong>${escapeHtml(hotMaterial ? materialName(hotMaterial.material_id) : 'sin dato')}</strong></article>
      </section>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Alertas de planta</h2>
              <p class="subtle">Señales donde el supervisor local tiene que intervenir primero: continuidad, cobertura, cuello y atraso visible.</p>
            </div>
          </div>
          <div class="stack-list">
            ${operationalAlerts.length ? operationalAlerts.map(renderAlertItem).join('') : '<div class="empty">No hay alertas de captura activas en este momento.</div>'}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Cuellos por sucursal</h2>
              <p class="subtle">Lectura local de planta: recepción, proceso, cobertura y backlog por sucursal.</p>
            </div>
          </div>
          ${bottleneck ? `
            <div class="flash flash-error">
              Cuello principal visible hoy: <strong>${escapeHtml(sucursalName(bottleneck.sucursal_id))}</strong> · backlog ${bottleneck.backlogLocal} · cobertura ${bottleneck.coberturaPesajePct}%.
            </div>
          ` : ''}
          <div class="stack-list">
            ${overview.sucursales.length ? overview.sucursales.map((item) => `
              <article class="mini-card">
                <div class="card-head">
                  <strong>${escapeHtml(sucursalName(item.sucursal_id))}</strong>
                  <button class="btn btn-small" type="button" data-action="filter-sucursal" data-sucursal-id="${escapeHtml(item.sucursal_id)}">Filtrar</button>
                </div>
                <span>${formatKg(item.kilosHoy)} hoy · ${item.capturas} capturas · intensidad ${formatKg(item.intensidadRecepcion)}</span>
                <small>${item.recepcionado} recepcionados · ${item.enProceso} en proceso · ${item.expedientesSinPesaje} sin pesaje · ${item.staleActive} frenados · cobertura ${item.coberturaPesajePct}%</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay sucursales con captura visible.</div>'}
          </div>
        </section>
      </div>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Cuellos por material</h2>
              <p class="subtle">Qué material está frenando captura, cobertura o continuidad antes de que el problema escale a planta.</p>
            </div>
          </div>
          ${materialBottleneck ? `
            <div class="flash flash-error">
              Material más sensible hoy: <strong>${escapeHtml(materialName(materialBottleneck.material_id))}</strong> · backlog ${materialBottleneck.backlogMaterial} · cobertura ${materialBottleneck.coberturaPesajePct}%.
            </div>
          ` : ''}
          <div class="stack-list">
            ${overview.materiales.length ? overview.materiales.map((item) => `
              <article class="mini-card">
                <div class="card-head">
                  <strong>${escapeHtml(materialName(item.material_id))}</strong>
                  <button class="btn btn-small" type="button" data-action="filter-material" data-material-id="${escapeHtml(item.material_id)}">Filtrar</button>
                </div>
                <span>${formatKg(item.kilosHoy)} hoy · ${formatKg(item.kilosTotal)} visibles · intensidad ${formatKg(item.intensidadCaptura)}</span>
                <small>${item.expedientes} expedientes · ${item.expedientesSinPesaje} sin pesaje · ${item.staleActive} frenados · cobertura ${item.coberturaPesajePct}%</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay materiales visibles para este tramo.</div>'}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Materiales calientes</h2>
              <p class="subtle">Lectura rápida del material que más mueve kilos hoy y de la base visible por material.</p>
            </div>
          </div>
          <div class="metric-grid">
            <div class="metric"><span>Materiales activos</span><strong>${materialPulse.activos || 0}</strong></div>
            <div class="metric"><span>Con captura</span><strong>${materialPulse.conCaptura || 0}</strong></div>
            <div class="metric"><span>Backlog material</span><strong>${materialPulse.backlogVisible || 0}</strong></div>
            <div class="metric"><span>Material líder</span><strong>${escapeHtml(hotMaterial ? materialName(hotMaterial.material_id) : '—')}</strong></div>
          </div>
          <div class="stack-list">
            ${overview.materiales.length ? overview.materiales.map((item) => `
              <article class="mini-card">
                <div class="card-head">
                  <strong>${escapeHtml(materialName(item.material_id))}</strong>
                  <span class="badge">${item.expedientes} casos</span>
                </div>
                <span>${formatKg(item.kilosHoy)} hoy · ${item.capturas} capturas · ${item.sucursalesCount} sucursales activas</span>
                <small>Backlog ${item.backlogMaterial} · cobertura ${item.coberturaPesajePct}%</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay materiales calientes visibles.</div>'}
          </div>
        </section>
      </div>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Señales financieras secundarias</h2>
              <p class="subtle">El tramo financiero sigue visible, pero subordinado al pulso de compra, material y captura.</p>
            </div>
          </div>
          <div class="metric-grid">
            <div class="metric"><span>Cola de pago</span><strong>${overview.byState.pendiente_pago}</strong></div>
            <div class="metric"><span>Por conciliar</span><strong>${overview.byState.pagado_pendiente_conciliacion}</strong></div>
            <div class="metric"><span>Monto pendiente</span><strong>${formatMoney(overview.montoPendiente)}</strong></div>
            <div class="metric"><span>Pagos sin respaldo</span><strong>${overview.pagosSinComprobante}</strong></div>
          </div>
          <div class="stack-list">
            ${financialAlerts.length ? financialAlerts.map(renderAlertItem).join('') : '<div class="empty">No hay alertas financieras activas en este momento.</div>'}
          </div>
        </section>
      </div>

      <div class="layout">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Expedientes</h2>
              <p class="subtle">Filtro rápido para bajar del mando local al caso operativo sin perder foco en sucursal, material y continuidad.</p>
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
              <span>Material</span>
              <select name="material_id">
                <option value="">Todos</option>
                ${state.lookups.materiales.map((item) => `
                  <option value="${escapeHtml(item.material_id)}"${item.material_id === state.filters.material_id ? ' selected' : ''}>
                    ${escapeHtml(item.nombre)}
                  </option>
                `).join('')}
              </select>
            </label>
            <label class="field">
              <span>Buscar</span>
              <input type="search" name="texto" value="${escapeHtml(state.filters.texto)}" placeholder="Codigo, cliente, material o sucursal" />
            </label>
          </div>
          <div class="list">
            ${items.length ? items.map((item) => `
              <button class="list-item${selected?.expediente_id === item.expediente_id ? ' active' : ''}" type="button" data-expediente-id="${item.expediente_id}">
                <div class="list-main">
                  <strong>${escapeHtml(item.expediente_codigo || item.expediente_id)}</strong>
                  <span>${escapeHtml(item.cliente_id || 'sin cliente')} · ${escapeHtml(materialName(item.material_id))} · ${escapeHtml(sucursalName(item.sucursal_id))}</span>
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
                <h2>Detalle local</h2>
                <p class="subtle">${escapeHtml(selected?.expediente_codigo || 'Selecciona un expediente')}</p>
              </div>
            </div>
            ${selected ? `
              <div class="metric-grid">
                <div class="metric"><span>Estado</span><strong>${escapeHtml(selected.estado || '—')}</strong></div>
                <div class="metric"><span>Servicio</span><strong>${escapeHtml(serviceLabel(selected.servicio_clase))}</strong></div>
                <div class="metric"><span>Cliente</span><strong>${escapeHtml(selected.cliente_id || '—')}</strong></div>
                <div class="metric"><span>Material</span><strong>${escapeHtml(materialName(selected.material_id))}</strong></div>
                <div class="metric"><span>Sucursal</span><strong>${escapeHtml(sucursalName(selected.sucursal_id))}</strong></div>
                <div class="metric"><span>Último movimiento</span><strong>${escapeHtml(relativeAge(state.eventos[0]?.created_at || selected.updated_at || selected.created_at))}</strong></div>
              </div>
            ` : '<div class="empty">Elige un expediente para revisar el flujo.</div>'}
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Recepción y continuidad</h2>
                <p class="subtle">Resumen local del caso en planta: recepción, kilos, trazabilidad y continuidad posterior.</p>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric"><span>Pesaje</span><strong>${state.pesaje ? formatKg(state.pesaje.peso_neto_kg) : '—'}</strong></div>
              <div class="metric"><span>Estado local</span><strong>${escapeHtml(selected?.estado || '—')}</strong></div>
              <div class="metric"><span>Precio unitario</span><strong>${state.pesaje ? formatMoney(state.pesaje.precio_unitario) : '—'}</strong></div>
              <div class="metric"><span>Monto estimado</span><strong>${state.pesaje ? formatMoney(state.pesaje.monto_total) : '—'}</strong></div>
              <div class="metric"><span>Facturas</span><strong>${state.facturas.length}</strong></div>
              <div class="metric"><span>Pagos</span><strong>${state.pagos.length}</strong></div>
            </div>
            <div class="flash flash-ok">
              Telemetría local disponible hoy: ${escapeHtml([
                state.pesaje ? 'pesaje visible' : null,
                state.eventos.length ? 'trazabilidad por evento' : null,
                state.facturas.length ? 'salida a factura' : null,
                state.pagos.length ? 'cierre financiero secundario' : null
              ].filter(Boolean).join(' · ') || 'sin telemetría local suficiente')}.
            </div>
            <div class="metric-grid">
              <div class="metric"><span>Eventos</span><strong>${state.eventos.length}</strong></div>
              <div class="metric"><span>Comprobantes</span><strong>${state.comprobantes.length}</strong></div>
            </div>
          </section>
        </aside>
      </div>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Capturas recientes</h2>
              <p class="subtle">Últimos kilos visibles del release para revisar ritmo de recepción y continuidad local.</p>
            </div>
          </div>
          ${overview.recentCaptures.length ? `
            <div class="timeline">
              ${overview.recentCaptures.map(renderCaptureItem).join('')}
            </div>
          ` : '<div class="empty">Todavía no hay capturas recientes para mostrar.</div>'}
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Tramo financiero del expediente</h2>
              <p class="subtle">Cierre secundario del caso seleccionado: facturas, pagos y respaldos.</p>
            </div>
          </div>
          <div class="subgrid">
            <div>
              <h3 class="subsection-title">Facturas</h3>
              ${state.facturas.length ? state.facturas.map((factura) => `
                <article class="mini-card">
                  <strong>${escapeHtml(factura.folio || `Factura ${factura.id}`)}</strong>
                  <span>${escapeHtml(factura.estado_pago_release || '—')}</span>
                  <small>${formatMoney(factura.monto_total)} · ${escapeHtml(dt(factura.updated_at || factura.created_at))}</small>
                </article>
              `).join('') : '<div class="empty">Sin facturas ligadas al expediente.</div>'}
            </div>
            <div>
              <h3 class="subsection-title">Pagos y comprobantes</h3>
              ${state.pagos.length ? state.pagos.map((pago) => `
                <article class="mini-card">
                  <strong>${formatMoney(pago.monto_pagado)}</strong>
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
      </div>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Actividad reciente</h2>
              <p class="subtle">Eventos más nuevos del release para detectar deriva, bloqueos o cortes de continuidad.</p>
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

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Backlog visible de planta</h2>
              <p class="subtle">Resumen del atasco visible desde recepción y proceso, antes del cierre financiero.</p>
            </div>
          </div>
          <div class="metric-grid">
            <div class="metric"><span>Total expedientes</span><strong>${overview.byState.total}</strong></div>
            <div class="metric"><span>Recepcionados</span><strong>${overview.byState.recepcionado}</strong></div>
            <div class="metric"><span>En proceso</span><strong>${overview.byState.en_proceso}</strong></div>
            <div class="metric"><span>Pendiente factura</span><strong>${overview.byState.pendiente_factura}</strong></div>
            <div class="metric"><span>Cola de pago</span><strong>${overview.byState.pendiente_pago}</strong></div>
            <div class="metric"><span>Por conciliar</span><strong>${overview.byState.pagado_pendiente_conciliacion}</strong></div>
          </div>
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
  state.overview = deriveReleaseOverview(state.snapshot);
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
      state.lookups.materiales = lookups.materiales || [];
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
    applyFilters({ sucursal_id: '', estado: '', material_id: '', texto: '' });
    return;
  }
  if (action === 'filter-state') {
    applyFilters({ estado: actionable.dataset.state || '' });
    return;
  }
  if (action === 'filter-sucursal') {
    applyFilters({ sucursal_id: actionable.dataset.sucursalId || '' });
    return;
  }
  if (action === 'filter-material') {
    applyFilters({ material_id: actionable.dataset.materialId || '' });
  }
});

boot();
