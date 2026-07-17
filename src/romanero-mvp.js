import {
  signInRomanero,
  signOutRomanero,
  getRomaneroSession,
  loadRomaneroLookups,
  consultarPrecioVigente,
  createOrRecoverExpediente,
  registrarPesaje,
  fetchExpediente,
  fetchExpedienteEventos,
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
  lookups: {
    clientes: [],
    materiales: [],
    sucursales: []
  },
  filters: {
    cliente: '',
    material: ''
  },
  form: {
    cliente_id: '',
    sucursal_id: 'cerrillos',
    material_id: '',
    servicio_clase: 'compra_material',
    fecha_operacion: new Date().toISOString().slice(0, 10),
    peso_neto_kg: '',
    observaciones: ''
  },
  precio: null,
  expediente: null,
  eventos: [],
  lastPesaje: null
};

function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(value));
}

function dateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CL');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function setNotice(message) {
  state.notice = message;
  state.error = '';
}

function setError(message) {
  state.error = message;
  state.notice = '';
}

function clearFlash() {
  state.error = '';
  state.notice = '';
}

function selectedCliente() {
  return state.lookups.clientes.find((item) => item.cliente_id === state.form.cliente_id) || null;
}

function selectedMaterial() {
  return state.lookups.materiales.find((item) => item.material_id === state.form.material_id) || null;
}

function estimatedMonto() {
  const peso = Number(state.form.peso_neto_kg || 0);
  const precio = Number(state.precio?.precio_compra_clp || 0);
  if (peso <= 0 || precio <= 0) return null;
  return peso * precio;
}

function filteredClientes() {
  const needle = state.filters.cliente.trim().toLowerCase();
  if (!needle) return state.lookups.clientes;
  return state.lookups.clientes.filter((item) =>
    [item.razon_social, item.rut, item.cliente_id]
      .filter(Boolean)
      .some((part) => String(part).toLowerCase().includes(needle))
  );
}

function filteredMateriales() {
  const needle = state.filters.material.trim().toLowerCase();
  if (!needle) return state.lookups.materiales;
  return state.lookups.materiales.filter((item) =>
    [item.nombre, item.material_id]
      .filter(Boolean)
      .some((part) => String(part).toLowerCase().includes(needle))
  );
}

