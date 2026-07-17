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
  formatMoney,
  healthLabel,
  healthTone,
  pendingOldestLabel,
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
  lookups: { sucursales: [] },
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
      detail: 'Revisar alertas, cola financiera y actividad reciente del release.',
      href: '/supervision'
    },
    {
      title: 'Revisar Pagos',
      detail: overview.byState.pendiente_pago
        ? `${overview.byState.pendiente_pago} expedientes siguen en cola de pago.`
        : 'La cola de pago está sin pendientes visibles.',
      href: '/pagos'
    },
    {
      title: 'Ver Romanero',
      detail: 'Mantener visible el origen operativo del expediente y su contingencia.',
      href: '/romanero'
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
            <p class="subtle">Portada ejecutiva para revisar el release en Vercel, abrir el demo y entrar rápido a los puntos operativos.</p>
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
          <div class="metric"><span>Ruta recomendada</span><strong>/romanero?demo=1</strong></div>
          <div class="metric"><span>Centro de control</span><strong>/supervision</strong></div>
          <div class="metric"><span>Build visible</span><strong>${escapeHtml(state.version?.sha || 'sin dato')}</strong></div>
        </div>
      </section>

      <section class="grid-3">
        <a class="link-card" href="/romanero?demo=1">
          <div class="kicker">Demo</div>
          <h2>Encender flujo demo</h2>
          <p class="subtle">Activa el estado compartido y recorre Romanero, Pagos y Centro de Control sin credenciales.</p>
        </a>
        <a class="link-card" href="/supervision">
          <div class="kicker">Control</div>
          <h2>Centro de Control</h2>
          <p class="subtle">Lee salud operativa, alertas, radar por sucursal y actividad reciente.</p>
        </a>
        <a class="link-card" href="/pagos">
          <div class="kicker">Finanzas</div>
          <h2>Pagos MVP</h2>
          <p class="subtle">Ver cola de pago, registrar pago manual y revisar comprobantes.</p>
        </a>
      </section>

      <section class="grid-2">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Qué revisar primero</h2>
              <p class="subtle">Secuencia mínima para evaluar el release desde un preview.</p>
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
              <p class="subtle">Se puede revisar sin claves reales mediante demo persistente.</p>
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

  app.innerHTML = `
    <section class="shell">
      <section class="card hero hero-${tone}">
        <div class="topbar">
          <div>
            <div class="eyebrow">Primer Release · Hub Ejecutivo</div>
            <h1>Primer Release Hub</h1>
            <p class="subtle">${healthLabel(overview)} · build ${escapeHtml(versionLabel())}.</p>
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
          <div class="metric"><span>Expedientes</span><strong>${overview.byState.total}</strong></div>
          <div class="metric"><span>Cola de pago</span><strong>${overview.byState.pendiente_pago}</strong></div>
          <div class="metric"><span>Por conciliar</span><strong>${overview.byState.pagado_pendiente_conciliacion}</strong></div>
          <div class="metric"><span>Monto pendiente</span><strong>${formatMoney(overview.montoPendiente)}</strong></div>
        </div>
      </section>

      <section class="grid-4">
        <article class="stat-card">
          <span>Alertas críticas</span>
          <strong>${overview.alertCounts.critical}</strong>
        </article>
        <article class="stat-card">
          <span>Pagos sin respaldo</span>
          <strong>${overview.pagosSinComprobante}</strong>
        </article>
        <article class="stat-card">
          <span>Activos sin pesaje</span>
          <strong>${overview.expedientesSinPesaje}</strong>
        </article>
        <article class="stat-card">
          <span>Pago más antiguo</span>
          <strong>${pendingOldestLabel(overview.oldestPendingHours)}</strong>
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
              <p class="subtle">Alertas, radar por sucursal y lectura ejecutiva del release.</p>
            </a>
            <a class="link-card" href="/pagos">
              <div class="kicker">Finanzas</div>
              <h3>Pagos MVP</h3>
              <p class="subtle">${overview.byState.pendiente_pago} expedientes en cola y ${overview.byState.pagado_pendiente_conciliacion} por conciliar.</p>
            </a>
            <a class="link-card" href="/romanero">
              <div class="kicker">Operación</div>
              <h3>Romanero MVP</h3>
              <p class="subtle">Punto de entrada operativo o de contingencia del expediente.</p>
            </a>
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Alertas prioritarias</h2>
              <p class="subtle">Lo que más conviene atacar primero.</p>
            </div>
          </div>
          <div class="list">
            ${overview.alerts.length ? overview.alerts.slice(0, 4).map((alert) => `
              <article class="item">
                <div class="item-row">
                  <strong>${escapeHtml(alert.title)}</strong>
                  <span class="badge ${alert.severity === 'critical' ? 'badge-critical' : 'badge-warning'}">${severityLabel(alert.severity)}</span>
                </div>
                <span>${escapeHtml(alert.detail)}</span>
              </article>
            `).join('') : '<div class="empty">No hay alertas activas. El release se ve estable.</div>'}
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <div>
              <h2>Sucursales calientes</h2>
              <p class="subtle">Dónde está hoy la presión operativa.</p>
            </div>
          </div>
          <div class="list">
            ${overview.sucursales.length ? overview.sucursales.map((item) => `
              <article class="item">
                <strong>${escapeHtml(sucursalName(item.sucursal_id))}</strong>
                <span>${item.total} expedientes · ${item.pendiente_pago} en cola · ${item.pagado_pendiente_conciliacion} por conciliar</span>
                <small>Monto pendiente ${formatMoney(item.montoPendiente)}</small>
              </article>
            `).join('') : '<div class="empty">Todavía no hay presión visible por sucursal.</div>'}
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
