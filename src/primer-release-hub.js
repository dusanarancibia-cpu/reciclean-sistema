import {
  enablePrimerReleaseDemo,
  fetchReleaseOverviewSnapshot,
  getRomaneroSession,
  isPrimerReleaseDemoEnabled,
  loadRomaneroLookups,
  resetPrimerReleaseDemo,
  signOutRomanero
} from './lib/primer-release-api.js';
import {
  deriveReleaseOverview,
  formatKg,
  formatMoney,
  healthLabel,
  healthTone,
  severityLabel
} from './lib/primer-release-overview.js';

const app = document.querySelector('#app');

const state = {
  loading: true,
  busy: false,
  demo: false,
  session: null,
  version: null,
  snapshot: {
    expedientes: [],
    pesajes: [],
    facturas: [],
    pagos: [],
    eventos: [],
    comprobantes: []
  },
  overview: null,
  lookups: { sucursales: [], materiales: [] },
  error: '',
  notice: ''
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

function versionLabel() {
  if (!state.version) return 'build desconocido';
  return `${state.version.sha} · ${state.version.branch} · ${state.version.env}`;
}

function buildChecklist(overview) {
  const items = [
    {
      title: 'Abrir Centro de Control',
      detail: overview.kilosHoy > 0
        ? `Ya hay ${formatKg(overview.kilosHoy)} visibles hoy; conviene revisar captura y continuidad.`
        : 'Revisar de inmediato si la jornada quedó sin kilos visibles o con captura débil.',
      href: '/supervision'
    },
    {
      title: 'Ver Romanero',
      detail: overview.expedientesSinPesaje
        ? `${overview.expedientesSinPesaje} expedientes siguen sin pesaje visible; el origen operativo merece revisión.`
        : 'Mantener visible el origen operativo del expediente y su contingencia.',
      href: '/romanero'
    },
    {
      title: 'Bajar al panel',
      detail: 'Confirmar que el panel legacy ya esté leyendo el mismo pulso operativo del release.',
      href: '/panel-rdo.html'
    },
    {
      title: 'Revisar Pagos',
      detail: overview.byState.pendiente_pago
        ? `${overview.byState.pendiente_pago} expedientes siguen en cola de pago, pero ya como segunda capa.`
        : 'La cola de pago está sin pendientes visibles.',
      href: '/pagos'
    }
  ];

  if (state.demo) {
    items.unshift({
      title: 'Reiniciar demo',
      detail: 'Volver a la semilla base para revisar el preview desde cero.',
      action: 'reset-demo'
    });
  } else if (!state.session) {
    items.unshift({
      title: 'Activar demo',
      detail: 'Recorre el release sin credenciales reales ni bloqueo de sesión.',
      action: 'demo'
    });
  }

  return items.slice(0, 4);
}

function sucursalName(sucursalId) {
  return state.lookups.sucursales.find((item) => item.sucursal_id === sucursalId)?.nombre || sucursalId;
}

function materialName(materialId) {
  return state.lookups.materiales.find((item) => item.material_id === materialId)?.nombre || materialId;
}

async function loadVersion() {
  try {
    const response = await fetch('/_version.json', { cache: 'no-store' });
    if (!response.ok) return;
    state.version = await response.json();
  } catch {
    state.version = null;
  }
}

async function loadOverview() {
  state.snapshot = await fetchReleaseOverviewSnapshot(null, 220);
  state.overview = deriveReleaseOverview(state.snapshot);
}

function renderLoading() {
  app.innerHTML = `
    <section class="shell shell-center">
      <div class="card loading-card">
        <div class="loader"></div>
        <p>Cargando Primer Release Hub...</p>
      </div>
    </section>
  `;
}

function renderGuest() {
  app.innerHTML = `
    <section class="shell">
      <section class="card hero">
        <div class="topbar">
          <div>
            <div class="eyebrow">Primer Release · Hub Ejecutivo</div>
            <h1>Primer Release Hub</h1>
            <p class="subtle">Portada ejecutiva para revisar el release en Vercel con el enfoque correcto: compra y captura primero, pagos después.</p>
          </div>
          <div class="topbar-actions">
            <span class="session-pill">${escapeHtml(versionLabel())}</span>
            <a class="btn btn-ghost" href="/panel-rdo.html">Abrir panel</a>
            <button class="btn btn-primary" type="button" data-action="demo">Abrir demo</button>
          </div>
        </div>
        ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
        ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}
        <div class="metric-grid">
          <div class="metric"><span>Modo actual</span><strong>Sin sesión release</strong></div>
          <div class="metric"><span>Ruta recomendada</span><strong>/supervision?demo=1</strong></div>
          <div class="metric"><span>Eje operativo</span><strong>Kilos y captura</strong></div>
          <div class="metric"><span>Build visible</span><strong>${escapeHtml(state.version?.sha || 'sin dato')}</strong></div>
        </div>
      </section>

      <section class="grid-3">
        <a class="link-card" href="/romanero?demo=1">
          <div class="kicker">Demo</div>
          <h2>Encender flujo demo</h2>
          <p class="subtle">Activa el estado compartido y recorre Romanero, Supervisión, Pagos y panel sin credenciales.</p>
        </a>
        <a class="link-card" href="/supervision">
          <div class="kicker">Control</div>
          <h2>Centro de Control</h2>
          <p class="subtle">Lee kilos, captura, desvíos por sucursal, materiales calientes y continuidad operativa.</p>
        </a>
        <a class="link-card" href="/pagos">
          <div class="kicker">Cierre</div>
          <h2>Pagos MVP</h2>
          <p class="subtle">Cierra la consecuencia financiera del flujo después de asegurar compra, pesaje y expediente.</p>
        </a>
      </section>

      <section class="grid-2">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Qué revisar primero</h2>
              <p class="subtle">Secuencia mínima para evaluar el release desde un preview sin perder el foco operativo.</p>
            </div>
          </div>
          <div class="list">
            ${buildChecklist({
              byState: { pendiente_pago: 0 }
            }).map((item) => `
              <article class="item">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.detail)}</span>
              </article>
            `).join('')}
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Estado del preview</h2>
              <p class="subtle">Se puede revisar sin claves reales mediante demo persistente y pulso kilos-first.</p>
            </div>
          </div>
          <div class="list">
            <article class="item">
              <strong>Aliases listos</strong>
              <span>/primer-release · /romanero · /pagos · /supervision</span>
            </article>
            <article class="item">
              <strong>Smoke público</strong>
              <span><code>npm run test:e2e:primer-release</code> valida render, demo y <code>_version.json</code>.</span>
            </article>
            <article class="item">
              <strong>Build visible</strong>
              <span>${escapeHtml(versionLabel())}</span>
            </article>
          </div>
        </article>
      </section>
    </section>
  `;
}

