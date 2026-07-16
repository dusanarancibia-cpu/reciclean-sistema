import {
  signInRomanero,
  signOutRomanero,
  getRomaneroSession,
  loadRomaneroLookups,
  listarPendientesPago,
  registrarPagoManual,
  adjuntarComprobante,
  fetchPagosByFactura,
  fetchComprobantesByFactura,
  fetchExpediente,
  fetchExpedienteEventos,
  uploadComprobante,
  createSignedStorageUrl
} from './lib/primer-release-api.js';

const app = document.querySelector('#app');

const state = {
  session: null,
  loading: true,
  busy: false,
  error: '',
  notice: '',
  lookups: { sucursales: [] },
  filters: {
    sucursal_id: '',
    texto: ''
  },
  pendientes: [],
  selected: null,
  pagos: [],
  comprobantes: [],
  expediente: null,
  eventos: [],
  form: {
    fecha_pago: new Date().toISOString().slice(0, 10),
    monto_pagado: '',
    medio_pago: 'transferencia',
    notas: ''
  }
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

function selectedTitle() {
  if (!state.selected) return 'Selecciona una factura';
  return `${state.selected.proveedor_nombre || 'Proveedor'} · ${money(state.selected.monto_total)}`;
}

function normalizedMontoPago() {
  if (state.form.monto_pagado !== '' && state.form.monto_pagado !== null) {
    return Number(state.form.monto_pagado);
  }
  return Number(state.selected?.monto_total || 0);
}

function filteredPendientes() {
  const needle = state.filters.texto.trim().toLowerCase();
  return state.pendientes.filter((item) => {
    if (state.filters.sucursal_id && item.sucursal_id !== state.filters.sucursal_id) return false;
    if (!needle) return true;
    return [
      item.proveedor_nombre,
      item.proveedor_rut,
      item.folio,
      item.expediente_codigo,
      item.cliente_nombre
    ].filter(Boolean).some((part) => String(part).toLowerCase().includes(needle));
  });
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

function renderLogin() {
  app.innerHTML = `
    <section class="shell shell-center">
      <div class="card auth-card">
        <div class="eyebrow">Primer Release · TT-06</div>
        <h1>Pagos MVP</h1>
        <p class="subtle">Ingreso con Supabase Auth para operar la cola de pagos del release.</p>
        <form id="login-form" class="stack">
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" placeholder="finanzas@reciclean.cl" required />
          </label>
          <label class="field">
            <span>Contrasena</span>
            <input type="password" name="password" placeholder="Tu clave" required />
          </label>
          <button class="btn btn-primary" type="submit"${state.busy ? ' disabled' : ''}>
            ${state.busy ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
        ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}
      </div>
    </section>
  `;
}

function renderApp() {
  const pendientes = filteredPendientes();
  const selected = state.selected;
  const fileSelected = document.querySelector('#comprobante_file')?.files?.[0];

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="eyebrow">Primer Release · Pagos</div>
          <h1>Pagos MVP</h1>
          <p class="subtle">Bandeja minima de pagos sobre la cola del release, con comprobante y trazabilidad.</p>
        </div>
        <div class="topbar-actions">
          <div class="session-pill">${escapeHtml(state.session?.user?.email || 'sesion activa')}</div>
          <button class="btn" data-action="refresh"${state.busy ? ' disabled' : ''}>Actualizar</button>
          <button class="btn" data-action="logout"${state.busy ? ' disabled' : ''}>Salir</button>
        </div>
      </header>

      ${state.notice ? `<div class="flash flash-ok">${escapeHtml(state.notice)}</div>` : ''}
      ${state.error ? `<div class="flash flash-error">${escapeHtml(state.error)}</div>` : ''}

      <div class="layout">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Cola de pago</h2>
              <p class="subtle">Pendientes listos para pago o ya pagados pendientes de conciliacion.</p>
            </div>
            <span class="status">${pendientes.length} visibles</span>
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
            <label class="field field-span-2">
              <span>Buscar</span>
              <input type="search" name="texto" value="${escapeHtml(state.filters.texto)}" placeholder="Proveedor, folio, expediente o cliente" />
            </label>
          </div>

          <div class="list">
            ${pendientes.length ? pendientes.map((item) => `
              <button class="list-item${selected?.factura_raw_id === item.factura_raw_id ? ' active' : ''}" type="button" data-factura-id="${item.factura_raw_id}">
                <div class="list-main">
                  <strong>${escapeHtml(item.proveedor_nombre || 'Proveedor')}</strong>
                  <span>${escapeHtml(item.folio || `Factura ${item.factura_raw_id}`)} · ${escapeHtml(item.cliente_nombre || 'Sin cliente')}</span>
                </div>
                <div class="list-side">
                  <span class="badge">${escapeHtml(item.estado_pago_release || 'pendiente_revision')}</span>
                  <strong>${money(item.monto_total)}</strong>
                </div>
              </button>
            `).join('') : '<div class="empty">No hay facturas en la cola con este filtro.</div>'}
          </div>
        </section>

        <aside class="stack">
          <section class="card">
            <div class="card-head">
              <div>
                <h2>Detalle seleccionado</h2>
                <p class="subtle">${escapeHtml(selectedTitle())}</p>
              </div>
            </div>
            ${selected ? `
              <div class="metric-grid">
                <div class="metric"><span>Factura raw</span><strong>${escapeHtml(String(selected.factura_raw_id))}</strong></div>
                <div class="metric"><span>Expediente</span><strong>${escapeHtml(selected.expediente_codigo || '—')}</strong></div>
                <div class="metric"><span>Sucursal</span><strong>${escapeHtml(selected.sucursal_nombre || selected.sucursal_id || '—')}</strong></div>
                <div class="metric"><span>Estado</span><strong>${escapeHtml(selected.estado_pago_release || '—')}</strong></div>
              </div>
            ` : '<div class="empty">Elige una fila para operar.</div>'}
          </section>

          <section class="card">
            <div class="card-head">
              <div>
                <h2>Registrar pago</h2>
                <p class="subtle">TT-03-07 y TT-03-08 sobre la factura seleccionada.</p>
              </div>
            </div>
            <div class="grid compact-grid">
              <label class="field">
                <span>Fecha pago</span>
                <input type="date" name="fecha_pago" value="${escapeHtml(state.form.fecha_pago)}"${selected ? '' : ' disabled'} />
              </label>
              <label class="field">
                <span>Monto pagado</span>
                <input type="number" name="monto_pagado" min="0" step="0.01" value="${escapeHtml(state.form.monto_pagado)}" placeholder="${selected ? Number(selected.monto_total || 0).toFixed(2) : '0.00'}"${selected ? '' : ' disabled'} />
              </label>
              <label class="field">
                <span>Medio</span>
                <select name="medio_pago"${selected ? '' : ' disabled'}>
                  <option value="transferencia"${state.form.medio_pago === 'transferencia' ? ' selected' : ''}>Transferencia</option>
                  <option value="cheque"${state.form.medio_pago === 'cheque' ? ' selected' : ''}>Cheque</option>
                  <option value="caja"${state.form.medio_pago === 'caja' ? ' selected' : ''}>Caja</option>
                  <option value="otro"${state.form.medio_pago === 'otro' ? ' selected' : ''}>Otro</option>
                </select>
              </label>
              <label class="field field-span-2">
                <span>Notas</span>
                <textarea name="notas" rows="3" placeholder="Referencia bancaria, aprobacion o contexto">${escapeHtml(state.form.notas)}</textarea>
              </label>
              <label class="field field-span-2">
                <span>Comprobante</span>
                <input id="comprobante_file" type="file" name="comprobante_file" accept=".pdf,.png,.jpg,.jpeg,.webp"${selected ? '' : ' disabled'} />
                <small class="hint">${fileSelected ? escapeHtml(fileSelected.name) : 'Opcional pero recomendado. Se guarda en bucket impulsa-documentos.'}</small>
              </label>
            </div>
            <div class="toolbar">
              <button class="btn btn-primary" data-action="registrar-pago"${selected && !state.busy ? '' : ' disabled'}>Registrar pago</button>
            </div>
          </section>
        </aside>
      </div>

      <div class="layout lower">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Pagos y comprobantes</h2>
              <p class="subtle">Ultimos registros asociados a la factura seleccionada.</p>
            </div>
          </div>
          <div class="subgrid">
            <div>
              <h3 class="subsection-title">Pagos</h3>
              ${state.pagos.length ? state.pagos.map((pago) => `
                <article class="mini-card">
                  <strong>${money(pago.monto_pagado)}</strong>
                  <span>${escapeHtml(pago.medio_pago || '—')} · ${escapeHtml(pago.estado || '—')}</span>
                  <small>${escapeHtml(dt(pago.created_at))}</small>
                </article>
              `).join('') : '<div class="empty">Sin pagos registrados todavia.</div>'}
            </div>
            <div>
              <h3 class="subsection-title">Comprobantes</h3>
              ${state.comprobantes.length ? state.comprobantes.map((row) => `
                <article class="mini-card">
                  <strong>${escapeHtml(row.nombre_archivo || 'archivo')}</strong>
                  <span>${escapeHtml(row.storage_path || 'sin path')}</span>
                  <small>${escapeHtml(dt(row.created_at))}</small>
                  ${row.storage_path ? `
                    <button class="btn" type="button" data-action="abrir-comprobante" data-storage-path="${escapeHtml(row.storage_path)}" data-storage-bucket="${escapeHtml(row.metadata?.bucket || 'impulsa-documentos')}">
                      Abrir comprobante
                    </button>
                  ` : ''}
                </article>
              `).join('') : '<div class="empty">Sin comprobantes asociados.</div>'}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Trazabilidad expediente</h2>
              <p class="subtle">Evolucion del expediente impactado por pagos.</p>
            </div>
          </div>
          ${state.expediente ? `
            <div class="metric-grid">
              <div class="metric"><span>Codigo</span><strong>${escapeHtml(state.expediente.expediente_codigo || '—')}</strong></div>
              <div class="metric"><span>Estado actual</span><strong>${escapeHtml(state.expediente.estado || '—')}</strong></div>
            </div>
          ` : '<div class="empty">Sin expediente seleccionado o vinculado.</div>'}
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
          ` : state.expediente ? '<div class="empty">Todavia no cargamos eventos para este expediente.</div>' : ''}
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
          <p>Cargando Pagos MVP...</p>
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

async function loadPendientes() {
  state.pendientes = await listarPendientesPago(null, 120);
  if (!state.selected || !state.pendientes.some((item) => item.factura_raw_id === state.selected.factura_raw_id)) {
    state.selected = state.pendientes[0] || null;
  } else {
    state.selected = state.pendientes.find((item) => item.factura_raw_id === state.selected.factura_raw_id) || null;
  }
}

async function loadDetail() {
  if (!state.selected) {
    state.pagos = [];
    state.comprobantes = [];
    state.expediente = null;
    state.eventos = [];
    return;
  }

  const loaders = [
    fetchPagosByFactura(state.selected.factura_raw_id),
    fetchComprobantesByFactura(state.selected.factura_raw_id)
  ];

  if (state.selected.expediente_id) {
    loaders.push(fetchExpediente(state.selected.expediente_id), fetchExpedienteEventos(state.selected.expediente_id));
  }

  const data = await Promise.all(loaders);
  state.pagos = data[0];
  state.comprobantes = data[1];
  state.expediente = state.selected.expediente_id ? data[2] : null;
  state.eventos = state.selected.expediente_id ? data[3] : [];
}

async function refreshAll() {
  state.busy = true;
  clearFlash();
  render();
  try {
    await loadPendientes();
    await loadDetail();
    setNotice('Cola de pagos actualizada');
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
    state.selected = null;
    state.pendientes = [];
    state.pagos = [];
    state.comprobantes = [];
    state.expediente = null;
    state.eventos = [];
    setNotice('Sesion cerrada');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleSelectFactura(facturaRawId) {
  const selected = state.pendientes.find((item) => String(item.factura_raw_id) === String(facturaRawId));
  if (!selected) return;
  state.selected = selected;
  if (!state.form.monto_pagado) {
    state.form.monto_pagado = String(Number(selected.monto_total || 0));
  }
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

async function handleRegistrarPago() {
  if (!state.selected) throw new Error('Selecciona una factura antes de registrar pago');
  const monto = normalizedMontoPago();
  const file = document.querySelector('#comprobante_file')?.files?.[0] || null;
  const mime = String(file?.type || '').toLowerCase();
  const allowedMime = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

  if (!state.form.fecha_pago) {
    throw new Error('Ingresa la fecha de pago');
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('Ingresa un monto pagado valido');
  }
  if (file && file.size > 15 * 1024 * 1024) {
    throw new Error('El comprobante supera el maximo de 15 MB');
  }
  if (file && mime && !allowedMime.includes(mime)) {
    throw new Error('El comprobante debe ser PDF, PNG, JPG o WEBP');
  }

  state.busy = true;
  clearFlash();
  render();
  try {
    const pago = await registrarPagoManual({
      p_factura_raw_id: state.selected.factura_raw_id,
      p_expediente_id: state.selected.expediente_id || null,
      p_fecha_pago: state.form.fecha_pago,
      p_monto_pagado: monto,
      p_medio_pago: state.form.medio_pago,
      p_pagado_por_email: state.session?.user?.email || null,
      p_notas: state.form.notas || null
    });

    if (file) {
      const upload = await uploadComprobante(file, pago.pago_id);
      await adjuntarComprobante({
        p_pago_id: pago.pago_id,
        p_factura_raw_id: state.selected.factura_raw_id,
        p_storage_path: upload.path,
        p_nombre_archivo: file.name,
        p_mime_type: file.type || 'application/octet-stream',
        p_size_bytes: file.size || null,
        p_hash_sha256: null,
        p_metadata: {
          origen_ui: 'pagos_mvp',
          bucket: upload.bucket
        }
      });
    }

    await loadPendientes();
    const updated = state.pendientes.find((item) => item.factura_raw_id === state.selected?.factura_raw_id) || state.selected;
    state.selected = updated;
    await loadDetail();
    state.form.monto_pagado = '';
    state.form.notas = '';
    const fileInput = document.querySelector('#comprobante_file');
    if (fileInput) fileInput.value = '';
    setNotice(file ? 'Pago y comprobante registrados correctamente' : 'Pago registrado correctamente');
  } catch (error) {
    setError(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

async function handleAbrirComprobante(storagePath, bucket) {
  state.busy = true;
  clearFlash();
  render();
  try {
    const signedUrl = await createSignedStorageUrl(bucket || 'impulsa-documentos', storagePath, 300);
    if (!signedUrl) {
      throw new Error('No se pudo generar el enlace del comprobante');
    }
    window.open(signedUrl, '_blank', 'noopener');
    setNotice('Comprobante abierto en una nueva pestana');
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
    state.session = await getRomaneroSession();
    if (state.session) {
      const lookups = await loadRomaneroLookups();
      state.lookups.sucursales = lookups.sucursales || [];
      await loadPendientes();
      if (state.selected && !state.form.monto_pagado) {
        state.form.monto_pagado = String(Number(state.selected.monto_total || 0));
      }
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
  if (name === 'texto') {
    state.filters.texto = value;
    render();
    return;
  }
  if (name in state.form) {
    state.form[name] = value;
  }
});

app.addEventListener('change', async (event) => {
  const { name, value } = event.target;
  if (name === 'sucursal_id') {
    state.filters.sucursal_id = value;
    render();
    return;
  }
  if (name in state.form) {
    state.form[name] = value;
  }
});

app.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const facturaId = event.target.closest('[data-factura-id]')?.dataset.facturaId;
  if (facturaId && !state.busy) {
    await handleSelectFactura(facturaId);
    return;
  }
  if (!action || state.busy) return;
  if (action === 'logout') await handleLogout();
  if (action === 'refresh') await refreshAll();
  if (action === 'registrar-pago') await handleRegistrarPago();
  if (action === 'abrir-comprobante') {
    await handleAbrirComprobante(event.target.dataset.storagePath, event.target.dataset.storageBucket);
  }
});

boot();
