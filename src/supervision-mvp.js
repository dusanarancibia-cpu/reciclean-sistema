import {
  signInRomanero,
  signOutRomanero,
  getRomaneroSession,
  loadRomaneroLookups,
  listExpedientesRelease,
  fetchExpedienteEventos,
  fetchPesajeByExpediente,
  fetchFacturasByExpediente,
  fetchPagosByExpediente,
  enablePrimerReleaseDemo,
  isPrimerReleaseDemoEnabled,
  resetPrimerReleaseDemo
} from './lib/primer-release-api.js';

const app = document.querySelector('#app');

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
  expedientes: [],
  selected: null,
  eventos: [],
  pesaje: null,
  facturas: [],
  pagos: []
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

function summary() {
  const base = {
    total: state.expedientes.length,
    en_proceso: 0,
    pendiente_factura: 0,
    pendiente_pago: 0,
    pagado_pendiente_conciliacion: 0,
    cerrado: 0
  };
  for (const item of state.expedientes) {
    if (item.estado in base) {
      base[item.estado] += 1;
    }
  }
  return base;
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
      item.servicio_clase
    ].filter(Boolean).some((part) => String(part).toLowerCase().includes(needle));
  });
}

function renderLogin() {
  app.innerHTML = `
    <section class="shell shell-center">
      <div class="card auth-card">
        <div class="eyebrow">Primer Release · Supervisión</div>
        <h1>Supervisión MVP</h1>
        <p class="subtle">Ingreso con Supabase Auth para revisar el flujo vivo del release. Si todavia no tienes acceso, puedes entrar en modo demo operativo.</p>
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

function renderApp() {
  const items = filteredExpedientes();
  const sums = summary();
  const selected = state.selected;

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">Primer Release · Supervisión</div>
          <h1>Supervisión MVP</h1>
          <p class="subtle">Vista mínima del flujo Romanero → expediente → pago → retorno automático.</p>
        </div>
        <div class="topbar-actions">
          <a class="btn" href="/romanero.html" target="_blank" rel="noopener">Romanero</a>
          <a class="btn" href="/pagos.html" target="_blank" rel="noopener">Pagos</a>
          ${state.demo ? '<div class="session-pill">Modo demo</div>' : ''}
          <button class="btn" data-action="refresh"${state.busy ? ' disabled' : ''}>Actualizar</button>
          ${state.demo ? '<button class="btn" data-action="reset-demo">Reiniciar demo</button>' : ''}
          <button class="btn" data-action="logout"${state.busy ? ' disabled' : ''}>Salir</button>
        </div>
      </header>

      ${state.demo ? '<div class="flash flash-ok">Modo demo activo. Aqui puedes revisar el flujo compartido con Romanero y Pagos sin necesitar credenciales reales.</div>' : ''}
      ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
      ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}

      <section class="stats">
        <article class="stat-card"><span>Total</span><strong>${sums.total}</strong></article>
        <article class="stat-card"><span>En proceso</span><strong>${sums.en_proceso}</strong></article>
        <article class="stat-card"><span>Pendiente factura</span><strong>${sums.pendiente_factura}</strong></article>
        <article class="stat-card"><span>Pendiente pago</span><strong>${sums.pendiente_pago}</strong></article>
        <article class="stat-card"><span>Pagado pendiente conciliacion</span><strong>${sums.pagado_pendiente_conciliacion}</strong></article>
        <article class="stat-card"><span>Cerrado</span><strong>${sums.cerrado}</strong></article>
      </section>

      <div class="layout">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Expedientes</h2>
              <p class="subtle">Filtro rápido para supervisar los estados operativos del release.</p>
            </div>
            <span class="status">${items.length} visibles</span>
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
                  <small>${escapeHtml(item.fecha_operacion || '—')}</small>
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
              </div>
            ` : '<div class="empty">Elige un expediente para revisar el flujo.</div>'}
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Pesaje y pagos</h2>
                <p class="subtle">Puntos críticos del flujo completo.</p>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric"><span>Pesaje</span><strong>${state.pesaje ? `${Number(state.pesaje.peso_neto_kg || 0).toFixed(2)} kg` : '—'}</strong></div>
              <div class="metric"><span>Monto estimado</span><strong>${state.pesaje ? money(state.pesaje.monto_total) : '—'}</strong></div>
              <div class="metric"><span>Facturas</span><strong>${state.facturas.length}</strong></div>
              <div class="metric"><span>Pagos</span><strong>${state.pagos.length}</strong></div>
            </div>
          </section>
        </aside>
      </div>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Facturas y pagos</h2>
              <p class="subtle">Lectura rápida del tramo financiero del expediente.</p>
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
              <h3 class="subsection-title">Pagos</h3>
              ${state.pagos.length ? state.pagos.map((pago) => `
                <article class="mini-card">
                  <strong>${money(pago.monto_pagado)}</strong>
                  <span>${escapeHtml(pago.medio_pago || '—')} · ${escapeHtml(pago.estado || '—')}</span>
                  <small>${escapeHtml(dt(pago.created_at))}</small>
                </article>
              `).join('') : '<div class="empty">Sin pagos registrados en este expediente.</div>'}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Trazabilidad</h2>
              <p class="subtle">Eventos del expediente en orden reciente.</p>
            </div>
          </div>
          ${state.eventos.length ? `
            <div class="timeline">
              ${state.eventos.map((evento) => `
                <article class="timeline-item">
                  <div class="timeline-meta">
                    <strong>${escapeHtml(evento.tipo_evento)}</strong>
                    <span>${escapeHtml(evento.actor || 'sistema')}</span>
                  </div>
                  <div class="timeline-date">${escapeHtml(dt(evento.created_at))}</div>
                </article>
              `).join('')}
            </div>
          ` : '<div class="empty">Todavia no hay eventos para mostrar.</div>'}
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
          <p>Cargando Supervisión MVP...</p>
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