function renderAuthenticated() {
  const overview = state.overview;
  const tone = healthTone(overview);
  const checklist = buildChecklist(overview);
  const topOperationalAlerts = overview.operationalAlerts?.slice(0, 4) || [];
  const topFinancialAlerts = overview.financialAlerts?.slice(0, 3) || [];

  app.innerHTML = `
    <section class="shell">
      <section class="card hero hero-${tone}">
        <div class="topbar">
          <div>
            <div class="eyebrow">Primer Release · Hub Ejecutivo</div>
            <h1>Primer Release Hub</h1>
            <p class="subtle">${healthLabel(overview)} · build ${escapeHtml(versionLabel())}. La lectura ejecutiva parte por compra, kilos y captura.</p>
          </div>
          <div class="topbar-actions">
            ${state.demo ? '<span class="session-pill">Modo demo</span>' : `<span class="session-pill">${escapeHtml(state.session?.user?.email || 'sesion activa')}</span>`}
            <button class="btn" type="button" data-action="refresh"${state.busy ? ' disabled' : ''}>Actualizar</button>
            ${state.demo ? '<button class="btn" type="button" data-action="reset-demo">Reiniciar demo</button>' : ''}
            <button class="btn" type="button" data-action="logout"${state.busy ? ' disabled' : ''}>Salir</button>
          </div>
        </div>
        ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
        ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}
        <div class="metric-grid">
          <div class="metric"><span>Kilos hoy</span><strong>${formatKg(overview.kilosHoy)}</strong></div>
          <div class="metric"><span>Capturas hoy</span><strong>${overview.capturasHoy}</strong></div>
          <div class="metric"><span>Sin pesaje visible</span><strong>${overview.expedientesSinPesaje}</strong></div>
          <div class="metric"><span>Cobertura de pesaje</span><strong>${overview.coberturaPesajePct}%</strong></div>
        </div>
      </section>

      <section class="grid-4">
        <article class="stat-card">
          <span>Alertas críticas</span>
          <strong>${overview.alertCounts.critical}</strong>
        </article>
        <article class="stat-card">
          <span>Kilos visibles</span>
          <strong>${formatKg(overview.kilosTotal)}</strong>
        </article>
        <article class="stat-card">
          <span>Sucursales con captura</span>
          <strong>${overview.sucursalesConCaptura}</strong>
        </article>
        <article class="stat-card">
          <span>Materiales activos</span>
          <strong>${overview.materialesConCaptura}</strong>
        </article>
      </section>

      <section class="grid-3">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Rutas clave</h2>
              <p class="subtle">Puertas rápidas del release para operar o revisar.</p>
            </div>
          </div>
          <div class="list">
            <a class="link-card" href="/supervision">
              <div class="kicker">Gobierno</div>
              <h3>Centro de Control</h3>
              <p class="subtle">Alertas de compra, captura, sucursales calientes y continuidad operativa.</p>
            </a>
            <a class="link-card" href="/romanero">
              <div class="kicker">Operación</div>
              <h3>Romanero MVP</h3>
              <p class="subtle">Origen operativo del expediente, pesaje y consulta canónica de precio.</p>
            </a>
            <a class="link-card" href="/pagos">
              <div class="kicker">Cierre</div>
              <h3>Pagos MVP</h3>
              <p class="subtle">${overview.byState.pendiente_pago} expedientes en cola y ${overview.byState.pagado_pendiente_conciliacion} por conciliar como segunda capa.</p>
            </a>
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Alertas de origen</h2>
              <p class="subtle">Lo que más conviene atacar primero en compra y captura.</p>
            </div>
          </div>
          <div class="list">
            ${topOperationalAlerts.length ? topOperationalAlerts.map((alert) => `
              <article class="item">
                <div class="item-row">
                  <strong>${escapeHtml(alert.title)}</strong>
                  <span class="badge ${alert.severity === 'critical' ? 'badge-critical' : 'badge-warning'}">${severityLabel(alert.severity)}</span>
                </div>
                <span>${escapeHtml(alert.detail)}</span>
              </article>
            `).join('') : '<div class="empty">No hay alertas operativas activas. El release se ve estable desde compra y captura.</div>'}
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Sucursales calientes</h2>
              <p class="subtle">Dónde está hoy el mayor movimiento o la mayor brecha de captura.</p>
            </div>
          </div>
          <div class="list">
            ${overview.sucursales.length ? overview.sucursales.map((item) => `
              <article class="item">
                <strong>${escapeHtml(sucursalName(item.sucursal_id))}</strong>
                <span>${formatKg(item.kilosHoy)} hoy · ${formatKg(item.kilosTotal)} visibles · ${item.capturas} capturas</span>
                <small>${item.expedientesSinPesaje} sin pesaje visible · ${item.activos} activos</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay presión visible por sucursal.</div>'}
          </div>
        </article>
      </section>

      <section class="grid-2">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Materiales calientes</h2>
              <p class="subtle">Qué materiales concentran hoy más kilos visibles y más movimiento.</p>
            </div>
          </div>
          <div class="list">
            ${overview.materiales.length ? overview.materiales.map((item) => `
              <article class="item">
                <strong>${escapeHtml(materialName(item.material_id))}</strong>
                <span>${formatKg(item.kilosHoy)} hoy · ${formatKg(item.kilosTotal)} visibles · ${item.capturas} capturas</span>
                <small>${item.expedientes} expedientes · ${item.sucursalesCount} sucursales con actividad</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay materiales con captura visible.</div>'}
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Siguiente jugada</h2>
              <p class="subtle">Checklist ejecutivo para mover el release sin perder foco.</p>
            </div>
          </div>
          <div class="list">
            ${checklist.map((item) => `
              <article class="item">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.detail)}</span>
                ${item.href ? `<a class="btn btn-ghost" href="${escapeHtml(item.href)}">Abrir</a>` : `<button class="btn btn-ghost" type="button" data-action="${escapeHtml(item.action)}">Ejecutar</button>`}
              </article>
            `).join('')}
            <article class="item">
              <strong>Build actual</strong>
              <span>${escapeHtml(versionLabel())}</span>
              <small>${escapeHtml(state.version?.buildTime ? dt(state.version.buildTime) : 'sin hora de build')}</small>
            </article>
          </div>
        </article>
      </section>

      <section class="grid-2">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Capturas recientes</h2>
              <p class="subtle">Últimos kilos visibles del release para revisar ritmo y continuidad.</p>
            </div>
          </div>
          <div class="list">
            ${overview.recentCaptures.length ? overview.recentCaptures.map((capture) => `
              <article class="item">
                <strong>${escapeHtml(capture.expediente_codigo)}</strong>
                <span>${escapeHtml(materialName(capture.material_id))} · ${escapeHtml(sucursalName(capture.sucursal_id))}</span>
                <small>${formatKg(capture.peso_neto_kg)} · ${escapeHtml(dt(capture.fecha_captura || capture.created_at))}</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay capturas recientes que mostrar.</div>'}
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Señales financieras secundarias</h2>
              <p class="subtle">El cierre financiero sigue visible, pero subordinado al pulso operativo.</p>
            </div>
          </div>
          <div class="list">
            <article class="item">
              <strong>Cola de pago</strong>
              <span>${overview.byState.pendiente_pago} expedientes · ${formatMoney(overview.montoPendiente)} expuestos</span>
            </article>
            <article class="item">
              <strong>Pagado por conciliar</strong>
              <span>${overview.byState.pagado_pendiente_conciliacion} expedientes visibles.</span>
            </article>
            <article class="item">
              <strong>Pagos sin respaldo</strong>
              <span>${overview.pagosSinComprobante} expedientes con pago sin comprobante asociado.</span>
            </article>
            ${topFinancialAlerts.map((alert) => `
              <article class="item">
                <strong>${escapeHtml(alert.title)}</strong>
                <span>${escapeHtml(alert.detail)}</span>
              </article>
            `).join('')}
          </div>
        </article>
      </section>

      <section class="grid-2">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Actividad reciente</h2>
              <p class="subtle">Eventos más nuevos del release para detectar deriva o bloqueo.</p>
            </div>
          </div>
          <div class="list">
            ${overview.recentActivity.length ? overview.recentActivity.map((evento) => `
              <article class="item">
                <strong>${escapeHtml(evento.tipo_evento)}</strong>
                <span>${escapeHtml(evento.expediente_codigo)} · ${escapeHtml(evento.actor || 'sistema')}</span>
                <small>${escapeHtml(dt(evento.created_at))}</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay actividad reciente que mostrar.</div>'}
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Backlog visible del flujo</h2>
              <p class="subtle">Resumen del release desde operación hasta cierre financiero.</p>
            </div>
          </div>
          <div class="list">
            <article class="item">
              <strong>Expedientes activos</strong>
              <span>${overview.expedientesActivos} activos · ${overview.byState.total} totales en snapshot.</span>
            </article>
            <article class="item">
              <strong>Pendiente factura</strong>
              <span>${overview.byState.pendiente_factura} expedientes a la espera de facturación.</span>
            </article>
            <article class="item">
              <strong>Cola de pago</strong>
              <span>${overview.byState.pendiente_pago} expedientes todavía por pagar.</span>
            </article>
            <article class="item">
              <strong>Pagado visible</strong>
              <span>${formatMoney(overview.montoPagado)} registrados en snapshot.</span>
            </article>
          </div>
        </article>
      </section>
    </section>
  `;
}

function render() {
  if (state.loading) {
    renderLoading();
    return;
  }
  if (!state.session) {
    renderGuest();
    return;
  }
  renderAuthenticated();
}

async function refreshAll(notice = 'Hub actualizado') {
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

async function handleDemo() {
  state.busy = true;
  clearFlash();
  render();
  try {
    enablePrimerReleaseDemo();
    await boot();
    setNotice('Modo demo activado');
  } catch (error) {
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
    setNotice('Demo reiniciada');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleLogout() {
  state.busy = true;
  clearFlash();
  render();
  try {
    await signOutRomanero();
    state.demo = false;
    state.session = null;
    state.snapshot = { expedientes: [], pesajes: [], facturas: [], pagos: [], eventos: [], comprobantes: [] };
    state.overview = null;
    setNotice('Sesión cerrada');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function boot() {
  state.loading = true;
  clearFlash();
  render();
  try {
    await loadVersion();
    state.demo = isPrimerReleaseDemoEnabled();
    state.session = await getRomaneroSession();
    if (state.session) {
      const lookups = await loadRomaneroLookups();
      state.lookups.sucursales = lookups.sucursales || [];
      state.lookups.materiales = lookups.materiales || [];
      await loadOverview();
    }
  } catch (error) {
    setError(error.message);
  } finally {
    state.loading = false;
    state.busy = false;
    render();
  }
}

app.addEventListener('click', async (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action || state.busy) return;
  if (action === 'demo') {
    await handleDemo();
    return;
  }
  if (action === 'refresh') {
    await refreshAll();
    return;
  }
  if (action === 'reset-demo') {
    await handleResetDemo();
    return;
  }
  if (action === 'logout') {
    await handleLogout();
  }
});

boot();