function renderLogin() {
  app.innerHTML = `
    <section class="shell shell-center">
      <div class="card auth-card">
        <div class="eyebrow">Primer Release · TT-04</div>
        <h1>Romanero MVP</h1>
        <p class="subtle">Ingreso con Supabase Auth para operar expediente, precio vigente y pesaje unico. Si no tienes claves todavia, puedes abrir el flujo en modo demo.</p>
        <form id="login-form" class="stack">
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="romanero@reciclean.cl" required />
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
  const cliente = selectedCliente();
  const material = selectedMaterial();
  const clientes = filteredClientes();
  const materiales = filteredMateriales();

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">Primer Release · Romanero</div>
          <h1>Romanero MVP</h1>
          <p class="subtle">Crea o recupera expediente, consulta precio canonico y registra el pesaje unico.</p>
        </div>
        <div class="topbar-actions">
          ${state.demo ? '<div class="session-pill">Modo demo</div>' : ''}
          <div class="session-pill">${escapeHtml(state.session?.user?.email || 'sesion activa')}</div>
          ${state.demo ? '<button class="btn" data-action="reset-demo">Reiniciar demo</button>' : ''}
          <button class="btn" data-action="logout"${state.busy ? ' disabled' : ''}>Salir</button>
        </div>
      </header>

      ${state.demo ? '<div class="flash flash-ok">Modo demo activo. Este flujo usa datos locales persistidos en tu navegador para que puedas revisar Romanero, Pagos y Supervisión sin credenciales.</div>' : ''}
      ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
      ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}

      <div class="layout">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>Captura</h2>
              <p class="subtle">TT-04-02, TT-04-03 y TT-04-04 sobre los RPCs validados.</p>
            </div>
            <span class="status">${state.busy ? 'Procesando' : 'Listo'}</span>
          </div>

          <div class="grid">
            <label class="field field-span-2">
              <span>Buscar cliente</span>
              <input type="search" name="filter_cliente" value="${escapeHtml(state.filters.cliente)}" placeholder="Razon social, RUT o cliente_id" />
            </label>
            <label class="field field-span-2">
              <span>Cliente</span>
              <select name="cliente_id">
                <option value="">Selecciona cliente</option>
                ${clientes.map((item) => `
                  <option value="${escapeHtml(item.cliente_id)}"${item.cliente_id === state.form.cliente_id ? ' selected' : ''}>
                    ${escapeHtml(item.razon_social)} · ${escapeHtml(item.rut || item.cliente_id)}
                  </option>
                `).join('')}
              </select>
            </label>

            <label class="field">
              <span>Sucursal</span>
              <select name="sucursal_id">
                ${state.lookups.sucursales.map((item) => `
                  <option value="${escapeHtml(item.sucursal_id)}"${item.sucursal_id === state.form.sucursal_id ? ' selected' : ''}>
                    ${escapeHtml(item.nombre)}
                  </option>
                `).join('')}
              </select>
            </label>
            <label class="field">
              <span>Fecha operacion</span>
              <input type="date" name="fecha_operacion" value="${escapeHtml(state.form.fecha_operacion)}" />
            </label>

            <label class="field field-span-2">
              <span>Buscar material</span>
              <input type="search" name="filter_material" value="${escapeHtml(state.filters.material)}" placeholder="Nombre o material_id" />
            </label>
            <label class="field field-span-2">
              <span>Material</span>
              <select name="material_id">
                <option value="">Selecciona material</option>
                ${materiales.map((item) => `
                  <option value="${escapeHtml(item.material_id)}"${item.material_id === state.form.material_id ? ' selected' : ''}>
                    ${escapeHtml(item.nombre)} · ${escapeHtml(item.material_id)}
                  </option>
                `).join('')}
              </select>
            </label>

            <label class="field">
              <span>Servicio</span>
              <select name="servicio_clase">
                <option value="compra_material"${state.form.servicio_clase === 'compra_material' ? ' selected' : ''}>Compra material</option>
                <option value="servicio_operativo"${state.form.servicio_clase === 'servicio_operativo' ? ' selected' : ''}>Servicio operativo</option>
                <option value="mantencion"${state.form.servicio_clase === 'mantencion' ? ' selected' : ''}>Mantencion</option>
                <option value="reparacion"${state.form.servicio_clase === 'reparacion' ? ' selected' : ''}>Reparacion</option>
                <option value="otro"${state.form.servicio_clase === 'otro' ? ' selected' : ''}>Otro</option>
              </select>
            </label>
            <label class="field">
              <span>Peso neto kg</span>
              <input type="number" min="0" step="0.01" name="peso_neto_kg" value="${escapeHtml(state.form.peso_neto_kg)}" placeholder="1240.50" />
            </label>

            <label class="field field-span-2">
              <span>Observaciones</span>
              <textarea name="observaciones" rows="3" placeholder="Notas de recepcion, calidad o contexto operativo">${escapeHtml(state.form.observaciones)}</textarea>
            </label>
          </div>

          <div class="toolbar">
            <button class="btn" data-action="precio"${state.busy ? ' disabled' : ''}>Consultar precio vigente</button>
            <button class="btn" data-action="expediente"${state.busy ? ' disabled' : ''}>Crear o recuperar expediente</button>
            <button class="btn btn-primary" data-action="pesaje"${state.busy ? ' disabled' : ''}>Registrar pesaje</button>
          </div>
        </article>

        <aside class="stack">
          <section class="card">
            <div class="card-head">
              <div>
                <h2>Precio vigente</h2>
                <p class="subtle">Fuente canonica del release.</p>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric">
                <span>Material</span>
                <strong>${escapeHtml(material?.nombre || '—')}</strong>
              </div>
              <div class="metric">
                <span>Compra</span>
                <strong>${money(state.precio?.precio_compra_clp)}</strong>
              </div>
              <div class="metric">
                <span>Venta</span>
                <strong>${money(state.precio?.precio_venta_clp)}</strong>
              </div>
              <div class="metric">
                <span>Vigencia</span>
                <strong>${escapeHtml(state.precio?.vigencia_desde || '—')}</strong>
              </div>
              <div class="metric">
                <span>Estimado</span>
                <strong>${money(estimatedMonto())}</strong>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Expediente</h2>
                <p class="subtle">TT-04-05 visible para Romanero.</p>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric">
                <span>Codigo</span>
                <strong>${escapeHtml(state.expediente?.expediente_codigo || '—')}</strong>
              </div>
              <div class="metric">
                <span>Estado</span>
                <strong>${escapeHtml(state.expediente?.estado || '—')}</strong>
              </div>
              <div class="metric">
                <span>Cliente</span>
                <strong>${escapeHtml(cliente?.razon_social || state.expediente?.cliente_id || '—')}</strong>
              </div>
              <div class="metric">
                <span>Ultimo pesaje</span>
                <strong>${state.lastPesaje ? `${money(state.lastPesaje.monto_total)} · ${Number(state.lastPesaje.precio_unitario).toFixed(2)}` : '—'}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Trazabilidad</h2>
            <p class="subtle">Eventos del expediente operacional del release.</p>
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
                <div class="timeline-date">${escapeHtml(dateTime(evento.created_at))}</div>
                <pre>${escapeHtml(JSON.stringify(evento.payload || {}, null, 2))}</pre>
              </article>
            `).join('')}
          </div>
        ` : '<div class="empty">Todavia no hay eventos para este expediente.</div>'}
      </section>
    </section>
  `;
}