async function loadExpedientes() {
  state.expedientes = await listExpedientesRelease(null, 180);
  if (!state.selected || !state.expedientes.some((item) => item.expediente_id === state.selected.expediente_id)) {
    state.selected = state.expedientes[0] || null;
  } else {
    state.selected = state.expedientes.find((item) => item.expediente_id === state.selected.expediente_id) || null;
  }
}

async function loadDetail() {
  if (!state.selected) {
    state.eventos = [];
    state.pesaje = null;
    state.facturas = [];
    state.pagos = [];
    return;
  }

  const [eventos, pesaje, facturas, pagos] = await Promise.all([
    fetchExpedienteEventos(state.selected.expediente_id),
    fetchPesajeByExpediente(state.selected.expediente_id),
    fetchFacturasByExpediente(state.selected.expediente_id),
    fetchPagosByExpediente(state.selected.expediente_id)
  ]);

  state.eventos = eventos;
  state.pesaje = pesaje;
  state.facturas = facturas;
  state.pagos = pagos;
}

async function refreshAll() {
  state.busy = true;
  clearFlash();
  render();
  try {
    await loadExpedientes();
    await loadDetail();
    setNotice('Supervisión actualizada');
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
    state.selected = null;
    state.expedientes = [];
    state.eventos = [];
    state.pesaje = null;
    state.facturas = [];
    state.pagos = [];
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

async function handleSelectExpediente(expedienteId) {
  const found = state.expedientes.find((item) => String(item.expediente_id) === String(expedienteId));
  if (!found) return;
  state.selected = found;
  state.busy = true;
  clearFlash();
  render();
  try {
    await loadDetail();
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
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
      await loadExpedientes();
      await loadDetail();
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
    state.filters[name] = value;
    render();
  }
});

app.addEventListener('change', (event) => {
  const { name, value } = event.target;
  if (name in state.filters) {
    state.filters[name] = value;
    render();
  }
});

app.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const expedienteId = event.target.closest('[data-expediente-id]')?.dataset.expedienteId;
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
  if (action === 'logout') await handleLogout();
  if (action === 'refresh') await refreshAll();
});

boot();