function render() {
  if (state.loading) {
    app.innerHTML = `
      <section class="shell shell-center">
        <div class="card loading-card">
          <div class="loader"></div>
          <p>Cargando Romanero MVP...</p>
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

async function refreshExpediente(expedienteId) {
  const [expediente, eventos] = await Promise.all([
    fetchExpediente(expedienteId),
    fetchExpedienteEventos(expedienteId)
  ]);
  state.expediente = expediente;
  state.eventos = eventos;
}

function currentPayload() {
  return {
    p_canal_origen: 'romanero',
    p_cliente_id: state.form.cliente_id,
    p_sucursal_id: state.form.sucursal_id,
    p_servicio_clase: state.form.servicio_clase,
    p_fecha_operacion: state.form.fecha_operacion,
    p_material_id: state.form.material_id || null,
    p_oportunidad_id: null,
    p_handoff_payload: {
      origen_ui: 'romanero_mvp',
      observaciones: state.form.observaciones || null
    }
  };
}

function validateBaseForm() {
  if (!state.form.cliente_id) {
    throw new Error('Selecciona un cliente antes de continuar');
  }
  if (!state.form.sucursal_id) {
    throw new Error('Selecciona una sucursal');
  }
  if (!state.form.material_id) {
    throw new Error('Selecciona un material');
  }
  if (!state.form.fecha_operacion) {
    throw new Error('Ingresa la fecha de operacion');
  }
}

async function handleConsultarPrecio() {
  validateBaseForm();
  state.busy = true;
  clearFlash();
  render();
  try {
    state.precio = await consultarPrecioVigente(state.form.material_id, state.form.sucursal_id);
    setNotice('Precio vigente consultado desde la fuente canonica');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleCreateOrRecover() {
  validateBaseForm();
  state.busy = true;
  clearFlash();
  render();
  try {
    const result = await createOrRecoverExpediente(currentPayload());
    await refreshExpediente(result.expediente_id);
    setNotice(result.created ? 'Expediente creado correctamente' : 'Se recupero un expediente ya abierto');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function ensureExpediente() {
  if (state.expediente?.expediente_id) return state.expediente.expediente_id;
  const result = await createOrRecoverExpediente(currentPayload());
  await refreshExpediente(result.expediente_id);
  return result.expediente_id;
}

async function handleRegistrarPesaje() {
  validateBaseForm();
  if (!state.form.peso_neto_kg || Number(state.form.peso_neto_kg) <= 0) {
    throw new Error('Ingresa un peso neto valido');
  }

  state.busy = true;
  clearFlash();
  render();
  try {
    if (!state.precio) {
      state.precio = await consultarPrecioVigente(state.form.material_id, state.form.sucursal_id);
    }
    const expedienteId = await ensureExpediente();
    state.lastPesaje = await registrarPesaje({
      p_expediente_id: expedienteId,
      p_cliente_id: state.form.cliente_id,
      p_material_id: state.form.material_id,
      p_sucursal_id: state.form.sucursal_id,
      p_peso_neto_kg: Number(state.form.peso_neto_kg),
      p_origen_captura: 'romanero_manual',
      p_capturado_por: state.session?.user?.email || null,
      p_precio_unitario: state.precio?.precio_compra_clp || null,
      p_monto_total: estimatedMonto(),
      p_folio: null,
      p_observaciones: state.form.observaciones || null
    });
    await refreshExpediente(expedienteId);
    setNotice('Pesaje registrado y anclado al expediente operacional');
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
    state.expediente = null;
    state.eventos = [];
    state.lastPesaje = null;
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

async function boot() {
  state.loading = true;
  render();
  try {
    state.demo = isPrimerReleaseDemoEnabled();
    state.session = await getRomaneroSession();
    if (state.session) {
      state.lookups = await loadRomaneroLookups();
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
  if (name === 'filter_cliente') {
    state.filters.cliente = value;
    render();
    return;
  }
  if (name === 'filter_material') {
    state.filters.material = value;
    render();
    return;
  }
  if (name in state.form) {
    state.form[name] = value;
  }
});

app.addEventListener('change', (event) => {
  const { name, value } = event.target;
  if (name in state.form) {
    state.form[name] = value;
    if (name === 'cliente_id' || name === 'material_id' || name === 'sucursal_id') {
      if (name === 'cliente_id') {
        const cliente = selectedCliente();
        const suggestedSucursal = cliente?.sucursal_principal;
        if (suggestedSucursal && state.lookups.sucursales.some((item) => item.sucursal_id === suggestedSucursal)) {
          state.form.sucursal_id = suggestedSucursal;
        }
      }
      state.expediente = null;
      state.eventos = [];
      state.lastPesaje = null;
      if (name === 'material_id' || name === 'sucursal_id') {
        state.precio = null;
      }
    }
    render();
  }
});

app.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  if (!action || state.busy) return;

  try {
    if (action === 'demo') await handleDemoMode();
    if (action === 'reset-demo') await handleResetDemo();
    if (action === 'logout') await handleLogout();
    if (action === 'precio') await handleConsultarPrecio();
    if (action === 'expediente') await handleCreateOrRecover();
    if (action === 'pesaje') await handleRegistrarPesaje();
  } catch (error) {
    state.busy = false;
    setError(error.message);
    render();
  }
});

boot();
